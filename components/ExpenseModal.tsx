'use client';

import { useState, useTransition } from 'react';
import { createExpense, updateExpense } from '@/lib/actions/expenses';
import type { Expense, ExpenseType, RecurrenceFrequency, Section, Card } from '@/lib/types';

type Props = {
  sections: Section[];
  cards: Card[];
  expense?: Expense;
  onClose: () => void;
  onSuccess: () => void;
};

const FREQUENCIES: { value: RecurrenceFrequency; label: string }[] = [
  { value: 'WEEKLY', label: 'Hebdo' },
  { value: 'BIWEEKLY', label: 'Bi-hebdo' },
  { value: 'MONTHLY', label: 'Mensuel' },
  { value: 'QUARTERLY', label: 'Trim.' },
  { value: 'YEARLY', label: 'Annuel' },
];

export default function ExpenseModal({ sections, cards, expense, onClose, onSuccess }: Props) {
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState(expense?.name ?? '');
  const [amount, setAmount] = useState(expense?.amount?.toString() ?? '');
  const [type, setType] = useState<ExpenseType>(expense?.type ?? 'RECURRING');
  const [frequency, setFrequency] = useState<RecurrenceFrequency>(expense?.recurrence_frequency ?? 'MONTHLY');
  const [day, setDay] = useState(expense?.recurrence_day?.toString() ?? '1');
  const [autoDebit, setAutoDebit] = useState(expense?.auto_debit ?? false);
  const [dueDate, setDueDate] = useState(expense?.due_date ?? '');
  const [sectionId, setSectionId] = useState(expense?.section_id ?? '');
  const [cardId, setCardId] = useState(expense?.card_id ?? '');
  const [notes, setNotes] = useState(expense?.notes ?? '');

  function handleSubmit() {
    if (!name.trim() || !amount) return;
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0) return;

    startTransition(async () => {
      const data = {
        name: name.trim(),
        amount: parsed,
        type,
        section_id: sectionId || undefined,
        card_id: cardId || undefined,
        recurrence_frequency: type === 'RECURRING' ? frequency : undefined,
        recurrence_day: type === 'RECURRING' ? parseInt(day) : undefined,
        auto_debit: type === 'RECURRING' ? autoDebit : false,
        due_date: type === 'ONE_TIME' ? dueDate || undefined : undefined,
        notes: notes || undefined,
      };

      if (expense) {
        await updateExpense(expense.id, data);
      } else {
        await createExpense(data);
      }
      onSuccess();
      onClose();
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-xl w-full sm:max-w-sm max-h-[90vh] overflow-y-auto">
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 bg-[#E2E8F0] rounded-full" />
        </div>

        <div className="p-6 space-y-4">
          <h2 className="text-lg font-bold text-[#1E293B]">
            {expense ? 'Modifier la dépense' : 'Nouvelle dépense'}
          </h2>

          {/* Name */}
          <div>
            <label className="text-xs font-medium text-[#94A3B8] mb-1.5 block">Nom *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex : Loyer, Netflix…"
              className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
              autoFocus
            />
          </div>

          {/* Amount */}
          <div>
            <label className="text-xs font-medium text-[#94A3B8] mb-1.5 block">Montant (CAD) *</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8] text-sm font-medium">$</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                min="0"
                step="0.01"
                className="w-full border border-[#E2E8F0] rounded-xl pl-8 pr-4 py-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
              />
            </div>
          </div>

          {/* Type toggle */}
          <div>
            <label className="text-xs font-medium text-[#94A3B8] mb-1.5 block">Type</label>
            <div className="flex bg-[#F8FAFC] rounded-xl p-1 gap-1">
              {(['RECURRING', 'ONE_TIME'] as ExpenseType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                    type === t
                      ? 'bg-white text-[#2563EB] shadow-sm'
                      : 'text-[#94A3B8] hover:text-[#1E293B]'
                  }`}
                >
                  {t === 'RECURRING' ? '🔄 Récurrent' : '📅 Ponctuel'}
                </button>
              ))}
            </div>
          </div>

          {/* RECURRING fields */}
          {type === 'RECURRING' && (
            <>
              <div>
                <label className="text-xs font-medium text-[#94A3B8] mb-1.5 block">Fréquence</label>
                <div className="flex gap-1.5 flex-wrap">
                  {FREQUENCIES.map((f) => (
                    <button
                      key={f.value}
                      onClick={() => setFrequency(f.value)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        frequency === f.value
                          ? 'bg-[#2563EB] text-white'
                          : 'bg-[#F8FAFC] text-[#94A3B8] hover:bg-blue-50'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-[#94A3B8] mb-1.5 block">Jour du mois</label>
                  <input
                    type="number"
                    value={day}
                    onChange={(e) => setDay(e.target.value)}
                    min="1"
                    max="31"
                    className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                  />
                </div>
                <div className="flex flex-col justify-center">
                  <label className="text-xs font-medium text-[#94A3B8] mb-1.5 block">Prélèvement auto</label>
                  <button
                    onClick={() => setAutoDebit(!autoDebit)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${autoDebit ? 'bg-[#2563EB]' : 'bg-[#E2E8F0]'}`}
                  >
                    <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${autoDebit ? 'translate-x-7' : 'translate-x-1'}`} />
                  </button>
                </div>
              </div>
            </>
          )}

          {/* ONE_TIME fields */}
          {type === 'ONE_TIME' && (
            <div>
              <label className="text-xs font-medium text-[#94A3B8] mb-1.5 block">Date d&apos;échéance</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
              />
            </div>
          )}

          {/* Section */}
          <div>
            <label className="text-xs font-medium text-[#94A3B8] mb-1.5 block">Section</label>
            <select
              value={sectionId}
              onChange={(e) => setSectionId(e.target.value)}
              className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none bg-white"
            >
              <option value="">— Sans section —</option>
              {sections.map((s) => (
                <option key={s.id} value={s.id}>{s.icon} {s.name}</option>
              ))}
            </select>
          </div>

          {/* Card */}
          {cards.length > 0 && (
            <div>
              <label className="text-xs font-medium text-[#94A3B8] mb-1.5 block">Carte (optionnel)</label>
              <select
                value={cardId}
                onChange={(e) => setCardId(e.target.value)}
                className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none bg-white"
              >
                <option value="">— Sans carte —</option>
                {cards.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}{c.last_four ? ` •••• ${c.last_four}` : ''}</option>
                ))}
              </select>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="text-xs font-medium text-[#94A3B8] mb-1.5 block">Notes (optionnel)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Informations supplémentaires…"
              className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none resize-none"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="flex-1 border border-[#E2E8F0] text-[#1E293B] rounded-xl px-5 py-3 font-medium text-sm">
              Annuler
            </button>
            <button
              onClick={handleSubmit}
              disabled={isPending || !name.trim() || !amount}
              className="flex-1 bg-[#2563EB] text-white rounded-xl px-5 py-3 font-medium text-sm disabled:opacity-50"
            >
              {isPending ? 'Sauvegarde…' : expense ? 'Modifier' : 'Ajouter'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
