export const dynamic = 'force-dynamic';

import { getAllocations } from '@/lib/actions/allocations';
import { getSections } from '@/lib/actions/sections';
import { getPlannedExpenses } from '@/lib/actions/expenses';
import { getMonthlyIncomeSummary } from '@/lib/actions/monthly-incomes';
import { currentMonth } from '@/lib/utils';
import Breadcrumb from '@/components/Breadcrumb';
import AllocationsManager from '@/components/AllocationsManager';

export default async function AllocationPage() {
  const month = currentMonth();
  const [allocations, sections, projects, incomeSummary] = await Promise.all([
    getAllocations(),
    getSections(),
    getPlannedExpenses(),
    getMonthlyIncomeSummary(month),
  ]);

  return (
    <div style={{ padding: '36px 20px 96px', minHeight: '100vh' }}>
      <Breadcrumb items={[
        { label: 'Reglages', href: '/parametres' },
        { label: 'Allocation du revenu' },
      ]} />
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{
          fontSize: 'var(--text-xl)',
          fontWeight: 750,
          color: 'var(--text-primary)',
          letterSpacing: 'var(--tracking-tight)',
          lineHeight: 'var(--leading-tight)',
        }}>
          Allocation du revenu
        </h1>
        <p style={{
          fontSize: 'var(--text-xs)',
          color: 'var(--text-tertiary)',
          marginTop: '4px',
          fontWeight: 500,
        }}>
          Definir comment votre revenu est reparti chaque mois
        </p>
      </div>
      <AllocationsManager
        allocations={allocations}
        sections={sections}
        projects={projects}
        expectedMonthlyIncome={incomeSummary.expectedTotal}
      />
    </div>
  );
}
