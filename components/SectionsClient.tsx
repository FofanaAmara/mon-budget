'use client';

import { useState, useTransition, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  createSection,
  updateSection,
  deleteSection,
  reorderSections,
} from '@/lib/actions/sections';
import type { Section } from '@/lib/types';

const EMOJIS = ['🏠', '👤', '👨‍👩‍👧‍👦', '🚗', '💼', '🎯', '🏋️', '🎓', '🏥', '✈️'];
const COLORS = ['#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#EF4444'];

type ModalState =
  | { mode: 'closed' }
  | { mode: 'create' }
  | { mode: 'edit'; section: Section };

export default function SectionsClient({ sections: initial }: { sections: Section[] }) {
  const router = useRouter();
  const [sections, setSections] = useState(initial);
  const [modal, setModal] = useState<ModalState>({ mode: 'closed' });
  const [deleting, setDeleting] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState('');
  const [icon, setIcon] = useState('🏠');
  const [color, setColor] = useState('#3B82F6');

  const dragIndex = useRef<number | null>(null);

  function openCreate() {
    setName(''); setIcon('🏠'); setColor('#3B82F6');
    setModal({ mode: 'create' });
  }

  function openEdit(section: Section) {
    setName(section.name); setIcon(section.icon); setColor(section.color);
    setModal({ mode: 'edit', section });
  }

  function closeModal() { setModal({ mode: 'closed' }); }

  function handleSave() {
    if (!name.trim()) return;
    startTransition(async () => {
      if (modal.mode === 'create') {
        await createSection({ name: name.trim(), icon, color });
      } else if (modal.mode === 'edit') {
        await updateSection(modal.section.id, { name: name.trim(), icon, color });
      }
      router.refresh();
      closeModal();
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteSection(id);
      setSections((prev) => prev.filter((s) => s.id !== id));
      setDeleting(null);
      router.refresh();
    });
  }

  function handleDragStart(index: number) { dragIndex.current = index; }

  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault();
    if (dragIndex.current === null || dragIndex.current === index) return;
    const reordered = [...sections];
    const [moved] = reordered.splice(dragIndex.current, 1);
    reordered.splice(index, 0, moved);
    dragIndex.current = index;
    setSections(reordered);
  }

  function handleDragEnd() {
    startTransition(async () => {
      await reorderSections(sections.map((s) => s.id));
      dragIndex.current = null;
    });
  }

  return (
    <div className="px-4 pt-8 pb-32 min-h-screen">
      {/* Header — titre seul, pas de bouton */}
      <h1 className="text-2xl font-bold text-[#1E293B] mb-6">Sections</h1>

      {sections.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <p className="text-[#94A3B8] text-sm">Aucune section — appuyez sur + pour commencer</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {sections.map((section, i) => (
            <li
              key={section.id}
              draggable
              onDragStart={() => handleDragStart(i)}
              onDragOver={(e) => handleDragOver(e, i)}
              onDragEnd={handleDragEnd}
              className="bg-white border border-[#E2E8F0] rounded-2xl px-4 py-3.5 flex items-center gap-3 cursor-grab active:cursor-grabbing active:opacity-70 transition-opacity"
            >
              {/* Drag handle */}
              <svg width="12" height="16" viewBox="0 0 12 16" fill="none" className="flex-shrink-0 text-[#CBD5E1]">
                <circle cx="4" cy="4" r="1.5" fill="currentColor"/>
                <circle cx="4" cy="8" r="1.5" fill="currentColor"/>
                <circle cx="4" cy="12" r="1.5" fill="currentColor"/>
                <circle cx="8" cy="4" r="1.5" fill="currentColor"/>
                <circle cx="8" cy="8" r="1.5" fill="currentColor"/>
                <circle cx="8" cy="12" r="1.5" fill="currentColor"/>
              </svg>

              {/* Icon — pas de fond coloré */}
              <span className="text-lg leading-none flex-shrink-0">{section.icon}</span>

              {/* Name */}
              <span className="flex-1 text-sm font-medium text-[#1E293B]">{section.name}</span>

              {/* Color dot — discret */}
              <div className="w-2 h-2 rounded-full flex-shrink-0 opacity-60" style={{ backgroundColor: section.color }} />

              {/* Actions */}
              {deleting === section.id ? (
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-[#94A3B8]">Supprimer ?</span>
                  <button onClick={() => handleDelete(section.id)} disabled={isPending} className="text-red-500 font-semibold">Oui</button>
                  <button onClick={() => setDeleting(null)} className="text-[#94A3B8]">Non</button>
                </div>
              ) : (
                <div className="flex items-center gap-0.5">
                  <button
                    onClick={() => openEdit(section)}
                    className="p-2 text-[#CBD5E1] hover:text-[#1E293B] rounded-lg transition-colors"
                    aria-label="Modifier"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setDeleting(section.id)}
                    className="p-2 text-[#CBD5E1] hover:text-red-400 rounded-lg transition-colors"
                    aria-label="Supprimer"
                  >
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

      {/* FAB — cohérent avec toutes les pages */}
      <button
        onClick={openCreate}
        className="fixed bottom-20 right-4 w-14 h-14 bg-[#1E293B] text-white rounded-full shadow-lg flex items-center justify-center text-2xl hover:bg-[#0F172A] transition-colors active:scale-95"
        aria-label="Nouvelle section"
      >
        +
      </button>

      {/* Modal */}
      {modal.mode !== 'closed' && (
        <div
          className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && closeModal()}
        >
          <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-sm">
            <div className="flex justify-center pt-3 pb-1 sm:hidden">
              <div className="w-9 h-1 bg-[#E2E8F0] rounded-full" />
            </div>

            <div className="px-6 pt-4 pb-8 space-y-5">
              <h2 className="text-base font-semibold text-[#1E293B]">
                {modal.mode === 'create' ? 'Nouvelle section' : 'Modifier'}
              </h2>

              <div>
                <label className="text-xs font-medium text-[#64748B] mb-1.5 block tracking-wide uppercase">Nom *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex : Maison, Sport…"
                  className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm focus:border-[#1E293B] outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-[#64748B] mb-1.5 block tracking-wide uppercase">Icône</label>
                <div className="flex flex-wrap gap-2">
                  {EMOJIS.map((e) => (
                    <button
                      key={e}
                      onClick={() => setIcon(e)}
                      className={`w-10 h-10 rounded-xl text-xl transition-all ${
                        icon === e ? 'bg-[#F1F5F9] ring-1 ring-[#1E293B]' : 'bg-[#F8FAFC]'
                      }`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-[#64748B] mb-1.5 block tracking-wide uppercase">Couleur</label>
                <div className="flex gap-2">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setColor(c)}
                      className={`w-7 h-7 rounded-full transition-transform ${
                        color === c ? 'scale-125 ring-2 ring-offset-1 ring-[#1E293B]' : 'hover:scale-110'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-1">
                <button onClick={closeModal} className="flex-1 border border-[#E2E8F0] text-[#64748B] rounded-xl px-5 py-3 text-sm font-medium">
                  Annuler
                </button>
                <button
                  onClick={handleSave}
                  disabled={isPending || !name.trim()}
                  className="flex-1 bg-[#1E293B] text-white rounded-xl px-5 py-3 text-sm font-medium disabled:opacity-40"
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
