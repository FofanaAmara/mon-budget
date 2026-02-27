export const dynamic = 'force-dynamic';

import { getPlannedExpenses, getOrCreateFreeSavings } from '@/lib/actions/expenses';
import { getSections } from '@/lib/actions/sections';
import ProjetsEpargneClient from '@/components/ProjetsEpargneClient';

export default async function ProjetsPage() {
  const [projets, sections, freeSavings] = await Promise.all([
    getPlannedExpenses(),
    getSections(),
    getOrCreateFreeSavings(),
  ]);

  // Filter out the free savings from the projects list (it's displayed separately)
  const projectsOnly = projets.filter(p => p.id !== freeSavings.id);

  return (
    <ProjetsEpargneClient
      projets={projectsOnly}
      sections={sections}
      freeSavings={freeSavings}
    />
  );
}
