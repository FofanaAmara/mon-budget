"use server";

import { sql } from "@/lib/db";
import { requireAuth } from "@/lib/auth/helpers";
import { revalidateExpensePages } from "@/lib/revalidation";
import type { ExpenseTransaction } from "@/lib/types";
import { validateInput } from "@/lib/schemas/validate";
import { idSchema } from "@/lib/schemas/common";
import { AddExpenseTransactionSchema } from "@/lib/schemas/expense-transaction";

/**
 * Records a sub-transaction for a progressive expense.
 * Atomic: inserts the transaction row AND updates the running paid_amount total.
 */
export async function addExpenseTransaction(
  monthlyExpenseId: string,
  amount: number,
  note?: string | null,
): Promise<void> {
  validateInput(AddExpenseTransactionSchema, {
    monthlyExpenseId,
    amount,
    note,
  });
  const userId = await requireAuth();

  // Verify the expense is progressive (defense in depth — UI also guards)
  const [me] = await sql`
    SELECT me.id
    FROM monthly_expenses me
    JOIN expenses e ON me.expense_id = e.id
    WHERE me.id = ${monthlyExpenseId}
      AND me.user_id = ${userId}
      AND e.is_progressive = true
  `;
  if (!me) throw new Error("Expense not found or not progressive");

  await sql.transaction((txn) => [
    txn`
      INSERT INTO expense_transactions (user_id, monthly_expense_id, amount, note)
      VALUES (${userId}, ${monthlyExpenseId}, ${amount}, ${note ?? null})
    `,
    txn`
      UPDATE monthly_expenses SET
        paid_amount = paid_amount + ${amount}
      WHERE id = ${monthlyExpenseId} AND user_id = ${userId}
    `,
  ]);

  revalidateExpensePages();
}

/**
 * Retrieves all sub-transactions for a progressive expense,
 * ordered by most recent first.
 */
export async function getExpenseTransactions(
  monthlyExpenseId: string,
): Promise<ExpenseTransaction[]> {
  validateInput(idSchema, monthlyExpenseId);
  const userId = await requireAuth();

  const rows = await sql`
    SELECT * FROM expense_transactions
    WHERE monthly_expense_id = ${monthlyExpenseId} AND user_id = ${userId}
    ORDER BY created_at DESC
  `;

  return rows as ExpenseTransaction[];
}
