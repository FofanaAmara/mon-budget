"use server";

import { sql } from "@/lib/db";
import { requireSpace, SpaceAccessError } from "@/lib/spaces/context";
import { requireFinancialRecord, revalidateSpace } from "@/lib/spaces/financial";
import type { Expense, SavingsContribution, MonthlySavingsSummary } from "@/lib/types";
import { validateInput } from "@/lib/schemas/validate";
import { idSchema, monthSchema, nonNegativeAmountSchema } from "@/lib/schemas/common";
import { AddSavingsContributionSchema, TransferSavingsSchema } from "@/lib/schemas/expense";

export async function getPlannedExpenses(spaceId: string): Promise<Expense[]> {
  await requireSpace(spaceId);
  const rows = await sql`SELECT e.*,row_to_json(s.*) AS section,row_to_json(c.*) AS card
    FROM expenses e
    LEFT JOIN sections s ON s.space_id=e.space_id AND s.id=e.section_id
    LEFT JOIN cards c ON c.space_id=e.space_id AND c.id=e.card_id
    WHERE e.space_id=${spaceId} AND e.is_active AND e.type='PLANNED'
    ORDER BY e.created_at DESC`;
  return rows as Expense[];
}

export async function updateSavedAmount(spaceId: string, id: string, savedAmount: number): Promise<Expense> {
  validateInput(idSchema, id);
  savedAmount = validateInput(nonNegativeAmountSchema, savedAmount);
  await requireSpace(spaceId);
  const rows = await sql`UPDATE expenses SET saved_amount=${savedAmount},updated_at=now()
    WHERE space_id=${spaceId} AND id=${id} AND type='PLANNED' AND is_active RETURNING *`;
  const record = requireFinancialRecord(rows[0]);
  revalidateSpace(spaceId);
  return record as Expense;
}

export async function addSavingsContribution(spaceId: string, expenseId: string, amount: number, note?: string | null): Promise<void> {
  ({ expenseId, amount, note } = validateInput(AddSavingsContributionSchema, { expenseId, amount, note }));
  const { userId } = await requireSpace(spaceId);
  // The balance check runs inside the locked UPDATE, including concurrent debits.
  const rows = await sql`WITH changed AS (
    UPDATE expenses SET saved_amount=COALESCE(saved_amount,0)+${amount},updated_at=now()
    WHERE space_id=${spaceId} AND id=${expenseId} AND type='PLANNED' AND is_active
      AND COALESCE(saved_amount,0)+${amount}>=0 RETURNING id
  ) INSERT INTO savings_contributions(space_id,user_id,expense_id,amount,note)
    SELECT ${spaceId},${userId},id,${amount},${note ?? null} FROM changed RETURNING id`;
  if (!rows[0]) throw new SpaceAccessError("Projet inaccessible ou fonds insuffisants dans cet espace.");
  revalidateSpace(spaceId);
}

export async function getSavingsContributions(spaceId: string, expenseId: string): Promise<SavingsContribution[]> {
  validateInput(idSchema, expenseId);
  await requireSpace(spaceId);
  return await sql`SELECT * FROM savings_contributions WHERE space_id=${spaceId} AND expense_id=${expenseId}
    ORDER BY created_at DESC` as SavingsContribution[];
}

export async function transferSavings(spaceId: string, input: {
  fromId: string; toId: string; amount: number; fromName: string; toName: string;
}): Promise<void> {
  input = validateInput(TransferSavingsSchema, input);
  const { userId } = await requireSpace(spaceId);
  const { fromId, toId, amount } = input;
  if (fromId === toId) throw new Error("Choisis deux projets différents.");
  // Lock both projects in a stable order. The second concurrent transfer reads
  // the committed balance after waiting, before deciding whether it can spend.
  const rows = await sql`WITH locked AS MATERIALIZED (
    SELECT id,name,COALESCE(saved_amount,0) AS balance FROM expenses
    WHERE space_id=${spaceId} AND id IN (${fromId},${toId}) AND type='PLANNED' AND is_active
    ORDER BY id FOR UPDATE
  ), allowed AS (
    SELECT 1 WHERE (SELECT count(*) FROM locked)=2
      AND (SELECT balance FROM locked WHERE id=${fromId})>=${amount}
  ), moved AS (
    UPDATE expenses e SET saved_amount=l.balance+CASE WHEN e.id=${fromId} THEN -${amount}::numeric ELSE ${amount}::numeric END,
      updated_at=now()
    FROM locked l WHERE e.space_id=${spaceId} AND e.id=l.id AND EXISTS(SELECT 1 FROM allowed)
    RETURNING e.id
  ), journal AS (
    INSERT INTO savings_contributions(space_id,user_id,expense_id,amount,note)
    SELECT ${spaceId},${userId},m.id,CASE WHEN m.id=${fromId} THEN -${amount}::numeric ELSE ${amount}::numeric END,
      CASE WHEN m.id=${fromId} THEN 'Transfert vers '||(SELECT name FROM locked WHERE id=${toId})
        ELSE 'Transfert depuis '||(SELECT name FROM locked WHERE id=${fromId}) END
    FROM moved m RETURNING id
  ) SELECT count(*) AS count FROM journal`;
  if (Number(rows[0].count) !== 2) throw new SpaceAccessError("Projets inaccessibles ou fonds insuffisants dans cet espace.");
  revalidateSpace(spaceId);
}

/** Stable technical identity survives renaming and concurrent first visits. */
export async function getOrCreateFreeSavings(spaceId: string): Promise<Expense> {
  const { userId } = await requireSpace(spaceId);
  const rows = await sql`INSERT INTO expenses(space_id,user_id,name,amount,type,saved_amount,system_kind)
    VALUES(${spaceId},${userId},'Épargne libre',0,'PLANNED',0,'FREE_SAVINGS')
    ON CONFLICT(space_id) WHERE system_kind='FREE_SAVINGS' DO UPDATE SET is_active=true
    RETURNING *,NULL AS section,NULL AS card`;
  return requireFinancialRecord(rows[0]) as Expense;
}

export async function getMonthlySavingsSummary(spaceId: string, month: string): Promise<MonthlySavingsSummary> {
  validateInput(monthSchema, month);
  await requireSpace(spaceId);
  const start = month + "-01";
  const rows = await sql`SELECT sc.expense_id,e.name,SUM(sc.amount) AS total,count(*) AS count
    FROM savings_contributions sc JOIN expenses e ON e.space_id=sc.space_id AND e.id=sc.expense_id
    WHERE sc.space_id=${spaceId} AND sc.created_at>=${start}::date
      AND sc.created_at<(${start}::date+INTERVAL '1 month')
    GROUP BY sc.expense_id,e.name ORDER BY total DESC`;
  return {
    totalContributions: rows.reduce((total,row) => total+Number(row.total),0),
    contributionCount: rows.reduce((total,row) => total+Number(row.count),0),
    byProject: rows.map(row => ({ expense_id: row.expense_id, name: row.name, total: Number(row.total) })),
  };
}
