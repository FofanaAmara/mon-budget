'use client';

import { useState } from 'react';
import { createIncome, updateIncome } from '@/lib/actions/incomes';
import type { Income, IncomeFrequency, IncomeSource } from '@/lib/types';

type Props = {
  income?: Income;
  onClose: () => void;
};

const SOURCE_OPTIONS: { value: IncomeSource; label: string; icon: string; color: string }[] = [
  { value: 'EMPLOYMENT', label: 'Emploi',        icon: '💼', color: '#2563EB' },
  { value: 'BUSINESS',   label: 'Business',      icon: '🏢', color: '#7C3AED' },
  { value: 'INVESTMENT', label: 'Investissement', icon: '📈', color: '#059669' },
  { value: 'OTHER',      label: 'Autre',          icon: '🔧', color: '#6B7280' },
];

const FIXED_FREQ_OPTIONS: { value: IncomeFrequency; label: string; sub: string }[] = [
  { value: 'MONTHLY',  label: 'Mensuel',    sub: '12x/an' },
  { value: 'BIWEEKLY', label: 'Aux 2 sem.', sub: '26x/an' },
  { value: 'YEARLY',   label: 'Annuel',     sub: '1x/an'  },
];

export default function IncomeModal({ income, onClose }: Props) {
  const [name, setName] = useState(income?.name ?? '');
  const [source, setSource] = useState<IncomeSource>(income?.source ?? 'EMPLOYMENT');
  const [isVariable, setIsVariable] = useState(income?.frequency === 'VARIABLE');
  const [amount, setAmount] = useState(
    income?.frequency !== 'VARIABLE' ? (income?.amount?.toString() ?? '') : ''
  );
  const [frequency, setFrequency] = useState<IncomeFrequency>(
    income?.frequency !== 'VARIABLE' ? (income?.frequency ?? 'MONTHLY') : 'MONTHLY'
  );
  const [estimatedAmount, setEstimatedAmount] = useState(
    income?.estimated_amount?.toString() ?? ''
  );
  const [notes, setNotes] = useState(income?.notes ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError('Le nom est requis');
      return;
    }
    if (!isVariable && !amount) {
      setError('Le montant est requis pour un revenu fixe');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = {
        name: name.trim(),
        source,
        amount: isVariable ? null : parseFloat(amount),
        estimated_amount: estimatedAmount ? parseFloat(estimatedAmount) : null,
        frequency: isVariable ? 'VARIABLE' as IncomeFrequency : frequency,
        notes: notes.trim() || null,
      };
      if (income) {
        await updateIncome(income.id, data);
      } else {
        await createIncome(data);
      }
      onClose();
    } catch {
      setError('Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  }

  const sourceMeta = SOURCE_OPTIONS.find(s => s.value === source);

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />

        <div style={{ padding: '8px 24px 40px' }}>
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
              <label className="field-label">Nom du revenu</label>
              <input
                type="text"
                placeholder="Salaire, Freelance, Loyer percu..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-field"
              />
            </div>

            {/* Source picker */}
            <div>
              <label className="field-label">Source</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                {SOURCE_OPTIONS.map((opt) => {
                  const active = source === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setSource(opt.value)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 12px',
                        borderRadius: 'var(--radius-md)',
                        border: `1.5px solid ${active ? opt.color : 'var(--border-default)'}`,
                        background: active ? `${opt.color}12` : 'var(--surface-raised)',
                        cursor: 'pointer',
                        transition: 'all var(--duration-fast) var(--ease-out)',
                      }}
                    >
                      <span style={{ fontSize: '16px' }}>{opt.icon}</span>
                      <span style={{
                        fontSize: 'var(--text-xs)',
                        fontWeight: active ? 650 : 500,
                        color: active ? opt.color : 'var(--text-secondary)',
                      }}>
                        {opt.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Fixed / Variable toggle */}
            <div>
              <label className="field-label">Type de revenu</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {[
                  { val: false, label: 'Fixe',     sub: 'Montant connu',    icon: '🔒' },
                  { val: true,  label: 'Variable',  sub: 'Montant variable', icon: '📊' },
                ].map(({ val, label, sub, icon }) => {
                  const active = isVariable === val;
                  return (
                    <button
                      key={label}
                      type="button"
                      onClick={() => setIsVariable(val)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '12px',
                        borderRadius: 'var(--radius-md)',
                        border: `1.5px solid ${active ? 'var(--accent)' : 'var(--border-default)'}`,
                        background: active ? 'var(--accent-subtle)' : 'var(--surface-raised)',
                        cursor: 'pointer',
                      }}
                    >
                      <span style={{ fontSize: '16px' }}>{icon}</span>
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontSize: 'var(--text-xs)', fontWeight: active ? 650 : 500, color: active ? 'var(--accent)' : 'var(--text-secondary)' }}>
                          {label}
                        </div>
                        <div style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>{sub}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Fixed: Amount + Frequency */}
            {!isVariable && (
              <>
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

                <div>
                  <label className="field-label">Fréquence</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                    {FIXED_FREQ_OPTIONS.map(({ value, label, sub }) => {
                      const active = frequency === value;
                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setFrequency(value)}
                          style={{
                            padding: '12px 8px',
                            textAlign: 'center',
                            borderRadius: 'var(--radius-md)',
                            border: `1.5px solid ${active ? 'var(--text-primary)' : 'var(--border-default)'}`,
                            background: active ? 'var(--text-primary)' : 'var(--surface-raised)',
                            cursor: 'pointer',
                          }}
                        >
                          <span style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, color: active ? 'var(--text-inverted)' : 'var(--text-secondary)' }}>
                            {label}
                          </span>
                          <span style={{ display: 'block', fontSize: '10px', marginTop: '2px', color: active ? 'rgba(255,255,255,0.7)' : 'var(--text-tertiary)' }}>
                            {sub}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            {/* Variable: Estimated amount */}
            {isVariable && (
              <div>
                <label className="field-label">
                  Estimation mensuelle ($)
                  <span style={{ fontWeight: 400, color: 'var(--text-tertiary)', marginLeft: '4px' }}>optionnel</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Estimation pour le calcul du reste à vivre"
                  value={estimatedAmount}
                  onChange={(e) => setEstimatedAmount(e.target.value)}
                  className="input-field"
                  style={{ fontVariantNumeric: 'tabular-nums' }}
                />
                <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                  Utilisée pour estimer votre reste à vivre mensuel
                </p>
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="field-label">
                Notes
                <span style={{ fontWeight: 400, color: 'var(--text-tertiary)', marginLeft: '4px' }}>optionnel</span>
              </label>
              <input
                type="text"
                placeholder="Ex: Virement du 1er du mois"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="input-field"
              />
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
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              {sourceMeta && <span>{sourceMeta.icon}</span>}
              {loading ? 'Enregistrement...' : income ? 'Modifier' : 'Ajouter'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
