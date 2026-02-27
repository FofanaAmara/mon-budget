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
          Sections
        </h1>
        <p style={{
          fontSize: 'var(--text-xs)',
          color: 'var(--text-tertiary)',
          marginTop: '4px',
          fontWeight: 500,
        }}>
          {sections.length} section{sections.length !== 1 ? 's' : ''}
        </p>
      </div>

      {sections.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <p className="empty-state-text">Aucune section</p>
            <p className="empty-state-hint">Appuyez sur + pour commencer</p>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {sections.map((section, i) => (
            <div
              key={section.id}
              draggable
              onDragStart={() => handleDragStart(i)}
              onDragOver={(e) => handleDragOver(e, i)}
              onDragEnd={handleDragEnd}
              className="card card-press"
              style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '14px 18px',
                cursor: 'grab',
              }}
            >
              {/* Drag handle */}
              <div className="drag-handle">
                <svg width="10" height="14" viewBox="0 0 10 14" fill="none">
                  <circle cx="3" cy="3" r="1.5" fill="currentColor"/>
                  <circle cx="3" cy="7" r="1.5" fill="currentColor"/>
                  <circle cx="3" cy="11" r="1.5" fill="currentColor"/>
                  <circle cx="7" cy="3" r="1.5" fill="currentColor"/>
                  <circle cx="7" cy="7" r="1.5" fill="currentColor"/>
                  <circle cx="7" cy="11" r="1.5" fill="currentColor"/>
                </svg>
              </div>

              {/* Color dot + Icon */}
              <div className="flex items-center" style={{ gap: '6px', flexShrink: 0 }}>
                <div style={{
                  width: '8px', height: '8px',
                  borderRadius: 'var(--radius-full)',
                  background: section.color,
                }} />
                <span style={{ fontSize: '1.0625rem', lineHeight: 1 }}>{section.icon}</span>
              </div>

              {/* Name */}
              <span style={{
                flex: 1, fontSize: 'var(--text-sm)',
                fontWeight: 550, color: 'var(--text-primary)',
              }}>
                {section.name}
              </span>

              {/* Actions */}
              {deleting === section.id ? (
                <div className="confirm-inline">
                  <span style={{ color: 'var(--text-tertiary)' }}>Supprimer ?</span>
                  <button onClick={() => handleDelete(section.id)} disabled={isPending} className="confirm-yes">Oui</button>
                  <span className="confirm-sep">|</span>
                  <button onClick={() => setDeleting(null)} className="confirm-no">Non</button>
                </div>
              ) : (
                <div className="flex items-center" style={{ gap: '2px' }}>
                  <button
                    onClick={() => openEdit(section)}
                    className="icon-btn"
                    aria-label="Modifier"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setDeleting(section.id)}
                    className="icon-btn icon-btn-danger"
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
            </div>
          ))}
        </div>
      )}

      {/* FAB */}
      <button
        onClick={openCreate}
        className="fab"
        aria-label="Nouvelle section"
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
          onClick={(e) => e.target === e.currentTarget && closeModal()}
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
                {modal.mode === 'create' ? 'Nouvelle section' : 'Modifier'}
              </h2>

              <div>
                <label className="field-label">Nom *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex : Maison, Sport..."
                  className="input-field"
                />
              </div>

              <div>
                <label className="field-label">Icone</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {EMOJIS.map((e) => (
                    <button
                      key={e}
                      type="button"
                      onClick={() => setIcon(e)}
                      className="emoji-btn"
                      data-active={icon === e}
                    >
                      {e}
                    </button>
                  ))}
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
                  onClick={closeModal}
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
