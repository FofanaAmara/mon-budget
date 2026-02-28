'use server';

import { revalidatePath } from 'next/cache';
import { sql } from '@/lib/db';
import { requireAuth } from '@/lib/auth/helpers';
import type { Debt, DebtFrequency } from '@/lib/types';

export async function getDebts(): Promise<Debt[]> {
  const userId = await requireAuth();
  const rows = await sql`
    SELECT
      d.*,
      row_to_json(s.*) as section,
      row_to_json(c.*) as card
    FROM debts d
    LEFT JOIN sections s ON d.section_id = s.id
    LEFT JOIN cards c ON d.card_id = c.id
    WHERE d.is_active = true AND d.user_id = ${userId}
    ORDER BY d.remaining_balance DESC
  `;
  return rows as Debt[];
}

type CreateDebtInput = {
  name: string;
  original_amount: number;
  remaining_balance: number;
  interest_rate?: number | null;
  payment_amount: number;
  payment_frequency: DebtFrequency;
  payment_day?: number | null;
  auto_debit?: boolean;
  card_id?: string | null;
  section_id?: string | null;
  notes?: string | null;
};

export async function createDebt(data: CreateDebtInput): Promise<Debt> {
  const userId = await requireAuth();
  const rows = await sql`
    INSERT INTO debts (
      user_id, name, original_amount, remaining_balance,
      interest_rate, payment_amount, payment_frequency,
      payment_day, auto_debit, card_id, section_id, notes
    ) VALUES (
      ${userId},
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
  revalidatePath('/projets');
  revalidatePath('/');
  return rows[0] as Debt;
}

export async function updateDebt(
  id: string,
  data: Partial<CreateDebtInput>,
): Promise<Debt> {
  const userId = await requireAuth();
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
    WHERE id = ${id} AND user_id = ${userId}
    RETURNING *
  `;
  revalidatePath('/projets');
  revalidatePath('/');
  return rows[0] as Debt;
}

export async function deleteDebt(id: string): Promise<void> {
  const userId = await requireAuth();
  await sql`
    UPDATE debts SET is_active = false, updated_at = NOW()
    WHERE id = ${id} AND user_id = ${userId}
  `;
  revalidatePath('/projets');
  revalidatePath('/');
}

export async function getTotalDebtBalance(): Promise<number> {
  const userId = await requireAuth();
  const rows = await sql`
    SELECT COALESCE(SUM(remaining_balance), 0) as total
    FROM debts
    WHERE is_active = true AND user_id = ${userId}
  `;
  return Number(rows[0].total);
}

export async function makeExtraPayment(id: string, amount: number): Promise<void> {
  const userId = await requireAuth();
  // Decrement remaining balance
  await sql`
    UPDATE debts SET
      remaining_balance = GREATEST(remaining_balance - ${amount}, 0),
      updated_at = NOW()
    WHERE id = ${id} AND user_id = ${userId}
  `;
  // Auto-deactivate if fully paid
  await sql`
    UPDATE debts SET is_active = false, updated_at = NOW()
    WHERE id = ${id} AND user_id = ${userId} AND remaining_balance <= 0
  `;
  // Log the extra payment as a debt transaction
  const txMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
  await sql`
    INSERT INTO debt_transactions (user_id, debt_id, type, amount, month, note, source)
    VALUES (${userId}, ${id}, 'PAYMENT', ${amount}, ${txMonth}, 'Paiement supplementaire', 'EXTRA_PAYMENT')
  `;
  revalidatePath('/projets');
  revalidatePath('/');
}
