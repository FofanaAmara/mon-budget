'use client';

import Link from 'next/link';
import { formatCAD } from '@/lib/utils';
import type { MonthSummary, Expense } from '@/lib/types';

type Props = {
  summary: MonthSummary;
  incomeSummary: { expectedTotal: number; actualTotal: number };
  totalMonthlyExpenses: number;
  projets: Expense[];
};

export default function TabTableauDeBord({ summary, incomeSummary, totalMonthlyExpenses, projets }: Props) {
  const solde = incomeSummary.actualTotal - summary.paid_total;
  const soldePositive = solde >= 0;
  const restAPayer = summary.total - summary.paid_total;
  const totalEpargne = projets.reduce((s, p) => s + Number(p.saved_amount ?? 0), 0);
  const projetsActifs = projets.filter(p => p.target_amount !== null && Number(p.target_amount) > 0).length;
  const progressPctExpenses = summary.count > 0 ? (summary.paid_count / summary.count) * 100 : 0;
  const progressPctIncomes = incomeSummary.expectedTotal > 0 ? (incomeSummary.actualTotal / incomeSummary.expectedTotal) * 100 : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Revenus card */}
      <Link href="/revenus" className="block card card-press">
        <div style={{ padding: '16px 20px' }}>
          <div className="flex items-center justify-between" style={{ marginBottom: '10px' }}>
            <span className="section-label">Revenus</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="2" strokeLinecap="round"><path d="M9 18l6-6-6-6" /></svg>
          </div>
          <div className="flex items-end justify-between" style={{ marginBottom: '10px' }}>
            <div>
              <p className="amount" style={{ fontSize: 'var(--text-lg)', color: 'var(--positive)' }}>
                {formatCAD(incomeSummary.actualTotal)}
              </p>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                reçu / {formatCAD(incomeSummary.expectedTotal)} attendu
              </p>
            </div>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${Math.min(progressPctIncomes, 100)}%`, background: progressPctIncomes >= 80 ? 'var(--positive)' : 'var(--accent)' }} />
          </div>
        </div>
      </Link>

      {/* Depenses card */}
      <Link href="/depenses" className="block card card-press">
        <div style={{ padding: '16px 20px' }}>
          <div className="flex items-center justify-between" style={{ marginBottom: '10px' }}>
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
          <div className="flex items-end justify-between" style={{ marginBottom: '10px' }}>
            <div>
              <p className="amount" style={{ fontSize: 'var(--text-lg)' }}>
                {formatCAD(summary.paid_total)}
              </p>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                payé / {formatCAD(summary.total)} total
              </p>
            </div>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${Math.min(progressPctExpenses, 100)}%`, background: progressPctExpenses >= 100 ? 'var(--positive)' : 'var(--accent)' }} />
          </div>
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

      {/* Epargne */}
      <Link href="/projets" className="block card card-press">
        <div style={{ padding: '16px 20px' }}>
          <div className="flex items-center justify-between" style={{ marginBottom: '10px' }}>
            <span className="section-label">Epargne</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="2" strokeLinecap="round"><path d="M9 18l6-6-6-6" /></svg>
          </div>
          <p className="amount" style={{ fontSize: 'var(--text-lg)', color: 'var(--positive)' }}>
            {formatCAD(totalEpargne)}
          </p>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: '2px' }}>
            {projetsActifs} projet{projetsActifs !== 1 ? 's' : ''} actif{projetsActifs !== 1 ? 's' : ''}
          </p>
        </div>
      </Link>
    </div>
  );
}
