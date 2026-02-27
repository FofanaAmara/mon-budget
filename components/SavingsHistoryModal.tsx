'use client';

import { useEffect, useState } from 'react';
import { formatCAD } from '@/lib/utils';
import type { SavingsContribution } from '@/lib/types';

type Props = {
  expenseId: string;
  projectName: string;
  currentSaved: number;
  targetAmount: number | null;
  onClose: () => void;
};

function formatContribDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function SavingsHistoryModal({ expenseId, projectName, currentSaved, targetAmount, onClose }: Props) {
  const [contributions, setContributions] = useState<SavingsContribution[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const { getSavingsContributions } = await import('@/lib/actions/expenses');
      const data = await getSavingsContributions(expenseId);
      if (!cancelled) {
        setContributions(data);
        setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [expenseId]);

  return (
    <div className="sheet-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div style={{ padding: '8px 24px 32px' }}>
          {/* Header */}
          <div className="flex items-center justify-between" style={{ marginBottom: '20px' }}>
            <h2 style={{
              fontSize: 'var(--text-lg)', fontWeight: 700,
              color: 'var(--text-primary)',
              letterSpacing: 'var(--tracking-tight)',
            }}>
              Historique
            </h2>
            <button
              onClick={onClose}
              className="icon-btn"
              aria-label="Fermer"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Summary */}
          <div style={{
            padding: '14px 16px', marginBottom: '20px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--surface-inset)',
          }}>
            <p style={{ fontSize: 'var(--text-sm)', fontWeight: 650, color: 'var(--text-primary)' }}>
              {projectName}
            </p>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: '4px' }}>
              Total : <span style={{ color: 'var(--positive)', fontWeight: 700 }}>{formatCAD(currentSaved)}</span>
              {targetAmount !== null && (
                <span> / {formatCAD(targetAmount)} ({Math.round((currentSaved / targetAmount) * 100)}%)</span>
              )}
            </p>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: '2px' }}>
              {contributions.length} contribution{contributions.length !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Contributions list */}
          {loading ? (
            <div style={{ padding: '40px 0', textAlign: 'center' }}>
              <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)' }}>Chargement...</p>
            </div>
          ) : contributions.length === 0 ? (
            <div style={{ padding: '40px 0', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: '8px', opacity: 0.5 }}>📭</div>
              <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)', fontWeight: 500 }}>
                Aucune contribution
              </p>
            </div>
          ) : (
            <div className="card" style={{ overflow: 'hidden', maxHeight: '400px', overflowY: 'auto' }}>
              {contributions.map((c, i) => (
                <div key={c.id}>
                  {i > 0 && <div className="divider" style={{ marginLeft: '20px', marginRight: '20px' }} />}
                  <div className="flex items-center" style={{ gap: '12px', padding: '12px 20px' }}>
                    <div style={{
                      width: '28px', height: '28px', borderRadius: 'var(--radius-full)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: 'var(--positive-subtle)', flexShrink: 0,
                    }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--positive)" strokeWidth="3" strokeLinecap="round">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 'var(--text-sm)' }}>
                        +{formatCAD(Number(c.amount))}
                      </p>
                      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: '1px' }}>
                        {formatContribDate(c.created_at)}
                        {c.note && <span> · {c.note}</span>}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
