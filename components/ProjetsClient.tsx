'use client';

import { useState } from 'react';
import { updateSavedAmount, deleteExpense } from '@/lib/actions/expenses';
import { formatCAD, calcMonthlySuggested, formatDate } from '@/lib/utils';
import type { Expense } from '@/lib/types';

type Props = {
  projets: Expense[];
};

export default function ProjetsClient({ projets }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  function startEdit(projet: Expense) {
    setEditingId(projet.id);
    setEditValue(projet.saved_amount?.toString() ?? '0');
  }

  async function saveEdit(id: string) {
    await updateSavedAmount(id, parseFloat(editValue) || 0);
    setEditingId(null);
  }

  async function handleDelete(id: string) {
    if (confirm('Supprimer ce projet ?')) {
      await deleteExpense(id);
    }
  }

  if (projets.length === 0) {
    return (
      <div className="card">
        <div className="empty-state">
          <div className="empty-state-icon">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v8M8 12h8" />
            </svg>
          </div>
          <p className="empty-state-text">Aucun projet planifie</p>
          <p className="empty-state-hint">
            Creez une depense de type &quot;Planifie&quot; pour suivre vos objectifs d&apos;epargne
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {projets.map((projet) => {
        const target = Number(projet.target_amount ?? projet.amount);
        const saved = Number(projet.saved_amount ?? 0);
        const progress = target > 0 ? Math.min((saved / target) * 100, 100) : 0;
        const monthlySuggested =
          projet.target_date
            ? calcMonthlySuggested(target, saved, projet.target_date)
            : null;

        return (
          <div key={projet.id} className="card" style={{ padding: '18px 20px' }}>
            {/* Header */}
            <div className="flex items-start justify-between" style={{ marginBottom: '14px' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="flex items-center" style={{ gap: '10px' }}>
                  <div style={{
                    width: '32px', height: '32px',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'var(--accent-subtle)',
                    flexShrink: 0,
                  }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 8v8M8 12h8" />
                    </svg>
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{
                      fontWeight: 650, color: 'var(--text-primary)',
                      fontSize: 'var(--text-sm)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {projet.name}
                    </p>
                    {projet.section && (
                      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                        {projet.section.name}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center" style={{ gap: '2px', marginLeft: '8px', flexShrink: 0 }}>
                <button
                  onClick={() => startEdit(projet)}
                  className="icon-btn"
                  aria-label="Mettre a jour l'epargne"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z" />
                  </svg>
                </button>
                <button
                  onClick={() => handleDelete(projet.id)}
                  className="icon-btn icon-btn-danger"
                  aria-label="Supprimer"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                    <path d="M10 11v6M14 11v6" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Progress bar */}
            <div className="progress-track" style={{ height: '6px', marginBottom: '10px' }}>
              <div
                className="progress-fill"
                style={{
                  width: `${Math.max(progress, 2)}%`,
                  background: progress >= 100 ? 'var(--positive)' : 'var(--accent)',
                }}
              />
            </div>

            {/* Bottom info */}
            <div className="flex justify-between items-end">
              <div>
                {editingId === projet.id ? (
                  <div className="flex items-center" style={{ gap: '8px' }}>
                    <input
                      type="number"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="input-field"
                      style={{ width: '110px', padding: '7px 10px' }}
                      min="0"
                      step="0.01"
                      autoFocus
                    />
                    <button
                      onClick={() => saveEdit(projet.id)}
                      className="btn-action btn-action-accent"
                      style={{ padding: '7px 12px' }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      style={{
                        color: 'var(--text-tertiary)',
                        fontSize: 'var(--text-xs)',
                        padding: '4px',
                        background: 'none', border: 'none', cursor: 'pointer',
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <p style={{ fontSize: 'var(--text-sm)' }}>
                    <span className="amount">{formatCAD(saved)}</span>
                    <span style={{ fontWeight: 400, color: 'var(--text-tertiary)' }}> / {formatCAD(target)}</span>
                  </p>
                )}
                <p style={{
                  fontSize: 'var(--text-xs)',
                  color: 'var(--text-tertiary)',
                  marginTop: '2px',
                }}>
                  {Math.round(progress)}% atteint
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                {projet.target_date && (
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                    Cible : {formatDate(projet.target_date)}
                  </p>
                )}
                {monthlySuggested !== null && monthlySuggested > 0 && (
                  <p style={{
                    fontSize: 'var(--text-xs)',
                    fontWeight: 650,
                    color: 'var(--accent)',
                    marginTop: '2px',
                  }}>
                    {formatCAD(monthlySuggested)}/mois suggere
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
