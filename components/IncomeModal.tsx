"use client";

import { useState, useRef, useEffect } from "react";
import { createIncome, updateIncome } from "@/lib/actions/incomes";
import { IconClose, IconCheck } from "@/components/icons";
import type { Income, IncomeFrequency, IncomeSource } from "@/lib/types";

// ── Type/frequency options ────────────────────────────────────────────────────

type SourceOption = { value: IncomeSource; label: string; emoji: string };
type FreqOption = { value: IncomeFrequency; label: string };

const SOURCE_OPTIONS: SourceOption[] = [
  { value: "EMPLOYMENT", label: "Emploi", emoji: "💼" },
  { value: "BUSINESS", label: "Business", emoji: "🏢" },
  { value: "INVESTMENT", label: "Investissement", emoji: "📈" },
  { value: "OTHER", label: "Autre", emoji: "🔧" },
];

const FREQ_OPTIONS: FreqOption[] = [
  { value: "MONTHLY", label: "Mensuel" },
  { value: "BIWEEKLY", label: "Bi-hebdomadaire" },
  { value: "YEARLY", label: "Annuel" },
  { value: "VARIABLE", label: "Variable" },
];

// ── Shared style helpers ──────────────────────────────────────────────────────

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "11px",
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "var(--slate-500)",
  marginBottom: "8px",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  border: "1px solid var(--slate-200)",
  borderRadius: "var(--radius-sm)",
  fontFamily: "var(--font)",
  fontSize: "15px",
  fontWeight: 500,
  color: "var(--slate-900)",
  background: "#FFFFFF",
  transition: "border-color 0.2s, box-shadow 0.2s",
  letterSpacing: "-0.01em",
  WebkitAppearance: "none",
  appearance: "none",
  outline: "none",
  boxSizing: "border-box",
};

// ── Props ────────────────────────────────────────────────────────────────────

type Props = {
  income?: Income;
  onClose: () => void;
};

// ── Component ────────────────────────────────────────────────────────────────

