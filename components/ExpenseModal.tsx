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
      className="sheet-backdrop"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="sheet">
        {/* Handle */}
        <div className="sheet-handle" />

        <div style={{ padding: '8px 24px 32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h2 style={{
            fontSize: 'var(--text-lg)',
            fontWeight: 700,
            color: 'var(--text-primary)',
            letterSpacing: 'var(--tracking-tight)',
          }}>
            {expense ? 'Modifier la depense' : 'Nouvelle depense'}
          </h2>

          {/* 1. Section */}
          <div>
            <label className="field-label">Section *</label>
            <select
              value={sectionId}
              onChange={(e) => setSectionId(e.target.value)}
              className="select-field"
            >
              <option value="">Choisir une section...</option>
              {sections.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* 2. Nom */}
          <div>
            <label className="field-label">Nom *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Loyer, Netflix, Assurance..."
              className="input-field"
            />
          </div>

          {/* 3. Montant */}
          <div>
            <label className="field-label">Montant *</label>
            <div style={{ position: 'relative' }}>
              <span style={{
                position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)',
                color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)',
              }}>$</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                min="0"
                step="0.01"
                className="input-field"
                style={{ paddingLeft: '32px', fontVariantNumeric: 'tabular-nums' }}
              />
            </div>
          </div>

          {/* 4. Type toggle */}
          <div>
            <label className="field-label">Type</label>
            <div className="type-toggle">
              {(['RECURRING', 'ONE_TIME', 'PLANNED'] as ExpenseType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className="type-toggle-btn"
                  data-active={type === t}
                >
                  {t === 'RECURRING' ? 'Recurrent' : t === 'ONE_TIME' ? 'Ponctuel' : 'Planifie'}
                </button>
              ))}
            </div>
          </div>

          {/* RECURRING fields */}
          {type === 'RECURRING' && (
            <>
              <div>
                <label className="field-label">Frequence</label>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {FREQUENCIES.map((f) => (
                    <button
                      key={f.value}
                      type="button"
                      onClick={() => setFrequency(f.value)}
                      className="freq-pill"
                      data-active={frequency === f.value}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="field-label">Jour du mois</label>
                  <input
                    type="number"
                    value={day}
                    onChange={(e) => setDay(e.target.value)}
                    min="1"
                    max="31"
                    className="input-field"
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '6px' }}>
                  <label className="field-label" style={{ marginBottom: 0 }}>Prelevement auto</label>
                  <button
                    type="button"
                    onClick={() => { setAutoDebit(!autoDebit); if (autoDebit) setCardId(''); }}
                    className="toggle"
                    data-active={autoDebit}
                  >
                    <span className="toggle-knob" />
                  </button>
                </div>
              </div>

              {/* Carte */}
              {autoDebit && cards.length > 0 && (
                <div>
                  <label className="field-label">Carte de debit</label>
                  <select
                    value={cardId}
                    onChange={(e) => setCardId(e.target.value)}
                    className="select-field"
                  >
                    <option value="">Choisir une carte...</option>
                    {cards.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}{c.last_four ? ` .... ${c.last_four}` : ''}
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
              <label className="field-label">Date d&apos;echeance</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="input-field"
              />
            </div>
          )}

          {/* PLANNED fields */}
          {type === 'PLANNED' && (
            <>
              <div>
                <label className="field-label">Objectif ($)</label>
                <div style={{ position: 'relative' }}>
                  <span style={{
                    position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)',
                    color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)',
                  }}>$</span>
                  <input
                    type="number"
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className="input-field"
                    style={{ paddingLeft: '32px', fontVariantNumeric: 'tabular-nums' }}
                  />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="field-label">Date cible</label>
                  <input
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="field-label">Deja epargne ($)</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{
                      position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)',
                      color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)',
                    }}>$</span>
                    <input
                      type="number"
                      value={savedAmount}
                      onChange={(e) => setSavedAmount(e.target.value)}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      className="input-field"
                      style={{ paddingLeft: '28px', fontVariantNumeric: 'tabular-nums' }}
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Notes */}
          <div>
            <label className="field-label">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Informations supplementaires..."
              className="input-field"
              style={{ resize: 'none' }}
            />
          </div>

          {/* Actions */}
          <div className="flex" style={{ gap: '12px', paddingTop: '4px' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              style={{ flex: 1, padding: '12px 20px' }}
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isPending || !isValid}
              className="btn-primary"
              style={{ flex: 1, padding: '12px 20px' }}
            >
              {isPending ? 'Enregistrement...' : expense ? 'Modifier' : 'Ajouter'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
