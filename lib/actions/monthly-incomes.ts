'use server';

import { revalidatePath } from 'next/cache';
import { sql } from '@/lib/db';
import type { MonthlyIncome } from '@/lib/types';

// Generates monthly_incomes instances for FIXED incomes of a given month.
// VARIABLE incomes are NOT auto-generated (manual entry only).
// Idempotent — safe to call multiple times (ON CONFLICT DO NOTHING).
export async function generateMonthlyIncomes(month: string): Promise<void> {
  const incomes = await sql`
    SELECT id, name, source, amount, frequency
    FROM incomes
    WHERE is_active = true AND frequency != 'VARIABLE'
  `;

  for (const inc of incomes as { id: string; name: string; amount: number; frequency: string }[]) {
    const expectedAmount =
      inc.frequency === 'MONTHLY'  ? Number(inc.amount) :
      inc.frequency === 'BIWEEKLY' ? (Number(inc.amount) * 26 / 12) :
      inc.frequency === 'YEARLY'   ? (Number(inc.amount) / 12) :
      Number(inc.amount);

    await sql`
      INSERT INTO monthly_incomes (income_id, month, expected_amount, status)
      VALUES (${inc.id}, ${month}, ${expectedAmount}, 'EXPECTED')
      ON CONFLICT (income_id, month) DO NOTHING
    `;
  }
  // No revalidatePath — called during page render
}

// Returns the summary of incomes for a given month.
export async function getMonthlyIncomeSummary(month: string): Promise<{
  items: MonthlyIncome[];
  expectedTotal: number;
  actualTotal: number;
}> {
  const rows = await sql`
    SELECT
      mi.*,
      i.name as income_name,
      i.source as income_source,
      i.frequency as income_frequency
    FROM monthly_incomes mi
    JOIN incomes i ON mi.income_id = i.id
    WHERE mi.month = ${month}
    ORDER BY i.source ASC, i.name ASC
  `;

  const items = rows as MonthlyIncome[];
  const expectedTotal = items.reduce((s, i) => s + Number(i.expected_amount ?? 0), 0);
  const actualTotal = items.reduce((s, i) => s + Number(i.actual_amount ?? 0), 0);

  return { items, expectedTotal, actualTotal };
}

// Mark a fixed income instance as RECEIVED with the actual amount.
export async function markIncomeReceived(
  monthlyIncomeId: string,
  actualAmount: number,
  notes?: string
): Promise<void> {
  await sql`
    UPDATE monthly_incomes
    SET
      status = 'RECEIVED',
      actual_amount = ${actualAmount},
      received_at = CURRENT_DATE,
      notes = ${notes ?? null}
    WHERE id = ${monthlyIncomeId}
  `;
  revalidatePath('/revenus');
  revalidatePath('/');
}

// Create AND mark as RECEIVED a VARIABLE income for the given month (manual entry).
export async function markVariableIncomeReceived(
  incomeId: string,
  month: string,
  actualAmount: number,
  notes?: string
): Promise<void> {
  await sql`
    INSERT INTO monthly_incomes
      (income_id, month, expected_amount, actual_amount, status, received_at, notes)
    VALUES
      (${incomeId}, ${month}, ${actualAmount}, ${actualAmount}, 'RECEIVED', CURRENT_DATE, ${notes ?? null})
    ON CONFLICT (income_id, month) DO UPDATE
      SET
        actual_amount = ${actualAmount},
        status = 'RECEIVED',
        received_at = CURRENT_DATE,
        notes = ${notes ?? null}
  `;
  revalidatePath('/revenus');
  revalidatePath('/');
}
