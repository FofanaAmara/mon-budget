
import { pageSpace } from "@/lib/spaces/page";
import { notFound } from 'next/navigation';
import { getCardById } from "@/lib/actions/financial/cards";
import { getExpensesByCard } from "@/lib/actions/financial/expenses";
import { calcMonthlyCost } from '@/lib/utils';
import CarteDetailClient from '@/components/CarteDetailClient';

export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ spaceId:string;  id: string }>;
};

export default async function CarteDetailPage({ params }: Props) {
  const spaceId = await pageSpace(params);

  const { id } = await params;

  const [card, expenses] = await Promise.all([
    getCardById(spaceId, id),
    getExpensesByCard(spaceId, id),
  ]);

  if (!card) notFound();

  const monthlyTotal = expenses.reduce((sum, e) => sum + calcMonthlyCost(e), 0);

  return (
    <div style={{ padding: '0 20px 96px', minHeight: '100vh' }}>
      <CarteDetailClient card={card} expenses={expenses} monthlyTotal={monthlyTotal} />
    </div>
  );
}
