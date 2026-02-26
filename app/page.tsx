export const dynamic = 'force-dynamic';

import { getMonthlySummaryBySection, getUpcomingExpenses, getPlannedExpenses } from '@/lib/actions/expenses';
import {
  generateMonthlyExpenses,
  getMonthSummary,
  autoMarkOverdue,
  autoMarkPaidForAutoDebit,
} from '@/lib/actions/monthly-expenses';
import { getMonthlyIncomeTotal } from '@/lib/actions/incomes';
import { currentMonth } from '@/lib/utils';
import { formatCAD, daysUntil } from '@/lib/utils';
import NotificationPermission from '@/components/NotificationPermission';
import ResteAVivreWidget from '@/components/ResteAVivreWidget';
import ProjetsWidget from '@/components/ProjetsWidget';
import Link from 'next/link';

function getDueBadgeClass(days: number) {
  if (days <= 1) return 'bg-red-100 text-red-700';
  if (days <= 3) return 'bg-orange-100 text-orange-700';
  return 'bg-blue-100 text-blue-700';
}

function formatDueLabel(days: number) {
  if (days < 0) return 'En retard';
  if (days === 0) return "Aujourd'hui";
  if (days === 1) return 'Demain';
  return `J-${days}`;
}

export default async function DashboardPage() {
  const month = currentMonth();

  // Ensure monthly instances exist and statuses are up-to-date
  await generateMonthlyExpenses(month);
  await autoMarkOverdue(month);
  await autoMarkPaidForAutoDebit(month);

  const [sectionSummary, upcomingExpenses, monthSummary, monthlyIncome, projets] = await Promise.all([
    getMonthlySummaryBySection(),
    getUpcomingExpenses(7),
    getMonthSummary(month),
    getMonthlyIncomeTotal(),
    getPlannedExpenses(),
  ]);

  const totalMonthly = sectionSummary.reduce((sum, s) => sum + Number(s.total), 0);

  const monthLabel = new Intl.DateTimeFormat('fr-CA', {
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  const alerts = upcomingExpenses.filter(
    (e) => e.next_due_date && daysUntil(e.next_due_date) <= 3
  );

  const hasNonZeroSections = sectionSummary.filter((s) => Number(s.total) > 0).length >= 3;
  const visibleSections = hasNonZeroSections
    ? sectionSummary.filter((s) => Number(s.total) > 0)
    : sectionSummary;

  return (
    <div className="pt-8 pb-24 space-y-4">
      <NotificationPermission />
      <div className="px-4 space-y-4">
      {/* ── Header card ── */}
      <div className="rounded-3xl p-6 text-white relative overflow-hidden"
           style={{ background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)' }}>
        {/* Decorative circle */}
        <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-white/10 pointer-events-none" />
        <div className="absolute -bottom-8 -right-2 w-24 h-24 rounded-full bg-white/5 pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-white/60">
              {monthLabel}
            </p>
            <span className="text-xs font-bold bg-white/20 px-2.5 py-1 rounded-full">
              Mon Budget
            </span>
          </div>
          <p className="text-white/70 text-sm mb-1">Total mensuel</p>
          <p className="text-4xl font-bold tracking-tight leading-none">
            {formatCAD(totalMonthly)}
          </p>
          <p className="text-white/50 text-xs mt-2">
            {sectionSummary.filter((s) => Number(s.total) > 0).length} section
            {sectionSummary.filter((s) => Number(s.total) > 0).length !== 1 ? 's' : ''} actives
          </p>
        </div>
      </div>

      {/* ── Reste à vivre ── */}
      <ResteAVivreWidget monthlyIncome={monthlyIncome} monthlyExpenses={totalMonthly} />

      {/* ── Projets planifiés ── */}
      <ProjetsWidget projets={projets} />

      {/* ── Mon mois (barre de progression) ── */}
      {monthSummary.count > 0 && (
        <Link href="/mon-mois" className="block">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 active:bg-[#F8FAFC] transition-colors">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-[#1E293B] flex items-center gap-2">
                <span>📋</span> Mon mois
              </h2>
              <div className="flex items-center gap-2">
                {monthSummary.overdue_count > 0 && (
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-50 text-red-600">
                    {monthSummary.overdue_count} en retard
                  </span>
                )}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </div>
            </div>
            <div className="h-1.5 bg-[#F1F5F9] rounded-full overflow-hidden mb-2">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${monthSummary.count > 0 ? Math.max((monthSummary.paid_count / monthSummary.count) * 100, 1) : 0}%`,
                  backgroundColor: monthSummary.paid_count === monthSummary.count ? '#10B981' : '#2563EB',
                }}
              />
            </div>
            <p className="text-xs text-[#94A3B8]">
              {monthSummary.paid_count}/{monthSummary.count} complétées · {formatCAD(monthSummary.paid_total)} payé / {formatCAD(monthSummary.total)} total
            </p>
          </div>
        </Link>
      )}

      {/* ── Alertes ── */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4">
        <h2 className="text-sm font-semibold text-[#1E293B] mb-3 flex items-center gap-2">
          <span>🔔</span> Alertes
        </h2>
        {alerts.length === 0 ? (
          <div className="flex items-center gap-2 text-sm text-emerald-600">
            <span className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-xs">✓</span>
            Tout est à jour
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-[#94A3B8] mb-2">
              {alerts.length} dépense{alerts.length > 1 ? 's' : ''} dans moins de 3 jours
            </p>
            {alerts.map((expense) => {
              const days = expense.next_due_date ? daysUntil(expense.next_due_date) : 0;
              return (
                <div key={expense.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getDueBadgeClass(days)}`}>
                      {formatDueLabel(days)}
                    </span>
                    <span className="text-sm text-[#1E293B]">{expense.name}</span>
                  </div>
                  <span className="text-sm font-semibold text-[#1E293B]">
                    {formatCAD(expense.amount)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Prochaines dépenses (7 jours) ── */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4">
        <h2 className="text-sm font-semibold text-[#1E293B] mb-3 flex items-center gap-2">
          <span>📅</span> Prochaines (7 jours)
        </h2>
        {upcomingExpenses.length === 0 ? (
          <p className="text-sm text-[#94A3B8]">Aucune dépense à venir</p>
        ) : (
          <div className="space-y-2.5">
            {upcomingExpenses.map((expense) => {
              const days = expense.next_due_date ? daysUntil(expense.next_due_date) : 0;
              return (
                <div key={expense.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getDueBadgeClass(days)}`}>
                      {formatDueLabel(days)}
                    </span>
                    <span className="text-sm text-[#1E293B] truncate max-w-[140px]">{expense.name}</span>
                  </div>
                  <span className="text-sm font-semibold text-[#1E293B]">
                    {formatCAD(expense.amount)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Par section ── */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4">
        <h2 className="text-sm font-semibold text-[#1E293B] mb-3 flex items-center gap-2">
          <span>📊</span> Par section
        </h2>
        {visibleSections.length === 0 || totalMonthly === 0 ? (
          <p className="text-sm text-[#94A3B8]">Aucune dépense ce mois</p>
        ) : (
          <div className="space-y-3">
            {visibleSections.map((section) => {
              const amount = Number(section.total);
              const pct = totalMonthly > 0 ? (amount / totalMonthly) * 100 : 0;
              return (
                <div key={section.section_id}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: section.section_color }}
                      />
                      <span className="text-sm">{section.section_icon}</span>
                      <span className="text-sm text-[#1E293B]">{section.section_name}</span>
                    </div>
                    <span className="text-sm font-semibold text-[#1E293B]">
                      {formatCAD(amount)}
                    </span>
                  </div>
                  <div className="h-1.5 bg-[#F1F5F9] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.max(pct, 2)}%`,
                        backgroundColor: section.section_color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      </div> {/* end px-4 */}
    </div>
  );
}
