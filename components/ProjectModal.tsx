"use client";

import { useState } from "react";

import { calcMonthlySuggested } from "@/lib/utils";
import type { Section } from "@/lib/types";

type Props = {
  sections: Section[];
  onClose: () => void;
};

export default function ProjectModal({ sections, onClose }: Props) {
  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [initialAmount, setInitialAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const monthlySuggested =
    targetAmount && targetDate
      ? calcMonthlySuggested(
          parseFloat(targetAmount),
          parseFloat(initialAmount || "0"),
          targetDate,
        )
      : null;

  const monthsRemaining = targetDate
    ? Math.max(
        0,
        Math.ceil(
          (new Date(targetDate).getTime() - Date.now()) /
            (1000 * 60 * 60 * 24 * 30.44),
        ),
      )
    : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Nom requis");
      return;
    }
    if (!targetAmount) {
      setError("Objectif requis");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const { createExpense } = await import("@/lib/actions/expenses");
      await createExpense({
        name: name.trim(),
        amount: 0,
        type: "PLANNED",
        section_id: sectionId || undefined,
        target_amount: parseFloat(targetAmount),
        target_date: targetDate || undefined,
        saved_amount: initialAmount ? parseFloat(initialAmount) : 0,
      });
      onClose();
    } catch {
      setError("Erreur lors de la création");
      setLoading(false);
    }
  }

  return (
    <div
      className="sheet-backdrop"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />

        {/* Sheet header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 24px 0",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "var(--radius-sm)",
                background: "var(--teal-50)",
                color: "var(--teal-700)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M19 5c-1.5 0-2.8 1.4-3 2-3.5-1.5-11-.3-11 5 0 1.8 0 3 2 4.5V20h4v-2h3v2h4v-4c1-.5 1.7-1 2-2h2v-4h-2c0-1-.5-1.5-1-2" />
                <path d="M2 9v1c0 1.1.9 2 2 2h1" />
                <circle cx="16" cy="11" r="1" />
              </svg>
            </div>
            <h3
              style={{
                fontSize: "18px",
                fontWeight: 700,
                color: "var(--slate-900)",
                letterSpacing: "-0.02em",
              }}
            >
              Nouveau projet
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{
              width: "36px",
              height: "36px",
              border: "none",
              background: "var(--slate-100)",
              borderRadius: "var(--radius-sm)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "var(--slate-500)",
              flexShrink: 0,
            }}
            aria-label="Fermer"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Sheet body */}
        <div style={{ padding: "20px 24px 24px" }}>
          <form
            id="project-form"
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", gap: "0" }}
          >
            {/* Nom */}
            <div style={{ marginBottom: "18px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "11px",
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "var(--slate-400)",
                  marginBottom: "7px",
                }}
              >
                Nom du projet
              </label>
              <input
                type="text"
                placeholder="ex: Vacances, Voiture, Urgences..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-field"
              />
            </div>

            {/* Objectif */}
            <div style={{ marginBottom: "18px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "11px",
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "var(--slate-400)",
                  marginBottom: "7px",
                }}
              >
                Objectif
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "14px",
                    paddingRight: "36px",
                    border: "1px solid var(--slate-200)",
                    borderRadius: "var(--radius-sm)",
                    fontFamily: "var(--font)",
                    fontSize: "24px",
                    fontWeight: 800,
                    letterSpacing: "-0.03em",
                    color: "var(--slate-900)",
                    background: "var(--white, #fff)",
                    fontVariantNumeric: "tabular-nums",
                    outline: "none",
                  }}
                />
                <span
                  style={{
                    position: "absolute",
                    right: "14px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    fontSize: "16px",
                    fontWeight: 700,
                    color: "var(--teal-700)",
                    pointerEvents: "none",
                  }}
                >
                  $
                </span>
              </div>
            </div>

            {/* Date cible */}
            <div style={{ marginBottom: "18px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "11px",
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "var(--slate-400)",
                  marginBottom: "7px",
                }}
              >
                Date cible
              </label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="input-field"
              />
            </div>

            {/* Montant initial (optionnel) */}
            <div style={{ marginBottom: "18px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "11px",
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "var(--slate-400)",
                  marginBottom: "7px",
                }}
              >
                Montant déjà épargné (optionnel)
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0"
                  value={initialAmount}
                  onChange={(e) => setInitialAmount(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "14px",
                    paddingRight: "36px",
                    border: "1px solid var(--slate-200)",
                    borderRadius: "var(--radius-sm)",
                    fontFamily: "var(--font)",
                    fontSize: "24px",
                    fontWeight: 800,
                    letterSpacing: "-0.03em",
                    color: "var(--slate-900)",
                    background: "var(--white, #fff)",
                    fontVariantNumeric: "tabular-nums",
                    outline: "none",
                  }}
                />
                <span
                  style={{
                    position: "absolute",
                    right: "14px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    fontSize: "16px",
                    fontWeight: 700,
                    color: "var(--teal-700)",
                    pointerEvents: "none",
                  }}
                >
                  $
                </span>
              </div>
            </div>

            {/* Section (optionnel) */}
            {sections.length > 0 && (
              <div style={{ marginBottom: "18px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "11px",
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "var(--slate-400)",
                    marginBottom: "7px",
                  }}
                >
                  Section (optionnel)
                </label>
                <select
                  value={sectionId}
                  onChange={(e) => setSectionId(e.target.value)}
                  className="input-field"
                >
                  <option value="">Aucune</option>
                  {sections.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.icon} {s.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Summary — contribution suggérée */}
            {monthlySuggested !== null && monthlySuggested > 0 && (
              <div
                style={{
                  marginBottom: "18px",
                  padding: "14px",
                  background: "var(--teal-50)",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid rgba(15, 118, 110, 0.08)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "3px 0",
                  }}
                >
                  <span
                    style={{
                      fontSize: "13px",
                      fontWeight: 500,
                      color: "var(--slate-500)",
                    }}
                  >
                    Contribution suggérée
                  </span>
                  <span
                    style={{
                      fontSize: "14px",
                      fontWeight: 700,
                      color: "var(--teal-700)",
                      letterSpacing: "-0.02em",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    ~{Math.ceil(monthlySuggested).toLocaleString("fr-CA")} $ /
                    mois
                  </span>
                </div>
                {monthsRemaining !== null && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "3px 0",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "13px",
                        fontWeight: 500,
                        color: "var(--slate-500)",
                      }}
                    >
                      Temps restant
                    </span>
                    <span
                      style={{
                        fontSize: "14px",
                        fontWeight: 700,
                        color: "var(--slate-900)",
                        letterSpacing: "-0.02em",
                      }}
                    >
                      {monthsRemaining} mois
                    </span>
                  </div>
                )}
              </div>
            )}

            {error && (
              <p
                style={{
                  fontSize: "var(--text-sm)",
                  color: "var(--negative)",
                  background: "var(--negative-subtle)",
                  padding: "8px 12px",
                  borderRadius: "var(--radius-sm)",
                  marginBottom: "18px",
                }}
              >
                {error}
              </p>
            )}
          </form>
        </div>

        {/* Sheet actions — inside the form for proper submission */}
        <div style={{ display: "flex", gap: "10px", padding: "0 24px 24px" }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              flex: 1,
              padding: "14px 20px",
              border: "1px solid var(--slate-200)",
              borderRadius: "var(--radius-md)",
              background: "var(--white, #fff)",
              fontFamily: "var(--font)",
              fontSize: "15px",
              fontWeight: 600,
              color: "var(--slate-700)",
              cursor: "pointer",
            }}
          >
            Annuler
          </button>
          <button
            type="submit"
            form="project-form"
            disabled={loading}
            style={{
              flex: 1.4,
              padding: "14px 20px",
              border: "none",
              borderRadius: "var(--radius-md)",
              background: "var(--teal-700)",
              fontFamily: "var(--font)",
              fontSize: "15px",
              fontWeight: 700,
              color: "var(--white, #fff)",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.5 : 1,
              transition: "all 0.2s ease",
            }}
          >
            {loading ? "Création..." : "Créer le projet"}
          </button>
        </div>
      </div>
    </div>
  );
}
