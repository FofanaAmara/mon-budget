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

type DeleteState = { id: string; name: string } | null;

export default function SectionsClient({ sections: initial }: { sections: Section[] }) {
  const router = useRouter();
  const [sections, setSections] = useState(initial);
  const [modal, setModal] = useState<ModalState>({ mode: 'closed' });
  const [deleting, setDeleting] = useState<DeleteState>(null);
  const [isPending, startTransition] = useTransition();

  // Form state
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('🏠');
  const [color, setColor] = useState('#3B82F6');

  // Drag state
  const dragIndex = useRef<number | null>(null);

  function openCreate() {
    setName('');
    setIcon('🏠');
    setColor('#3B82F6');
    setModal({ mode: 'create' });
  }

  function openEdit(section: Section) {
    setName(section.name);
    setIcon(section.icon);
    setColor(section.color);
    setModal({ mode: 'edit', section });
  }

  function closeModal() {
    setModal({ mode: 'closed' });
  }

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

  function handleDragStart(index: number) {
    dragIndex.current = index;
  }

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
      router.refresh();
    });
  }

  return (
    <div className="px-4 pt-8 pb-6 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#1E293B]">Mes Sections</h1>
        <button
          onClick={openCreate}
          className="bg-[#2563EB] text-white rounded-xl px-4 py-2 text-sm font-medium flex items-center gap-1.5"
        >
          <span className="text-lg leading-none">+</span>
          Nouvelle
        </button>
      </div>

      {/* List */}
      {sections.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="text-5xl mb-4">📂</div>
          <p className="text-[#94A3B8] text-sm mb-4">Aucune section pour le moment</p>
          <button
            onClick={openCreate}
            className="bg-[#2563EB] text-white rounded-xl px-5 py-3 text-sm font-medium"
          >
            Créer une section
          </button>
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
              className="bg-white border border-[#E2E8F0] rounded-2xl p-4 flex items-center gap-3 cursor-grab active:cursor-grabbing active:shadow-md transition-shadow"
            >
              {/* Drag handle */}
              <span className="text-[#CBD5E1] select-none text-sm">⋮⋮</span>

              {/* Icon with color bg */}
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                style={{ backgroundColor: section.color + '20' }}
              >
                {section.icon}
              </div>

              {/* Name */}
              <span className="flex-1 font-medium text-[#1E293B] text-sm">{section.name}</span>

              {/* Color swatch */}
              <div
                className="w-4 h-4 rounded-full flex-shrink-0"
                style={{ backgroundColor: section.color }}
              />

              {/* Actions */}
              {deleting?.id === section.id ? (
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-[#94A3B8]">Supprimer ?</span>
                  <button
                    onClick={() => handleDelete(section.id)}
                    disabled={isPending}
                    className="text-red-500 font-semibold"
                  >
                    Oui
                  </button>
                  <button onClick={() => setDeleting(null)} className="text-[#94A3B8] font-semibold">
                    Non
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEdit(section)}
                    className="p-2 text-[#94A3B8] hover:text-[#2563EB] rounded-lg transition-colors"
                    aria-label="Modifier"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setDeleting({ id: section.id, name: section.name })}
                    className="p-2 text-[#94A3B8] hover:text-red-500 rounded-lg transition-colors"
                    aria-label="Supprimer"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

      {/* Modal */}
      {modal.mode !== 'closed' && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
          onClick={(e) => e.target === e.currentTarget && closeModal()}
        >
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-5">
            <h2 className="text-lg font-bold text-[#1E293B]">
              {modal.mode === 'create' ? 'Nouvelle section' : 'Modifier la section'}
            </h2>

            {/* Name */}
            <div>
              <label className="text-xs font-medium text-[#94A3B8] mb-1.5 block">Nom</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex : Maison, Transport…"
                className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                autoFocus
              />
            </div>

            {/* Icon picker */}
            <div>
              <label className="text-xs font-medium text-[#94A3B8] mb-1.5 block">Icône</label>
              <div className="flex flex-wrap gap-2">
                {EMOJIS.map((e) => (
                  <button
                    key={e}
                    onClick={() => setIcon(e)}
                    className={`w-10 h-10 rounded-xl text-xl transition-all ${
                      icon === e
                        ? 'bg-blue-50 ring-2 ring-[#2563EB]'
                        : 'bg-[#F8FAFC] hover:bg-blue-50'
                    }`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>

            {/* Color picker */}
            <div>
              <label className="text-xs font-medium text-[#94A3B8] mb-1.5 block">Couleur</label>
              <div className="flex gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={`w-8 h-8 rounded-full transition-transform ${
                      color === c ? 'scale-125 ring-2 ring-offset-2 ring-[#2563EB]' : 'hover:scale-110'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-1">
              <button
                onClick={closeModal}
                className="flex-1 border border-[#E2E8F0] text-[#1E293B] rounded-xl px-5 py-3 font-medium text-sm"
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                disabled={isPending || !name.trim()}
                className="flex-1 bg-[#2563EB] text-white rounded-xl px-5 py-3 font-medium text-sm disabled:opacity-50"
              >
                {isPending ? 'Sauvegarde…' : 'Sauvegarder'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
