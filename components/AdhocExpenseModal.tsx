'use client';

import { useState } from 'react';
import type { Section, Card } from '@/lib/types';

type Props = {
  sections: Section[];
  cards: Card[];
  month: string;
  onClose: () => void;
};

export default function AdhocExpenseModal({ sections, cards, month, onClose }: Props) {
  const [mode, setMode] = useState<'upcoming' | 'paid'>('upcoming');
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [sectionId, setSectionId] = useState(sections[0]?.id ?? '');
  const [dueDate, setDueDate] = useState('');
  const [cardId, setCardId] = useState('');
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
      await createAdhocExpense(
        name.trim(),
        parseFloat(amount),
        sectionId,
        month,
        mode === 'paid',
        dueDate || undefined,
        cardId || undefined,
      );
      onClose();
    } catch {
      setError('Erreur lors de la création');
      setLoading(false);
    }
  }

  const selectStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 40px 12px 14px',
    border: '1px solid var(--slate-200)',
    borderRadius: 'var(--radius-sm)',
    fontFamily: 'var(--font)',
    fontSize: '15px', fontWeight: 500,
    color: 'var(--slate-900)', background: `var(--white) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2394A3B8' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C%2Fsvg%3E") right 14px center no-repeat`,
    WebkitAppearance: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    outline: 'none',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 14px',
    border: '1px solid var(--slate-200)',
    borderRadius: 'var(--radius-sm)',
    fontFamily: 'var(--font)', fontSize: '15px', fontWeight: 500,
    color: 'var(--slate-900)', background: 'var(--white)',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    outline: 'none', WebkitAppearance: 'none',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '11px', fontWeight: 700,
    letterSpacing: '0.06em', textTransform: 'uppercase',
    color: 'var(--slate-400)', marginBottom: '6px',
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(15, 23, 42, 0.5)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          zIndex: 200,
        }}
      />

      {/* Sheet */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          background: 'var(--white)',
          borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0',
          zIndex: 210,
          maxHeight: '92dvh',
          overflowY: 'auto',
          overscrollBehavior: 'contain',
          boxShadow: '0 -8px 32px rgba(15, 23, 42, 0.15)',
          paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
        }}
      >
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
          <div style={{ width: '36px', height: '4px', borderRadius: '2px', background: 'var(--slate-300)' }} />
        </div>

        <div style={{ padding: '0 20px 8px' }}>
          <h3 style={{
            fontSize: '18px', fontWeight: 700,
            color: 'var(--slate-900)', letterSpacing: '-0.02em',
            marginBottom: '20px', paddingBottom: '12px',
            borderBottom: '1px solid var(--slate-100)',
          }}>
            Nouvelle dépense
          </h3>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* Name */}
            <div>
              <label style={labelStyle}>Nom de la dépense</label>
              <input
                type="text"
                placeholder="Ex: Épicerie, réparation auto..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={inputStyle}
                autoFocus
                onFocus={(e) => { e.target.style.borderColor = 'var(--teal-700)'; e.target.style.boxShadow = '0 0 0 3px rgba(15, 118, 110, 0.08)'; }}
                onBlur={(e) => { e.target.style.borderColor = 'var(--slate-200)'; e.target.style.boxShadow = 'none'; }}
              />
            </div>

            {/* Monumental amount input */}
            <div>
              <label style={labelStyle}>Montant</label>
              <input
                type="number" min="0" step="0.01"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                style={{
                  ...inputStyle,
                  fontSize: '28px', fontWeight: 800,
                  letterSpacing: '-0.03em',
                  fontVariantNumeric: 'tabular-nums',
                  textAlign: 'center',
                  padding: '16px',
                }}
                onFocus={(e) => { e.target.style.borderColor = 'var(--teal-700)'; e.target.style.boxShadow = '0 0 0 3px rgba(15, 118, 110, 0.08)'; }}
                onBlur={(e) => { e.target.style.borderColor = 'var(--slate-200)'; e.target.style.boxShadow = 'none'; }}
              />
            </div>

            {/* Section + Card — side by side */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={labelStyle}>Section</label>
                <select
                  value={sectionId}
                  onChange={(e) => setSectionId(e.target.value)}
                  style={selectStyle}
                  onFocus={(e) => { e.target.style.borderColor = 'var(--teal-700)'; e.target.style.boxShadow = '0 0 0 3px rgba(15, 118, 110, 0.08)'; }}
                  onBlur={(e) => { e.target.style.borderColor = 'var(--slate-200)'; e.target.style.boxShadow = 'none'; }}
                >
                  {sections.map((s) => (
                    <option key={s.id} value={s.id}>{s.icon} {s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Carte</label>
                <select
                  value={cardId}
                  onChange={(e) => setCardId(e.target.value)}
                  style={selectStyle}
                  onFocus={(e) => { e.target.style.borderColor = 'var(--teal-700)'; e.target.style.boxShadow = '0 0 0 3px rgba(15, 118, 110, 0.08)'; }}
                  onBlur={(e) => { e.target.style.borderColor = 'var(--slate-200)'; e.target.style.boxShadow = 'none'; }}
                >
                  <option value="">Choisir...</option>
                  {cards.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}{c.last_four ? ` ****${c.last_four}` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Date — optional */}
            <div>
              <label style={labelStyle}>
                {mode === 'paid' ? 'Date de la dépense' : 'Date prévue'}
                <span style={{ fontWeight: 400, color: 'var(--slate-400)', marginLeft: '4px', textTransform: 'none', letterSpacing: 0, fontSize: '11px' }}>(optionnel)</span>
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                style={inputStyle}
                onFocus={(e) => { e.target.style.borderColor = 'var(--teal-700)'; e.target.style.boxShadow = '0 0 0 3px rgba(15, 118, 110, 0.08)'; }}
                onBlur={(e) => { e.target.style.borderColor = 'var(--slate-200)'; e.target.style.boxShadow = 'none'; }}
              />
            </div>

            {/* Status choice */}
            <div>
              <label style={labelStyle}>Statut</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setMode('upcoming')}
                  style={{
                    flex: 1, padding: '10px',
                    border: `1.5px solid ${mode === 'upcoming' ? 'var(--teal-700)' : 'var(--slate-200)'}`,
                    background: mode === 'upcoming' ? 'var(--teal-50)' : 'var(--white)',
                    borderRadius: 'var(--radius-sm)',
                    fontFamily: 'var(--font)', fontSize: '13px', fontWeight: 600,
                    color: mode === 'upcoming' ? 'var(--teal-700)' : 'var(--slate-500)',
                    cursor: 'pointer', textAlign: 'center',
                    transition: 'all 0.2s ease',
                  }}
                >
                  À venir
                </button>
                <button
                  type="button"
                  onClick={() => setMode('paid')}
                  style={{
                    flex: 1, padding: '10px',
                    border: `1.5px solid ${mode === 'paid' ? 'var(--teal-700)' : 'var(--slate-200)'}`,
                    background: mode === 'paid' ? 'var(--teal-50)' : 'var(--white)',
                    borderRadius: 'var(--radius-sm)',
                    fontFamily: 'var(--font)', fontSize: '13px', fontWeight: 600,
                    color: mode === 'paid' ? 'var(--teal-700)' : 'var(--slate-500)',
                    cursor: 'pointer', textAlign: 'center',
                    transition: 'all 0.2s ease',
                  }}
                >
                  Déjà payée
                </button>
              </div>
            </div>

            {error && (
              <p style={{
                fontSize: '14px', color: 'var(--error)',
                background: 'var(--error-light)', padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
              }}>
                {error}
              </p>
            )}
          </form>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '10px', padding: '16px 20px 4px' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              flex: 1, padding: '14px 20px',
              border: '1px solid var(--slate-200)', background: 'var(--white)',
              borderRadius: 'var(--radius-md)', fontFamily: 'var(--font)',
              fontSize: '15px', fontWeight: 600, color: 'var(--slate-700)',
              cursor: 'pointer', transition: 'all 0.2s ease', letterSpacing: '-0.01em',
            }}
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); handleSubmit(e as unknown as React.FormEvent); }}
            disabled={loading}
            style={{
              flex: 1.4, padding: '14px 24px',
              border: 'none', background: 'var(--teal-700)',
              borderRadius: 'var(--radius-md)', fontFamily: 'var(--font)',
              fontSize: '15px', fontWeight: 700, color: 'var(--white)',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.5 : 1,
              transition: 'all 0.2s ease', letterSpacing: '-0.01em',
            }}
          >
            {loading ? 'Ajout...' : 'Ajouter'}
          </button>
        </div>
      </div>
    </>
  );
}
