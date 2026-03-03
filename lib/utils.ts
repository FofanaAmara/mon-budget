import type { Expense, IncomeFrequency, RecurrenceFrequency } from './types';

export function formatCAD(amount: number, currency = 'CAD'): string {
  return new Intl.NumberFormat('fr-CA', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  })
    .format(amount)
    .replace(/\u202f/g, '\u00a0'); // normalize narrow no-break space to regular no-break space
}

export function formatDate(date: string | Date | null): string {
  if (!date) return '—';
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('fr-CA', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(d);
}

export function formatShortDate(date: string | Date | null): string {
  if (!date) return '—';
  // Neon returns DATE columns as UTC-midnight Date objects; reconstruct using UTC parts to avoid UTC→local offset shift
  const d = typeof date === 'string'
    ? new Date(date.length === 10 ? date + 'T00:00:00' : date)
    : new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  return new Intl.DateTimeFormat('fr-CA', {
    day: '2-digit',
    month: 'short',
  }).format(d);
}


/**
 * Calculate the next due date for a recurring expense.
 * Returns the next occurrence on or after today.
 */
export function calcNextDueDate(
  frequency: RecurrenceFrequency,
  day: number
): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const next = new Date(today);

  if (frequency === 'MONTHLY') {
    // Set to the given day of current month
    next.setDate(day);
    // If that date is in the past, move to next month
    if (next <= today) {
      next.setMonth(next.getMonth() + 1);
      next.setDate(day);
    }
  } else if (frequency === 'WEEKLY') {
    const daysUntil = (day - today.getDay() + 7) % 7 || 7;
    next.setDate(today.getDate() + daysUntil);
  } else if (frequency === 'BIWEEKLY') {
    const daysUntil = (day - today.getDay() + 14) % 14 || 14;
    next.setDate(today.getDate() + daysUntil);
  } else if (frequency === 'BIMONTHLY') {
    next.setDate(day);
    if (next <= today) {
      next.setMonth(next.getMonth() + 2);
      next.setDate(day);
    }
  } else if (frequency === 'QUARTERLY') {
    next.setDate(day);
    if (next <= today) {
      next.setMonth(next.getMonth() + 3);
      next.setDate(day);
    }
  } else if (frequency === 'YEARLY') {
    next.setDate(day);
    if (next <= today) {
      next.setFullYear(next.getFullYear() + 1);
      next.setDate(day);
    }
  }

  return next;
}

/**
 * Calculate the monthly cost of an expense (normalized).
 */
export function calcMonthlyCost(expense: Expense): number {
  const amt = Number(expense.amount);
  if (expense.type === 'ONE_TIME') return amt;
  if (!expense.recurrence_frequency) return amt;

  const multipliers: Record<RecurrenceFrequency, number> = {
    WEEKLY: 52 / 12,
    BIWEEKLY: 26 / 12,
    MONTHLY: 1,
    BIMONTHLY: 1 / 2,
    QUARTERLY: 1 / 3,
    YEARLY: 1 / 12,
  };

  return amt * (multipliers[expense.recurrence_frequency] ?? 1);
}

/**
 * Returns "YYYY-MM" for a given Date
 */
export function toMonthKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

/**
 * Returns current month key as "YYYY-MM"
 */
export function currentMonth(): string {
  return toMonthKey(new Date());
}

/**
 * Normalize income amount to monthly equivalent.
 * For VARIABLE incomes, uses estimated_amount (returns 0 if not provided).
 */
export function calcMonthlyIncome(
  amount: number | null,
  frequency: IncomeFrequency,
  estimated_amount?: number | null
): number {
  if (frequency === 'VARIABLE') return estimated_amount ?? 0;
  if (amount === null) return 0;
  switch (frequency) {
    case 'MONTHLY': return amount;
    case 'BIWEEKLY': return amount * 2;
    case 'YEARLY': return amount / 12;
    default: return amount;
  }
}

/**
 * Calculate monthly savings needed to reach a planned goal
 */
export function calcMonthlySuggested(
  targetAmount: number,
  savedAmount: number,
  targetDate: string
): number {
  const now = new Date();
  const target = new Date(targetDate);
  const monthsRemaining =
    (target.getFullYear() - now.getFullYear()) * 12 + (target.getMonth() - now.getMonth());
  if (monthsRemaining <= 0 || targetAmount - savedAmount <= 0) return 0;
  return (targetAmount - savedAmount) / monthsRemaining;
}

/**
 * Count how many biweekly pay dates fall within a given month.
 * Walks forward/backward from anchorDate in 14-day steps.
 * @param anchorDate - A known pay date (ISO string "YYYY-MM-DD")
 * @param year - Full year (e.g. 2026)
 * @param month - 0-based month (0=Jan, 11=Dec)
 * @returns 2 (normal) or 3 (rich month)
 */
export function countBiweeklyPayDatesInMonth(
  anchorDate: string | Date,
  year: number,
  month: number
): number {
  const anchor = anchorDate instanceof Date
    ? new Date(anchorDate.getFullYear(), anchorDate.getMonth(), anchorDate.getDate())
    : new Date(String(anchorDate).slice(0, 10) + 'T00:00:00');
  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 0); // last day of month

  // Find the first pay date on or before monthStart
  let cursor = new Date(anchor);
  if (cursor > monthStart) {
    while (cursor > monthStart) {
      cursor.setDate(cursor.getDate() - 14);
    }
  } else {
    while (new Date(cursor.getTime() + 14 * 86400000) <= monthStart) {
      cursor.setDate(cursor.getDate() + 14);
    }
  }

  // Now walk forward counting dates within the month
  let count = 0;
  for (let i = 0; i < 5; i++) {
    if (cursor >= monthStart && cursor <= monthEnd) {
      count++;
    }
    cursor.setDate(cursor.getDate() + 14);
    if (cursor > monthEnd) break;
  }

  return count;
}

/**
 * Get the next biweekly pay date on or after today.
 * @param anchorDate - A known pay date (ISO string "YYYY-MM-DD")
 * @returns Date object of the next pay date
 */
export function getNextBiweeklyPayDate(anchorDate: string | Date): Date {
  const anchor = anchorDate instanceof Date
    ? new Date(anchorDate.getFullYear(), anchorDate.getMonth(), anchorDate.getDate())
    : new Date(String(anchorDate).slice(0, 10) + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let cursor = new Date(anchor);

  if (cursor >= today) {
    // Walk backward to find the closest future one
    while (cursor.getTime() - 14 * 86400000 >= today.getTime()) {
      cursor.setDate(cursor.getDate() - 14);
    }
    return cursor;
  }

  // Walk forward until we're on or after today
  while (cursor < today) {
    cursor.setDate(cursor.getDate() + 14);
  }
  return cursor;
}

/**
 * Returns days until a date (negative if past)
 */
export function daysUntil(date: string | Date | null): number {
  if (!date) return 999;
  const d = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}
