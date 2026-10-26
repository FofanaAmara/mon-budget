
import { pageSpace } from "@/lib/spaces/page";
export const dynamic = "force-dynamic";

import {
  getPlannedExpenses,
  getMonthlySavingsSummary,
} from "@/lib/actions/financial/savings";
import { getTotalDebtBalance } from "@/lib/actions/financial/debts";
import { getMonthlyDebtSummary } from "@/lib/actions/financial/debt-transactions";
import {
  generateMonthlyExpenses,
  getMonthlyExpenses,
  getMonthSummary,
  autoMarkOverdue,
  autoMarkPaidForAutoDebit,
} from "@/lib/actions/financial/monthly-expenses";
import { getMonthlySummaryBySection } from "@/lib/actions/financial/expenses";
import { getMonthlyIncomeTotal } from "@/lib/actions/financial/incomes";
import {
  generateMonthlyIncomes,
  getMonthlyIncomeSummary,
  autoMarkReceivedForAutoDeposit,
} from "@/lib/actions/financial/monthly-incomes";
import { ensureDefaultSections } from "@/lib/actions/financial/claim";
import { currentMonth } from "@/lib/utils";
import AccueilClient from "@/components/AccueilClient";
import NotificationPermission from "@/components/NotificationPermission";
import OnboardingCarouselWrapper from "@/components/onboarding/OnboardingCarouselWrapper";
import { hasSeenOnboarding } from "@/lib/actions/onboarding-carousel";

type PageProps = {
  params: Promise<{spaceId:string}>;
  searchParams: Promise<{ month?: string }>;
};

export default async function AccueilPage({params,  searchParams }: PageProps) {
  const spaceId = await pageSpace(params);

  const query = await searchParams;
  const month = query.month ?? currentMonth();

  // Onboarding carousel: check before any data setup (carousel doesn't need sections)
  const onboardingSeen = await hasSeenOnboarding();
  if (!onboardingSeen) {
    return <OnboardingCarouselWrapper />;
  }

  // Ensure new users have default sections
  await ensureDefaultSections(spaceId);


  // Ensure instances exist for this month (idempotent)
  await generateMonthlyExpenses(spaceId, month);
  await generateMonthlyIncomes(spaceId, month);

  // Auto-mark statuses for current month only
  if (month === currentMonth()) {
    await autoMarkOverdue(spaceId, month);
    await autoMarkPaidForAutoDebit(spaceId, month);
    await autoMarkReceivedForAutoDeposit(spaceId, month);
  }

  const [
    expenses,
    summary,
    incomeSummary,
    sectionSummary,
    monthlyIncomeFromTemplates,
    projets,
    totalDebtBalance,
    savingsSummary,
    debtSummary,
  ] = await Promise.all([
    getMonthlyExpenses(spaceId, month),
    getMonthSummary(spaceId, month),
    getMonthlyIncomeSummary(spaceId, month),
    getMonthlySummaryBySection(spaceId),
    getMonthlyIncomeTotal(spaceId),
    getPlannedExpenses(spaceId),
    getTotalDebtBalance(spaceId),
    getMonthlySavingsSummary(spaceId, month),
    getMonthlyDebtSummary(spaceId, month),
  ]);

  const totalMonthlyExpenses = sectionSummary.reduce(
    (sum, s) => sum + Number(s.total),
    0,
  );

  return (
    <>
      <NotificationPermission />
      <AccueilClient
        summary={summary}
        incomeSummary={{
          expectedTotal: incomeSummary.expectedTotal,
          actualTotal: incomeSummary.actualTotal,
        }}
        expenses={expenses}
        monthlyIncomes={incomeSummary.items}
        month={month}
        monthlyIncomeFromTemplates={monthlyIncomeFromTemplates}
        totalMonthlyExpenses={totalMonthlyExpenses}
        projets={projets}
        totalDebtBalance={totalDebtBalance}
        savingsSummary={savingsSummary}
        debtSummary={debtSummary}
      />
    </>
  );
}
