'use client';

import Link from 'next/link';
import { formatCAD } from '@/lib/utils';
import type { MonthSummary, MonthlySavingsSummary, MonthlyDebtSummary } from '@/lib/types';

type Props = {
  summary: MonthSummary;
  incomeSummary: { expectedTotal: number; actualTotal: number };
  totalMonthlyExpenses: number;
  savingsSummary: MonthlySavingsSummary;
  debtSummary: MonthlyDebtSummary;
  totalDebtBalance: number;
  totalEpargne: number;
  valeurNette: number;
};

// Chevron arrow for clickable cards
function ChevronRight() {
  return (
    <svg
      style={{ position: 'absolute', top: '16px', right: '14px', width: '20px', height: '20px', color: 'var(--slate-300)', transition: 'all 0.25s ease', flexShrink: 0 }}
      viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

// Card icon wrapper
function CardIcon({ children, className }: { children: React.ReactNode; className: 'revenus' | 'depenses' | 'epargne' | 'dettes' }) {
  const styles: Record<string, React.CSSProperties> = {
    revenus:  { background: 'var(--teal-50)',      color: 'var(--teal-700)' },
    depenses: { background: '#FFF7ED',             color: '#EA580C' },
    epargne:  { background: 'var(--success-light)', color: 'var(--positive)' },
    dettes:   { background: 'var(--error-light)',  color: 'var(--error)' },
  };
  return (
    <div style={{
      width: '40px', height: '40px',
      borderRadius: 'var(--radius-sm)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      marginBottom: '14px',
      ...styles[className],
    }}>
      {children}
    </div>
  );
}

// Reusable summary card
function SummaryCard({ href, children, style }: { href: string; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <Link
      href={href}
      className="block"
      style={{
        background: 'var(--surface-raised)',
        border: '1px solid var(--slate-200)',
        borderRadius: 'var(--radius-lg)',
        padding: '20px 16px',
        cursor: 'pointer',
        textDecoration: 'none',
        display: 'block',
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.25s ease',
        ...style,
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.borderColor = 'rgba(15, 118, 110, 0.2)';
        el.style.boxShadow = 'var(--shadow-md)';
        el.style.transform = 'translateY(-2px)';
        const arrow = el.querySelector('[data-arrow]') as HTMLElement | null;
        if (arrow) {
          arrow.style.color = 'var(--teal-700)';
          arrow.style.transform = 'translateX(2px)';
        }
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.borderColor = 'var(--slate-200)';
        el.style.boxShadow = 'none';
        el.style.transform = 'translateY(0)';
        const arrow = el.querySelector('[data-arrow]') as HTMLElement | null;
        if (arrow) {
          arrow.style.color = 'var(--slate-300)';
          arrow.style.transform = 'translateX(0)';
        }
      }}
      onMouseDown={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.transform = 'translateY(0)';
        el.style.boxShadow = 'var(--shadow-sm)';
      }}
      onMouseUp={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.transform = 'translateY(-2px)';
        el.style.boxShadow = 'var(--shadow-md)';
      }}
    >
      {/* Chevron arrow */}
      <svg
        data-arrow
        style={{ position: 'absolute', top: '16px', right: '14px', width: '20px', height: '20px', color: 'var(--slate-300)', transition: 'all 0.25s ease' }}
        viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      >
        <polyline points="9 18 15 12 9 6" />
      </svg>
      {children}
    </Link>
  );
}

// Card label (uppercase, muted)
function CardLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: '11px', fontWeight: 700,
      letterSpacing: '0.08em', textTransform: 'uppercase',
      color: 'var(--slate-400)', marginBottom: '6px',
    }}>
      {children}
    </div>
  );
}

// Card amount
function CardAmount({ children, color }: { children: React.ReactNode; color?: string }) {
  return (
    <div style={{
      fontSize: 'clamp(1.5rem, 5vw, 2rem)',
      fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.1,
      color: color ?? 'var(--slate-900)',
      fontVariantNumeric: 'tabular-nums',
    }}>
      {children}
    </div>
  );
}

// Card sub-text
function CardSub({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: '12px', fontWeight: 500,
      color: 'var(--slate-400)', marginTop: '4px',
      letterSpacing: '-0.01em',
    }}>
      {children}
    </div>
  );
}

// Dollar superscript
function Dollar({ color }: { color?: string }) {
  return (
    <span style={{
      fontSize: '0.5em', fontWeight: 600,
      color: color ?? 'var(--teal-700)',
      verticalAlign: 'super',
    }}>
      $
    </span>
  );
}

