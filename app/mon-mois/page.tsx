export const dynamic = 'force-dynamic';

import { getSections } from '@/lib/actions/sections';
import MonMoisClient from '@/components/MonMoisClient';
import {
  generateMonthlyExpenses,
  getMonthlyExpenses,
  getMonthSummary,
  autoMarkOverdue,
  autoMarkPaidForAutoDebit,
} from '@/lib/actions/monthly-expenses';
import {
  generateMonthlyIncomes,
  getMonthlyIncomeSummary,
} from '@/lib/actions/monthly-incomes';
import { getIncomes } from '@/lib/actions/incomes';
import { currentMonth } from '@/lib/utils';

type PageProps = {
  searchParams: Promise<{ month?: string }>;
};

export default async function MonMoisPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const month = params.month ?? currentMonth();

  // Ensure instances exist for this month (idempotent)
  await generateMonthlyExpenses(month);
  await generateMonthlyIncomes(month);

  // Auto-mark statuses for current month only
  if (month === currentMonth()) {
    await autoMarkOverdue(month);
    await autoMarkPaidForAutoDebit(month);
  }

  const [expenses, summary, sections, incomeSummary, allIncomes] = await Promise.all([
    getMonthlyExpenses(month),
    getMonthSummary(month),
    getSections(),
    getMonthlyIncomeSummary(month),
    getIncomes(),
  ]);

  return (
    <MonMoisClient
      expenses={expenses}
      summary={summary}
      sections={sections}
      month={month}
      monthlyIncomes={incomeSummary.items}
      incomeSummary={{ expectedTotal: incomeSummary.expectedTotal, actualTotal: incomeSummary.actualTotal }}
      allIncomes={allIncomes}
    />
  );
}
