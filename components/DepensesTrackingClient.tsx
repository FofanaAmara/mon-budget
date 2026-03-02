'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { markAsPaid, markAsUpcoming, deleteMonthlyExpense, updateMonthlyExpenseAmount, deferExpenseToMonth } from '@/lib/actions/monthly-expenses';
import { formatCAD } from '@/lib/utils';
import { currentMonthKey } from '@/lib/month-utils';
import { GROUP_ORDER, GROUP_LABELS } from '@/lib/constants';
import MonthNavigator from '@/components/MonthNavigator';
import ExpenseTrackingRow from '@/components/ExpenseTrackingRow';
import AdhocExpenseModal from '@/components/AdhocExpenseModal';
import type { MonthlyExpense, MonthSummary, Section, Card } from '@/lib/types';

type Props = {
  expenses: MonthlyExpense[];
  summary: MonthSummary;
  sections: Section[];
  cards: Card[];
  month: string;
};

export default function DepensesTrackingClient({ expenses, summary, sections, cards, month }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [typeFilter, setTypeFilter] = useState<'all' | 'planned' | 'unplanned'>('all');
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [groupModal, setGroupModal] = useState<{ status: MonthlyExpense['status']; items: MonthlyExpense[] } | null>(null);
  const [adhocModal, setAdhocModal] = useState(false);
  const [deleteExpenseModal, setDeleteExpenseModal] = useState<MonthlyExpense | null>(null);
  const [updateExpenseModal, setUpdateExpenseModal] = useState<MonthlyExpense | null>(null);
  const [updateExpenseAmount, setUpdateExpenseAmount] = useState('');
  const [deferModal, setDeferModal] = useState<MonthlyExpense | null>(null);
  const [deferTargetMonth, setDeferTargetMonth] = useState('');

  const today = currentMonthKey();
  const isCurrentMonth = month === today;

  const plannedCount = expenses.filter((e) => e.is_planned).length;
  const unplannedCount = expenses.filter((e) => !e.is_planned).length;

  const filtered = expenses
    .filter((e) => typeFilter === 'all' ? true : typeFilter === 'planned' ? e.is_planned : !e.is_planned)
    .filter((e) => selectedSection ? e.section_id === selectedSection : true);

  const grouped = GROUP_ORDER.map((status) => ({
    status,
    items: filtered.filter((e) => e.status === status),
  })).filter((g) => g.items.length > 0);

  const chargesFixes = summary.planned_total;
  const progressPct = chargesFixes > 0 ? (summary.paid_total / chargesFixes) * 100 : 0;
  const restAPayer = Math.max(chargesFixes - summary.paid_total, 0);
  const hasUnplanned = summary.unplanned_total > 0;
  const isOverBudget = summary.paid_total > chargesFixes && chargesFixes > 0;
  const overAmount = summary.paid_total - chargesFixes;

  // Generate the next 6 months after the current month as options for deferral
  function getFutureMonths(fromMonth: string, count = 6): Array<{ key: string; label: string }> {
    const [y, m] = fromMonth.split('-').map(Number);
    const result = [];
    for (let i = 1; i <= count; i++) {
      const d = new Date(y, m - 1 + i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = new Intl.DateTimeFormat('fr-CA', { month: 'long', year: 'numeric' }).format(d);
      result.push({ key, label });
    }
    return result;
  }

  function openDeferModal(expense: MonthlyExpense) {
    const [y, m] = month.split('-').map(Number);
    const next = new Date(y, m, 1); // month+1
    const nextKey = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`;
    setDeferTargetMonth(nextKey);
    setDeferModal(expense);
  }

  function confirmDefer() {
    if (!deferModal || !deferTargetMonth) return;
    startTransition(async () => {
      await deferExpenseToMonth(deferModal.id, deferTargetMonth);
      setDeferModal(null);
      router.refresh();
    });
  }

  function handleAction(id: string, action: 'paid' | 'upcoming') {
    startTransition(async () => {
      if (action === 'paid') await markAsPaid(id);
      else await markAsUpcoming(id);
      router.refresh();
    });
  }

  function confirmDeleteExpense() {
    if (!deleteExpenseModal) return;
    startTransition(async () => {
      await deleteMonthlyExpense(deleteExpenseModal.id);
      setDeleteExpenseModal(null);
      router.refresh();
    });
  }

  function openUpdateExpense(expense: MonthlyExpense) {
    setUpdateExpenseAmount(String(expense.amount ?? ''));
    setUpdateExpenseModal(expense);
  }

  function confirmUpdateExpense() {
    if (!updateExpenseModal) return;
    const amt = parseFloat(updateExpenseAmount);
    if (isNaN(amt) || amt < 0) return;
    startTransition(async () => {
      await updateMonthlyExpenseAmount(updateExpenseModal.id, amt);
      setUpdateExpenseModal(null);
      setUpdateExpenseAmount('');
      router.refresh();
    });
  }

  return (
    <div style={{ padding: '0 0 96px', minHeight: '100vh' }}>
      <MonthNavigator month={month} basePath="/depenses" />

      {/* Monument: total dépensé */}
      <div style={{ padding: '24px 20px 16px', textAlign: 'center' }}>
        <p style={{
          fontSize: '12px', fontWeight: 700, letterSpacing: '0.1em',
          textTransform: 'uppercase', color: 'var(--accent)', marginBottom: '8px',
        }}>
          Dépenses
        </p>
        <p style={{
          fontSize: 'clamp(3rem, 12vw, 5rem)',
          fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1,
          color: 'var(--text-primary)',
        }}>
          <span style={{ fontSize: '0.4em', fontWeight: 600, color: 'var(--accent)', verticalAlign: 'super' }}>$</span>
          {Math.abs(summary.paid_total).toLocaleString('fr-CA', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
        </p>
        <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-tertiary)', marginTop: '6px' }}>
          sur <strong style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>{formatCAD(chargesFixes)}</strong> de charges prévues
        </p>

        {/* Progress bar */}
        <div style={{
          margin: '16px 0 0',
          height: '6px', borderRadius: '3px',
          background: 'var(--surface-sunken)',
          position: 'relative', overflow: 'visible',
        }}>
          {isOverBudget ? (
            <>
              <div style={{
                position: 'absolute', left: 0, top: 0, bottom: 0,
                width: `${Math.min((chargesFixes / summary.paid_total) * 100, 100)}%`,
                background: 'var(--accent)',
                borderRadius: '3px 0 0 3px',
              }} />
              <div style={{
                position: 'absolute',
                left: `${(chargesFixes / summary.paid_total) * 100}%`,
                top: 0, bottom: 0,
                width: `${100 - (chargesFixes / summary.paid_total) * 100}%`,
                background: 'var(--negative)',
                borderRadius: '0 3px 3px 0',
                boxShadow: '0 0 8px rgba(220,38,38,0.3)',
              }} />
            </>
          ) : (
            <div style={{
              height: '100%', borderRadius: '3px',
              background: progressPct >= 90 ? 'var(--warning)' : 'var(--accent)',
              width: `${Math.min(progressPct, 100)}%`,
              transition: 'width 0.3s ease',
              minWidth: progressPct > 0 ? '4px' : '0',
            }} />
          )}
        </div>

        {/* Status badges */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
          {isOverBudget && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '4px',
              padding: '4px 10px', borderRadius: '100px',
              background: 'var(--negative-subtle)', color: 'var(--negative-text)',
              fontSize: '13px', fontWeight: 600,
            }}>
              +{formatCAD(overAmount)} au-dessus
            </span>
          )}
          {summary.overdue_count > 0 && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '4px',
              padding: '4px 10px', borderRadius: '100px',
              background: 'var(--warning-subtle)', color: 'var(--warning-text)',
              fontSize: '13px', fontWeight: 600,
            }}>
              ⚠ {summary.overdue_count} en retard
            </span>
          )}
          {!isOverBudget && progressPct < 90 && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '4px',
              padding: '4px 10px', borderRadius: '100px',
              background: 'var(--positive-subtle)', color: 'var(--positive-text)',
              fontSize: '13px', fontWeight: 600,
            }}>
              ✓ {formatCAD(restAPayer)} restant
            </span>
          )}
        </div>
      </div>

      {/* Type tab strip — same pattern as AccueilClient */}
      <div className="flex" style={{
        gap: '6px',
        background: 'var(--surface-inset)',
        borderRadius: 'var(--radius-md)',
        padding: '4px',
        margin: '0 20px 12px',
      }}>
        {([
          { key: 'all' as const, label: 'Tout' },
          { key: 'planned' as const, label: `Charges fixes (${plannedCount})` },
          { key: 'unplanned' as const, label: `Imprévus (${unplannedCount})` },
        ]).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTypeFilter(key)}
            style={{
              flex: key === 'all' ? '0 0 auto' : 1,
              padding: '8px 12px',
              whiteSpace: 'nowrap',
              borderRadius: 'var(--radius-sm)',
              fontSize: 'var(--text-xs)', fontWeight: 650,
              cursor: 'pointer',
              background: typeFilter === key ? 'var(--surface-raised)' : 'transparent',
              color: typeFilter === key ? 'var(--text-primary)' : 'var(--text-tertiary)',
              border: 'none',
              boxShadow: typeFilter === key ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Section filter pills */}
      {sections.length > 0 && (
        <div className="flex scrollbar-hide" style={{
          gap: '8px', overflowX: 'auto',
          paddingBottom: '4px', paddingLeft: '20px', paddingRight: '20px',
          marginBottom: '16px',
        }}>
          <button
            onClick={() => setSelectedSection(null)}
            style={{
              flexShrink: 0, padding: '8px 16px',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--text-xs)', fontWeight: 600,
              transition: `all var(--duration-fast) var(--ease-out)`,
              background: selectedSection === null ? 'var(--accent)' : 'var(--surface-raised)',
              color: selectedSection === null ? 'white' : 'var(--text-tertiary)',
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
                background: selectedSection === s.id ? 'var(--accent)' : 'var(--surface-raised)',
                color: selectedSection === s.id ? 'white' : 'var(--text-tertiary)',
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
        <div className="flex flex-col items-center justify-center text-center" style={{ padding: '80px 20px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px', opacity: 0.6 }}>📅</div>
          <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)', marginBottom: '8px', fontWeight: 500 }}>
            Aucune depense ce mois
          </p>
          <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)', opacity: 0.7 }}>
            Les depenses recurrentes apparaissent automatiquement
          </p>
        </div>
      )}

      {/* Grouped expenses by status */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '0 20px' }}>
        {grouped.map(({ status, items }) => {
          const hasMore = items.length > 3;
          const visible = items.slice(0, 3);
          return (
            <div key={status}>
              <h2 className="section-label" style={{ marginBottom: '12px', paddingLeft: '4px' }}>
                {GROUP_LABELS[status]} ({items.length})
              </h2>
              <div className="card" style={{ overflow: 'hidden' }}>
                {visible.map((expense, i) => (
                  <div key={expense.id}>
                    {i > 0 && <div className="divider" style={{ marginLeft: '20px', marginRight: '20px' }} />}
                    <ExpenseTrackingRow
                      expense={expense}
                      isCurrentMonth={isCurrentMonth}
                      onAction={handleAction}
                      onDefer={expense.status !== 'PAID' && expense.status !== 'DEFERRED' ? () => openDeferModal(expense) : undefined}
                      onDelete={expense.expense_id === null ? () => setDeleteExpenseModal(expense) : undefined}
                      onUpdateAmount={expense.status !== 'PAID' ? () => openUpdateExpense(expense) : undefined}
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
                    <ExpenseTrackingRow
                      expense={expense}
                      isCurrentMonth={isCurrentMonth}
                      onAction={(id, action) => { handleAction(id, action); setGroupModal(null); }}
                      onDefer={expense.status !== 'PAID' && expense.status !== 'DEFERRED' ? () => { openDeferModal(expense); setGroupModal(null); } : undefined}
                      onDelete={expense.expense_id === null ? () => { setDeleteExpenseModal(expense); setGroupModal(null); } : undefined}
                      onUpdateAmount={expense.status !== 'PAID' ? () => { openUpdateExpense(expense); setGroupModal(null); } : undefined}
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
        <AdhocExpenseModal
          sections={sections}
          cards={cards}
          month={month}
          onClose={() => { setAdhocModal(false); router.refresh(); }}
        />
      )}

      {/* Delete confirmation modal */}
      {deleteExpenseModal && (
        <div className="sheet-backdrop" onClick={(e) => e.target === e.currentTarget && setDeleteExpenseModal(null)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-handle" />
            <div style={{ padding: '8px 24px 32px' }}>
              <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                Supprimer cette dépense ?
              </h2>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', marginBottom: '24px' }}>
                « {deleteExpenseModal.name} » sera retirée de ce mois. Cette action est irréversible.
              </p>
              <div className="flex" style={{ gap: '12px' }}>
                <button
                  onClick={() => setDeleteExpenseModal(null)}
                  className="btn-secondary"
                  style={{ flex: 1, padding: '14px' }}
                >
                  Annuler
                </button>
                <button
                  onClick={confirmDeleteExpense}
                  style={{
                    flex: 1, padding: '14px',
                    background: 'var(--negative)', color: 'white',
                    border: 'none', borderRadius: 'var(--radius-md)',
                    fontSize: 'var(--text-base)', fontWeight: 650, cursor: 'pointer',
                  }}
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Defer to month modal */}
      {deferModal && (
        <div className="sheet-backdrop" onClick={(e) => e.target === e.currentTarget && setDeferModal(null)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-handle" />
            <div style={{ padding: '8px 24px 32px' }}>
              <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                Reporter à un autre mois
              </h2>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginBottom: '20px' }}>
                « {deferModal.name} » sera conservée dans ce mois avec le statut Reportée, et une nouvelle entrée À venir sera créée dans le mois choisi.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
                {getFutureMonths(month).map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setDeferTargetMonth(key)}
                    style={{
                      padding: '12px 16px',
                      borderRadius: 'var(--radius-md)',
                      fontSize: 'var(--text-sm)', fontWeight: deferTargetMonth === key ? 700 : 500,
                      textAlign: 'left',
                      cursor: 'pointer',
                      background: deferTargetMonth === key ? 'var(--accent)' : 'var(--surface-raised)',
                      color: deferTargetMonth === key ? 'white' : 'var(--text-primary)',
                      border: deferTargetMonth === key ? 'none' : '1.5px solid var(--border-default)',
                      transition: 'all 0.15s ease',
                      textTransform: 'capitalize',
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="flex" style={{ gap: '12px' }}>
                <button
                  onClick={() => setDeferModal(null)}
                  className="btn-secondary"
                  style={{ flex: 1, padding: '14px' }}
                >
                  Annuler
                </button>
                <button
                  onClick={confirmDefer}
                  className="btn-primary"
                  style={{ flex: 1, padding: '14px' }}
                >
                  Confirmer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Update amount modal */}
      {updateExpenseModal && (
        <div className="sheet-backdrop" onClick={(e) => e.target === e.currentTarget && setUpdateExpenseModal(null)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-handle" />
            <div style={{ padding: '8px 24px 32px' }}>
              <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                Modifier le montant
              </h2>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginBottom: '20px' }}>
                Ce mois uniquement — la charge dans les réglages reste inchangée.
              </p>
              <div style={{ marginBottom: '20px' }}>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  {updateExpenseModal.name}
                </p>
                <label className="field-label" style={{ marginTop: '16px' }}>Nouveau montant ($)</label>
                <input
                  type="number" min="0" step="0.01"
                  value={updateExpenseAmount}
                  onChange={(e) => setUpdateExpenseAmount(e.target.value)}
                  className="input-field"
                  style={{ fontVariantNumeric: 'tabular-nums' }}
                  autoFocus
                />
              </div>
              <button
                onClick={confirmUpdateExpense}
                className="btn-primary"
                style={{ width: '100%', padding: '16px', fontSize: 'var(--text-base)' }}
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
