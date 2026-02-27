'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createCard, updateCard, deleteCard } from '@/lib/actions/cards';
import type { Card } from '@/lib/types';
import Link from 'next/link';

const COLORS = ['#3D3BF3', '#1A7F5A', '#C7382D', '#C27815', '#6366F1', '#EC4899'];

type ModalState = { mode: 'closed' } | { mode: 'create' } | { mode: 'edit'; card: Card };

const inputStyle = {
  width: '100%',
  border: '1.5px solid var(--border-default)',
  borderRadius: 'var(--radius-md)' as string,
  padding: '11px 13px',
  fontSize: '14px',
  color: 'var(--text-primary)',
  background: 'var(--surface-inset)',
  outline: 'none',
  transition: 'border-color 150ms ease-out',
};

const labelStyle = {
  fontSize: '11px',
  fontWeight: 600,
  color: 'var(--text-tertiary)',
  letterSpacing: '0.06em',
  textTransform: 'uppercase' as const,
  display: 'block',
  marginBottom: '6px',
};

export default function CartesClient({ cards: initial }: { cards: Card[] }) {
  const router = useRouter();
  const [modal, setModal] = useState<ModalState>({ mode: 'closed' });
  const [deleting, setDeleting] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [name, setName]         = useState('');
  const [lastFour, setLastFour] = useState('');
  const [bank, setBank]         = useState('');
  const [color, setColor]       = useState(COLORS[0]);

  function openCreate() {
    setName(''); setLastFour(''); setBank(''); setColor(COLORS[0]);
    setModal({ mode: 'create' });
  }

  function openEdit(card: Card) {
    setName(card.name); setLastFour(card.last_four ?? ''); setBank(card.bank ?? ''); setColor(card.color);
    setModal({ mode: 'edit', card });
  }

  function handleSave() {
    if (!name.trim()) return;
    startTransition(async () => {
      if (modal.mode === 'create') {
        await createCard({ name: name.trim(), last_four: lastFour || undefined, bank: bank || undefined, color });
      } else if (modal.mode === 'edit') {
        await updateCard(modal.card.id, { name: name.trim(), last_four: lastFour || undefined, bank: bank || undefined, color });
      }
      router.refresh();
      setModal({ mode: 'closed' });
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteCard(id);
      setDeleting(null);
      router.refresh();
    });
  }

  return (
    <div className="px-4 pt-8 pb-32 min-h-screen" style={{ background: 'var(--surface-ground)' }}>
      <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '20px', letterSpacing: '-0.02em' }}>
        Cartes
      </h1>

      {initial.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div
            className="w-12 h-12 rounded-[var(--radius-md)] flex items-center justify-center mb-3"
            style={{ background: 'var(--accent-subtle)' }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="5" width="20" height="14" rx="3" />
              <path d="M2 10h20" />
            </svg>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>Aucune carte — appuyez sur + pour ajouter</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {initial.map((card) => (
            <li
              key={card.id}
              className="flex items-center gap-3"
              style={{
                background: 'var(--surface-raised)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-lg)',
                padding: '12px 14px',
                boxShadow: 'var(--shadow-xs)',
              }}
            >
              {/* Colored left accent */}
              <div
                className="w-0.5 h-8 rounded-full flex-shrink-0"
                style={{ backgroundColor: card.color }}
              />

              {/* Card icon */}
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
                <rect x="2" y="5" width="20" height="14" rx="3" />
                <path d="M2 10h20" />
              </svg>

              {/* Info */}
              <Link href={`/cartes/${card.id}`} className="flex-1 min-w-0 block">
                <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }} className="truncate">{card.name}</p>
                {(card.last_four || card.bank) && (
                  <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '1px' }}>
                    {card.last_four ? `•••• ${card.last_four}` : ''}
                    {card.last_four && card.bank ? ' · ' : ''}
                    {card.bank ?? ''}
                  </p>
                )}
              </Link>

              {/* Actions */}
              {deleting === card.id ? (
                <div className="flex items-center gap-2" style={{ fontSize: '12px' }}>
                  <span style={{ color: 'var(--text-tertiary)' }}>Supprimer ?</span>
                  <button onClick={() => handleDelete(card.id)} disabled={isPending} style={{ color: 'var(--negative)', fontWeight: 600 }}>Oui</button>
                  <button onClick={() => setDeleting(null)} style={{ color: 'var(--text-tertiary)' }}>Non</button>
                </div>
              ) : (
                <div className="flex items-center gap-0.5">
                  <button
                    onClick={() => openEdit(card)}
                    className="p-2 rounded-[var(--radius-sm)] transition-colors"
                    style={{ color: 'var(--text-tertiary)' }}
                    aria-label="Modifier"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setDeleting(card.id)}
                    className="p-2 rounded-[var(--radius-sm)] transition-colors"
                    style={{ color: 'var(--text-tertiary)' }}
                    aria-label="Supprimer"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                      <path d="M10 11v6M14 11v6" />
                      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                    </svg>
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* FAB */}
      <button
        onClick={openCreate}
        className="fixed bottom-20 right-4 w-14 h-14 rounded-full flex items-center justify-center text-[var(--text-inverted)] transition-all active:scale-95"
        style={{ background: 'var(--text-primary)', boxShadow: 'var(--shadow-fab)' }}
        aria-label="Nouvelle carte"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>

      {/* Modal */}
      {modal.mode !== 'closed' && (
        <div
          className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center"
          style={{ background: 'var(--surface-overlay)' }}
          onClick={(e) => e.target === e.currentTarget && setModal({ mode: 'closed' })}
        >
          <div
            className="w-full sm:max-w-sm"
            style={{
              background: 'var(--surface-raised)',
              borderRadius: 'var(--radius-sheet) var(--radius-sheet) 0 0',
              boxShadow: 'var(--shadow-xl)',
            }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1 sm:hidden">
              <div className="w-9 h-1 rounded-full" style={{ background: 'var(--border-strong)' }} />
            </div>

            <div className="px-6 pt-4 pb-8 space-y-4">
              <h2 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                {modal.mode === 'create' ? 'Nouvelle carte' : 'Modifier'}
              </h2>

              <div>
                <label style={labelStyle}>Nom *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Visa principale"
                  style={inputStyle}
                  onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
                  onBlur={(e) => (e.target.style.borderColor = 'var(--border-default)')}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label style={labelStyle}>4 derniers chiffres</label>
                  <input
                    type="text"
                    value={lastFour}
                    onChange={(e) => setLastFour(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="4532"
                    maxLength={4}
                    style={inputStyle}
                    onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
                    onBlur={(e) => (e.target.style.borderColor = 'var(--border-default)')}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Banque</label>
                  <input
                    type="text"
                    value={bank}
                    onChange={(e) => setBank(e.target.value)}
                    placeholder="Desjardins"
                    style={inputStyle}
                    onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
                    onBlur={(e) => (e.target.style.borderColor = 'var(--border-default)')}
                  />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Couleur</label>
                <div className="flex gap-2">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setColor(c)}
                      className="w-7 h-7 rounded-full transition-transform"
                      style={{
                        backgroundColor: c,
                        transform: color === c ? 'scale(1.25)' : 'scale(1)',
                        outline: color === c ? `2px solid ${c}` : 'none',
                        outlineOffset: '2px',
                      }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => setModal({ mode: 'closed' })}
                  className="flex-1 font-medium"
                  style={{
                    border: '1.5px solid var(--border-default)',
                    color: 'var(--text-secondary)',
                    borderRadius: 'var(--radius-md)',
                    padding: '12px',
                    fontSize: '14px',
                  }}
                >
                  Annuler
                </button>
                <button
                  onClick={handleSave}
                  disabled={isPending || !name.trim()}
                  className="flex-1 font-semibold transition-all active:scale-[0.98]"
                  style={{
                    background: 'var(--text-primary)',
                    color: 'var(--text-inverted)',
                    borderRadius: 'var(--radius-md)',
                    padding: '12px',
                    fontSize: '14px',
                    opacity: isPending || !name.trim() ? 0.4 : 1,
                  }}
                >
                  {isPending ? 'Enregistrement…' : 'Sauvegarder'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
