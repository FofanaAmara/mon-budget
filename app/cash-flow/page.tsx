export const dynamic = 'force-dynamic';

import { getCashFlowData } from '@/lib/actions/cash-flow';
import { generateMonthlyIncomes } from '@/lib/actions/monthly-incomes';
import { generateMonthlyExpenses } from '@/lib/actions/monthly-expenses';
import { currentMonth } from '@/lib/utils';
import CashFlowClient from '@/components/CashFlowClient';

type PageProps = {
  searchParams: Promise<{ month?: string }>;
};

export default async function CashFlowPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const month = params.month ?? currentMonth();

  // Ensure instances are generated (idempotent)
  await generateMonthlyExpenses(month);
  await generateMonthlyIncomes(month);

  const data = await getCashFlowData(month);

  return <CashFlowClient data={data} month={month} />;
}
