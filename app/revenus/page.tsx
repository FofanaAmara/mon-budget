import { getIncomes, getMonthlyIncomeTotal } from '@/lib/actions/incomes';
import RevenusClient from '@/components/RevenusClient';

export const dynamic = 'force-dynamic';

export default async function RevenusPage() {
  const [incomes, monthlyTotal] = await Promise.all([
    getIncomes(),
    getMonthlyIncomeTotal(),
  ]);

  return (
    <main className="min-h-screen bg-[#F8FAFC] pb-24">
      <div className="px-4 pt-6 pb-4">
        <h1 className="text-2xl font-bold text-[#1E293B]">Revenus</h1>
        <p className="text-sm text-[#94A3B8] mt-0.5">Gérez vos sources de revenus</p>
      </div>
      <div className="px-4">
        <RevenusClient incomes={incomes} monthlyTotal={monthlyTotal} />
      </div>
    </main>
  );
}
