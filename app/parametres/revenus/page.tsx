export const dynamic = 'force-dynamic';

import { getIncomes } from '@/lib/actions/incomes';
import { calcMonthlyIncome } from '@/lib/utils';
import Breadcrumb from '@/components/Breadcrumb';
import IncomeTemplateManager from '@/components/IncomeTemplateManager';

export default async function RevenusRecurrentsPage() {
  const incomes = await getIncomes();

  const activeIncomes = incomes.filter(i => i.is_active);
  const totalMonthly = activeIncomes.reduce(
    (sum, i) => sum + calcMonthlyIncome(
      i.amount != null ? Number(i.amount) : null,
      i.frequency,
      i.estimated_amount != null ? Number(i.estimated_amount) : null,
    ),
    0
  );
  const count = activeIncomes.length;

  const displayAmount = totalMonthly.toLocaleString('fr-CA', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  const monthlyLabel = totalMonthly.toLocaleString('fr-CA', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  return (
    <div style={{ padding: '0 0 120px', minHeight: '100vh' }}>
      {/* Breadcrumb */}
      <nav style={{ padding: '14px 20px 0' }}>
        <Breadcrumb items={[
          { label: 'Reglages', href: '/parametres' },
          { label: 'Mes revenus recurrents' },
        ]} />
      </nav>

      {/* Monument hero — Revenus attendus */}
      <section style={{ padding: '28px 20px 20px', textAlign: 'center' }}>
        <p style={{
          fontSize: '12px',
          fontWeight: 700,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'var(--teal-700)',
          marginBottom: '10px',
        }}>
          Revenus attendus
        </p>
        <p style={{
          fontSize: 'clamp(2.5rem, 12vw, 4rem)',
          fontWeight: 800,
          letterSpacing: '-0.04em',
          lineHeight: 1,
          color: 'var(--slate-900)',
          fontVariantNumeric: 'tabular-nums',
        }}>
          {displayAmount}<span style={{ fontSize: '0.4em', fontWeight: 600, color: 'var(--teal-700)', verticalAlign: 'super', marginLeft: '2px' }}>$</span>
        </p>
        <p style={{
          fontSize: '14px',
          fontWeight: 500,
          color: 'var(--slate-400)',
          marginTop: '8px',
          letterSpacing: '-0.01em',
        }}>
          <strong style={{ fontWeight: 700, color: 'var(--slate-700)' }}>{count}</strong> source{count !== 1 ? 's' : ''}&nbsp;&middot;&nbsp;{monthlyLabel}&nbsp;$&nbsp;/&nbsp;mois
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '12px' }}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            padding: '5px 14px',
            background: 'var(--teal-50)',
            border: '1px solid rgba(15, 118, 110, 0.1)',
            borderRadius: '100px',
            fontSize: '12px',
            fontWeight: 700,
            color: 'var(--teal-700)',
            letterSpacing: '0.02em',
          }}>
            <span style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: 'var(--teal-700)',
              flexShrink: 0,
              display: 'inline-block',
            }} />
            Sources actives
          </span>
        </div>
      </section>

      {/* Income list manager */}
      <IncomeTemplateManager incomes={incomes} />
    </div>
  );
}
