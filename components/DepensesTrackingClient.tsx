"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { markAsPaid, markAsUpcoming } from "@/lib/actions/monthly-expenses";
import { currentMonthKey } from "@/lib/month-utils";
import { GROUP_ORDER } from "@/lib/constants";
import MonthNavigator from "@/components/MonthNavigator";
import AdhocExpenseModal from "@/components/AdhocExpenseModal";
import ExpenseMonument from "@/components/depenses/ExpenseMonument";
import ExpenseFilters from "@/components/depenses/ExpenseFilters";
import StatusGroupSection from "@/components/depenses/StatusGroupSection";
import ExpenseSummaryStats from "@/components/depenses/ExpenseSummaryStats";
import ExpenseActionSheet from "@/components/depenses/ExpenseActionSheet";
import { getDisplayGroup } from "@/lib/expense-display-utils";
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

  const grouped = GROUP_ORDER.map((groupKey) => ({
    status: groupKey,
    items: filtered.filter((e) => getDisplayGroup(e) === groupKey),
  })).filter((g) => g.items.length > 0);

  function handleToggle(id: string, action: "paid" | "upcoming") {
    // Progressive expenses are never toggled — they accumulate via sub-transactions
    const expense = expenses.find((e) => e.id === id);
    if (expense?.is_progressive) return;

    startTransition(async () => {
      if (action === "paid") await markAsPaid(id);
      else await markAsUpcoming(id);
      router.refresh();
    });
  }

  const anySheetOpen = !!(actionSheet || adhocModal);

  return (
    <div style={{ padding: "0 0 120px", minHeight: "100vh" }}>
      <MonthNavigator month={month} basePath="/depenses" />

      <ExpenseMonument summary={summary} />

      <ExpenseFilters
        typeFilter={typeFilter}
        onTypeFilterChange={setTypeFilter}
        selectedSection={selectedSection}
        onSectionChange={setSelectedSection}
        plannedCount={plannedCount}
        unplannedCount={unplannedCount}
        sections={sections}
      />

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

      <StatusGroupSection
        grouped={grouped}
        isCurrentMonth={isCurrentMonth}
        onAction={handleToggle}
        onOpenActions={(expense) => setActionSheet(expense)}
      />

      {expenses.length > 0 && <ExpenseSummaryStats summary={summary} />}

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
