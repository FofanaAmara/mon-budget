
import { pageSpace } from "@/lib/spaces/page";
export const dynamic = "force-dynamic";

import {
  getPlannedExpenses,
  getOrCreateFreeSavings,
} from "@/lib/actions/financial/savings";
import { getSections } from "@/lib/actions/financial/sections";
import { getCards } from "@/lib/actions/financial/cards";
import { getDebts, getTotalDebtBalance } from "@/lib/actions/financial/debts";
import ProjetsEpargneClient from "@/components/ProjetsEpargneClient";

export default async function ProjetsPage({ params }: { params: Promise<{spaceId:string}> }) {
  const spaceId = await pageSpace(params);

  const [projets, sections, cards, freeSavings, debts, totalDebtBalance] =
    await Promise.all([
      getPlannedExpenses(spaceId),
      getSections(spaceId),
      getCards(spaceId),
      getOrCreateFreeSavings(spaceId),
      getDebts(spaceId),
      getTotalDebtBalance(spaceId),
    ]);

  // Filter out the free savings from the projects list (it's displayed separately)
  const projectsOnly = projets.filter((p) => p.id !== freeSavings.id);

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
