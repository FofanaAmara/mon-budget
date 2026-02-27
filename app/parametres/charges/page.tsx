export const dynamic = 'force-dynamic';

import { getExpenses } from '@/lib/actions/expenses';
import { getSections } from '@/lib/actions/sections';
import { getCards } from '@/lib/actions/cards';
import Breadcrumb from '@/components/Breadcrumb';
import ExpenseTemplateManager from '@/components/ExpenseTemplateManager';

export default async function ChargesFixesPage() {
  const [expenses, sections, cards] = await Promise.all([
    getExpenses(),
    getSections(),
    getCards(),
  ]);

  return (
    <div style={{ padding: '36px 20px 96px', minHeight: '100vh' }}>
      <Breadcrumb items={[
        { label: 'Reglages', href: '/parametres' },
        { label: 'Mes charges fixes' },
      ]} />
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{
          fontSize: 'var(--text-xl)',
          fontWeight: 750,
          color: 'var(--text-primary)',
          letterSpacing: 'var(--tracking-tight)',
          lineHeight: 'var(--leading-tight)',
        }}>
          Mes charges fixes
        </h1>
        <p style={{
          fontSize: 'var(--text-xs)',
          color: 'var(--text-tertiary)',
          marginTop: '4px',
          fontWeight: 500,
        }}>
          Depenses recurrentes et ponctuelles prevues
        </p>
      </div>
      <ExpenseTemplateManager expenses={expenses} sections={sections} cards={cards} />
    </div>
  );
}
