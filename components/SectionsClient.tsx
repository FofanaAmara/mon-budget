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
const COLORS = ['#3D3BF3', '#1A7F5A', '#C7382D', '#C27815', '#6366F1', '#EC4899'];

type ModalState =
  | { mode: 'closed' }
  | { mode: 'create' }
  | { mode: 'edit'; section: Section };

const labelStyle = {
  fontSize: '11px',
  fontWeight: 600,
  color: 'var(--text-tertiary)',
  letterSpacing: '0.06em',
  textTransform: 'uppercase' as const,
  display: 'block',
  marginBottom: '6px',
};

export default function SectionsClient({ sections: initial }: { sections: Section[] }) {
  const router = useRouter();
  const [sections, setSections] = useState(initial);
  const [modal, setModal] = useState<ModalState>({ mode: 'closed' });
  const [deleting, setDeleting] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState('');
  const [icon, setIcon] = useState('🏠');
  const [color, setColor] = useState(COLORS[0]);

  const dragIndex = useRef<number | null>(null);

  function openCreate() {
    setName(''); setIcon('🏠'); setColor(COLORS[0]);
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
    <div className="px-4 pt-8 pb-32 min-h-screen" style={{ background: 'var(--surface-ground)' }}>
      <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '20px', letterSpacing: '-0.02em' }}>
        Sections
      </h1>

      {sections.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <p style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>Aucune section — appuyez sur + pour commencer</p>
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
              className="flex items-center gap-3 cursor-grab active:cursor-grabbing transition-opacity active:opacity-60"
              style={{
                background: 'var(--surface-raised)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-lg)',
                padding: '12px 14px',
                boxShadow: 'var(--shadow-xs)',
              }}
            >
              {/* Drag handle */}
              <svg width="10" height="14" viewBox="0 0 10 14" fill="none" className="flex-shrink-0" style={{ color: 'var(--text-tertiary)' }}>
                <circle cx="3" cy="3" r="1.5" fill="currentColor"/>
                <circle cx="3" cy="7" r="1.5" fill="currentColor"/>
                <circle cx="3" cy="11" r="1.5" fill="currentColor"/>
                <circle cx="7" cy="3" r="1.5" fill="currentColor"/>
                <circle cx="7" cy="7" r="1.5" fill="currentColor"/>
                <circle cx="7" cy="11" r="1.5" fill="currentColor"/>
              </svg>

              {/* Color dot + Icon */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: section.color }} />
                <span style={{ fontSize: '17px', lineHeight: 1 }}>{section.icon}</span>
              </div>

              {/* Name */}
              <span style={{ flex: 1, fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>{section.name}</span>

              {/* Actions */}
              {deleting === section.id ? (
                <div className="flex items-center gap-2" style={{ fontSize: '12px' }}>
                  <span style={{ color: 'var(--text-tertiary)' }}>Supprimer ?</span>
                  <button onClick={() => handleDelete(section.id)} disabled={isPending} style={{ color: 'var(--negative)', fontWeight: 600 }}>Oui</button>
                  <button onClick={() => setDeleting(null)} style={{ color: 'var(--text-tertiary)' }}>Non</button>
                </div>
              ) : (
                <div className="flex items-center gap-0.5">
                  <button
                    onClick={() => openEdit(section)}
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
                    onClick={() => setDeleting(section.id)}
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
        aria-label="Nouvelle section"
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
          onClick={(e) => e.target === e.currentTarget && closeModal()}
        >
          <div
            className="w-full sm:max-w-sm"
            style={{
              background: 'var(--surface-raised)',
              borderRadius: 'var(--radius-sheet) var(--radius-sheet) 0 0',
              boxShadow: 'var(--shadow-xl)',
            }}
          >
            <div className="flex justify-center pt-3 pb-1 sm:hidden">
              <div className="w-9 h-1 rounded-full" style={{ background: 'var(--border-strong)' }} />
            </div>

            <div className="px-6 pt-4 pb-8 space-y-4">
              <h2 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                {modal.mode === 'create' ? 'Nouvelle section' : 'Modifier'}
              </h2>

              <div>
                <label style={labelStyle}>Nom *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex : Maison, Sport…"
                  style={{
                    width: '100%',
                    border: '1.5px solid var(--border-default)',
                    borderRadius: 'var(--radius-md)',
                    padding: '11px 13px',
                    fontSize: '14px',
                    color: 'var(--text-primary)',
                    background: 'var(--surface-inset)',
                    outline: 'none',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
                  onBlur={(e) => (e.target.style.borderColor = 'var(--border-default)')}
                />
              </div>

              <div>
                <label style={labelStyle}>Icône</label>
                <div className="flex flex-wrap gap-2">
                  {EMOJIS.map((e) => (
                    <button
                      key={e}
                      onClick={() => setIcon(e)}
                      className="w-10 h-10 rounded-[var(--radius-md)] text-xl transition-all"
                      style={{
                        background: icon === e ? 'var(--accent-subtle)' : 'var(--surface-inset)',
                        outline: icon === e ? '1.5px solid var(--accent)' : 'none',
                      }}
                    >
                      {e}
                    </button>
                  ))}
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
                  onClick={closeModal}
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
