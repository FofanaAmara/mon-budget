export const dynamic = 'force-dynamic';

import { getMonthlySummaryBySection, getUpcomingExpenses, getPlannedExpenses } from '@/lib/actions/expenses';
import {
  generateMonthlyExpenses,
  getMonthSummary,
  autoMarkOverdue,
  autoMarkPaidForAutoDebit,
} from '@/lib/actions/monthly-expenses';
import { getMonthlyIncomeTotal, getIncomes } from '@/lib/actions/incomes';
import { generateMonthlyIncomes } from '@/lib/actions/monthly-incomes';
import { calcMonthlyIncome } from '@/lib/utils';
import { currentMonth } from '@/lib/utils';
import { formatCAD, daysUntil } from '@/lib/utils';
import NotificationPermission from '@/components/NotificationPermission';
import ResteAVivreWidget from '@/components/ResteAVivreWidget';
import ProjetsWidget from '@/components/ProjetsWidget';
import Link from 'next/link';

function getDueBadgeStyle(days: number): { bg: string; text: string } {
  if (days <= 1) return { bg: 'var(--negative-subtle)', text: 'var(--negative-text)' };
  if (days <= 3) return { bg: 'var(--warning-subtle)', text: 'var(--warning-text)' };
  return { bg: 'var(--accent-subtle)', text: 'var(--accent)' };
}

function formatDueLabel(days: number) {
  if (days < 0) return 'En retard';
  if (days === 0) return "Aujourd'hui";
  if (days === 1) return 'Demain';
  return `J-${days}`;
}