export default function IncomeModal({ income, onClose }: Props) {
  const isEdit = !!income;

  const [name, setName] = useState(income?.name ?? "");
  const [source, setSource] = useState<IncomeSource>(
    income?.source ?? "EMPLOYMENT",
  );
  const [frequency, setFrequency] = useState<IncomeFrequency>(
    income?.frequency ?? "MONTHLY",
  );
  const [amount, setAmount] = useState(
    income?.frequency !== "VARIABLE" ? (income?.amount?.toString() ?? "") : "",
  );
  const [estimatedAmount, setEstimatedAmount] = useState(
    income?.estimated_amount?.toString() ?? "",
  );
  const [payAnchorDate, setPayAnchorDate] = useState(() => {
    const d = income?.pay_anchor_date;
    if (!d) return "";
    if (d instanceof Date) return d.toISOString().slice(0, 10);
    return String(d).slice(0, 10);
  });
  const [autoDeposit, setAutoDeposit] = useState(income?.auto_deposit ?? false);
  const [notes, setNotes] = useState(income?.notes ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    dialogRef.current?.focus();
  }, []);

  const isVariable = frequency === "VARIABLE";
  const showAnchorDate = !isVariable && frequency === "BIWEEKLY";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Le nom est requis");
      return;
    }
    if (!isVariable && !amount) {
      setError("Le montant est requis pour un revenu fixe");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = {
        name: name.trim(),
        source,
        amount: isVariable ? null : parseFloat(amount),
        estimated_amount: estimatedAmount ? parseFloat(estimatedAmount) : null,
        frequency,
        pay_anchor_date: showAnchorDate && payAnchorDate ? payAnchorDate : null,
        auto_deposit: !isVariable ? autoDeposit : false,
        notes: notes.trim() || null,
      };
      if (isEdit && income) {
        await updateIncome(income.id, data);
      } else {
        await createIncome(data);
      }
      onClose();
    } catch {
      setError("Erreur lors de la sauvegarde");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* ── Styles injected once per mount ── */}
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(100%); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: translate(-50%, -50%) scale(0.95); }
          to   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
        @keyframes backdropIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        .income-modal-input:focus {
          border-color: var(--teal-700) !important;
          box-shadow: 0 0 0 3px rgba(15, 118, 110, 0.08) !important;
        }
        .income-modal-input::placeholder {
          color: var(--slate-300);
          font-weight: 400;
        }
        .income-modal-amount-input:focus {
          border-color: var(--teal-700) !important;
          box-shadow: 0 0 0 3px rgba(15, 118, 110, 0.08) !important;
        }
        .income-modal-amount-input::placeholder {
          color: var(--slate-300);
          font-weight: 500;
          font-size: 18px;
        }

        /* Mobile: bottom sheet */
        .income-modal-container {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          z-index: 210;
          max-height: calc(100dvh - 40px);
          overflow-y: auto;
          background: #FFFFFF;
          border-radius: var(--radius-lg) var(--radius-lg) 0 0;
          box-shadow: 0 -8px 32px rgba(15, 23, 42, 0.18), 0 -2px 8px rgba(15, 118, 110, 0.06);
          animation: slideUp 0.35s cubic-bezier(0.32, 0.72, 0, 1) both;
          overscroll-behavior: contain;
        }

        /* Desktop: centered card */
        @media (min-width: 640px) {
          .income-modal-container {
            position: fixed;
            top: 50%;
            left: 50%;
            bottom: auto;
            right: auto;
            transform: translate(-50%, -50%);
            width: calc(100% - 40px);
            max-width: 520px;
            max-height: calc(100dvh - 48px);
            border-radius: var(--radius-lg);
            box-shadow: 0 24px 48px rgba(15, 23, 42, 0.18), 0 8px 16px rgba(15, 118, 110, 0.06);
            animation: scaleIn 0.3s ease both;
          }
          .income-modal-handle { display: none !important; }
          .income-modal-header { padding: 24px 24px 0 !important; }
          .income-modal-body   { padding: 24px 24px 0 !important; }
          .income-modal-actions { padding: 20px 24px !important; }
        }

        .chip-source-btn:hover {
          border-color: var(--teal-700) !important;
          background: var(--slate-50) !important;
        }
        .chip-freq-btn:hover {
          border-color: var(--teal-700) !important;
          background: var(--slate-50) !important;
        }
      `}</style>

      {/* ── Backdrop ── */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(15, 23, 42, 0.5)",
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
          zIndex: 200,
          animation: "backdropIn 0.25s ease both",
        }}
        onClick={onClose}
        role="presentation"
      />

      {/* ── Modal ── */}
      <div
        ref={dialogRef}
        className="income-modal-container"
        role="dialog"
        aria-modal="true"
        aria-labelledby="income-dialog-title"
        tabIndex={-1}
        onKeyDown={(e) => e.key === "Escape" && onClose()}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle (mobile) */}
        <div
          className="income-modal-handle"
          style={{
            display: "flex",
            justifyContent: "center",
            padding: "12px 0 4px",
          }}
        >
          <span
            style={{
              width: "36px",
              height: "4px",
              borderRadius: "2px",
              background: "var(--slate-300)",
              display: "block",
            }}
          />
        </div>

        {/* ── Header ── */}
        <div
          className="income-modal-header"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "8px 20px 0",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "var(--radius-sm)",
                background: "var(--teal-50)",
              }}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                width="20"
                height="20"
                style={{ color: "var(--teal-700)" }}
              >
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                <polyline points="17 6 23 6 23 12" />
              </svg>
            </div>
            <h3
              id="income-dialog-title"
              style={{
                fontSize: "18px",
                fontWeight: 700,
                color: "var(--slate-900)",
                letterSpacing: "-0.02em",
              }}
            >
              {isEdit ? "Modifier la source" : "Nouvelle source"}
            </h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Fermer"
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
              transition: "all 0.15s",
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--slate-200)";
              e.currentTarget.style.color = "var(--slate-900)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "var(--slate-100)";
              e.currentTarget.style.color = "var(--slate-500)";
            }}
          >
            <IconClose size={18} />
          </button>
        </div>

        {/* ── Body ── */}
        <form onSubmit={handleSubmit}>
          <div className="income-modal-body" style={{ padding: "20px 20px 0" }}>
            {/* Name */}
            <div style={{ marginBottom: "18px" }}>
              <label htmlFor="income-name" style={labelStyle}>
                Nom de la source
              </label>
              <input
                id="income-name"
                type="text"
                className="income-modal-input"
                placeholder="ex: Salaire Employeur"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={inputStyle}
              />
            </div>

            {/* Source type — chips */}
            <div style={{ marginBottom: "18px" }}>
              <label style={labelStyle}>Type de source</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {SOURCE_OPTIONS.map((opt) => {
                  const active = source === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      className={active ? "" : "chip-source-btn"}
                      onClick={() => setSource(opt.value)}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "10px 16px",
                        background: active ? "var(--teal-50)" : "#FFFFFF",
                        border: `1.5px solid ${active ? "var(--teal-700)" : "var(--slate-200)"}`,
                        borderRadius: "var(--radius-sm)",
                        fontFamily: "var(--font)",
                        fontSize: "14px",
                        fontWeight: 600,
                        color: active ? "var(--teal-700)" : "var(--slate-700)",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        letterSpacing: "-0.01em",
                        whiteSpace: "nowrap",
                      }}
                    >
                      <span style={{ fontSize: "16px", lineHeight: 1 }}>
                        {opt.emoji}
                      </span>
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Frequency — chips */}
            <div style={{ marginBottom: "18px" }}>
              <label style={labelStyle}>Frequence</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {FREQ_OPTIONS.map((opt) => {
                  const active = frequency === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      className={active ? "" : "chip-freq-btn"}
                      onClick={() => setFrequency(opt.value)}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "10px 16px",
                        background: active ? "var(--teal-50)" : "#FFFFFF",
                        border: `1.5px solid ${active ? "var(--teal-700)" : "var(--slate-200)"}`,
                        borderRadius: "var(--radius-sm)",
                        fontFamily: "var(--font)",
                        fontSize: "14px",
                        fontWeight: 600,
                        color: active ? "var(--teal-700)" : "var(--slate-700)",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        letterSpacing: "-0.01em",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Variable note */}
            {isVariable && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "10px 14px",
                  background: "var(--warning-light)",
                  borderRadius: "var(--radius-sm)",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "var(--amber-600)",
                  marginBottom: "18px",
                  letterSpacing: "-0.01em",
                }}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  width="16"
                  height="16"
                  style={{ flexShrink: 0 }}
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
                Ce revenu varie d&apos;un mois a l&apos;autre. Le montant estime
                sert pour tes previsions.
              </div>
            )}

            {/* Fixed amount — hidden for VARIABLE */}
            {!isVariable && (
              <div style={{ marginBottom: "18px" }}>
                <label htmlFor="income-amount" style={labelStyle}>
                  Montant
                </label>
                <div style={{ position: "relative" }}>
                  <span
                    style={{
                      position: "absolute",
                      left: "14px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      fontSize: "20px",
                      fontWeight: 700,
                      color: "var(--teal-700)",
                      pointerEvents: "none",
                    }}
                  >
                    $
                  </span>
                  <input
                    id="income-amount"
                    type="text"
                    inputMode="numeric"
                    className="income-modal-amount-input"
                    placeholder="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "14px 14px 14px 36px",
                      border: "1px solid var(--slate-200)",
                      borderRadius: "var(--radius-sm)",
                      fontFamily: "var(--font)",
                      fontSize: "24px",
                      fontWeight: 800,
                      letterSpacing: "-0.03em",
                      color: "var(--slate-900)",
                      background: "#FFFFFF",
                      transition: "border-color 0.2s, box-shadow 0.2s",
                      fontVariantNumeric: "tabular-nums",
                      WebkitAppearance: "none",
                      appearance: "none",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>
            )}

            {/* Estimated amount — shown for VARIABLE */}
            {isVariable && (
              <div style={{ marginBottom: "18px" }}>
                <label htmlFor="income-estimated-amount" style={labelStyle}>
                  Montant estime (pour les previsions)
                </label>
                <div style={{ position: "relative" }}>
                  <span
                    style={{
                      position: "absolute",
                      left: "14px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      fontSize: "20px",
                      fontWeight: 700,
                      color: "var(--teal-700)",
                      pointerEvents: "none",
                    }}
                  >
                    ~$
                  </span>
                  <input
                    id="income-estimated-amount"
                    type="text"
                    inputMode="numeric"
                    className="income-modal-amount-input"
                    placeholder="0"
                    value={estimatedAmount}
                    onChange={(e) => setEstimatedAmount(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "14px 14px 14px 52px",
                      border: "1px solid var(--slate-200)",
                      borderRadius: "var(--radius-sm)",
                      fontFamily: "var(--font)",
                      fontSize: "24px",
                      fontWeight: 800,
                      letterSpacing: "-0.03em",
                      color: "var(--slate-900)",
                      background: "#FFFFFF",
                      transition: "border-color 0.2s, box-shadow 0.2s",
                      fontVariantNumeric: "tabular-nums",
                      WebkitAppearance: "none",
                      appearance: "none",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
                <p
                  style={{
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "var(--amber-600)",
                    marginTop: "6px",
                    letterSpacing: "-0.01em",
                  }}
                >
                  Utilise pour calculer tes revenus mensuels prevus
                </p>
              </div>
            )}

            {/* Anchor date — BIWEEKLY only */}
            {showAnchorDate && (
              <div style={{ marginBottom: "18px" }}>
                <label htmlFor="income-anchor-date" style={labelStyle}>
                  Date d&apos;ancrage du paiement
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    id="income-anchor-date"
                    type="date"
                    className="income-modal-input"
                    value={payAnchorDate}
                    onChange={(e) => setPayAnchorDate(e.target.value)}
                    style={{ ...inputStyle, paddingRight: "42px" }}
                  />
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    width="18"
                    height="18"
                    style={{
                      position: "absolute",
                      right: "14px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "var(--slate-400)",
                      pointerEvents: "none",
                    }}
                  >
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                </div>
                <p
                  style={{
                    fontSize: "12px",
                    fontWeight: 500,
                    color: "var(--slate-400)",
                    marginTop: "6px",
                    letterSpacing: "-0.01em",
                  }}
                >
                  Date d&apos;une prochaine paie — la suivante sera calculee
                  automatiquement
                </p>
              </div>
            )}

            {/* Auto deposit toggle — hidden for VARIABLE */}
            {!isVariable && (
              <div style={{ marginBottom: "18px" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "14px 16px",
                    background: "var(--slate-50)",
                    borderRadius: "var(--radius-sm)",
                    gap: "12px",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: "14px",
                        fontWeight: 700,
                        color: "var(--slate-900)",
                        letterSpacing: "-0.01em",
                      }}
                    >
                      Depot automatique
                    </div>
                    <div
                      style={{
                        fontSize: "12px",
                        fontWeight: 400,
                        color: "var(--slate-500)",
                        marginTop: "2px",
                        lineHeight: 1.4,
                      }}
                    >
                      Marquer le revenu comme recu sans action de ta part
                    </div>
                  </div>
                  <label
                    style={{
                      position: "relative",
                      width: "48px",
                      height: "28px",
                      flexShrink: 0,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={autoDeposit}
                      onChange={(e) => setAutoDeposit(e.target.checked)}
                      style={{
                        opacity: 0,
                        width: 0,
                        height: 0,
                        position: "absolute",
                      }}
                    />
                    <span
                      onClick={() => setAutoDeposit((prev) => !prev)}
                      style={{
                        position: "absolute",
                        inset: 0,
                        background: autoDeposit
                          ? "var(--teal-700)"
                          : "var(--slate-300)",
                        borderRadius: "14px",
                        transition: "background 0.2s ease",
                        cursor: "pointer",
                      }}
                    >
                      <span
                        style={{
                          position: "absolute",
                          top: "3px",
                          left: autoDeposit ? "23px" : "3px",
                          width: "22px",
                          height: "22px",
                          borderRadius: "50%",
                          background: "#FFFFFF",
                          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.15)",
                          transition: "left 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                          display: "block",
                        }}
                      />
                    </span>
                  </label>
                </div>
              </div>
            )}

            {/* Notes */}
            <div style={{ marginBottom: "4px" }}>
              <label htmlFor="income-notes" style={labelStyle}>
                Notes{" "}
                <span
                  style={{
                    fontWeight: 500,
                    textTransform: "none",
                    letterSpacing: 0,
                    color: "var(--slate-400)",
                  }}
                >
                  (optionnel)
                </span>
              </label>
              <textarea
                id="income-notes"
                className="income-modal-input"
                placeholder="ex: Contrat de consultation mensuel"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                style={{
                  ...inputStyle,
                  resize: "vertical",
                  minHeight: "72px",
                  lineHeight: 1.5,
                }}
              />
            </div>

            {/* Error */}
            {error && (
              <p
                style={{
                  fontSize: "14px",
                  color: "var(--error)",
                  background: "var(--error-light)",
                  padding: "10px 14px",
                  borderRadius: "var(--radius-sm)",
                  marginTop: "12px",
                  fontWeight: 500,
                }}
              >
                {error}
              </p>
            )}
          </div>

          {/* ── Actions ── */}
          <div
            className="income-modal-actions"
            style={{
              display: "flex",
              gap: "12px",
              padding: "16px 20px",
              paddingBottom: "max(20px, env(safe-area-inset-bottom))",
              borderTop: "1px solid var(--slate-100)",
              background: "#FFFFFF",
              position: "sticky",
              bottom: 0,
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: "14px",
                background: "#FFFFFF",
                color: "var(--slate-700)",
                border: "1px solid var(--slate-200)",
                borderRadius: "var(--radius-md)",
                fontFamily: "var(--font)",
                fontSize: "15px",
                fontWeight: 600,
                cursor: "pointer",
                letterSpacing: "-0.01em",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--slate-50)";
                e.currentTarget.style.borderColor = "var(--slate-300)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#FFFFFF";
                e.currentTarget.style.borderColor = "var(--slate-200)";
              }}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 1.4,
                padding: "14px",
                background: loading ? "var(--slate-300)" : "var(--teal-700)",
                color: "#FFFFFF",
                border: "none",
                borderRadius: "var(--radius-md)",
                fontFamily: "var(--font)",
                fontSize: "15px",
                fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer",
                letterSpacing: "-0.01em",
                transition: "all 0.2s",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                opacity: loading ? 0.7 : 1,
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.background = "var(--teal-800)";
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.boxShadow =
                    "0 4px 12px rgba(15, 118, 110, 0.08)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = loading
                  ? "var(--slate-300)"
                  : "var(--teal-700)";
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              {!loading && <IconCheck size={18} />}
              {loading
                ? "Enregistrement..."
                : isEdit
                  ? "Modifier"
                  : "Enregistrer"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
