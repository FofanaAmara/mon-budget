'use client';

import { useRouter } from 'next/navigation';
import ExpenseModal from '@/components/ExpenseModal';
import type { Expense, Section, Card } from '@/lib/types';

export default function EditExpenseClient({
  expense,
  sections,
  cards,
}: {
  expense: Expense;
  sections: Section[];
  cards: Card[];
}) {
  const router = useRouter();
  return (
    <ExpenseModal
      expense={expense}
      sections={sections}
      cards={cards}
      onClose={() => router.back()}
      onSuccess={() => router.push('/depenses')}
    />
  );
}
