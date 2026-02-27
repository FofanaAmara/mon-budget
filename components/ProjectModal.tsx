'use client';

import { useState } from 'react';
import type { Section } from '@/lib/types';

type Props = {
  sections: Section[];
  onClose: () => void;
};

export default function ProjectModal({ sections, onClose }: Props) {
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [initialAmount, setInitialAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError('Nom requis'); return; }
    if (!targetAmount) { setError('Objectif requis'); return; }
    setLoading(true);
    setError('');
    try {
      const { createExpense } = await import('@/lib/actions/expenses');
      await createExpense({
        name: name.trim(),
        amount: 0,
        type: 'PLANNED',
        section_id: sectionId || undefined,
        target_amount: parseFloat(targetAmount),
        target_date: targetDate || undefined,
        saved_amount: initialAmount ? parseFloat(initialAmount) : 0,
      });
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
            Nouveau projet
          </h2>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label className="field-label">Nom</label>
              <input
                type="text"
                placeholder="Ex: Voyage Japon, Voiture..."
                value={name} onChange={(e) => setName(e.target.value)}
                className="input-field"
              />
            </div>

            <div>
              <label className="field-label">Objectif ($)</label>
              <input
                type="number" min="0" step="0.01" placeholder="5000.00"
                value={targetAmount} onChange={(e) => setTargetAmount(e.target.value)}
                className="input-field" style={{ fontVariantNumeric: 'tabular-nums' }}
              />
            </div>
            <div>
              <label className="field-label">Date cible (optionnel)</label>
              <input
                type="date"
                value={targetDate} onChange={(e) => setTargetDate(e.target.value)}
                className="input-field"
              />
            </div>

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
              <label className="field-label">Montant initial epargne (optionnel)</label>
              <input
                type="number" min="0" step="0.01" placeholder="0.00"
                value={initialAmount} onChange={(e) => setInitialAmount(e.target.value)}
                className="input-field" style={{ fontVariantNumeric: 'tabular-nums' }}
              />
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
              {loading ? 'Création...' : 'Créer le projet'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
