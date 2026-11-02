"use server";

import { sql } from "@/lib/db";
import { requireSpace } from "@/lib/spaces/context";
import { requireFinancialParents, requireFinancialRecord, revalidateSpace } from "@/lib/spaces/financial";
import { calcNextDueDate, currentMonth } from "@/lib/utils";
import type { Expense } from "@/lib/types";
import { validateInput } from "@/lib/schemas/validate";
import { idSchema } from "@/lib/schemas/common";
import {
  CreateExpenseSchema,
  UpdateExpenseDataSchema,
  type UpdateExpenseData,
  type CreateExpenseInput,
} from "@/lib/schemas/expense";

export async function getExpenses(spaceId: string): Promise<Expense[]> {
  await requireSpace(spaceId);
  const rows = await sql`
    SELECT
      e.*,
      row_to_json(s.*) as section,
      row_to_json(c.*) as card
    FROM expenses e
    LEFT JOIN sections s ON e.section_id = s.id AND s.space_id=e.space_id
    LEFT JOIN cards c ON e.card_id = c.id AND c.space_id=e.space_id
    WHERE e.is_active = true AND e.space_id = ${spaceId}
    ORDER BY e.created_at DESC, e.next_due_date ASC NULLS LAST
  `;
  return rows as Expense[];
}

export async function getUpcomingExpenses(spaceId: string, days = 7): Promise<Expense[]> {
  await requireSpace(spaceId);
  const rows = await sql`
    SELECT
      e.*,
      row_to_json(s.*) as section,
      row_to_json(c.*) as card
    FROM expenses e
    LEFT JOIN sections s ON e.section_id = s.id AND s.space_id=e.space_id
    LEFT JOIN cards c ON e.card_id = c.id AND c.space_id=e.space_id
    WHERE e.is_active = true
      AND e.space_id = ${spaceId}
      AND e.next_due_date IS NOT NULL
      AND e.next_due_date <= CURRENT_DATE + ${days}::integer
      AND e.next_due_date >= CURRENT_DATE
    ORDER BY e.next_due_date ASC
  `;
  return rows as Expense[];
}

export async function getExpenseById(spaceId: string, id: string): Promise<Expense | null> {
  validateInput(idSchema, id);
  await requireSpace(spaceId);
  const rows = await sql`
    SELECT
      e.*,
      row_to_json(s.*) as section,
      row_to_json(c.*) as card
    FROM expenses e
    LEFT JOIN sections s ON e.section_id = s.id AND s.space_id=e.space_id
    LEFT JOIN cards c ON e.card_id = c.id AND c.space_id=e.space_id
    WHERE e.id = ${id} AND e.space_id = ${spaceId}
  `;
  return (rows[0] as Expense) ?? null;
}

