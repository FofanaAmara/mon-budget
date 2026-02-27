'use client';

import { useState } from 'react';
import { createIncome, updateIncome } from '@/lib/actions/incomes';
import type { Income, IncomeFrequency } from '@/lib/types';

type Props = {
  income?: Income;
  onClose: () => void;
};

const FREQUENCY_OPTIONS: { value: IncomeFrequency; label: string; sub: string }[] = [
  { value: 'MONTHLY',   label: 'Mensuel',       sub: '12x/an' },
  { value: 'BIWEEKLY',  label: 'Aux 2 sem.',    sub: '26x/an' },
  { value: 'YEARLY',    label: 'Annuel',         sub: '1x/an'  },
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
      className="sheet-backdrop"
      onClick={onClose}
    >
      <div
        className="sheet"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sheet-handle" />

        <div style={{ padding: '8px 24px 32px' }}>
          <h2 style={{
            fontSize: 'var(--text-lg)',
            fontWeight: 700,
            color: 'var(--text-primary)',
            marginBottom: '24px',
            letterSpacing: 'var(--tracking-tight)',
          }}>
            {income ? 'Modifier le revenu' : 'Nouveau revenu'}
          </h2>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Name */}
            <div>
              <label className="field-label">Source de revenu</label>
              <input
                type="text"
                placeholder="Salaire, Freelance, Loyer percu..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-field"
              />
            </div>

            {/* Amount */}
            <div>
              <label className="field-label">Montant ($)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="input-field"
                style={{ fontVariantNumeric: 'tabular-nums' }}
              />
            </div>

            {/* Frequency */}
            <div>
              <label className="field-label">Frequence</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {FREQUENCY_OPTIONS.map(({ value, label, sub }) => {
                  const active = frequency === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setFrequency(value)}
                      className="freq-pill"
                      data-active={active}
                      style={{
                        padding: '12px 8px',
                        textAlign: 'center',
                        ...(active ? {
                          background: 'var(--text-primary)',
                          borderColor: 'var(--text-primary)',
                          color: 'var(--text-inverted)',
                        } : {}),
                      }}
                    >
                      <span style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600 }}>
                        {label}
                      </span>
                      <span style={{
                        display: 'block',
                        fontSize: '10px',
                        marginTop: '2px',
                        opacity: 0.7,
                      }}>
                        {sub}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {error && (
              <p style={{
                fontSize: 'var(--text-sm)',
                color: 'var(--negative)',
                background: 'var(--negative-subtle)',
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
              }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{
                width: '100%',
                padding: '16px',
                fontSize: 'var(--text-base)',
                marginTop: '4px',
                opacity: loading ? 0.5 : 1,
              }}
            >
              {loading ? 'Enregistrement...' : income ? 'Modifier' : 'Ajouter'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
