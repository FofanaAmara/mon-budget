"use server";

import { revalidatePath } from "next/cache";
import { sql } from "@/lib/db";
import { requireAuth } from "@/lib/auth/helpers";
import type { MonthlyExpense, MonthSummary } from "@/lib/types";
import {
  WEEKLY_MONTHLY_MULTIPLIER,
  BIWEEKLY_MONTHLY_MULTIPLIER,
} from "@/lib/constants";
import { calcDueDateForMonth, formatDueDate } from "@/lib/utils";
import { validateInput } from "@/lib/schemas/validate";
import {
  idSchema,
  monthSchema,
  nonNegativeAmountSchema,
} from "@/lib/schemas/common";

// --- Sub-functions for generateMonthlyExpenses (I/O — stay in server action) ---

type RecurringExpenseRow = {
  id: string;
  name: string;
  amount: number;
  section_id: string | null;
  card_id: string | null;
  auto_debit: boolean;
  spread_monthly: boolean;
  recurrence_frequency: string | null;
  recurrence_day: number | null;
  next_due_date: string | null;
  notes: string | null;
};

/** Monthly cost multipliers (non-monthly → monthly equivalent) */
const MONTHLY_MULTIPLIERS: Record<string, number> = {
  WEEKLY: WEEKLY_MONTHLY_MULTIPLIER,
  BIWEEKLY: BIWEEKLY_MONTHLY_MULTIPLIER,
  MONTHLY: 1,
  BIMONTHLY: 1 / 2,
};

async function generateRecurringInstances(
  userId: string,
  month: string,
  year: number,
  monthNum: number,
): Promise<void> {
  const recurringExpenses = await sql`
    SELECT id, name, amount, section_id, card_id, auto_debit, spread_monthly,
           recurrence_frequency, recurrence_day, next_due_date, notes
    FROM expenses
    WHERE type = 'RECURRING'
      AND is_active = true
      AND user_id = ${userId}
  `;

  const inserts: Promise<unknown>[] = [];

  for (const expense of recurringExpenses as RecurringExpenseRow[]) {
    const freq = expense.recurrence_frequency;

    // spread_monthly path: generate every month with divided amount
    // Runs BEFORE calcDueDateForMonth to avoid being skipped by the non-due-month guard
    if (expense.spread_monthly && (freq === "QUARTERLY" || freq === "YEARLY")) {
      const periodCount = freq === "QUARTERLY" ? 3 : 12;
      const spreadAmount =
        Math.round((expense.amount / periodCount) * 100) / 100;
      const daysInMonth = new Date(year, monthNum, 0).getDate();
      const day = expense.recurrence_day
        ? Math.min(expense.recurrence_day, daysInMonth)
        : 1;
      const syntheticDueDate = formatDueDate(year, monthNum, day);

      inserts.push(sql`
        INSERT INTO monthly_expenses
          (user_id, expense_id, month, name, amount, due_date, status, section_id, card_id, is_auto_charged, notes)
        VALUES
          (${userId}, ${expense.id}, ${month}, ${expense.name}, ${spreadAmount},
           ${syntheticDueDate}, 'UPCOMING', ${expense.section_id}, ${expense.card_id},
           ${expense.auto_debit}, ${expense.notes})
        ON CONFLICT (expense_id, month) DO NOTHING
      `);
      continue;
    }

    // Normal path: calcDueDateForMonth + skip guard
    // Cast DB string to RecurrenceFrequency at the call site (type safety per M-01)
    const dueDate = calcDueDateForMonth(
      {
        recurrence_frequency:
          (freq as import("@/lib/types").RecurrenceFrequency) ?? null,
        recurrence_day: expense.recurrence_day,
        next_due_date: expense.next_due_date,
      },
      month,
    );

    // Skip non-due months for QUARTERLY/YEARLY (calcDueDateForMonth returns null)
    if (!dueDate && expense.recurrence_day && freq && freq !== "MONTHLY") {
      continue;
    }

    // For QUARTERLY/YEARLY without spread: full amount in due months only (multiplier = 1)
    // For other frequencies: use the monthly equivalent multiplier
    const multiplier =
      freq === "QUARTERLY" || freq === "YEARLY"
        ? 1
        : (MONTHLY_MULTIPLIERS[freq ?? "MONTHLY"] ?? 1);
    const monthlyAmount = Math.round(expense.amount * multiplier * 100) / 100;

    inserts.push(sql`
      INSERT INTO monthly_expenses
        (user_id, expense_id, month, name, amount, due_date, status, section_id, card_id, is_auto_charged, notes)
      VALUES
        (${userId}, ${expense.id}, ${month}, ${expense.name}, ${monthlyAmount},
         ${dueDate ?? null}, 'UPCOMING', ${expense.section_id}, ${expense.card_id},
         ${expense.auto_debit}, ${expense.notes})
      ON CONFLICT (expense_id, month) DO NOTHING
    `);
  }

  if (inserts.length > 0) await Promise.all(inserts);
}