export async function createExpense(
  spaceId: string,
  data: CreateExpenseInput,
): Promise<Expense> {
  data = validateInput(CreateExpenseSchema, data);
  const { userId } = await requireSpace(spaceId);
  await requireFinancialParents(spaceId,data);
  // Calculate next_due_date
  let next_due_date: string | null = null;

  if (
    data.type === "RECURRING" &&
    data.recurrence_frequency &&
    data.recurrence_day
  ) {
    const nextDate = calcNextDueDate(
      data.recurrence_frequency,
      data.recurrence_day,
    );
    next_due_date = nextDate.toISOString().split("T")[0];
  } else if (data.due_date) {
    next_due_date = data.due_date;
  }

  const rows = await sql`
    INSERT INTO expenses (
      space_id, user_id, name, amount, currency, type,
      section_id, card_id,
      recurrence_frequency, recurrence_day, auto_debit, spread_monthly,
      is_progressive,
      due_date, next_due_date,
      reminder_offsets, notify_push, notify_email, notify_sms,
      notes, target_amount, target_date, saved_amount
    ) VALUES (
      ${spaceId}, ${userId},
      ${data.name},
      ${data.amount},
      COALESCE(${data.currency ?? null},(SELECT default_currency FROM space_settings WHERE space_id=${spaceId})),
      ${data.type},
      ${data.section_id ?? null},
      ${data.card_id ?? null},
      ${data.recurrence_frequency ?? null},
      ${data.recurrence_day ?? null},
      ${data.auto_debit ?? false},
      ${data.spread_monthly ?? false},
      ${data.is_progressive ?? false},
      ${data.due_date ?? null},
      ${next_due_date},
      COALESCE(${data.reminder_offsets ?? null}::integer[],(SELECT default_reminder_offsets FROM space_settings WHERE space_id=${spaceId})),
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

  const record = requireFinancialRecord(rows[0]);
  revalidateSpace(spaceId);
  return record as Expense;
}

export async function updateExpense(
  spaceId: string,
  id: string,
  data: UpdateExpenseData,
): Promise<Expense> {
  validateInput(idSchema, id);
  data = validateInput(UpdateExpenseDataSchema, data);
  await requireSpace(spaceId);
  await requireFinancialParents(spaceId,data);
  const scheduleChanged = data.type !== undefined || data.recurrence_frequency !== undefined || data.recurrence_day !== undefined || data.due_date !== undefined;
  let next_due_date: string | null | undefined;
  let revision: string | null = null;
  if (scheduleChanged) {
    const current = requireFinancialRecord((await sql`SELECT e.*,md5(to_jsonb(e)::text) AS revision FROM expenses e
      WHERE e.id=${id} AND e.space_id=${spaceId}`)[0]);
    revision = current.revision;
    const frequency = data.recurrence_frequency === undefined ? current.recurrence_frequency : data.recurrence_frequency;
    const day = data.recurrence_day === undefined ? current.recurrence_day : data.recurrence_day;
    const type = data.type ?? current.type;
    next_due_date = data.due_date !== undefined ? data.due_date
      : type === "RECURRING" && frequency && day ? calcNextDueDate(frequency,day).toISOString().split("T")[0]
      : current.next_due_date;
  }
  const refreshInstances = data.amount !== undefined || scheduleChanged || data.spread_monthly !== undefined
    || data.card_id !== undefined || data.section_id !== undefined || data.auto_debit !== undefined || data.is_progressive !== undefined;
  const month = currentMonth();
  const rows = await sql`
    WITH changed AS (UPDATE expenses SET
      name = COALESCE(${data.name ?? null}, name),
      amount = COALESCE(${data.amount ?? null}, amount),
      currency = COALESCE(${data.currency ?? null}, currency),
      type = COALESCE(${data.type ?? null}, type),
      section_id = CASE WHEN ${data.section_id !== undefined} THEN ${data.section_id ?? null} ELSE section_id END,
      card_id = CASE WHEN ${data.card_id !== undefined} THEN ${data.card_id ?? null} ELSE card_id END,
      recurrence_frequency = CASE WHEN ${data.recurrence_frequency !== undefined} THEN ${data.recurrence_frequency ?? null} ELSE recurrence_frequency END,
      recurrence_day = CASE WHEN ${data.recurrence_day !== undefined} THEN ${data.recurrence_day ?? null} ELSE recurrence_day END,
      auto_debit = COALESCE(${data.auto_debit ?? null}, auto_debit),
      spread_monthly = COALESCE(${data.spread_monthly ?? null}, spread_monthly),
      is_progressive = CASE WHEN ${data.is_progressive !== undefined} THEN ${data.is_progressive ?? false} ELSE is_progressive END,
      due_date = CASE WHEN ${data.due_date !== undefined} THEN ${data.due_date ?? null} ELSE due_date END,
      next_due_date = CASE WHEN ${next_due_date !== undefined} THEN ${next_due_date ?? null} ELSE next_due_date END,
      notes = CASE WHEN ${data.notes !== undefined} THEN ${data.notes ?? null} ELSE notes END,
      target_amount = CASE WHEN ${data.target_amount !== undefined} THEN ${data.target_amount ?? null} ELSE target_amount END,
      target_date = CASE WHEN ${data.target_date !== undefined} THEN ${data.target_date ?? null} ELSE target_date END,
      saved_amount = COALESCE(${data.saved_amount ?? null}, saved_amount),
      reminder_offsets = COALESCE(${data.reminder_offsets ?? null}::integer[],reminder_offsets),
      notify_push = COALESCE(${data.notify_push ?? null},notify_push),
      notify_email = COALESCE(${data.notify_email ?? null},notify_email),
      notify_sms = COALESCE(${data.notify_sms ?? null},notify_sms),
      updated_at = NOW()
    WHERE id = ${id} AND space_id = ${spaceId}
      AND (NOT ${scheduleChanged} OR md5(to_jsonb(expenses)::text)=${revision})
    RETURNING *), cleanup AS (
      DELETE FROM monthly_expenses me USING changed e WHERE me.space_id=${spaceId} AND me.expense_id=e.id
        AND ${refreshInstances} AND me.status IN ('UPCOMING','OVERDUE') AND me.month>=${month}
        AND COALESCE(me.paid_amount,0)=0 AND NOT me.manually_edited
        AND NOT EXISTS(SELECT 1 FROM expense_transactions t WHERE t.space_id=me.space_id AND t.monthly_expense_id=me.id)
    ) SELECT * FROM changed
  `;


  const record = requireFinancialRecord(rows[0]);
  revalidateSpace(spaceId);
  return record as Expense;
}

export async function deleteExpense(spaceId: string, id: string): Promise<void> {
  validateInput(idSchema, id);
  await requireSpace(spaceId);
  const month = currentMonth();
  const rows = await sql`WITH changed AS (
    UPDATE expenses SET is_active=false,updated_at=now() WHERE space_id=${spaceId} AND id=${id} RETURNING id
  ), cleanup AS (
    DELETE FROM monthly_expenses me USING changed e WHERE me.space_id=${spaceId} AND me.expense_id=e.id
      AND me.status IN ('UPCOMING','OVERDUE') AND me.month>=${month} AND COALESCE(me.paid_amount,0)=0
      AND NOT EXISTS(SELECT 1 FROM expense_transactions t WHERE t.space_id=me.space_id AND t.monthly_expense_id=me.id)
  ) SELECT id FROM changed`;
  requireFinancialRecord(rows[0]);
  revalidateSpace(spaceId);
}

export async function getExpensesByCard(spaceId: string, cardId: string): Promise<Expense[]> {
  validateInput(idSchema, cardId);
  await requireSpace(spaceId);
  const rows = await sql`
    SELECT
      e.*,
      row_to_json(s.*) as section,
      row_to_json(c.*) as card
    FROM expenses e
    LEFT JOIN sections s ON e.section_id = s.id AND s.space_id=e.space_id
    LEFT JOIN cards c ON e.card_id = c.id AND c.space_id=e.space_id
    WHERE e.is_active = true
      AND e.card_id = ${cardId}
      AND e.space_id = ${spaceId}
    ORDER BY e.created_at DESC
  `;
  return rows as Expense[];
}

// Planned monthly budget per section (computed from expense templates, not monthly_expenses)
export async function getMonthlySummaryBySection(spaceId: string): Promise<
  {
    section_id: string;
    section_name: string;
    section_icon: string;
    section_color: string;
    total: number;
  }[]
> {
  await requireSpace(spaceId);
  const rows = await sql`
    SELECT
      s.id as section_id,
      s.name as section_name,
      s.icon as section_icon,
      s.color as section_color,
      -- Multipliers must match WEEKLY_MONTHLY_MULTIPLIER and BIWEEKLY_MONTHLY_MULTIPLIER in lib/constants.ts
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
    LEFT JOIN expenses e ON e.section_id = s.id AND e.is_active = true AND e.space_id = ${spaceId}
    WHERE s.space_id = ${spaceId}
    GROUP BY s.id, s.name, s.icon, s.color, s.position
    ORDER BY s.position ASC
  `;
  return rows as {
    section_id: string;
    section_name: string;
    section_icon: string;
    section_color: string;
    total: number;
  }[];
}
