"use server";

import { sql } from "@/lib/db";
import { requireSpace } from "@/lib/spaces/context";
import { requireFinancialRecord, revalidateSpace } from "@/lib/spaces/financial";
import type { DebtTransaction,MonthlyDebtSummary } from "@/lib/types";
import { validateInput } from "@/lib/schemas/validate";
import { idSchema,monthSchema } from "@/lib/schemas/common";
import { AddDebtTransactionSchema } from "@/lib/schemas/debt-transaction";

export async function addDebtTransaction(spaceId: string,debtId: string,type: "PAYMENT"|"CHARGE",amount: number,
  month: string,note?: string|null,source="MANUAL"): Promise<void> {
  ({debtId,type,amount,month,note,source}=validateInput(AddDebtTransactionSchema,{debtId,type,amount,month,note,source}));
  if(source!=="MANUAL"&&source!=="EXTRA_PAYMENT") throw new Error("Source de transaction invalide.");
  const {userId}=await requireSpace(spaceId);
  const rows=await sql`WITH locked AS MATERIALIZED (
    SELECT id,remaining_balance,is_active,reactivation_allowed FROM debts WHERE space_id=${spaceId} AND id=${debtId}
      AND (${type}='CHARGE' OR (is_active AND remaining_balance>0)) FOR NO KEY UPDATE
  ), changed AS (
    UPDATE debts d SET remaining_balance=CASE WHEN ${type}='PAYMENT' THEN l.remaining_balance-LEAST(l.remaining_balance,${amount})
      ELSE l.remaining_balance+${amount} END,
      is_active=l.reactivation_allowed AND (CASE WHEN ${type}='PAYMENT' THEN l.remaining_balance>${amount} ELSE true END),updated_at=now()
    FROM locked l WHERE d.id=l.id AND d.space_id=${spaceId}
    RETURNING d.id,CASE WHEN ${type}='PAYMENT' THEN LEAST(l.remaining_balance,${amount}) ELSE ${amount}::numeric END AS applied
  ) INSERT INTO debt_transactions(space_id,user_id,debt_id,type,amount,month,note,source)
    SELECT ${spaceId},${userId},id,${type},applied,${month},${note??null},${source} FROM changed RETURNING id`;
  requireFinancialRecord(rows[0]);
  revalidateSpace(spaceId);
}

export async function getMonthlyDebtSummary(spaceId: string,month: string): Promise<MonthlyDebtSummary> {
  validateInput(monthSchema,month);
  await requireSpace(spaceId);
  const [row]=await sql`SELECT COALESCE(SUM(amount) FILTER(WHERE type='PAYMENT'),0) AS payments,
    COALESCE(SUM(amount) FILTER(WHERE type='CHARGE'),0) AS charges,
    count(*) FILTER(WHERE type='PAYMENT') AS payment_count,count(*) FILTER(WHERE type='CHARGE') AS charge_count
    FROM debt_transactions WHERE space_id=${spaceId} AND month=${month}`;
  return {totalPayments:Number(row.payments),totalCharges:Number(row.charges),netMovement:Number(row.payments)-Number(row.charges),
    paymentCount:Number(row.payment_count),chargeCount:Number(row.charge_count)};
}

export async function getDebtTransactions(spaceId: string,debtId: string): Promise<DebtTransaction[]> {
  validateInput(idSchema,debtId);
  await requireSpace(spaceId);
  return await sql`SELECT dt.*,d.name AS debt_name FROM debt_transactions dt
    JOIN debts d ON d.id=dt.debt_id AND d.space_id=dt.space_id
    WHERE dt.space_id=${spaceId} AND dt.debt_id=${debtId} ORDER BY dt.created_at DESC,dt.id` as DebtTransaction[];
}
