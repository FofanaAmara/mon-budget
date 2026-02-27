'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createCard, updateCard, deleteCard } from '@/lib/actions/cards';
import type { Card } from '@/lib/types';
import Link from 'next/link';

const COLORS = ['#3D3BF3', '#1A7F5A', '#C7382D', '#C27815', '#6366F1', '#EC4899'];

type ModalState = { mode: 'closed' } | { mode: 'create' } | { mode: 'edit'; card: Card };

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
    <div style={{ padding: '36px 20px 96px', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{
          fontSize: 'var(--text-xl)',
          fontWeight: 750,
          color: 'var(--text-primary)',
          letterSpacing: 'var(--tracking-tight)',
          lineHeight: 'var(--leading-tight)',
        }}>
          Cartes
        </h1>
        <p style={{
          fontSize: 'var(--text-xs)',
          color: 'var(--text-tertiary)',
          marginTop: '4px',
          fontWeight: 500,
        }}>
          {initial.length} carte{initial.length !== 1 ? 's' : ''} enregistree{initial.length !== 1 ? 's' : ''}
        </p>
      </div>

      {initial.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="5" width="20" height="14" rx="3" />
                <path d="M2 10h20" />
              </svg>
            </div>
            <p className="empty-state-text">Aucune carte</p>
            <p className="empty-state-hint">Appuyez sur + pour ajouter une carte</p>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {initial.map((card) => (
            <div
              key={card.id}
              className="card card-press"
              style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '14px 18px',
              }}
            >
              {/* Colored left bar */}
              <div style={{
                width: '3px', height: '32px',
                borderRadius: 'var(--radius-full)',
                background: card.color,
                flexShrink: 0,
              }} />

              {/* Icon */}
              <div style={{
                width: '36px', height: '36px',
                borderRadius: 'var(--radius-md)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'var(--surface-sunken)',
                flexShrink: 0,
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="5" width="20" height="14" rx="3" />
                  <path d="M2 10h20" />
                </svg>
              </div>

              {/* Info — clickable to card detail */}
              <Link href={`/cartes/${card.id}`} style={{ flex: 1, minWidth: 0, display: 'block', textDecoration: 'none' }}>
                <p style={{
                  fontSize: 'var(--text-sm)', fontWeight: 550,
                  color: 'var(--text-primary)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {card.name}
                </p>
                {(card.last_four || card.bank) && (
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                    {card.last_four ? `.... ${card.last_four}` : ''}{card.last_four && card.bank ? ' · ' : ''}{card.bank ?? ''}
                  </p>
                )}
              </Link>

              {/* Actions */}
              {deleting === card.id ? (
                <div className="confirm-inline">
                  <span style={{ color: 'var(--text-tertiary)' }}>Supprimer ?</span>
                  <button onClick={() => handleDelete(card.id)} disabled={isPending} className="confirm-yes">Oui</button>
                  <span className="confirm-sep">|</span>
                  <button onClick={() => setDeleting(null)} className="confirm-no">Non</button>
                </div>
              ) : (
                <div className="flex items-center" style={{ gap: '2px' }}>
                  <button onClick={() => openEdit(card)} className="icon-btn" aria-label="Modifier">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z" />
                    </svg>
                  </button>
                  <button onClick={() => setDeleting(card.id)} className="icon-btn icon-btn-danger" aria-label="Supprimer">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                      <path d="M10 11v6M14 11v6" />
                      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* FAB */}
      <button
        onClick={openCreate}
        className="fab"
        aria-label="Nouvelle carte"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>

      {/* Modal */}
      {modal.mode !== 'closed' && (
        <div
          className="sheet-backdrop"
          onClick={(e) => e.target === e.currentTarget && setModal({ mode: 'closed' })}
        >
          <div className="sheet">
            <div className="sheet-handle" />

            <div style={{ padding: '8px 24px 32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <h2 style={{
                fontSize: 'var(--text-lg)',
                fontWeight: 700,
                color: 'var(--text-primary)',
                letterSpacing: 'var(--tracking-tight)',
              }}>
                {modal.mode === 'create' ? 'Nouvelle carte' : 'Modifier'}
              </h2>

              <div>
                <label className="field-label">Nom *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Visa principale"
                  className="input-field"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="field-label">4 derniers chiffres</label>
                  <input
                    type="text"
                    value={lastFour}
                    onChange={(e) => setLastFour(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="4532"
                    maxLength={4}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="field-label">Banque</label>
                  <input
                    type="text"
                    value={bank}
                    onChange={(e) => setBank(e.target.value)}
                    placeholder="Desjardins"
                    className="input-field"
                  />
                </div>
              </div>

              <div>
                <label className="field-label">Couleur</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className="color-swatch"
                      data-active={color === c}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex" style={{ gap: '12px', paddingTop: '4px' }}>
                <button
                  type="button"
                  onClick={() => setModal({ mode: 'closed' })}
                  className="btn-secondary"
                  style={{ flex: 1, padding: '12px 20px' }}
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isPending || !name.trim()}
                  className="btn-primary"
                  style={{ flex: 1, padding: '12px 20px' }}
                >
                  {isPending ? 'Enregistrement...' : 'Sauvegarder'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
