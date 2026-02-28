export const dynamic = 'force-dynamic';

import {
  generateMonthlyIncomes,
  getMonthlyIncomeSummary,
  autoMarkReceivedForAutoDeposit,
} from '@/lib/actions/monthly-incomes';
import { getIncomes } from '@/lib/actions/incomes';
import { currentMonth } from '@/lib/utils';
import RevenusTrackingClient from '@/components/RevenusTrackingClient';

type PageProps = {
  searchParams: Promise<{ month?: string }>;
};

export default async function RevenusPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const month = params.month ?? currentMonth();

  // Ensure instances exist for this month (idempotent)
  await generateMonthlyIncomes(month);

  // Auto-mark auto-deposit incomes as received for current month
  if (month === currentMonth()) {
    await autoMarkReceivedForAutoDeposit(month);
  }

  const [incomeSummary, allIncomes] = await Promise.all([
    getMonthlyIncomeSummary(month),
    getIncomes(),
  ]);

  return (
    <RevenusTrackingClient
      monthlyIncomes={incomeSummary.items}
      incomeSummary={{ expectedTotal: incomeSummary.expectedTotal, actualTotal: incomeSummary.actualTotal }}
      allIncomes={allIncomes}
      month={month}
    />
  );
}
