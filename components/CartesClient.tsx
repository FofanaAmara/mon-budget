'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createCard, updateCard, deleteCard } from '@/lib/actions/cards';
import type { Card } from '@/lib/types';
import Link from 'next/link';

/* ─── Constants ──────────────────────────────────────── */

const CARD_COLORS = [
  { key: 'teal',    value: '#0F766E', gradient: 'linear-gradient(145deg, #0F766E 0%, #115E59 100%)' },
  { key: 'slate',   value: '#334155', gradient: 'linear-gradient(145deg, #334155 0%, #1E293B 100%)' },
  { key: 'blue',    value: '#2563EB', gradient: 'linear-gradient(145deg, #2563EB 0%, #1D4ED8 100%)' },
  { key: 'purple',  value: '#7C3AED', gradient: 'linear-gradient(145deg, #7C3AED 0%, #6D28D9 100%)' },
  { key: 'amber',   value: '#D97706', gradient: 'linear-gradient(145deg, #D97706 0%, #B45309 100%)' },
  { key: 'rose',    value: '#E11D48', gradient: 'linear-gradient(145deg, #E11D48 0%, #BE123C 100%)' },
  { key: 'emerald', value: '#059669', gradient: 'linear-gradient(145deg, #059669 0%, #047857 100%)' },
  { key: 'orange',  value: '#EA580C', gradient: 'linear-gradient(145deg, #EA580C 0%, #C2410C 100%)' },
];

function getGradient(colorValue: string): string {
  const found = CARD_COLORS.find((c) => c.value === colorValue);
  if (found) return found.gradient;
  // Fallback: derive gradient from raw color value
  return `linear-gradient(145deg, ${colorValue} 0%, ${colorValue}CC 100%)`;
}

/* ─── Types ──────────────────────────────────────────── */

type ModalState = { mode: 'closed' } | { mode: 'create' } | { mode: 'edit'; card: Card };

/* ─── Bank Card Visual ───────────────────────────────── */

