"use server";

import { revalidatePath } from "next/cache";
import { sql } from "@/lib/db";
import { requireIdentity } from "@/lib/spaces/context";
import { validateInput } from "@/lib/schemas/validate";
import { AccountSettingsPatch, type AccountSettings } from "@/lib/spaces/settings";
import type { z } from "zod";

export async function getAccountSettings(): Promise<AccountSettings> {
  const { id } = await requireIdentity();
  const rows = await sql`INSERT INTO settings(user_id)
    VALUES(${id}) ON CONFLICT(user_id) DO UPDATE SET user_id=settings.user_id
    RETURNING email,phone,notify_push,notify_email,notify_sms`;
  return rows[0] as AccountSettings;
}

export async function updateAccountSettings(input: z.infer<typeof AccountSettingsPatch>): Promise<AccountSettings> {
  const data = validateInput(AccountSettingsPatch, input);
  const { id } = await requireIdentity();
  const rows = await sql`INSERT INTO settings(user_id,email,phone,notify_push,notify_email,notify_sms)
    VALUES(${id},${data.email ?? null},${data.phone ?? null},${data.notify_push ?? true},${data.notify_email ?? false},${data.notify_sms ?? false})
    ON CONFLICT(user_id) DO UPDATE SET
      email=CASE WHEN ${data.email !== undefined} THEN EXCLUDED.email ELSE settings.email END,
      phone=CASE WHEN ${data.phone !== undefined} THEN EXCLUDED.phone ELSE settings.phone END,
      notify_push=CASE WHEN ${data.notify_push !== undefined} THEN EXCLUDED.notify_push ELSE settings.notify_push END,
      notify_email=CASE WHEN ${data.notify_email !== undefined} THEN EXCLUDED.notify_email ELSE settings.notify_email END,
      notify_sms=CASE WHEN ${data.notify_sms !== undefined} THEN EXCLUDED.notify_sms ELSE settings.notify_sms END,
      updated_at=now()
    RETURNING email,phone,notify_push,notify_email,notify_sms`;
  revalidatePath("/espaces", "layout");
  return rows[0] as AccountSettings;
}
