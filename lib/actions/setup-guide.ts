"use server";

import { revalidatePath } from "next/cache";
import { sql } from "@/lib/db";
import { auth } from "@/lib/auth/server";
import { requireAuth } from "@/lib/auth/helpers";
import { currentMonth } from "@/lib/utils";

// ── Types ────────────────────────────────────────────────────────────────────

export type GuideStepCompletion = {
  income: boolean;
  expense: boolean;
  generate: boolean;
  pay: boolean;
};

export type GuideData = {
  stepsCompletion: GuideStepCompletion;
  isVisible: boolean;
  isCompleted: boolean;
};

// ── Query (read + conditional insert) ────────────────────────────────────────

/**
 * Fetches the setup guide state for the current user.
 * Creates a guide row if the user is new (at least 1 step incomplete + no row).
 * The INSERT side-effect is idempotent (ON CONFLICT DO NOTHING) and justified
 * by the need to distinguish "existing user before the guide feature" from
 * "new user who should see the guide". See design.md section 7.
 *
 * Returns null if the user is not authenticated (safe for root layout usage).
 */
export async function getOrInitSetupGuideData(): Promise<GuideData | null> {
  // Safe auth check — no throw in root layout
  const { data: session } = await auth.getSession();
  if (!session?.user?.id) return null;

  const userId = session.user.id;
  const month = currentMonth();

  const rows = await sql`
    SELECT
      EXISTS(
        SELECT 1 FROM incomes
        WHERE user_id = ${userId} AND is_active = true
      ) AS has_income,

      EXISTS(
        SELECT 1 FROM expenses
        WHERE user_id = ${userId} AND is_active = true
      ) AS has_expense,

      EXISTS(
        SELECT 1 FROM monthly_expenses
        WHERE user_id = ${userId} AND month = ${month}
      ) AS has_generated,

      EXISTS(
        SELECT 1 FROM monthly_expenses
        WHERE user_id = ${userId} AND month = ${month} AND status = 'PAID'
      ) AS has_paid,

      (SELECT dismissed_at FROM setup_guide WHERE user_id = ${userId}) AS dismissed_at,
      (SELECT created_at FROM setup_guide WHERE user_id = ${userId}) AS guide_created_at
  `;

  const row = rows[0];
  const hasIncome = Boolean(row.has_income);
  const hasExpense = Boolean(row.has_expense);
  const hasGenerated = Boolean(row.has_generated);
  const hasPaid = Boolean(row.has_paid);
  const dismissedAt = row.dismissed_at;
  const guideRowExists = row.guide_created_at !== null;

  const allCompleted = hasIncome && hasExpense && hasGenerated && hasPaid;

  const stepsCompletion: GuideStepCompletion = {
    income: hasIncome,
    expense: hasExpense,
    generate: hasGenerated,
    pay: hasPaid,
  };

  // Visibility logic (M3: no completed_at usage in GUIDE-001)
  const isVisible = computeVisibility(
    allCompleted,
    guideRowExists,
    dismissedAt,
  );

  // If visible and no guide row yet, create one (idempotent side-effect)
  if (isVisible && !guideRowExists) {
    await sql`
      INSERT INTO setup_guide (user_id)
      VALUES (${userId})
      ON CONFLICT (user_id) DO NOTHING
    `;
  }

  return {
    stepsCompletion,
    isVisible,
    isCompleted: allCompleted,
  };
}

/**
 * Determines whether the setup guide should be shown.
 *
 * Rules (GUIDE-001 scope):
 * - dismissed_at IS NOT NULL -> hide
 * - No guide row + all 4 steps complete -> hide (existing user, AC-6)
 * - Otherwise -> show
 */
function computeVisibility(
  allCompleted: boolean,
  guideRowExists: boolean,
  dismissedAt: string | null,
): boolean {
  // Already dismissed
  if (dismissedAt) return false;

  // Existing user (all done, never had the guide) — AC-6
  if (allCompleted && !guideRowExists) return false;

  return true;
}

// ── Server action (mutation) ─────────────────────────────────────────────────

/**
 * Dismisses the setup guide — sets dismissed_at to NOW().
 * Called from the celebration CTA in the guide UI.
 */
export async function dismissSetupGuide(): Promise<void> {
  const userId = await requireAuth();
  await sql`
    UPDATE setup_guide
    SET dismissed_at = NOW()
    WHERE user_id = ${userId}
  `;
  revalidatePath("/", "layout");
}
