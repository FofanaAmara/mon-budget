"use client";

import { useState, useRef, useEffect } from "react";

import { formatCAD } from "@/lib/utils";
import type { Expense } from "@/lib/types";

type Props = {
  source: Expense;
  allPots: Expense[]; // all projects + épargne libre (excluding source)
  onDone: () => void;
  onClose: () => void;
};

export default function TransferSavingsModal({
  source,
  allPots,
  onDone,
  onClose,
}: Props) {
  const destinations = allPots.filter((p) => p.id !== source.id);
  const [destId, setDestId] = useState(destinations[0]?.id ?? "");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    dialogRef.current?.focus();
  }, []);

  const sourceBalance = Number(source.saved_amount ?? 0);
  const dest = destinations.find((p) => p.id === destId);
  const destBalance = dest ? Number(dest.saved_amount ?? 0) : 0;

  const sourceAfter =
    amount && parseFloat(amount) > 0
      ? sourceBalance - parseFloat(amount)
      : null;
  const destAfter =
    amount && parseFloat(amount) > 0 ? destBalance + parseFloat(amount) : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0 || val > sourceBalance || !dest) return;
    setLoading(true);
    try {
      const { transferSavings } = await import("@/lib/actions/expenses");
      await transferSavings(source.id, dest.id, val, source.name, dest.name);
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
        aria-labelledby="transfer-dialog-title"
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
                background: "var(--amber-100, #FEF3C7)",
                color: "var(--amber-600, #D97706)",
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
                <polyline points="17 1 21 5 17 9" />
                <path d="M3 11V9a4 4 0 014-4h14" />
                <polyline points="7 23 3 19 7 15" />
                <path d="M21 13v2a4 4 0 01-4 4H3" />
              </svg>
            </div>
            <h3
              id="transfer-dialog-title"
              style={{
                fontSize: "18px",
                fontWeight: 700,
                color: "var(--slate-900)",
                letterSpacing: "-0.02em",
              }}
            >
              Transférer
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
            id="transfer-form"
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", gap: "0" }}
          >
            {/* Depuis */}
            <div style={{ marginBottom: "0" }}>
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
                Depuis
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
                {source.name}
                <span style={{ color: "var(--slate-400)", fontWeight: 400 }}>
                  {" "}
                  ({formatCAD(sourceBalance)})
                </span>
              </div>
            </div>

            {/* Transfer arrow */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "8px 0",
                color: "var(--slate-300)",
              }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <polyline points="19 12 12 19 5 12" />
              </svg>
            </div>

            {/* Vers */}
            <div style={{ marginBottom: "18px" }}>
              <label
                htmlFor="transfer-dest"
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
                Vers
              </label>
              <select
                id="transfer-dest"
                value={destId}
                onChange={(e) => setDestId(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px 40px 12px 14px",
                  border: "1px solid var(--slate-200)",
                  borderRadius: "var(--radius-sm)",
                  fontFamily: "var(--font)",
                  fontSize: "15px",
                  fontWeight: 500,
                  color: "var(--slate-900)",
                  background: "var(--white, #fff)",
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2394A3B8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 14px center",
                  WebkitAppearance: "none",
                  appearance: "none",
                  outline: "none",
                  transition: "border-color 0.2s, box-shadow 0.2s",
                }}
              >
                {destinations.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({formatCAD(Number(p.saved_amount ?? 0))})
                  </option>
                ))}
              </select>
            </div>

            {/* Amount */}
            <div style={{ marginBottom: "18px" }}>
              <label
                htmlFor="transfer-amount"
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
                Montant à transférer
              </label>
              <div style={{ position: "relative" }}>
                <input
                  id="transfer-amount"
                  type="number"
                  min="0"
                  step="0.01"
                  max={sourceBalance}
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
                Disponible dans {source.name} :{" "}
                <strong style={{ fontWeight: 700, color: "var(--slate-700)" }}>
                  {formatCAD(sourceBalance)}
                </strong>
              </p>
              {sourceBalance > 0 && (
                <button
                  type="button"
                  onClick={() => setAmount(String(sourceBalance))}
                  style={{
                    marginTop: "6px",
                    padding: "4px 10px",
                    fontSize: "var(--text-xs)",
                    fontWeight: 600,
                    color: "var(--teal-700)",
                    background: "var(--teal-50)",
                    border: "none",
                    borderRadius: "var(--radius-sm)",
                    cursor: "pointer",
                  }}
                >
                  Tout transférer ({formatCAD(sourceBalance)})
                </button>
              )}
            </div>

            {/* Summary */}
            {sourceAfter !== null && destAfter !== null && (
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
                    {source.name} après
                  </span>
                  <span
                    style={{
                      fontSize: "14px",
                      fontWeight: 700,
                      color: "var(--slate-900)",
                      letterSpacing: "-0.02em",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {formatCAD(Math.max(0, sourceAfter))}
                  </span>
                </div>
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
                    {dest?.name} après
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
                    {formatCAD(destAfter)}
                  </span>
                </div>
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
            form="transfer-form"
            disabled={
              loading ||
              !destId ||
              parseFloat(amount) <= 0 ||
              parseFloat(amount) > sourceBalance
            }
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
                loading ||
                !destId ||
                parseFloat(amount) <= 0 ||
                parseFloat(amount) > sourceBalance
                  ? "not-allowed"
                  : "pointer",
              opacity:
                loading ||
                !destId ||
                parseFloat(amount) <= 0 ||
                parseFloat(amount) > sourceBalance
                  ? 0.5
                  : 1,
              transition: "all 0.2s ease",
            }}
          >
            {loading
              ? "Transfert..."
              : `Transférer${amount && parseFloat(amount) > 0 ? ` ${formatCAD(parseFloat(amount))}` : ""}`}
          </button>
        </div>
      </div>
    </div>
  );
}
