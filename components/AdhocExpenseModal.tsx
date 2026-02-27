'use client';

import { useState } from 'react';
import type { Section } from '@/lib/types';

type Props = {
  sections: Section[];
  month: string;
  onClose: () => void;
};

export default function AdhocExpenseModal({ sections, month, onClose }: Props) {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [sectionId, setSectionId] = useState(sections[0]?.id ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !amount) { setError('Nom et montant requis'); return; }
    if (!sectionId) { setError('Veuillez choisir une section'); return; }
    setLoading(true);
    setError('');
    try {
      const { createAdhocExpense } = await import('@/lib/actions/expenses');
      await createAdhocExpense(name.trim(), parseFloat(amount), sectionId, month);
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
            Dépense adhoc
          </h2>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label className="field-label">Description</label>
              <input
                type="text" placeholder="Ex: Réparation, Course urgente..."
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
              <label className="field-label">Section</label>
              <select value={sectionId} onChange={(e) => setSectionId(e.target.value)} className="input-field">
                {sections.map((s) => (
                  <option key={s.id} value={s.id}>{s.icon} {s.name}</option>
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
              {loading ? 'Ajout...' : 'Ajouter cette dépense'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
