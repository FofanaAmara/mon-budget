/**
 * Month navigation utilities extracted from MonMoisClient.tsx.
 * Reused across DepensesTrackingClient, RevenusTrackingClient, AccueilClient.
 */

export function parseMonth(month: string): { year: number; monthNum: number } {
  const [y, m] = month.split('-').map(Number);
  return { year: y, monthNum: m };
}

export function monthLabel(month: string): string {
  const { year, monthNum } = parseMonth(month);
  return new Intl.DateTimeFormat('fr-CA', { month: 'long', year: 'numeric' })
    .format(new Date(year, monthNum - 1, 1));
}

export function prevMonth(month: string): string {
  const { year, monthNum } = parseMonth(month);
  const d = new Date(year, monthNum - 2, 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export function nextMonth(month: string): string {
  const { year, monthNum } = parseMonth(month);
  const d = new Date(year, monthNum, 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export { currentMonth as currentMonthKey } from '@/lib/utils';
