'use client';

import { formatCAD } from '@/lib/utils';
import type { MonthlyExpense } from '@/lib/types';

type Props = {
  expense: MonthlyExpense;
  isCurrentMonth: boolean;
  onAction: (id: string, action: 'paid' | 'upcoming') => void;
  onOpenActions?: () => void;
};

// Icon backgrounds per section color (fallback by keyword matching)
function getIconBg(section?: { color?: string; name?: string }): string {
  if (!section) return '#F1F5F9';
  if (section.color) return section.color + '22'; // use section color with opacity
  const name = (section.name ?? '').toLowerCase();
  if (name.includes('logement') || name.includes('maison')) return '#F0FDFA';
  if (name.includes('transport') || name.includes('auto')) return '#EFF6FF';
  if (name.includes('aliment') || name.includes('épicerie') || name.includes('restaur')) return '#FEF3C7';
  if (name.includes('loisir') || name.includes('divertis')) return '#FDF2F8';
  if (name.includes('santé') || name.includes('sante')) return '#F0F9FF';
  if (name.includes('facture') || name.includes('service')) return '#FFF7ED';
  if (name.includes('person')) return '#F5F3FF';
  return '#F1F5F9';
}

export default function ExpenseTrackingRow({ expense, isCurrentMonth, onAction, onOpenActions }: Props) {
  const isPaid = expense.status === 'PAID';

  return (
    <div
      className="expense-tracking-row"
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '12px 16px 12px 18px',
        gap: '12px',
        borderBottom: '1px solid var(--slate-100)',
        transition: 'background 0.15s ease',
        cursor: isCurrentMonth ? 'pointer' : 'default',
        opacity: expense.status === 'DEFERRED' ? 0.6 : 1,
      }}
      onClick={isCurrentMonth && onOpenActions ? onOpenActions : undefined}
    >
      {/* Category icon */}
      <div style={{
        width: '38px',
        height: '38px',
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{
            fontSize: '14px',
            fontWeight: 600,
            color: isPaid ? 'var(--slate-500)' : 'var(--slate-900)',
            letterSpacing: '-0.01em',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            textDecoration: isPaid ? 'line-through' : 'none',
            textDecorationColor: 'var(--slate-300)',
          }}>
            {expense.name}
          </span>
          {!expense.is_planned && (
            <span style={{
              display: 'inline-flex',
              padding: '1px 7px',
              background: 'var(--amber-100)',
              borderRadius: '100px',
              fontSize: '10px',
              fontWeight: 700,
              color: 'var(--amber-600)',
              letterSpacing: '0.02em',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}>
              Imprévu
            </span>
          )}
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          marginTop: '3px',
          fontSize: '11px',
          fontWeight: 600,
          color: 'var(--slate-400)',
          letterSpacing: '0.02em',
        }}>
          {expense.section && (
            <span style={{ textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>
              {expense.section.name}
            </span>
          )}
          {expense.card && (
            <>
              <span style={{ width: '3px', height: '3px', borderRadius: '50%', background: 'var(--slate-300)', display: 'inline-block', flexShrink: 0 }} />
              <span>{expense.card.name}{expense.card.last_four ? ` ****${expense.card.last_four}` : ''}</span>
            </>
          )}
          {expense.is_auto_charged && (
            <>
              <span style={{ width: '3px', height: '3px', borderRadius: '50%', background: 'var(--slate-300)', display: 'inline-block', flexShrink: 0 }} />
              <span>Auto</span>
            </>
          )}
        </div>
      </div>

      {/* Amount + toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        <span style={{
          fontSize: '15px',
          fontWeight: 800,
          letterSpacing: '-0.02em',
          color: isPaid ? 'var(--slate-400)' : 'var(--slate-900)',
          fontVariantNumeric: 'tabular-nums',
          whiteSpace: 'nowrap',
        }}>
          <span style={{ fontSize: '0.7em', fontWeight: 600, color: isPaid ? 'var(--slate-300)' : 'var(--teal-700)' }}>$</span>
          {Number(expense.amount).toLocaleString('fr-CA', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
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
            {isPaid ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--slate-300)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
          </button>
        )}

        {/* Chevron for secondary actions */}
        {isCurrentMonth && onOpenActions && (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--slate-300)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <polyline points="9 18 15 12 9 6" />
          </svg>
        )}
      </div>
    </div>
  );
}