async function generateOneTimeInstances(
  userId: string,
  month: string,
  monthStart: string,
  monthEnd: string,
): Promise<void> {
  const oneTimeExpenses = await sql`
    SELECT id, name, amount, section_id, card_id, auto_debit, next_due_date, notes
    FROM expenses
    WHERE type = 'ONE_TIME'
      AND is_active = true
      AND user_id = ${userId}
      AND next_due_date IS NOT NULL
      AND next_due_date >= ${monthStart}::date
      AND next_due_date <= ${monthEnd}::date
  `;

  const inserts = oneTimeExpenses.map(
    (expense) => sql`
      INSERT INTO monthly_expenses
        (user_id, expense_id, month, name, amount, due_date, status, section_id, card_id, is_auto_charged, notes)
      VALUES
        (${userId}, ${expense.id}, ${month}, ${expense.name}, ${expense.amount},
         ${expense.next_due_date}::date, 'UPCOMING', ${expense.section_id}, ${expense.card_id},
         ${expense.auto_debit}, ${expense.notes})
      ON CONFLICT (expense_id, month) DO NOTHING
    `,
  );
  if (inserts.length > 0) await Promise.all(inserts);
}

async function generateDebtPaymentInstances(
  userId: string,
  month: string,
): Promise<void> {
  const activeDebts = await sql`
    SELECT id, name, payment_amount, payment_frequency, payment_day,
           auto_debit, card_id, section_id, notes
    FROM debts
    WHERE is_active = true
      AND remaining_balance > 0
      AND user_id = ${userId}
  `;

  const inserts: Promise<unknown>[] = [];

  for (const debt of activeDebts as {
    id: string;
    name: string;
    payment_amount: number;
    payment_frequency: string;
    payment_day: number | null;
    auto_debit: boolean;
    card_id: string | null;
    section_id: string | null;
    notes: string | null;
  }[]) {
    // Cast DB string to RecurrenceFrequency at the call site
    const dueDate = calcDueDateForMonth(
      {
        recurrence_frequency:
          (debt.payment_frequency as import("@/lib/types").RecurrenceFrequency) ??
          null,
        recurrence_day: debt.payment_day,
        next_due_date: null,
      },
      month,
    );
    if (!dueDate) continue;

    inserts.push(sql`
      INSERT INTO monthly_expenses
        (user_id, debt_id, month, name, amount, due_date, status, section_id, card_id, is_auto_charged, is_planned, notes)
      VALUES
        (${userId}, ${debt.id}, ${month}, ${debt.name + " (versement)"}, ${debt.payment_amount},
         ${dueDate}::date, 'UPCOMING', ${debt.section_id}, ${debt.card_id},
         ${debt.auto_debit}, true, ${debt.notes})
      ON CONFLICT (debt_id, month) WHERE debt_id IS NOT NULL DO NOTHING
    `);
  }

  if (inserts.length > 0) await Promise.all(inserts);
}

// Generates monthly instances for a given month (idempotent — safe to call multiple times)
export async function generateMonthlyExpenses(month: string): Promise<void> {
  validateInput(monthSchema, month);
  const userId = await requireAuth();
  const [year, monthNum] = month.split("-").map(Number);
  const monthStart = formatDueDate(year, monthNum, 1);
  const daysInMonth = new Date(year, monthNum, 0).getDate();
  const monthEnd = formatDueDate(year, monthNum, daysInMonth);

  await generateRecurringInstances(userId, month, year, monthNum);
  await generateOneTimeInstances(userId, month, monthStart, monthEnd);
  await generateDebtPaymentInstances(userId, month);

  // Note: no revalidatePath here — this is called during page render
}

