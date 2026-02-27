'use client';

import { formatCAD } from '@/lib/utils';
import type { MonthSummary, MonthlyExpense } from '@/lib/types';

type Props = {
  summary: MonthSummary;
  incomeSummary: { expectedTotal: number; actualTotal: number };
  expenses: MonthlyExpense[];
  monthlyIncomeFromTemplates: number;
  totalMonthlyExpenses: number;
};

export default function TabSanteFinanciere({ summary, incomeSummary, expenses, monthlyIncomeFromTemplates, totalMonthlyExpenses }: Props) {
  // Score de sante: % charges prévues couvertes par revenus recus
  const coverageActual = summary.planned_total > 0 ? Math.min((incomeSummary.actualTotal / summary.planned_total) * 100, 100) : 100;
  const coverageTheoretical = totalMonthlyExpenses > 0 ? Math.min((monthlyIncomeFromTemplates / totalMonthlyExpenses) * 100, 200) : 100;

  const scoreColor = coverageActual >= 80 ? 'var(--positive)' : coverageActual >= 50 ? 'var(--warning)' : 'var(--negative)';
  const scoreLabel = coverageActual >= 100 ? 'Excellent' : coverageActual >= 80 ? 'Bon' : coverageActual >= 50 ? 'Attention' : 'Critique';

  // Alertes
  const overdueExpenses = expenses.filter(e => e.status === 'OVERDUE');
  const bigUpcoming = expenses.filter(e => e.status === 'UPCOMING' && Number(e.amount) >= 500);

  // Reste a vivre
  const resteAVivreTheorique = monthlyIncomeFromTemplates - totalMonthlyExpenses;
  const resteAVivreActuel = incomeSummary.actualTotal - summary.paid_total;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Score de sante */}
      <div className="card" style={{ padding: '24px 20px', textAlign: 'center' }}>
        <p style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>
          Sante financiere
        </p>
        {/* Gauge */}
        <div style={{ position: 'relative', width: '120px', height: '60px', margin: '0 auto 12px', overflow: 'hidden' }}>
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: '120px',
            borderRadius: '60px 60px 0 0',
            background: 'var(--surface-sunken)',
          }} />
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: '120px',
            borderRadius: '60px 60px 0 0',
            background: `conic-gradient(from 180deg, ${scoreColor} 0deg, ${scoreColor} ${coverageActual * 1.8}deg, transparent ${coverageActual * 1.8}deg)`,
            clipPath: 'inset(50% 0 0 0)',
          }} />
          <div style={{
            position: 'absolute', bottom: '4px', left: '50%', transform: 'translateX(-50%)',
            fontSize: 'var(--text-lg)', fontWeight: 750, color: scoreColor,
          }}>
            {Math.round(coverageActual)}%
          </div>
        </div>
        <p style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: scoreColor }}>
          {scoreLabel}
        </p>
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: '4px' }}>
          Charges couvertes par les revenus reçus
        </p>
      </div>

      {/* Alertes prioritaires */}
      <div className="card" style={{ padding: '20px' }}>
        <p className="section-label" style={{ marginBottom: '12px' }}>Alertes prioritaires</p>
        {overdueExpenses.length === 0 && bigUpcoming.length === 0 ? (
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--positive)', fontWeight: 500 }}>
            Tout est sous controle ✓
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {overdueExpenses.length > 0 && (
              <div className="flex items-center" style={{ gap: '8px' }}>
                <span className="badge" style={{ background: 'var(--negative-subtle)', color: 'var(--negative-text)' }}>
                  ⚠ {overdueExpenses.length} en retard
                </span>
                <span className="amount" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                  {formatCAD(overdueExpenses.reduce((s, e) => s + Number(e.amount), 0))}
                </span>
              </div>
            )}
            {bigUpcoming.length > 0 && (
              <div className="flex items-center" style={{ gap: '8px' }}>
                <span className="badge" style={{ background: 'var(--warning-subtle)', color: 'var(--warning-text)' }}>
                  💰 {bigUpcoming.length} gros paiement{bigUpcoming.length > 1 ? 's' : ''}
                </span>
                <span className="amount" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                  {formatCAD(bigUpcoming.reduce((s, e) => s + Number(e.amount), 0))} a venir
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Reste a vivre */}
      <div className="card" style={{ padding: '20px' }}>
        <p className="section-label" style={{ marginBottom: '16px' }}>Reste a vivre</p>
        <div className="flex" style={{ gap: '12px' }}>
          <div style={{ flex: 1, padding: '12px', borderRadius: 'var(--radius-md)', background: 'var(--surface-inset)' }}>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', fontWeight: 600, marginBottom: '4px' }}>
              Theorique
            </p>
            <p className="amount" style={{
              fontSize: 'var(--text-base)',
              color: resteAVivreTheorique >= 0 ? 'var(--positive)' : 'var(--negative)',
            }}>
              {formatCAD(resteAVivreTheorique)}
            </p>
            <p style={{ fontSize: '10px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
              revenus - charges
            </p>
          </div>
          <div style={{ flex: 1, padding: '12px', borderRadius: 'var(--radius-md)', background: 'var(--surface-inset)' }}>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', fontWeight: 600, marginBottom: '4px' }}>
              Actuel
            </p>
            <p className="amount" style={{
              fontSize: 'var(--text-base)',
              color: resteAVivreActuel >= 0 ? 'var(--positive)' : 'var(--negative)',
            }}>
              {formatCAD(resteAVivreActuel)}
            </p>
            <p style={{ fontSize: '10px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
              reçu - payé
            </p>
          </div>
        </div>
        {coverageTheoretical < 100 && (
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--warning)', fontWeight: 600, marginTop: '12px' }}>
            ⚠ Vos charges mensuelles depassent vos revenus de {formatCAD(totalMonthlyExpenses - monthlyIncomeFromTemplates)}
          </p>
        )}
      </div>
    </div>
  );
}
