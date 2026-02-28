'use server';

import { revalidatePath } from 'next/cache';
import { sql } from '@/lib/db';
import { requireAuth } from '@/lib/auth/helpers';
import { calcNextDueDate } from '@/lib/utils';
import type { Expense, ExpenseType, RecurrenceFrequency, SavingsContribution, MonthlySavingsSummary } from '@/lib/types';

export async function getExpenses(): Promise<Expense[]> {
  const userId = await requireAuth();
  const rows = await sql`
    SELECT
      e.*,
      row_to_json(s.*) as section,
      row_to_json(c.*) as card
    FROM expenses e
    LEFT JOIN sections s ON e.section_id = s.id
    LEFT JOIN cards c ON e.card_id = c.id
    WHERE e.is_active = true AND e.user_id = ${userId}
    ORDER BY e.created_at DESC, e.next_due_date ASC NULLS LAST
  `;
  return rows as Expense[];
}

export async function getUpcomingExpenses(days = 7): Promise<Expense[]> {
  const userId = await requireAuth();
  const rows = await sql`
    SELECT
      e.*,
      row_to_json(s.*) as section,
      row_to_json(c.*) as card
    FROM expenses e
    LEFT JOIN sections s ON e.section_id = s.id
    LEFT JOIN cards c ON e.card_id = c.id
    WHERE e.is_active = true
      AND e.user_id = ${userId}
      AND e.next_due_date IS NOT NULL
      AND e.next_due_date <= CURRENT_DATE + ${days}::integer
      AND e.next_due_date >= CURRENT_DATE
    ORDER BY e.next_due_date ASC
  `;
  return rows as Expense[];
}

export async function getExpenseById(id: string): Promise<Expense | null> {
  const userId = await requireAuth();
  const rows = await sql`
    SELECT
      e.*,
      row_to_json(s.*) as section,
      row_to_json(c.*) as card
    FROM expenses e
    LEFT JOIN sections s ON e.section_id = s.id
    LEFT JOIN cards c ON e.card_id = c.id
    WHERE e.id = ${id} AND e.user_id = ${userId}
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
  const userId = await requireAuth();
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
      user_id, name, amount, currency, type,
      section_id, card_id,
      recurrence_frequency, recurrence_day, auto_debit,
      due_date, next_due_date,
      reminder_offsets, notify_push, notify_email, notify_sms,
      notes, target_amount, target_date, saved_amount
    ) VALUES (
      ${userId},
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
  revalidatePath('/parametres/charges');
  revalidatePath('/');
  return rows[0] as Expense;
}

export async function updateExpense(
  id: string,
  data: Partial<CreateExpenseInput>
): Promise<Expense> {
  const userId = await requireAuth();
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
    WHERE id = ${id} AND user_id = ${userId}
    RETURNING *
  `;

  revalidatePath('/depenses');
  revalidatePath('/projets');
  revalidatePath('/parametres');
  revalidatePath('/parametres/charges');
  revalidatePath('/');
  revalidatePath(`/depenses/${id}/edit`);
  return rows[0] as Expense;
}

export async function deleteExpense(id: string): Promise<void> {
  const userId = await requireAuth();
  await sql`UPDATE expenses SET is_active = false, updated_at = NOW() WHERE id = ${id} AND user_id = ${userId}`;
  revalidatePath('/depenses');
  revalidatePath('/projets');
  revalidatePath('/parametres');
  revalidatePath('/parametres/charges');
  revalidatePath('/');
}

export async function getMonthlySummaryBySection(): Promise<
  { section_id: string; section_name: string; section_icon: string; section_color: string; total: number }[]
> {
  const userId = await requireAuth();
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
          WHEN e.recurrence_frequency = 'BIMONTHLY' THEN e.amount / 2.0
          WHEN e.recurrence_frequency = 'QUARTERLY' THEN e.amount / 3.0
          WHEN e.recurrence_frequency = 'YEARLY' THEN e.amount / 12.0
          ELSE e.amount
        END
      ), 0) as total
    FROM sections s
    LEFT JOIN expenses e ON e.section_id = s.id AND e.is_active = true AND e.user_id = ${userId}
    WHERE s.user_id = ${userId}
    GROUP BY s.id, s.name, s.icon, s.color, s.position
    ORDER BY s.position ASC
  `;
  return rows as { section_id: string; section_name: string; section_icon: string; section_color: string; total: number }[];
}

export async function getPlannedExpenses(): Promise<Expense[]> {
  const userId = await requireAuth();
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
      AND e.user_id = ${userId}
    ORDER BY e.created_at DESC
  `;
  return rows as Expense[];
}

