"use client";

import React from "react";
import { formatCAD, calcMonthlySuggested, formatDate } from "@/lib/utils";
import type { Expense } from "@/lib/types";

type SavingsProjectCardProps = {
  projet: Expense;
  onAddSavings: () => void;
  onTransfer: () => void;
  onHistory: () => void;
  onDelete: () => void;
  /** True for the permanent "Épargne libre" card (no progress bar, no delete) */
  isFreeSavings?: boolean;
};

function SavingsProjectCardComponent({
  projet,
  onAddSavings,
  onTransfer,
  onHistory,
  onDelete,
  isFreeSavings = false,
}: SavingsProjectCardProps) {
  const saved = Number(projet.saved_amount ?? 0);
  const target = Number(projet.target_amount ?? 0);
  const progress = target > 0 ? Math.min((saved / target) * 100, 100) : 0;
  const monthlySuggested = projet.target_date
    ? calcMonthlySuggested(target, saved, projet.target_date)
    : null;

  return (
    <div
      style={{
        background: "var(--white, #fff)",
        border: "1px solid var(--slate-200)",
        borderLeft: "4px solid var(--teal-700)",
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
              display: "flex",
              alignItems: "center",
              gap: "6px",
              flexWrap: "wrap",
            }}
          >
            {isFreeSavings ? "Épargne libre" : projet.name}
            {isFreeSavings && (
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: 700,
                  padding: "2px 7px",
                  background: "var(--teal-50)",
                  color: "var(--teal-700)",
                  borderRadius: "100px",
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                }}
              >
                Permanent
              </span>
            )}
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
            <span
              style={{
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: "var(--slate-400)",
              }}
            >
              {isFreeSavings ? "Pot libre" : "Projet"}
            </span>
            {!isFreeSavings && projet.target_date && (
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
                    fontWeight: 500,
                    color: "var(--slate-500)",
                  }}
                >
                  Cible : {formatDate(projet.target_date)}
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
              color: "var(--teal-700)",
              fontVariantNumeric: "tabular-nums",
              whiteSpace: "nowrap",
            }}
          >
            {saved.toLocaleString("fr-CA", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
            <span
              style={{
                fontSize: "0.5em",
                fontWeight: 600,
                color: "var(--teal-800)",
                marginLeft: "3px",
              }}
            >
              $
            </span>
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <button
              onClick={onAddSavings}
              className="icon-btn"
              aria-label="Ajouter épargne"
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
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
            <button
              onClick={onTransfer}
              className="icon-btn"
              aria-label="Transferer"
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
                <polyline points="17 1 21 5 17 9" />
                <path d="M3 11V9a4 4 0 0 1 4-4h14" />
                <polyline points="7 23 3 19 7 15" />
                <path d="M21 13v2a4 4 0 0 1-4 4H3" />
              </svg>
            </button>
            <button
              onClick={onHistory}
              className="icon-btn"
              aria-label="Historique"
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
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </button>
            {!isFreeSavings && (
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
            )}
          </div>
        </div>
      </div>

      {/* Progress bar — only for projects with a target */}
      {!isFreeSavings && target > 0 && (
        <div style={{ marginTop: "14px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
              marginBottom: "6px",
            }}
          >
            <span
              style={{
                fontSize: "12px",
                fontWeight: 600,
                color: "var(--slate-500)",
                letterSpacing: "-0.01em",
              }}
            >
              <strong
                style={{
                  fontWeight: 700,
                  color: "var(--slate-700)",
                }}
              >
                {formatCAD(saved)}
              </strong>
              {" / "}
              {formatCAD(target)}
            </span>
            <span
              style={{
                fontSize: "12px",
                fontWeight: 700,
                color: "var(--amber-500)",
              }}
            >
              {Math.round(progress)}%
            </span>
          </div>
          <div
            style={{
              height: "8px",
              background: "var(--slate-100)",
              borderRadius: "4px",
              overflow: "visible",
              position: "relative",
            }}
          >
            <div
              style={{
                height: "100%",
                borderRadius: "4px",
                background:
                  "linear-gradient(90deg, var(--teal-700), var(--teal-800))",
                width: `${Math.max(progress, 2)}%`,
                position: "relative",
                transition: "width 0.8s ease",
              }}
            >
              {/* Amber dot at tip */}
              <span
                style={{
                  position: "absolute",
                  right: "-1px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: "12px",
                  height: "12px",
                  background: "var(--amber-500)",
                  borderRadius: "50%",
                  border: "2px solid white",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.15)",
                  display: "block",
                }}
              />
            </div>
          </div>

          {/* Monthly suggestion chip */}
          {monthlySuggested !== null && monthlySuggested > 0 && (
            <span
              suppressHydrationWarning
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                marginTop: "10px",
                padding: "4px 10px",
                background: "var(--teal-50)",
                border: "1px solid rgba(15, 118, 110, 0.1)",
                borderRadius: "100px",
                fontSize: "11px",
                fontWeight: 600,
                color: "var(--teal-700)",
                letterSpacing: "0.01em",
              }}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ flexShrink: 0 }}
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              {formatCAD(monthlySuggested)}/mois suggere
            </span>
          )}
        </div>
      )}
    </div>
  );
}

const SavingsProjectCard = React.memo(SavingsProjectCardComponent);
export default SavingsProjectCard;
