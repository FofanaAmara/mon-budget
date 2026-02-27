export const dynamic = 'force-dynamic';

import { getMonthlySummaryBySection, getPlannedExpenses } from '@/lib/actions/expenses';
import { getTotalDebtBalance } from '@/lib/actions/debts';
import {
  generateMonthlyExpenses,
  getMonthlyExpenses,
  getMonthSummary,
  autoMarkOverdue,
  autoMarkPaidForAutoDebit,
} from '@/lib/actions/monthly-expenses';
import { getMonthlyIncomeTotal } from '@/lib/actions/incomes';
import {
  generateMonthlyIncomes,
  getMonthlyIncomeSummary,
} from '@/lib/actions/monthly-incomes';
import { hasOrphanedData, ensureDefaultSections } from '@/lib/actions/claim';
import { currentMonth } from '@/lib/utils';
import AccueilClient from '@/components/AccueilClient';
import ClaimBanner from '@/components/ClaimBanner';
import NotificationPermission from '@/components/NotificationPermission';

type PageProps = {
  searchParams: Promise<{ month?: string }>;
};

export default async function AccueilPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const month = params.month ?? currentMonth();

  // Ensure new users have default sections
  await ensureDefaultSections();

  // Check for orphaned data (pre-auth migration)
  const showClaimBanner = await hasOrphanedData();

  // Ensure instances exist for this month (idempotent)
  await generateMonthlyExpenses(month);
  await generateMonthlyIncomes(month);

  // Auto-mark statuses for current month only
  if (month === currentMonth()) {
    await autoMarkOverdue(month);
    await autoMarkPaidForAutoDebit(month);
  }

  const [expenses, summary, incomeSummary, sectionSummary, monthlyIncomeFromTemplates, projets, totalDebtBalance] = await Promise.all([
    getMonthlyExpenses(month),
    getMonthSummary(month),
    getMonthlyIncomeSummary(month),
    getMonthlySummaryBySection(),
    getMonthlyIncomeTotal(),
    getPlannedExpenses(),
    getTotalDebtBalance(),
  ]);

  const totalMonthlyExpenses = sectionSummary.reduce((sum, s) => sum + Number(s.total), 0);

  return (
    <>
      <NotificationPermission />
      {showClaimBanner && <div style={{ padding: '20px 20px 0' }}><ClaimBanner /></div>}
      <AccueilClient
        summary={summary}
        incomeSummary={{ expectedTotal: incomeSummary.expectedTotal, actualTotal: incomeSummary.actualTotal }}
        expenses={expenses}
        monthlyIncomes={incomeSummary.items}
        month={month}
        monthlyIncomeFromTemplates={monthlyIncomeFromTemplates}
        totalMonthlyExpenses={totalMonthlyExpenses}
        projets={projets}
        totalDebtBalance={totalDebtBalance}
      />
    </>
  );
}
