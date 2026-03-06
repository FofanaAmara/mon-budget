"use client";

import { useState, useRef, useEffect } from "react";

import { IconClose } from "@/components/icons";
import { formatCAD } from "@/lib/utils";

type Props = {
  expenseId: string;
  projectName: string;
  currentSaved: number;
  targetAmount: number | null;
  onDone: () => void;
  onClose: () => void;
};

export default function AddSavingsModal({
  expenseId,
  projectName,
  currentSaved,
  targetAmount,
  onDone,
  onClose,
}: Props) {
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    dialogRef.current?.focus();
  }, []);

  const afterBalance =
    amount && parseFloat(amount) > 0 ? currentSaved + parseFloat(amount) : null;
  const progressAfter =
    targetAmount && afterBalance
      ? Math.min((afterBalance / targetAmount) * 100, 100)
      : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) return;
    setLoading(true);
    try {
      const { addSavingsContribution } = await import("@/lib/actions/expenses");
      await addSavingsContribution(expenseId, val, note.trim() || null);
      onDone();
    } catch {
      setLoading(false);
    }
  }

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
        aria-labelledby="savings-add-dialog-title"
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
                <line x1="12" y1="5" x2="12" y2="19" />
                <polyline points="5 12 12 5 19 12" />
              </svg>
            </div>
            <h3
              id="savings-add-dialog-title"
              style={{
                fontSize: "18px",
                fontWeight: 700,
                color: "var(--slate-900)",
                letterSpacing: "-0.02em",
              }}
            >
              Ajouter au pot
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
        <div style={{ padding: "20px 24px 24px" }}>
          <form
            id="savings-form"
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", gap: "0" }}
          >
            {/* Pot selector (display only) */}
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
                Pot de destination
              </label>
              <div
                style={{
                  padding: "12px 14px",
                  border: "1px solid var(--slate-200)",
                  borderRadius: "var(--radius-sm)",
                  fontSize: "15px",
                  fontWeight: 500,
                  color: "var(--slate-900)",
                  background: "var(--slate-50)",
                }}
              >
                {projectName}
                {targetAmount !== null && (
                  <span style={{ color: "var(--slate-400)", fontWeight: 400 }}>
                    {" "}
                    ({formatCAD(currentSaved)} / {formatCAD(targetAmount)})
                  </span>
                )}
                {targetAmount === null && (
                  <span style={{ color: "var(--slate-400)", fontWeight: 400 }}>
                    {" "}
                    ({formatCAD(currentSaved)})
                  </span>
                )}
              </div>
            </div>

            {/* Amount */}
            <div style={{ marginBottom: "18px" }}>
              <label
                htmlFor="savings-amount"
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
                Montant
              </label>
              <div style={{ position: "relative" }}>
                <input
                  id="savings-amount"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
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
              <p
                style={{
                  fontSize: "12px",
                  fontWeight: 500,
                  color: "var(--slate-400)",
                  marginTop: "6px",
                }}
              >
                Solde actuel du pot :{" "}
                <strong style={{ fontWeight: 700, color: "var(--slate-700)" }}>
                  {formatCAD(currentSaved)}
                </strong>
              </p>
            </div>

            {/* Note (optionnel) */}
            <div style={{ marginBottom: "18px" }}>
              <label
                htmlFor="savings-note"
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
                Note (optionnel)
              </label>
              <input
                id="savings-note"
                type="text"
                placeholder="Ex: Bonus mars, Vente Kijiji..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="input-field"
              />
            </div>

            {/* Summary */}
            {afterBalance !== null && (
              <div
                style={{
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
                    Après contribution
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
                    {formatCAD(afterBalance)}
                  </span>
                </div>
                {targetAmount !== null && progressAfter !== null && (
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
                      Progression
                    </span>
                    <span
                      style={{
                        fontSize: "14px",
                        fontWeight: 700,
                        color: "var(--slate-900)",
                        letterSpacing: "-0.02em",
                      }}
                    >
                      {Math.round((currentSaved / targetAmount) * 100)}% →{" "}
                      {Math.round(progressAfter)}%
                    </span>
                  </div>
                )}
              </div>
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
            form="savings-form"
            disabled={loading || !amount || parseFloat(amount) <= 0}
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
              cursor:
                loading || !amount || parseFloat(amount) <= 0
                  ? "not-allowed"
                  : "pointer",
              opacity: loading || !amount || parseFloat(amount) <= 0 ? 0.5 : 1,
              transition: "all 0.2s ease",
            }}
          >
            {loading
              ? "Enregistrement..."
              : `Ajouter${amount && parseFloat(amount) > 0 ? ` ${formatCAD(parseFloat(amount))}` : ""}`}
          </button>
        </div>
      </div>
    </div>
  );
}
