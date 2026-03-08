"use client";

import { useState, useRef, useEffect } from "react";
import SheetCloseButton from "@/components/SheetCloseButton";
import { createAllocation, updateAllocation } from "@/lib/actions/allocations";
import { formatCAD } from "@/lib/utils";
import type { IncomeAllocation, Section, Expense } from "@/lib/types";

const PRESET_COLORS = [
  "#3D3BF3",
  "#1A7F5A",
  "#C27815",
  "#E53E3E",
  "#7C3AED",
  "#0EA5E9",
  "#F59E0B",
  "#6B6966",
];

type Props = {
  allocation?: IncomeAllocation;
  sections: Section[];
  projects: Expense[]; // PLANNED expenses
  expectedMonthlyIncome: number;
  currentTotalAllocated: number;
  onClose: () => void;
};

type LinkType = "charges" | "savings" | "free";

export default function AllocationModal({
  allocation,
  sections,
  projects,
  expectedMonthlyIncome,
  currentTotalAllocated,
  onClose,
}: Props) {
  const isEdit = !!allocation;
  const dialogRef = useRef<HTMLDivElement>(null);

  const [label, setLabel] = useState(allocation?.label ?? "");
  const [amount, setAmount] = useState(String(allocation?.amount ?? ""));
  const [linkType, setLinkType] = useState<LinkType>(() => {
    if (allocation?.section_ids?.length) return "charges";
    if (allocation?.project_id) return "savings";
    return "free";
  });
  const [sectionIds, setSectionIds] = useState<string[]>(
    allocation?.section_ids ?? [],
  );
  const [projectId, setProjectId] = useState(allocation?.project_id ?? "");
  const [endMonth, setEndMonth] = useState(allocation?.end_month ?? "");
  const [color, setColor] = useState(allocation?.color ?? PRESET_COLORS[0]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    dialogRef.current?.focus();
  }, []);

  const amtNum = parseFloat(amount) || 0;
  // In edit mode, exclude the current allocation's amount before adding the new one
  const existingOther = isEdit
    ? currentTotalAllocated - (allocation?.amount ?? 0)
    : currentTotalAllocated;
  const newTotal = existingOther + amtNum;
  const disponible = expectedMonthlyIncome - newTotal;
  const isOverAllocated = disponible < 0;

  // For savings: if linked project has target_date, compute end_month automatically
  const selectedProject = projects.find((p) => p.id === projectId);
  const rawTargetDate = selectedProject?.target_date;
  const autoEndMonth = rawTargetDate
    ? (typeof rawTargetDate === "string"
        ? rawTargetDate
        : (rawTargetDate as unknown as Date).toISOString()
      ).slice(0, 7)
    : null;

  async function handleSubmit() {
    if (!label.trim() || amtNum <= 0) return;
    setSaving(true);
    try {
      const data = {
        label: label.trim(),
        amount: amtNum,
        section_ids: linkType === "charges" ? sectionIds : [],
        project_id: linkType === "savings" ? projectId || null : null,
        end_month:
          linkType === "savings" && autoEndMonth
            ? autoEndMonth
            : endMonth || null,
        color,
      };
      if (isEdit) {
        await updateAllocation(allocation.id, data);
      } else {
        await createAllocation(data);
      }
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="sheet-backdrop"
      style={{ zIndex: 110 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="presentation"
    >
      <div
        ref={dialogRef}
        className="sheet"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="allocation-dialog-title"
        tabIndex={-1}
        onKeyDown={(e) => {
          if (e.key === "Escape") onClose();
        }}
      >
        <div className="sheet-handle" />
        <SheetCloseButton onClose={onClose} />
        <div
          style={{
            padding: "8px 24px 40px",
            overflowY: "auto",
            maxHeight: "85vh",
          }}
        >
          <h2
            id="allocation-dialog-title"
            style={{
              fontSize: "var(--text-lg)",
              fontWeight: 700,
              color: "var(--text-primary)",
              marginBottom: "24px",
            }}
          >
            {isEdit ? "Modifier l'enveloppe" : "Nouvelle enveloppe"}
          </h2>

          {/* Label */}
          <div style={{ marginBottom: "16px" }}>
            <label htmlFor="allocation-label" className="field-label">
              Nom de l&apos;enveloppe
            </label>
            <input
              id="allocation-label"
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Ex: Maison, Voyage, Loisirs..."
              className="input-field"
            />
          </div>

          {/* Amount */}
          <div style={{ marginBottom: "20px" }}>
            <label htmlFor="allocation-amount" className="field-label">
              Montant mensuel ($)
            </label>
            <input
              id="allocation-amount"
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="input-field"
              style={{ fontVariantNumeric: "tabular-nums" }}
            />
          </div>

          {/* Link type */}
          <div style={{ marginBottom: "20px" }}>
            <label
              className="field-label"
              style={{ marginBottom: "10px", display: "block" }}
            >
              Type
            </label>
            <div className="flex" style={{ gap: "8px" }}>
              {(
                [
                  {
                    key: "charges",
                    label: "📦 Charges",
                    desc: "Lié à une section",
                  },
                  {
                    key: "savings",
                    label: "💰 Épargne",
                    desc: "Lié à un projet",
                  },
                  { key: "free", label: "🔖 Autre", desc: "Sans suivi" },
                ] as { key: LinkType; label: string; desc: string }[]
              ).map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setLinkType(opt.key)}
                  style={{
                    flex: 1,
                    padding: "10px 6px",
                    borderRadius: "var(--radius-md)",
                    border: `1.5px solid ${linkType === opt.key ? "var(--accent)" : "var(--border)"}`,
                    background:
                      linkType === opt.key
                        ? "var(--accent-subtle)"
                        : "var(--surface)",
                    color:
                      linkType === opt.key
                        ? "var(--accent)"
                        : "var(--text-secondary)",
                    fontWeight: 600,
                    fontSize: "var(--text-xs)",
                    cursor: "pointer",
                    textAlign: "center",
                  }}
                >
                  <div>{opt.label}</div>
                  <div
                    style={{ fontSize: "10px", opacity: 0.7, marginTop: "2px" }}
                  >
                    {opt.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Charges → multi-section picker */}
          {linkType === "charges" && (
            <div style={{ marginBottom: "20px" }}>
              <label className="field-label">Sections</label>
              <p
                style={{
                  fontSize: "var(--text-xs)",
                  color: "var(--text-tertiary)",
                  marginBottom: "8px",
                }}
              >
                Sélectionnez une ou plusieurs sections
              </p>
              <div
                style={{ display: "flex", flexDirection: "column", gap: "6px" }}
              >
                {sections.map((s) => {
                  const isSelected = sectionIds.includes(s.id);
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        setSectionIds((prev) =>
                          prev.includes(s.id)
                            ? prev.filter((id) => id !== s.id)
                            : [...prev, s.id],
                        );
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        padding: "10px 14px",
                        borderRadius: "var(--radius-md)",
                        border: `1.5px solid ${isSelected ? s.color : "var(--border)"}`,
                        background: isSelected
                          ? `${s.color}18`
                          : "var(--surface)",
                        cursor: "pointer",
                        textAlign: "left",
                      }}
                    >
                      <span style={{ fontSize: "1.1rem" }}>{s.icon}</span>
                      <span
                        style={{
                          fontWeight: 600,
                          fontSize: "var(--text-sm)",
                          color: "var(--text-primary)",
                        }}
                      >
                        {s.name}
                      </span>
                      {isSelected && (
                        <span
                          style={{
                            marginLeft: "auto",
                            color: s.color,
                            fontWeight: 700,
                          }}
                        >
                          ✓
                        </span>
                      )}
                    </button>
                  );
                })}
                {sections.length === 0 && (
                  <p
                    style={{
                      fontSize: "var(--text-xs)",
                      color: "var(--text-tertiary)",
                    }}
                  >
                    Aucune section configurée
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Savings → project picker */}
          {linkType === "savings" && (
            <div style={{ marginBottom: "20px" }}>
              <label className="field-label">Projet d&apos;épargne</label>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                  marginTop: "8px",
                }}
              >
                {projects.map((p) => {
                  const saved = Number(p.saved_amount ?? 0);
                  const target = Number(p.target_amount ?? 0);
                  const pct =
                    target > 0 ? Math.min((saved / target) * 100, 100) : null;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setProjectId(p.id)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        padding: "10px 14px",
                        borderRadius: "var(--radius-md)",
                        border: `1.5px solid ${projectId === p.id ? "var(--accent)" : "var(--border)"}`,
                        background:
                          projectId === p.id
                            ? "var(--accent-subtle)"
                            : "var(--surface)",
                        cursor: "pointer",
                        textAlign: "left",
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontWeight: 600,
                            fontSize: "var(--text-sm)",
                            color: "var(--text-primary)",
                          }}
                        >
                          {p.name}
                        </div>
                        {target > 0 ? (
                          <div
                            style={{
                              fontSize: "var(--text-xs)",
                              color: "var(--text-tertiary)",
                              marginTop: "2px",
                            }}
                          >
                            {formatCAD(saved)} / {formatCAD(target)} ·{" "}
                            {pct?.toFixed(0)}%
                          </div>
                        ) : (
                          <div
                            style={{
                              fontSize: "var(--text-xs)",
                              color: "var(--text-tertiary)",
                              marginTop: "2px",
                            }}
                          >
                            {formatCAD(saved)} accumulé
                          </div>
                        )}
                      </div>
                      {projectId === p.id && (
                        <span
                          style={{
                            color: "var(--accent)",
                            fontWeight: 700,
                            flexShrink: 0,
                          }}
                        >
                          ✓
                        </span>
                      )}
                    </button>
                  );
                })}
                {projects.length === 0 && (
                  <p
                    style={{
                      fontSize: "var(--text-xs)",
                      color: "var(--text-tertiary)",
                    }}
                  >
                    Aucun projet d&apos;épargne configuré
                  </p>
                )}
              </div>
              {autoEndMonth ? (
                <p
                  style={{
                    fontSize: "var(--text-xs)",
                    color: "var(--text-tertiary)",
                    marginTop: "8px",
                  }}
                >
                  Date de fin calculée automatiquement : {autoEndMonth}
                </p>
              ) : (
                <div style={{ marginTop: "12px" }}>
                  <label
                    htmlFor="allocation-end-month-savings"
                    className="field-label"
                  >
                    Date de fin (optionnel)
                  </label>
                  <input
                    id="allocation-end-month-savings"
                    type="month"
                    value={endMonth}
                    onChange={(e) => setEndMonth(e.target.value)}
                    className="input-field"
                    style={{ marginTop: "6px" }}
                  />
                </div>
              )}
            </div>
          )}

          {/* Free → optional end_month */}
          {linkType === "free" && (
            <div style={{ marginBottom: "20px" }}>
              <label
                htmlFor="allocation-end-month-free"
                className="field-label"
              >
                Date de fin (optionnel)
              </label>
              <p
                style={{
                  fontSize: "var(--text-xs)",
                  color: "var(--text-tertiary)",
                  marginBottom: "6px",
                }}
              >
                Laisser vide pour une allocation permanente
              </p>
              <input
                id="allocation-end-month-free"
                type="month"
                value={endMonth}
                onChange={(e) => setEndMonth(e.target.value)}
                className="input-field"
              />
            </div>
          )}

          {/* Color */}
          <div style={{ marginBottom: "24px" }}>
            <label
              className="field-label"
              style={{ marginBottom: "10px", display: "block" }}
            >
              Couleur
            </label>
            <div className="flex" style={{ gap: "8px", flexWrap: "wrap" }}>
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    background: c,
                    border:
                      color === c
                        ? "3px solid var(--text-primary)"
                        : "3px solid transparent",
                    cursor: "pointer",
                    outline: color === c ? `2px solid ${c}` : "none",
                    outlineOffset: "2px",
                  }}
                />
              ))}
            </div>
          </div>

          {/* Live disponible counter */}
          <div
            style={{
              padding: "12px 16px",
              borderRadius: "var(--radius-md)",
              background: isOverAllocated
                ? "var(--warning-subtle)"
                : "var(--surface-secondary)",
              marginBottom: "20px",
              fontSize: "var(--text-xs)",
            }}
          >
            <div
              className="flex items-center"
              style={{ justifyContent: "space-between" }}
            >
              <span style={{ color: "var(--text-secondary)" }}>
                Total alloué
              </span>
              <span style={{ fontWeight: 600 }}>{formatCAD(newTotal)}</span>
            </div>
            <div
              className="flex items-center"
              style={{ justifyContent: "space-between", marginTop: "4px" }}
            >
              <span style={{ color: "var(--text-secondary)" }}>
                Revenu mensuel
              </span>
              <span style={{ fontWeight: 600 }}>
                {formatCAD(expectedMonthlyIncome)}
              </span>
            </div>
            <div
              style={{
                height: "1px",
                background: "var(--border)",
                margin: "8px 0",
              }}
            />
            <div
              className="flex items-center"
              style={{ justifyContent: "space-between" }}
            >
              <span
                style={{
                  fontWeight: 700,
                  color: isOverAllocated
                    ? "var(--warning-text)"
                    : "var(--text-primary)",
                }}
              >
                Disponible
              </span>
              <span
                style={{
                  fontWeight: 700,
                  color: isOverAllocated
                    ? "var(--warning-text)"
                    : "var(--positive)",
                }}
              >
                {isOverAllocated ? "⚠ " : ""}
                {formatCAD(disponible)}
              </span>
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={saving || !label.trim() || amtNum <= 0}
            className="btn-primary"
            style={{
              width: "100%",
              padding: "16px",
              fontSize: "var(--text-base)",
            }}
          >
            {saving
              ? "Enregistrement..."
              : isEdit
                ? "Enregistrer"
                : "Ajouter l'enveloppe"}
          </button>
        </div>
      </div>
    </div>
  );
}
