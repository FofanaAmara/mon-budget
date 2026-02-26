'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { deleteExpense } from '@/lib/actions/expenses';
import { formatCAD, formatShortDate, daysUntil } from '@/lib/utils';
import ExpenseModal from '@/components/ExpenseModal';
import type { Expense, Section, Card } from '@/lib/types';

type Props = {
  expenses: Expense[];
  sections: Section[];
  cards: Card[];
};

export default function DepensesClient({ expenses, sections, cards }: Props) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | undefined>();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  // Group expenses by section
  const grouped = sections.map((section) => ({
    section,
    expenses: expenses.filter((e) => e.section_id === section.id),
  })).filter((g) => g.expenses.length > 0);

  // Expenses without section
  const unsectioned = expenses.filter((e) => !e.section_id);

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteExpense(id);
      setDeletingId(null);
      router.refresh();
    });
  }

  function handleEdit(expense: Expense) {
    setEditingExpense(expense);
    setShowModal(true);
  }

  function getDueBadge(expense: Expense) {
    const nd = expense.next_due_date;
    if (!nd) return null;
    const days = daysUntil(nd);
    if (days < 0) return { label: 'En retard', cls: 'bg-red-50 text-red-600' };
    if (days === 0) return { label: "Auj.", cls: 'bg-orange-50 text-orange-600' };
    if (days <= 3) return { label: `${days}j`, cls: 'bg-orange-50 text-orange-600' };
    if (days <= 7) return { label: `${days}j`, cls: 'bg-blue-50 text-[#2563EB]' };
    return { label: formatShortDate(nd), cls: 'bg-[#F8FAFC] text-[#94A3B8]' };
  }

  const ExpenseRow = ({ expense }: { expense: Expense }) => {
    const badge = getDueBadge(expense);
    return (
      <div className="flex items-center gap-3 py-3 px-4">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-[#1E293B] text-sm truncate">{expense.name}</p>
          <p className="text-xs text-[#94A3B8] mt-0.5">
            {expense.type === 'RECURRING' ? `${expense.recurrence_frequency?.toLowerCase()} · j.${expense.recurrence_day}` : 'Ponctuel'}
            {expense.auto_debit ? ' · Prélèv. auto' : ''}
          </p>
        </div>

        {badge && (
          <span className={`text-xs font-medium px-2 py-1 rounded-lg flex-shrink-0 ${badge.cls}`}>
            {badge.label}
          </span>
        )}

        <span className="font-semibold text-[#2563EB] text-sm flex-shrink-0">{formatCAD(expense.amount)}</span>

        {deletingId === expense.id ? (
          <div className="flex items-center gap-1.5 text-xs">
            <button onClick={() => handleDelete(expense.id)} className="text-red-500 font-semibold">Oui</button>
            <span className="text-[#E2E8F0]">|</span>
            <button onClick={() => setDeletingId(null)} className="text-[#94A3B8]">Non</button>
          </div>
        ) : (
          <div className="flex items-center gap-0.5">
            <button onClick={() => handleEdit(expense)} className="p-1.5 text-[#94A3B8] hover:text-[#2563EB] rounded-lg transition-colors" aria-label="Modifier">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z" />
              </svg>
            </button>
            <button onClick={() => setDeletingId(expense.id)} className="p-1.5 text-[#94A3B8] hover:text-red-500 rounded-lg transition-colors" aria-label="Supprimer">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                <path d="M10 11v6M14 11v6" />
              </svg>
            </button>
          </div>
        )}
      </div>
    );
  };

  const SectionGroup = ({ section, sectionExpenses }: { section: Section; sectionExpenses: Expense[] }) => {
    const total = sectionExpenses.reduce((sum, e) => sum + e.amount, 0);
    return (
      <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden">
        {/* Group header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#F1F5F9]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base" style={{ backgroundColor: section.color + '20' }}>
              {section.icon}
            </div>
            <span className="font-semibold text-[#1E293B] text-sm">{section.name}</span>
          </div>
          <span className="text-sm font-semibold text-[#2563EB]">{formatCAD(total)}/mois</span>
        </div>
        {/* Expense rows */}
        <div className="divide-y divide-[#F8FAFC]">
          {sectionExpenses.map((e) => <ExpenseRow key={e.id} expense={e} />)}
        </div>
      </div>
    );
  };

  return (
    <div className="px-4 pt-8 pb-6 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1E293B]">Dépenses</h1>
          <p className="text-xs text-[#94A3B8] mt-0.5">{expenses.length} dépense{expenses.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Empty state */}
      {expenses.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="text-5xl mb-4">💸</div>
          <p className="text-[#94A3B8] text-sm mb-2">Aucune dépense enregistrée</p>
          <p className="text-xs text-[#CBD5E1]">Utilisez le bouton + pour ajouter</p>
        </div>
      )}

      {/* Grouped sections */}
      <div className="space-y-3">
        {grouped.map(({ section, expenses: se }) => (
          <SectionGroup key={section.id} section={section} sectionExpenses={se} />
        ))}

        {/* Unsectioned */}
        {unsectioned.length > 0 && (
          <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#F1F5F9]">
              <span className="font-semibold text-[#94A3B8] text-sm">Sans section</span>
              <span className="text-sm font-semibold text-[#94A3B8]">{formatCAD(unsectioned.reduce((s, e) => s + e.amount, 0))}/mois</span>
            </div>
            <div className="divide-y divide-[#F8FAFC]">
              {unsectioned.map((e) => <ExpenseRow key={e.id} expense={e} />)}
            </div>
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => { setEditingExpense(undefined); setShowModal(true); }}
        className="fixed bottom-20 right-4 w-14 h-14 bg-[#1E293B] text-white rounded-full shadow-lg flex items-center justify-center text-2xl hover:bg-[#0F172A] transition-colors active:scale-95"
        aria-label="Ajouter une dépense"
        style={{ boxShadow: '0 4px 20px rgba(37,99,235,0.4)' }}
      >
        +
      </button>

      {/* Expense modal */}
      {showModal && (
        <ExpenseModal
          sections={sections}
          cards={cards}
          expense={editingExpense}
          onClose={() => { setShowModal(false); setEditingExpense(undefined); }}
          onSuccess={() => router.refresh()}
        />
      )}
    </div>
  );
}
