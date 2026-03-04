"use client";

import { useState, useTransition } from "react";

import { createExpense, updateExpense } from "@/lib/actions/expenses";
import type {
  Expense,
  ExpenseType,
  RecurrenceFrequency,
  Section,
  Card,
} from "@/lib/types";

type Props = {
  sections: Section[];
  cards: Card[];
  expense?: Expense;
  onClose: () => void;
  onSuccess: () => void;
};

const FREQUENCIES: { value: RecurrenceFrequency; label: string }[] = [
  { value: "WEEKLY", label: "Hebdo" },
  { value: "BIWEEKLY", label: "Bi-hebdo" },
  { value: "MONTHLY", label: "Mensuel" },
  { value: "BIMONTHLY", label: "Bi-mensuel" },
  { value: "QUARTERLY", label: "Trimestriel" },
  { value: "YEARLY", label: "Annuel" },
];

export default function ExpenseModal({
  sections,
  cards,
  expense,
  onClose,
  onSuccess,
}: Props) {
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState(expense?.name ?? "");
  const [amount, setAmount] = useState(expense?.amount?.toString() ?? "");
  const [type, setType] = useState<ExpenseType>(expense?.type ?? "RECURRING");
  const [frequency, setFrequency] = useState<RecurrenceFrequency>(
    expense?.recurrence_frequency ?? "MONTHLY",
  );
  const [day, setDay] = useState(expense?.recurrence_day?.toString() ?? "");
  const [autoDebit, setAutoDebit] = useState(expense?.auto_debit ?? false);
  const [sectionId, setSectionId] = useState(expense?.section_id ?? "");
  const [cardId, setCardId] = useState(expense?.card_id ?? "");
  const [dueDate, setDueDate] = useState(expense?.due_date ?? "");
  const [notes, setNotes] = useState(expense?.notes ?? "");

  const isValid = name.trim() && amount && parseFloat(amount) > 0;

  function handleSubmit() {
    if (!isValid) return;

    startTransition(async () => {
      const data = {
        name: name.trim(),
        amount: parseFloat(amount),
        type,
        section_id: sectionId || undefined,
        card_id: autoDebit && cardId ? cardId : undefined,
        recurrence_frequency: type === "RECURRING" ? frequency : undefined,
        recurrence_day: type === "RECURRING" && day ? parseInt(day) : undefined,
        auto_debit: type === "RECURRING" ? autoDebit : false,
        due_date: type === "ONE_TIME" ? dueDate || undefined : undefined,
        notes: notes || undefined,
      };

      if (expense) {
        await updateExpense(expense.id, data);
      } else {
        await createExpense(data);
      }
      onSuccess();
      onClose();
    });
  }

  const isEditing = Boolean(expense);

  return (
    <>
      <style>{`
        .expense-modal-amount-input {
          width: 100%;
          padding: 14px 14px 14px 36px;
          border: 1px solid var(--border-default);
          border-radius: var(--radius-sm);
          font-family: var(--font);
          font-size: 28px;
          font-weight: 800;
          letter-spacing: -0.03em;
          font-variant-numeric: tabular-nums;
          color: var(--text-primary);
          background: var(--surface-raised);
          transition: border-color 0.2s, box-shadow 0.2s;
          appearance: none;
          -webkit-appearance: none;
          outline: none;
        }
        .expense-modal-amount-input::placeholder {
          color: var(--border-strong);
          font-weight: 400;
          font-size: 18px;
        }
        .expense-modal-amount-input:focus {
          border-color: var(--accent);
          box-shadow: 0 0 0 3px rgba(15, 118, 110, 0.08);
        }
        .expense-modal-input {
          width: 100%;
          padding: 10px 14px;
          border: 1px solid var(--border-default);
          border-radius: var(--radius-sm);
          font-family: var(--font);
          font-size: 15px;
          font-weight: 500;
          color: var(--text-primary);
          background: var(--surface-raised);
          transition: border-color 0.2s, box-shadow 0.2s;
          letter-spacing: -0.01em;
          appearance: none;
          -webkit-appearance: none;
          outline: none;
        }
        .expense-modal-input::placeholder {
          color: var(--border-strong);
          font-weight: 400;
        }
        .expense-modal-input:focus {
          border-color: var(--accent);
          box-shadow: 0 0 0 3px rgba(15, 118, 110, 0.08);
        }
        .expense-modal-select {
          width: 100%;
          padding: 10px 40px 10px 14px;
          border: 1px solid var(--border-default);
          border-radius: var(--radius-sm);
          font-family: var(--font);
          font-size: 15px;
          font-weight: 500;
          color: var(--text-primary);
          background: var(--surface-raised) url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%2394A3B8' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E") right 14px center no-repeat;
          appearance: none;
          -webkit-appearance: none;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          letter-spacing: -0.01em;
        }
        .expense-modal-select:focus {
          border-color: var(--accent);
          box-shadow: 0 0 0 3px rgba(15, 118, 110, 0.08);
        }
        .expense-modal-day-input {
          width: 100px;
          padding: 10px 14px;
          border: 1px solid var(--border-default);
          border-radius: var(--radius-sm);
          font-family: var(--font);
          font-size: 15px;
          font-weight: 600;
          color: var(--text-primary);
          background: var(--surface-raised);
          text-align: center;
          transition: border-color 0.2s, box-shadow 0.2s;
          appearance: none;
          -webkit-appearance: none;
          outline: none;
        }
        .expense-modal-day-input:focus {
          border-color: var(--accent);
          box-shadow: 0 0 0 3px rgba(15, 118, 110, 0.08);
        }
        .expense-modal-textarea {
          width: 100%;
          padding: 10px 14px;
          border: 1px solid var(--border-default);
          border-radius: var(--radius-sm);
          font-family: var(--font);
          font-size: 15px;
          font-weight: 500;
          color: var(--text-primary);
          background: var(--surface-raised);
          resize: vertical;
          min-height: 72px;
          transition: border-color 0.2s, box-shadow 0.2s;
          letter-spacing: -0.01em;
          appearance: none;
          -webkit-appearance: none;
          outline: none;
        }
        .expense-modal-textarea::placeholder {
          color: var(--border-strong);
          font-weight: 400;
        }
        .expense-modal-textarea:focus {
          border-color: var(--accent);
          box-shadow: 0 0 0 3px rgba(15, 118, 110, 0.08);
        }
        /* Type toggle */
        .em-type-toggle {
          display: flex;
          background: var(--surface-sunken);
          border-radius: var(--radius-sm);
          padding: 3px;
          gap: 3px;
        }
        .em-type-btn {
          flex: 1;
          padding: 9px 12px;
          border: none;
          border-radius: 6px;
          font-family: var(--font);
          font-size: 13px;
          font-weight: 600;
          color: var(--text-tertiary);
          background: transparent;
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: center;
          letter-spacing: -0.01em;
        }
        .em-type-btn[data-active="true"] {
          background: var(--surface-raised);
          color: var(--accent);
          box-shadow: var(--shadow-xs);
        }
        /* Freq chips */
        .em-freq-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .em-freq-chip {
          padding: 8px 14px;
          border: 1.5px solid var(--border-default);
          border-radius: 100px;
          font-family: var(--font);
          font-size: 13px;
          font-weight: 600;
          color: var(--text-tertiary);
          background: var(--surface-raised);
          cursor: pointer;
          transition: all 0.15s ease;
          letter-spacing: -0.01em;
        }
        .em-freq-chip:hover {
          border-color: var(--accent);
          color: var(--accent);
        }
        .em-freq-chip[data-active="true"] {
          background: var(--accent);
          border-color: var(--accent);
          color: white;
        }
        /* Auto-pay toggle row */
        .em-toggle-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 0;
          border-top: 1px solid var(--surface-sunken);
          border-bottom: 1px solid var(--surface-sunken);
        }
        /* Modal toggle switch */
        .em-toggle-switch {
          position: relative;
          width: 48px;
          height: 28px;
          background: var(--border-default);
          border-radius: 14px;
          cursor: pointer;
          transition: background 0.2s ease;
          flex-shrink: 0;
          border: none;
        }
        .em-toggle-switch[data-active="true"] {
          background: var(--accent);
        }
        .em-toggle-knob {
          position: absolute;
          top: 3px;
          left: 3px;
          width: 22px;
          height: 22px;
          background: white;
          border-radius: 50%;
          box-shadow: 0 1px 3px rgba(0,0,0,0.15);
          transition: transform 0.2s ease;
          pointer-events: none;
        }
        .em-toggle-switch[data-active="true"] .em-toggle-knob {
          transform: translateX(20px);
        }
        /* Modal form label */
        .em-label {
          display: block;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--text-tertiary);
          margin-bottom: 6px;
        }
        /* Sticky actions */
        .em-actions {
          display: flex;
          gap: 12px;
          padding: 20px;
          background: var(--surface-raised);
          border-top: 1px solid var(--surface-sunken);
          position: sticky;
          bottom: 0;
        }
        .em-btn-cancel {
          flex: 1;
          padding: 13px;
          background: var(--surface-raised);
          color: var(--text-secondary);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-md);
          font-family: var(--font);
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          letter-spacing: -0.01em;
          transition: all 0.15s;
        }
        .em-btn-cancel:hover {
          background: var(--surface-ground);
          border-color: var(--border-strong);
        }
        .em-btn-submit {
          flex: 1.4;
          padding: 13px;
          background: var(--accent);
          color: white;
          border: none;
          border-radius: var(--radius-md);
          font-family: var(--font);
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          letter-spacing: -0.01em;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }
        .em-btn-submit:hover {
          background: var(--accent-hover);
          transform: translateY(-1px);
          box-shadow: var(--shadow-md);
        }
        .em-btn-submit:active {
          transform: translateY(0);
        }
        .em-btn-submit:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }
        /* Modal on desktop: centered card */
        @media (min-width: 640px) {
          .em-modal-container {
            bottom: auto !important;
            top: 50% !important;
            left: 50% !important;
            right: auto !important;
            transform: translate(-50%, -50%) !important;
            width: calc(100% - 40px) !important;
            max-width: 500px !important;
            border-radius: var(--radius-lg) !important;
            box-shadow: 0 24px 48px rgba(15, 23, 42, 0.18), 0 8px 16px rgba(15, 118, 110, 0.06) !important;
            animation: em-card-in 0.3s ease both !important;
          }
          @keyframes em-card-in {
            from { transform: translate(-50%, -50%) scale(0.95); opacity: 0; }
            to { transform: translate(-50%, -50%) scale(1); opacity: 1; }
          }
          .em-modal-handle {
            display: none !important;
          }
          .em-modal-header {
            padding: 24px 24px 0 !important;
          }
          .em-modal-body {
            padding: 24px 24px 0 !important;
          }
          .em-actions {
            padding: 24px !important;
          }
        }
      `}</style>

      {/* Backdrop */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(15, 23, 42, 0.5)",
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
          zIndex: 200,
          animation: "sheet-backdrop-in 0.25s ease both",
        }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="em-modal-container"
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 210,
          maxHeight: "calc(100dvh - 40px)",
          overflowY: "auto",
          background: "var(--surface-raised)",
          borderRadius: "var(--radius-lg) var(--radius-lg) 0 0",
          boxShadow:
            "0 -8px 32px rgba(15, 23, 42, 0.18), 0 -4px 12px rgba(15, 118, 110, 0.06)",
          animation: "sheet-slide-up 0.35s cubic-bezier(0.32, 0.72, 0, 1) both",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle (mobile) */}
        <div
          className="em-modal-handle"
          style={{
            display: "flex",
            justifyContent: "center",
            padding: "10px 0 2px",
          }}
        >
          <div
            style={{
              width: "36px",
              height: "4px",
              borderRadius: "2px",
              background: "var(--border-default)",
            }}
          />
        </div>

        {/* Header */}
        <div
          className="em-modal-header"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 20px 0",
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
                background: "var(--accent-subtle)",
                color: "var(--accent)",
              }}
            >
              <svg
                width="20"
                height="20"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                />
              </svg>
            </div>
            <h3
              style={{
                fontSize: "18px",
                fontWeight: 700,
                color: "var(--text-primary)",
                letterSpacing: "-0.02em",
              }}
            >
              {isEditing ? "Modifier la charge" : "Nouvelle charge"}
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{
              width: "36px",
              height: "36px",
              border: "none",
              background: "var(--surface-sunken)",
              borderRadius: "var(--radius-sm)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "var(--text-tertiary)",
              transition: "all 0.15s",
            }}
          >
            <svg
              width="18"
              height="18"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="em-modal-body" style={{ padding: "20px 20px 0" }}>
          {/* Section — en premier */}
          <div style={{ marginBottom: "18px" }}>
            <label className="em-label">Section</label>
            <select
              value={sectionId}
              onChange={(e) => setSectionId(e.target.value)}
              className="expense-modal-select"
            >
              <option value="">Choisir une section...</option>
              {sections.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.icon} {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Nom de la charge */}
          <div style={{ marginBottom: "18px" }}>
            <label className="em-label">Nom de la charge</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ex: Loyer, Netflix, Assurance..."
              className="expense-modal-input"
            />
          </div>

          {/* Type toggle */}
          <div style={{ marginBottom: "18px" }}>
            <label className="em-label">Type</label>
            <div className="em-type-toggle">
              {(["RECURRING", "ONE_TIME"] as ExpenseType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className="em-type-btn"
                  data-active={type === t ? "true" : "false"}
                >
                  {t === "RECURRING" ? "Récurrente" : "Ponctuelle"}
                </button>
              ))}
            </div>
          </div>

          {/* Montant */}
          <div style={{ marginBottom: "18px" }}>
            <label className="em-label">Montant</label>
            <div style={{ position: "relative" }}>
              <span
                style={{
                  position: "absolute",
                  left: "14px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  fontSize: "18px",
                  fontWeight: 700,
                  color: "var(--accent)",
                  pointerEvents: "none",
                }}
              >
                $
              </span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0,00"
                step="0.01"
                min="0"
                className="expense-modal-amount-input"
              />
            </div>
          </div>

          {/* RECURRING fields */}
          {type === "RECURRING" && (
            <>
              {/* Frequence */}
              <div style={{ marginBottom: "18px" }}>
                <label className="em-label">Fréquence</label>
                <div className="em-freq-chips">
                  {FREQUENCIES.map((f) => (
                    <button
                      key={f.value}
                      type="button"
                      onClick={() => setFrequency(f.value)}
                      className="em-freq-chip"
                      data-active={frequency === f.value ? "true" : "false"}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Prelevement automatique toggle */}
              <div style={{ marginBottom: "18px" }}>
                <div className="em-toggle-row">
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "2px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "14px",
                        fontWeight: 600,
                        color: "var(--text-primary)",
                        letterSpacing: "-0.01em",
                      }}
                    >
                      Prélèvement automatique
                    </span>
                    <span
                      style={{
                        fontSize: "12px",
                        fontWeight: 500,
                        color: "var(--text-tertiary)",
                        letterSpacing: "-0.01em",
                      }}
                    >
                      La charge sera marquée payée sans action
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setAutoDebit(!autoDebit);
                      if (autoDebit) setCardId("");
                    }}
                    className="em-toggle-switch"
                    data-active={autoDebit ? "true" : "false"}
                    aria-label="Prélèvement automatique"
                  >
                    <div className="em-toggle-knob" />
                  </button>
                </div>
              </div>

              {/* Jour du mois — optionnel pour toute charge récurrente */}
              <div style={{ marginBottom: "18px" }}>
                <label className="em-label">
                  Jour du mois{" "}
                  <span
                    style={{
                      fontWeight: 500,
                      textTransform: "none",
                      letterSpacing: 0,
                      color: "var(--text-tertiary)",
                    }}
                  >
                    (optionnel)
                  </span>
                </label>
                <input
                  type="number"
                  value={day}
                  onChange={(e) => setDay(e.target.value)}
                  placeholder="ex: 15"
                  min="1"
                  max="31"
                  className="expense-modal-day-input"
                />
                <p
                  style={{
                    fontSize: "11px",
                    fontWeight: 500,
                    color: "var(--text-tertiary)",
                    marginTop: "4px",
                    letterSpacing: "-0.01em",
                  }}
                >
                  Laisse vide si pas de date fixe. Entre 1 et 31 sinon.
                </p>
              </div>

              {/* Carte bancaire — seulement si auto-debit */}
              {autoDebit && cards.length > 0 && (
                <div style={{ marginBottom: "18px" }}>
                  <label className="em-label">Carte bancaire</label>
                  <select
                    value={cardId}
                    onChange={(e) => setCardId(e.target.value)}
                    className="expense-modal-select"
                  >
                    <option value="">Choisir une carte...</option>
                    {cards.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                        {c.last_four ? ` ****${c.last_four}` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </>
          )}

          {/* ONE_TIME date */}
          {type === "ONE_TIME" && (
            <div style={{ marginBottom: "18px" }}>
              <label className="em-label">Date exacte</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="expense-modal-input"
              />
            </div>
          )}

          {/* Notes */}
          <div style={{ marginBottom: "4px" }}>
            <label className="em-label">
              Notes{" "}
              <span
                style={{
                  fontWeight: 500,
                  textTransform: "none",
                  letterSpacing: 0,
                  color: "var(--text-tertiary)",
                }}
              >
                (optionnel)
              </span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="ex: Payé par virement, inclut le stationnement..."
              className="expense-modal-textarea"
            />
          </div>
        </div>

        {/* Sticky footer actions */}
        <div className="em-actions">
          <button type="button" onClick={onClose} className="em-btn-cancel">
            Annuler
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isPending || !isValid}
            className="em-btn-submit"
          >
            {!isPending && (
              <svg
                width="18"
                height="18"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.5 12.75l6 6 9-13.5"
                />
              </svg>
            )}
            {isPending
              ? "Enregistrement..."
              : isEditing
                ? "Enregistrer"
                : "Ajouter"}
          </button>
        </div>
      </div>
    </>
  );
}
