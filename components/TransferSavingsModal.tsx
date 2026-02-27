'use client';

import { useState } from 'react';
import { formatCAD } from '@/lib/utils';
import type { Expense } from '@/lib/types';

type Props = {
  source: Expense;
  allPots: Expense[];       // all projects + épargne libre (excluding source)
  onDone: () => void;
  onClose: () => void;
};

export default function TransferSavingsModal({ source, allPots, onDone, onClose }: Props) {
  const destinations = allPots.filter(p => p.id !== source.id);
  const [destId, setDestId] = useState(destinations[0]?.id ?? '');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const sourceBalance = Number(source.saved_amount ?? 0);
  const dest = destinations.find(p => p.id === destId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0 || val > sourceBalance || !dest) return;
    setLoading(true);
    try {
      const { transferSavings } = await import('@/lib/actions/expenses');
      await transferSavings(source.id, dest.id, val, source.name, dest.name);
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
            Reallouer l&apos;epargne
          </h2>

          {/* Source */}
          <div style={{
            padding: '12px 16px', marginBottom: '12px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--surface-inset)',
          }}>
            <p style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: '2px' }}>
              Depuis
            </p>
            <p style={{ fontSize: 'var(--text-sm)', fontWeight: 650, color: 'var(--text-primary)' }}>
              {source.name}
            </p>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: '2px' }}>
              Disponible : <span style={{ color: 'var(--positive)', fontWeight: 700 }}>{formatCAD(sourceBalance)}</span>
            </p>
          </div>

          {/* Arrow */}
          <div style={{ textAlign: 'center', margin: '4px 0', color: 'var(--text-tertiary)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <polyline points="19 12 12 19 5 12" />
            </svg>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Destination */}
            <div>
              <label className="field-label">Vers</label>
              <select
                value={destId}
                onChange={(e) => setDestId(e.target.value)}
                className="input-field"
              >
                {destinations.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({formatCAD(Number(p.saved_amount ?? 0))})
                  </option>
                ))}
              </select>
            </div>

            {/* Amount */}
            <div>
              <label className="field-label">Montant a transferer ($)</label>
              <input
                type="number" min="0" step="0.01"
                max={sourceBalance}
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="input-field"
                style={{ fontVariantNumeric: 'tabular-nums' }}
                autoFocus
              />
              {sourceBalance > 0 && (
                <button
                  type="button"
                  onClick={() => setAmount(String(sourceBalance))}
                  style={{
                    marginTop: '6px', padding: '4px 10px',
                    fontSize: 'var(--text-xs)', fontWeight: 600,
                    color: 'var(--accent)', background: 'var(--accent-subtle)',
                    border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                  }}
                >
                  Tout transferer ({formatCAD(sourceBalance)})
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !destId || parseFloat(amount) <= 0 || parseFloat(amount) > sourceBalance}
              className="btn-primary"
              style={{ width: '100%', padding: '16px', fontSize: 'var(--text-base)', opacity: loading ? 0.5 : 1 }}
            >
              {loading ? 'Transfert...' : 'Transferer'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
