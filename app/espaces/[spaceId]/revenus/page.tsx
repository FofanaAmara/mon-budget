
import { pageSpace } from "@/lib/spaces/page";
export const dynamic = "force-dynamic";

import {
  generateMonthlyIncomes,
  getMonthlyIncomeSummary,
  autoMarkReceivedForAutoDeposit,
} from "@/lib/actions/financial/monthly-incomes";
import { getIncomes } from "@/lib/actions/financial/incomes";
import {
  generateMonthlyAllocations,
  getMonthlyAllocations,
} from "@/lib/actions/financial/allocations";
import { getMonthlyExpenseActualsBySection } from "@/lib/actions/financial/monthly-expenses";
import { getPlannedExpenses } from "@/lib/actions/financial/savings";
import { getSections } from "@/lib/actions/financial/sections";
import { currentMonth } from "@/lib/utils";
import RevenusTrackingClient from "@/components/RevenusTrackingClient";

type PageProps = {
  params: Promise<{spaceId:string}>;
  searchParams: Promise<{ month?: string; tab?: string }>;
};

export default async function RevenusPage({params,  searchParams }: PageProps) {
  const spaceId = await pageSpace(params);

  const query = await searchParams;
  const month = query.month ?? currentMonth();

  // Ensure instances exist for this month (idempotent)
  await generateMonthlyIncomes(spaceId, month);
  await generateMonthlyAllocations(spaceId, month);

  // Auto-mark auto-deposit incomes as received for current month
  if (month === currentMonth()) {
    await autoMarkReceivedForAutoDeposit(spaceId, month);
  }

  const [
    incomeSummary,
    allIncomes,
    monthlyAllocations,
    sectionActuals,
    sections,
    projects,
  ] = await Promise.all([
    getMonthlyIncomeSummary(spaceId, month),
    getIncomes(spaceId),
    getMonthlyAllocations(spaceId, month),
    getMonthlyExpenseActualsBySection(spaceId, month),
    getSections(spaceId),
    getPlannedExpenses(spaceId),
  ]);

  return (
    <RevenusTrackingClient
      monthlyIncomes={incomeSummary.items}
      incomeSummary={{
        expectedTotal: incomeSummary.expectedTotal,
        actualTotal: incomeSummary.actualTotal,
      }}
      allIncomes={allIncomes}
      month={month}
      monthlyAllocations={monthlyAllocations}
      sectionActuals={sectionActuals}
      sections={sections}
      projects={projects}
      initialTab={query.tab === "allocation" ? "allocation" : "revenus"}
    />
  );
}
