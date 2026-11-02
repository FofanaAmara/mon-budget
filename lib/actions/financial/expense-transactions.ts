"use server";

import { sql } from "@/lib/db";
import { requireSpace } from "@/lib/spaces/context";
import { requireFinancialRecord, revalidateSpace } from "@/lib/spaces/financial";
import type { ExpenseTransaction } from "@/lib/types";
import { validateInput } from "@/lib/schemas/validate";
import { idSchema } from "@/lib/schemas/common";
import { AddExpenseTransactionSchema } from "@/lib/schemas/expense-transaction";

export async function addExpenseTransaction(spaceId: string,monthlyExpenseId: string,amount: number,note?: string | null): Promise<void> {
  ({monthlyExpenseId,amount,note}=validateInput(AddExpenseTransactionSchema,{monthlyExpenseId,amount,note}));
  const {userId}=await requireSpace(spaceId);
  const rows=await sql`WITH changed AS (
    UPDATE monthly_expenses me SET paid_amount=COALESCE(me.paid_amount,0)+${amount}
    WHERE me.id=${monthlyExpenseId} AND me.space_id=${spaceId} AND me.is_progressive
      AND me.status!='DEFERRED' RETURNING me.id
  ) INSERT INTO expense_transactions(space_id,user_id,monthly_expense_id,amount,note)
    SELECT ${spaceId},${userId},id,${amount},${note??null} FROM changed RETURNING id`;
  requireFinancialRecord(rows[0]);
  revalidateSpace(spaceId);
}

export async function getExpenseTransactions(spaceId: string,monthlyExpenseId: string): Promise<ExpenseTransaction[]> {
  validateInput(idSchema,monthlyExpenseId);
  await requireSpace(spaceId);
  return await sql`SELECT * FROM expense_transactions WHERE space_id=${spaceId} AND monthly_expense_id=${monthlyExpenseId}
    ORDER BY created_at DESC,id` as ExpenseTransaction[];
}
