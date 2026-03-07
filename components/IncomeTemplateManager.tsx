"use client";

import { useState } from "react";
import { deleteIncome } from "@/lib/actions/incomes";
import {
  calcMonthlyIncome,
  formatShortDate,
  getNextBiweeklyPayDate,
} from "@/lib/utils";
import type { Income, IncomeFrequency, IncomeSource } from "@/lib/types";
import IncomeModal from "./IncomeModal";

// ── Helpers ──────────────────────────────────────────────────────────────────

const FREQUENCY_LABELS: Record<IncomeFrequency, string> = {
  MONTHLY: "Mensuel",
  BIWEEKLY: "Aux 2 sem.",
  YEARLY: "Annuel",
  VARIABLE: "Variable",
};

/**
 * Source metadata — icon, label, icon background colour.
 * Colours match the mockup exactly:
 *   Emploi       → blue-50 (#EFF6FF)
 *   Business     → teal-50 (#F0FDFA)
 *   Investissement → emerald-50 (#ECFDF5)
 *   Autre        → purple-50 (#F5F3FF)
 */
const SOURCE_META: Record<
  IncomeSource,
  { label: string; emoji: string; bg: string; cssClass: string }
> = {
  EMPLOYMENT: {
    label: "Emploi",
    emoji: "💼",
    bg: "#EFF6FF",
    cssClass: "emploi",
  },
  BUSINESS: {
    label: "Business",
    emoji: "🏢",
    bg: "#F0FDFA",
    cssClass: "business",
  },
  INVESTMENT: {
    label: "Investissement",
    emoji: "📈",
    bg: "#ECFDF5",
    cssClass: "investissement",
  },
  OTHER: { label: "Autre", emoji: "🔧", bg: "#F5F3FF", cssClass: "autre" },
};

