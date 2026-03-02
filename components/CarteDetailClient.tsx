'use client';

import { formatCAD, calcMonthlyCost, daysUntil } from '@/lib/utils';
import type { Expense, Card } from '@/lib/types';
import Link from 'next/link';

/* ─── Types ──────────────────────────────────────────── */

type Props = {
  card: Card;
  expenses: Expense[];
  monthlyTotal: number;
};

/* ─── Helpers ────────────────────────────────────────── */

const CARD_COLORS: Record<string, string> = {
  '#0F766E': 'linear-gradient(145deg, #0F766E 0%, #115E59 100%)',
  '#334155': 'linear-gradient(145deg, #334155 0%, #1E293B 100%)',
  '#2563EB': 'linear-gradient(145deg, #2563EB 0%, #1D4ED8 100%)',
  '#7C3AED': 'linear-gradient(145deg, #7C3AED 0%, #6D28D9 100%)',
  '#D97706': 'linear-gradient(145deg, #D97706 0%, #B45309 100%)',
  '#E11D48': 'linear-gradient(145deg, #E11D48 0%, #BE123C 100%)',
  '#059669': 'linear-gradient(145deg, #059669 0%, #047857 100%)',
  '#EA580C': 'linear-gradient(145deg, #EA580C 0%, #C2410C 100%)',
};

function getGradient(color: string): string {
  return CARD_COLORS[color] ?? `linear-gradient(145deg, ${color} 0%, ${color}CC 100%)`;
}

function getDueBadge(days: number): { bg: string; color: string } {
  if (days <= 1) return { bg: 'var(--negative-subtle)', color: 'var(--negative-text)' };
  if (days <= 3) return { bg: 'var(--warning-subtle)', color: 'var(--warning-text)' };
  return { bg: 'var(--accent-subtle)', color: 'var(--accent)' };
}

/* ─── Component ──────────────────────────────────────── */

