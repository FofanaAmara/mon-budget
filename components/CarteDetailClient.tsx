'use client';

import { formatCAD, calcMonthlyCost, daysUntil } from '@/lib/utils';
import type { Expense, Card } from '@/lib/types';
import Link from 'next/link';

type Props = {
  card: Card;
  expenses: Expense[];
  monthlyTotal: number;
};

function getDueBadgeClass(days: number) {
  if (days <= 1) return 'bg-red-100 text-red-700';
  if (days <= 3) return 'bg-orange-100 text-orange-700';
  return 'bg-blue-100 text-blue-700';
}

export default function CarteDetailClient({ card, expenses, monthlyTotal }: Props) {
  const autoExpenses = expenses.filter((e) => e.auto_debit);
  const manualExpenses = expenses.filter((e) => !e.auto_debit);

  return (
    <div className="space-y-4">
      {/* Card visual */}
      <div
        className="rounded-3xl p-5 text-white relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${card.color} 0%, ${card.color}cc 100%)` }}
      >
        <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-white/10 pointer-events-none" />
        <div className="flex justify-between items-start mb-6">
          <div>
            <p className="text-white/70 text-xs uppercase tracking-widest">{card.bank ?? 'Carte'}</p>
            <p className="text-lg font-bold mt-0.5">{card.name}</p>
          </div>
          <div className="text-right">
            <p className="text-white/70 text-xs">Mensuel</p>
            <p className="text-xl font-bold">{formatCAD(monthlyTotal)}</p>
          </div>
        </div>
        <p className="text-white/60 text-sm font-mono">
          •••• •••• •••• {card.last_four ?? '????'}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4">
          <p className="text-2xl font-bold text-[#1E293B]">{autoExpenses.length}</p>
          <p className="text-xs text-[#94A3B8] mt-0.5">Prélèvements auto</p>
        </div>
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4">
          <p className="text-2xl font-bold text-[#1E293B]">{expenses.length}</p>
          <p className="text-xs text-[#94A3B8] mt-0.5">Dépenses totales</p>
        </div>
      </div>

      {/* Auto-charged expenses */}
      {autoExpenses.length > 0 && (
        <div className="bg-white border border-[#E2E8F0] rounded-2xl divide-y divide-[#F1F5F9]">
          <div className="px-4 py-3">
            <h3 className="font-semibold text-[#1E293B] text-sm flex items-center gap-2">
              <span>⚡</span> Prélèvements automatiques
            </h3>
          </div>
          {autoExpenses.map((expense) => {
            const days = expense.next_due_date ? daysUntil(expense.next_due_date) : null;
            const monthly = calcMonthlyCost(expense);
            return (
              <div key={expense.id} className="flex items-center gap-3 px-4 py-3">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs flex-shrink-0"
                  style={{ backgroundColor: `${expense.section?.color ?? '#6366F1'}20`, color: expense.section?.color ?? '#6366F1' }}
                >
                  {expense.section?.icon ?? '💳'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-[#1E293B] text-sm truncate">{expense.name}</p>
                  <p className="text-xs text-[#94A3B8]">
                    {expense.section?.name ?? '—'}
                    {expense.next_due_date && (
                      <>
                        {' · '}
                        <span className={`inline-block px-1.5 py-0.5 rounded-full text-xs font-medium ${days !== null ? getDueBadgeClass(days) : 'bg-blue-100 text-blue-700'}`}>
                          J-{days}
                        </span>
                      </>
                    )}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-semibold text-[#1E293B] text-sm">{formatCAD(expense.amount)}</p>
                  {monthly !== expense.amount && (
                    <p className="text-xs text-[#94A3B8]">{formatCAD(monthly)}/mois</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Other expenses */}
      {manualExpenses.length > 0 && (
        <div className="bg-white border border-[#E2E8F0] rounded-2xl divide-y divide-[#F1F5F9]">
          <div className="px-4 py-3">
            <h3 className="font-semibold text-[#1E293B] text-sm">Autres dépenses liées</h3>
          </div>
          {manualExpenses.map((expense) => (
            <div key={expense.id} className="flex items-center gap-3 px-4 py-3">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs flex-shrink-0"
                style={{ backgroundColor: `${expense.section?.color ?? '#6366F1'}20` }}
              >
                {expense.section?.icon ?? '💳'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-[#1E293B] text-sm truncate">{expense.name}</p>
                <p className="text-xs text-[#94A3B8]">{expense.section?.name ?? '—'}</p>
              </div>
              <p className="font-semibold text-[#1E293B] text-sm flex-shrink-0">
                {formatCAD(expense.amount)}
              </p>
            </div>
          ))}
        </div>
      )}

      {expenses.length === 0 && (
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-8 text-center">
          <p className="text-3xl mb-2">💳</p>
          <p className="text-[#94A3B8] text-sm">Aucune dépense liée à cette carte</p>
        </div>
      )}

      <Link
        href="/cartes"
        className="block text-center text-sm text-[#94A3B8] py-2"
      >
        ← Retour aux cartes
      </Link>
    </div>
  );
}
