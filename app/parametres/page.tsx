export const dynamic = 'force-dynamic';

import { getSettings } from '@/lib/actions/settings';
import { getExpenses } from '@/lib/actions/expenses';
import { getSections } from '@/lib/actions/sections';
import { getCards } from '@/lib/actions/cards';
import { getIncomes } from '@/lib/actions/incomes';
import ParametresClient from '@/components/ParametresClient';

export default async function ParametresPage() {
  const [settings, expenses, sections, cards, incomes] = await Promise.all([
    getSettings(),
    getExpenses(),
    getSections(),
    getCards(),
    getIncomes(),
  ]);

  return (
    <ParametresClient
      settings={settings}
      expenses={expenses}
      sections={sections}
      cards={cards}
      incomes={incomes}
    />
  );
}
