import { getExpenseById } from '@/lib/actions/expenses';
import { getSections } from '@/lib/actions/sections';
import { getCards } from '@/lib/actions/cards';
import EditExpenseClient from '@/components/EditExpenseClient';
import { notFound } from 'next/navigation';

export default async function EditExpensePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [expense, sections, cards] = await Promise.all([
    getExpenseById(id),
    getSections(),
    getCards(),
  ]);
  if (!expense) notFound();
  return <EditExpenseClient expense={expense} sections={sections} cards={cards} />;
}
