'use client';

import { useRouter } from 'next/navigation';
import { formatCAD } from '@/lib/utils';
import type { CashFlowData } from '@/lib/actions/cash-flow';

type Props = {
  data: CashFlowData;
  month: string;
};

function monthLabel(month: string) {
  const [y, m] = month.split('-').map(Number);
  return new Intl.DateTimeFormat('fr-CA', { month: 'long', year: 'numeric' }).format(
    new Date(y, m - 1, 1)
  );
}

function prevMonth(month: string) {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(y, m - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function nextMonth(month: string) {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(y, m, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export default function CashFlowClient({ data, month }: Props) {
  const router = useRouter();
  const { entrees, sorties, solde } = data;

  const soldePositive = solde >= 0;
  const hasEntrees = entrees.bySource.length > 0;
  const hasSorties = sorties.bySection.length > 0;

  return (
    <div style={{ paddingTop: '36px', paddingBottom: '96px' }}>
      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* ── Header ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{
              fontSize: 'var(--text-xl)',
              fontWeight: 750,
              color: 'var(--text-primary)',
              letterSpacing: 'var(--tracking-tight)',
              lineHeight: 'var(--leading-tight)',
            }}>
              Cash Flow
            </h1>
            <p style={{
              fontSize: 'var(--text-xs)',
              color: 'var(--text-tertiary)',
              marginTop: '2px',
              fontWeight: 500,
            }}>
              Entrées − Sorties = Solde
            </p>
          </div>

          {/* Month navigation */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => router.push(`/cash-flow?month=${prevMonth(month)}`)}
              className="icon-btn"
              aria-label="Mois précédent"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <span style={{
              fontSize: 'var(--text-xs)',
              fontWeight: 650,
              color: 'var(--text-primary)',
              textTransform: 'capitalize',
              minWidth: '90px',
              textAlign: 'center',
            }}>
              {monthLabel(month)}
            </span>
            <button
              onClick={() => router.push(`/cash-flow?month=${nextMonth(month)}`)}
              className="icon-btn"
              aria-label="Mois suivant"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>
        </div>

        {/* ── SOLDE hero ── */}
        <div
          style={{
            borderRadius: 'var(--radius-xl)',
            padding: '28px 24px 24px',
            color: 'var(--text-inverted)',
            position: 'relative',
            overflow: 'hidden',
            background: soldePositive
              ? 'linear-gradient(145deg, #059669 0%, #047857 50%, #065F46 100%)'
              : 'linear-gradient(145deg, #DC2626 0%, #B91C1C 50%, #991B1B 100%)',
            boxShadow: soldePositive
              ? '0 8px 32px rgba(5,150,105,0.22), 0 2px 8px rgba(5,150,105,0.10)'
              : '0 8px 32px rgba(220,38,38,0.22), 0 2px 8px rgba(220,38,38,0.10)',
          }}
        >
          {/* Decorative orb */}
          <div style={{
            position: 'absolute', top: '-24px', right: '-24px',
            width: '120px', height: '120px', borderRadius: '50%',
            background: 'rgba(255,255,255,0.06)', pointerEvents: 'none',
          }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <p style={{
              fontSize: 'var(--text-xs)',
              color: 'rgba(255,255,255,0.55)',
              fontWeight: 600,
              letterSpacing: 'var(--tracking-widest)',
              textTransform: 'uppercase' as const,
              marginBottom: '8px',
            }}>
              Solde du mois
            </p>
            <p className="amount" style={{
              fontSize: 'var(--text-3xl)',
              lineHeight: 'var(--leading-none)',
              fontWeight: 750,
              letterSpacing: '-0.03em',
            }}>
              {soldePositive ? '+' : ''}{formatCAD(solde)}
            </p>
            <div style={{
              display: 'flex',
              gap: '20px',
              marginTop: '16px',
            }}>
              <div>
                <p style={{ fontSize: 'var(--text-xs)', color: 'rgba(255,255,255,0.50)', fontWeight: 500 }}>Entrées reçues</p>
                <p className="amount" style={{ fontSize: 'var(--text-sm)', fontWeight: 650 }}>
                  {formatCAD(entrees.total_actual)}
                </p>
              </div>
              <div style={{ width: '1px', background: 'rgba(255,255,255,0.15)' }} />
              <div>
                <p style={{ fontSize: 'var(--text-xs)', color: 'rgba(255,255,255,0.50)', fontWeight: 500 }}>Sorties payées</p>
                <p className="amount" style={{ fontSize: 'var(--text-sm)', fontWeight: 650 }}>
                  {formatCAD(sorties.total_paid)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── ENTRÉES ── */}
        <div className="card">
          <div style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <span className="section-label">Entrées</span>
              <div style={{ textAlign: 'right' }}>
                <span className="amount" style={{ fontSize: 'var(--text-sm)', color: 'var(--positive)' }}>
                  {formatCAD(entrees.total_actual)}
                </span>
                {entrees.total_expected > 0 && entrees.total_expected !== entrees.total_actual && (
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginLeft: '4px' }}>
                    / {formatCAD(entrees.total_expected)} attendu
                  </span>
                )}
              </div>
            </div>

            {!hasEntrees ? (
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)' }}>
                Aucun revenu enregistré ce mois
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {entrees.bySource.map((row) => {
                  const pct = row.expected > 0 ? Math.min((row.actual / row.expected) * 100, 100) : 0;
                  return (
                    <div key={row.source}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '16px' }}>{row.icon}</span>
                          <span style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--text-primary)' }}>
                            {row.label}
                          </span>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span className="amount" style={{ fontSize: 'var(--text-sm)', color: 'var(--positive)' }}>
                            {formatCAD(row.actual)}
                          </span>
                          {row.expected > 0 && (
                            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginLeft: '4px' }}>
                              / {formatCAD(row.expected)}
                            </span>
                          )}
                        </div>
                      </div>
                      {row.expected > 0 && (
                        <div className="progress-track">
                          <div
                            className="progress-fill"
                            style={{
                              width: `${Math.max(pct, pct > 0 ? 2 : 0)}%`,
                              backgroundColor: 'var(--positive)',
                            }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── SORTIES ── */}
        <div className="card">
          <div style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <span className="section-label">Sorties</span>
              <div style={{ textAlign: 'right' }}>
                <span className="amount" style={{ fontSize: 'var(--text-sm)', color: 'var(--negative)' }}>
                  {formatCAD(sorties.total_paid)}
                </span>
                {sorties.total > 0 && sorties.total !== sorties.total_paid && (
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginLeft: '4px' }}>
                    / {formatCAD(sorties.total)} prévu
                  </span>
                )}
              </div>
            </div>

            {!hasSorties ? (
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)' }}>
                Aucune dépense ce mois
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {sorties.bySection.map((row) => {
                  const pct = row.total > 0 ? (row.paid / row.total) * 100 : 0;
                  return (
                    <div key={row.section_id}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{
                            width: '8px', height: '8px',
                            borderRadius: 'var(--radius-full)',
                            backgroundColor: row.section_color,
                            flexShrink: 0,
                          }} />
                          <span style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--text-primary)' }}>
                            {row.section_icon} {row.section_name}
                          </span>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span className="amount" style={{ fontSize: 'var(--text-sm)' }}>
                            {formatCAD(row.paid)}
                          </span>
                          {row.total > 0 && (
                            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginLeft: '4px' }}>
                              / {formatCAD(row.total)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="progress-track">
                        <div
                          className="progress-fill"
                          style={{
                            width: `${Math.max(pct, pct > 0 ? 2 : 0)}%`,
                            backgroundColor: row.section_color,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Summary totals ── */}
        <div className="card">
          <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', fontWeight: 500 }}>
                Total entrées attendues
              </span>
              <span className="amount" style={{ fontSize: 'var(--text-sm)', color: 'var(--positive)' }}>
                {formatCAD(entrees.total_expected)}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', fontWeight: 500 }}>
                Total sorties prévues
              </span>
              <span className="amount" style={{ fontSize: 'var(--text-sm)', color: 'var(--negative)' }}>
                {formatCAD(sorties.total)}
              </span>
            </div>
            <div className="divider" />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 'var(--text-sm)', fontWeight: 650, color: 'var(--text-primary)' }}>
                Solde théorique
              </span>
              <span className="amount" style={{
                fontSize: 'var(--text-sm)',
                fontWeight: 650,
                color: (entrees.total_expected - sorties.total) >= 0 ? 'var(--positive)' : 'var(--negative)',
              }}>
                {entrees.total_expected - sorties.total >= 0 ? '+' : ''}{formatCAD(entrees.total_expected - sorties.total)}
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
