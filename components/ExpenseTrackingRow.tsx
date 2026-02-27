'use client';

import { useState } from 'react';
import { formatCAD, formatShortDate } from '@/lib/utils';
import { STATUS_LABELS, STATUS_STYLES } from '@/lib/constants';
import type { MonthlyExpense } from '@/lib/types';

type Props = {
  expense: MonthlyExpense;
  isCurrentMonth: boolean;
  onAction: (id: string, action: 'paid' | 'deferred' | 'upcoming') => void;
};

export default function ExpenseTrackingRow({ expense, isCurrentMonth, onAction }: Props) {
  const [expanded, setExpanded] = useState(false);
  const statusStyle = STATUS_STYLES[expense.status];

  return (
    <div style={{ padding: '12px 20px' }}>
      <div className="flex items-center" style={{ gap: '12px' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 'var(--text-sm)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {expense.name}
          </p>
          <div className="flex items-center" style={{ gap: '6px', marginTop: '4px', flexWrap: 'wrap' }}>
            <span className="badge" style={{ background: statusStyle.bg, color: statusStyle.color }}>
              {STATUS_LABELS[expense.status]}
            </span>
            {!expense.is_planned && (
              <span className="badge" style={{ background: 'var(--warning-subtle)', color: 'var(--warning-text)' }}>
                Imprevu
              </span>
            )}
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
