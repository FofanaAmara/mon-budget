'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createCard, updateCard, deleteCard } from '@/lib/actions/cards';
import type { Card } from '@/lib/types';

const COLORS = ['#6366F1', '#3B82F6', '#8B5CF6', '#EC4899', '#10B981', '#F59E0B'];

type ModalState = { mode: 'closed' } | { mode: 'create' } | { mode: 'edit'; card: Card };
type DeleteState = { id: string; name: string } | null;

export default function CartesClient({ cards: initial }: { cards: Card[] }) {
  const router = useRouter();
  const [modal, setModal] = useState<ModalState>({ mode: 'closed' });
  const [deleting, setDeleting] = useState<DeleteState>(null);
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState('');
  const [lastFour, setLastFour] = useState('');
  const [bank, setBank] = useState('');
  const [color, setColor] = useState('#6366F1');

  function openCreate() {
    setName(''); setLastFour(''); setBank(''); setColor('#6366F1');
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

  return (
    <div className="px-4 pt-8 pb-6 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#1E293B]">Mes Cartes</h1>
        <button
          onClick={openCreate}
          className="bg-[#2563EB] text-white rounded-xl px-4 py-2 text-sm font-medium flex items-center gap-1.5"
        >
          <span className="text-lg leading-none">+</span>
          Nouvelle
        </button>
      </div>

      {/* List */}
      {initial.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="text-5xl mb-4">💳</div>
          <p className="text-[#94A3B8] text-sm mb-4">Aucune carte enregistrée</p>
          <button
            onClick={openCreate}
            className="bg-[#2563EB] text-white rounded-xl px-5 py-3 text-sm font-medium"
          >
            Ajouter une carte
          </button>
        </div>
      ) : (
        <ul className="space-y-3">
          {initial.map((card) => (
            <li
              key={card.id}
              className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden flex items-stretch"
            >
              {/* Color bar */}
              <div className="w-1.5 flex-shrink-0" style={{ backgroundColor: card.color }} />

              {/* Content */}
              <div className="flex-1 p-4 flex items-center gap-3">
                {/* Card icon */}
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: card.color + '15' }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={card.color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="5" width="20" height="14" rx="3" />
                    <path d="M2 10h20" />
                  </svg>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[#1E293B] text-sm truncate">{card.name}</p>
                  <p className="text-xs text-[#94A3B8] mt-0.5">
                    {card.last_four ? `•••• ${card.last_four}` : ''}
                    {card.last_four && card.bank ? ' · ' : ''}
                    {card.bank ?? ''}
                    {!card.last_four && !card.bank ? 'Aucun détail' : ''}
                  </p>
                </div>

                {/* Actions */}
                {deleting?.id === card.id ? (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-[#94A3B8]">Supprimer ?</span>
                    <button onClick={() => handleDelete(card.id)} disabled={isPending} className="text-red-500 font-semibold">Oui</button>
                    <button onClick={() => setDeleting(null)} className="text-[#94A3B8] font-semibold">Non</button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEdit(card)} className="p-2 text-[#94A3B8] hover:text-[#2563EB] rounded-lg transition-colors" aria-label="Modifier">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z" />
                      </svg>
                    </button>
                    <button onClick={() => setDeleting({ id: card.id, name: card.name })} className="p-2 text-[#94A3B8] hover:text-red-500 rounded-lg transition-colors" aria-label="Supprimer">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                        <path d="M10 11v6M14 11v6" />
                        <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Modal */}
      {modal.mode !== 'closed' && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
          onClick={(e) => e.target === e.currentTarget && setModal({ mode: 'closed' })}
        >
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <h2 className="text-lg font-bold text-[#1E293B]">
              {modal.mode === 'create' ? 'Nouvelle carte' : 'Modifier la carte'}
            </h2>

            <div>
              <label className="text-xs font-medium text-[#94A3B8] mb-1.5 block">Nom de la carte *</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex : Visa principale" className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none" autoFocus />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-[#94A3B8] mb-1.5 block">4 derniers chiffres</label>
                <input type="text" value={lastFour} onChange={(e) => setLastFour(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="4532" maxLength={4} className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none" />
              </div>
              <div>
                <label className="text-xs font-medium text-[#94A3B8] mb-1.5 block">Banque</label>
                <input type="text" value={bank} onChange={(e) => setBank(e.target.value)} placeholder="Desjardins" className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none" />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-[#94A3B8] mb-1.5 block">Couleur</label>
              <div className="flex gap-2">
                {COLORS.map((c) => (
                  <button key={c} onClick={() => setColor(c)} className={`w-8 h-8 rounded-full transition-transform ${color === c ? 'scale-125 ring-2 ring-offset-2 ring-[#2563EB]' : 'hover:scale-110'}`} style={{ backgroundColor: c }} />
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-1">
              <button onClick={() => setModal({ mode: 'closed' })} className="flex-1 border border-[#E2E8F0] text-[#1E293B] rounded-xl px-5 py-3 font-medium text-sm">Annuler</button>
              <button onClick={handleSave} disabled={isPending || !name.trim()} className="flex-1 bg-[#2563EB] text-white rounded-xl px-5 py-3 font-medium text-sm disabled:opacity-50">
                {isPending ? 'Sauvegarde…' : 'Sauvegarder'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
