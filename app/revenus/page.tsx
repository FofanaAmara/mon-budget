export const dynamic = "force-dynamic";

import {
  generateMonthlyIncomes,
  getMonthlyIncomeSummary,
  autoMarkReceivedForAutoDeposit,
} from "@/lib/actions/monthly-incomes";
import { getIncomes } from "@/lib/actions/incomes";
import {
  generateMonthlyAllocations,
  getMonthlyAllocations,
} from "@/lib/actions/allocations";
import { getMonthlyExpenseActualsBySection } from "@/lib/actions/monthly-expenses";
import { getPlannedExpenses } from "@/lib/actions/savings";
import { getSections } from "@/lib/actions/sections";
import { currentMonth } from "@/lib/utils";
import RevenusTrackingClient from "@/components/RevenusTrackingClient";

type PageProps = {
  searchParams: Promise<{ month?: string; tab?: string }>;
};

export default async function RevenusPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const month = params.month ?? currentMonth();

  // Ensure instances exist for this month (idempotent)
  await generateMonthlyIncomes(month);
  await generateMonthlyAllocations(month);

  // Auto-mark auto-deposit incomes as received for current month
  if (month === currentMonth()) {
    await autoMarkReceivedForAutoDeposit(month);
  }

  const [
    incomeSummary,
    allIncomes,
    monthlyAllocations,
    sectionActuals,
    sections,
    projects,
  ] = await Promise.all([
    getMonthlyIncomeSummary(month),
    getIncomes(),
    getMonthlyAllocations(month),
    getMonthlyExpenseActualsBySection(month),
    getSections(),
    getPlannedExpenses(),
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
      initialTab={params.tab === "allocation" ? "allocation" : "revenus"}
    />
  );
}
