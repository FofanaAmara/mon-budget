"use server";

import { sql } from "@/lib/db";
import { requireSpace } from "@/lib/spaces/context";
import { requireFinancialParents, requireFinancialRecord, revalidateSpace } from "@/lib/spaces/financial";
import type { Debt } from "@/lib/types";
import { validateInput } from "@/lib/schemas/validate";
import { idSchema } from "@/lib/schemas/common";
import {
  CreateDebtSchema,
  type CreateDebtInput,
  MakeExtraPaymentSchema,
} from "@/lib/schemas/debt";

export async function getDebts(spaceId: string): Promise<Debt[]> {
  await requireSpace(spaceId);
  const rows = await sql`
    SELECT
      d.*,
      row_to_json(s.*) as section,
      row_to_json(c.*) as card
    FROM debts d
    LEFT JOIN sections s ON d.section_id = s.id AND d.space_id = s.space_id
    LEFT JOIN cards c ON d.card_id = c.id AND d.space_id = c.space_id
    WHERE d.is_active = true AND d.space_id = ${spaceId}
    ORDER BY d.remaining_balance DESC
  `;
  return rows as Debt[];
}

export async function createDebt(spaceId: string, data: CreateDebtInput): Promise<Debt> {
  data = validateInput(CreateDebtSchema, data);
  const { userId } = await requireSpace(spaceId);
  await requireFinancialParents(spaceId, data);
  const rows = await sql`
    INSERT INTO debts (
      space_id, user_id, name, original_amount, remaining_balance,
      interest_rate, payment_amount, payment_frequency,
      payment_day, auto_debit, card_id, section_id, notes
    ) VALUES (
      ${spaceId}, ${userId},
      ${data.name},
      ${data.original_amount},
      ${data.remaining_balance},
      ${data.interest_rate ?? null},
      ${data.payment_amount},
      ${data.payment_frequency},
      ${data.payment_day ?? null},
      ${data.auto_debit ?? false},
      ${data.card_id ?? null},
      ${data.section_id ?? null},
      ${data.notes ?? null}
    )
    RETURNING *
  `;
  revalidateSpace(spaceId);
  return requireFinancialRecord(rows[0]) as Debt;
}

export async function updateDebt(
  spaceId: string,
  id: string,
  data: Partial<CreateDebtInput>,
): Promise<Debt> {
  validateInput(idSchema, id);
  data = validateInput(CreateDebtSchema.partial(), data);
  await requireSpace(spaceId);
  await requireFinancialParents(spaceId, data);
  const rows = await sql`
    UPDATE debts SET
      name = COALESCE(${data.name ?? null}, name),
      original_amount = COALESCE(${data.original_amount ?? null}, original_amount),
      remaining_balance = COALESCE(${data.remaining_balance ?? null}, remaining_balance),
      interest_rate = CASE WHEN ${data.interest_rate !== undefined} THEN ${data.interest_rate ?? null} ELSE interest_rate END,
      payment_amount = COALESCE(${data.payment_amount ?? null}, payment_amount),
      payment_frequency = COALESCE(${data.payment_frequency ?? null}, payment_frequency),
      payment_day = CASE WHEN ${data.payment_day !== undefined} THEN ${data.payment_day ?? null} ELSE payment_day END,
      auto_debit = COALESCE(${data.auto_debit ?? null}, auto_debit),
      card_id = CASE WHEN ${data.card_id !== undefined} THEN ${data.card_id ?? null} ELSE card_id END,
      section_id = CASE WHEN ${data.section_id !== undefined} THEN ${data.section_id ?? null} ELSE section_id END,
      notes = CASE WHEN ${data.notes !== undefined} THEN ${data.notes ?? null} ELSE notes END,
      updated_at = NOW()
    WHERE id = ${id} AND space_id = ${spaceId}
    RETURNING *
  `;
  revalidateSpace(spaceId);
  return requireFinancialRecord(rows[0]) as Debt;
}

export async function deleteDebt(spaceId: string, id: string): Promise<void> {
  validateInput(idSchema, id);
  await requireSpace(spaceId);
  const rows = await sql`
    UPDATE debts SET is_active = false, updated_at = NOW()
    WHERE id = ${id} AND space_id = ${spaceId} RETURNING id
  `;
  requireFinancialRecord(rows[0]);
  revalidateSpace(spaceId);
}

export async function getTotalDebtBalance(spaceId: string): Promise<number> {
  await requireSpace(spaceId);
  const rows = await sql`
    SELECT COALESCE(SUM(remaining_balance), 0) as total
    FROM debts
    WHERE is_active = true AND space_id = ${spaceId}
  `;
  return Number(rows[0].total);
}

export async function makeExtraPayment(
  spaceId: string,
  id: string,
  amount: number,
): Promise<void> {
  ({ id, amount } = validateInput(MakeExtraPaymentSchema, { id, amount }));
  const { userId } = await requireSpace(spaceId);
  const txMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;

  const rows = await sql`WITH locked AS MATERIALIZED (
    SELECT id,remaining_balance FROM debts
    WHERE id=${id} AND space_id=${spaceId} AND is_active AND remaining_balance>0 FOR UPDATE
  ), paid AS (
    UPDATE debts d SET remaining_balance=l.remaining_balance-LEAST(l.remaining_balance,${amount}),
      is_active=(l.remaining_balance>${amount}), updated_at=now()
    FROM locked l WHERE d.id=l.id AND d.space_id=${spaceId}
    RETURNING d.id,LEAST(l.remaining_balance,${amount}) AS applied
  ) INSERT INTO debt_transactions(space_id,user_id,debt_id,type,amount,month,note,source)
    SELECT ${spaceId},${userId},id,'PAYMENT',applied,${txMonth},'Paiement supplémentaire','EXTRA_PAYMENT'
    FROM paid RETURNING id`;
  requireFinancialRecord(rows[0]);
  revalidateSpace(spaceId);
}
