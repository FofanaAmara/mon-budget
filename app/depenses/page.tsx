export const dynamic = 'force-dynamic';

import { getSections } from '@/lib/actions/sections';
import {
  generateMonthlyExpenses,
  getMonthlyExpenses,
  getMonthSummary,
  autoMarkOverdue,
  autoMarkPaidForAutoDebit,
} from '@/lib/actions/monthly-expenses';
import { currentMonth } from '@/lib/utils';
import DepensesTrackingClient from '@/components/DepensesTrackingClient';

type PageProps = {
  searchParams: Promise<{ month?: string }>;
};

export default async function DepensesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const month = params.month ?? currentMonth();

  // Ensure instances exist for this month (idempotent)
  await generateMonthlyExpenses(month);

  // Auto-mark statuses for current month only
  if (month === currentMonth()) {
    await autoMarkOverdue(month);
    await autoMarkPaidForAutoDebit(month);
  }

  const [expenses, summary, sections] = await Promise.all([
    getMonthlyExpenses(month),
    getMonthSummary(month),
    getSections(),
  ]);

  return (
    <DepensesTrackingClient
      expenses={expenses}
      summary={summary}
      sections={sections}
      month={month}
    />
  );
}
