import { getIncomes, getMonthlyIncomeTotal } from '@/lib/actions/incomes';
import RevenusClient from '@/components/RevenusClient';

export const dynamic = 'force-dynamic';

export default async function RevenusPage() {
  const [incomes, monthlyTotal] = await Promise.all([
    getIncomes(),
    getMonthlyIncomeTotal(),
  ]);

  return <RevenusClient incomes={incomes} monthlyTotal={monthlyTotal} />;
}