function BankCardVisual({
  name, lastFour, bank, color,
  mini = false,
}: {
  name: string;
  lastFour?: string;
  bank?: string;
  color: string;
  mini?: boolean;
}) {
  const gradient = getGradient(color);
  return (
    <div
      style={{
        position: 'relative',
        borderRadius: mini ? 'var(--radius-md)' : 'var(--radius-lg)',
        padding: mini ? '18px 16px 14px' : '22px 20px 18px',
        color: 'white',
        overflow: 'hidden',
        minHeight: mini ? '100px' : '130px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        background: gradient,
      }}
    >
      {/* Texture overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: `
          radial-gradient(circle at 80% 20%, rgba(255,255,255,0.12) 0%, transparent 50%),
          radial-gradient(circle at 20% 80%, rgba(255,255,255,0.06) 0%, transparent 40%)
        `,
        pointerEvents: 'none',
      }} />
      {/* Chip decoration */}
      <div style={{
        position: 'absolute',
        top: mini ? '18px' : '22px',
        right: mini ? '16px' : '20px',
        width: mini ? '30px' : '36px',
        height: mini ? '22px' : '26px',
        borderRadius: '4px',
        background: 'linear-gradient(135deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.1) 100%)',
        border: '1px solid rgba(255,255,255,0.2)',
      }} />

      {/* Top: name */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <p style={{
          fontSize: mini ? '14px' : '16px',
          fontWeight: 700,
          letterSpacing: '-0.01em',
          lineHeight: 1.2,
        }}>
          {name || 'Ma carte'}
        </p>
      </div>

      {/* Bottom: digits + bank */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <p style={{
          fontSize: mini ? '15px' : '18px',
          fontWeight: 800,
          letterSpacing: '0.12em',
          fontVariantNumeric: 'tabular-nums',
          marginBottom: '6px',
        }}>
          <span style={{ fontSize: mini ? '12px' : '14px', opacity: 0.6, letterSpacing: '0.04em', verticalAlign: 'middle' }}>•••• </span>
          {lastFour || '0000'}
        </p>
        {bank && (
          <p style={{
            fontSize: mini ? '10px' : '11px',
            fontWeight: 600,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            opacity: 0.7,
          }}>
            {bank}
          </p>
        )}
      </div>
    </div>
  );
}

/* ─── Component ──────────────────────────────────────── */

export default function CartesClient({ cards: initial }: { cards: Card[] }) {
  const router = useRouter();
  const [modal, setModal]       = useState<ModalState>({ mode: 'closed' });
  const [deleting, setDeleting] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [name, setName]         = useState('');
  const [lastFour, setLastFour] = useState('');
  const [bank, setBank]         = useState('');
  const [color, setColor]       = useState(CARD_COLORS[0].value);

  /* ── Handlers ── */

  function openCreate() {
    setName(''); setLastFour(''); setBank(''); setColor(CARD_COLORS[0].value);
    setModal({ mode: 'create' });
  }

  function openEdit(card: Card) {
    setName(card.name);
    setLastFour(card.last_four ?? '');
    setBank(card.bank ?? '');
    setColor(card.color);
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

  /* ─── Render ─────────────────────────────────────────── */

  return (
    <div style={{ paddingBottom: '120px' }}>

      {/* ── Monument: card count ── */}
      <div style={{
        padding: '28px 20px 20px',
        textAlign: 'center',
        position: 'relative',
      }}>
        <p style={{
          fontSize: '12px',
          fontWeight: 700,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'var(--accent)',
          marginBottom: '8px',
        }}>
          MES CARTES
        </p>
        <div>
          <span style={{
            fontSize: 'clamp(3.5rem, 14vw, 6rem)',
            fontWeight: 800,
            letterSpacing: '-0.04em',
            lineHeight: 1,
            color: 'var(--text-primary)',
          }}>
            {initial.length}
          </span>
          <span style={{
            fontSize: 'clamp(1.2rem, 4vw, 1.5rem)',
            fontWeight: 600,
            letterSpacing: '-0.02em',
            color: 'var(--text-tertiary)',
            marginLeft: '6px',
          }}>
            {initial.length === 1 ? 'carte' : 'cartes'}
          </span>
        </div>
        <p style={{
          fontSize: '14px',
          fontWeight: 500,
          color: 'var(--text-tertiary)',
          marginTop: '6px',
        }}>
          {initial.length === 0
            ? 'Ajoute tes cartes bancaires pour suivre tes dépenses'
            : 'Appuie sur une carte pour voir ses dépenses associées'}
        </p>
      </div>

      {/* ── Page header row ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        marginTop: '8px',
        maxWidth: '640px',
        marginLeft: 'auto',
        marginRight: 'auto',
      }}>
        <p style={{
          fontSize: '12px',
          fontWeight: 700,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'var(--text-tertiary)',
        }}>
          MES CARTES
        </p>
        {/* Desktop add button */}
        <button
          onClick={openCreate}
          className="btn-desktop-only"
          style={{
            alignItems: 'center',
            gap: '6px',
            padding: '9px 18px',
            background: 'var(--accent)',
            color: 'white',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            letterSpacing: '-0.01em',
            transition: 'all 0.2s ease',
            whiteSpace: 'nowrap',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.background = 'var(--accent-hover)';
            (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
            (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-md)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.background = 'var(--accent)';
            (e.currentTarget as HTMLElement).style.transform = '';
            (e.currentTarget as HTMLElement).style.boxShadow = '';
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Ajouter une carte
        </button>
      </div>

      {/* ── Cards grid / Empty state ── */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        margin: '20px 20px 0',
        maxWidth: '640px',
        marginLeft: 'auto',
        marginRight: 'auto',
        padding: '0 20px',
      }}>
        {initial.length === 0 ? (
          /* Empty state */
          <div style={{
            textAlign: 'center',
            padding: '60px 32px',
          }}>
            <div style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              background: 'var(--accent-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              fontSize: '32px',
            }}>
              💳
            </div>
            <p style={{
              fontSize: '18px',
              fontWeight: 700,
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
              marginBottom: '8px',
            }}>
              Aucune carte
            </p>
            <p style={{
              fontSize: '14px',
              color: 'var(--text-tertiary)',
              lineHeight: 1.6,
              maxWidth: '280px',
              margin: '0 auto 24px',
            }}>
              Ajoute tes cartes pour associer tes dépenses et prélèvements automatiques
            </p>
            <button
              onClick={openCreate}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 24px',
                background: 'var(--accent)',
                color: 'white',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                fontSize: '15px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Ajouter ma première carte
            </button>
          </div>
        ) : (
          initial.map((card) => (
            <div
              key={card.id}
              style={{ position: 'relative' }}
            >
              {/* Visual bank card (clickable → detail) */}
              <Link
                href={`/cartes/${card.id}`}
                style={{ textDecoration: 'none', display: 'block' }}
              >
                <div
                  style={{
                    position: 'relative',
                    borderRadius: 'var(--radius-lg)',
                    padding: '22px 20px 18px',
                    color: 'white',
                    overflow: 'hidden',
                    transition: 'all 0.25s ease',
                    cursor: 'pointer',
                    minHeight: '130px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    background: getGradient(card.color),
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
                    (e.currentTarget as HTMLElement).style.boxShadow = '0 12px 32px rgba(15, 23, 42, 0.2)';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.transform = '';
                    (e.currentTarget as HTMLElement).style.boxShadow = '';
                  }}
                >
                  {/* Texture overlay */}
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: `
                      radial-gradient(circle at 80% 20%, rgba(255,255,255,0.12) 0%, transparent 50%),
                      radial-gradient(circle at 20% 80%, rgba(255,255,255,0.06) 0%, transparent 40%)
                    `,
                    pointerEvents: 'none',
                  }} />
                  {/* Chip */}
                  <div style={{
                    position: 'absolute',
                    top: '22px',
                    right: '20px',
                    width: '36px',
                    height: '26px',
                    borderRadius: '5px',
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.1) 100%)',
                    border: '1px solid rgba(255,255,255,0.2)',
                  }} />

                  {/* Top: name + actions */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    position: 'relative',
                    zIndex: 1,
                  }}>
                    <p style={{
                      fontSize: '16px',
                      fontWeight: 700,
                      letterSpacing: '-0.01em',
                      lineHeight: 1.2,
                    }}>
                      {card.name}
                    </p>
                    {/* Action buttons — always visible on touch, hover on desktop */}
                    <div
                      style={{ display: 'flex', gap: '4px' }}
                      onClick={(e) => e.preventDefault()}
                    >
                      <button
                        onClick={(e) => { e.preventDefault(); openEdit(card); }}
                        style={{
                          width: '30px',
                          height: '30px',
                          border: 'none',
                          background: 'rgba(255,255,255,0.2)',
                          backdropFilter: 'blur(4px)',
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          color: 'white',
                          transition: 'all 0.15s',
                          flexShrink: 0,
                        }}
                        aria-label="Modifier"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z" />
                        </svg>
                      </button>
                      {deleting === card.id ? (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            background: 'rgba(0,0,0,0.3)',
                            borderRadius: '6px',
                            padding: '0 8px',
                            fontSize: '12px',
                            color: 'white',
                          }}
                        >
                          <button
                            onClick={(e) => { e.preventDefault(); handleDelete(card.id); }}
                            disabled={isPending}
                            style={{ color: '#FCA5A5', fontWeight: 700, border: 'none', background: 'none', cursor: 'pointer', fontSize: '12px' }}
                          >
                            Oui
                          </button>
                          <span style={{ opacity: 0.5 }}>|</span>
                          <button
                            onClick={(e) => { e.preventDefault(); setDeleting(null); }}
                            style={{ color: 'white', border: 'none', background: 'none', cursor: 'pointer', fontSize: '12px' }}
                          >
                            Non
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={(e) => { e.preventDefault(); setDeleting(card.id); }}
                          style={{
                            width: '30px',
                            height: '30px',
                            border: 'none',
                            background: 'rgba(255,255,255,0.2)',
                            backdropFilter: 'blur(4px)',
                            borderRadius: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            color: 'white',
                            transition: 'all 0.15s',
                            flexShrink: 0,
                          }}
                          aria-label="Supprimer"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                            <path d="M10 11v6M14 11v6" />
                            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Bottom: digits + bank */}
                  <div style={{ position: 'relative', zIndex: 1 }}>
                    <p style={{
                      fontSize: '18px',
                      fontWeight: 800,
                      letterSpacing: '0.12em',
                      fontVariantNumeric: 'tabular-nums',
                      marginBottom: '6px',
                    }}>
                      <span style={{ fontSize: '14px', opacity: 0.6, letterSpacing: '0.04em', verticalAlign: 'middle' }}>•••• </span>
                      {card.last_four ?? '----'}
                    </p>
                    {card.bank && (
                      <p style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                        opacity: 0.7,
                      }}>
                        {card.bank}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            </div>
          ))
        )}
      </div>

      {/* ── FAB (mobile only, hidden >= 768px) ── */}
      <button
        onClick={openCreate}
        className="fab fab-mobile-only"
        aria-label="Ajouter une carte"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          height: '52px',
          padding: '0 20px',
          borderRadius: '100px',
          fontSize: '14px',
          fontWeight: 600,
          letterSpacing: '-0.01em',
          width: 'auto',
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        Ajouter une carte
      </button>

      {/* ── Bottom sheet ── */}
      {modal.mode !== 'closed' && (
        <div
          className="sheet-backdrop"
          onClick={(e) => e.target === e.currentTarget && setModal({ mode: 'closed' })}
        >
          <div className="sheet" style={{ maxHeight: '90dvh', overflowY: 'auto' }}>
            {/* Handle */}
            <div className="sheet-handle" />

            {/* Sheet header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 24px 0',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="5" width="20" height="14" rx="3" />
                  <path d="M2 10h20" />
                </svg>
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.02em',
                }}>
                  {modal.mode === 'create' ? 'Nouvelle carte' : 'Modifier la carte'}
                </h3>
              </div>
              <button
                onClick={() => setModal({ mode: 'closed' })}
                className="icon-btn"
                aria-label="Fermer"
                style={{
                  width: '36px',
                  height: '36px',
                  background: 'var(--surface-sunken)',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Sheet body */}
            <div style={{
              padding: '24px',
              paddingBottom: 'max(24px, calc(16px + env(safe-area-inset-bottom)))',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
            }}>

              {/* Live card preview */}
              <div>
                <p style={{
                  fontSize: '10px',
                  fontWeight: 600,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: 'var(--text-tertiary)',
                  textAlign: 'center',
                  marginBottom: '10px',
                }}>
                  APERÇU
                </p>
                <BankCardVisual
                  name={name}
                  lastFour={lastFour}
                  bank={bank}
                  color={color}
                  mini
                />
              </div>

              {/* Name */}
              <div>
                <label className="field-label">Nom de la carte *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Visa principale"
                  className="input-field"
                  autoFocus
                />
              </div>

              {/* Last 4 digits + Bank */}
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
                    style={{ textAlign: 'center', fontWeight: 700, letterSpacing: '0.1em', fontSize: '18px' }}
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

              {/* Color picker */}
              <div>
                <label className="field-label">Couleur de la carte</label>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(8, 1fr)',
                  gap: '8px',
                }}>
                  {CARD_COLORS.map((c) => (
                    <button
                      key={c.key}
                      type="button"
                      onClick={() => setColor(c.value)}
                      style={{
                        width: '100%',
                        aspectRatio: '1',
                        borderRadius: '50%',
                        border: `3px solid ${color === c.value ? 'var(--text-primary)' : 'transparent'}`,
                        background: c.value,
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                        transform: color === c.value ? 'scale(1.15)' : undefined,
                        position: 'relative',
                      }}
                    >
                      {color === c.value && (
                        <span style={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          width: '10px',
                          height: '10px',
                          borderRadius: '50%',
                          background: 'white',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
                          display: 'block',
                        }} />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setModal({ mode: 'closed' })}
                  className="btn-secondary"
                  style={{ flex: 1 }}
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isPending || !name.trim()}
                  className="btn-primary"
                  style={{ flex: 1.4 }}
                >
                  {isPending ? 'Enregistrement…' : (
                    <>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      {modal.mode === 'create' ? 'Ajouter' : 'Enregistrer'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
