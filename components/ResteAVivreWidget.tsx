import Link from 'next/link';
import { formatCAD } from '@/lib/utils';

type Props = {
  monthlyIncome: number;
  monthlyExpenses: number;
};

export default function ResteAVivreWidget({ monthlyIncome, monthlyExpenses }: Props) {
  const resteAVivre = monthlyIncome - monthlyExpenses;
  const ratio = monthlyIncome > 0 ? Math.min((monthlyExpenses / monthlyIncome) * 100, 100) : 0;
  const isPositive = resteAVivre >= 0;

  const barColor = ratio > 90
    ? 'var(--negative)'
    : ratio > 70
    ? 'var(--warning)'
    : 'var(--positive)';

  return (
    <Link href="/revenus" className="block card card-press">
      <div style={{ padding: '20px' }}>
        <div className="flex items-center justify-between" style={{ marginBottom: '16px' }}>
          <span className="section-label">
            Reste a vivre
          </span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </div>

        <div className="flex items-end justify-between" style={{ marginBottom: monthlyIncome > 0 ? '16px' : '0' }}>
          <div>
            <p
              className="amount"
              style={{
                fontSize: 'var(--text-2xl)',
                lineHeight: 'var(--leading-tight)',
                color: isPositive ? 'var(--positive)' : 'var(--negative)',
              }}
            >
              {formatCAD(resteAVivre)}
            </p>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: '4px' }}>
              ce mois
            </p>
          </div>
          {monthlyIncome === 0 && (
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
              Ajoutez vos revenus
            </p>
          )}
        </div>

        {monthlyIncome > 0 && (
          <>
            <div className="progress-track" style={{ marginBottom: '12px' }}>
              <div
                className="progress-fill"
                style={{
                  width: `${ratio}%`,
                  backgroundColor: barColor,
                }}
              />
            </div>
            <div className="flex justify-between" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
              <span>Depenses {Math.round(ratio)}%</span>
              <span className="amount" style={{ fontWeight: 600 }}>Revenus {formatCAD(monthlyIncome)}</span>
            </div>
          </>
        )}
      </div>
    </Link>
  );
}
