"use client";

import React from "react";
import { formatCAD } from "@/lib/utils";
import type { Debt } from "@/lib/types";

const FREQ_LABELS: Record<string, string> = {
  WEEKLY: "/sem",
  BIWEEKLY: "/2 sem",
  MONTHLY: "/mois",
  QUARTERLY: "/trim",
  YEARLY: "/an",
};

type DebtCardProps = {
  debt: Debt;
  onPay: () => void;
  onCharge: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

function DebtCardComponent({
  debt,
  onPay,
  onCharge,
  onEdit,
  onDelete,
}: DebtCardProps) {
  const remaining = Number(debt.remaining_balance);

  return (
    <div
      style={{
        background: "var(--white, #fff)",
        border: "1px solid var(--slate-200)",
        borderLeft: "4px solid var(--error)",
        borderRadius: "var(--radius-lg)",
        padding: "18px 18px 16px",
        transition: "all 0.25s ease",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "12px",
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              fontSize: "15px",
              fontWeight: 700,
              color: "var(--slate-900)",
              letterSpacing: "-0.01em",
            }}
          >
            {debt.name}
          </p>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              marginTop: "3px",
              flexWrap: "wrap",
            }}
          >
            {debt.section && (
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  color: "var(--slate-400)",
                }}
              >
                {debt.section.icon} {debt.section.name}
              </span>
            )}
            {!debt.section && (
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  color: "var(--slate-400)",
                }}
              >
                Dette
              </span>
            )}
            {debt.interest_rate != null && (
              <>
                <span
                  style={{
                    width: "3px",
                    height: "3px",
                    borderRadius: "50%",
                    background: "var(--slate-300)",
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "var(--error)",
                    letterSpacing: "-0.01em",
                  }}
                >
                  {debt.interest_rate}%
                </span>
              </>
            )}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: "6px",
            flexShrink: 0,
          }}
        >
          <p
            style={{
              fontSize: "clamp(1.3rem, 5vw, 1.6rem)",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              lineHeight: 1.1,
              color: "var(--error)",
              fontVariantNumeric: "tabular-nums",
              whiteSpace: "nowrap",
            }}
          >
            <span
              style={{
                fontSize: "0.5em",
                fontWeight: 600,
                color: "var(--error)",
              }}
            >
              $
            </span>
            {remaining.toLocaleString("fr-CA", {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            })}
          </p>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <button
              onClick={onPay}
              className="icon-btn"
              aria-label="Payer"
              title="Payer"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              >
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </button>
            <button
              onClick={onCharge}
              className="icon-btn"
              aria-label="Nouvelle charge"
              title="Nouvelle charge"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                <line x1="1" y1="10" x2="23" y2="10" />
              </svg>
            </button>
            <button onClick={onEdit} className="icon-btn" aria-label="Modifier">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
            <button
              onClick={onDelete}
              className="icon-btn icon-btn-danger"
              aria-label="Supprimer"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Debt details row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: "14px",
          paddingTop: "14px",
          borderTop: "1px solid var(--slate-100)",
          gap: "8px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "13px",
            fontWeight: 500,
            color: "var(--slate-500)",
            letterSpacing: "-0.01em",
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ color: "var(--slate-400)", flexShrink: 0 }}
          >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          Mensualite{" "}
          <strong style={{ fontWeight: 700, color: "var(--slate-700)" }}>
            {formatCAD(Number(debt.payment_amount))}
            {FREQ_LABELS[debt.payment_frequency] ?? ""}
          </strong>
        </div>
        {debt.auto_debit && (
          <span
            style={{
              fontSize: "12px",
              fontWeight: 600,
              color: "var(--slate-400)",
              letterSpacing: "-0.01em",
            }}
          >
            Prelevement auto
          </span>
        )}
      </div>
    </div>
  );
}

const DebtCard = React.memo(DebtCardComponent);
export default DebtCard;
