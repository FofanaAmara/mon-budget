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
  const d = typeof date === 'string' ? new Date(date) : date;
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
  if (expense.type === 'ONE_TIME') return expense.amount;
  if (!expense.recurrence_frequency) return expense.amount;

  const multipliers: Record<RecurrenceFrequency, number> = {
    WEEKLY: 52 / 12,
    BIWEEKLY: 26 / 12,
    MONTHLY: 1,
    QUARTERLY: 1 / 3,
    YEARLY: 1 / 12,
  };

  return expense.amount * (multipliers[expense.recurrence_frequency] ?? 1);
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
 * Normalize income amount to monthly equivalent
 */
export function calcMonthlyIncome(amount: number, frequency: IncomeFrequency): number {
  switch (frequency) {
    case 'MONTHLY': return amount;
    case 'BIWEEKLY': return (amount * 26) / 12;
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
