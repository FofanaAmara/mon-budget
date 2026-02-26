import { getPlannedExpenses } from '@/lib/actions/expenses';
import ProjetsClient from '@/components/ProjetsClient';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function ProjetsPage() {
  const projets = await getPlannedExpenses();

  return (
    <main className="min-h-screen bg-[#F8FAFC] pb-24">
      <div className="px-4 pt-6 pb-4">
        <h1 className="text-2xl font-bold text-[#1E293B]">Projets</h1>
        <p className="text-sm text-[#94A3B8] mt-0.5">Suivez vos objectifs d&apos;épargne</p>
      </div>

      <div className="px-4 mb-4">
        <Link
          href="/depenses"
          className="inline-flex items-center gap-1.5 text-sm text-[#2563EB] font-medium"
        >
          <span>+</span> Ajouter un projet depuis Dépenses
        </Link>
      </div>

      <div className="px-4">
        <ProjetsClient projets={projets} />
      </div>
    </main>
  );
}