/** Format monthly amount for display on source card. */
function formatMonthlyDisplay(amount: number): string {
  return amount.toLocaleString("fr-CA", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

/** Compute next pay date label for a given income. */
function getNextDateLabel(inc: Income): string | null {
  if (inc.frequency === "VARIABLE") return null;
  if (inc.frequency === "BIWEEKLY" && inc.pay_anchor_date) {
    const next = getNextBiweeklyPayDate(inc.pay_anchor_date);
    return `Prochain depot : ${formatShortDate(next)}`;
  }
  if (inc.frequency === "MONTHLY" && inc.pay_anchor_date) {
    const anchor = new Date(inc.pay_anchor_date);
    const day = anchor.getUTCDate();
    return `Prochain depot : le ${day} du mois`;
  }
  return null;
}

// ── Types ────────────────────────────────────────────────────────────────────

type Props = {
  incomes: Income[];
};

// ── Main component ────────────────────────────────────────────────────────────

export default function IncomeTemplateManager({ incomes }: Props) {
  const [showModal, setShowModal] = useState(false);
  const [editIncome, setEditIncome] = useState<Income | undefined>(undefined);

  function openAdd() {
    setEditIncome(undefined);
    setShowModal(true);
  }

  function openEdit(inc: Income) {
    setEditIncome(inc);
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditIncome(undefined);
  }

  async function handleDelete(id: string) {
    if (confirm("Supprimer ce revenu ?")) {
      await deleteIncome(id);
    }
  }

  return (
    <>
      {/* Desktop content wrapper — centred at 680px on desktop */}
      <div style={{ maxWidth: "680px", margin: "0 auto", padding: "0 20px" }}>
        {/* ── Page header: section label + add button ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: "16px",
            marginBottom: "0",
          }}
        >
          <h2
            style={{
              fontSize: "12px",
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--slate-400)",
            }}
          >
            Mes sources
          </h2>

          {/* Desktop add button — hidden on mobile (FAB handles it) */}
          <button
            onClick={openAdd}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "9px 18px",
              background: "var(--teal-700)",
              color: "#FFFFFF",
              border: "none",
              borderRadius: "var(--radius-md)",
              fontFamily: "var(--font)",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              letterSpacing: "-0.01em",
              transition: "all 0.2s ease",
              whiteSpace: "nowrap",
            }}
            onMouseEnter={(e) => {
              const btn = e.currentTarget;
              btn.style.background = "var(--teal-800)";
              btn.style.transform = "translateY(-1px)";
              btn.style.boxShadow = "0 4px 12px rgba(15, 118, 110, 0.08)";
            }}
            onMouseLeave={(e) => {
              const btn = e.currentTarget;
              btn.style.background = "var(--teal-700)";
              btn.style.transform = "translateY(0)";
              btn.style.boxShadow = "none";
            }}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              width="16"
              height="16"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Ajouter un revenu récurrent
          </button>
        </div>

        {/* ── Source list ── */}
        <div
          style={{
            marginTop: "16px",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          {incomes.length === 0 ? (
            <EmptyState onAdd={openAdd} />
          ) : (
            incomes.map((inc) => (
              <SourceCard
                key={inc.id}
                inc={inc}
                onEdit={openEdit}
                onDelete={handleDelete}
              />
            ))
          )}
        </div>
      </div>

      {/* ── FAB (mobile only) ── */}
      <FabButton onClick={openAdd} />

      {/* ── Modal ── */}
      {showModal && <IncomeModal income={editIncome} onClose={closeModal} />}
    </>
  );
}

// ── Source card ───────────────────────────────────────────────────────────────

function SourceCard({
  inc,
  onEdit,
  onDelete,
}: {
  inc: Income;
  onEdit: (inc: Income) => void;
  onDelete: (id: string) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  const srcMeta = SOURCE_META[inc.source ?? "OTHER"];
  const isVariable = inc.frequency === "VARIABLE";

  const monthly = calcMonthlyIncome(
    inc.amount != null ? Number(inc.amount) : null,
    inc.frequency,
    inc.estimated_amount != null ? Number(inc.estimated_amount) : null,
  );

  const nextDateLabel = getNextDateLabel(inc);

  const freqLabel = FREQUENCY_LABELS[inc.frequency] ?? inc.frequency;

  // For non-variable: show "Mensuel · le 2 du mois" style
  let metaFreqText = freqLabel;
  if (!isVariable && inc.pay_anchor_date) {
    const anchor = new Date(String(inc.pay_anchor_date));
    const day = anchor.getUTCDate();
    if (inc.frequency === "MONTHLY") {
      metaFreqText = `Mensuel · le ${day} du mois`;
    }
  }

  return (
    <div
      style={{
        background: "#FFFFFF",
        border: "1px solid var(--slate-200)",
        borderRadius: "var(--radius-lg)",
        padding: "20px",
        transition: "all 0.25s ease",
        position: "relative",
      }}
      onMouseEnter={(e) => {
        const card = e.currentTarget;
        card.style.borderColor = "rgba(15, 118, 110, 0.2)";
        card.style.boxShadow = "0 4px 12px rgba(15, 118, 110, 0.08)";
        card.style.transform = "translateY(-2px)";
        // reveal menu button
        const menu = card.querySelector<HTMLButtonElement>("[data-menu]");
        if (menu) menu.style.opacity = "1";
      }}
      onMouseLeave={(e) => {
        const card = e.currentTarget;
        card.style.borderColor = "var(--slate-200)";
        card.style.boxShadow = "none";
        card.style.transform = "translateY(0)";
        if (!menuOpen) {
          const menu = card.querySelector<HTMLButtonElement>("[data-menu]");
          if (menu) menu.style.opacity = "0";
        }
      }}
    >
      {/* Three-dot menu */}
      <div style={{ position: "absolute", top: "16px", right: "16px" }}>
        <button
          data-menu
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen((prev) => !prev);
          }}
          aria-label="Options"
          style={{
            width: "28px",
            height: "28px",
            border: "none",
            background: "transparent",
            borderRadius: "var(--radius-sm)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: "var(--slate-400)",
            transition: "all 0.15s",
            // On mobile: always visible. On desktop: revealed by card hover.
            opacity: 1, // will be toggled by JS on desktop via mouseenter
          }}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            width="16"
            height="16"
          >
            <circle cx="12" cy="5" r="1" />
            <circle cx="12" cy="12" r="1" />
            <circle cx="12" cy="19" r="1" />
          </svg>
        </button>

        {/* Dropdown menu */}
        {menuOpen && (
          <>
            {/* Click-away backdrop */}
            <div
              style={{ position: "fixed", inset: 0, zIndex: 10 }}
              onClick={() => setMenuOpen(false)}
            />
            <div
              style={{
                position: "absolute",
                top: "32px",
                right: 0,
                background: "#FFFFFF",
                border: "1px solid var(--slate-200)",
                borderRadius: "var(--radius-md)",
                boxShadow: "0 8px 24px rgba(15, 118, 110, 0.12)",
                minWidth: "160px",
                overflow: "hidden",
                zIndex: 20,
              }}
            >
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onEdit(inc);
                }}
                style={{
                  width: "100%",
                  padding: "10px 16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: 500,
                  color: "var(--slate-700)",
                  fontFamily: "var(--font)",
                  textAlign: "left",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--slate-50)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "none";
                }}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  width="14"
                  height="14"
                >
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z" />
                </svg>
                Modifier
              </button>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onDelete(inc.id);
                }}
                style={{
                  width: "100%",
                  padding: "10px 16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  background: "none",
                  border: "none",
                  borderTop: "1px solid var(--slate-100)",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: 500,
                  color: "var(--error)",
                  fontFamily: "var(--font)",
                  textAlign: "left",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--error-light)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "none";
                }}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  width="14"
                  height="14"
                >
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                  <path d="M10 11v6M14 11v6" />
                </svg>
                Supprimer
              </button>
            </div>
          </>
        )}
      </div>

      {/* ── Card top row ── */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "12px",
        }}
      >
        {/* Left: icon + info */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "14px",
            flex: 1,
            minWidth: 0,
          }}
        >
          {/* Source icon */}
          <div
            style={{
              width: "44px",
              height: "44px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "var(--radius-sm)",
              background: srcMeta.bg,
              flexShrink: 0,
              fontSize: "20px",
            }}
          >
            {srcMeta.emoji}
          </div>

          {/* Name + meta */}
          <div style={{ minWidth: 0, flex: 1 }}>
            <div
              style={{
                fontSize: "15px",
                fontWeight: 700,
                color: "var(--slate-900)",
                letterSpacing: "-0.01em",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                paddingRight: "36px", // space for menu button
              }}
            >
              {inc.name}
            </div>
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
                {srcMeta.label}
              </span>
              <span
                style={{
                  width: "3px",
                  height: "3px",
                  borderRadius: "50%",
                  background: "var(--slate-300)",
                  flexShrink: 0,
                  display: "inline-block",
                }}
              />
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: 500,
                  color: "var(--slate-500)",
                  letterSpacing: "-0.01em",
                }}
              >
                {metaFreqText}
              </span>
            </div>
          </div>
        </div>

        {/* Right: amount */}
        <div
          style={{
            fontSize: "clamp(1.3rem, 5vw, 1.6rem)",
            fontWeight: 800,
            letterSpacing: "-0.03em",
            lineHeight: 1.1,
            color: "var(--slate-900)",
            fontVariantNumeric: "tabular-nums",
            textAlign: "right",
            whiteSpace: "nowrap",
            flexShrink: 0,
          }}
        >
          {isVariable ? "~" : ""}
          {formatMonthlyDisplay(monthly)}
          <span
            style={{
              fontSize: "0.5em",
              fontWeight: 600,
              color: "var(--teal-700)",
            }}
          >
            $
          </span>
          <span
            style={{
              fontSize: "0.4em",
              fontWeight: 500,
              color: "var(--slate-400)",
              letterSpacing: 0,
            }}
          >
            /mois
          </span>
        </div>
      </div>

      {/* ── Card bottom row ── */}
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
        {/* Next date or variable note */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "13px",
            fontWeight: 500,
            color: "var(--slate-500)",
            letterSpacing: "-0.01em",
            flex: 1,
            minWidth: 0,
          }}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            width="14"
            height="14"
            style={{ color: "var(--slate-400)", flexShrink: 0 }}
          >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          {isVariable ? (
            <span>Montant estime pour les previsions</span>
          ) : nextDateLabel ? (
            <span suppressHydrationWarning>
              Prochain depot&nbsp;:&nbsp;
              <strong style={{ fontWeight: 700, color: "var(--slate-700)" }}>
                {nextDateLabel.replace("Prochain depot : ", "")}
              </strong>
            </span>
          ) : (
            <span>{metaFreqText}</span>
          )}
        </div>

        {/* Badges */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            flexShrink: 0,
          }}
        >
          {inc.auto_deposit && !isVariable && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                padding: "4px 10px",
                borderRadius: "100px",
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "0.02em",
                background: "var(--teal-50)",
                color: "var(--teal-700)",
                border: "1px solid rgba(15, 118, 110, 0.1)",
              }}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                width="12"
                height="12"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Depot auto
            </span>
          )}
          {isVariable && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                padding: "4px 10px",
                borderRadius: "100px",
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "0.02em",
                background: "var(--warning-light)",
                color: "var(--amber-600)",
                border: "1px solid rgba(245, 158, 11, 0.15)",
              }}
            >
              Variable
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Empty state ────────────────────────────────────────────────────────────────

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div style={{ textAlign: "center", padding: "48px 20px" }}>
      <div
        style={{
          width: "64px",
          height: "64px",
          borderRadius: "var(--radius-lg)",
          background: "var(--teal-50)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 16px",
          fontSize: "28px",
        }}
      >
        💰
      </div>
      <p
        style={{
          fontSize: "17px",
          fontWeight: 700,
          color: "var(--slate-900)",
          letterSpacing: "-0.02em",
          marginBottom: "6px",
        }}
      >
        Aucune source configuree
      </p>
      <p
        style={{
          fontSize: "14px",
          fontWeight: 400,
          color: "var(--slate-500)",
          maxWidth: "280px",
          margin: "0 auto 20px",
          lineHeight: 1.5,
        }}
      >
        Ajoute ta premiere source de revenu pour suivre tes entrees
        d&apos;argent.
      </p>
      <button
        onClick={onAdd}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          padding: "12px 24px",
          background: "var(--teal-700)",
          color: "#FFFFFF",
          border: "none",
          borderRadius: "var(--radius-md)",
          fontFamily: "var(--font)",
          fontSize: "15px",
          fontWeight: 700,
          cursor: "pointer",
          transition: "all 0.2s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "var(--teal-800)";
          e.currentTarget.style.transform = "translateY(-1px)";
          e.currentTarget.style.boxShadow =
            "0 4px 12px rgba(15, 118, 110, 0.08)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "var(--teal-700)";
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "none";
        }}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          width="18"
          height="18"
        >
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        Ajouter un revenu récurrent
      </button>
    </div>
  );
}

// ── FAB (mobile only) ─────────────────────────────────────────────────────────

function FabButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label="Ajouter un revenu récurrent"
      style={{
        position: "fixed",
        bottom: "max(72px, calc(56px + env(safe-area-inset-bottom)))",
        right: "20px",
        width: "56px",
        height: "56px",
        borderRadius: "50%",
        background: "var(--teal-700)",
        color: "#FFFFFF",
        border: "none",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 8px 24px rgba(15, 118, 110, 0.12)",
        transition: "all 0.2s ease",
        zIndex: 40,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "var(--teal-800)";
        e.currentTarget.style.transform = "scale(1.05)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "var(--teal-700)";
        e.currentTarget.style.transform = "scale(1)";
      }}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        width="24"
        height="24"
      >
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    </button>
  );
}
