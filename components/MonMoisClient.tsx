'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { markAsPaid, markAsDeferred, markAsUpcoming } from '@/lib/actions/monthly-expenses';
import { formatCAD, formatShortDate } from '@/lib/utils';
import type { MonthlyExpense, MonthSummary, MonthlyExpenseStatus, Section } from '@/lib/types';

type Props = {
  expenses: MonthlyExpense[];
  summary: MonthSummary;
  sections: Section[];
  month: string;
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

export default function MonMoisClient({ expenses, summary, sections, month }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
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

  return (
    <div style={{ padding: '36px 20px 96px', minHeight: '100vh' }}>
      {/* Header with month navigation */}
      <div className="flex items-center justify-between" style={{ marginBottom: '24px' }}>
        <button
          onClick={() => navigateMonth(prevMonth(month))}
          style={{
            padding: '8px',
            color: 'var(--text-tertiary)',
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
            fontSize: 'var(--text-lg)',
            fontWeight: 750,
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
                fontSize: 'var(--text-xs)',
                color: 'var(--accent)',
                marginTop: '4px',
                background: 'none', border: 'none', cursor: 'pointer',
                fontWeight: 600,
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

      {/* Progress card */}
      <div className="card" style={{ padding: '20px', marginBottom: '16px' }}>
        <div className="flex items-center justify-between" style={{ marginBottom: '12px' }}>
          <span style={{ fontSize: 'var(--text-sm)', fontWeight: 650, color: 'var(--text-primary)' }}>
            {summary.paid_count}/{summary.count} depenses completees
          </span>
          {summary.overdue_count > 0 && (
            <span className="badge" style={{
              background: 'var(--negative-subtle)',
              color: 'var(--negative-text)',
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

      {/* Section filter */}
      {sections.length > 0 && (
        <div className="flex scrollbar-hide" style={{
          gap: '8px', overflowX: 'auto',
          paddingBottom: '4px', marginBottom: '16px',
        }}>
          <button
            onClick={() => setSelectedSection(null)}
            style={{
              flexShrink: 0,
              padding: '8px 16px',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--text-xs)',
              fontWeight: 600,
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
                flexShrink: 0,
                gap: '6px',
                padding: '8px 16px',
                borderRadius: 'var(--radius-md)',
                fontSize: 'var(--text-xs)',
                fontWeight: 600,
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

      {/* Grouped expenses by status */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {grouped.map(({ status, items }) => (
          <div key={status}>
            <h2 className="section-label" style={{ marginBottom: '12px', paddingLeft: '4px' }}>
              {GROUP_LABELS[status]} ({items.length})
            </h2>
            <div className="card" style={{ overflow: 'hidden' }}>
              {items.map((expense, i) => (
                <div key={expense.id}>
                  {i > 0 && <div className="divider" style={{ marginLeft: '20px', marginRight: '20px' }} />}
                  <ExpenseRow
                    expense={expense}
                    isCurrentMonth={isCurrentMonth}
                    onAction={handleAction}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ExpenseRow({
  expense,
  isCurrentMonth,
  onAction,
}: {
  expense: MonthlyExpense;
  isCurrentMonth: boolean;
  onAction: (id: string, action: 'paid' | 'deferred' | 'upcoming') => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const statusStyle = STATUS_STYLES[expense.status];

  return (
    <div style={{ padding: '12px 20px' }}>
      <div className="flex items-center" style={{ gap: '12px' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            fontWeight: 600, color: 'var(--text-primary)',
            fontSize: 'var(--text-sm)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {expense.name}
          </p>
          <div className="flex items-center" style={{ gap: '8px', marginTop: '4px' }}>
            <span className="badge" style={{
              background: statusStyle.bg,
              color: statusStyle.color,
            }}>
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
              flexShrink: 0,
              background: 'none', border: 'none', cursor: 'pointer',
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

      {/* Inline action buttons */}
      {expanded && isCurrentMonth && (
        <div className="flex" style={{ gap: '8px', marginTop: '12px' }}>
          {expense.status !== 'PAID' && (
            <button
              onClick={() => { onAction(expense.id, 'paid'); setExpanded(false); }}
              className="btn-action btn-action-positive"
            >
              Marquer paye
            </button>
          )}
          {expense.status === 'PAID' && (
            <button
              onClick={() => { onAction(expense.id, 'upcoming'); setExpanded(false); }}
              className="btn-action btn-action-accent"
            >
              Annuler
            </button>
          )}
          {expense.status !== 'DEFERRED' && expense.status !== 'PAID' && (
            <button
              onClick={() => { onAction(expense.id, 'deferred'); setExpanded(false); }}
              className="btn-action btn-action-neutral"
            >
              Reporter
            </button>
          )}
        </div>
      )}
    </div>
  );
}
