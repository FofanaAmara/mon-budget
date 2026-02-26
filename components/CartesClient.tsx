'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createCard, updateCard, deleteCard } from '@/lib/actions/cards';
import type { Card } from '@/lib/types';

const COLORS = ['#6366F1', '#3B82F6', '#8B5CF6', '#EC4899', '#10B981', '#F59E0B'];

type ModalState = { mode: 'closed' } | { mode: 'create' } | { mode: 'edit'; card: Card };

export default function CartesClient({ cards: initial }: { cards: Card[] }) {
  const router = useRouter();
  const [modal, setModal] = useState<ModalState>({ mode: 'closed' });
  const [deleting, setDeleting] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [name, setName]         = useState('');
  const [lastFour, setLastFour] = useState('');
  const [bank, setBank]         = useState('');
  const [color, setColor]       = useState('#6366F1');

  function openCreate() {
    setName(''); setLastFour(''); setBank(''); setColor('#6366F1');
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
    <div className="px-4 pt-8 pb-32 min-h-screen">
      {/* Header — titre seul */}
      <h1 className="text-2xl font-bold text-[#1E293B] mb-6">Cartes</h1>

      {initial.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <p className="text-[#94A3B8] text-sm">Aucune carte — appuyez sur + pour ajouter</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {initial.map((card) => (
            <li
              key={card.id}
              className="bg-white border border-[#E2E8F0] rounded-2xl px-4 py-3.5 flex items-center gap-3"
            >
              {/* Colored left bar */}
              <div className="w-0.5 h-8 rounded-full flex-shrink-0" style={{ backgroundColor: card.color }} />

              {/* Icon — sobre, pas de fond coloré */}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
                <rect x="2" y="5" width="20" height="14" rx="3" />
                <path d="M2 10h20" />
              </svg>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#1E293B] truncate">{card.name}</p>
                {(card.last_four || card.bank) && (
                  <p className="text-xs text-[#94A3B8] mt-0.5">
                    {card.last_four ? `•••• ${card.last_four}` : ''}{card.last_four && card.bank ? ' · ' : ''}{card.bank ?? ''}
                  </p>
                )}
              </div>

              {/* Actions */}
              {deleting === card.id ? (
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-[#94A3B8]">Supprimer ?</span>
                  <button onClick={() => handleDelete(card.id)} disabled={isPending} className="text-red-500 font-semibold">Oui</button>
                  <button onClick={() => setDeleting(null)} className="text-[#94A3B8]">Non</button>
                </div>
              ) : (
                <div className="flex items-center gap-0.5">
                  <button onClick={() => openEdit(card)} className="p-2 text-[#CBD5E1] hover:text-[#1E293B] rounded-lg transition-colors" aria-label="Modifier">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z" />
                    </svg>
                  </button>
                  <button onClick={() => setDeleting(card.id)} className="p-2 text-[#CBD5E1] hover:text-red-400 rounded-lg transition-colors" aria-label="Supprimer">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

      {/* FAB — identique à toutes les pages */}
      <button
        onClick={openCreate}
        className="fixed bottom-20 right-4 w-14 h-14 bg-[#1E293B] text-white rounded-full shadow-lg flex items-center justify-center text-2xl hover:bg-[#0F172A] transition-colors active:scale-95"
        aria-label="Nouvelle carte"
      >
        +
      </button>

      {/* Modal */}
      {modal.mode !== 'closed' && (
        <div
          className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && setModal({ mode: 'closed' })}
        >
          <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-sm">
            <div className="flex justify-center pt-3 pb-1 sm:hidden">
              <div className="w-9 h-1 bg-[#E2E8F0] rounded-full" />
            </div>

            <div className="px-6 pt-4 pb-8 space-y-5">
              <h2 className="text-base font-semibold text-[#1E293B]">
                {modal.mode === 'create' ? 'Nouvelle carte' : 'Modifier'}
              </h2>

              <div>
                <label className="text-xs font-medium text-[#64748B] mb-1.5 block tracking-wide uppercase">Nom *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Visa principale"
                  className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm focus:border-[#1E293B] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-[#64748B] mb-1.5 block tracking-wide uppercase">4 derniers chiffres</label>
                  <input
                    type="text"
                    value={lastFour}
                    onChange={(e) => setLastFour(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="4532"
                    maxLength={4}
                    className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm focus:border-[#1E293B] outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-[#64748B] mb-1.5 block tracking-wide uppercase">Banque</label>
                  <input
                    type="text"
                    value={bank}
                    onChange={(e) => setBank(e.target.value)}
                    placeholder="Desjardins"
                    className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm focus:border-[#1E293B] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-[#64748B] mb-1.5 block tracking-wide uppercase">Couleur</label>
                <div className="flex gap-2">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setColor(c)}
                      className={`w-7 h-7 rounded-full transition-transform ${color === c ? 'scale-125 ring-2 ring-offset-1 ring-[#1E293B]' : 'hover:scale-110'}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-1">
                <button onClick={() => setModal({ mode: 'closed' })} className="flex-1 border border-[#E2E8F0] text-[#64748B] rounded-xl px-5 py-3 text-sm font-medium">Annuler</button>
                <button onClick={handleSave} disabled={isPending || !name.trim()} className="flex-1 bg-[#1E293B] text-white rounded-xl px-5 py-3 text-sm font-medium disabled:opacity-40">
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
