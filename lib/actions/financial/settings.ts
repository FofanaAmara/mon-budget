"use server";

import { sql } from "@/lib/db";
import { validateInput } from "@/lib/schemas/validate";
import { requireSpace } from "@/lib/spaces/context";
import { requireFinancialRecord, revalidateSpace } from "@/lib/spaces/financial";
import { SpaceSettingsPatch, type SpaceSettings } from "@/lib/spaces/settings";

export async function getSettings(spaceId: string): Promise<SpaceSettings> {
  await requireSpace(spaceId);
  const rows = await sql`SELECT space_id,default_currency,default_reminder_offsets
    FROM space_settings WHERE space_id=${spaceId}`;
  return requireFinancialRecord(rows[0]) as SpaceSettings;
}

export async function updateSettings(spaceId: string, input: {default_currency?:string;default_reminder_offsets?:number[]}): Promise<SpaceSettings> {
  const data = validateInput(SpaceSettingsPatch, input);
  await requireSpace(spaceId);
  const offsets = data.default_reminder_offsets;
  // PostgreSQL array literal, from validated integers only. JSON [1,3] is not integer[] input.
  const array = offsets === undefined ? null : `{${offsets.join(",")}}`;
  const rows = await sql`UPDATE space_settings SET
    default_currency=COALESCE(${data.default_currency ?? null},default_currency),
    default_reminder_offsets=COALESCE(${array}::integer[],default_reminder_offsets),updated_at=now()
    WHERE space_id=${spaceId} RETURNING space_id,default_currency,default_reminder_offsets`;
  const settings = requireFinancialRecord(rows[0]) as SpaceSettings;
  revalidateSpace(spaceId);
  return settings;
}
