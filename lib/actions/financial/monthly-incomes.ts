"use server";

import { sql } from "@/lib/db";
import type { DatabaseTransactionTag } from "@/lib/database/types";
import { requireSpace } from "@/lib/spaces/context";
import { requireFinancialRecord, revalidateSpace } from "@/lib/spaces/financial";
import type { MonthlyIncome } from "@/lib/types";
import { BIWEEKLY_MONTHLY_MULTIPLIER } from "@/lib/constants";
import { validateInput } from "@/lib/schemas/validate";
import {
  idSchema,
  monthSchema,
  nonNegativeAmountSchema,
} from "@/lib/schemas/common";
import {
  MarkIncomeReceivedSchema,
  MarkVariableIncomeReceivedSchema,
} from "@/lib/schemas/monthly-income";

// Generates monthly_incomes instances for FIXED incomes of a given month.
// VARIABLE incomes are NOT auto-generated (manual entry only).
// Repeated generation refreshes only EXPECTED values; received amounts stay fixed.
function monthlyIncomeGeneration(txn: DatabaseTransactionTag, spaceId: string, userId: string, month: string, receive = false) {
  const start = month + "-01";
  // Read and calculate from locked current templates in the same statement.
  // A queued generator cannot replay an obsolete JS snapshot over a newer one.
  return txn`WITH locked AS MATERIALIZED (
    SELECT id,amount,frequency,pay_anchor_date,auto_deposit FROM incomes
    WHERE space_id=${spaceId} AND is_active AND frequency!='VARIABLE'
    ORDER BY id FOR UPDATE
  ), calculated AS (
    SELECT i.id,COALESCE(i.auto_deposit,false) AS auto_deposit,
      CASE WHEN i.frequency='MONTHLY' THEN i.amount
        WHEN i.frequency='YEARLY' THEN i.amount/12
        WHEN i.frequency='BIWEEKLY' AND i.pay_anchor_date IS NOT NULL THEN i.amount*(
          SELECT count(*) FROM generate_series(${start}::date,${start}::date+INTERVAL '1 month'-INTERVAL '1 day',INTERVAL '1 day') day
          WHERE ((day::date-i.pay_anchor_date)%14+14)%14=0
        ) WHEN i.frequency='BIWEEKLY' THEN i.amount*${BIWEEKLY_MONTHLY_MULTIPLIER}
        ELSE i.amount END AS expected_amount FROM locked i
  ) INSERT INTO monthly_incomes(space_id,user_id,income_id,month,expected_amount,status,is_auto_deposited,actual_amount,received_at)
    SELECT ${spaceId},${userId},c.id,${month},c.expected_amount,
      CASE WHEN ${receive} AND c.auto_deposit THEN 'RECEIVED' ELSE 'EXPECTED' END,c.auto_deposit,
      CASE WHEN ${receive} AND c.auto_deposit THEN c.expected_amount ELSE NULL END,
      CASE WHEN ${receive} AND c.auto_deposit THEN CURRENT_DATE ELSE NULL END
    FROM calculated c WHERE true
    ON CONFLICT(income_id,month) DO UPDATE SET
      expected_amount=CASE WHEN monthly_incomes.manually_edited THEN monthly_incomes.expected_amount ELSE EXCLUDED.expected_amount END,
      is_auto_deposited=EXCLUDED.is_auto_deposited,
      status=EXCLUDED.status,
      actual_amount=CASE WHEN ${receive} AND EXCLUDED.is_auto_deposited
        THEN CASE WHEN monthly_incomes.manually_edited THEN monthly_incomes.expected_amount ELSE EXCLUDED.expected_amount END
        ELSE monthly_incomes.actual_amount END,
      received_at=CASE WHEN ${receive} AND EXCLUDED.is_auto_deposited THEN CURRENT_DATE ELSE monthly_incomes.received_at END
    WHERE monthly_incomes.status='EXPECTED' AND (${receive} OR NOT monthly_incomes.manually_edited)
      AND monthly_incomes.space_id=${spaceId}`;
}

export async function generateMonthlyIncomes(spaceId: string, month: string): Promise<void> {
  validateInput(monthSchema, month);
  const { userId } = await requireSpace(spaceId);
  await sql.transaction(txn => [monthlyIncomeGeneration(txn, spaceId, userId, month)]);
  // No revalidatePath — called during page render.
}

// Auto-mark EXPECTED incomes as RECEIVED when is_auto_deposited is true.
// Same pattern as autoMarkPaidForAutoDebit in monthly-expenses.ts.
export async function autoMarkReceivedForAutoDeposit(
  spaceId: string,
  month: string,
): Promise<void> {
  validateInput(monthSchema, month);
  const { userId } = await requireSpace(spaceId);
  // Calculate and receive in one statement under the same template locks.
  // This also preserves monthly overrides and avoids a generation/receipt gap.
  await sql.transaction(txn => [monthlyIncomeGeneration(txn, spaceId, userId, month, true)]);
  // No revalidatePath — called during page render
}

