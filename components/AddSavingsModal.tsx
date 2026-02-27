'use client';

import { useState } from 'react';
import { formatCAD } from '@/lib/utils';

type Props = {
  expenseId: string;
  projectName: string;
  currentSaved: number;
  targetAmount: number | null;
  onDone: () => void;
  onClose: () => void;
};

export default function AddSavingsModal({ expenseId, projectName, currentSaved, targetAmount, onDone, onClose }: Props) {
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) return;
    setLoading(true);
    try {
      const { addSavingsContribution } = await import('@/lib/actions/expenses');
      await addSavingsContribution(expenseId, val, note.trim() || null);
      onDone();
    } catch {
      setLoading(false);
    }
  }

  return (
    <div className="sheet-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div style={{ padding: '8px 24px 32px' }}>
          <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px' }}>
            Ajouter de l&apos;epargne
          </h2>
          <div style={{
            padding: '12px 16px', marginBottom: '16px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--surface-inset)',
          }}>
            <p style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>
              {projectName}
            </p>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: '4px' }}>
              Actuel : {formatCAD(currentSaved)}
              {targetAmount !== null && ` / ${formatCAD(targetAmount)}`}
            </p>
          </div>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label className="field-label">Montant a ajouter ($)</label>
              <input
                type="number" min="0" step="0.01" placeholder="0.00"
                value={amount} onChange={(e) => setAmount(e.target.value)}
                className="input-field" style={{ fontVariantNumeric: 'tabular-nums' }}
                autoFocus
              />
            </div>
            <div>
              <label className="field-label">Note (optionnel)</label>
              <input
                type="text" placeholder="Ex: Bonus mars, Vente Kijiji..."
                value={note} onChange={(e) => setNote(e.target.value)}
                className="input-field"
              />
            </div>
            <button
              type="submit" disabled={loading}
              className="btn-primary"
              style={{ width: '100%', padding: '16px', fontSize: 'var(--text-base)', opacity: loading ? 0.5 : 1 }}
            >
              {loading ? 'Enregistrement...' : 'Ajouter'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
