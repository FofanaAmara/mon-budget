"use client";

import { formatCAD } from "@/lib/utils";

type MonumentStatus = {
  type: "over" | "complete" | "partial" | "expected";
  label: string;
} | null;

type Props = {
  actualTotal: number;
  expectedTotal: number;
};

export default function RevenusMonument({ actualTotal, expectedTotal }: Props) {
  const progressPct =
    expectedTotal > 0 ? (actualTotal / expectedTotal) * 100 : 0;
  const isComplete = progressPct >= 100 && expectedTotal > 0;
  const isOverIncome = actualTotal > expectedTotal && expectedTotal > 0;
  const surplus = actualTotal - expectedTotal;

  function getMonumentStatus(): MonumentStatus {
    if (expectedTotal === 0) return null;
    if (isOverIncome)
      return {
        type: "over",
        label: `+${formatCAD(surplus)} au-dessus des attentes`,
      };
    if (isComplete)
      return { type: "complete", label: "Tous les revenus reçus" };
    if (progressPct >= 50)
      return {
        type: "partial",
        label: `${Math.round(progressPct)}% reçu`,
      };
    return {
      type: "expected",
      label: `${Math.round(progressPct)}% reçu`,
    };
  }

  const monumentStatus = getMonumentStatus();

  function getProgressFillColor() {
    if (isComplete || isOverIncome) return "var(--teal-700, #0F766E)";
    if (progressPct >= 80) return "var(--amber-500, #F59E0B)";
    return "var(--teal-700, #0F766E)";
  }

  return (
    <div style={{ padding: "20px 20px 20px", textAlign: "center" }}>
      <p
        style={{
          fontSize: "13px",
          fontWeight: 700,
          letterSpacing: "0.08em",
          textTransform: "uppercase" as const,
          color: "var(--teal-700, #0F766E)",
          marginBottom: "12px",
        }}
      >
        Revenus
      </p>

      {/* Scoreboard fraction: received / expected */}
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "center",
          lineHeight: 1,
        }}
      >
        <span
          style={{
            fontSize: "clamp(3rem, 12vw, 5rem)",
            fontWeight: 800,
            letterSpacing: "-0.04em",
            color: "var(--slate-900, #0F172A)",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {actualTotal.toLocaleString("fr-CA", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          })}
          <span
            style={{
              fontSize: "0.4em",
              fontWeight: 600,
              color: "var(--teal-700, #0F766E)",
              verticalAlign: "super",
              marginLeft: "2px",
            }}
          >
            $
          </span>
        </span>

        <span
          style={{
            fontSize: "clamp(2rem, 8vw, 3.5rem)",
            fontWeight: 300,
            color: "var(--slate-300, #CBD5E1)",
            margin: "0 clamp(4px, 1.5vw, 10px)",
            position: "relative" as const,
            top: "-0.05em",
          }}
        >
          /
        </span>

        <span
          style={{
            fontSize: "clamp(1.8rem, 7vw, 3rem)",
            fontWeight: 600,
            letterSpacing: "-0.03em",
            color: "var(--slate-400, #94A3B8)",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {expectedTotal.toLocaleString("fr-CA", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          })}
          <span
            style={{
              fontSize: "0.4em",
              fontWeight: 600,
              color: "var(--teal-700, #0F766E)",
              verticalAlign: "super",
              marginLeft: "2px",
            }}
          >
            $
          </span>
        </span>
      </div>

      <p
        style={{
          fontSize: "14px",
          fontWeight: 500,
          color: "var(--slate-500, #64748B)",
          marginTop: "8px",
          letterSpacing: "0.01em",
        }}
      >
        reçu sur attendu ce mois-ci
      </p>

      {/* Progress bar */}
      {expectedTotal > 0 && (
        <div style={{ margin: "16px auto 0", maxWidth: "240px" }}>
          <div
            style={{
              height: "6px",
              background: "var(--slate-100, #F1F5F9)",
              borderRadius: "3px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                borderRadius: "3px",
                width: `${Math.min(progressPct, 100)}%`,
                background: getProgressFillColor(),
                transition: "width 0.8s ease",
              }}
            />
          </div>

          {/* Status badge */}
          {monumentStatus && (
            <div
              style={{
                marginTop: "10px",
                display: "flex",
                justifyContent: "center",
              }}
            >
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "4px 12px",
                  borderRadius: "100px",
                  fontSize: "12px",
                  fontWeight: 600,
                  background:
                    monumentStatus.type === "partial" ||
                    monumentStatus.type === "expected"
                      ? "var(--warning-light, #FEF3C7)"
                      : "var(--success-light, #ECFDF5)",
                  color:
                    monumentStatus.type === "partial" ||
                    monumentStatus.type === "expected"
                      ? "var(--amber-600, #D97706)"
                      : "var(--success, #059669)",
                }}
              >
                {(monumentStatus.type === "complete" ||
                  monumentStatus.type === "over") && (
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
                {monumentStatus.label}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