// Fetch monthly expenses for a month, with optional section filter
export async function getMonthlyExpenses(
  month: string,
  sectionId?: string,
): Promise<MonthlyExpense[]> {
  validateInput(monthSchema, month);
  if (sectionId) validateInput(idSchema, sectionId);
  const userId = await requireAuth();
  const rows = sectionId
    ? await sql`
        SELECT
          me.*,
          row_to_json(s.*) as section,
          row_to_json(c.*) as card
        FROM monthly_expenses me
        LEFT JOIN sections s ON me.section_id = s.id
        LEFT JOIN cards c ON me.card_id = c.id
        WHERE me.month = ${month}
          AND me.section_id = ${sectionId}
          AND me.user_id = ${userId}
        ORDER BY
          CASE me.status
            WHEN 'OVERDUE' THEN 1
            WHEN 'UPCOMING' THEN 2
            WHEN 'DEFERRED' THEN 3
            WHEN 'PAID' THEN 4
          END,
          me.due_date DESC NULLS LAST
      `
    : await sql`
        SELECT
          me.*,
          row_to_json(s.*) as section,
          row_to_json(c.*) as card
        FROM monthly_expenses me
        LEFT JOIN sections s ON me.section_id = s.id
        LEFT JOIN cards c ON me.card_id = c.id
        WHERE me.month = ${month}
          AND me.user_id = ${userId}
        ORDER BY
          CASE me.status
            WHEN 'OVERDUE' THEN 1
            WHEN 'UPCOMING' THEN 2
            WHEN 'DEFERRED' THEN 3
            WHEN 'PAID' THEN 4
          END,
          me.due_date DESC NULLS LAST
      `;

  return rows as MonthlyExpense[];
}

// Get month summary stats
export async function getMonthSummary(month: string): Promise<MonthSummary> {
  validateInput(monthSchema, month);
  const userId = await requireAuth();
  const rows = await sql`
    SELECT
      COUNT(*) as count,
      COALESCE(SUM(amount), 0) as total,
      COALESCE(SUM(amount) FILTER (WHERE is_planned = true), 0) as planned_total,
      COALESCE(SUM(amount) FILTER (WHERE is_planned = false), 0) as unplanned_total,
      COUNT(*) FILTER (WHERE status = 'PAID') as paid_count,
      COALESCE(SUM(amount) FILTER (WHERE status = 'PAID'), 0) as paid_total,
      COUNT(*) FILTER (WHERE status = 'OVERDUE') as overdue_count
    FROM monthly_expenses
    WHERE month = ${month} AND user_id = ${userId}
  `;

  const row = rows[0];
  return {
    count: Number(row.count),
    total: Number(row.total),
    planned_total: Number(row.planned_total),
    unplanned_total: Number(row.unplanned_total),
    paid_count: Number(row.paid_count),
    paid_total: Number(row.paid_total),
    overdue_count: Number(row.overdue_count),
  };
}

// Mark a monthly expense as PAID
export async function markAsPaid(id: string): Promise<void> {
  validateInput(idSchema, id);
  const userId = await requireAuth();
  const today = new Date().toISOString().split("T")[0];

  // Read debt link BEFORE transaction (non-interactive constraint)
  const meRows = await sql`
    SELECT debt_id, amount, month FROM monthly_expenses
    WHERE id = ${id} AND user_id = ${userId}
  `;

  const hasDebtLink = meRows.length > 0 && meRows[0].debt_id !== null;

  if (!hasDebtLink) {
    // No debt link: single query, no transaction needed
    await sql`
      UPDATE monthly_expenses
      SET status = 'PAID', paid_at = ${today}::date
      WHERE id = ${id} AND user_id = ${userId}
    `;
  } else {
    // Debt link: atomic update of status + debt balance + debt transaction log
    const { debt_id, amount, month } = meRows[0] as {
      debt_id: string;
      amount: number;
      month: string;
    };
    await sql.transaction((txn) => [
      txn`
        UPDATE monthly_expenses
        SET status = 'PAID', paid_at = ${today}::date
        WHERE id = ${id} AND user_id = ${userId}
      `,
      txn`
        UPDATE debts SET
          remaining_balance = GREATEST(remaining_balance - ${amount}, 0),
          updated_at = NOW()
        WHERE id = ${debt_id} AND user_id = ${userId}
      `,
      txn`
        UPDATE debts SET is_active = false, updated_at = NOW()
        WHERE id = ${debt_id} AND user_id = ${userId} AND remaining_balance <= 0
      `,
      txn`
        INSERT INTO debt_transactions (user_id, debt_id, type, amount, month, note, source)
        VALUES (${userId}, ${debt_id}, 'PAYMENT', ${amount}, ${month}, 'Versement mensuel', 'MONTHLY_EXPENSE')
      `,
    ]);
    revalidatePath("/projets");
  }

  revalidatePath("/depenses");
  revalidatePath("/");
}