export default function TabTableauDeBord({
  summary,
  incomeSummary,
  savingsSummary,
  debtSummary,
  totalDebtBalance,
  totalEpargne,
  valeurNette,
}: Props) {
  // Epargne progress (toward goals)
  const savingsGoalTotal = savingsSummary.byProject.reduce((s, p) => s + p.total, 0);
  const savingsPct = totalEpargne > 0 && savingsGoalTotal > 0
    ? Math.min((savingsSummary.totalContributions / totalEpargne) * 100, 100)
    : 0;

  return (
    <div>
      {/* ====== 4-CARD 2×2 GRID ====== */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '12px',
        paddingTop: '24px',
      }}>

        {/* Card 1 — Revenus */}
        <SummaryCard href="/revenus">
          <CardIcon className="revenus">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
              <polyline points="17 6 23 6 23 12" />
            </svg>
          </CardIcon>
          <CardLabel>Revenus</CardLabel>
          <CardAmount>
            {Math.round(incomeSummary.actualTotal).toLocaleString('fr-CA')}
            <Dollar color="var(--teal-700)" />
          </CardAmount>
          <CardSub>
            / <strong style={{ fontWeight: 700, color: 'var(--slate-500)' }}>
              {Math.round(incomeSummary.expectedTotal).toLocaleString('fr-CA')} $
            </strong> attendus
          </CardSub>
        </SummaryCard>

        {/* Card 2 — Dépenses */}
        <SummaryCard href="/depenses">
          <CardIcon className="depenses">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
            </svg>
          </CardIcon>
          <CardLabel>Dépenses</CardLabel>
          <CardAmount>
            {Math.round(summary.paid_total).toLocaleString('fr-CA')}
            <Dollar color="var(--teal-700)" />
          </CardAmount>
          <CardSub>
            / <strong style={{ fontWeight: 700, color: 'var(--slate-500)' }}>
              {Math.round(summary.planned_total).toLocaleString('fr-CA')} $
            </strong> prévus
          </CardSub>
        </SummaryCard>

        {/* Card 3 — Épargne */}
        <SummaryCard href="/projets">
          <CardIcon className="epargne">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
            </svg>
          </CardIcon>
          <CardLabel>Épargne</CardLabel>
          <CardAmount>
            {Math.round(totalEpargne).toLocaleString('fr-CA')}
            <Dollar color="var(--teal-700)" />
          </CardAmount>
          {/* Progress bar */}
          {savingsPct > 0 && (
            <div style={{ marginTop: '10px' }}>
              <div style={{ height: '6px', background: 'var(--slate-100)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: '3px',
                  background: 'linear-gradient(90deg, var(--positive), #10B981)',
                  width: `${savingsPct}%`,
                  transition: 'width 0.8s ease',
                }} />
              </div>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--positive)', marginTop: '4px' }}>
                {Math.round(savingsPct)}% des objectifs
              </div>
            </div>
          )}
          {savingsPct === 0 && (
            <CardSub>
              {savingsSummary.contributionCount > 0
                ? `+${formatCAD(savingsSummary.totalContributions)} ce mois`
                : 'Aucune contribution'}
            </CardSub>
          )}
        </SummaryCard>

        {/* Card 4 — Dettes */}
        <SummaryCard href="/projets">
          <CardIcon className="dettes">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
              <line x1="1" y1="10" x2="23" y2="10" />
            </svg>
          </CardIcon>
          <CardLabel>Dettes</CardLabel>
          <CardAmount color="var(--error)">
            {Math.round(totalDebtBalance).toLocaleString('fr-CA')}
            <span style={{ fontSize: '0.5em', fontWeight: 600, verticalAlign: 'super' }}>$</span>
          </CardAmount>
          <CardSub>
            {debtSummary.totalPayments > 0
              ? `${formatCAD(debtSummary.totalPayments)}/mois en mensualités`
              : 'Aucune mensualité ce mois'}
          </CardSub>
        </SummaryCard>

      </div>

      {/* ====== VALEUR NETTE — wide teal-50 card ====== */}
      <div style={{
        paddingTop: '24px',
        paddingBottom: '8px',
      }}>
        <div style={{
          background: 'var(--teal-50)',
          border: '1px solid rgba(15, 118, 110, 0.1)',
          borderRadius: 'var(--radius-lg)',
          padding: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          {/* Left: icon + label */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '44px', height: '44px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--teal-700)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', flexShrink: 0,
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <div>
              <div style={{
                fontSize: '11px', fontWeight: 700,
                letterSpacing: '0.08em', textTransform: 'uppercase',
                color: 'var(--teal-700)', marginBottom: '2px',
              }}>
                Valeur nette
              </div>
              <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--slate-500)' }}>
                Épargne − Dettes
              </div>
            </div>
          </div>

          {/* Right: amount */}
          <div style={{
            fontSize: 'clamp(1.5rem, 5vw, 2rem)',
            fontWeight: 800, letterSpacing: '-0.03em',
            color: valeurNette >= 0 ? 'var(--teal-700)' : 'var(--error)',
            fontVariantNumeric: 'tabular-nums',
          }}>
            {valeurNette >= 0 ? '+' : ''}
            {Math.round(Math.abs(valeurNette)).toLocaleString('fr-CA')}
            <span style={{ fontSize: '0.5em', fontWeight: 600, verticalAlign: 'super' }}>$</span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
