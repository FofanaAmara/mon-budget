"use server";

import { sql } from "@/lib/db";
import { requireSpace } from "@/lib/spaces/context";
import { requireFinancialRecord, revalidateSpace } from "@/lib/spaces/financial";
import { calcMonthlyIncome } from "@/lib/utils";
import type { Income } from "@/lib/types";
import { validateInput } from "@/lib/schemas/validate";
import { idSchema } from "@/lib/schemas/common";
import {
  CreateIncomeSchema,
  UpdateIncomeDataSchema,
  type CreateIncomeInput,
  CreateAdhocIncomeSchema,
} from "@/lib/schemas/income";

export async function getIncomes(spaceId: string): Promise<Income[]> {
  await requireSpace(spaceId);
  const rows = await sql`
    SELECT * FROM incomes
    WHERE is_active = true AND space_id = ${spaceId}
    ORDER BY created_at DESC
  `;
  return rows as Income[];
}

export async function getMonthlyIncomeTotal(spaceId: string): Promise<number> {
  const incomes = await getIncomes(spaceId);
  return incomes.reduce(
    (sum, inc) =>
      sum +
      calcMonthlyIncome(
        inc.amount !== null && inc.amount !== undefined
          ? Number(inc.amount)
          : null,
        inc.frequency,
        inc.estimated_amount !== null && inc.estimated_amount !== undefined
          ? Number(inc.estimated_amount)
          : null,
      ),
    0,
  );
}

export async function createIncome(spaceId: string, data: CreateIncomeInput): Promise<Income> {
  data = validateInput(CreateIncomeSchema, data);
  const { userId } = await requireSpace(spaceId);
  const rows = await sql`
    INSERT INTO incomes (space_id, user_id, name, source, amount, estimated_amount, frequency, pay_anchor_date, auto_deposit, notes)
    VALUES (${spaceId}, ${userId}, ${data.name}, ${data.source}, ${data.amount}, ${data.estimated_amount}, ${data.frequency}, ${data.pay_anchor_date ?? null}, ${data.auto_deposit ?? false}, ${data.notes ?? null})
    RETURNING *
  `;
  const record = requireFinancialRecord(rows[0]);
  revalidateSpace(spaceId);
  return record as Income;
}

export async function updateIncome(
  spaceId: string,
  id: string,
  data: Partial<CreateIncomeInput>,
): Promise<Income> {
  validateInput(idSchema, id);
  data = validateInput(UpdateIncomeDataSchema, data);
  await requireSpace(spaceId);
  const rows = await sql`
    UPDATE incomes SET
      name = COALESCE(${data.name ?? null}, name),
      source = COALESCE(${data.source ?? null}, source),
      amount = CASE WHEN ${data.amount !== undefined} THEN ${data.amount ?? null} ELSE amount END,
      estimated_amount = CASE WHEN ${data.estimated_amount !== undefined} THEN ${data.estimated_amount ?? null} ELSE estimated_amount END,
      frequency = COALESCE(${data.frequency ?? null}, frequency),
      pay_anchor_date = CASE WHEN ${data.pay_anchor_date !== undefined} THEN ${data.pay_anchor_date ?? null} ELSE pay_anchor_date END,
      auto_deposit = COALESCE(${data.auto_deposit ?? null},auto_deposit),
      notes = CASE WHEN ${data.notes !== undefined} THEN ${data.notes ?? null} ELSE notes END,
      updated_at = NOW()
    WHERE id = ${id} AND space_id = ${spaceId}
      AND (COALESCE(${data.frequency ?? null},frequency)='VARIABLE'
        OR (CASE WHEN ${data.amount !== undefined} THEN ${data.amount ?? null} ELSE amount END)>0)
    RETURNING *
  `;
  const record = requireFinancialRecord(rows[0]);
  revalidateSpace(spaceId);
  return record as Income;
}

export async function deleteIncome(spaceId: string, id: string): Promise<void> {
  validateInput(idSchema, id);
  await requireSpace(spaceId);
  const rows = await sql`UPDATE incomes SET is_active = false, updated_at = NOW() WHERE id = ${id} AND space_id = ${spaceId} RETURNING id`;
  requireFinancialRecord(rows[0]);
  revalidateSpace(spaceId);
}

// Creates a one-time adhoc income and inserts it as RECEIVED in monthly_incomes.
export async function createAdhocIncome(
  spaceId: string,
  name: string,
  amount: number,
  source: string,
  month: string,
): Promise<void> {
  ({ name, amount, source, month } = validateInput(CreateAdhocIncomeSchema, { name, amount, source, month }));
  const { userId } = await requireSpace(spaceId);
  // Both records commit together; the one-time template is inactive from birth.
  await sql`WITH template AS (
    INSERT INTO incomes (space_id, user_id, name, source, amount, estimated_amount, frequency, is_active)
    VALUES (${spaceId}, ${userId}, ${name}, ${source}, ${amount}, 0, 'VARIABLE', false)
    RETURNING id
  ) INSERT INTO monthly_incomes (space_id, user_id, income_id, month, expected_amount, actual_amount, status, received_at)
    SELECT ${spaceId}, ${userId}, id, ${month}, 0, ${amount}, 'RECEIVED', CURRENT_DATE FROM template
  `;
  revalidateSpace(spaceId);
}
