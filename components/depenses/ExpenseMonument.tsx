"use client";

import type { MonthSummary } from "@/lib/types";

type Props = {
  summary: MonthSummary;
};

export default function ExpenseMonument({ summary }: Props) {
  const chargesFixes = summary.planned_total;
  const paidTotal = summary.paid_total;
  const progressPct =
    chargesFixes > 0 ? Math.min((paidTotal / chargesFixes) * 100, 100) : 0;
  const isOverBudget = paidTotal > chargesFixes && chargesFixes > 0;
  const restAPayer = Math.max(chargesFixes - paidTotal, 0);
  const overAmount = paidTotal - chargesFixes;

  return (
    <>
      {/* ====== MONUMENT ====== */}
      <div style={{ padding: "20px 20px 0", textAlign: "center" }}>
        <p
          style={{
            fontSize: "12px",
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "var(--teal-700)",
            marginBottom: "10px",
          }}
        >
          Dépenses
        </p>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "center",
            gap: "6px",
            lineHeight: 1,
          }}
        >
          <span
            style={{
              fontSize: "clamp(3rem, 12vw, 5rem)",
              fontWeight: 800,
              letterSpacing: "-0.04em",
              color: "var(--slate-900)",
            }}
          >
            <span
              style={{
                fontSize: "0.4em",
                fontWeight: 600,
                color: "var(--teal-700)",
                verticalAlign: "super",
                marginLeft: "2px",
              }}
            >
              $
            </span>
            {Math.abs(paidTotal).toLocaleString("fr-CA", {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            })}
          </span>
          <span
            style={{
              fontSize: "clamp(1.5rem, 5vw, 2.5rem)",
              fontWeight: 300,
              color: "var(--slate-300)",
              margin: "0 2px",
            }}
          >
            /
          </span>
          <span
            style={{
              fontSize: "clamp(1.2rem, 4vw, 1.8rem)",
              fontWeight: 600,
              color: "var(--slate-400)",
              letterSpacing: "-0.02em",
            }}
          >
            <span
              style={{
                fontSize: "0.6em",
                fontWeight: 500,
                color: "var(--slate-300)",
                verticalAlign: "super",
              }}
            >
              $
            </span>
            {chargesFixes.toLocaleString("fr-CA", {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            })}
          </span>
        </div>
      </div>

      {/* ====== PROGRESS BAR ====== */}
      <div style={{ margin: "16px 20px 0", position: "relative" }}>
        <div
          style={{
            height: "6px",
            background: "var(--slate-100)",
            borderRadius: "3px",
            overflow: "hidden",
            position: "relative",
          }}
        >
          {isOverBudget ? (
            <>
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: `${(chargesFixes / paidTotal) * 100}%`,
                  background: "var(--teal-700)",
                  borderRadius: "3px 0 0 3px",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  left: `${(chargesFixes / paidTotal) * 100}%`,
                  top: 0,
                  bottom: 0,
                  width: `${100 - (chargesFixes / paidTotal) * 100}%`,
                  background: "var(--error)",
                  borderRadius: "0 3px 3px 0",
                }}
              />
            </>
          ) : (
            <div
              style={{
                height: "100%",
                borderRadius: "3px",
                background:
                  progressPct >= 90 ? "var(--warning)" : "var(--teal-700)",
                width: `${progressPct}%`,
                transition: "width 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
                minWidth: progressPct > 0 ? "4px" : "0",
              }}
            />
          )}
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: "6px",
            fontSize: "11px",
            fontWeight: 600,
            color: "var(--slate-400)",
            letterSpacing: "-0.01em",
          }}
        >
          <span>{Math.round(progressPct)}% dépensé</span>
          <span>
            {isOverBudget
              ? `+$${overAmount.toLocaleString("fr-CA", { minimumFractionDigits: 0, maximumFractionDigits: 0 })} au-dessus`
              : `$${restAPayer.toLocaleString("fr-CA", { minimumFractionDigits: 0, maximumFractionDigits: 0 })} restant`}
          </span>
        </div>
      </div>

      {/* ====== STATUS BADGES ====== */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "8px",
          marginTop: "14px",
          padding: "0 20px",
          flexWrap: "wrap",
        }}
      >
        {isOverBudget && (
          <StatusBadge bg="var(--error-light)" color="var(--error)">
            <WarningIcon />
            +${overAmount.toLocaleString("fr-CA")} au-dessus
          </StatusBadge>
        )}
        {summary.overdue_count > 0 && (
          <StatusBadge bg="var(--error-light)" color="var(--error)">
            <AlertIcon />
            {summary.overdue_count} en retard
          </StatusBadge>
        )}
        {!isOverBudget && progressPct < 90 && chargesFixes > 0 && (
          <StatusBadge bg="var(--success-light)" color="var(--positive)">
            <CheckIcon />${restAPayer.toLocaleString("fr-CA")} restant
          </StatusBadge>
        )}
        {summary.total > 0 && summary.unplanned_total > 0 && (
          <StatusBadge bg="var(--warning-light)" color="var(--amber-600)">
            ${summary.unplanned_total.toLocaleString("fr-CA")} imprévus
          </StatusBadge>
        )}
      </div>
    </>
  );
}

// ── Small helper components ─────────────────────────────────────────────────

function StatusBadge({
  bg,
  color,
  children,
}: {
  bg: string;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "5px",
        padding: "5px 12px",
        borderRadius: "100px",
        fontSize: "12px",
        fontWeight: 700,
        letterSpacing: "-0.01em",
        background: bg,
        color,
      }}
    >
      {children}
    </span>
  );
}

function WarningIcon() {
  return (
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
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function AlertIcon() {
  return (
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
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

function CheckIcon() {
  return (
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
  );
}
