'use server';

import { revalidatePath } from 'next/cache';
import { sql } from '@/lib/db';
import { calcMonthlyIncome } from '@/lib/utils';
import type { Income, IncomeFrequency, IncomeSource } from '@/lib/types';

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
  return incomes.reduce((sum, inc) => sum + calcMonthlyIncome(inc.amount, inc.frequency, inc.estimated_amount), 0);
}

type IncomeInput = {
  name: string;
  source: IncomeSource;
  amount: number | null;
  estimated_amount: number | null;
  frequency: IncomeFrequency;
  notes?: string | null;
};

export async function createIncome(data: IncomeInput): Promise<Income> {
  const rows = await sql`
    INSERT INTO incomes (name, source, amount, estimated_amount, frequency, notes)
    VALUES (${data.name}, ${data.source}, ${data.amount}, ${data.estimated_amount}, ${data.frequency}, ${data.notes ?? null})
    RETURNING *
  `;
  revalidatePath('/revenus');
  revalidatePath('/');
  revalidatePath('/mon-mois');
  return rows[0] as Income;
}

export async function updateIncome(id: string, data: Partial<IncomeInput>): Promise<Income> {
  const rows = await sql`
    UPDATE incomes SET
      name = COALESCE(${data.name ?? null}, name),
      source = COALESCE(${data.source ?? null}, source),
      amount = ${data.amount !== undefined ? data.amount : null},
      estimated_amount = ${data.estimated_amount !== undefined ? data.estimated_amount : null},
      frequency = COALESCE(${data.frequency ?? null}, frequency),
      notes = ${data.notes !== undefined ? (data.notes ?? null) : null},
      updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `;
  revalidatePath('/revenus');
  revalidatePath('/');
  revalidatePath('/mon-mois');
  return rows[0] as Income;
}

export async function deleteIncome(id: string): Promise<void> {
  await sql`UPDATE incomes SET is_active = false, updated_at = NOW() WHERE id = ${id}`;
  revalidatePath('/revenus');
  revalidatePath('/');
}
