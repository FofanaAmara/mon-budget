import { notFound } from 'next/navigation';
import { getCardById } from '@/lib/actions/cards';
import { getExpensesByCard } from '@/lib/actions/expenses';
import { calcMonthlyCost } from '@/lib/utils';
import Breadcrumb from '@/components/Breadcrumb';
import CarteDetailClient from '@/components/CarteDetailClient';

export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function CarteDetailPage({ params }: Props) {
  const { id } = await params;

  const [card, expenses] = await Promise.all([
    getCardById(id),
    getExpensesByCard(id),
  ]);

  if (!card) notFound();

  const monthlyTotal = expenses.reduce((sum, e) => sum + calcMonthlyCost(e), 0);

  return (
    <div style={{ padding: '36px 20px 96px', minHeight: '100vh' }}>
      <Breadcrumb items={[
        { label: 'Reglages', href: '/parametres' },
        { label: 'Mes cartes', href: '/cartes' },
        { label: card.name },
      ]} />
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{
          fontSize: 'var(--text-xl)',
          fontWeight: 750,
          color: 'var(--text-primary)',
          letterSpacing: 'var(--tracking-tight)',
          lineHeight: 'var(--leading-tight)',
        }}>
          {card.name}
        </h1>
        {card.last_four && (
          <p style={{
            fontSize: 'var(--text-xs)',
            color: 'var(--text-tertiary)',
            marginTop: '4px',
            fontWeight: 500,
          }}>
            •••• {card.last_four}
          </p>
        )}
      </div>
      <CarteDetailClient card={card} expenses={expenses} monthlyTotal={monthlyTotal} />
    </div>
  );
}
