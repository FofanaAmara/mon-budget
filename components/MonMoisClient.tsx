'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { markAsPaid, markAsDeferred, markAsUpcoming } from '@/lib/actions/monthly-expenses';
import { markIncomeReceived, markVariableIncomeReceived } from '@/lib/actions/monthly-incomes';
import { formatCAD, formatShortDate } from '@/lib/utils';
import type { MonthlyExpense, MonthSummary, MonthlyExpenseStatus, Section, MonthlyIncome, Income, IncomeSource } from '@/lib/types';

type Props = {
  expenses: MonthlyExpense[];
  summary: MonthSummary;
  sections: Section[];
  month: string;
  monthlyIncomes: MonthlyIncome[];
  incomeSummary: { expectedTotal: number; actualTotal: number };
  allIncomes: Income[];
};

function parseMonth(month: string): { year: number; monthNum: number } {
  const [y, m] = month.split('-').map(Number);
  return { year: y, monthNum: m };
}

function monthLabel(month: string): string {
  const { year, monthNum } = parseMonth(month);
  return new Intl.DateTimeFormat('fr-CA', { month: 'long', year: 'numeric' })
    .format(new Date(year, monthNum - 1, 1));
}

function prevMonth(month: string): string {
  const { year, monthNum } = parseMonth(month);
  const d = new Date(year, monthNum - 2, 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

function nextMonth(month: string): string {
  const { year, monthNum } = parseMonth(month);
  const d = new Date(year, monthNum, 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

function currentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

const STATUS_LABELS: Record<MonthlyExpenseStatus, string> = {
  UPCOMING: 'A venir',
  PAID: 'Paye',
  OVERDUE: 'En retard',
  DEFERRED: 'Reporte',
};

const STATUS_STYLES: Record<MonthlyExpenseStatus, { bg: string; color: string }> = {
  UPCOMING: { bg: 'var(--accent-subtle)', color: 'var(--accent)' },
  PAID: { bg: 'var(--positive-subtle)', color: 'var(--positive-text)' },
  OVERDUE: { bg: 'var(--negative-subtle)', color: 'var(--negative-text)' },
  DEFERRED: { bg: 'var(--surface-sunken)', color: 'var(--text-tertiary)' },
};

const GROUP_ORDER: MonthlyExpenseStatus[] = ['OVERDUE', 'UPCOMING', 'DEFERRED', 'PAID'];
const GROUP_LABELS: Record<MonthlyExpenseStatus, string> = {
  OVERDUE: 'En retard',
  UPCOMING: 'A venir',
  DEFERRED: 'Reporte',
  PAID: 'Paye',
};

const SOURCE_META: Record<IncomeSource, { label: string; icon: string; color: string; bg: string }> = {
  EMPLOYMENT: { label: 'Emploi',         icon: '💼', color: '#2563EB', bg: '#EFF6FF' },
  BUSINESS:   { label: 'Business',       icon: '🏢', color: '#7C3AED', bg: '#F5F3FF' },
  INVESTMENT: { label: 'Investissement', icon: '📈', color: '#059669', bg: '#ECFDF5' },
  OTHER:      { label: 'Autre',          icon: '🔧', color: '#6B7280', bg: '#F9FAFB' },
};

const GROUP_PREVIEW_COUNT = 3;
const INCOME_PREVIEW_COUNT = 3;

export default function MonMoisClient({
  expenses, summary, sections, month,
  monthlyIncomes, incomeSummary, allIncomes,
}: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [groupModal, setGroupModal] = useState<{ status: MonthlyExpenseStatus; items: MonthlyExpense[] } | null>(null);
  const [showAllIncomes, setShowAllIncomes] = useState(false);
  const [receiveModal, setReceiveModal] = useState<{ income: MonthlyIncome | null; variableIncome: Income | null } | null>(null);
  const [receiveAmount, setReceiveAmount] = useState('');
  const [adhocModal, setAdhocModal] = useState(false);

  const today = currentMonthKey();
  const isCurrentMonth = month === today;

  const filtered = selectedSection
    ? expenses.filter((e) => e.section_id === selectedSection)
    : expenses;

  const grouped = GROUP_ORDER.map((status) => ({
    status,
    items: filtered.filter((e) => e.status === status),
  })).filter((g) => g.items.length > 0);

  const progressPct = summary.count > 0 ? (summary.paid_count / summary.count) * 100 : 0;

  // SOLDE = actual incomes received - paid expenses
  const solde = incomeSummary.actualTotal - summary.paid_total;
  const soldePositive = solde >= 0;

  // Variable incomes not yet in monthly_incomes for this month
  const variableIncomes = allIncomes.filter(i => i.frequency === 'VARIABLE');
  const variableInMonthly = new Set(monthlyIncomes.map(mi => mi.income_id));
  const unregisteredVariables = variableIncomes.filter(i => !variableInMonthly.has(i.id));

  function handleAction(id: string, action: 'paid' | 'deferred' | 'upcoming') {
    startTransition(async () => {
      if (action === 'paid') await markAsPaid(id);
      else if (action === 'deferred') await markAsDeferred(id);
      else await markAsUpcoming(id);
      router.refresh();
    });
  }

  function navigateMonth(target: string) {
    router.push(`/mon-mois?month=${target}`);
  }

  function openReceiveFixed(mi: MonthlyIncome) {
    setReceiveAmount(String(mi.expected_amount ?? ''));
    setReceiveModal({ income: mi, variableIncome: null });
  }

  function openReceiveVariable(inc: Income) {
    setReceiveAmount(String(inc.estimated_amount ?? ''));
    setReceiveModal({ income: null, variableIncome: inc });
  }

  async function handleMarkReceived() {
    if (!receiveModal) return;
    const amt = parseFloat(receiveAmount);
    if (isNaN(amt) || amt <= 0) return;
    startTransition(async () => {
      if (receiveModal.income) {
        await markIncomeReceived(receiveModal.income.id, amt);
      } else if (receiveModal.variableIncome) {
        await markVariableIncomeReceived(receiveModal.variableIncome.id, month, amt);
      }
      setReceiveModal(null);
      setReceiveAmount('');
      router.refresh();
    });
  }

  return (
    <div style={{ padding: '36px 20px 96px', minHeight: '100vh' }}>
      {/* Header with month navigation */}
      <div className="flex items-center justify-between" style={{ marginBottom: '24px' }}>
        <button
          onClick={() => navigateMonth(prevMonth(month))}
          style={{
            padding: '8px', color: 'var(--text-tertiary)',
            borderRadius: 'var(--radius-md)',
            transition: `all var(--duration-fast) var(--ease-out)`,
            background: 'none', border: 'none', cursor: 'pointer',
          }}
          aria-label="Mois precedent"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>

        <div className="text-center">
          <h1 style={{
            fontSize: 'var(--text-lg)', fontWeight: 750,
            color: 'var(--text-primary)',
            textTransform: 'capitalize' as const,
            letterSpacing: 'var(--tracking-tight)',
          }}>
            {monthLabel(month)}
          </h1>
          {!isCurrentMonth && (
            <button
              onClick={() => navigateMonth(today)}
              style={{
                fontSize: 'var(--text-xs)', color: 'var(--accent)',
                marginTop: '4px', background: 'none', border: 'none',
                cursor: 'pointer', fontWeight: 600,
              }}
            >
              Retour au mois actuel
            </button>
          )}
        </div>

        <button
          onClick={() => navigateMonth(nextMonth(month))}
          style={{
            padding: '8px',
            color: month >= today ? 'var(--border-default)' : 'var(--text-tertiary)',
            borderRadius: 'var(--radius-md)',
            transition: `all var(--duration-fast) var(--ease-out)`,
            background: 'none', border: 'none',
            cursor: month >= today ? 'default' : 'pointer',
          }}
          aria-label="Mois suivant"
          disabled={month >= today}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>

      {/* SOLDE hero card */}
      {(monthlyIncomes.length > 0 || incomeSummary.expectedTotal > 0) && (
        <div style={{
          borderRadius: 'var(--radius-lg)',
          padding: '20px',
          marginBottom: '16px',
          background: soldePositive
            ? 'linear-gradient(135deg, #059669, #047857)'
            : 'linear-gradient(135deg, #DC2626, #B91C1C)',
          color: 'white',
        }}>
          <p style={{ fontSize: 'var(--text-xs)', fontWeight: 600, opacity: 0.75, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '4px' }}>
            Solde du mois
          </p>
          <p className="amount" style={{ fontSize: 'var(--text-2xl)', fontWeight: 750, letterSpacing: 'var(--tracking-tight)' }}>
            {soldePositive ? '+' : ''}{formatCAD(solde)}
          </p>
          <div className="flex items-center" style={{ gap: '16px', marginTop: '12px', fontSize: 'var(--text-xs)', opacity: 0.85 }}>
            <span>↑ Reçu {formatCAD(incomeSummary.actualTotal)}</span>
            <span>↓ Payé {formatCAD(summary.paid_total)}</span>
          </div>
        </div>
      )}

      {/* Progress card */}
      <div className="card" style={{ padding: '20px', marginBottom: '16px' }}>
        <div className="flex items-center justify-between" style={{ marginBottom: '12px' }}>
          <span style={{ fontSize: 'var(--text-sm)', fontWeight: 650, color: 'var(--text-primary)' }}>
            {summary.paid_count}/{summary.count} depenses completees
          </span>
          {summary.overdue_count > 0 && (
            <span className="badge" style={{
              background: 'var(--negative-subtle)', color: 'var(--negative-text)',
            }}>
              {summary.overdue_count} en retard
            </span>
          )}
        </div>

        <div className="progress-track" style={{ marginBottom: '12px' }}>
          <div
            className="progress-fill"
            style={{
              width: `${Math.max(progressPct, summary.count > 0 ? 1 : 0)}%`,
              backgroundColor: progressPct >= 100 ? 'var(--positive)' : 'var(--accent)',
            }}
          />
        </div>

        <div className="flex items-center justify-between" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
          <span className="amount" style={{ fontWeight: 600 }}>{formatCAD(summary.paid_total)} paye</span>
          <span className="amount" style={{ fontWeight: 600 }}>{formatCAD(summary.total)} total</span>
        </div>
      </div>

      {/* ENTRÉES block */}
      {(monthlyIncomes.length > 0 || unregisteredVariables.length > 0) && (
        <div style={{ marginBottom: '20px' }}>
          <div className="flex items-center justify-between" style={{ marginBottom: '12px', paddingLeft: '4px' }}>
            <h2 className="section-label">
              Entrées ({monthlyIncomes.length + unregisteredVariables.length})
            </h2>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', fontWeight: 600 }}>
              Reçu : {formatCAD(incomeSummary.actualTotal)} / {formatCAD(incomeSummary.expectedTotal)}
            </span>
          </div>
          <div className="card" style={{ overflow: 'hidden' }}>
            {/* Fixed income instances */}
            {monthlyIncomes.slice(0, INCOME_PREVIEW_COUNT).map((mi, i) => (
              <IncomeInstanceRow
                key={mi.id}
                mi={mi}
                index={i}
                isCurrentMonth={isCurrentMonth}
                onMarkReceived={() => openReceiveFixed(mi)}
              />
            ))}
            {/* Unregistered variable incomes */}
            {unregisteredVariables.slice(0, Math.max(0, INCOME_PREVIEW_COUNT - Math.min(monthlyIncomes.length, INCOME_PREVIEW_COUNT))).map((inc, i) => (
              <VariableIncomeRow
                key={inc.id}
                inc={inc}
                index={Math.min(monthlyIncomes.length, INCOME_PREVIEW_COUNT) + i}
                isCurrentMonth={isCurrentMonth}
                onMarkReceived={() => openReceiveVariable(inc)}
              />
            ))}
            {/* Show all button */}
            {(monthlyIncomes.length + unregisteredVariables.length > INCOME_PREVIEW_COUNT) && (
              <button
                onClick={() => setShowAllIncomes(true)}
                style={{
                  width: '100%', padding: '12px 20px',
                  fontSize: 'var(--text-xs)', fontWeight: 600,
                  color: 'var(--accent)',
                  background: 'var(--surface-inset)',
                  borderTop: '1px solid var(--surface-sunken)',
                  cursor: 'pointer', border: 'none',
                  borderTopWidth: '1px', borderTopStyle: 'solid', borderTopColor: 'var(--surface-sunken)',
                }}
              >
                Voir tout ({monthlyIncomes.length + unregisteredVariables.length})
              </button>
            )}
          </div>
        </div>
      )}

      {/* Section filter */}
      {sections.length > 0 && (
        <div className="flex scrollbar-hide" style={{
          gap: '8px', overflowX: 'auto',
          paddingBottom: '4px', marginBottom: '16px',
        }}>
          <button
            onClick={() => setSelectedSection(null)}
            style={{
              flexShrink: 0, padding: '8px 16px',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--text-xs)', fontWeight: 600,
              transition: `all var(--duration-fast) var(--ease-out)`,
              background: selectedSection === null ? 'var(--text-primary)' : 'var(--surface-raised)',
              color: selectedSection === null ? 'var(--text-inverted)' : 'var(--text-tertiary)',
              border: selectedSection === null ? 'none' : '1.5px solid var(--border-default)',
              cursor: 'pointer',
            }}
          >
            Tout
          </button>
          {sections.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelectedSection(s.id === selectedSection ? null : s.id)}
              className="flex items-center"
              style={{
                flexShrink: 0, gap: '6px', padding: '8px 16px',
                borderRadius: 'var(--radius-md)',
                fontSize: 'var(--text-xs)', fontWeight: 600,
                transition: `all var(--duration-fast) var(--ease-out)`,
                background: selectedSection === s.id ? 'var(--text-primary)' : 'var(--surface-raised)',
                color: selectedSection === s.id ? 'var(--text-inverted)' : 'var(--text-tertiary)',
                border: selectedSection === s.id ? 'none' : '1.5px solid var(--border-default)',
                cursor: 'pointer',
              }}
            >
              <span>{s.icon}</span>
              <span>{s.name}</span>
            </button>
          ))}
        </div>
      )}

      {/* Empty state */}
      {expenses.length === 0 && (
        <div className="flex flex-col items-center justify-center text-center" style={{ padding: '80px 0' }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px', opacity: 0.6 }}>📅</div>
          <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)', marginBottom: '8px', fontWeight: 500 }}>
            Aucune depense ce mois
          </p>
          <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)', opacity: 0.7 }}>
            Les depenses recurrentes apparaissent automatiquement
          </p>
        </div>
      )}

      {/* Sorties label */}
      {expenses.length > 0 && (
        <h2 className="section-label" style={{ marginBottom: '12px', paddingLeft: '4px' }}>
          Sorties ({summary.count})
        </h2>
      )}

      {/* Grouped expenses by status */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {grouped.map(({ status, items }) => {
          const hasMore = items.length > GROUP_PREVIEW_COUNT;
          const visible = items.slice(0, GROUP_PREVIEW_COUNT);
          return (
            <div key={status}>
              <h2 className="section-label" style={{ marginBottom: '12px', paddingLeft: '4px' }}>
                {GROUP_LABELS[status]} ({items.length})
              </h2>
              <div className="card" style={{ overflow: 'hidden' }}>
                {visible.map((expense, i) => (
                  <div key={expense.id}>
                    {i > 0 && <div className="divider" style={{ marginLeft: '20px', marginRight: '20px' }} />}
                    <ExpenseRow
                      expense={expense}
                      isCurrentMonth={isCurrentMonth}
                      onAction={handleAction}
                    />
                  </div>
                ))}
                {hasMore && (
                  <button
                    onClick={() => setGroupModal({ status, items })}
                    style={{
                      width: '100%', padding: '12px 20px',
                      fontSize: 'var(--text-xs)', fontWeight: 600,
                      color: 'var(--accent)',
                      background: 'var(--surface-inset)',
                      borderTop: '1px solid var(--surface-sunken)',
                      cursor: 'pointer', border: 'none',
                      borderTopWidth: '1px', borderTopStyle: 'solid', borderTopColor: 'var(--surface-sunken)',
                    }}
                  >
                    Voir tout ({items.length})
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Adhoc FAB */}
      {isCurrentMonth && (
        <button
          onClick={() => setAdhocModal(true)}
          className="fab"
          aria-label="Ajouter une dépense adhoc"
          style={{ bottom: 'calc(var(--nav-height) + var(--safe-bottom) + 16px)' }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      )}

      {/* All incomes modal */}
      {showAllIncomes && (
        <div className="sheet-backdrop" onClick={(e) => e.target === e.currentTarget && setShowAllIncomes(false)}>
          <div className="sheet">
            <div className="sheet-handle" />
            <div style={{ padding: '8px 24px 32px' }}>
              <div className="flex items-center justify-between" style={{ marginBottom: '20px' }}>
                <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: 'var(--tracking-tight)' }}>
                  Toutes les entrées ({monthlyIncomes.length + unregisteredVariables.length})
                </h2>
                <button onClick={() => setShowAllIncomes(false)} className="icon-btn" aria-label="Fermer">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
              <div className="card" style={{ overflow: 'hidden' }}>
                {monthlyIncomes.map((mi, i) => (
                  <IncomeInstanceRow
                    key={mi.id} mi={mi} index={i}
                    isCurrentMonth={isCurrentMonth}
                    onMarkReceived={() => { setShowAllIncomes(false); openReceiveFixed(mi); }}
                  />
                ))}
                {unregisteredVariables.map((inc, i) => (
                  <VariableIncomeRow
                    key={inc.id} inc={inc} index={monthlyIncomes.length + i}
                    isCurrentMonth={isCurrentMonth}
                    onMarkReceived={() => { setShowAllIncomes(false); openReceiveVariable(inc); }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mark received modal */}
      {receiveModal && (
        <div className="sheet-backdrop" onClick={(e) => e.target === e.currentTarget && setReceiveModal(null)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-handle" />
            <div style={{ padding: '8px 24px 32px' }}>
              <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '20px' }}>
                Marquer reçu
              </h2>
              <div style={{ marginBottom: '20px' }}>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  {receiveModal.income?.income_name ?? receiveModal.variableIncome?.name}
                </p>
                <label className="field-label" style={{ marginTop: '16px' }}>Montant réellement reçu ($)</label>
                <input
                  type="number" min="0" step="0.01"
                  value={receiveAmount}
                  onChange={(e) => setReceiveAmount(e.target.value)}
                  className="input-field"
                  style={{ fontVariantNumeric: 'tabular-nums' }}
                  autoFocus
                />
              </div>
              <button
                onClick={handleMarkReceived}
                className="btn-primary"
                style={{ width: '100%', padding: '16px', fontSize: 'var(--text-base)' }}
              >
                Confirmer la réception
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Group detail modal */}
      {groupModal && (
        <div className="sheet-backdrop" onClick={(e) => e.target === e.currentTarget && setGroupModal(null)}>
          <div className="sheet">
            <div className="sheet-handle" />
            <div style={{ padding: '8px 24px 32px' }}>
              <div className="flex items-center justify-between" style={{ marginBottom: '20px' }}>
                <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: 'var(--tracking-tight)' }}>
                  {GROUP_LABELS[groupModal.status]} ({groupModal.items.length})
                </h2>
                <button onClick={() => setGroupModal(null)} className="icon-btn" aria-label="Fermer">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
              <div className="card" style={{ overflow: 'hidden' }}>
                {groupModal.items.map((expense, i) => (
                  <div key={expense.id}>
                    {i > 0 && <div className="divider" style={{ marginLeft: '20px', marginRight: '20px' }} />}
                    <ExpenseRow
                      expense={expense}
                      isCurrentMonth={isCurrentMonth}
                      onAction={(id, action) => { handleAction(id, action); setGroupModal(null); }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Adhoc modal */}
      {adhocModal && (
        <AdhocModal
          sections={sections}
          month={month}
          onClose={() => { setAdhocModal(false); router.refresh(); }}
        />
      )}
    </div>
  );
}

// ─── Income instance row (for fixed incomes with monthly_incomes entry) ────────

function IncomeInstanceRow({
  mi, index, isCurrentMonth, onMarkReceived,
}: {
  mi: MonthlyIncome; index: number; isCurrentMonth: boolean; onMarkReceived: () => void;
}) {
  const srcMeta = SOURCE_META[(mi.income_source ?? 'OTHER') as IncomeSource];
  const isReceived = mi.status === 'RECEIVED' || mi.status === 'PARTIAL';

  const statusBg = mi.status === 'RECEIVED' ? 'var(--positive-subtle)'
    : mi.status === 'PARTIAL' ? 'var(--warning-subtle)'
    : mi.status === 'MISSED' ? 'var(--negative-subtle)'
    : 'var(--surface-sunken)';
  const statusColor = mi.status === 'RECEIVED' ? 'var(--positive-text)'
    : mi.status === 'PARTIAL' ? 'var(--warning-text)'
    : mi.status === 'MISSED' ? 'var(--negative-text)'
    : 'var(--text-tertiary)';
  const statusLabel = mi.status === 'RECEIVED' ? 'Reçu'
    : mi.status === 'PARTIAL' ? 'Partiel'
    : mi.status === 'MISSED' ? 'Manqué'
    : 'Attendu';

  return (
    <div>
      {index > 0 && <div className="divider" style={{ marginLeft: '20px', marginRight: '20px' }} />}
      <div className="flex items-center" style={{ gap: '12px', padding: '12px 20px' }}>
        <div style={{
          width: '32px', height: '32px', borderRadius: 'var(--radius-md)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: srcMeta.bg, flexShrink: 0, fontSize: '14px',
        }}>
          {srcMeta.icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 'var(--text-sm)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {mi.income_name ?? '—'}
          </p>
          <div className="flex items-center" style={{ gap: '6px', marginTop: '3px' }}>
            <span style={{ fontSize: '10px', fontWeight: 600, padding: '1px 5px', borderRadius: '999px', background: statusBg, color: statusColor }}>
              {statusLabel}
            </span>
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          {isReceived && mi.actual_amount !== null ? (
            <span className="amount" style={{ fontSize: 'var(--text-sm)', color: 'var(--positive)' }}>
              {formatCAD(Number(mi.actual_amount))}
            </span>
          ) : (
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', fontVariantNumeric: 'tabular-nums' }}>
              ~{formatCAD(Number(mi.expected_amount ?? 0))}
            </span>
          )}
        </div>
        {isCurrentMonth && !isReceived && (
          <button
            onClick={onMarkReceived}
            style={{
              flexShrink: 0, padding: '6px 10px',
              fontSize: '11px', fontWeight: 650,
              color: 'var(--positive-text)',
              background: 'var(--positive-subtle)',
              borderRadius: 'var(--radius-sm)',
              border: 'none', cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            Reçu ✓
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Variable income row (not yet registered this month) ──────────────────────

function VariableIncomeRow({
  inc, index, isCurrentMonth, onMarkReceived,
}: {
  inc: Income; index: number; isCurrentMonth: boolean; onMarkReceived: () => void;
}) {
  const srcMeta = SOURCE_META[(inc.source ?? 'OTHER') as IncomeSource];

  return (
    <div>
      {index > 0 && <div className="divider" style={{ marginLeft: '20px', marginRight: '20px' }} />}
      <div className="flex items-center" style={{ gap: '12px', padding: '12px 20px' }}>
        <div style={{
          width: '32px', height: '32px', borderRadius: 'var(--radius-md)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: srcMeta.bg, flexShrink: 0, fontSize: '14px',
        }}>
          {srcMeta.icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 'var(--text-sm)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {inc.name}
          </p>
          <div className="flex items-center" style={{ gap: '6px', marginTop: '3px' }}>
            <span style={{ fontSize: '10px', fontWeight: 600, padding: '1px 5px', borderRadius: '999px', background: 'var(--surface-sunken)', color: 'var(--text-tertiary)' }}>
              Variable
            </span>
          </div>
        </div>
        <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
          {inc.estimated_amount ? `~${formatCAD(Number(inc.estimated_amount))}` : '—'}
        </span>
        {isCurrentMonth && (
          <button
            onClick={onMarkReceived}
            style={{
              flexShrink: 0, padding: '6px 10px',
              fontSize: '11px', fontWeight: 650,
              color: 'var(--accent)',
              background: 'var(--accent-subtle)',
              borderRadius: 'var(--radius-sm)',
              border: 'none', cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            Saisir
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Expense row ──────────────────────────────────────────────────────────────

function ExpenseRow({
  expense, isCurrentMonth, onAction,
}: {
  expense: MonthlyExpense; isCurrentMonth: boolean;
  onAction: (id: string, action: 'paid' | 'deferred' | 'upcoming') => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const statusStyle = STATUS_STYLES[expense.status];

  return (
    <div style={{ padding: '12px 20px' }}>
      <div className="flex items-center" style={{ gap: '12px' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 'var(--text-sm)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {expense.name}
          </p>
          <div className="flex items-center" style={{ gap: '8px', marginTop: '4px' }}>
            <span className="badge" style={{ background: statusStyle.bg, color: statusStyle.color }}>
              {STATUS_LABELS[expense.status]}
            </span>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
              {expense.is_auto_charged ? '· Auto' : ''}
              {expense.due_date ? ` · ${formatShortDate(expense.due_date)}` : ''}
            </span>
          </div>
        </div>

        <span className="amount" style={{ fontSize: 'var(--text-sm)', flexShrink: 0 }}>
          {formatCAD(Number(expense.amount))}
        </span>

        {isCurrentMonth && (
          <button
            onClick={() => setExpanded((v) => !v)}
            style={{
              padding: '8px', color: 'var(--text-tertiary)',
              borderRadius: 'var(--radius-sm)',
              transition: `color var(--duration-fast) var(--ease-out)`,
              flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer',
            }}
            aria-label="Actions"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <circle cx="12" cy="5" r="1" fill="currentColor" />
              <circle cx="12" cy="12" r="1" fill="currentColor" />
              <circle cx="12" cy="19" r="1" fill="currentColor" />
            </svg>
          </button>
        )}
      </div>

      {expanded && isCurrentMonth && (
        <div className="flex" style={{ gap: '8px', marginTop: '12px' }}>
          {expense.status !== 'PAID' && (
            <button onClick={() => { onAction(expense.id, 'paid'); setExpanded(false); }} className="btn-action btn-action-positive">
              Marquer paye
            </button>
          )}
          {expense.status === 'PAID' && (
            <button onClick={() => { onAction(expense.id, 'upcoming'); setExpanded(false); }} className="btn-action btn-action-accent">
              Annuler
            </button>
          )}
          {expense.status !== 'DEFERRED' && expense.status !== 'PAID' && (
            <button onClick={() => { onAction(expense.id, 'deferred'); setExpanded(false); }} className="btn-action btn-action-neutral">
              Reporter
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Adhoc modal ──────────────────────────────────────────────────────────────

function AdhocModal({ sections, month, onClose }: { sections: Section[]; month: string; onClose: () => void }) {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [sectionId, setSectionId] = useState(sections[0]?.id ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !amount) { setError('Nom et montant requis'); return; }
    if (!sectionId) { setError('Veuillez choisir une section'); return; }
    setLoading(true);
    setError('');
    try {
      const { createAdhocExpense } = await import('@/lib/actions/expenses');
      await createAdhocExpense(name.trim(), parseFloat(amount), sectionId, month);
      onClose();
    } catch {
      setError('Erreur lors de la création');
      setLoading(false);
    }
  }

  return (
    <div className="sheet-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div style={{ padding: '8px 24px 40px' }}>
          <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '20px', letterSpacing: 'var(--tracking-tight)' }}>
            Dépense adhoc
          </h2>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label className="field-label">Description</label>
              <input
                type="text" placeholder="Ex: Réparation, Course urgente..."
                value={name} onChange={(e) => setName(e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="field-label">Montant ($)</label>
              <input
                type="number" min="0" step="0.01" placeholder="0.00"
                value={amount} onChange={(e) => setAmount(e.target.value)}
                className="input-field" style={{ fontVariantNumeric: 'tabular-nums' }}
              />
            </div>
            <div>
              <label className="field-label">Section</label>
              <select value={sectionId} onChange={(e) => setSectionId(e.target.value)} className="input-field">
                {sections.map((s) => (
                  <option key={s.id} value={s.id}>{s.icon} {s.name}</option>
                ))}
              </select>
            </div>
            {error && (
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--negative)', background: 'var(--negative-subtle)', padding: '8px 12px', borderRadius: 'var(--radius-sm)' }}>
                {error}
              </p>
            )}
            <button
              type="submit" disabled={loading}
              className="btn-primary"
              style={{ width: '100%', padding: '16px', fontSize: 'var(--text-base)', opacity: loading ? 0.5 : 1 }}
            >
              {loading ? 'Ajout...' : 'Ajouter cette dépense'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
