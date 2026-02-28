'use server';

import { revalidatePath } from 'next/cache';
import { sql } from '@/lib/db';
import { requireAuth } from '@/lib/auth/helpers';
import type { DebtTransaction, MonthlyDebtSummary } from '@/lib/types';

export async function addDebtTransaction(
  debtId: string,
  type: 'PAYMENT' | 'CHARGE',
  amount: number,
  month: string,
  note?: string | null,
  source: string = 'MANUAL',
): Promise<void> {
  const userId = await requireAuth();

  // Insert the transaction
  await sql`
    INSERT INTO debt_transactions (user_id, debt_id, type, amount, month, note, source)
    VALUES (${userId}, ${debtId}, ${type}, ${amount}, ${month}, ${note ?? null}, ${source})
  `;

  // Update remaining_balance: PAYMENT decrements, CHARGE increments
  if (type === 'PAYMENT') {
    await sql`
      UPDATE debts SET
        remaining_balance = GREATEST(remaining_balance - ${amount}, 0),
        updated_at = NOW()
      WHERE id = ${debtId} AND user_id = ${userId}
    `;
    // Auto-deactivate if fully paid
    await sql`
      UPDATE debts SET is_active = false, updated_at = NOW()
      WHERE id = ${debtId} AND user_id = ${userId} AND remaining_balance <= 0
    `;
  } else {
    // CHARGE — increase balance
    await sql`
      UPDATE debts SET
        remaining_balance = remaining_balance + ${amount},
        updated_at = NOW()
      WHERE id = ${debtId} AND user_id = ${userId}
    `;
  }

  revalidatePath('/projets');
  revalidatePath('/');
}

export async function getMonthlyDebtSummary(month: string): Promise<MonthlyDebtSummary> {
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

export async function getDebtTransactions(debtId: string): Promise<DebtTransaction[]> {
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
