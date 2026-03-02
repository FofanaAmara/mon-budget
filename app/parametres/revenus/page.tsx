export const dynamic = 'force-dynamic';

import { getIncomes } from '@/lib/actions/incomes';
import Breadcrumb from '@/components/Breadcrumb';
import IncomeTemplateManager from '@/components/IncomeTemplateManager';
import type { IncomeFrequency } from '@/lib/types';

function normalizeIncomeToMonthly(amount: number | null, estimatedAmount: number | null, frequency: IncomeFrequency): number {
  if (frequency === 'VARIABLE') return Number(estimatedAmount ?? 0);
  const base = Number(amount ?? 0);
  switch (frequency) {
    case 'MONTHLY':   return base;
    case 'BIWEEKLY':  return (base * 26) / 12;
    case 'YEARLY':    return base / 12;
    default:          return base;
  }
}

export default async function RevenusRecurrentsPage() {
  const incomes = await getIncomes();

  const activeIncomes = incomes.filter(i => i.is_active);
  const totalMonthly = activeIncomes.reduce(
    (sum, i) => sum + normalizeIncomeToMonthly(i.amount, i.estimated_amount, i.frequency),
    0
  );
  const count = activeIncomes.length;

  const displayAmount = totalMonthly >= 1000
    ? `${(totalMonthly / 1000).toLocaleString('fr-CA', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}k`
    : totalMonthly.toLocaleString('fr-CA', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  const monthlyLabel = totalMonthly.toLocaleString('fr-CA', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  return (
    <div style={{ padding: '0 0 96px', minHeight: '100vh' }}>
      {/* Monument hero — Revenus attendus */}
      <div style={{ padding: '24px 20px 16px', textAlign: 'center' }}>
        <Breadcrumb items={[
          { label: 'Reglages', href: '/parametres' },
          { label: 'Mes revenus recurrents' },
        ]} />
        <p style={{
          fontSize: '12px', fontWeight: 700, letterSpacing: '0.1em',
          textTransform: 'uppercase', color: 'var(--accent)', marginBottom: '8px',
          marginTop: '16px',
        }}>
          Revenus attendus
        </p>
        <p style={{
          fontSize: 'clamp(2.5rem, 10vw, 4rem)',
          fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1,
          color: 'var(--text-primary)',
        }}>
          <span style={{ fontSize: '0.4em', fontWeight: 600, color: 'var(--accent)', verticalAlign: 'super' }}>$</span>
          {displayAmount}
        </p>
        <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-tertiary)', marginTop: '6px' }}>
          {count} source{count !== 1 ? 's' : ''} · <strong style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>{monthlyLabel} $</strong> / mois
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '10px' }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '4px',
            padding: '4px 10px', borderRadius: '100px',
            background: 'var(--positive-subtle)', color: 'var(--accent)',
            fontSize: '13px', fontWeight: 600,
          }}>
            Sources actives
          </span>
        </div>
      </div>

      <div style={{ padding: '0 20px' }}>
        <IncomeTemplateManager incomes={incomes} />
      </div>
    </div>
  );
}
