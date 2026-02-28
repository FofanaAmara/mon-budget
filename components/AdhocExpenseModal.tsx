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
  const [mode, setMode] = useState<'upcoming' | 'paid'>('paid');
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
      setError('Erreur lors de la creation');
      setLoading(false);
    }
  }

  return (
    <div className="sheet-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div style={{ padding: '8px 24px 40px' }}>
          <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '20px', letterSpacing: 'var(--tracking-tight)' }}>
            Depense imprevue
          </h2>

          {/* Mode toggle */}
          <div style={{
            display: 'flex', gap: '4px', padding: '4px',
            background: 'var(--surface-inset)', borderRadius: 'var(--radius-md)',
            marginBottom: '20px',
          }}>
            <button
              type="button"
              onClick={() => setMode('paid')}
              style={{
                flex: 1, padding: '10px 12px', borderRadius: 'var(--radius-sm)',
                border: 'none', cursor: 'pointer',
                fontSize: 'var(--text-sm)', fontWeight: 600,
                background: mode === 'paid' ? 'var(--surface-card)' : 'transparent',
                color: mode === 'paid' ? 'var(--text-primary)' : 'var(--text-tertiary)',
                boxShadow: mode === 'paid' ? 'var(--shadow-sm)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              Deja payee
            </button>
            <button
              type="button"
              onClick={() => setMode('upcoming')}
              style={{
                flex: 1, padding: '10px 12px', borderRadius: 'var(--radius-sm)',
                border: 'none', cursor: 'pointer',
                fontSize: 'var(--text-sm)', fontWeight: 600,
                background: mode === 'upcoming' ? 'var(--surface-card)' : 'transparent',
                color: mode === 'upcoming' ? 'var(--text-primary)' : 'var(--text-tertiary)',
                boxShadow: mode === 'upcoming' ? 'var(--shadow-sm)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              A venir
            </button>
          </div>

          {/* Hint */}
          <p style={{
            fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)',
            marginBottom: '16px', lineHeight: 1.5,
            padding: '8px 12px', borderRadius: 'var(--radius-sm)',
            background: 'var(--surface-inset)',
          }}>
            {mode === 'paid'
              ? 'Logguez une depense imprevue deja effectuee. Elle sera marquee comme payee directement.'
              : 'Ajoutez une depense imprevue a venir avec sa date previsionnelle.'}
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label className="field-label">Description</label>
              <input
                type="text" placeholder="Ex: Changement d'huile, Reparation..."
                value={name} onChange={(e) => setName(e.target.value)}
                className="input-field"
                autoFocus
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

            {/* Date — optional in both modes */}
            <div>
              <label className="field-label">
                {mode === 'paid' ? 'Date de la depense' : 'Date prevue'}
                <span style={{ fontWeight: 400, color: 'var(--text-tertiary)', marginLeft: '4px' }}>(optionnel)</span>
              </label>
              <input
                type="date"
                value={dueDate} onChange={(e) => setDueDate(e.target.value)}
                className="input-field"
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

            {cards.length > 0 && (
              <div>
                <label className="field-label">
                  Carte
                  <span style={{ fontWeight: 400, color: 'var(--text-tertiary)', marginLeft: '4px' }}>(optionnel)</span>
                </label>
                <select value={cardId} onChange={(e) => setCardId(e.target.value)} className="input-field">
                  <option value="">Aucune carte</option>
                  {cards.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}{c.last_four ? ` .... ${c.last_four}` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

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
              {loading ? 'Ajout...' : mode === 'paid' ? 'Logguer cette depense' : 'Ajouter cette depense'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
