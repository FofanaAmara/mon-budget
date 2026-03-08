"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import SheetCloseButton from "@/components/SheetCloseButton";
import {
  createSection,
  updateSection,
  deleteSection,
  getSectionExpenseCount,
  reorderSections,
} from "@/lib/actions/sections";
import type { Section } from "@/lib/types";

/* ─── Constants ──────────────────────────────────────── */

const EMOJIS = [
  "🏠",
  "👤",
  "👨‍👩‍👧‍👦",
  "🚗",
  "💼",
  "🎯",
  "🏋️",
  "🎓",
  "🏥",
  "✈️",
  "🛒",
  "🍽️",
  "☕",
  "🎮",
  "📱",
  "💄",
  "🐶",
  "🌿",
  "🎵",
  "💡",
  "🏖️",
  "🎁",
  "📚",
  "🔧",
  "💰",
  "🏦",
  "🌍",
  "⚡",
  "🏡",
  "🧴",
  "🚿",
  "🍕",
  "🚴",
  "🎨",
  "🛡️",
  "📦",
];

const COLORS = [
  { key: "teal", value: "#0F766E" },
  { key: "slate", value: "#334155" },
  { key: "blue", value: "#2563EB" },
  { key: "purple", value: "#7C3AED" },
  { key: "amber", value: "#D97706" },
  { key: "rose", value: "#E11D48" },
  { key: "emerald", value: "#059669" },
  { key: "orange", value: "#EA580C" },
];

/* ─── Types ──────────────────────────────────────────── */

type ModalState =
  | { mode: "closed" }
  | { mode: "create" }
  | { mode: "edit"; section: Section };

/* ─── Component ──────────────────────────────────────── */

