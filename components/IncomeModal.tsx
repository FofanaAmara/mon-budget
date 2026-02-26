'use client';

import { useState } from 'react';
import { createIncome, updateIncome } from '@/lib/actions/incomes';
import type { Income, IncomeFrequency } from '@/lib/types';

type Props = {
  income?: Income;
  onClose: () => void;
};

const FREQUENCY_LABELS: Record<IncomeFrequency, string> = {
  MONTHLY: 'Mensuel',
  BIWEEKLY: 'Aux 2 semaines',
  YEARLY: 'Annuel',
};

export default function IncomeModal({ income, onClose }: Props) {
  const [name, setName] = useState(income?.name ?? '');
  const [amount, setAmount] = useState(income?.amount?.toString() ?? '');
  const [frequency, setFrequency] = useState<IncomeFrequency>(income?.frequency ?? 'MONTHLY');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !amount) {
      setError('Nom et montant requis');
      return;
    }
    setLoading(true);
    setError('');
    try {
      if (income) {
        await updateIncome(income.id, { name, amount: parseFloat(amount), frequency });
      } else {
        await createIncome({ name, amount: parseFloat(amount), frequency });
      }
      onClose();
    } catch {
      setError('Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center" onClick={onClose}>
      <div
        className="bg-white rounded-t-3xl w-full max-w-lg pb-10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        <div className="px-6 pb-4">
          <h2 className="text-xl font-bold text-[#1E293B] mb-6">
            {income ? 'Modifier le revenu' : 'Nouveau revenu'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-[#1E293B] mb-1">
                Source de revenu
              </label>
              <input
                type="text"
                placeholder="Salaire, Freelance, Loyer perçu…"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              />
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-[#1E293B] mb-1">Montant ($)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              />
            </div>

            {/* Frequency */}
            <div>
              <label className="block text-sm font-medium text-[#1E293B] mb-2">Fréquence</label>
              <div className="flex gap-2">
                {(Object.keys(FREQUENCY_LABELS) as IncomeFrequency[]).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFrequency(f)}
                    className={`flex-1 py-2 px-3 rounded-xl text-sm font-medium border transition-colors ${
                      frequency === f
                        ? 'bg-[#2563EB] text-white border-[#2563EB]'
                        : 'bg-white text-[#1E293B] border-[#E2E8F0]'
                    }`}
                  >
                    {FREQUENCY_LABELS[f]}
                  </button>
                ))}
              </div>
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#2563EB] text-white rounded-xl py-3.5 font-semibold text-base disabled:opacity-50 mt-2"
            >
              {loading ? 'Enregistrement…' : income ? 'Modifier' : 'Ajouter'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
