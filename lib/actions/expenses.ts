'use server';

import { revalidatePath } from 'next/cache';
import { sql } from '@/lib/db';
import { calcNextDueDate } from '@/lib/utils';
import type { Expense, ExpenseType, RecurrenceFrequency, SavingsContribution } from '@/lib/types';

export async function getExpenses(): Promise<Expense[]> {
  const rows = await sql`
    SELECT
      e.*,
      row_to_json(s.*) as section,
      row_to_json(c.*) as card
    FROM expenses e
    LEFT JOIN sections s ON e.section_id = s.id
    LEFT JOIN cards c ON e.card_id = c.id
    WHERE e.is_active = true
    ORDER BY e.created_at DESC, e.next_due_date ASC NULLS LAST
  `;
  return rows as Expense[];
}

export async function getUpcomingExpenses(days = 7): Promise<Expense[]> {
  const rows = await sql`
    SELECT
      e.*,
      row_to_json(s.*) as section,
      row_to_json(c.*) as card
    FROM expenses e
    LEFT JOIN sections s ON e.section_id = s.id
    LEFT JOIN cards c ON e.card_id = c.id
    WHERE e.is_active = true
      AND e.next_due_date IS NOT NULL
      AND e.next_due_date <= CURRENT_DATE + ${days}::integer
      AND e.next_due_date >= CURRENT_DATE
    ORDER BY e.next_due_date ASC
  `;
  return rows as Expense[];
}

export async function getExpenseById(id: string): Promise<Expense | null> {
  const rows = await sql`
    SELECT
      e.*,
      row_to_json(s.*) as section,
      row_to_json(c.*) as card
    FROM expenses e
    LEFT JOIN sections s ON e.section_id = s.id
    LEFT JOIN cards c ON e.card_id = c.id
    WHERE e.id = ${id}
  `;
  return rows[0] as Expense ?? null;
}

type CreateExpenseInput = {
  name: string;
  amount: number;
  currency?: string;
  type: ExpenseType;
  section_id?: string;
  card_id?: string;
  recurrence_frequency?: RecurrenceFrequency;
  recurrence_day?: number;
  auto_debit?: boolean;
  due_date?: string;
  reminder_offsets?: number[];
  notify_push?: boolean;
  notify_email?: boolean;
  notify_sms?: boolean;
  notes?: string;
  // PLANNED fields
  target_amount?: number;
  target_date?: string;
  saved_amount?: number;
};

export async function createExpense(data: CreateExpenseInput): Promise<Expense> {
  // Calculate next_due_date
  let next_due_date: string | null = null;

  if (data.type === 'RECURRING' && data.recurrence_frequency && data.recurrence_day) {
    const nextDate = calcNextDueDate(data.recurrence_frequency, data.recurrence_day);
    next_due_date = nextDate.toISOString().split('T')[0];
  } else if (data.due_date) {
    next_due_date = data.due_date;
  }

  const rows = await sql`
    INSERT INTO expenses (
      name, amount, currency, type,
      section_id, card_id,
      recurrence_frequency, recurrence_day, auto_debit,
      due_date, next_due_date,
      reminder_offsets, notify_push, notify_email, notify_sms,
      notes, target_amount, target_date, saved_amount
    ) VALUES (
      ${data.name},
      ${data.amount},
      ${data.currency ?? 'CAD'},
      ${data.type},
      ${data.section_id ?? null},
      ${data.card_id ?? null},
      ${data.recurrence_frequency ?? null},
      ${data.recurrence_day ?? null},
      ${data.auto_debit ?? false},
      ${data.due_date ?? null},
      ${next_due_date},
      ${data.reminder_offsets ?? [1, 3, 7]},
      ${data.notify_push ?? true},
      ${data.notify_email ?? false},
      ${data.notify_sms ?? false},
      ${data.notes ?? null},
      ${data.target_amount ?? null},
      ${data.target_date ?? null},
      ${data.saved_amount ?? 0}
    )
    RETURNING *
  `;

  revalidatePath('/depenses');
  revalidatePath('/projets');
  revalidatePath('/parametres');
  revalidatePath('/');
  return rows[0] as Expense;
}