export default async function DashboardPage() {
  const month = currentMonth();

  await generateMonthlyExpenses(month);
  await generateMonthlyIncomes(month);
  await autoMarkOverdue(month);
  await autoMarkPaidForAutoDebit(month);

  const [sectionSummary, upcomingExpenses, monthSummary, monthlyIncome, projets, incomes] = await Promise.all([
    getMonthlySummaryBySection(),
    getUpcomingExpenses(7),
    getMonthSummary(month),
    getMonthlyIncomeTotal(),
    getPlannedExpenses(),
    getIncomes(),
  ]);

  const totalMonthly = sectionSummary.reduce((sum, s) => sum + Number(s.total), 0);

  const monthLabel = new Intl.DateTimeFormat('fr-CA', {
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  const hasNonZeroSections = sectionSummary.filter((s) => Number(s.total) > 0).length >= 3;
  const visibleSections = hasNonZeroSections
    ? sectionSummary.filter((s) => Number(s.total) > 0)
    : sectionSummary;

  return (
    <div style={{ paddingTop: '36px', paddingBottom: '96px' }}>
      <NotificationPermission />
      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* ── Header card — deep indigo gradient with warm depth ── */}
        <div
          style={{
            borderRadius: 'var(--radius-xl)',
            padding: '28px 24px 24px',
            color: 'var(--text-inverted)',
            position: 'relative',
            overflow: 'hidden',
            background: 'linear-gradient(145deg, #3D3BF3 0%, #2D2BCC 40%, #1A1980 100%)',
            boxShadow: '0 8px 32px rgba(61, 59, 243, 0.20), 0 2px 8px rgba(61, 59, 243, 0.10)',
          }}
        >
          {/* Decorative orbs — warm, organic */}
          <div style={{
            position: 'absolute', top: '-24px', right: '-24px',
            width: '120px', height: '120px', borderRadius: '50%',
            background: 'rgba(255,255,255,0.06)', pointerEvents: 'none',
          }} />
          <div style={{
            position: 'absolute', bottom: '-32px', left: '20%',
            width: '80px', height: '80px', borderRadius: '50%',
            background: 'rgba(255,255,255,0.04)', pointerEvents: 'none',
          }} />
          {/* Subtle grain overlay */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'radial-gradient(ellipse at 30% 20%, rgba(255,255,255,0.05) 0%, transparent 60%)',
            pointerEvents: 'none',
          }} />

          <div style={{ position: 'relative', zIndex: 1 }}>
            <div className="flex items-center justify-between" style={{ marginBottom: '20px' }}>
              <p style={{
                fontSize: 'var(--text-xs)',
                fontWeight: 650,
                textTransform: 'uppercase' as const,
                letterSpacing: 'var(--tracking-widest)',
                color: 'rgba(255,255,255,0.50)',
              }}>
                {monthLabel}
              </p>
              <span style={{
                fontSize: 'var(--text-xs)',
                fontWeight: 700,
                background: 'rgba(255,255,255,0.12)',
                padding: '4px 12px',
                borderRadius: 'var(--radius-full)',
                letterSpacing: '0.02em',
              }}>
                Mon Budget
              </span>
            </div>
            <p style={{
              fontSize: 'var(--text-xs)',
              color: 'rgba(255,255,255,0.55)',
              marginBottom: '4px',
              fontWeight: 500,
            }}>
              Total mensuel
            </p>
            <p className="amount" style={{
              fontSize: 'var(--text-3xl)',
              lineHeight: 'var(--leading-none)',
              fontWeight: 750,
              letterSpacing: '-0.03em',
            }}>
              {formatCAD(totalMonthly)}
            </p>
            <p style={{
              fontSize: 'var(--text-xs)',
              color: 'rgba(255,255,255,0.40)',
              marginTop: '12px',
              fontWeight: 500,
            }}>
              {sectionSummary.filter((s) => Number(s.total) > 0).length} section
              {sectionSummary.filter((s) => Number(s.total) > 0).length !== 1 ? 's' : ''} actives
            </p>
          </div>
        </div>

        {/* ── Reste a vivre ── */}
        <ResteAVivreWidget monthlyIncome={monthlyIncome} monthlyExpenses={totalMonthly} />

        {/* ── Projets planifies ── */}
        <ProjetsWidget projets={projets} />

        {/* ── Mon mois (progress) ── */}
        {monthSummary.count > 0 && (
          <Link href="/mon-mois" className="block card card-press">
            <div style={{ padding: '20px' }}>
              <div className="flex items-center justify-between" style={{ marginBottom: '12px' }}>
                <span className="section-label">Mon mois</span>
                <div className="flex items-center gap-2">
                  {monthSummary.overdue_count > 0 && (
                    <span className="badge" style={{
                      background: 'var(--negative-subtle)',
                      color: 'var(--negative-text)',
                    }}>
                      {monthSummary.overdue_count} en retard
                    </span>
                  )}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </div>
              </div>
              <div className="progress-track" style={{ marginBottom: '12px' }}>
                <div
                  className="progress-fill"
                  style={{
                    width: `${monthSummary.count > 0 ? Math.max((monthSummary.paid_count / monthSummary.count) * 100, 1) : 0}%`,
                    backgroundColor: monthSummary.paid_count === monthSummary.count ? 'var(--positive)' : 'var(--accent)',
                  }}
                />
              </div>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                <span className="amount" style={{ fontWeight: 600 }}>{monthSummary.paid_count}/{monthSummary.count}</span> complétées
                {' · '}
                <span className="amount" style={{ fontWeight: 600 }}>{formatCAD(monthSummary.paid_total)}</span> paye / {formatCAD(monthSummary.total)} total
              </p>
            </div>
          </Link>
        )}

        {/* ── Prochaines depenses (7 jours) ── */}
        <div className="card">
          <div style={{ padding: '20px' }}>
            <div className="flex items-center justify-between" style={{ marginBottom: '16px' }}>
              <span className="section-label">Prochaines depenses</span>
              {upcomingExpenses.length > 3 && (
                <Link href="/mon-mois" style={{
                  fontSize: 'var(--text-xs)', color: 'var(--accent)',
                  fontWeight: 600, textDecoration: 'none',
                }}>
                  Voir tout →
                </Link>
              )}
            </div>
            {upcomingExpenses.length === 0 ? (
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)' }}>
                Aucune depense a venir
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {upcomingExpenses.slice(0, 3).map((expense) => {
                  const days = expense.next_due_date ? daysUntil(expense.next_due_date) : 0;
                  const badgeStyle = getDueBadgeStyle(days);
                  return (
                    <div key={expense.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2" style={{ minWidth: 0 }}>
                        <span className="badge" style={{
                          background: badgeStyle.bg,
                          color: badgeStyle.text,
                          flexShrink: 0,
                        }}>
                          {formatDueLabel(days)}
                        </span>
                        <span style={{
                          fontSize: 'var(--text-sm)', color: 'var(--text-primary)',
                          fontWeight: 500,
                          overflow: 'hidden', textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap' as const, maxWidth: '140px',
                        }}>
                          {expense.name}
                        </span>
                      </div>
                      <span className="amount" style={{ fontSize: 'var(--text-sm)', flexShrink: 0 }}>
                        {formatCAD(expense.amount)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Prochaines entrees d'argent ── */}
        <div className="card">
          <div style={{ padding: '20px' }}>
            <div className="flex items-center justify-between" style={{ marginBottom: '16px' }}>
              <span className="section-label">Prochaines entrees</span>
              {incomes.length > 3 && (
                <Link href="/revenus" style={{
                  fontSize: 'var(--text-xs)', color: 'var(--accent)',
                  fontWeight: 600, textDecoration: 'none',
                }}>
                  Voir tout →
                </Link>
              )}
            </div>
            {incomes.length === 0 ? (
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)' }}>
                Aucun revenu configure
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {incomes.slice(0, 3).map((income) => {
                  const monthly = calcMonthlyIncome(income.amount, income.frequency, income.estimated_amount);
                  return (
                    <div key={income.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2" style={{ minWidth: 0 }}>
                        <span className="badge" style={{
                          background: 'var(--positive-subtle)',
                          color: 'var(--positive-text)',
                          flexShrink: 0,
                        }}>
                          +
                        </span>
                        <span style={{
                          fontSize: 'var(--text-sm)', color: 'var(--text-primary)',
                          fontWeight: 500,
                          overflow: 'hidden', textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap' as const, maxWidth: '140px',
                        }}>
                          {income.name}
                        </span>
                      </div>
                      <span className="amount" style={{ fontSize: 'var(--text-sm)', flexShrink: 0, color: 'var(--positive)' }}>
                        {formatCAD(monthly)}/mois
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Par section ── */}
        <div className="card">
          <div style={{ padding: '20px' }}>
            <span className="section-label" style={{ display: 'block', marginBottom: '16px' }}>
              Par section
            </span>
            {visibleSections.length === 0 || totalMonthly === 0 ? (
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)' }}>
                Aucune depense ce mois
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {visibleSections.map((section) => {
                  const amount = Number(section.total);
                  const pct = totalMonthly > 0 ? (amount / totalMonthly) * 100 : 0;
                  return (
                    <div key={section.section_id}>
                      <div className="flex items-center justify-between" style={{ marginBottom: '8px' }}>
                        <div className="flex items-center gap-2">
                          <div
                            style={{
                              width: '8px', height: '8px',
                              borderRadius: 'var(--radius-full)',
                              backgroundColor: section.section_color,
                              flexShrink: 0,
                            }}
                          />
                          <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)', fontWeight: 500 }}>
                            {section.section_icon} {section.section_name}
                          </span>
                        </div>
                        <span className="amount" style={{ fontSize: 'var(--text-sm)' }}>
                          {formatCAD(amount)}
                        </span>
                      </div>
                      <div className="progress-track">
                        <div
                          className="progress-fill"
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
        </div>

      </div>
    </div>
  );
}
