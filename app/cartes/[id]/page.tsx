import { notFound } from 'next/navigation';
import { getCardById } from '@/lib/actions/cards';
import { getExpensesByCard } from '@/lib/actions/expenses';
import { calcMonthlyCost } from '@/lib/utils';
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
    <main className="min-h-screen bg-[#F8FAFC] pb-24">
      <div className="px-4 pt-6 pb-4">
        <h1 className="text-2xl font-bold text-[#1E293B]">{card.name}</h1>
        {card.last_four && (
          <p className="text-sm text-[#94A3B8] mt-0.5">•••• {card.last_four}</p>
        )}
      </div>
      <div className="px-4">
        <CarteDetailClient card={card} expenses={expenses} monthlyTotal={monthlyTotal} />
      </div>
    </main>
  );
}
