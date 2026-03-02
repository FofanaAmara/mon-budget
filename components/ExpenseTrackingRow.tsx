'use client';

import { formatCAD } from '@/lib/utils';
import type { MonthlyExpense } from '@/lib/types';

type Props = {
  expense: MonthlyExpense;
  isCurrentMonth: boolean;
  onAction: (id: string, action: 'paid' | 'upcoming') => void;
  onOpenActions?: () => void;
};

// Icon backgrounds per section color
function getIconBg(section?: { color?: string }): string {
  if (!section) return 'var(--slate-100)';
  if (section.color) return section.color + '18';
  return 'var(--slate-100)';
}

// Status badge config — same pattern as TabTimeline.tsx
function getStatusBadge(status: string) {
  if (status === 'PAID') return { bg: 'var(--teal-50)', color: 'var(--teal-700)', label: 'Payé' };
  if (status === 'OVERDUE') return { bg: 'var(--error-light)', color: 'var(--error)', label: 'En retard' };
  return { bg: 'var(--slate-100)', color: 'var(--slate-500)', label: 'Prévu' };
}

// Amount color — same as TabTimeline.tsx
function getAmountColor(status: string): string {
  if (status === 'OVERDUE') return 'var(--error)';
  if (status === 'PAID') return 'var(--slate-900)';
  return 'var(--slate-400)';
}

export default function ExpenseTrackingRow({ expense, isCurrentMonth, onAction, onOpenActions }: Props) {
  const isPaid = expense.status === 'PAID';
  const badge = getStatusBadge(expense.status);

  return (
    <div
      className="expense-tracking-row"
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '14px 16px 14px 18px',
        gap: '12px',
        borderBottom: '1px solid var(--slate-100)',
        transition: 'background 0.15s ease',
        cursor: isCurrentMonth ? 'pointer' : 'default',
        opacity: expense.status === 'DEFERRED' ? 0.6 : 1,
      }}
      onClick={isCurrentMonth && onOpenActions ? onOpenActions : undefined}
    >
      {/* Category icon — 40px rounded square */}
      <div style={{
        width: '40px',
        height: '40px',
        borderRadius: 'var(--radius-sm)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '18px',
        lineHeight: '1',
        flexShrink: 0,
        background: getIconBg(expense.section),
      }}>
        {expense.section?.icon ?? '💳'}
      </div>

      {/* Name + meta */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: '14px',
          fontWeight: 600,
          color: 'var(--slate-900)',
          letterSpacing: '-0.01em',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {expense.name}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
          {expense.section && (
            <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--slate-400)' }}>
              {expense.section.name}
            </span>
          )}
          <span style={{
            fontSize: '10px', fontWeight: 700,
            letterSpacing: '0.04em', textTransform: 'uppercase',
            padding: '2px 8px', borderRadius: '4px',
            background: badge.bg, color: badge.color,
          }}>
            {badge.label}
          </span>
          {!expense.is_planned && (
            <span style={{
              fontSize: '10px', fontWeight: 700,
              letterSpacing: '0.04em', textTransform: 'uppercase',
              padding: '2px 8px', borderRadius: '4px',
              background: 'var(--amber-100)', color: 'var(--amber-600)',
            }}>
              Imprévu
            </span>
          )}
          {expense.is_auto_charged && (
            <span style={{
              fontSize: '10px', fontWeight: 700,
              letterSpacing: '0.04em', textTransform: 'uppercase',
              padding: '2px 8px', borderRadius: '4px',
              background: 'var(--slate-100)', color: 'var(--slate-500)',
            }}>
              Auto
            </span>
          )}
        </div>
      </div>

      {/* Amount + toggle */}
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end' }}>
          <span style={{
            fontSize: '15px',
            fontWeight: 800,
            letterSpacing: '-0.02em',
            fontVariantNumeric: 'tabular-nums',
            color: getAmountColor(expense.status),
          }}>
            {isPaid && '-'}{formatCAD(Number(expense.amount))}
          </span>

          {/* Inline status toggle */}
          {isCurrentMonth && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAction(expense.id, isPaid ? 'upcoming' : 'paid');
              }}
              title={isPaid ? 'Remettre à venir' : 'Marquer payée'}
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                border: isPaid ? 'none' : '2px solid var(--slate-200)',
                background: isPaid ? 'var(--positive)' : 'var(--white)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                flexShrink: 0,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={isPaid ? 'white' : 'var(--slate-300)'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </button>
          )}

          {/* Chevron */}
          {isCurrentMonth && onOpenActions && (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--slate-300)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <polyline points="9 18 15 12 9 6" />
            </svg>
          )}
        </div>
      </div>
    </div>
  );
}
