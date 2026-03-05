"use server";

import { revalidatePath } from "next/cache";
import { sql } from "@/lib/db";
import { requireAuth } from "@/lib/auth/helpers";
import type { MonthlyExpense, MonthSummary } from "@/lib/types";
import {
  WEEKLY_MONTHLY_MULTIPLIER,
  BIWEEKLY_MONTHLY_MULTIPLIER,
} from "@/lib/constants";
import { validateInput } from "@/lib/schemas/validate";
import {
  idSchema,
  monthSchema,
  nonNegativeAmountSchema,
} from "@/lib/schemas/common";

// Calculates the due_date for a RECURRING expense in a given month
function calcDueDateForMonth(
  expense: {
    recurrence_frequency: string | null;
    recurrence_day: number | null;
    next_due_date: string | null;
  },
  month: string,
): string | null {
  const [year, monthNum] = month.split("-").map(Number);

  // If next_due_date falls in this month, use it directly
  if (expense.next_due_date) {
    const nd = new Date(expense.next_due_date + "T00:00:00");
    if (nd.getFullYear() === year && nd.getMonth() + 1 === monthNum) {
      return expense.next_due_date;
    }
  }

  // For BIMONTHLY: only generate if this month is an even number of months from the reference
  if (expense.recurrence_frequency === "BIMONTHLY" && expense.recurrence_day) {
    if (expense.next_due_date) {
      const ref = new Date(expense.next_due_date + "T00:00:00");
      const diffMonths =
        (year - ref.getFullYear()) * 12 + (monthNum - (ref.getMonth() + 1));
      if (diffMonths % 2 !== 0) return null; // skip odd-offset months
    }
    const daysInMonth = new Date(year, monthNum, 0).getDate();
    const day = Math.min(expense.recurrence_day, daysInMonth);
    return `${year}-${String(monthNum).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  // For YEARLY: only generate in the due month
  if (expense.recurrence_frequency === "YEARLY" && expense.recurrence_day) {
    if (expense.next_due_date) {
      const ref = new Date(expense.next_due_date + "T00:00:00");
      const refMonth = ref.getMonth() + 1;
      if (monthNum !== refMonth) return null;
    }
    const daysInMonth = new Date(year, monthNum, 0).getDate();
    const day = Math.min(expense.recurrence_day, daysInMonth);
    return `${year}-${String(monthNum).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  // For QUARTERLY: generate in due_month, +3, +6, +9
  if (expense.recurrence_frequency === "QUARTERLY" && expense.recurrence_day) {
    if (expense.next_due_date) {
      const ref = new Date(expense.next_due_date + "T00:00:00");
      const refMonth = ref.getMonth() + 1;
      const diff = (((monthNum - refMonth) % 12) + 12) % 12; // positive modulo
      if (diff % 3 !== 0) return null;
    }
    const daysInMonth = new Date(year, monthNum, 0).getDate();
    const day = Math.min(expense.recurrence_day, daysInMonth);
    return `${year}-${String(monthNum).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  // For MONTHLY: generate every month
  if (expense.recurrence_frequency === "MONTHLY" && expense.recurrence_day) {
    const daysInMonth = new Date(year, monthNum, 0).getDate();
    const day = Math.min(expense.recurrence_day, daysInMonth);
    return `${year}-${String(monthNum).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  // For WEEKLY / BIWEEKLY: use the 1st of the month as fallback
  if (["WEEKLY", "BIWEEKLY"].includes(expense.recurrence_frequency || "")) {
    return `${year}-${String(monthNum).padStart(2, "0")}-01`;
  }

  return null;
}

// Generates monthly instances for a given month (idempotent — safe to call multiple times)
export async function generateMonthlyExpenses(month: string): Promise<void> {
  validateInput(monthSchema, month);
  const userId = await requireAuth();
  const [year, monthNum] = month.split("-").map(Number);
  const monthStart = `${year}-${String(monthNum).padStart(2, "0")}-01`;
  const daysInMonth = new Date(year, monthNum, 0).getDate();
  const monthEnd = `${year}-${String(monthNum).padStart(2, "0")}-${String(daysInMonth).padStart(2, "0")}`;

  // Fetch active RECURRING expenses
  const recurringExpenses = await sql`
    SELECT id, name, amount, section_id, card_id, auto_debit, spread_monthly,
           recurrence_frequency, recurrence_day, next_due_date, notes
    FROM expenses
    WHERE type = 'RECURRING'
      AND is_active = true
      AND user_id = ${userId}
  `;

  // Fetch ONE_TIME expenses whose next_due_date falls in this month
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

  // Monthly cost multipliers (non-monthly → monthly equivalent)
  // QUARTERLY and YEARLY are handled separately (full amount in due months, or spread_monthly path)
  const monthlyMultipliers: Record<string, number> = {
    WEEKLY: WEEKLY_MONTHLY_MULTIPLIER,
    BIWEEKLY: BIWEEKLY_MONTHLY_MULTIPLIER,
    MONTHLY: 1,
    BIMONTHLY: 1 / 2,
  };

  // Insert RECURRING instances
  for (const expense of recurringExpenses as {
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
  }[]) {
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
      const syntheticDueDate = `${year}-${String(monthNum).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

      await sql`
        INSERT INTO monthly_expenses
          (user_id, expense_id, month, name, amount, due_date, status, section_id, card_id, is_auto_charged, notes)
        VALUES
          (${userId}, ${expense.id}, ${month}, ${expense.name}, ${spreadAmount},
           ${syntheticDueDate}, 'UPCOMING', ${expense.section_id}, ${expense.card_id},
           ${expense.auto_debit}, ${expense.notes})
        ON CONFLICT (expense_id, month) DO NOTHING
      `;
      continue;
    }

    // Normal path: calcDueDateForMonth + skip guard
    const dueDate = calcDueDateForMonth(expense, month);

    // Skip non-due months for QUARTERLY/YEARLY (calcDueDateForMonth returns null)
    if (!dueDate && expense.recurrence_day && freq && freq !== "MONTHLY") {
      continue;
    }

    // For QUARTERLY/YEARLY without spread: full amount in due months only (multiplier = 1)
    // For other frequencies: use the monthly equivalent multiplier
    const multiplier =
      freq === "QUARTERLY" || freq === "YEARLY"
        ? 1
        : (monthlyMultipliers[freq ?? "MONTHLY"] ?? 1);
    const monthlyAmount = Math.round(expense.amount * multiplier * 100) / 100;

    await sql`
      INSERT INTO monthly_expenses
        (user_id, expense_id, month, name, amount, due_date, status, section_id, card_id, is_auto_charged, notes)
      VALUES
        (${userId}, ${expense.id}, ${month}, ${expense.name}, ${monthlyAmount},
         ${dueDate ?? null}, 'UPCOMING', ${expense.section_id}, ${expense.card_id},
         ${expense.auto_debit}, ${expense.notes})
      ON CONFLICT (expense_id, month) DO NOTHING
    `;
  }

  // Insert ONE_TIME instances
  for (const expense of oneTimeExpenses) {
    await sql`
      INSERT INTO monthly_expenses
        (user_id, expense_id, month, name, amount, due_date, status, section_id, card_id, is_auto_charged, notes)
      VALUES
        (${userId}, ${expense.id}, ${month}, ${expense.name}, ${expense.amount},
         ${expense.next_due_date}::date, 'UPCOMING', ${expense.section_id}, ${expense.card_id},
         ${expense.auto_debit}, ${expense.notes})
      ON CONFLICT (expense_id, month) DO NOTHING
    `;
  }

  // Insert DEBT payment instances
  const activeDebts = await sql`
    SELECT id, name, payment_amount, payment_frequency, payment_day,
           auto_debit, card_id, section_id, notes
    FROM debts
    WHERE is_active = true
      AND remaining_balance > 0
      AND user_id = ${userId}
  `;

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
    const dueDate = calcDueDateForMonth(
      {
        recurrence_frequency: debt.payment_frequency,
        recurrence_day: debt.payment_day,
        next_due_date: null,
      },
      month,
    );
    if (!dueDate) continue;

    await sql`
      INSERT INTO monthly_expenses
        (user_id, debt_id, month, name, amount, due_date, status, section_id, card_id, is_auto_charged, is_planned, notes)
      VALUES
        (${userId}, ${debt.id}, ${month}, ${debt.name + " (versement)"}, ${debt.payment_amount},
         ${dueDate}::date, 'UPCOMING', ${debt.section_id}, ${debt.card_id},
         ${debt.auto_debit}, true, ${debt.notes})
      ON CONFLICT (debt_id, month) WHERE debt_id IS NOT NULL DO NOTHING
    `;
  }

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
  await sql`
    UPDATE monthly_expenses
    SET status = 'PAID', paid_at = ${today}::date
    WHERE id = ${id} AND user_id = ${userId}
  `;

  // If this monthly expense is linked to a debt, decrement remaining_balance + log transaction
  const meRows = await sql`
    SELECT debt_id, amount, month FROM monthly_expenses
    WHERE id = ${id} AND user_id = ${userId} AND debt_id IS NOT NULL
  `;
  if (meRows.length > 0) {
    const { debt_id, amount, month } = meRows[0] as {
      debt_id: string;
      amount: number;
      month: string;
    };
    await sql`
      UPDATE debts SET
        remaining_balance = GREATEST(remaining_balance - ${amount}, 0),
        updated_at = NOW()
      WHERE id = ${debt_id} AND user_id = ${userId}
    `;
    // Auto-deactivate if fully paid off
    await sql`
      UPDATE debts SET is_active = false, updated_at = NOW()
      WHERE id = ${debt_id} AND user_id = ${userId} AND remaining_balance <= 0
    `;
    // Log the payment as a debt transaction
    await sql`
      INSERT INTO debt_transactions (user_id, debt_id, type, amount, month, note, source)
      VALUES (${userId}, ${debt_id}, 'PAYMENT', ${amount}, ${month}, 'Versement mensuel', 'MONTHLY_EXPENSE')
    `;
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
