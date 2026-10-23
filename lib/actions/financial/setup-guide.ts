"use server";

import { sql } from "@/lib/db";
import { currentMonth } from "@/lib/utils";
import { requireSpace } from "@/lib/spaces/context";
import { revalidateSpace } from "@/lib/spaces/financial";
import type { GuideData } from "@/lib/actions/setup-guide";

/** Run only after resolving the explicit space. Step progress is shared by all members. */
export async function getOrInitSetupGuideData(spaceId: string): Promise<GuideData> {
  await requireSpace(spaceId);
  const month = currentMonth();
  const rows = await sql`WITH progress AS (
    SELECT EXISTS(SELECT 1 FROM incomes WHERE space_id=${spaceId} AND is_active) AS income,
      EXISTS(SELECT 1 FROM expenses WHERE space_id=${spaceId} AND is_active) AS expense,
      EXISTS(SELECT 1 FROM monthly_expenses WHERE space_id=${spaceId} AND month=${month}) AS generate,
      EXISTS(SELECT 1 FROM monthly_expenses WHERE space_id=${spaceId} AND month=${month} AND status='PAID') AS pay
  ), initialized AS (
    INSERT INTO space_setup_guide(space_id)
    SELECT ${spaceId} FROM progress WHERE NOT (income AND expense AND generate AND pay)
    ON CONFLICT(space_id) DO NOTHING RETURNING space_id,dismissed_at,completed_at
  ) SELECT p.*,
    COALESCE(g.space_id,i.space_id) IS NOT NULL AS has_guide,
    g.dismissed_at,g.completed_at
    FROM progress p LEFT JOIN space_setup_guide g ON g.space_id=${spaceId}
    LEFT JOIN initialized i ON true`;
  const row = rows[0];
  const stepsCompletion = { income: Boolean(row.income), expense: Boolean(row.expense),
    generate: Boolean(row.generate), pay: Boolean(row.pay) };
  const isCompleted = Object.values(stepsCompletion).every(Boolean);
  return { stepsCompletion, isCompleted, isVisible: !row.dismissed_at && (Boolean(row.has_guide) || !isCompleted) };
}

export async function completeSetupGuide(spaceId: string): Promise<void> {
  await requireSpace(spaceId);
  await sql`UPDATE space_setup_guide SET completed_at=now() WHERE space_id=${spaceId} AND completed_at IS NULL`;
  revalidateSpace(spaceId);
}

export async function dismissSetupGuide(spaceId: string): Promise<void> {
  await requireSpace(spaceId);
  await sql`UPDATE space_setup_guide SET dismissed_at=now() WHERE space_id=${spaceId} AND dismissed_at IS NULL`;
  revalidateSpace(spaceId);
}

export async function resetSetupGuide(spaceId: string): Promise<void> {
  await requireSpace(spaceId);
  await sql`INSERT INTO space_setup_guide(space_id,reset_at) VALUES(${spaceId},now())
    ON CONFLICT(space_id) DO UPDATE SET reset_at=now(),completed_at=NULL,dismissed_at=NULL`;
  revalidateSpace(spaceId);
}
