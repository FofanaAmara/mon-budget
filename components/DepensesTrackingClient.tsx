"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { markAsPaid, markAsUpcoming } from "@/lib/actions/monthly-expenses";
import { currentMonthKey } from "@/lib/month-utils";
import { GROUP_ORDER, GROUP_LABELS } from "@/lib/constants";
import MonthNavigator from "@/components/MonthNavigator";
import ExpenseTrackingRow from "@/components/ExpenseTrackingRow";
import AdhocExpenseModal from "@/components/AdhocExpenseModal";
import ExpenseActionSheet from "@/components/depenses/ExpenseActionSheet";
import type { MonthlyExpense, MonthSummary, Section, Card } from "@/lib/types";

type Props = {
  expenses: MonthlyExpense[];
  summary: MonthSummary;
  sections: Section[];
  cards: Card[];
  month: string;
};

export default function DepensesTrackingClient({
  expenses,
  summary,
  sections,
  cards,
  month,
}: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  // Filters
  const [typeFilter, setTypeFilter] = useState<"all" | "planned" | "unplanned">(
    "all",
  );
  const [selectedSection, setSelectedSection] = useState<string | null>(null);

  // Expanded groups (all expanded by default)
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(
    new Set(),
  );

  // Sheets
  const [actionSheet, setActionSheet] = useState<MonthlyExpense | null>(null);
  const [adhocModal, setAdhocModal] = useState(false);

  const today = currentMonthKey();
  const isCurrentMonth = month === today;

  const plannedCount = expenses.filter((e) => e.is_planned).length;
  const unplannedCount = expenses.filter((e) => !e.is_planned).length;

  const filtered = expenses
    .filter((e) =>
      typeFilter === "all"
        ? true
        : typeFilter === "planned"
          ? e.is_planned
          : !e.is_planned,
    )
    .filter((e) => (selectedSection ? e.section_id === selectedSection : true));

  const grouped = GROUP_ORDER.map((status) => ({
    status,
    items: filtered.filter((e) => e.status === status),
  })).filter((g) => g.items.length > 0);

  // Monument numbers
  const chargesFixes = summary.planned_total;
  const paidTotal = summary.paid_total;
  const progressPct =
    chargesFixes > 0 ? Math.min((paidTotal / chargesFixes) * 100, 100) : 0;
  const isOverBudget = paidTotal > chargesFixes && chargesFixes > 0;
  const restAPayer = Math.max(chargesFixes - paidTotal, 0);
  const overAmount = paidTotal - chargesFixes;

  function handleToggle(id: string, action: "paid" | "upcoming") {
    startTransition(async () => {
      if (action === "paid") await markAsPaid(id);
      else await markAsUpcoming(id);
      router.refresh();
    });
  }

  function toggleGroup(status: string) {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(status)) next.delete(status);
      else next.add(status);
      return next;
    });
  }

  const anySheetOpen = !!(actionSheet || adhocModal);

  return (
    <div style={{ padding: "0 0 120px", minHeight: "100vh" }}>
      <MonthNavigator month={month} basePath="/depenses" />

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

      {/* ====== TYPE FILTER TABS ====== */}
      <div
        style={{
          display: "flex",
          gap: "4px",
          background: "var(--slate-100)",
          borderRadius: "var(--radius-md)",
          padding: "4px",
          margin: "20px 20px 0",
        }}
      >
        {[
          { key: "all" as const, label: "Tout" },
          { key: "planned" as const, label: `Charges (${plannedCount})` },
          { key: "unplanned" as const, label: `Imprévus (${unplannedCount})` },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTypeFilter(key)}
            style={{
              flex: key === "all" ? "0 0 auto" : 1,
              padding: "9px 12px",
              whiteSpace: "nowrap",
              borderRadius: "var(--radius-sm)",
              fontSize: "13px",
              fontWeight: 650,
              cursor: "pointer",
              background: typeFilter === key ? "var(--white)" : "transparent",
              color:
                typeFilter === key ? "var(--slate-900)" : "var(--slate-500)",
              border: "none",
              boxShadow:
                typeFilter === key ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
              transition: "all 0.2s ease",
              textAlign: "center",
              fontFamily: "var(--font)",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ====== SECTION FILTER PILLS ====== */}
      {sections.length > 0 && (
        <div
          style={{
            display: "flex",
            gap: "8px",
            overflowX: "auto",
            padding: "14px 20px 4px",
            WebkitOverflowScrolling: "touch",
            scrollbarWidth: "none",
          }}
        >
          <button
            onClick={() => setSelectedSection(null)}
            style={{
              flexShrink: 0,
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 16px",
              background:
                selectedSection === null ? "var(--teal-700)" : "var(--white)",
              border: `1px solid ${selectedSection === null ? "var(--teal-700)" : "var(--slate-200)"}`,
              borderRadius: "100px",
              fontFamily: "var(--font)",
              fontSize: "13px",
              fontWeight: 600,
              color:
                selectedSection === null ? "var(--white)" : "var(--slate-500)",
              cursor: "pointer",
              transition: "all 0.2s ease",
              whiteSpace: "nowrap",
            }}
          >
            Tout
          </button>
          {sections.map((s) => (
            <button
              key={s.id}
              onClick={() =>
                setSelectedSection(s.id === selectedSection ? null : s.id)
              }
              style={{
                flexShrink: 0,
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 16px",
                background:
                  selectedSection === s.id ? "var(--teal-700)" : "var(--white)",
                border: `1px solid ${selectedSection === s.id ? "var(--teal-700)" : "var(--slate-200)"}`,
                borderRadius: "100px",
                fontFamily: "var(--font)",
                fontSize: "13px",
                fontWeight: 600,
                color:
                  selectedSection === s.id
                    ? "var(--white)"
                    : "var(--slate-500)",
                cursor: "pointer",
                transition: "all 0.2s ease",
                whiteSpace: "nowrap",
              }}
            >
              <span style={{ fontSize: "14px", lineHeight: 1 }}>{s.icon}</span>
              <span>{s.name}</span>
            </button>
          ))}
        </div>
      )}

      {/* ====== EMPTY STATE ====== */}
      {expenses.length === 0 && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            padding: "80px 20px",
          }}
        >
          <div style={{ fontSize: "3rem", marginBottom: "16px", opacity: 0.6 }}>
            📅
          </div>
          <p
            style={{
              color: "var(--slate-500)",
              fontSize: "15px",
              marginBottom: "8px",
              fontWeight: 500,
            }}
          >
            Aucune dépense ce mois
          </p>
          <p
            style={{
              color: "var(--slate-400)",
              fontSize: "13px",
              opacity: 0.7,
            }}
          >
            Les dépenses récurrentes apparaissent automatiquement
          </p>
        </div>
      )}

      {/* ====== GROUPED EXPENSES BY STATUS ====== */}
      <div
        style={{
          paddingTop: "20px",
          paddingBottom: "8px",
          paddingLeft: "20px",
          paddingRight: "20px",
        }}
      >
        {grouped.map(({ status, items }) => {
          const isCollapsed = collapsedGroups.has(status);
          const groupTotal = items.reduce(
            (sum, e) => sum + Number(e.amount),
            0,
          );
          const isOverdueGroup = status === "OVERDUE";

          return (
            <div key={status} style={{ position: "relative" }}>
              <div
                onClick={() => toggleGroup(status)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  fontSize: "12px",
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase" as const,
                  color: isOverdueGroup ? "var(--error)" : "var(--slate-400)",
                  padding: "16px 0 10px",
                  borderBottom: "1px solid var(--slate-100)",
                  cursor: "pointer",
                  userSelect: "none",
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "6px" }}
                >
                  <span>{GROUP_LABELS[status]}</span>
                  <span style={{ fontWeight: 600, opacity: 0.7 }}>
                    ({items.length})
                  </span>
                </div>
                <div
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <span style={{ fontVariantNumeric: "tabular-nums" }}>
                    $
                    {groupTotal.toLocaleString("fr-CA", {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    })}
                  </span>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{
                      transition: "transform 0.25s ease",
                      transform: isCollapsed
                        ? "rotate(0deg)"
                        : "rotate(180deg)",
                    }}
                  >
                    <polyline points="18 15 12 9 6 15" />
                  </svg>
                </div>
              </div>

              {!isCollapsed && (
                <div>
                  {items.map((expense) => (
                    <ExpenseTrackingRow
                      key={expense.id}
                      expense={expense}
                      isCurrentMonth={isCurrentMonth}
                      onAction={handleToggle}
                      onOpenActions={
                        isCurrentMonth
                          ? () => setActionSheet(expense)
                          : undefined
                      }
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ====== SUMMARY STATS ====== */}
      {expenses.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "12px",
            padding: "20px 20px 0",
          }}
        >
          <StatCard
            label="Payées"
            amount={paidTotal}
            color="var(--positive)"
            detail={`${summary.paid_count} dépense${summary.paid_count > 1 ? "s" : ""}`}
          />
          <StatCard
            label={isOverBudget ? "Au-dessus" : "Restant"}
            amount={isOverBudget ? overAmount : restAPayer}
            color={isOverBudget ? "var(--error)" : "var(--teal-700)"}
            detail={`sur $${chargesFixes.toLocaleString("fr-CA")} prévu`}
          />
        </div>
      )}

      {/* ====== FAB ====== */}
      {isCurrentMonth && (
        <button
          onClick={() => setAdhocModal(true)}
          aria-label="Ajouter une dépense imprévue"
          className="fab fab-mobile-only"
        >
          <svg
            width="26"
            height="26"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      )}

      {/* ====== BACKDROP ====== */}
      {anySheetOpen && (
        <div
          role="presentation"
          onClick={() => {
            setActionSheet(null);
            setAdhocModal(false);
          }}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.5)",
            backdropFilter: "blur(4px)",
            WebkitBackdropFilter: "blur(4px)",
            zIndex: 200,
          }}
        />
      )}

      {/* ====== ACTION SHEET ====== */}
      {actionSheet && (
        <ExpenseActionSheet
          expense={actionSheet}
          month={month}
          onClose={() => {
            setActionSheet(null);
            router.refresh();
          }}
        />
      )}

      {/* ====== ADHOC MODAL ====== */}
      {adhocModal && (
        <AdhocExpenseModal
          sections={sections}
          cards={cards}
          month={month}
          onClose={() => {
            setAdhocModal(false);
            router.refresh();
          }}
        />
      )}
    </div>
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

function StatCard({
  label,
  amount,
  color,
  detail,
}: {
  label: string;
  amount: number;
  color: string;
  detail: string;
}) {
  return (
    <div
      style={{
        background: "var(--white)",
        border: "1px solid var(--slate-200)",
        borderRadius: "var(--radius-md)",
        padding: "16px",
      }}
    >
      <p
        style={{
          fontSize: "11px",
          fontWeight: 700,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "var(--slate-400)",
          marginBottom: "6px",
        }}
      >
        {label}
      </p>
      <p
        style={{
          fontSize: "22px",
          fontWeight: 800,
          letterSpacing: "-0.03em",
          color,
          fontVariantNumeric: "tabular-nums",
          lineHeight: 1,
        }}
      >
        <span
          style={{
            fontSize: "0.55em",
            fontWeight: 600,
            color: "inherit",
            verticalAlign: "super",
          }}
        >
          $
        </span>
        {amount.toLocaleString("fr-CA", {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        })}
      </p>
      <p
        style={{
          fontSize: "11px",
          fontWeight: 500,
          color: "var(--slate-400)",
          marginTop: "4px",
        }}
      >
        {detail}
      </p>
    </div>
  );
}
