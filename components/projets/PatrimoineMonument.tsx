"use client";

import { formatCAD } from "@/lib/utils";
import type { Debt } from "@/lib/types";

type Props = {
  totalEpargne: number;
  totalDebtBalance: number;
  projetsCount: number;
  debtsCount: number;
};

export default function PatrimoineMonument({
  totalEpargne,
  totalDebtBalance,
  projetsCount,
  debtsCount,
}: Props) {
  const valeurNette = totalEpargne - totalDebtBalance;
  const isPositive = valeurNette >= 0;

  return (
    <>
      {/* -- MONUMENT: Valeur nette -- */}
      <div
        style={{
          padding: "32px 20px 24px",
          textAlign: "center",
          position: "relative",
        }}
      >
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
          Patrimoine
        </p>

        <p
          style={{
            fontSize: "clamp(3rem, 12vw, 5rem)",
            fontWeight: 800,
            letterSpacing: "-0.04em",
            lineHeight: 1,
            fontVariantNumeric: "tabular-nums",
            margin: "0 0 8px",
            color: isPositive ? "var(--teal-700)" : "var(--error)",
          }}
        >
          <span
            style={{
              fontSize: "0.65em",
              fontWeight: 700,
              verticalAlign: "baseline",
            }}
          >
            {isPositive ? "+" : "-"}
          </span>
          <span
            style={{
              fontSize: "0.4em",
              fontWeight: 600,
              verticalAlign: "super",
              marginLeft: "2px",
              color: isPositive ? "var(--teal-800)" : "var(--error)",
            }}
          >
            $
          </span>
          {Math.abs(valeurNette).toLocaleString("fr-CA", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          })}
        </p>

        <p
          style={{
            fontSize: "14px",
            fontWeight: 500,
            color: "var(--slate-400)",
            marginBottom: "12px",
            letterSpacing: "-0.01em",
          }}
        >
          Epargne {formatCAD(totalEpargne)} · Dettes{" "}
          {formatCAD(totalDebtBalance)}
        </p>

        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "5px 14px",
            borderRadius: "100px",
            fontSize: "13px",
            fontWeight: 600,
            background: isPositive
              ? "var(--success-light)"
              : "var(--error-light)",
            color: isPositive ? "var(--success, #059669)" : "var(--error)",
          }}
        >
          {isPositive ? (
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
              <polyline points="16 7 22 7 22 13" />
            </svg>
          ) : (
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="22 17 13.5 8.5 8.5 13.5 2 7" />
              <polyline points="16 17 22 17 22 11" />
            </svg>
          )}
          {isPositive ? "En croissance" : "En deficit"}
        </span>
      </div>

      {/* -- TOTALS BAR -- */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "2px",
          margin: "0 20px 28px",
          background: "var(--slate-100)",
          borderRadius: "var(--radius-md)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "16px 12px",
            background: "var(--white, #fff)",
            textAlign: "center",
            borderRadius: "var(--radius-md) 0 0 var(--radius-md)",
          }}
        >
          <p
            style={{
              fontSize: "11px",
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--slate-400)",
              marginBottom: "4px",
            }}
          >
            Epargne
          </p>
          <p
            style={{
              fontSize: "clamp(1.2rem, 4vw, 1.5rem)",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              lineHeight: 1.1,
              fontVariantNumeric: "tabular-nums",
              color: "var(--teal-700)",
            }}
          >
            <span
              style={{
                fontSize: "0.5em",
                fontWeight: 600,
                color: "var(--teal-800)",
              }}
            >
              $
            </span>
            {totalEpargne.toLocaleString("fr-CA", {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            })}
          </p>
          <p
            style={{
              fontSize: "11px",
              fontWeight: 500,
              color: "var(--slate-400)",
              marginTop: "2px",
            }}
          >
            {projetsCount} pot{projetsCount !== 1 ? "s" : ""}
          </p>
        </div>
        <div
          style={{
            padding: "16px 12px",
            background: "var(--white, #fff)",
            textAlign: "center",
            borderRadius: "0 var(--radius-md) var(--radius-md) 0",
          }}
        >
          <p
            style={{
              fontSize: "11px",
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--slate-400)",
              marginBottom: "4px",
            }}
          >
            Dettes
          </p>
          <p
            style={{
              fontSize: "clamp(1.2rem, 4vw, 1.5rem)",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              lineHeight: 1.1,
              fontVariantNumeric: "tabular-nums",
              color: debtsCount > 0 ? "var(--error)" : "var(--slate-400)",
            }}
          >
            <span
              style={{
                fontSize: "0.5em",
                fontWeight: 600,
                color: debtsCount > 0 ? "var(--error)" : "var(--slate-400)",
              }}
            >
              $
            </span>
            {totalDebtBalance.toLocaleString("fr-CA", {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            })}
          </p>
          <p
            style={{
              fontSize: "11px",
              fontWeight: 500,
              color: "var(--slate-400)",
              marginTop: "2px",
            }}
          >
            {debtsCount} dette{debtsCount !== 1 ? "s" : ""}
          </p>
        </div>
      </div>
    </>
  );
}
