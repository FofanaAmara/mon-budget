"use server";

import { revalidatePath } from "next/cache";
import { sql } from "@/lib/db";
import { requireAuth } from "@/lib/auth/helpers";
import { calcNextDueDate, currentMonth } from "@/lib/utils";
import type { Expense } from "@/lib/types";
import { validateInput } from "@/lib/schemas/validate";
import { idSchema } from "@/lib/schemas/common";
import {
  CreateExpenseSchema,
  type CreateExpenseInput,
} from "@/lib/schemas/expense";

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
  validateInput(idSchema, id);
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
  return (rows[0] as Expense) ?? null;
}

export async function createExpense(
  data: CreateExpenseInput,
): Promise<Expense> {
  validateInput(CreateExpenseSchema, data);
  const userId = await requireAuth();
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
      user_id, name, amount, currency, type,
      section_id, card_id,
      recurrence_frequency, recurrence_day, auto_debit, spread_monthly,
      due_date, next_due_date,
      reminder_offsets, notify_push, notify_email, notify_sms,
      notes, target_amount, target_date, saved_amount
    ) VALUES (
      ${userId},
      ${data.name},
      ${data.amount},
      ${data.currency ?? "CAD"},
      ${data.type},
      ${data.section_id ?? null},
      ${data.card_id ?? null},
      ${data.recurrence_frequency ?? null},
      ${data.recurrence_day ?? null},
      ${data.auto_debit ?? false},
      ${data.spread_monthly ?? false},
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

  revalidatePath("/depenses");
  revalidatePath("/projets");
  revalidatePath("/parametres");
  revalidatePath("/parametres/charges");
  revalidatePath("/");
  return rows[0] as Expense;
}

export async function updateExpense(
  id: string,
  data: Partial<CreateExpenseInput>,
): Promise<Expense> {
  validateInput(idSchema, id);
  validateInput(CreateExpenseSchema.partial(), data);
  const userId = await requireAuth();
  // Recalculate next_due_date if recurrence fields changed
  let next_due_date: string | null | undefined = undefined;

  if (data.recurrence_frequency && data.recurrence_day) {
    const nextDate = calcNextDueDate(
      data.recurrence_frequency,
      data.recurrence_day,
    );
    next_due_date = nextDate.toISOString().split("T")[0];
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
      recurrence_frequency = CASE WHEN ${data.recurrence_frequency !== undefined} THEN ${data.recurrence_frequency ?? null} ELSE recurrence_frequency END,
      recurrence_day = CASE WHEN ${data.recurrence_day !== undefined} THEN ${data.recurrence_day ?? null} ELSE recurrence_day END,
      auto_debit = COALESCE(${data.auto_debit ?? null}, auto_debit),
      spread_monthly = COALESCE(${data.spread_monthly ?? null}, spread_monthly),
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

  // Invalidate stale monthly_expenses when financial fields change
  const hasFinancialChange =
    data.amount !== undefined ||
    data.recurrence_frequency !== undefined ||
    data.spread_monthly !== undefined ||
    data.recurrence_day !== undefined;

  if (hasFinancialChange) {
    const month = currentMonth();
    await sql`
      DELETE FROM monthly_expenses
      WHERE expense_id = ${id}
        AND user_id = ${userId}
        AND status IN ('UPCOMING', 'OVERDUE')
        AND month >= ${month}
    `;
  }

  revalidatePath("/depenses");
  revalidatePath("/projets");
  revalidatePath("/parametres");
  revalidatePath("/parametres/charges");
  revalidatePath("/");
  revalidatePath(`/depenses/${id}/edit`);
  return rows[0] as Expense;
}

export async function deleteExpense(id: string): Promise<void> {
  validateInput(idSchema, id);
  const userId = await requireAuth();
  await sql`UPDATE expenses SET is_active = false, updated_at = NOW() WHERE id = ${id} AND user_id = ${userId}`;

  // Remove stale future monthly_expenses for deactivated template
  const month = currentMonth();
  await sql`
    DELETE FROM monthly_expenses
    WHERE expense_id = ${id}
      AND user_id = ${userId}
      AND status IN ('UPCOMING', 'OVERDUE')
      AND month >= ${month}
  `;

  revalidatePath("/depenses");
  revalidatePath("/projets");
  revalidatePath("/parametres");
  revalidatePath("/parametres/charges");
  revalidatePath("/");
}

export async function getExpensesByCard(cardId: string): Promise<Expense[]> {
  validateInput(idSchema, cardId);
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

// Planned monthly budget per section (computed from expense templates, not monthly_expenses)
export async function getMonthlySummaryBySection(): Promise<
  {
    section_id: string;
    section_name: string;
    section_icon: string;
    section_color: string;
    total: number;
  }[]
> {
  const userId = await requireAuth();
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
    LEFT JOIN expenses e ON e.section_id = s.id AND e.is_active = true AND e.user_id = ${userId}
    WHERE s.user_id = ${userId}
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
