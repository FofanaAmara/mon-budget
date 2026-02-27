'use client';

import { useState } from 'react';
import { createIncome, updateIncome } from '@/lib/actions/incomes';
import type { Income, IncomeFrequency } from '@/lib/types';

type Props = {
  income?: Income;
  onClose: () => void;
};

const FREQUENCY_OPTIONS: { value: IncomeFrequency; label: string; sub: string }[] = [
  { value: 'MONTHLY',   label: 'Mensuel',       sub: '12×/an' },
  { value: 'BIWEEKLY',  label: 'Aux 2 sem.',    sub: '26×/an' },
  { value: 'YEARLY',    label: 'Annuel',         sub: '1×/an'  },
];

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
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: 'var(--surface-overlay)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg pb-safe"
        style={{
          background: 'var(--surface-raised)',
          borderRadius: 'var(--radius-sheet) var(--radius-sheet) 0 0',
          boxShadow: 'var(--shadow-xl)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-9 h-1 rounded-full" style={{ background: 'var(--border-strong)' }} />
        </div>

        <div className="px-6 pb-8 pt-2">
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '24px', letterSpacing: '-0.01em' }}>
            {income ? 'Modifier le revenu' : 'Nouveau revenu'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name */}
            <div>
              <label
                style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}
              >
                Source de revenu
              </label>
              <input
                type="text"
                placeholder="Salaire, Freelance, Loyer perçu…"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{
                  width: '100%',
                  border: '1.5px solid var(--border-default)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px 14px',
                  fontSize: '14px',
                  color: 'var(--text-primary)',
                  background: 'var(--surface-inset)',
                  outline: 'none',
                  transition: 'border-color 150ms ease-out',
                }}
                onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
                onBlur={(e) => (e.target.style.borderColor = 'var(--border-default)')}
              />
            </div>

            {/* Amount */}
            <div>
              <label
                style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}
              >
                Montant ($)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                style={{
                  width: '100%',
                  border: '1.5px solid var(--border-default)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px 14px',
                  fontSize: '14px',
                  color: 'var(--text-primary)',
                  background: 'var(--surface-inset)',
                  outline: 'none',
                  transition: 'border-color 150ms ease-out',
                  fontVariantNumeric: 'tabular-nums',
                }}
                onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
                onBlur={(e) => (e.target.style.borderColor = 'var(--border-default)')}
              />
            </div>

            {/* Frequency */}
            <div>
              <label
                style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}
              >
                Fréquence
              </label>
              <div className="grid grid-cols-3 gap-2">
                {FREQUENCY_OPTIONS.map(({ value, label, sub }) => {
                  const active = frequency === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setFrequency(value)}
                      className="py-2.5 px-2 rounded-[var(--radius-md)] transition-all text-center"
                      style={{
                        border: active ? '1.5px solid var(--accent)' : '1.5px solid var(--border-default)',
                        background: active ? 'var(--accent-subtle)' : 'var(--surface-inset)',
                      }}
                    >
                      <span style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: active ? 'var(--accent)' : 'var(--text-primary)' }}>
                        {label}
                      </span>
                      <span style={{ display: 'block', fontSize: '10px', color: active ? 'var(--accent-muted)' : 'var(--text-tertiary)', marginTop: '1px' }}>
                        {sub}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {error && (
              <p style={{ fontSize: '13px', color: 'var(--negative)', background: 'var(--negative-subtle)', padding: '8px 12px', borderRadius: 'var(--radius-sm)' }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full font-semibold transition-all active:scale-[0.98]"
              style={{
                background: loading ? 'var(--accent-muted)' : 'var(--accent)',
                color: 'var(--text-inverted)',
                borderRadius: 'var(--radius-md)',
                padding: '14px',
                fontSize: '15px',
                fontWeight: 600,
                marginTop: '8px',
                boxShadow: loading ? 'none' : 'var(--shadow-accent)',
              }}
            >
              {loading ? 'Enregistrement…' : income ? 'Modifier' : 'Ajouter'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
