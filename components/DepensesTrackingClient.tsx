'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { markAsPaid, markAsDeferred, markAsUpcoming } from '@/lib/actions/monthly-expenses';
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
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [groupModal, setGroupModal] = useState<{ status: MonthlyExpense['status']; items: MonthlyExpense[] } | null>(null);
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

  const chargesFixes = summary.planned_total;
  const progressPct = chargesFixes > 0 ? (summary.paid_total / chargesFixes) * 100 : 0;
  const restAPayer = Math.max(chargesFixes - summary.paid_total, 0);
  const hasUnplanned = summary.unplanned_total > 0;

  function handleAction(id: string, action: 'paid' | 'deferred' | 'upcoming') {
    startTransition(async () => {
      if (action === 'paid') await markAsPaid(id);
      else if (action === 'deferred') await markAsDeferred(id);
      else await markAsUpcoming(id);
      router.refresh();
    });
  }

  return (
    <div style={{ padding: '36px 20px 96px', minHeight: '100vh' }}>
      <MonthNavigator month={month} basePath="/depenses" />

      {/* Hero card */}
      <div style={{
        borderRadius: 'var(--radius-lg)',
        padding: '20px',
        marginBottom: '16px',
        background: 'linear-gradient(135deg, #3D3BF3, #3230D4)',
        color: 'white',
      }}>
        <p style={{ fontSize: 'var(--text-xs)', fontWeight: 600, opacity: 0.75, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '4px' }}>
          Charges prevues
        </p>
        <p className="amount" style={{ fontSize: 'var(--text-2xl)', fontWeight: 750, letterSpacing: 'var(--tracking-tight)' }}>
          {formatCAD(chargesFixes)}
        </p>
        <div className="flex items-center" style={{ gap: '16px', marginTop: '12px', fontSize: 'var(--text-xs)', opacity: 0.85 }}>
          <span>Depense {formatCAD(summary.paid_total)}</span>
          <span>Reste {formatCAD(restAPayer)}</span>
          {hasUnplanned && <span>Imprevus {formatCAD(summary.unplanned_total)}</span>}
        </div>
        {/* Progress bar */}
        <div style={{
          marginTop: '12px', height: '4px', borderRadius: '2px',
          background: 'rgba(255,255,255,0.2)',
        }}>
          <div style={{
            height: '100%', borderRadius: '2px',
            background: 'rgba(255,255,255,0.9)',
            width: `${Math.min(progressPct, 100)}%`,
            transition: 'width 0.3s ease',
          }} />
        </div>
        {summary.overdue_count > 0 && (
          <div style={{
            marginTop: '10px', display: 'inline-flex', alignItems: 'center', gap: '4px',
            padding: '3px 8px', borderRadius: '999px',
            background: 'rgba(255,255,255,0.2)', fontSize: 'var(--text-xs)', fontWeight: 600,
          }}>
            ⚠ {summary.overdue_count} en retard
          </div>
        )}
      </div>

      {/* Section filter pills */}
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

      {/* Grouped expenses by status */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
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
    </div>
  );
}
