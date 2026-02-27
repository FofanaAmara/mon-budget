'use client';

import Link from 'next/link';
import { formatCAD } from '@/lib/utils';
import type { MonthSummary } from '@/lib/types';

type Props = {
  summary: MonthSummary;
  incomeSummary: { expectedTotal: number; actualTotal: number };
  totalMonthlyExpenses: number;
};

export default function TabTableauDeBord({ summary, incomeSummary }: Props) {
  const solde = incomeSummary.actualTotal - summary.paid_total;
  const soldePositive = solde >= 0;

  // Revenus: ratio reçu vs attendu
  const revenuPct = incomeSummary.expectedTotal > 0
    ? (incomeSummary.actualTotal / incomeSummary.expectedTotal) * 100 : 0;
  const revenuOver = incomeSummary.actualTotal > incomeSummary.expectedTotal;
  const revenuDelta = incomeSummary.actualTotal - incomeSummary.expectedTotal;

  // Depenses: ratio dépensé vs charges prévues (planned_total)
  const chargesFixes = summary.planned_total;
  const depensePct = chargesFixes > 0
    ? (summary.paid_total / chargesFixes) * 100 : 0;
  const depenseOver = summary.paid_total > chargesFixes;
  const depenseDelta = summary.paid_total - chargesFixes;

  // Reste à payer = charges prévues non payées
  const restAPayer = Math.max(chargesFixes - summary.paid_total, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Revenus card */}
      <Link href="/revenus" className="block card card-press">
        <div style={{ padding: '16px 20px' }}>
          <div className="flex items-center justify-between" style={{ marginBottom: '12px' }}>
            <span className="section-label">Revenus</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="2" strokeLinecap="round"><path d="M9 18l6-6-6-6" /></svg>
          </div>

          {/* Two columns: Reçu | Attendu */}
          <div className="flex items-start justify-between" style={{ marginBottom: '12px' }}>
            <div>
              <p style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: '2px' }}>Reçu</p>
              <p className="amount" style={{ fontSize: 'var(--text-lg)', color: 'var(--positive)' }}>
                {formatCAD(incomeSummary.actualTotal)}
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: '2px' }}>Attendu</p>
              <p className="amount" style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                {formatCAD(incomeSummary.expectedTotal)}
              </p>
            </div>
          </div>

          {/* Progress bar with overflow */}
          <div className="progress-track" style={{ position: 'relative', overflow: 'visible' }}>
            {revenuOver ? (
              <>
                {/* Full green bar */}
                <div className="progress-fill" style={{
                  width: '100%',
                  background: 'var(--positive)',
                  boxShadow: '0 0 8px rgba(5, 150, 105, 0.4)',
                }} />
                {/* Overflow glow indicator */}
                <div style={{
                  position: 'absolute', right: '-2px', top: '-3px', bottom: '-3px',
                  width: '6px', borderRadius: '3px',
                  background: 'var(--positive)',
                  boxShadow: '0 0 10px rgba(5, 150, 105, 0.6)',
                }} />
              </>
            ) : (
              <div className="progress-fill" style={{
                width: `${Math.max(revenuPct, 2)}%`,
                background: revenuPct >= 80 ? 'var(--positive)' : 'var(--accent)',
              }} />
            )}
          </div>

          {/* Delta label */}
          <p style={{ fontSize: 'var(--text-xs)', marginTop: '6px', fontWeight: 600, color: revenuOver ? 'var(--positive)' : 'var(--text-tertiary)' }}>
            {revenuOver
              ? `+${formatCAD(revenuDelta)} de plus que prevu`
              : revenuDelta === 0
                ? 'Objectif atteint'
                : `${formatCAD(Math.abs(revenuDelta))} restant a recevoir`}
          </p>
        </div>
      </Link>

      {/* Depenses card */}
      <Link href="/depenses" className="block card card-press">
        <div style={{ padding: '16px 20px' }}>
          <div className="flex items-center justify-between" style={{ marginBottom: '12px' }}>
            <span className="section-label">Depenses</span>
            <div className="flex items-center" style={{ gap: '8px' }}>
              {summary.overdue_count > 0 && (
                <span className="badge" style={{ background: 'var(--negative-subtle)', color: 'var(--negative-text)' }}>
                  {summary.overdue_count} en retard
                </span>
              )}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="2" strokeLinecap="round"><path d="M9 18l6-6-6-6" /></svg>
            </div>
          </div>

          {/* Two columns: Dépensé | Charges fixes */}
          <div className="flex items-start justify-between" style={{ marginBottom: '12px' }}>
            <div>
              <p style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: '2px' }}>Depense</p>
              <p className="amount" style={{ fontSize: 'var(--text-lg)', color: depenseOver ? 'var(--negative-text)' : 'var(--text-primary)' }}>
                {formatCAD(summary.paid_total)}
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: '2px' }}>Charges fixes</p>
              <p className="amount" style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                {formatCAD(chargesFixes)}
              </p>
            </div>
          </div>

          {/* Progress bar with overflow */}
          <div className="progress-track" style={{ position: 'relative', overflow: 'visible' }}>
            {depenseOver ? (
              <>
                {/* Base fills the charges portion */}
                <div className="progress-fill" style={{
                  width: `${Math.min((chargesFixes / summary.paid_total) * 100, 100)}%`,
                  background: 'var(--accent)',
                  borderRadius: 'var(--radius-sm) 0 0 var(--radius-sm)',
                  position: 'absolute', left: 0, top: 0, bottom: 0,
                }} />
                {/* Red overflow segment */}
                <div style={{
                  position: 'absolute',
                  left: `${(chargesFixes / summary.paid_total) * 100}%`,
                  right: 0, top: 0, bottom: 0,
                  width: `${100 - (chargesFixes / summary.paid_total) * 100}%`,
                  background: 'var(--negative)',
                  borderRadius: '0 var(--radius-sm) var(--radius-sm) 0',
                  boxShadow: '0 0 8px rgba(220, 38, 38, 0.3)',
                }} />
              </>
            ) : (
              <div className="progress-fill" style={{
                width: `${Math.max(Math.min(depensePct, 100), 2)}%`,
                background: depensePct >= 90 ? 'var(--warning)' : 'var(--accent)',
              }} />
            )}
          </div>

          {/* Delta label */}
          <p style={{ fontSize: 'var(--text-xs)', marginTop: '6px', fontWeight: 600, color: depenseOver ? 'var(--negative-text)' : 'var(--text-tertiary)' }}>
            {depenseOver
              ? `+${formatCAD(depenseDelta)} au-dessus des charges`
              : depenseDelta === 0
                ? 'Toutes les charges payees'
                : `${formatCAD(Math.abs(depenseDelta))} restant sur les charges`}
          </p>
        </div>
      </Link>

      {/* Solde du mois */}
      <div className="card" style={{
        padding: '16px 20px',
        background: soldePositive
          ? 'linear-gradient(135deg, #059669, #047857)'
          : 'linear-gradient(135deg, #DC2626, #B91C1C)',
        color: 'white',
        borderColor: 'transparent',
      }}>
        <p style={{ fontSize: 'var(--text-xs)', fontWeight: 600, opacity: 0.75, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>
          Solde du mois
        </p>
        <p className="amount" style={{ fontSize: 'var(--text-xl)', fontWeight: 750 }}>
          {soldePositive ? '+' : ''}{formatCAD(solde)}
        </p>
        <p style={{ fontSize: 'var(--text-xs)', opacity: 0.7, marginTop: '4px' }}>
          Reçu {formatCAD(incomeSummary.actualTotal)} - Payé {formatCAD(summary.paid_total)}
        </p>
      </div>

      {/* Reste a payer */}
      <div className="card" style={{ padding: '16px 20px' }}>
        <p style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: '4px' }}>
          Reste a payer ce mois
        </p>
        <p className="amount" style={{ fontSize: 'var(--text-lg)', color: restAPayer > 0 ? 'var(--warning-text)' : 'var(--positive)' }}>
          {formatCAD(restAPayer)}
        </p>
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: '2px' }}>
          {summary.count - summary.paid_count} depense{summary.count - summary.paid_count !== 1 ? 's' : ''} restante{summary.count - summary.paid_count !== 1 ? 's' : ''}
        </p>
      </div>

    </div>
  );
}
