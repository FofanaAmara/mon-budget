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
  { value: 'WEEKLY',    label: 'Hebdo' },
  { value: 'BIWEEKLY', label: 'Bi-hebdo' },
  { value: 'MONTHLY',  label: 'Mensuel' },
  { value: 'QUARTERLY',label: 'Trim.' },
  { value: 'YEARLY',   label: 'Annuel' },
];

export default function ExpenseModal({ sections, cards, expense, onClose, onSuccess }: Props) {
  const [isPending, startTransition] = useTransition();

  const [sectionId, setSectionId]         = useState(expense?.section_id ?? '');
  const [name, setName]                   = useState(expense?.name ?? '');
  const [amount, setAmount]               = useState(expense?.amount?.toString() ?? '');
  const [type, setType]                   = useState<ExpenseType>(expense?.type ?? 'RECURRING');
  const [frequency, setFrequency]         = useState<RecurrenceFrequency>(expense?.recurrence_frequency ?? 'MONTHLY');
  const [day, setDay]                     = useState(expense?.recurrence_day?.toString() ?? '1');
  const [autoDebit, setAutoDebit]         = useState(expense?.auto_debit ?? false);
  const [cardId, setCardId]               = useState(expense?.card_id ?? '');
  const [dueDate, setDueDate]             = useState(expense?.due_date ?? '');
  const [notes, setNotes]                 = useState(expense?.notes ?? '');
  // PLANNED fields
  const [targetAmount, setTargetAmount]   = useState(expense?.target_amount?.toString() ?? '');
  const [targetDate, setTargetDate]       = useState(expense?.target_date ?? '');
  const [savedAmount, setSavedAmount]     = useState(expense?.saved_amount?.toString() ?? '0');

  const isValid = sectionId && name.trim() && amount && parseFloat(amount) > 0;

  function handleSubmit() {
    if (!isValid) return;

    startTransition(async () => {
      const data = {
        name: name.trim(),
        amount: parseFloat(amount),
        type,
        section_id: sectionId,
        card_id: (autoDebit && cardId) ? cardId : undefined,
        recurrence_frequency: type === 'RECURRING' ? frequency : undefined,
        recurrence_day: type === 'RECURRING' ? parseInt(day) : undefined,
        auto_debit: type === 'RECURRING' ? autoDebit : false,
        due_date: type === 'ONE_TIME' ? dueDate || undefined : undefined,
        notes: notes || undefined,
        // PLANNED fields
        target_amount: type === 'PLANNED' && targetAmount ? parseFloat(targetAmount) : undefined,
        target_date: type === 'PLANNED' ? targetDate || undefined : undefined,
        saved_amount: type === 'PLANNED' ? parseFloat(savedAmount) || 0 : undefined,
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
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-sm max-h-[92vh] overflow-y-auto">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-9 h-1 bg-[#E2E8F0] rounded-full" />
        </div>

        <div className="px-6 pt-4 pb-8 space-y-5">
          <h2 className="text-base font-semibold text-[#1E293B] tracking-tight">
            {expense ? 'Modifier la dépense' : 'Nouvelle dépense'}
          </h2>

          {/* 1. Section — première et obligatoire */}
          <div>
            <label className="text-xs font-medium text-[#64748B] mb-1.5 block tracking-wide uppercase">Section *</label>
            <select
              value={sectionId}
              onChange={(e) => setSectionId(e.target.value)}
              className={`w-full border rounded-xl px-4 py-3 text-sm outline-none bg-white transition-colors ${
                sectionId
                  ? 'border-[#E2E8F0] focus:border-[#1E293B]'
                  : 'border-[#E2E8F0] focus:border-[#1E293B]'
              }`}
            >
              <option value="">Choisir une section…</option>
              {sections.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* 2. Nom */}
          <div>
            <label className="text-xs font-medium text-[#64748B] mb-1.5 block tracking-wide uppercase">Nom *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Loyer, Netflix, Assurance…"
              className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm focus:border-[#1E293B] outline-none"
            />
          </div>

          {/* 3. Montant */}
          <div>
            <label className="text-xs font-medium text-[#64748B] mb-1.5 block tracking-wide uppercase">Montant *</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8] text-sm">$</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                min="0"
                step="0.01"
                className="w-full border border-[#E2E8F0] rounded-xl pl-8 pr-4 py-3 text-sm focus:border-[#1E293B] outline-none"
              />
            </div>
          </div>

          {/* 4. Type */}
          <div>
            <label className="text-xs font-medium text-[#64748B] mb-1.5 block tracking-wide uppercase">Type</label>
            <div className="flex bg-[#F8FAFC] rounded-xl p-1 gap-1">
              {(['RECURRING', 'ONE_TIME', 'PLANNED'] as ExpenseType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                    type === t
                      ? 'bg-white text-[#1E293B] shadow-sm'
                      : 'text-[#94A3B8]'
                  }`}
                >
                  {t === 'RECURRING' ? 'Récurrent' : t === 'ONE_TIME' ? 'Ponctuel' : 'Planifié'}
                </button>
              ))}
            </div>
          </div>

          {/* RECURRING fields */}
          {type === 'RECURRING' && (
            <>
              <div>
                <label className="text-xs font-medium text-[#64748B] mb-1.5 block tracking-wide uppercase">Fréquence</label>
                <div className="flex gap-1.5 flex-wrap">
                  {FREQUENCIES.map((f) => (
                    <button
                      key={f.value}
                      onClick={() => setFrequency(f.value)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                        frequency === f.value
                          ? 'bg-[#1E293B] text-white border-[#1E293B]'
                          : 'bg-white text-[#64748B] border-[#E2E8F0]'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-[#64748B] mb-1.5 block tracking-wide uppercase">Jour du mois</label>
                  <input
                    type="number"
                    value={day}
                    onChange={(e) => setDay(e.target.value)}
                    min="1"
                    max="31"
                    className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm focus:border-[#1E293B] outline-none"
                  />
                </div>

                <div className="flex flex-col justify-center gap-1.5">
                  <label className="text-xs font-medium text-[#64748B] tracking-wide uppercase">Prélèvement auto</label>
                  <button
                    onClick={() => { setAutoDebit(!autoDebit); if (autoDebit) setCardId(''); }}
                    className={`relative w-11 h-6 rounded-full transition-colors ${autoDebit ? 'bg-[#1E293B]' : 'bg-[#E2E8F0]'}`}
                  >
                    <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${autoDebit ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
              </div>

              {/* Carte — visible uniquement si prélèvement auto activé */}
              {autoDebit && cards.length > 0 && (
                <div>
                  <label className="text-xs font-medium text-[#64748B] mb-1.5 block tracking-wide uppercase">Carte de débit</label>
                  <select
                    value={cardId}
                    onChange={(e) => setCardId(e.target.value)}
                    className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm focus:border-[#1E293B] outline-none bg-white"
                  >
                    <option value="">Choisir une carte…</option>
                    {cards.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}{c.last_four ? ` •••• ${c.last_four}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </>
          )}

          {/* ONE_TIME date */}
          {type === 'ONE_TIME' && (
            <div>
              <label className="text-xs font-medium text-[#64748B] mb-1.5 block tracking-wide uppercase">Date d&apos;échéance</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm focus:border-[#1E293B] outline-none"
              />
            </div>
          )}

          {/* PLANNED fields */}
          {type === 'PLANNED' && (
            <>
              <div>
                <label className="text-xs font-medium text-[#64748B] mb-1.5 block tracking-wide uppercase">Objectif ($)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8] text-sm">$</span>
                  <input
                    type="number"
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className="w-full border border-[#E2E8F0] rounded-xl pl-8 pr-4 py-3 text-sm focus:border-[#1E293B] outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-[#64748B] mb-1.5 block tracking-wide uppercase">Date cible</label>
                  <input
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm focus:border-[#1E293B] outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-[#64748B] mb-1.5 block tracking-wide uppercase">Déjà épargné ($)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8] text-sm">$</span>
                    <input
                      type="number"
                      value={savedAmount}
                      onChange={(e) => setSavedAmount(e.target.value)}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      className="w-full border border-[#E2E8F0] rounded-xl pl-7 pr-3 py-3 text-sm focus:border-[#1E293B] outline-none"
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Notes */}
          <div>
            <label className="text-xs font-medium text-[#64748B] mb-1.5 block tracking-wide uppercase">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Informations supplémentaires…"
              className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm focus:border-[#1E293B] outline-none resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              onClick={onClose}
              className="flex-1 border border-[#E2E8F0] text-[#64748B] rounded-xl px-5 py-3 text-sm font-medium"
            >
              Annuler
            </button>
            <button
              onClick={handleSubmit}
              disabled={isPending || !isValid}
              className="flex-1 bg-[#1E293B] text-white rounded-xl px-5 py-3 text-sm font-medium disabled:opacity-40 transition-opacity"
            >
              {isPending ? 'Enregistrement…' : expense ? 'Modifier' : 'Ajouter'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