export default function CarteDetailClient({ card, expenses, monthlyTotal }: Props) {
  const autoExpenses   = expenses.filter((e) => e.auto_debit);
  const manualExpenses = expenses.filter((e) => !e.auto_debit);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

      {/* ── Visual bank card ── */}
      <div
        style={{
          position: 'relative',
          borderRadius: 'var(--radius-lg)',
          padding: '22px 20px 18px',
          color: 'white',
          overflow: 'hidden',
          minHeight: '160px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: getGradient(card.color),
          boxShadow: '0 8px 32px rgba(15, 23, 42, 0.15)',
        }}
      >
        {/* Texture overlay */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: `
            radial-gradient(circle at 80% 20%, rgba(255,255,255,0.12) 0%, transparent 50%),
            radial-gradient(circle at 20% 80%, rgba(255,255,255,0.06) 0%, transparent 40%)
          `,
          pointerEvents: 'none',
        }} />
        {/* Chip */}
        <div style={{
          position: 'absolute',
          top: '22px',
          right: '20px',
          width: '36px',
          height: '26px',
          borderRadius: '5px',
          background: 'linear-gradient(135deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.1) 100%)',
          border: '1px solid rgba(255,255,255,0.2)',
        }} />

        {/* Top: bank name + monthly total */}
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          position: 'relative',
          zIndex: 1,
        }}>
          <div>
            {card.bank && (
              <p style={{
                fontSize: '11px',
                fontWeight: 600,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                opacity: 0.65,
                marginBottom: '4px',
              }}>
                {card.bank}
              </p>
            )}
            <p style={{
              fontSize: '18px',
              fontWeight: 700,
              letterSpacing: '-0.01em',
              lineHeight: 1.2,
            }}>
              {card.name}
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{
              fontSize: '10px',
              fontWeight: 600,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              opacity: 0.65,
              marginBottom: '4px',
            }}>
              Mensuel
            </p>
            <p style={{
              fontSize: '22px',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              fontVariantNumeric: 'tabular-nums',
            }}>
              {formatCAD(monthlyTotal)}
            </p>
          </div>
        </div>

        {/* Bottom: card number */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <p style={{
            fontSize: '20px',
            fontWeight: 800,
            letterSpacing: '0.14em',
            fontVariantNumeric: 'tabular-nums',
          }}>
            <span style={{ fontSize: '15px', opacity: 0.5, verticalAlign: 'middle', letterSpacing: '0.04em' }}>•••• •••• ••••</span>
            {' '}{card.last_four ?? '????'}
          </p>
        </div>
      </div>

      {/* ── Stats ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        {[
          { label: 'Prélèvements auto', value: autoExpenses.length },
          { label: 'Dépenses totales', value: expenses.length },
        ].map(({ label, value }) => (
          <div key={label} style={{
            background: 'white',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-md)',
            padding: '16px 20px',
            boxShadow: 'var(--shadow-sm)',
          }}>
            <p style={{
              fontSize: 'clamp(1.5rem, 6vw, 2rem)',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              color: 'var(--text-primary)',
              lineHeight: 1,
              fontVariantNumeric: 'tabular-nums',
            }}>
              {value}
            </p>
            <p style={{
              fontSize: '12px',
              fontWeight: 500,
              color: 'var(--text-tertiary)',
              marginTop: '6px',
            }}>
              {label}
            </p>
          </div>
        ))}
      </div>

      {/* ── Auto-charged expenses ── */}
      {autoExpenses.length > 0 && (
        <div className="list-card">
          <div className="list-card-header">
            <h3 className="list-card-header-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
              Prélèvements automatiques
            </h3>
          </div>
          {autoExpenses.map((expense, idx) => {
            const days    = expense.next_due_date ? daysUntil(expense.next_due_date) : null;
            const monthly = calcMonthlyCost(expense);
            const badge   = days !== null ? getDueBadge(days) : { bg: 'var(--accent-subtle)', color: 'var(--accent)' };
            return (
              <div key={expense.id}>
                {idx > 0 && <div className="list-card-divider" style={{ marginLeft: '20px', marginRight: '20px' }} />}
                <div className="list-card-row">
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: 'var(--radius-sm)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.875rem',
                    background: 'var(--surface-sunken)',
                    flexShrink: 0,
                  }}>
                    {expense.section?.icon ?? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="5" width="20" height="14" rx="3" />
                        <path d="M2 10h20" />
                      </svg>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      fontSize: 'var(--text-sm)',
                      fontWeight: 500,
                      color: 'var(--text-primary)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {expense.name}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                        {expense.section?.name ?? '--'}
                      </span>
                      {expense.next_due_date && days !== null && (
                        <span className="badge" style={{
                          background: badge.bg,
                          color: badge.color,
                          fontSize: '10px',
                          padding: '1px 6px',
                        }}>
                          J-{days}
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p className="amount" style={{ fontSize: 'var(--text-sm)' }}>
                      {formatCAD(expense.amount)}
                    </p>
                    {monthly !== expense.amount && (
                      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                        {formatCAD(monthly)}/mois
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Other expenses ── */}
      {manualExpenses.length > 0 && (
        <div className="list-card">
          <div className="list-card-header">
            <h3 className="list-card-header-title">Autres dépenses liées</h3>
          </div>
          {manualExpenses.map((expense, idx) => (
            <div key={expense.id}>
              {idx > 0 && <div className="list-card-divider" style={{ marginLeft: '20px', marginRight: '20px' }} />}
              <div className="list-card-row">
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.875rem',
                  background: 'var(--surface-sunken)',
                  flexShrink: 0,
                }}>
                  {expense.section?.icon ?? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="5" width="20" height="14" rx="3" />
                      <path d="M2 10h20" />
                    </svg>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    fontSize: 'var(--text-sm)',
                    fontWeight: 500,
                    color: 'var(--text-primary)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {expense.name}
                  </p>
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                    {expense.section?.name ?? '--'}
                  </p>
                </div>
                <p className="amount" style={{ fontSize: 'var(--text-sm)', flexShrink: 0 }}>
                  {formatCAD(expense.amount)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Empty state ── */}
      {expenses.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '60px 32px',
          background: 'white',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-sm)',
        }}>
          <div style={{
            width: '72px',
            height: '72px',
            borderRadius: '50%',
            background: 'var(--accent-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            fontSize: '32px',
          }}>
            💳
          </div>
          <p style={{
            fontSize: '18px',
            fontWeight: 700,
            color: 'var(--text-primary)',
            letterSpacing: '-0.02em',
            marginBottom: '8px',
          }}>
            Aucune dépense liée
          </p>
          <p style={{
            fontSize: '14px',
            color: 'var(--text-tertiary)',
            lineHeight: 1.6,
            maxWidth: '260px',
            margin: '0 auto',
          }}>
            Les dépenses associées à cette carte apparaîtront ici
          </p>
        </div>
      )}

      {/* ── Back link ── */}
      <Link
        href="/cartes"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          padding: '12px',
          fontSize: 'var(--text-sm)',
          color: 'var(--text-tertiary)',
          textDecoration: 'none',
          transition: 'color var(--duration-fast) var(--ease-out)',
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 5l-7 7 7 7" />
        </svg>
        Retour aux cartes
      </Link>
    </div>
  );
}