export async function updateExpense(
  id: string,
  data: Partial<CreateExpenseInput>
): Promise<Expense> {
  // Recalculate next_due_date if recurrence fields changed
  let next_due_date: string | null | undefined = undefined;

  if (data.recurrence_frequency && data.recurrence_day) {
    const nextDate = calcNextDueDate(data.recurrence_frequency, data.recurrence_day);
    next_due_date = nextDate.toISOString().split('T')[0];
  } else if (data.due_date !== undefined) {
    next_due_date = data.due_date ?? null;
  }

  const rows = await sql`
    UPDATE expenses SET
      name = COALESCE(${data.name ?? null}, name),
      amount = COALESCE(${data.amount ?? null}, amount),
      currency = COALESCE(${data.currency ?? null}, currency),
      type = COALESCE(${data.type ?? null}, type),
      section_id = CASE WHEN ${data.section_id !== undefined} THEN ${data.section_id ?? null} ELSE section_id END,
      card_id = CASE WHEN ${data.card_id !== undefined} THEN ${data.card_id ?? null} ELSE card_id END,
      recurrence_frequency = COALESCE(${data.recurrence_frequency ?? null}, recurrence_frequency),
      recurrence_day = COALESCE(${data.recurrence_day ?? null}, recurrence_day),
      auto_debit = COALESCE(${data.auto_debit ?? null}, auto_debit),
      due_date = CASE WHEN ${data.due_date !== undefined} THEN ${data.due_date ?? null} ELSE due_date END,
      next_due_date = CASE WHEN ${next_due_date !== undefined} THEN ${next_due_date ?? null} ELSE next_due_date END,
      notes = CASE WHEN ${data.notes !== undefined} THEN ${data.notes ?? null} ELSE notes END,
      target_amount = CASE WHEN ${data.target_amount !== undefined} THEN ${data.target_amount ?? null} ELSE target_amount END,
      target_date = CASE WHEN ${data.target_date !== undefined} THEN ${data.target_date ?? null} ELSE target_date END,
      saved_amount = COALESCE(${data.saved_amount ?? null}, saved_amount),
      updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `;

  revalidatePath('/depenses');
  revalidatePath('/projets');
  revalidatePath('/parametres');
  revalidatePath('/');
  revalidatePath(`/depenses/${id}/edit`);
  return rows[0] as Expense;
}

export async function deleteExpense(id: string): Promise<void> {
  await sql`UPDATE expenses SET is_active = false, updated_at = NOW() WHERE id = ${id}`;
  revalidatePath('/depenses');
  revalidatePath('/projets');
  revalidatePath('/parametres');
  revalidatePath('/');
}

export async function getMonthlySummaryBySection(): Promise<
  { section_id: string; section_name: string; section_icon: string; section_color: string; total: number }[]
> {
  const rows = await sql`
    SELECT
      s.id as section_id,
      s.name as section_name,
      s.icon as section_icon,
      s.color as section_color,
      COALESCE(SUM(
        CASE
          WHEN e.recurrence_frequency = 'WEEKLY' THEN e.amount * 52.0 / 12
          WHEN e.recurrence_frequency = 'BIWEEKLY' THEN e.amount * 26.0 / 12
          WHEN e.recurrence_frequency = 'MONTHLY' THEN e.amount
          WHEN e.recurrence_frequency = 'QUARTERLY' THEN e.amount / 3.0
          WHEN e.recurrence_frequency = 'YEARLY' THEN e.amount / 12.0
          ELSE e.amount
        END
      ), 0) as total
    FROM sections s
    LEFT JOIN expenses e ON e.section_id = s.id AND e.is_active = true
    GROUP BY s.id, s.name, s.icon, s.color, s.position
    ORDER BY s.position ASC
  `;
  return rows as { section_id: string; section_name: string; section_icon: string; section_color: string; total: number }[];
}

export async function getPlannedExpenses(): Promise<Expense[]> {
  const rows = await sql`
    SELECT
      e.*,
      row_to_json(s.*) as section,
      row_to_json(c.*) as card
    FROM expenses e
    LEFT JOIN sections s ON e.section_id = s.id
    LEFT JOIN cards c ON e.card_id = c.id
    WHERE e.is_active = true
      AND e.type = 'PLANNED'
    ORDER BY e.target_date ASC NULLS LAST, e.created_at DESC
  `;
  return rows as Expense[];
}

export async function updateSavedAmount(id: string, savedAmount: number): Promise<Expense> {
  const rows = await sql`
    UPDATE expenses SET
      saved_amount = ${savedAmount},
      updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `;
  revalidatePath('/projets');
  revalidatePath('/');
  return rows[0] as Expense;
}

