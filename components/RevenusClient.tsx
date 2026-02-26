'use client';

import { useState } from 'react';
import { deleteIncome } from '@/lib/actions/incomes';
import { calcMonthlyIncome, formatCAD } from '@/lib/utils';
import type { Income, IncomeFrequency } from '@/lib/types';
import IncomeModal from './IncomeModal';

const FREQUENCY_LABELS: Record<IncomeFrequency, string> = {
  MONTHLY: 'Mensuel',
  BIWEEKLY: 'Aux 2 sem.',
  YEARLY: 'Annuel',
};

type Props = {
  incomes: Income[];
  monthlyTotal: number;
};

export default function RevenusClient({ incomes, monthlyTotal }: Props) {
  const [showModal, setShowModal] = useState(false);
  const [editIncome, setEditIncome] = useState<Income | undefined>(undefined);

  function openAdd() {
    setEditIncome(undefined);
    setShowModal(true);
  }

  function openEdit(inc: Income) {
    setEditIncome(inc);
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditIncome(undefined);
  }

  async function handleDelete(id: string) {
    if (confirm('Supprimer ce revenu ?')) {
      await deleteIncome(id);
    }
  }

  return (
    <div className="space-y-4">
      {/* Total monthly card */}
      <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-3xl p-5 text-white">
        <p className="text-emerald-100 text-sm font-medium mb-1">Total mensuel net</p>
        <p className="text-3xl font-bold">{formatCAD(monthlyTotal)}</p>
        <p className="text-emerald-200 text-xs mt-1">{incomes.length} source{incomes.length !== 1 ? 's' : ''} de revenus</p>
      </div>

      {/* Income list */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl divide-y divide-[#F1F5F9]">
        {incomes.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-4xl mb-3">💰</p>
            <p className="text-[#94A3B8] text-sm">Aucun revenu ajouté</p>
            <p className="text-[#94A3B8] text-xs mt-1">Ajoutez vos sources de revenus pour calculer votre reste à vivre</p>
          </div>
        ) : (
          incomes.map((inc) => {
            const monthly = calcMonthlyIncome(Number(inc.amount), inc.frequency);
            return (
              <div key={inc.id} className="flex items-center gap-3 px-4 py-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-lg flex-shrink-0">
                  💵
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-[#1E293B] text-sm truncate">{inc.name}</p>
                  <p className="text-xs text-[#94A3B8]">
                    {FREQUENCY_LABELS[inc.frequency]}
                    {inc.frequency !== 'MONTHLY' && (
                      <span className="ml-1">→ {formatCAD(monthly)}/mois</span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="font-semibold text-emerald-600 text-sm">{formatCAD(Number(inc.amount))}</span>
                  <button
                    onClick={() => openEdit(inc)}
                    className="p-1.5 text-[#94A3B8] hover:text-[#2563EB] transition-colors"
                    aria-label="Modifier"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDelete(inc.id)}
                    className="p-1.5 text-[#94A3B8] hover:text-red-500 transition-colors"
                    aria-label="Supprimer"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* FAB */}
      <button
        onClick={openAdd}
        className="fixed bottom-24 right-5 w-14 h-14 bg-[#2563EB] rounded-full shadow-lg flex items-center justify-center text-white text-2xl z-40"
        aria-label="Ajouter un revenu"
      >
        +
      </button>

      {showModal && <IncomeModal income={editIncome} onClose={closeModal} />}
    </div>
  );
}
