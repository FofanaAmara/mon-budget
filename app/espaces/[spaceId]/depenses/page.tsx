
import { pageSpace } from "@/lib/spaces/page";
export const dynamic = 'force-dynamic';

import { getSections } from "@/lib/actions/financial/sections";
import { getCards } from "@/lib/actions/financial/cards";
import {
  generateMonthlyExpenses,
  getMonthlyExpenses,
  getMonthSummary,
  autoMarkOverdue,
  autoMarkPaidForAutoDebit,
} from "@/lib/actions/financial/monthly-expenses";
import { currentMonth } from '@/lib/utils';
import DepensesTrackingClient from '@/components/DepensesTrackingClient';

type PageProps = {
  params: Promise<{spaceId:string}>;
  searchParams: Promise<{ month?: string }>;
};

export default async function DepensesPage({params,  searchParams }: PageProps) {
  const spaceId = await pageSpace(params);

  const query = await searchParams;
  const month = query.month ?? currentMonth();

  // Ensure instances exist for this month (idempotent)
  await generateMonthlyExpenses(spaceId, month);

  // Auto-mark statuses for current month only
  if (month === currentMonth()) {
    await autoMarkOverdue(spaceId, month);
    await autoMarkPaidForAutoDebit(spaceId, month);
  }

  const [expenses, summary, sections, cards] = await Promise.all([
    getMonthlyExpenses(spaceId, month),
    getMonthSummary(spaceId, month),
    getSections(spaceId),
    getCards(spaceId),
  ]);

  return (
    <DepensesTrackingClient
      expenses={expenses}
      summary={summary}
      sections={sections}
      cards={cards}
      month={month}
    />
  );
}
