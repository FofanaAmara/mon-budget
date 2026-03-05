"use server";

import { revalidatePath } from "next/cache";
import { sql } from "@/lib/db";
import { requireAuth } from "@/lib/auth/helpers";
import { countBiweeklyPayDatesInMonth } from "@/lib/utils";
import type { MonthlyIncome } from "@/lib/types";
import { BIWEEKLY_MONTHLY_MULTIPLIER } from "@/lib/constants";

// Generates monthly_incomes instances for FIXED incomes of a given month.
// VARIABLE incomes are NOT auto-generated (manual entry only).
// Idempotent — safe to call multiple times (ON CONFLICT DO NOTHING).
export async function generateMonthlyIncomes(month: string): Promise<void> {
  const userId = await requireAuth();
  const incomes = await sql`
    SELECT id, name, source, amount, frequency, pay_anchor_date, auto_deposit
    FROM incomes
    WHERE is_active = true AND frequency != 'VARIABLE' AND user_id = ${userId}
  `;

  for (const inc of incomes as {
    id: string;
    name: string;
    amount: number;
    frequency: string;
    pay_anchor_date: string | Date | null;
    auto_deposit: boolean;
  }[]) {
    let expectedAmount: number;

    if (inc.frequency === "BIWEEKLY" && inc.pay_anchor_date) {
      const [year, monthNum] = month.split("-").map(Number);
      const payDates = countBiweeklyPayDatesInMonth(
        inc.pay_anchor_date,
        year,
        monthNum - 1,
      );
      expectedAmount = Number(inc.amount) * payDates;
    } else {
      expectedAmount =
        inc.frequency === "MONTHLY"
          ? Number(inc.amount)
          : inc.frequency === "BIWEEKLY"
            ? Number(inc.amount) * BIWEEKLY_MONTHLY_MULTIPLIER
            : inc.frequency === "YEARLY"
              ? Number(inc.amount) / 12
              : Number(inc.amount);
    }

    await sql`
      INSERT INTO monthly_incomes (user_id, income_id, month, expected_amount, status, is_auto_deposited)
      VALUES (${userId}, ${inc.id}, ${month}, ${expectedAmount}, 'EXPECTED', ${inc.auto_deposit ?? false})
      ON CONFLICT (income_id, month) DO UPDATE
        SET expected_amount = EXCLUDED.expected_amount,
            is_auto_deposited = EXCLUDED.is_auto_deposited
        WHERE monthly_incomes.status = 'EXPECTED'
    `;
  }
  // No revalidatePath — called during page render
}

// Auto-mark EXPECTED incomes as RECEIVED when is_auto_deposited is true.
// Same pattern as autoMarkPaidForAutoDebit in monthly-expenses.ts.
export async function autoMarkReceivedForAutoDeposit(
  month: string,
): Promise<void> {
  const userId = await requireAuth();
  await sql`
    UPDATE monthly_incomes
    SET status = 'RECEIVED',
        actual_amount = expected_amount,
        received_at = CURRENT_DATE
    WHERE month = ${month}
      AND status = 'EXPECTED'
      AND is_auto_deposited = true
      AND user_id = ${userId}
  `;
  // No revalidatePath — called during page render
}

// Returns the summary of incomes for a given month.
export async function getMonthlyIncomeSummary(month: string): Promise<{
  items: MonthlyIncome[];
  expectedTotal: number;
  actualTotal: number;
}> {
  const userId = await requireAuth();
  const rows = await sql`
    SELECT
      mi.*,
      i.name as income_name,
      i.source as income_source,
      i.frequency as income_frequency,
      i.pay_anchor_date as income_pay_anchor_date,
      i.auto_deposit as income_auto_deposit
    FROM monthly_incomes mi
    JOIN incomes i ON mi.income_id = i.id
    WHERE mi.month = ${month} AND mi.user_id = ${userId}
    ORDER BY mi.created_at DESC
  `;

  const items = rows as MonthlyIncome[];
  const expectedTotal = items.reduce(
    (s, i) => s + Number(i.expected_amount ?? 0),
    0,
  );
  const actualTotal = items.reduce(
    (s, i) => s + Number(i.actual_amount ?? 0),
    0,
  );

  return { items, expectedTotal, actualTotal };
}

// Mark a fixed income instance as RECEIVED with the actual amount.
export async function markIncomeReceived(
  monthlyIncomeId: string,
  actualAmount: number,
  notes?: string,
): Promise<void> {
  const userId = await requireAuth();
  await sql`
    UPDATE monthly_incomes
    SET
      status = 'RECEIVED',
      actual_amount = ${actualAmount},
      received_at = CURRENT_DATE,
      notes = ${notes ?? null}
    WHERE id = ${monthlyIncomeId} AND user_id = ${userId}
  `;
  revalidatePath("/revenus");
  revalidatePath("/");
}

// Revert a RECEIVED/PARTIAL income back to EXPECTED.
// Same pattern as markAsUpcoming in monthly-expenses.ts.
export async function markIncomeAsExpected(
  monthlyIncomeId: string,
): Promise<void> {
  const userId = await requireAuth();
  await sql`
    UPDATE monthly_incomes
    SET status = 'EXPECTED', actual_amount = NULL, received_at = NULL
    WHERE id = ${monthlyIncomeId} AND user_id = ${userId}
  `;
  revalidatePath("/revenus");
  revalidatePath("/");
}

// Delete a monthly income instance (adhoc/ponctuel only).
// Safe: templates in `incomes` are already is_active=false for adhoc entries.
export async function deleteMonthlyIncome(id: string): Promise<void> {
  const userId = await requireAuth();
  await sql`
    DELETE FROM monthly_incomes
    WHERE id = ${id} AND user_id = ${userId}
  `;
  revalidatePath("/revenus");
  revalidatePath("/");
}

// Update the expected_amount for a monthly income (this month only — template unchanged).
// Use case: congé sans solde → salaire 3 000 $ au lieu de 4 200 $ ce mois.
export async function updateMonthlyIncomeAmount(
  id: string,
  newExpectedAmount: number,
): Promise<void> {
  const userId = await requireAuth();
  await sql`
    UPDATE monthly_incomes
    SET expected_amount = ${newExpectedAmount}
    WHERE id = ${id} AND user_id = ${userId}
  `;
  revalidatePath("/revenus");
  revalidatePath("/");
}

// Create AND mark as RECEIVED a VARIABLE income for the given month (manual entry).
export async function markVariableIncomeReceived(
  incomeId: string,
  month: string,
  actualAmount: number,
  notes?: string,
): Promise<void> {
  const userId = await requireAuth();
  await sql`
    INSERT INTO monthly_incomes
      (user_id, income_id, month, expected_amount, actual_amount, status, received_at, notes)
    VALUES
      (${userId}, ${incomeId}, ${month}, ${actualAmount}, ${actualAmount}, 'RECEIVED', CURRENT_DATE, ${notes ?? null})
    ON CONFLICT (income_id, month) DO UPDATE
      SET
        actual_amount = ${actualAmount},
        status = 'RECEIVED',
        received_at = CURRENT_DATE,
        notes = ${notes ?? null}
  `;
  revalidatePath("/revenus");
  revalidatePath("/");
}
