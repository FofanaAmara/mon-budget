"use client";

import { useState } from "react";
import { formatCAD } from "@/lib/utils";
import { GROUP_LABELS } from "@/lib/constants";
import ExpenseTrackingRow from "@/components/ExpenseTrackingRow";
import type { MonthlyExpense, ExpenseGroupKey } from "@/lib/types";

type GroupedExpenses = {
  status: ExpenseGroupKey;
  items: MonthlyExpense[];
};

type Props = {
  grouped: GroupedExpenses[];
  isCurrentMonth: boolean;
  onAction: (id: string, action: "paid" | "upcoming") => void;
  onOpenActions: (expense: MonthlyExpense) => void;
};

export default function StatusGroupSection({
  grouped,
  isCurrentMonth,
  onAction,
  onOpenActions,
}: Props) {
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(
    new Set(),
  );

  function toggleGroup(status: string) {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(status)) next.delete(status);
      else next.add(status);
      return next;
    });
  }

  return (
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
        const groupTotal = items.reduce((sum, e) => sum + Number(e.amount), 0);
        const isOverdueGroup = status === "OVERDUE";

        return (
          <div key={status} style={{ position: "relative" }}>
            <div
              onClick={() => toggleGroup(status)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase" as const,
                color: isOverdueGroup ? "var(--error)" : "var(--teal-700)",
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
                  {formatCAD(groupTotal)}
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
                    transform: isCollapsed ? "rotate(0deg)" : "rotate(180deg)",
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
                    onAction={onAction}
                    onOpenActions={
                      isCurrentMonth ? () => onOpenActions(expense) : undefined
                    }
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
