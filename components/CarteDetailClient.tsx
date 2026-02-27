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
    <div style={{ padding: '36px 20px 24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Card visual — colored gradient with depth */}
      <div
        style={{
          borderRadius: 'var(--radius-xl)',
          padding: '24px 20px 20px',
          color: 'var(--text-inverted)',
          position: 'relative',
          overflow: 'hidden',
          background: `linear-gradient(135deg, ${card.color} 0%, ${card.color}CC 100%)`,
          boxShadow: `0 8px 32px ${card.color}35, 0 2px 8px ${card.color}20`,
        }}
      >
        <div style={{
          position: 'absolute', top: '-24px', right: '-24px',
          width: '96px', height: '96px', borderRadius: 'var(--radius-full)',
          background: 'rgba(255,255,255,0.08)', pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: '16px', right: '80px',
          width: '64px', height: '64px', borderRadius: 'var(--radius-full)',
          background: 'rgba(255,255,255,0.05)', pointerEvents: 'none',
        }} />

        <div className="flex justify-between items-start" style={{ marginBottom: '24px' }}>
          <div>
            <p className="section-label" style={{ color: 'rgba(250,250,248,0.60)' }}>
              {card.bank ?? 'Carte'}
            </p>
            <p style={{
              fontSize: 'var(--text-lg)', fontWeight: 700,
              marginTop: '4px', letterSpacing: 'var(--tracking-tight)',
            }}>
              {card.name}
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{
              color: 'rgba(250,250,248,0.60)',
              fontSize: '10px', letterSpacing: 'var(--tracking-wide)',
            }}>Mensuel</p>
            <p className="amount" style={{
              fontSize: 'var(--text-xl)',
              letterSpacing: 'var(--tracking-tight)',
            }}>
              {formatCAD(monthlyTotal)}
            </p>
          </div>
        </div>

        <p style={{
          color: 'rgba(250,250,248,0.50)',
          fontSize: 'var(--text-sm)',
          fontFamily: 'monospace',
          letterSpacing: 'var(--tracking-widest)',
        }}>
          .... .... .... {card.last_four ?? '????'}
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        {[
          { label: 'Prelevements auto', value: autoExpenses.length },
          { label: 'Depenses totales', value: expenses.length },
        ].map(({ label, value }) => (
          <div key={label} className="card" style={{ padding: '16px 20px' }}>
            <p className="amount" style={{
              fontSize: 'var(--text-2xl)',
              color: 'var(--text-primary)',
              letterSpacing: 'var(--tracking-tight)',
            }}>
              {value}
            </p>
            <p style={{
              fontSize: 'var(--text-xs)',
              color: 'var(--text-tertiary)',
              marginTop: '4px',
            }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Auto-charged expenses */}
      {autoExpenses.length > 0 && (
        <div className="list-card">
          <div className="list-card-header">
            <h3 className="list-card-header-title flex items-center" style={{ gap: '8px' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
              Prelevements automatiques
            </h3>
          </div>
          {autoExpenses.map((expense, idx) => {
            const days = expense.next_due_date ? daysUntil(expense.next_due_date) : null;
            const monthly = calcMonthlyCost(expense);
            const badge = days !== null ? getDueBadge(days) : { bg: 'var(--accent-subtle)', color: 'var(--accent)' };
            return (
              <div key={expense.id}>
                {idx > 0 && <div className="list-card-divider" style={{ marginLeft: '20px', marginRight: '20px' }} />}
                <div className="list-card-row">
                  <div style={{
                    width: '32px', height: '32px',
                    borderRadius: 'var(--radius-sm)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
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
                      fontSize: 'var(--text-sm)', fontWeight: 500,
                      color: 'var(--text-primary)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>{expense.name}</p>
                    <div className="flex items-center" style={{ gap: '8px', marginTop: '4px' }}>
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                        {expense.section?.name ?? '--'}
                      </span>
                      {expense.next_due_date && days !== null && (
                        <span className="badge" style={{
                          background: badge.bg, color: badge.color,
                          fontSize: '10px', padding: '1px 6px',
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

      {/* Other expenses */}
      {manualExpenses.length > 0 && (
        <div className="list-card">
          <div className="list-card-header">
            <h3 className="list-card-header-title">Autres depenses liees</h3>
          </div>
          {manualExpenses.map((expense, idx) => (
            <div key={expense.id}>
              {idx > 0 && <div className="list-card-divider" style={{ marginLeft: '20px', marginRight: '20px' }} />}
              <div className="list-card-row">
                <div style={{
                  width: '32px', height: '32px',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
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
                    fontSize: 'var(--text-sm)', fontWeight: 500,
                    color: 'var(--text-primary)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>{expense.name}</p>
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

      {expenses.length === 0 && (
        <div className="card">
          <div className="empty-state" style={{ padding: '40px 24px' }}>
            <div className="empty-state-icon">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="5" width="20" height="14" rx="3" />
                <path d="M2 10h20" />
              </svg>
            </div>
            <p className="empty-state-text">Aucune depense liee a cette carte</p>
          </div>
        </div>
      )}

      <Link
        href="/cartes"
        className="flex items-center justify-center"
        style={{
          gap: '8px', padding: '12px',
          fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)',
          textDecoration: 'none',
          transition: `color var(--duration-fast) var(--ease-out)`,
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