export async function updateSavedAmount(id: string, savedAmount: number): Promise<Expense> {
  const userId = await requireAuth();
  const rows = await sql`
    UPDATE expenses SET
      saved_amount = ${savedAmount},
      updated_at = NOW()
    WHERE id = ${id} AND user_id = ${userId}
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
  const userId = await requireAuth();
  // Insert the contribution
  await sql`
    INSERT INTO savings_contributions (user_id, expense_id, amount, note)
    VALUES (${userId}, ${expenseId}, ${amount}, ${note ?? null})
  `;
  // Update the running total
  await sql`
    UPDATE expenses SET
      saved_amount = saved_amount + ${amount},
      updated_at = NOW()
    WHERE id = ${expenseId} AND user_id = ${userId}
  `;
  revalidatePath('/projets');
  revalidatePath('/');
}

export async function getSavingsContributions(expenseId: string): Promise<SavingsContribution[]> {
  const userId = await requireAuth();
  const rows = await sql`
    SELECT * FROM savings_contributions
    WHERE expense_id = ${expenseId} AND user_id = ${userId}
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
  const userId = await requireAuth();
  // Debit source
  await sql`
    INSERT INTO savings_contributions (user_id, expense_id, amount, note)
    VALUES (${userId}, ${fromId}, ${-amount}, ${'Transfert vers ' + toName})
  `;
  await sql`
    UPDATE expenses SET saved_amount = saved_amount - ${amount}, updated_at = NOW()
    WHERE id = ${fromId} AND user_id = ${userId}
  `;
  // Credit destination
  await sql`
    INSERT INTO savings_contributions (user_id, expense_id, amount, note)
    VALUES (${userId}, ${toId}, ${amount}, ${'Transfert depuis ' + fromName})
  `;
  await sql`
    UPDATE expenses SET saved_amount = saved_amount + ${amount}, updated_at = NOW()
    WHERE id = ${toId} AND user_id = ${userId}
  `;
  revalidatePath('/projets');
  revalidatePath('/');
}

// Returns the single "Épargne libre" pot, creating it if it doesn't exist.
export async function getOrCreateFreeSavings(): Promise<Expense> {
  const userId = await requireAuth();
  const existing = await sql`
    SELECT e.*, row_to_json(s.*) as section, row_to_json(c.*) as card
    FROM expenses e
    LEFT JOIN sections s ON e.section_id = s.id
    LEFT JOIN cards c ON e.card_id = c.id
    WHERE e.is_active = true AND e.type = 'PLANNED' AND e.name = 'Épargne libre' AND e.user_id = ${userId}
    LIMIT 1
  `;
  if (existing.length > 0) return existing[0] as Expense;

  const rows = await sql`
    INSERT INTO expenses (user_id, name, amount, type, saved_amount)
    VALUES (${userId}, 'Épargne libre', 0, 'PLANNED', 0)
    RETURNING *, NULL as section, NULL as card
  `;
  return rows[0] as Expense;
}

export async function getExpensesByCard(cardId: string): Promise<Expense[]> {
  const userId = await requireAuth();
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
      AND e.user_id = ${userId}
    ORDER BY e.created_at DESC
  `;
  return rows as Expense[];
}

export async function getMonthlySavingsSummary(month: string): Promise<MonthlySavingsSummary> {
  const userId = await requireAuth();
  const [year, monthNum] = month.split('-').map(Number);
  const monthStart = `${year}-${String(monthNum).padStart(2, '0')}-01`;
  const daysInMonth = new Date(year, monthNum, 0).getDate();
  const monthEnd = `${year}-${String(monthNum).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;

  const rows = await sql`
    SELECT
      sc.expense_id,
      e.name,
      SUM(sc.amount) as total
    FROM savings_contributions sc
    JOIN expenses e ON sc.expense_id = e.id
    WHERE sc.user_id = ${userId}
      AND sc.created_at >= ${monthStart}::date
      AND sc.created_at < (${monthEnd}::date + INTERVAL '1 day')
    GROUP BY sc.expense_id, e.name
    ORDER BY total DESC
  `;

  const byProject = (rows as { expense_id: string; name: string; total: number }[]).map(r => ({
    expense_id: r.expense_id,
    name: r.name,
    total: Number(r.total),
  }));

  const totalContributions = byProject.reduce((s, p) => s + p.total, 0);
  const contributionCountRows = await sql`
    SELECT COUNT(*) as cnt
    FROM savings_contributions
    WHERE user_id = ${userId}
      AND created_at >= ${monthStart}::date
      AND created_at < (${monthEnd}::date + INTERVAL '1 day')
  `;

  return {
    totalContributions,
    contributionCount: Number(contributionCountRows[0].cnt),
    byProject,
  };
}

// Creates an adhoc (imprevu) expense directly in monthly_expenses.
// No template is created in `expenses` — adhoc items are standalone transactions.
export async function createAdhocExpense(
  name: string,
  amount: number,
  sectionId: string,
  month: string,
  alreadyPaid: boolean = false,
  dueDate?: string,
  cardId?: string,
): Promise<void> {
  const userId = await requireAuth();
  const today = new Date().toISOString().split('T')[0];
  const effectiveDate = dueDate || today;

  if (alreadyPaid) {
    await sql`
      INSERT INTO monthly_expenses (user_id, expense_id, section_id, card_id, month, name, amount, status, due_date, paid_at, is_planned)
      VALUES (${userId}, NULL, ${sectionId}, ${cardId ?? null}, ${month}, ${name}, ${amount}, 'PAID', ${effectiveDate}::date, ${effectiveDate}::date, false)
    `;
  } else {
    await sql`
      INSERT INTO monthly_expenses (user_id, expense_id, section_id, card_id, month, name, amount, status, due_date, is_planned)
      VALUES (${userId}, NULL, ${sectionId}, ${cardId ?? null}, ${month}, ${name}, ${amount}, 'UPCOMING', ${effectiveDate}::date, false)
    `;
  }

  revalidatePath('/depenses');
  revalidatePath('/');
}
