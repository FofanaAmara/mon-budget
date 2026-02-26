export const dynamic = 'force-dynamic';

import { getExpenses } from '@/lib/actions/expenses';
import { getSections } from '@/lib/actions/sections';
import { getCards } from '@/lib/actions/cards';
import DepensesClient from '@/components/DepensesClient';

export default async function DepensesPage() {
  const [expenses, sections, cards] = await Promise.all([
    getExpenses(),
    getSections(),
    getCards(),
  ]);
  return <DepensesClient expenses={expenses} sections={sections} cards={cards} />;
}