export async function addSavingsContribution(
  expenseId: string,
  amount: number,
  note?: string | null,
): Promise<void> {
  // Insert the contribution
  await sql`
    INSERT INTO savings_contributions (expense_id, amount, note)
    VALUES (${expenseId}, ${amount}, ${note ?? null})
  `;
  // Update the running total
  await sql`
    UPDATE expenses SET
      saved_amount = saved_amount + ${amount},
      updated_at = NOW()
    WHERE id = ${expenseId}
  `;
  revalidatePath('/projets');
  revalidatePath('/');
}

export async function getSavingsContributions(expenseId: string): Promise<SavingsContribution[]> {
  const rows = await sql`
    SELECT * FROM savings_contributions
    WHERE expense_id = ${expenseId}
    ORDER BY created_at DESC
  `;
  return rows as SavingsContribution[];
}

export async function transferSavings(
  fromId: string,
  toId: string,
  amount: number,
  fromName: string,
  toName: string,
): Promise<void> {
  // Debit source
  await sql`
    INSERT INTO savings_contributions (expense_id, amount, note)
    VALUES (${fromId}, ${-amount}, ${'Transfert vers ' + toName})
  `;
  await sql`
    UPDATE expenses SET saved_amount = saved_amount - ${amount}, updated_at = NOW()
    WHERE id = ${fromId}
  `;
  // Credit destination
  await sql`
    INSERT INTO savings_contributions (expense_id, amount, note)
    VALUES (${toId}, ${amount}, ${'Transfert depuis ' + fromName})
  `;
  await sql`
    UPDATE expenses SET saved_amount = saved_amount + ${amount}, updated_at = NOW()
    WHERE id = ${toId}
  `;
  revalidatePath('/projets');
  revalidatePath('/');
}

// Returns the single "Épargne libre" pot, creating it if it doesn't exist.
export async function getOrCreateFreeSavings(): Promise<Expense> {
  const existing = await sql`
    SELECT e.*, row_to_json(s.*) as section, row_to_json(c.*) as card
    FROM expenses e
    LEFT JOIN sections s ON e.section_id = s.id
    LEFT JOIN cards c ON e.card_id = c.id
    WHERE e.is_active = true AND e.type = 'PLANNED' AND e.name = 'Épargne libre'
    LIMIT 1
  `;
  if (existing.length > 0) return existing[0] as Expense;

  const rows = await sql`
    INSERT INTO expenses (name, amount, type, saved_amount)
    VALUES ('Épargne libre', 0, 'PLANNED', 0)
    RETURNING *, NULL as section, NULL as card
  `;
  return rows[0] as Expense;
}

export async function getExpensesByCard(cardId: string): Promise<Expense[]> {
  const rows = await sql`
    SELECT
      e.*,
      row_to_json(s.*) as section,
      row_to_json(c.*) as card
    FROM expenses e
    LEFT JOIN sections s ON e.section_id = s.id
    LEFT JOIN cards c ON e.card_id = c.id
    WHERE e.is_active = true
      AND e.card_id = ${cardId}
    ORDER BY e.next_due_date ASC NULLS LAST, e.created_at DESC
  `;
  return rows as Expense[];
}

// Creates a one-time adhoc expense directly in monthly_expenses for the given month.
// Used by the quick-add FAB in Mon Mois.
export async function createAdhocExpense(
  name: string,
  amount: number,
  sectionId: string,
  month: string
): Promise<void> {
  // Insert into expenses table as ONE_TIME
  const rows = await sql`
    INSERT INTO expenses (name, amount, type, section_id, is_active, next_due_date)
    VALUES (${name}, ${amount}, 'ONE_TIME', ${sectionId}, true, CURRENT_DATE)
    RETURNING id
  `;
  const expenseId = (rows[0] as { id: string }).id;

  // Insert directly as monthly instance with UPCOMING status
  await sql`
    INSERT INTO monthly_expenses (expense_id, section_id, month, name, amount, status, due_date)
    VALUES (${expenseId}, ${sectionId}, ${month}, ${name}, ${amount}, 'UPCOMING', CURRENT_DATE)
    ON CONFLICT (expense_id, month) DO NOTHING
  `;

  revalidatePath('/depenses');
  revalidatePath('/');
}
