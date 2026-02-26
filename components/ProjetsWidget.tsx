import Link from 'next/link';
import { formatCAD } from '@/lib/utils';
import type { Expense } from '@/lib/types';

type Props = {
  projets: Expense[];
};

export default function ProjetsWidget({ projets }: Props) {
  if (projets.length === 0) return null;

  return (
    <Link href="/projets" className="block">
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-[#1E293B] text-sm flex items-center gap-2">
            <span>🎯</span> Projets
          </h3>
          <span className="text-xs text-[#94A3B8]">{projets.length} en cours →</span>
        </div>

        <div className="space-y-2.5">
          {projets.slice(0, 3).map((projet) => {
            const target = Number(projet.target_amount ?? projet.amount);
            const saved = Number(projet.saved_amount ?? 0);
            const progress = target > 0 ? Math.min((saved / target) * 100, 100) : 0;

            return (
              <div key={projet.id}>
                <div className="flex justify-between items-center mb-1">
                  <p className="text-sm text-[#1E293B] truncate max-w-[160px]">{projet.name}</p>
                  <p className="text-xs font-medium text-[#1E293B]">
                    {formatCAD(saved)} / {formatCAD(target)}
                  </p>
                </div>
                <div className="h-1.5 bg-[#F1F5F9] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${progress >= 100 ? 'bg-emerald-500' : 'bg-[#2563EB]'}`}
                    style={{ width: `${Math.max(progress, 2)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Link>
  );
}
