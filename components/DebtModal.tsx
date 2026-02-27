'use client';

import { useState } from 'react';
import type { Section, Card, Debt, DebtFrequency } from '@/lib/types';

const FREQUENCIES: { value: DebtFrequency; label: string }[] = [
  { value: 'WEEKLY', label: 'Hebdomadaire' },
  { value: 'BIWEEKLY', label: 'Aux 2 semaines' },
  { value: 'MONTHLY', label: 'Mensuel' },
  { value: 'QUARTERLY', label: 'Trimestriel' },
  { value: 'YEARLY', label: 'Annuel' },
];

type Props = {
  sections: Section[];
  cards: Card[];
  debt?: Debt | null;
  onClose: () => void;
};

export default function DebtModal({ sections, cards, debt, onClose }: Props) {
  const isEdit = !!debt;
  const [name, setName] = useState(debt?.name ?? '');
  const [originalAmount, setOriginalAmount] = useState(debt ? String(debt.original_amount) : '');
  const [remainingBalance, setRemainingBalance] = useState(debt ? String(debt.remaining_balance) : '');
  const [interestRate, setInterestRate] = useState(debt?.interest_rate != null ? String(debt.interest_rate) : '');
  const [paymentAmount, setPaymentAmount] = useState(debt ? String(debt.payment_amount) : '');
  const [paymentFrequency, setPaymentFrequency] = useState<DebtFrequency>(debt?.payment_frequency ?? 'MONTHLY');
  const [paymentDay, setPaymentDay] = useState(debt?.payment_day != null ? String(debt.payment_day) : '');
  const [autoDebit, setAutoDebit] = useState(debt?.auto_debit ?? false);
  const [cardId, setCardId] = useState(debt?.card_id ?? '');
  const [sectionId, setSectionId] = useState(debt?.section_id ?? '');
  const [notes, setNotes] = useState(debt?.notes ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError('Nom requis'); return; }
    if (!originalAmount) { setError('Montant initial requis'); return; }
    if (!paymentAmount) { setError('Montant du versement requis'); return; }

    setLoading(true);
    setError('');

    try {
      const payload = {
        name: name.trim(),
        original_amount: parseFloat(originalAmount),
        remaining_balance: remainingBalance ? parseFloat(remainingBalance) : parseFloat(originalAmount),
        interest_rate: interestRate ? parseFloat(interestRate) : null,
        payment_amount: parseFloat(paymentAmount),
        payment_frequency: paymentFrequency,
        payment_day: paymentDay ? parseInt(paymentDay) : null,
        auto_debit: autoDebit,
        card_id: cardId || null,
        section_id: sectionId || null,
        notes: notes.trim() || null,
      };

      if (isEdit) {
        const { updateDebt } = await import('@/lib/actions/debts');
        await updateDebt(debt.id, payload);
      } else {
        const { createDebt } = await import('@/lib/actions/debts');
        await createDebt(payload);
      }
      onClose();
    } catch {
      setError(isEdit ? 'Erreur lors de la modification' : 'Erreur lors de la creation');
      setLoading(false);
    }
  }

  return (
    <div className="sheet-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div style={{ padding: '8px 24px 40px', maxHeight: '80vh', overflowY: 'auto' }}>
          <h2 style={{
            fontSize: 'var(--text-lg)', fontWeight: 700,
            color: 'var(--text-primary)', marginBottom: '20px',
            letterSpacing: 'var(--tracking-tight)',
          }}>
            {isEdit ? 'Modifier la dette' : 'Nouvelle dette'}
          </h2>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label className="field-label">Nom</label>
              <input
                type="text" placeholder="Ex: Pret auto, Carte Visa..."
                value={name} onChange={(e) => setName(e.target.value)}
                className="input-field"
              />
            </div>

            <div className="flex" style={{ gap: '12px' }}>
              <div style={{ flex: 1 }}>
                <label className="field-label">Montant initial ($)</label>
                <input
                  type="number" min="0" step="0.01" placeholder="15000.00"
                  value={originalAmount} onChange={(e) => setOriginalAmount(e.target.value)}
                  className="input-field" style={{ fontVariantNumeric: 'tabular-nums' }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label className="field-label">Solde restant ($)</label>
                <input
                  type="number" min="0" step="0.01" placeholder="12000.00"
                  value={remainingBalance} onChange={(e) => setRemainingBalance(e.target.value)}
                  className="input-field" style={{ fontVariantNumeric: 'tabular-nums' }}
                />
              </div>
            </div>

            <div className="flex" style={{ gap: '12px' }}>
              <div style={{ flex: 1 }}>
                <label className="field-label">Versement ($)</label>
                <input
                  type="number" min="0" step="0.01" placeholder="400.00"
                  value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)}
                  className="input-field" style={{ fontVariantNumeric: 'tabular-nums' }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label className="field-label">Taux d&apos;interet (%)</label>
                <input
                  type="number" min="0" step="0.01" placeholder="4.5"
                  value={interestRate} onChange={(e) => setInterestRate(e.target.value)}
                  className="input-field" style={{ fontVariantNumeric: 'tabular-nums' }}
                />
              </div>
            </div>

            <div className="flex" style={{ gap: '12px' }}>
              <div style={{ flex: 1 }}>
                <label className="field-label">Frequence</label>
                <select
                  value={paymentFrequency}
                  onChange={(e) => setPaymentFrequency(e.target.value as DebtFrequency)}
                  className="input-field"
                >
                  {FREQUENCIES.map((f) => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label className="field-label">Jour de paiement</label>
                <input
                  type="number" min="1" max="31" placeholder="15"
                  value={paymentDay} onChange={(e) => setPaymentDay(e.target.value)}
                  className="input-field" style={{ fontVariantNumeric: 'tabular-nums' }}
                />
              </div>
            </div>

            <div className="flex items-center" style={{ gap: '10px' }}>
              <input
                type="checkbox" id="auto-debit"
                checked={autoDebit}
                onChange={(e) => setAutoDebit(e.target.checked)}
                style={{ width: '18px', height: '18px', accentColor: 'var(--accent)' }}
              />
              <label htmlFor="auto-debit" style={{
                fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--text-secondary)',
              }}>
                Prelevement automatique
              </label>
            </div>

            {cards.length > 0 && (
              <div>
                <label className="field-label">Carte (optionnel)</label>
                <select value={cardId} onChange={(e) => setCardId(e.target.value)} className="input-field">
                  <option value="">Aucune</option>
                  {cards.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}{c.last_four ? ` •••• ${c.last_four}` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {sections.length > 0 && (
              <div>
                <label className="field-label">Section (optionnel)</label>
                <select value={sectionId} onChange={(e) => setSectionId(e.target.value)} className="input-field">
                  <option value="">Aucune</option>
                  {sections.map((s) => (
                    <option key={s.id} value={s.id}>{s.icon} {s.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="field-label">Notes (optionnel)</label>
              <textarea
                placeholder="Informations supplementaires..."
                value={notes} onChange={(e) => setNotes(e.target.value)}
                className="input-field"
                rows={2}
                style={{ resize: 'vertical' }}
              />
            </div>

            {error && (
              <p style={{
                fontSize: 'var(--text-sm)', color: 'var(--negative)',
                background: 'var(--negative-subtle)', padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
              }}>
                {error}
              </p>
            )}

            <button
              type="submit" disabled={loading}
              className="btn-primary"
              style={{ width: '100%', padding: '16px', fontSize: 'var(--text-base)', opacity: loading ? 0.5 : 1 }}
            >
              {loading
                ? (isEdit ? 'Modification...' : 'Creation...')
                : (isEdit ? 'Modifier' : 'Creer la dette')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
