"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addDebtTransaction } from "@/lib/actions/debt-transactions";
import SheetCloseButton from "@/components/SheetCloseButton";
import type { Debt } from "@/lib/types";

type ChargeDebtSheetProps = {
  debt: Debt;
  onClose: () => void;
};

export default function ChargeDebtSheet({
  debt,
  onClose,
}: ChargeDebtSheetProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [chargeAmount, setChargeAmount] = useState("");
  const [chargeNote, setChargeNote] = useState("");

  async function handleSubmit() {
    const amount = parseFloat(chargeAmount);
    if (isNaN(amount) || amount <= 0) return;
    const now = new Date();
    const txMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    startTransition(async () => {
      await addDebtTransaction(
        debt.id,
        "CHARGE",
        amount,
        txMonth,
        chargeNote || null,
      );
      onClose();
      router.refresh();
    });
  }

  return (
    <div
      className="sheet-backdrop"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="presentation"
    >
      <div
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="charge-debt-dialog-title"
        tabIndex={-1}
        onKeyDown={(e) => e.key === "Escape" && onClose()}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sheet-handle" />
        <SheetCloseButton onClose={onClose} />
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
              id="charge-debt-dialog-title"
              style={{
                fontSize: "18px",
                fontWeight: 700,
                color: "var(--slate-900)",
                letterSpacing: "-0.02em",
              }}
            >
              Nouvelle charge
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
        <div style={{ padding: "20px 24px 24px" }}>
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
              htmlFor="charge-amount"
            >
              {debt.name}
            </label>
            <div style={{ position: "relative" }}>
              <input
                id="charge-amount"
                type="number"
                min="0.01"
                step="0.01"
                placeholder="0"
                value={chargeAmount}
                onChange={(e) => setChargeAmount(e.target.value)}
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
              htmlFor="charge-note"
            >
              Note (optionnel)
            </label>
            <input
              id="charge-note"
              type="text"
              placeholder="Ex: Achat Amazon"
              value={chargeNote}
              onChange={(e) => setChargeNote(e.target.value)}
              className="input-field"
            />
          </div>
        </div>
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
            disabled={!chargeAmount || parseFloat(chargeAmount) <= 0}
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
              opacity: !chargeAmount || parseFloat(chargeAmount) <= 0 ? 0.5 : 1,
            }}
          >
            Ajouter la charge
          </button>
        </div>
      </div>
    </div>
  );
}
