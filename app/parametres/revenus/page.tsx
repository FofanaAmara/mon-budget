export const dynamic = 'force-dynamic';

import { getIncomes } from '@/lib/actions/incomes';
import Breadcrumb from '@/components/Breadcrumb';
import IncomeTemplateManager from '@/components/IncomeTemplateManager';

export default async function RevenusRecurrentsPage() {
  const incomes = await getIncomes();

  return (
    <div style={{ padding: '36px 20px 96px', minHeight: '100vh' }}>
      <Breadcrumb items={[
        { label: 'Reglages', href: '/parametres' },
        { label: 'Mes revenus recurrents' },
      ]} />
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{
          fontSize: 'var(--text-xl)',
          fontWeight: 750,
          color: 'var(--text-primary)',
          letterSpacing: 'var(--tracking-tight)',
          lineHeight: 'var(--leading-tight)',
        }}>
          Mes revenus recurrents
        </h1>
        <p style={{
          fontSize: 'var(--text-xs)',
          color: 'var(--text-tertiary)',
          marginTop: '4px',
          fontWeight: 500,
        }}>
          Sources de revenus regulieres et variables
        </p>
      </div>
      <IncomeTemplateManager incomes={incomes} />
    </div>
  );
}
