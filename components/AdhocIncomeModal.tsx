'use client';

import { useState } from 'react';
import type { IncomeSource } from '@/lib/types';

type Props = {
  month: string;
  onClose: () => void;
};

const SOURCES: { value: IncomeSource; label: string; icon: string }[] = [
  { value: 'EMPLOYMENT', label: 'Emploi', icon: '💼' },
  { value: 'BUSINESS', label: 'Business', icon: '🏢' },
  { value: 'INVESTMENT', label: 'Investissement', icon: '📈' },
  { value: 'OTHER', label: 'Autre', icon: '🔧' },
];

export default function AdhocIncomeModal({ month, onClose }: Props) {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [source, setSource] = useState<IncomeSource>('OTHER');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !amount) { setError('Nom et montant requis'); return; }
    setLoading(true);
    setError('');
    try {
      const { createAdhocIncome } = await import('@/lib/actions/incomes');
      await createAdhocIncome(name.trim(), parseFloat(amount), source, month);
      onClose();
    } catch {
      setError('Erreur lors de la création');
      setLoading(false);
    }
  }

  return (
    <div className="sheet-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div style={{ padding: '8px 24px 40px' }}>
          <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '20px', letterSpacing: 'var(--tracking-tight)' }}>
            Revenu ponctuel
          </h2>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label className="field-label">Description</label>
              <input
                type="text" placeholder="Ex: Prime, Remboursement..."
                value={name} onChange={(e) => setName(e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="field-label">Montant ($)</label>
              <input
                type="number" min="0" step="0.01" placeholder="0.00"
                value={amount} onChange={(e) => setAmount(e.target.value)}
                className="input-field" style={{ fontVariantNumeric: 'tabular-nums' }}
              />
            </div>
            <div>
              <label className="field-label">Source</label>
              <select value={source} onChange={(e) => setSource(e.target.value as IncomeSource)} className="input-field">
                {SOURCES.map((s) => (
                  <option key={s.value} value={s.value}>{s.icon} {s.label}</option>
                ))}
              </select>
            </div>
            {error && (
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--negative)', background: 'var(--negative-subtle)', padding: '8px 12px', borderRadius: 'var(--radius-sm)' }}>
                {error}
              </p>
            )}
            <button
              type="submit" disabled={loading}
              className="btn-primary"
              style={{ width: '100%', padding: '16px', fontSize: 'var(--text-base)', opacity: loading ? 0.5 : 1 }}
            >
              {loading ? 'Ajout...' : 'Ajouter ce revenu'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
