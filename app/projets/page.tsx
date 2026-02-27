export const dynamic = 'force-dynamic';

import { getPlannedExpenses, getOrCreateFreeSavings } from '@/lib/actions/expenses';
import { getSections } from '@/lib/actions/sections';
import { getCards } from '@/lib/actions/cards';
import { getDebts, getTotalDebtBalance } from '@/lib/actions/debts';
import ProjetsEpargneClient from '@/components/ProjetsEpargneClient';

export default async function ProjetsPage() {
  const [projets, sections, cards, freeSavings, debts, totalDebtBalance] = await Promise.all([
    getPlannedExpenses(),
    getSections(),
    getCards(),
    getOrCreateFreeSavings(),
    getDebts(),
    getTotalDebtBalance(),
  ]);

  // Filter out the free savings from the projects list (it's displayed separately)
  const projectsOnly = projets.filter(p => p.id !== freeSavings.id);

  return (
    <ProjetsEpargneClient
      projets={projectsOnly}
      sections={sections}
      cards={cards}
      freeSavings={freeSavings}
      debts={debts}
      totalDebtBalance={totalDebtBalance}
    />
  );
}
