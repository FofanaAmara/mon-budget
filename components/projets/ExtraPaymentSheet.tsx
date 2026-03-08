"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { makeExtraPayment } from "@/lib/actions/debts";
import { formatCAD } from "@/lib/utils";
import SheetCloseButton from "@/components/SheetCloseButton";
import type { Debt } from "@/lib/types";

const FREQ_LABELS: Record<string, string> = {
  WEEKLY: "/sem",
  BIWEEKLY: "/2 sem",
  MONTHLY: "/mois",
  QUARTERLY: "/trim",
  YEARLY: "/an",
};

type ExtraPaymentSheetProps = {
  debt: Debt;
  onClose: () => void;
};

export default function ExtraPaymentSheet({
  debt,
  onClose,
}: ExtraPaymentSheetProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [amount, setAmount] = useState("");
  const [payType, setPayType] = useState<"regular" | "extra">("regular");

  async function handleSubmit() {
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) return;
    startTransition(async () => {
      await makeExtraPayment(debt.id, amt);
      onClose();
      router.refresh();
    });
  }

  return (
    <div
      className="sheet-backdrop"
      style={{ zIndex: 110 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="presentation"
    >
      <div
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pay-debt-dialog-title"
        tabIndex={-1}
        onKeyDown={(e) => e.key === "Escape" && onClose()}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sheet-handle" />
        <SheetCloseButton onClose={onClose} />
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
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
              </svg>
            </div>
            <h3
              id="pay-debt-dialog-title"
              style={{
                fontSize: "18px",
                fontWeight: 700,
                color: "var(--slate-900)",
                letterSpacing: "-0.02em",
              }}
            >
              Payer une dette
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
          {/* Debt info */}
          <div
            style={{
              marginBottom: "18px",
              padding: "14px",
              background: "var(--teal-50)",
              borderRadius: "var(--radius-sm)",
              border: "1px solid rgba(15, 118, 110, 0.08)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span
                style={{
                  fontSize: "13px",
                  fontWeight: 500,
                  color: "var(--slate-500)",
                }}
              >
                {debt.name}
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
                {formatCAD(Number(debt.remaining_balance))}
              </span>
            </div>
          </div>

          {/* Payment type */}
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
              Type de paiement
            </label>
            <div style={{ display: "flex", gap: "10px" }}>
              {(["regular", "extra"] as const).map((type) => (
                <label key={type} style={{ flex: 1, cursor: "pointer" }}>
                  <input
                    type="radio"
                    name="payment-type"
                    checked={payType === type}
                    onChange={() => {
                      setPayType(type);
                      if (type === "regular") {
                        setAmount(String(debt.payment_amount ?? ""));
                      }
                    }}
                    style={{ display: "none" }}
                  />
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "6px",
                      padding: "14px 12px",
                      border:
                        payType === type
                          ? "1.5px solid var(--teal-700)"
                          : "1.5px solid var(--slate-200)",
                      borderRadius: "var(--radius-md)",
                      background:
                        payType === type ? "var(--teal-50)" : "transparent",
                      boxShadow:
                        payType === type
                          ? "0 0 0 3px rgba(15, 118, 110, 0.06)"
                          : "none",
                      transition: "all 0.2s ease",
                      textAlign: "center",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "14px",
                        fontWeight: 700,
                        color:
                          payType === type
                            ? "var(--teal-700)"
                            : "var(--slate-900)",
                        letterSpacing: "-0.01em",
                      }}
                    >
                      {type === "regular" ? "Regulier" : "Supplementaire"}
                    </span>
                    <span
                      style={{
                        fontSize: "12px",
                        fontWeight: 400,
                        color: "var(--slate-500)",
                        lineHeight: 1.3,
                      }}
                    >
                      {type === "regular"
                        ? "Mensualite prevue"
                        : "Paiement en plus"}
                    </span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Amount */}
          <div style={{ marginBottom: "18px" }}>
            <label
              htmlFor="debt-pay-amount"
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
                id="debt-pay-amount"
                type="number"
                min="0.01"
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
                letterSpacing: "-0.01em",
              }}
            >
              Mensualite prevue :{" "}
              <strong style={{ fontWeight: 700, color: "var(--slate-700)" }}>
                {formatCAD(Number(debt.payment_amount))}
                {FREQ_LABELS[debt.payment_frequency] ?? ""}
              </strong>
            </p>
          </div>

          {/* Summary */}
          {amount && parseFloat(amount) > 0 && (
            <div
              style={{
                marginBottom: "0",
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
                  Solde apres paiement
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
                  {formatCAD(
                    Math.max(
                      0,
                      Number(debt.remaining_balance) - parseFloat(amount),
                    ),
                  )}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Sheet actions */}
        <div style={{ display: "flex", gap: "10px", padding: "0 24px 24px" }}>
          <button
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
            onClick={handleSubmit}
            disabled={!amount || parseFloat(amount) <= 0}
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
              cursor: "pointer",
              opacity: !amount || parseFloat(amount) <= 0 ? 0.5 : 1,
              transition: "all 0.2s ease",
            }}
          >
            Payer {amount ? formatCAD(parseFloat(amount)) : ""}
          </button>
        </div>
      </div>
    </div>
  );
}