export default function SectionsClient({
  sections: initial,
}: {
  sections: Section[];
}) {
  const router = useRouter();
  const [sections, setSections] = useState(initial);
  const [modal, setModal] = useState<ModalState>({ mode: "closed" });
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deleteExpenseCount, setDeleteExpenseCount] = useState(0);
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState("");
  const [icon, setIcon] = useState("🏠");
  const [color, setColor] = useState(COLORS[0].value);

  const dragIndex = useRef<number | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (modal.mode !== "closed") {
      dialogRef.current?.focus();
    }
  }, [modal.mode]);

  /* ── Handlers ── */

  function openCreate() {
    setName("");
    setIcon("🏠");
    setColor(COLORS[0].value);
    setModal({ mode: "create" });
  }

  function openEdit(section: Section) {
    setName(section.name);
    setIcon(section.icon);
    setColor(section.color);
    setModal({ mode: "edit", section });
  }

  function closeModal() {
    setModal({ mode: "closed" });
  }

  function handleSave() {
    if (!name.trim()) return;
    startTransition(async () => {
      if (modal.mode === "create") {
        const newSection = await createSection({
          name: name.trim(),
          icon,
          color,
        });
        setSections((prev) => [...prev, newSection]);
      } else if (modal.mode === "edit") {
        await updateSection(modal.section.id, {
          name: name.trim(),
          icon,
          color,
        });
        setSections((prev) =>
          prev.map((s) =>
            s.id === modal.section.id
              ? { ...s, name: name.trim(), icon, color }
              : s,
          ),
        );
      }
      router.refresh();
      closeModal();
    });
  }

  async function handleDeleteClick(id: string) {
    const count = await getSectionExpenseCount(id);
    setDeleteExpenseCount(count);
    setDeleting(id);
  }

  function handleDeleteConfirm(id: string) {
    startTransition(async () => {
      await deleteSection(id);
      setSections((prev) => prev.filter((s) => s.id !== id));
      setDeleting(null);
      setDeleteExpenseCount(0);
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
    });
  }

  /* ─── Render ─────────────────────────────────────────── */

  return (
    <div style={{ paddingBottom: "120px" }}>
      {/* ── Monument: section count ── */}
      <div
        style={{
          padding: "28px 20px 20px",
          textAlign: "center",
          position: "relative",
        }}
      >
        <p
          style={{
            fontSize: "12px",
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "var(--accent)",
            marginBottom: "8px",
          }}
        >
          MES SECTIONS
        </p>
        <div>
          <span
            style={{
              fontSize: "clamp(3.5rem, 14vw, 6rem)",
              fontWeight: 800,
              letterSpacing: "-0.04em",
              lineHeight: 1,
              color: "var(--text-primary)",
            }}
          >
            {sections.length}
          </span>
          <span
            style={{
              fontSize: "clamp(1.2rem, 4vw, 1.5rem)",
              fontWeight: 600,
              letterSpacing: "-0.02em",
              color: "var(--text-tertiary)",
              marginLeft: "6px",
            }}
          >
            {sections.length === 1 ? "section" : "sections"}
          </span>
        </div>
        <p
          style={{
            fontSize: "14px",
            fontWeight: 500,
            color: "var(--text-tertiary)",
            marginTop: "6px",
          }}
        >
          {sections.length === 0
            ? "Crée ta première section pour organiser tes dépenses"
            : "Glisse pour réordonner · Appuie pour modifier"}
        </p>
      </div>

      {/* ── Page header row ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 20px",
          marginTop: "8px",
          maxWidth: "640px",
          marginLeft: "auto",
          marginRight: "auto",
        }}
      >
        <p
          style={{
            fontSize: "11px",
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--teal-700)",
          }}
        >
          LISTE ({sections.length})
        </p>
        {/* Desktop-only add button */}
        <button
          onClick={openCreate}
          className="btn-desktop-only"
          style={{
            alignItems: "center",
            gap: "6px",
            padding: "9px 18px",
            background: "var(--accent)",
            color: "white",
            border: "none",
            borderRadius: "var(--radius-md)",
            fontSize: "13px",
            fontWeight: 600,
            cursor: "pointer",
            letterSpacing: "-0.01em",
            transition: "all 0.2s ease",
            whiteSpace: "nowrap",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background =
              "var(--accent-hover)";
            (e.currentTarget as HTMLElement).style.transform =
              "translateY(-1px)";
            (e.currentTarget as HTMLElement).style.boxShadow =
              "var(--shadow-md)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = "var(--accent)";
            (e.currentTarget as HTMLElement).style.transform = "";
            (e.currentTarget as HTMLElement).style.boxShadow = "";
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Nouvelle section
        </button>
      </div>

      {/* ── Section list / Empty state ── */}
      <div
        style={{
          margin: "20px 20px 0",
          maxWidth: "640px",
          marginLeft: "auto",
          marginRight: "auto",
          padding: "0 20px",
        }}
      >
        {sections.length === 0 ? (
          /* Empty state */
          <div
            style={{
              textAlign: "center",
              padding: "60px 32px",
            }}
          >
            <div
              style={{
                width: "72px",
                height: "72px",
                borderRadius: "50%",
                background: "var(--accent-subtle)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 20px",
                fontSize: "32px",
              }}
            >
              🗂️
            </div>
            <p
              style={{
                fontSize: "18px",
                fontWeight: 700,
                color: "var(--text-primary)",
                letterSpacing: "-0.02em",
                marginBottom: "8px",
              }}
            >
              Aucune section
            </p>
            <p
              style={{
                fontSize: "14px",
                color: "var(--text-tertiary)",
                lineHeight: 1.6,
                maxWidth: "280px",
                margin: "0 auto 24px",
              }}
            >
              Les sections organisent tes dépenses par catégorie (Maison,
              Transport, Loisirs…)
            </p>
            <button
              onClick={openCreate}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "12px 24px",
                background: "var(--accent)",
                color: "white",
                border: "none",
                borderRadius: "var(--radius-md)",
                fontSize: "15px",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Créer ma première section
            </button>
          </div>
        ) : (
          /* Section items */
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {sections.map((section, i) => (
              <div
                key={section.id}
                draggable
                onDragStart={() => handleDragStart(i)}
                onDragOver={(e) => handleDragOver(e, i)}
                onDragEnd={handleDragEnd}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "14px",
                  padding: "14px 16px",
                  background: "white",
                  border: "1px solid var(--border-default)",
                  borderRadius: "var(--radius-md)",
                  cursor: "grab",
                  transition: "all 0.2s ease",
                  position: "relative",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor =
                    "rgba(15, 118, 110, 0.2)";
                  (e.currentTarget as HTMLElement).style.boxShadow =
                    "var(--shadow-sm)";
                  (e.currentTarget as HTMLElement).style.transform =
                    "translateY(-1px)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor =
                    "var(--border-default)";
                  (e.currentTarget as HTMLElement).style.boxShadow = "";
                  (e.currentTarget as HTMLElement).style.transform = "";
                }}
              >
                {/* Drag handle */}
                <div
                  className="drag-handle"
                  style={{
                    color: "var(--border-strong)",
                    flexShrink: 0,
                    touchAction: "none",
                  }}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="9" cy="5" r="1" fill="currentColor" />
                    <circle cx="9" cy="12" r="1" fill="currentColor" />
                    <circle cx="9" cy="19" r="1" fill="currentColor" />
                    <circle cx="15" cy="5" r="1" fill="currentColor" />
                    <circle cx="15" cy="12" r="1" fill="currentColor" />
                    <circle cx="15" cy="19" r="1" fill="currentColor" />
                  </svg>
                </div>

                {/* Emoji with colored background */}
                <div
                  style={{
                    width: "42px",
                    height: "42px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "var(--radius-sm)",
                    fontSize: "20px",
                    flexShrink: 0,
                    background: `${section.color}18`,
                  }}
                >
                  {section.icon}
                </div>

                {/* Section info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      fontSize: "15px",
                      fontWeight: 600,
                      color: "var(--text-primary)",
                      letterSpacing: "-0.01em",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {section.name}
                  </p>
                </div>

                {/* Color dot */}
                <div
                  style={{
                    width: "12px",
                    height: "12px",
                    borderRadius: "50%",
                    background: section.color,
                    flexShrink: 0,
                  }}
                />

                {/* Actions */}
                {deleting === section.id ? (
                  <div className="confirm-inline">
                    <span
                      style={{
                        color: "var(--text-tertiary)",
                        fontSize: "13px",
                      }}
                    >
                      {deleteExpenseCount > 0
                        ? `${deleteExpenseCount} charge(s) seront sans section. Supprimer ?`
                        : "Supprimer ?"}
                    </span>
                    <button
                      onClick={() => handleDeleteConfirm(section.id)}
                      disabled={isPending}
                      className="confirm-yes"
                    >
                      Oui
                    </button>
                    <span className="confirm-sep">|</span>
                    <button
                      onClick={() => {
                        setDeleting(null);
                        setDeleteExpenseCount(0);
                      }}
                      className="confirm-no"
                    >
                      Non
                    </button>
                  </div>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      flexShrink: 0,
                    }}
                  >
                    <button
                      onClick={() => openEdit(section)}
                      className="icon-btn"
                      aria-label="Modifier"
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeleteClick(section.id)}
                      className="icon-btn icon-btn-danger"
                      aria-label="Supprimer"
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
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
      </div>

      {/* ── FAB (mobile only, hidden >= 768px) ── */}
      <button
        onClick={openCreate}
        className="fab fab-mobile-only"
        aria-label="Nouvelle section"
        style={{
          width: "52px",
          height: "52px",
          borderRadius: "50%",
        }}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>

      {/* ── Bottom sheet ── */}
      {modal.mode !== "closed" && (
        <div
          className="sheet-backdrop"
          onClick={(e) => e.target === e.currentTarget && closeModal()}
          role="presentation"
        >
          <div
            ref={dialogRef}
            className="sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="section-dialog-title"
            tabIndex={-1}
            onKeyDown={(e) => e.key === "Escape" && closeModal()}
            style={{ maxHeight: "90dvh", overflowY: "auto" }}
          >
            {/* Handle */}
            <div className="sheet-handle" />
            <SheetCloseButton onClose={closeModal} />

            {/* Sheet header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px 24px 0",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "10px" }}
              >
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--accent)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                </svg>
                <h3
                  id="section-dialog-title"
                  style={{
                    fontSize: "18px",
                    fontWeight: 700,
                    color: "var(--text-primary)",
                    letterSpacing: "-0.02em",
                  }}
                >
                  {modal.mode === "create"
                    ? "Nouvelle section"
                    : "Modifier la section"}
                </h3>
              </div>
              <button
                onClick={closeModal}
                className="icon-btn"
                aria-label="Fermer"
                style={{
                  width: "36px",
                  height: "36px",
                  background: "var(--surface-sunken)",
                  borderRadius: "var(--radius-sm)",
                }}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Sheet body */}
            <div
              style={{
                padding: "24px",
                paddingBottom:
                  "max(24px, calc(16px + env(safe-area-inset-bottom)))",
                display: "flex",
                flexDirection: "column",
                gap: "20px",
              }}
            >
              {/* Name input */}
              <div>
                <label htmlFor="section-name" className="field-label">
                  Nom *
                </label>
                <input
                  id="section-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex : Maison, Transport, Sport…"
                  className="input-field"
                />
              </div>

              {/* Emoji picker */}
              <div>
                <label className="field-label">Icône</label>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(7, 1fr)",
                    gap: "6px",
                  }}
                >
                  {EMOJIS.map((e) => (
                    <button
                      key={e}
                      type="button"
                      onClick={() => setIcon(e)}
                      style={{
                        width: "100%",
                        aspectRatio: "1",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "22px",
                        border: `2px solid ${icon === e ? "var(--accent)" : "transparent"}`,
                        borderRadius: "var(--radius-sm)",
                        background:
                          icon === e
                            ? "var(--accent-subtle)"
                            : "var(--surface-sunken)",
                        cursor: "pointer",
                        transition: "all 0.15s",
                        transform: icon === e ? "scale(1.1)" : undefined,
                      }}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color picker */}
              <div>
                <label className="field-label">Couleur</label>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(8, 1fr)",
                    gap: "8px",
                  }}
                >
                  {COLORS.map((c) => (
                    <button
                      key={c.key}
                      type="button"
                      onClick={() => setColor(c.value)}
                      style={{
                        width: "100%",
                        aspectRatio: "1",
                        borderRadius: "50%",
                        border: `3px solid ${color === c.value ? "var(--text-primary)" : "transparent"}`,
                        background: c.value,
                        cursor: "pointer",
                        transition: "all 0.15s",
                        transform:
                          color === c.value ? "scale(1.15)" : undefined,
                        position: "relative",
                      }}
                    >
                      {color === c.value && (
                        <span
                          style={{
                            position: "absolute",
                            top: "50%",
                            left: "50%",
                            transform: "translate(-50%, -50%)",
                            width: "10px",
                            height: "10px",
                            borderRadius: "50%",
                            background: "white",
                            boxShadow: "0 1px 2px rgba(0,0,0,0.15)",
                            display: "block",
                          }}
                        />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
                <button
                  type="button"
                  onClick={closeModal}
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
                  {isPending ? (
                    "Enregistrement…"
                  ) : (
                    <>
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{ marginRight: "6px" }}
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      {modal.mode === "create" ? "Créer" : "Enregistrer"}
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
