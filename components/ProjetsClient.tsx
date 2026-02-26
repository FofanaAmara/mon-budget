'use client';

import { useState } from 'react';
import { updateSavedAmount, deleteExpense } from '@/lib/actions/expenses';
import { formatCAD, calcMonthlySuggested, formatDate } from '@/lib/utils';
import type { Expense } from '@/lib/types';

type Props = {
  projets: Expense[];
};

export default function ProjetsClient({ projets }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  function startEdit(projet: Expense) {
    setEditingId(projet.id);
    setEditValue(projet.saved_amount?.toString() ?? '0');
  }

  async function saveEdit(id: string) {
    await updateSavedAmount(id, parseFloat(editValue) || 0);
    setEditingId(null);
  }

  async function handleDelete(id: string) {
    if (confirm('Supprimer ce projet ?')) {
      await deleteExpense(id);
    }
  }

  if (projets.length === 0) {
    return (
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-8 text-center">
        <p className="text-4xl mb-3">🎯</p>
        <p className="text-[#94A3B8] text-sm font-medium">Aucun projet planifié</p>
        <p className="text-[#94A3B8] text-xs mt-1">
          Créez une dépense de type &quot;Planifié&quot; pour suivre vos objectifs d&apos;épargne
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {projets.map((projet) => {
        const target = Number(projet.target_amount ?? projet.amount);
        const saved = Number(projet.saved_amount ?? 0);
        const progress = target > 0 ? Math.min((saved / target) * 100, 100) : 0;
        const monthlySuggested =
          projet.target_date
            ? calcMonthlySuggested(target, saved, projet.target_date)
            : null;

        return (
          <div key={projet.id} className="bg-white border border-[#E2E8F0] rounded-2xl p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-base">🎯</span>
                  <p className="font-semibold text-[#1E293B] text-sm truncate">{projet.name}</p>
                </div>
                {projet.section && (
                  <p className="text-xs text-[#94A3B8] mt-0.5 pl-6">{projet.section.name}</p>
                )}
              </div>
              <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                <button
                  onClick={() => startEdit(projet)}
                  className="p-1.5 text-[#94A3B8] hover:text-[#2563EB] transition-colors text-sm"
                  aria-label="Mettre à jour l'épargne"
                >
                  ✏️
                </button>
                <button
                  onClick={() => handleDelete(projet.id)}
                  className="p-1.5 text-[#94A3B8] hover:text-red-500 transition-colors text-sm"
                  aria-label="Supprimer"
                >
                  🗑️
                </button>
              </div>
            </div>

            {/* Progress bar */}
            <div className="h-2.5 bg-[#F1F5F9] rounded-full overflow-hidden mb-2">
              <div
                className={`h-full rounded-full transition-all ${progress >= 100 ? 'bg-emerald-500' : 'bg-[#2563EB]'}`}
                style={{ width: `${Math.max(progress, 2)}%` }}
              />
            </div>

            <div className="flex justify-between items-end">
              <div>
                {editingId === projet.id ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="w-28 border border-[#2563EB] rounded-lg px-2 py-1 text-sm focus:outline-none"
                      min="0"
                      step="0.01"
                      autoFocus
                    />
                    <button
                      onClick={() => saveEdit(projet.id)}
                      className="text-xs bg-[#2563EB] text-white px-2 py-1 rounded-lg"
                    >
                      ✓
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="text-xs text-[#94A3B8] px-1"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <p className="text-sm font-semibold text-[#1E293B]">
                    {formatCAD(saved)}{' '}
                    <span className="font-normal text-[#94A3B8]">/ {formatCAD(target)}</span>
                  </p>
                )}
                <p className="text-xs text-[#94A3B8] mt-0.5">{Math.round(progress)}% atteint</p>
              </div>
              <div className="text-right">
                {projet.target_date && (
                  <p className="text-xs text-[#94A3B8]">Cible : {formatDate(projet.target_date)}</p>
                )}
                {monthlySuggested !== null && monthlySuggested > 0 && (
                  <p className="text-xs font-medium text-[#2563EB] mt-0.5">
                    {formatCAD(monthlySuggested)}/mois suggéré
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
