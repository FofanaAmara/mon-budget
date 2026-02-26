'use server';

import { revalidatePath } from 'next/cache';
import { sql } from '@/lib/db';
import { calcMonthlyIncome } from '@/lib/utils';
import type { Income, IncomeFrequency } from '@/lib/types';

export async function getIncomes(): Promise<Income[]> {
  const rows = await sql`
    SELECT * FROM incomes
    WHERE is_active = true
    ORDER BY created_at DESC
  `;
  return rows as Income[];
}

export async function getMonthlyIncomeTotal(): Promise<number> {
  const incomes = await getIncomes();
  return incomes.reduce((sum, inc) => sum + calcMonthlyIncome(Number(inc.amount), inc.frequency), 0);
}

type IncomeInput = {
  name: string;
  amount: number;
  frequency: IncomeFrequency;
};

export async function createIncome(data: IncomeInput): Promise<Income> {
  const rows = await sql`
    INSERT INTO incomes (name, amount, frequency)
    VALUES (${data.name}, ${data.amount}, ${data.frequency})
    RETURNING *
  `;
  revalidatePath('/revenus');
  revalidatePath('/');
  return rows[0] as Income;
}

export async function updateIncome(id: string, data: Partial<IncomeInput>): Promise<Income> {
  const rows = await sql`
    UPDATE incomes SET
      name = COALESCE(${data.name ?? null}, name),
      amount = COALESCE(${data.amount ?? null}, amount),
      frequency = COALESCE(${data.frequency ?? null}, frequency),
      updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `;
  revalidatePath('/revenus');
  revalidatePath('/');
  return rows[0] as Income;
}

export async function deleteIncome(id: string): Promise<void> {
  await sql`UPDATE incomes SET is_active = false, updated_at = NOW() WHERE id = ${id}`;
  revalidatePath('/revenus');
  revalidatePath('/');
}
