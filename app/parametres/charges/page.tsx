export const dynamic = 'force-dynamic';

import { getExpenses } from '@/lib/actions/expenses';
import { getSections } from '@/lib/actions/sections';
import { getCards } from '@/lib/actions/cards';
import Breadcrumb from '@/components/Breadcrumb';
import ExpenseTemplateManager from '@/components/ExpenseTemplateManager';
import type { RecurrenceFrequency } from '@/lib/types';

function normalizeToMonthly(amount: number, frequency: RecurrenceFrequency | null): number {
  switch (frequency) {
    case 'WEEKLY':     return (amount * 52) / 12;
    case 'BIWEEKLY':   return (amount * 26) / 12;
    case 'MONTHLY':    return amount;
    case 'BIMONTHLY':  return amount * 2;
    case 'QUARTERLY':  return amount / 3;
    case 'YEARLY':     return amount / 12;
    default:           return amount;
  }
}

export default async function ChargesFixesPage() {
  const [expenses, sections, cards] = await Promise.all([
    getExpenses(),
    getSections(),
    getCards(),
  ]);

  const recurringActive = expenses.filter(e => e.is_active && e.type === 'RECURRING');
  const totalMonthly = recurringActive.reduce(
    (sum, e) => sum + normalizeToMonthly(Number(e.amount), e.recurrence_frequency),
    0
  );
  const count = recurringActive.length;

  const displayAmount = totalMonthly >= 1000
    ? `${(totalMonthly / 1000).toLocaleString('fr-CA', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}k`
    : totalMonthly.toLocaleString('fr-CA', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  const monthlyLabel = totalMonthly.toLocaleString('fr-CA', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  return (
    <div style={{ padding: '0 0 96px', minHeight: '100vh' }}>
      {/* Monument hero — Charges fixes */}
      <div style={{ padding: '24px 20px 16px', textAlign: 'center' }}>
        <Breadcrumb items={[
          { label: 'Reglages', href: '/parametres' },
          { label: 'Mes charges fixes' },
        ]} />
        <p style={{
          fontSize: '12px', fontWeight: 700, letterSpacing: '0.1em',
          textTransform: 'uppercase', color: 'var(--accent)', marginBottom: '8px',
          marginTop: '16px',
        }}>
          Charges fixes
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
          {count} charge{count !== 1 ? 's' : ''} · <strong style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>{monthlyLabel} $</strong> / mois
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '10px' }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '4px',
            padding: '4px 10px', borderRadius: '100px',
            background: 'var(--positive-subtle)', color: 'var(--accent)',
            fontSize: '13px', fontWeight: 600,
          }}>
            Récurrentes actives
          </span>
        </div>
      </div>

      <div style={{ padding: '0 20px' }}>
        <ExpenseTemplateManager expenses={expenses} sections={sections} cards={cards} />
      </div>
    </div>
  );
}
