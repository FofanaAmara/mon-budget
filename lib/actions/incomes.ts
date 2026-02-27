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
  return incomes.reduce((sum, inc) => sum + calcMonthlyIncome(
    inc.amount !== null && inc.amount !== undefined ? Number(inc.amount) : null,
    inc.frequency,
    inc.estimated_amount !== null && inc.estimated_amount !== undefined ? Number(inc.estimated_amount) : null,
  ), 0);
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
  revalidatePath('/parametres');
  revalidatePath('/');
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
  revalidatePath('/parametres');
  revalidatePath('/');
  return rows[0] as Income;
}

export async function deleteIncome(id: string): Promise<void> {
  await sql`UPDATE incomes SET is_active = false, updated_at = NOW() WHERE id = ${id}`;
  revalidatePath('/revenus');
  revalidatePath('/');
}

// Creates a one-time adhoc income and inserts it as RECEIVED in monthly_incomes.
export async function createAdhocIncome(
  name: string,
  amount: number,
  source: IncomeSource,
  month: string
): Promise<void> {
  // Insert into incomes table as VARIABLE (one-time use)
  const rows = await sql`
    INSERT INTO incomes (name, source, amount, estimated_amount, frequency, is_active)
    VALUES (${name}, ${source}, ${amount}, 0, 'VARIABLE', true)
    RETURNING id
  `;
  const incomeId = (rows[0] as { id: string }).id;

  // Insert directly as monthly instance with RECEIVED status
  await sql`
    INSERT INTO monthly_incomes (income_id, month, expected_amount, actual_amount, status, received_at)
    VALUES (${incomeId}, ${month}, 0, ${amount}, 'RECEIVED', CURRENT_DATE)
    ON CONFLICT (income_id, month) DO NOTHING
  `;

  revalidatePath('/revenus');
  revalidatePath('/');
}