// Defer a monthly expense to a future month.
// Marks the current instance DEFERRED (kept for traceability),
// and creates a new UPCOMING entry in the target month.
export async function deferExpenseToMonth(
  id: string,
  targetMonth: string,
): Promise<void> {
  validateInput(idSchema, id);
  validateInput(monthSchema, targetMonth);
  const userId = await requireAuth();

  // Fetch the current instance details
  const rows = await sql`
    SELECT name, amount, section_id, card_id, expense_id, month FROM monthly_expenses
    WHERE id = ${id} AND user_id = ${userId}
  `;
  if (rows.length === 0) return;
  const {
    name,
    amount,
    section_id,
    card_id,
    expense_id,
    month: sourceMonth,
  } = rows[0] as {
    name: string;
    amount: number;
    section_id: string | null;
    card_id: string | null;
    expense_id: string | null;
    month: string;
  };

  // Format source month label for the note
  const [sy, sm] = sourceMonth.split("-").map(Number);
  const sourceLabel = new Intl.DateTimeFormat("fr-CA", {
    month: "long",
    year: "numeric",
  }).format(new Date(sy, sm - 1, 1));

  // Mark current instance as DEFERRED
  await sql`
    UPDATE monthly_expenses SET status = 'DEFERRED', paid_at = NULL
    WHERE id = ${id} AND user_id = ${userId}
  `;

  const [ty, tm] = targetMonth.split("-").map(Number);
  const dueDate = `${targetMonth}-01`;
  await sql`
    INSERT INTO monthly_expenses
      (user_id, expense_id, month, name, amount, due_date, status, section_id, card_id, is_planned, notes)
    VALUES
      (${userId}, ${expense_id}, ${targetMonth}, ${name}, ${amount},
       ${dueDate}::date, 'UPCOMING', ${section_id}, ${card_id}, true,
       ${"Reporté depuis " + sourceLabel})
  `;

  revalidatePath("/depenses");
  revalidatePath("/");
}

// Revert a monthly expense back to UPCOMING
export async function markAsUpcoming(id: string): Promise<void> {
  validateInput(idSchema, id);
  const userId = await requireAuth();
  await sql`
    UPDATE monthly_expenses
    SET status = 'UPCOMING', paid_at = NULL
    WHERE id = ${id} AND user_id = ${userId}
  `;
  revalidatePath("/depenses");
  revalidatePath("/");
}

// Delete an adhoc/imprévue monthly expense (expense_id IS NULL — no template).
// Planned expenses linked to a template cannot be deleted this way.
export async function deleteMonthlyExpense(id: string): Promise<void> {
  validateInput(idSchema, id);
  const userId = await requireAuth();
  await sql`
    DELETE FROM monthly_expenses
    WHERE id = ${id} AND user_id = ${userId} AND expense_id IS NULL
  `;
  revalidatePath("/depenses");
  revalidatePath("/");
}

// Update the amount for a monthly expense (this month only — template unchanged).
// Use case: dépense prévue 100 $ mais a coûté 87 $, ou a été suspendue (→ 0 $).
export async function updateMonthlyExpenseAmount(
  id: string,
  newAmount: number,
): Promise<void> {
  validateInput(idSchema, id);
  validateInput(nonNegativeAmountSchema, newAmount);
  const userId = await requireAuth();
  await sql`
    UPDATE monthly_expenses
    SET amount = ${newAmount}
    WHERE id = ${id} AND user_id = ${userId}
  `;
  revalidatePath("/depenses");
  revalidatePath("/");
}

// Auto-mark OVERDUE: mark UPCOMING instances past their due_date as OVERDUE
export async function autoMarkOverdue(month: string): Promise<void> {
  validateInput(monthSchema, month);
  const userId = await requireAuth();
  const today = new Date().toISOString().split("T")[0];
  await sql`
    UPDATE monthly_expenses
    SET status = 'OVERDUE'
    WHERE month = ${month}
      AND status = 'UPCOMING'
      AND due_date IS NOT NULL
      AND due_date < ${today}::date
      AND is_auto_charged = false
      AND user_id = ${userId}
  `;
  // Note: no revalidatePath here — this is called during page render
}

// Auto-mark PAID for auto-charged expenses past their due_date
export async function autoMarkPaidForAutoDebit(month: string): Promise<void> {
  validateInput(monthSchema, month);
  const userId = await requireAuth();
  const today = new Date().toISOString().split("T")[0];
  await sql`
    UPDATE monthly_expenses
    SET status = 'PAID', paid_at = due_date
    WHERE month = ${month}
      AND status = 'UPCOMING'
      AND is_auto_charged = true
      AND due_date IS NOT NULL
      AND due_date <= ${today}::date
      AND user_id = ${userId}
  `;
  // Note: no revalidatePath here — this is called during page render
}
