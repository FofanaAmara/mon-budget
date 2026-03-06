"use client";

import { useState, useRef, useEffect } from "react";

import { IconClose } from "@/components/icons";
import type { Section, Card, Debt, DebtFrequency } from "@/lib/types";

const FREQUENCIES: { value: DebtFrequency; label: string }[] = [
  { value: "WEEKLY", label: "Hebdomadaire" },
  { value: "BIWEEKLY", label: "Aux 2 semaines" },
  { value: "MONTHLY", label: "Mensuel" },
  { value: "QUARTERLY", label: "Trimestriel" },
  { value: "YEARLY", label: "Annuel" },
];

type Props = {
  sections: Section[];
  cards: Card[];
  debt?: Debt | null;
  onClose: () => void;
};

export default function DebtModal({ sections, cards, debt, onClose }: Props) {
  const isEdit = !!debt;
  const [name, setName] = useState(debt?.name ?? "");
  const [originalAmount, setOriginalAmount] = useState(
    debt ? String(debt.original_amount) : "",
  );
  const [remainingBalance, setRemainingBalance] = useState(
    debt ? String(debt.remaining_balance) : "",
  );
  const [interestRate, setInterestRate] = useState(
    debt?.interest_rate != null ? String(debt.interest_rate) : "",
  );
  const [paymentAmount, setPaymentAmount] = useState(
    debt ? String(debt.payment_amount) : "",
  );
  const [paymentFrequency, setPaymentFrequency] = useState<DebtFrequency>(
    debt?.payment_frequency ?? "MONTHLY",
  );
  const [paymentDay, setPaymentDay] = useState(
    debt?.payment_day != null ? String(debt.payment_day) : "",
  );
  const [autoDebit, setAutoDebit] = useState(debt?.auto_debit ?? false);
  const [cardId, setCardId] = useState(debt?.card_id ?? "");
  const [sectionId, setSectionId] = useState(debt?.section_id ?? "");
  const [notes, setNotes] = useState(debt?.notes ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    dialogRef.current?.focus();
  }, []);

  // Auto-calculate duration and interest cost
  const remaining =
    parseFloat(remainingBalance) || parseFloat(originalAmount) || 0;
  const rate = parseFloat(interestRate) || 0;
  const payment = parseFloat(paymentAmount) || 0;
  let estimatedMonths: number | null = null;
  let totalInterest: number | null = null;
  if (payment > 0 && remaining > 0) {
    if (rate === 0) {
      estimatedMonths = Math.ceil(remaining / payment);
      totalInterest = 0;
    } else {
      const monthlyRate = rate / 100 / 12;
      estimatedMonths = Math.ceil(
        -Math.log(1 - (monthlyRate * remaining) / payment) /
          Math.log(1 + monthlyRate),
      );
      if (isFinite(estimatedMonths) && estimatedMonths > 0) {
        totalInterest = payment * estimatedMonths - remaining;
      }
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Nom requis");
      return;
    }
    if (!originalAmount) {
      setError("Montant initial requis");
      return;
    }
    if (!paymentAmount) {
      setError("Montant du versement requis");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const payload = {
        name: name.trim(),
        original_amount: parseFloat(originalAmount),
        remaining_balance: remainingBalance
          ? parseFloat(remainingBalance)
          : parseFloat(originalAmount),
        interest_rate: interestRate ? parseFloat(interestRate) : null,
        payment_amount: parseFloat(paymentAmount),
        payment_frequency: paymentFrequency,
        payment_day: paymentDay ? parseInt(paymentDay) : null,
        auto_debit: autoDebit,
        card_id: cardId || null,
        section_id: sectionId || null,
        notes: notes.trim() || null,
      };

      if (isEdit) {
        const { updateDebt } = await import("@/lib/actions/debts");
        await updateDebt(debt.id, payload);
      } else {
        const { createDebt } = await import("@/lib/actions/debts");
        await createDebt(payload);
      }
      onClose();
    } catch {
      setError(
        isEdit
          ? "Erreur lors de la modification"
          : "Erreur lors de la création",
      );
      setLoading(false);
    }
  }

  const labelStyle = {
    display: "block" as const,
    fontSize: "11px",
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase" as const,
    color: "var(--slate-400)",
    marginBottom: "7px",
  };

  return (
    <div
      className="sheet-backdrop"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="presentation"
    >
      <div
        ref={dialogRef}
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="debt-dialog-title"
        tabIndex={-1}
        onKeyDown={(e) => e.key === "Escape" && onClose()}
        onClick={(e) => e.stopPropagation()}
      >
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
                background: "var(--error-light)",
                color: "var(--error)",
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
                <rect x="2" y="5" width="20" height="14" rx="2" />
                <line x1="2" y1="10" x2="22" y2="10" />
              </svg>
            </div>
            <h3
              id="debt-dialog-title"
              style={{
                fontSize: "18px",
                fontWeight: 700,
                color: "var(--slate-900)",
                letterSpacing: "-0.02em",
              }}
            >
              {isEdit ? "Modifier la dette" : "Nouvelle dette"}
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
            <IconClose size={18} />
          </button>
        </div>

        {/* Sheet body */}
        <div
          style={{
            padding: "20px 24px 24px",
            maxHeight: "70vh",
            overflowY: "auto",
          }}
        >
          <form
            id="debt-form"
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", gap: "0" }}
          >
            {/* Nom */}
            <div style={{ marginBottom: "18px" }}>
              <label htmlFor="debt-name" style={labelStyle}>
                Nom de la dette
              </label>
              <input
                id="debt-name"
                type="text"
                placeholder="ex: Prêt auto, Carte Visa..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-field"
              />
            </div>

            {/* Solde restant */}
            <div style={{ marginBottom: "18px" }}>
              <label htmlFor="debt-remaining" style={labelStyle}>
                Solde restant
              </label>
              <div style={{ position: "relative" }}>
                <input
                  id="debt-remaining"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0"
                  value={remainingBalance}
                  onChange={(e) => setRemainingBalance(e.target.value)}
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

            {/* Taux d'intérêt */}
            <div style={{ marginBottom: "18px" }}>
              <label htmlFor="debt-interest" style={labelStyle}>
                Taux d&apos;intérêt annuel
              </label>
              <div style={{ position: "relative" }}>
                <input
                  id="debt-interest"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0"
                  value={interestRate}
                  onChange={(e) => setInterestRate(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px 36px 12px 14px",
                    border: "1px solid var(--slate-200)",
                    borderRadius: "var(--radius-sm)",
                    fontFamily: "var(--font)",
                    fontSize: "15px",
                    fontWeight: 500,
                    color: "var(--slate-900)",
                    background: "var(--white, #fff)",
                    outline: "none",
                  }}
                />
                <span
                  style={{
                    position: "absolute",
                    right: "14px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    fontSize: "14px",
                    fontWeight: 700,
                    color: "var(--slate-400)",
                    pointerEvents: "none",
                  }}
                >
                  %
                </span>
              </div>
            </div>

            {/* Paiement mensuel */}
            <div style={{ marginBottom: "18px" }}>
              <label htmlFor="debt-payment" style={labelStyle}>
                Paiement mensuel
              </label>
              <div style={{ position: "relative" }}>
                <input
                  id="debt-payment"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
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

            {/* Montant initial (for tracking %) */}
            <div style={{ marginBottom: "18px" }}>
              <label htmlFor="debt-original" style={labelStyle}>
                Montant original (pour suivi)
              </label>
              <div style={{ position: "relative" }}>
                <input
                  id="debt-original"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0"
                  value={originalAmount}
                  onChange={(e) => setOriginalAmount(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px",
                    paddingRight: "36px",
                    border: "1px solid var(--slate-200)",
                    borderRadius: "var(--radius-sm)",
                    fontFamily: "var(--font)",
                    fontSize: "15px",
                    fontWeight: 500,
                    color: "var(--slate-900)",
                    background: "var(--white, #fff)",
                    outline: "none",
                  }}
                />
                <span
                  style={{
                    position: "absolute",
                    right: "14px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    fontSize: "14px",
                    fontWeight: 700,
                    color: "var(--teal-700)",
                    pointerEvents: "none",
                  }}
                >
                  $
                </span>
              </div>
            </div>

            {/* Frequency + Payment day */}
            <div style={{ display: "flex", gap: "12px", marginBottom: "18px" }}>
              <div style={{ flex: 1 }}>
                <label htmlFor="debt-frequency" style={labelStyle}>
                  Fréquence
                </label>
                <select
                  id="debt-frequency"
                  value={paymentFrequency}
                  onChange={(e) =>
                    setPaymentFrequency(e.target.value as DebtFrequency)
                  }
                  className="input-field"
                >
                  {FREQUENCIES.map((f) => (
                    <option key={f.value} value={f.value}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label htmlFor="debt-pay-day" style={labelStyle}>
                  Jour de paiement
                </label>
                <input
                  id="debt-pay-day"
                  type="number"
                  min="1"
                  max="31"
                  placeholder="15"
                  value={paymentDay}
                  onChange={(e) => setPaymentDay(e.target.value)}
                  className="input-field"
                  style={{ fontVariantNumeric: "tabular-nums" }}
                />
              </div>
            </div>

            {/* Auto-debit */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                marginBottom: "18px",
              }}
            >
              <input
                type="checkbox"
                id="auto-debit"
                checked={autoDebit}
                onChange={(e) => setAutoDebit(e.target.checked)}
                style={{
                  width: "18px",
                  height: "18px",
                  accentColor: "var(--teal-700)",
                }}
              />
              <label
                htmlFor="auto-debit"
                style={{
                  fontSize: "var(--text-sm)",
                  fontWeight: 500,
                  color: "var(--text-secondary)",
                }}
              >
                Prélèvement automatique
              </label>
            </div>

            {/* Card */}
            {cards.length > 0 && (
              <div style={{ marginBottom: "18px" }}>
                <label htmlFor="debt-card" style={labelStyle}>
                  Carte (optionnel)
                </label>
                <select
                  id="debt-card"
                  value={cardId}
                  onChange={(e) => setCardId(e.target.value)}
                  className="input-field"
                >
                  <option value="">Aucune</option>
                  {cards.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                      {c.last_four ? ` •••• ${c.last_four}` : ""}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Section */}
            {sections.length > 0 && (
              <div style={{ marginBottom: "18px" }}>
                <label htmlFor="debt-section" style={labelStyle}>
                  Section (optionnel)
                </label>
                <select
                  id="debt-section"
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

            {/* Notes */}
            <div style={{ marginBottom: "18px" }}>
              <label htmlFor="debt-notes" style={labelStyle}>
                Notes (optionnel)
              </label>
              <textarea
                id="debt-notes"
                placeholder="Informations supplémentaires..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="input-field"
                rows={2}
                style={{ resize: "vertical" }}
              />
            </div>

            {/* Summary */}
            {estimatedMonths !== null &&
              estimatedMonths > 0 &&
              isFinite(estimatedMonths) && (
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
                      Durée estimée
                    </span>
                    <span
                      style={{
                        fontSize: "14px",
                        fontWeight: 700,
                        color: "var(--slate-900)",
                        letterSpacing: "-0.02em",
                      }}
                    >
                      ~{estimatedMonths} mois
                    </span>
                  </div>
                  {totalInterest !== null && totalInterest > 0 && (
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
                        Coût total en intérêts
                      </span>
                      <span
                        style={{
                          fontSize: "14px",
                          fontWeight: 700,
                          color: "var(--error)",
                          letterSpacing: "-0.02em",
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        ~{Math.round(totalInterest).toLocaleString("fr-CA")} $
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

        {/* Sheet actions */}
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
            form="debt-form"
            disabled={loading}
            style={{
              flex: 1.4,
              padding: "14px 20px",
              border: "none",
              borderRadius: "var(--radius-md)",
              background: "var(--error)",
              fontFamily: "var(--font)",
              fontSize: "15px",
              fontWeight: 700,
              color: "var(--white, #fff)",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.5 : 1,
              transition: "all 0.2s ease",
            }}
          >
            {loading
              ? isEdit
                ? "Modification..."
                : "Création..."
              : isEdit
                ? "Modifier"
                : "Ajouter la dette"}
          </button>
        </div>
      </div>
    </div>
  );
}
