'use client';

import { formatCAD, calcMonthlyCost, daysUntil } from '@/lib/utils';
import type { Expense, Card } from '@/lib/types';
import Link from 'next/link';

type Props = {
  card: Card;
  expenses: Expense[];
  monthlyTotal: number;
};

function getDueBadge(days: number): { bg: string; color: string } {
  if (days <= 1) return { bg: 'var(--negative-subtle)', color: 'var(--negative-text)' };
  if (days <= 3) return { bg: 'var(--warning-subtle)', color: 'var(--warning-text)' };
  return { bg: 'var(--accent-subtle)', color: 'var(--accent)' };
}

export default function CarteDetailClient({ card, expenses, monthlyTotal }: Props) {
  const autoExpenses = expenses.filter((e) => e.auto_debit);
  const manualExpenses = expenses.filter((e) => !e.auto_debit);

  return (
    <div className="space-y-3">
      {/* Card visual */}
      <div
        className="rounded-[var(--radius-xl)] p-5 text-[var(--text-inverted)] relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${card.color} 0%, ${card.color}CC 100%)`,
          boxShadow: `0 8px 32px ${card.color}40, 0 2px 8px ${card.color}25`,
        }}
      >
        <div className="absolute -top-5 -right-5 w-24 h-24 rounded-full pointer-events-none" style={{ background: 'rgba(255,255,255,0.10)' }} />
        <div className="absolute bottom-4 right-20 w-16 h-16 rounded-full pointer-events-none" style={{ background: 'rgba(255,255,255,0.06)' }} />
        <div className="flex justify-between items-start mb-6">
          <div>
            <p style={{ color: 'rgba(250,250,248,0.60)', fontSize: '10px', fontWeight: 600, letterSpacing: '0.10em', textTransform: 'uppercase' }}>
              {card.bank ?? 'Carte'}
            </p>
            <p style={{ fontSize: '18px', fontWeight: 700, marginTop: '2px', letterSpacing: '-0.01em' }}>{card.name}</p>
          </div>
          <div className="text-right">
            <p style={{ color: 'rgba(250,250,248,0.60)', fontSize: '10px', letterSpacing: '0.04em' }}>Mensuel</p>
            <p style={{ fontSize: '22px', fontWeight: 700, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>
              {formatCAD(monthlyTotal)}
            </p>
          </div>
        </div>
        <p style={{ color: 'rgba(250,250,248,0.50)', fontSize: '13px', fontFamily: 'monospace', letterSpacing: '0.08em' }}>
          •••• •••• •••• {card.last_four ?? '????'}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Prélèvements auto', value: autoExpenses.length },
          { label: 'Dépenses totales', value: expenses.length },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="rounded-[var(--radius-lg)] p-4"
            style={{ background: 'var(--surface-raised)', border: '1px solid var(--border-default)', boxShadow: 'var(--shadow-xs)' }}
          >
            <p style={{ fontSize: '26px', fontWeight: 700, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>
              {value}
            </p>
            <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '2px' }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Auto-charged expenses */}
      {autoExpenses.length > 0 && (
        <div
          className="rounded-[var(--radius-lg)] overflow-hidden"
          style={{ background: 'var(--surface-raised)', border: '1px solid var(--border-default)', boxShadow: 'var(--shadow-sm)' }}
        >
          <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border-default)' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }} className="flex items-center gap-2">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
              Prélèvements automatiques
            </h3>
          </div>
          {autoExpenses.map((expense, idx) => {
            const days = expense.next_due_date ? daysUntil(expense.next_due_date) : null;
            const monthly = calcMonthlyCost(expense);
            const badge = days !== null ? getDueBadge(days) : { bg: 'var(--accent-subtle)', color: 'var(--accent)' };
            return (
              <div
                key={expense.id}
                className="flex items-center gap-3 px-4 py-3"
                style={{ borderTop: idx > 0 ? '1px solid var(--border-default)' : 'none' }}
              >
                <div
                  className="w-8 h-8 rounded-[var(--radius-sm)] flex items-center justify-center text-xs flex-shrink-0"
                  style={{ background: `${expense.section?.color ?? 'var(--accent)'}18` }}
                >
                  <span>{expense.section?.icon ?? '💳'}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }} className="truncate">{expense.name}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{expense.section?.name ?? '—'}</span>
                    {expense.next_due_date && days !== null && (
                      <span
                        style={{ fontSize: '10px', fontWeight: 600, background: badge.bg, color: badge.color, padding: '1px 6px', borderRadius: 'var(--radius-full)' }}
                      >
                        J-{days}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                    {formatCAD(expense.amount)}
                  </p>
                  {monthly !== expense.amount && (
                    <p style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{formatCAD(monthly)}/mois</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Other expenses */}
      {manualExpenses.length > 0 && (
        <div
          className="rounded-[var(--radius-lg)] overflow-hidden"
          style={{ background: 'var(--surface-raised)', border: '1px solid var(--border-default)', boxShadow: 'var(--shadow-sm)' }}
        >
          <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border-default)' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>Autres dépenses liées</h3>
          </div>
          {manualExpenses.map((expense, idx) => (
            <div
              key={expense.id}
              className="flex items-center gap-3 px-4 py-3"
              style={{ borderTop: idx > 0 ? '1px solid var(--border-default)' : 'none' }}
            >
              <div
                className="w-8 h-8 rounded-[var(--radius-sm)] flex items-center justify-center text-xs flex-shrink-0"
                style={{ background: `${expense.section?.color ?? 'var(--accent)'}18` }}
              >
                {expense.section?.icon ?? '💳'}
              </div>
              <div className="flex-1 min-w-0">
                <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }} className="truncate">{expense.name}</p>
                <p style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{expense.section?.name ?? '—'}</p>
              </div>
              <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }} className="flex-shrink-0">
                {formatCAD(expense.amount)}
              </p>
            </div>
          ))}
        </div>
      )}

      {expenses.length === 0 && (
        <div
          className="rounded-[var(--radius-lg)] p-10 text-center"
          style={{ background: 'var(--surface-raised)', border: '1px solid var(--border-default)' }}
        >
          <p style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>Aucune dépense liée à cette carte</p>
        </div>
      )}

      <Link
        href="/cartes"
        className="flex items-center justify-center gap-1.5 py-3"
        style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 5l-7 7 7 7" />
        </svg>
        Retour aux cartes
      </Link>
    </div>
  );
}
