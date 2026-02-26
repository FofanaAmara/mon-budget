import Link from 'next/link';
import { formatCAD } from '@/lib/utils';

type Props = {
  monthlyIncome: number;
  monthlyExpenses: number;
};

export default function ResteAVivreWidget({ monthlyIncome, monthlyExpenses }: Props) {
  const resteAVivre = monthlyIncome - monthlyExpenses;
  const ratio = monthlyIncome > 0 ? Math.min((monthlyExpenses / monthlyIncome) * 100, 100) : 0;
  const isPositive = resteAVivre >= 0;

  return (
    <Link href="/revenus" className="block">
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-[#1E293B] text-sm">Reste à vivre</h3>
          <span className="text-xs text-[#94A3B8]">→</span>
        </div>

        <div className="flex items-end justify-between mb-3">
          <div>
            <p className={`text-2xl font-bold ${isPositive ? 'text-emerald-600' : 'text-red-500'}`}>
              {formatCAD(resteAVivre)}
            </p>
            <p className="text-xs text-[#94A3B8] mt-0.5">ce mois</p>
          </div>
          {monthlyIncome === 0 && (
            <p className="text-xs text-[#94A3B8] italic">Ajoutez vos revenus →</p>
          )}
        </div>

        {monthlyIncome > 0 && (
          <>
            {/* Progress bar */}
            <div className="h-2 bg-[#F1F5F9] rounded-full overflow-hidden mb-2">
              <div
                className={`h-full rounded-full transition-all ${ratio > 90 ? 'bg-red-500' : ratio > 70 ? 'bg-orange-400' : 'bg-emerald-500'}`}
                style={{ width: `${ratio}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-[#94A3B8]">
              <span>Dépenses {Math.round(ratio)}%</span>
              <span>Revenus {formatCAD(monthlyIncome)}</span>
            </div>
          </>
        )}
      </div>
    </Link>
  );
}