// Returns the summary of incomes for a given month.
export async function getMonthlyIncomeSummary(spaceId: string, month: string): Promise<{
  items: MonthlyIncome[];
  expectedTotal: number;
  actualTotal: number;
}> {
  validateInput(monthSchema, month);
  await requireSpace(spaceId);
  const rows = await sql`
    SELECT
      mi.*,
      COALESCE(i.name,'Revenu ponctuel') as income_name,
      COALESCE(i.source,'OTHER') as income_source,
      COALESCE(i.frequency,'VARIABLE') as income_frequency,
      i.pay_anchor_date as income_pay_anchor_date,
      i.auto_deposit as income_auto_deposit
    FROM monthly_incomes mi
    LEFT JOIN incomes i ON mi.income_id = i.id AND mi.space_id = i.space_id
    WHERE mi.month = ${month} AND mi.space_id = ${spaceId}
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
  spaceId: string,
  monthlyIncomeId: string,
  actualAmount: number,
  notes?: string,
): Promise<void> {
  ({ monthlyIncomeId, actualAmount, notes } = validateInput(MarkIncomeReceivedSchema, { monthlyIncomeId, actualAmount, notes }));
  await requireSpace(spaceId);
  const rows = await sql`
    UPDATE monthly_incomes
    SET
      status = 'RECEIVED',
      actual_amount = ${actualAmount},
      received_at = CURRENT_DATE,
      notes = ${notes ?? null}
    WHERE id = ${monthlyIncomeId} AND space_id = ${spaceId} RETURNING id
  `;
  requireFinancialRecord(rows[0]);
  revalidateSpace(spaceId);
}

// Revert a RECEIVED/PARTIAL income back to EXPECTED.
// Same pattern as markAsUpcoming in monthly-expenses.ts.
export async function markIncomeAsExpected(
  spaceId: string,
  monthlyIncomeId: string,
): Promise<void> {
  validateInput(idSchema, monthlyIncomeId);
  await requireSpace(spaceId);
  const rows = await sql`
    UPDATE monthly_incomes
    SET status = 'EXPECTED', actual_amount = NULL, received_at = NULL, manually_edited = false
    WHERE id = ${monthlyIncomeId} AND space_id = ${spaceId} RETURNING id
  `;
  requireFinancialRecord(rows[0]);
  revalidateSpace(spaceId);
}

// Delete a monthly income instance (adhoc/ponctuel only).
// Safe: templates in `incomes` are already is_active=false for adhoc entries.
export async function deleteMonthlyIncome(spaceId: string, id: string): Promise<void> {
  validateInput(idSchema, id);
  await requireSpace(spaceId);
  const rows = await sql`
    DELETE FROM monthly_incomes mi
    WHERE mi.id = ${id} AND mi.space_id = ${spaceId} AND COALESCE(mi.expected_amount,0)=0
      AND (mi.income_id IS NULL OR EXISTS(SELECT 1 FROM incomes i
        WHERE i.id=mi.income_id AND i.space_id=mi.space_id AND i.frequency='VARIABLE' AND NOT i.is_active))
    RETURNING mi.id
  `;
  requireFinancialRecord(rows[0]);
  revalidateSpace(spaceId);
}

// Update the expected_amount for a monthly income (this month only — template unchanged).
// Use case: congé sans solde → salaire 3 000 $ au lieu de 4 200 $ ce mois.
export async function updateMonthlyIncomeAmount(
  spaceId: string,
  id: string,
  newExpectedAmount: number,
): Promise<void> {
  validateInput(idSchema, id);
  newExpectedAmount = validateInput(nonNegativeAmountSchema, newExpectedAmount);
  await requireSpace(spaceId);
  const rows = await sql`
    UPDATE monthly_incomes
    SET expected_amount = ${newExpectedAmount}, manually_edited = true
    WHERE id = ${id} AND space_id = ${spaceId} RETURNING id
  `;
  requireFinancialRecord(rows[0]);
  revalidateSpace(spaceId);
}

// Create AND mark as RECEIVED a VARIABLE income for the given month (manual entry).
export async function markVariableIncomeReceived(
  spaceId: string,
  incomeId: string,
  month: string,
  actualAmount: number,
  notes?: string,
): Promise<void> {
  ({ incomeId, month, actualAmount, notes } = validateInput(MarkVariableIncomeReceivedSchema, { incomeId, month, actualAmount, notes }));
  const { userId } = await requireSpace(spaceId);
  const rows = await sql`
    INSERT INTO monthly_incomes
      (space_id,user_id, income_id, month, expected_amount, actual_amount, status, received_at, notes)
    SELECT ${spaceId},${userId}, id, ${month}, ${actualAmount}, ${actualAmount}, 'RECEIVED', CURRENT_DATE, ${notes ?? null}
    FROM incomes WHERE space_id=${spaceId} AND id=${incomeId} AND frequency='VARIABLE' AND is_active
    ON CONFLICT (income_id, month) DO UPDATE
      SET
        actual_amount = ${actualAmount},
        status = 'RECEIVED',
        received_at = CURRENT_DATE,
        notes = ${notes ?? null}
      WHERE monthly_incomes.space_id=${spaceId}
    RETURNING id
  `;
  requireFinancialRecord(rows[0]);
  revalidateSpace(spaceId);
}
