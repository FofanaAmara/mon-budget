import { getExpenseById } from '@/lib/actions/expenses';
import { getSections } from '@/lib/actions/sections';
import { getCards } from '@/lib/actions/cards';
import Breadcrumb from '@/components/Breadcrumb';
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

  return (
    <div style={{ padding: '36px 20px 96px', minHeight: '100vh' }}>
      <Breadcrumb items={[
        { label: 'Reglages', href: '/parametres' },
        { label: 'Mes charges fixes', href: '/parametres/charges' },
        { label: 'Modifier' },
      ]} />
      <EditExpenseClient expense={expense} sections={sections} cards={cards} />
    </div>
  );
}
