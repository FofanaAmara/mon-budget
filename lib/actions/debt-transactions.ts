"use server";

import { sql } from "@/lib/db";
import { requireAuth } from "@/lib/auth/helpers";
import { revalidateDebtPages } from "@/lib/revalidation";
import type { DebtTransaction, MonthlyDebtSummary } from "@/lib/types";
import { validateInput } from "@/lib/schemas/validate";
import { idSchema, monthSchema } from "@/lib/schemas/common";
import { AddDebtTransactionSchema } from "@/lib/schemas/debt-transaction";

export async function addDebtTransaction(
  debtId: string,
  type: "PAYMENT" | "CHARGE",
  amount: number,
  month: string,
  note?: string | null,
  source: string = "MANUAL",
): Promise<void> {
  validateInput(AddDebtTransactionSchema, {
    debtId,
    type,
    amount,
    month,
    note,
    source,
  });
  const userId = await requireAuth();

  // Atomic: insert transaction + update balance
  if (type === "PAYMENT") {
    await sql.transaction((txn) => [
      txn`
        INSERT INTO debt_transactions (user_id, debt_id, type, amount, month, note, source)
        VALUES (${userId}, ${debtId}, ${type}, ${amount}, ${month}, ${note ?? null}, ${source})
      `,
      txn`
        UPDATE debts SET
          remaining_balance = GREATEST(remaining_balance - ${amount}, 0),
          updated_at = NOW()
        WHERE id = ${debtId} AND user_id = ${userId}
      `,
      txn`
        UPDATE debts SET is_active = false, updated_at = NOW()
        WHERE id = ${debtId} AND user_id = ${userId} AND remaining_balance <= 0
      `,
    ]);
  } else {
    // CHARGE — insert transaction + increase balance
    await sql.transaction((txn) => [
      txn`
        INSERT INTO debt_transactions (user_id, debt_id, type, amount, month, note, source)
        VALUES (${userId}, ${debtId}, ${type}, ${amount}, ${month}, ${note ?? null}, ${source})
      `,
      txn`
        UPDATE debts SET
          remaining_balance = remaining_balance + ${amount},
          updated_at = NOW()
        WHERE id = ${debtId} AND user_id = ${userId}
      `,
    ]);
  }

  revalidateDebtPages();
}

export async function getMonthlyDebtSummary(
  month: string,
): Promise<MonthlyDebtSummary> {
  validateInput(monthSchema, month);
  const userId = await requireAuth();
  const rows = await sql`
    SELECT
      COALESCE(SUM(amount) FILTER (WHERE type = 'PAYMENT'), 0) as total_payments,
      COALESCE(SUM(amount) FILTER (WHERE type = 'CHARGE'), 0) as total_charges,
      COUNT(*) FILTER (WHERE type = 'PAYMENT') as payment_count,
      COUNT(*) FILTER (WHERE type = 'CHARGE') as charge_count
    FROM debt_transactions
    WHERE user_id = ${userId} AND month = ${month}
  `;

  const row = rows[0];
  const totalPayments = Number(row.total_payments);
  const totalCharges = Number(row.total_charges);

  return {
    totalPayments,
    totalCharges,
    netMovement: totalPayments - totalCharges,
    paymentCount: Number(row.payment_count),
    chargeCount: Number(row.charge_count),
  };
}

export async function getDebtTransactions(
  debtId: string,
): Promise<DebtTransaction[]> {
  validateInput(idSchema, debtId);
  const userId = await requireAuth();
  const rows = await sql`
    SELECT dt.*, d.name as debt_name
    FROM debt_transactions dt
    JOIN debts d ON dt.debt_id = d.id
    WHERE dt.debt_id = ${debtId} AND dt.user_id = ${userId}
    ORDER BY dt.created_at DESC
  `;
  return rows as DebtTransaction[];
}
