"use client";

import { formatCAD } from "@/lib/utils";
import { IconCheck } from "@/components/icons";
import type { MonthlyExpense } from "@/lib/types";
import {
  getExpenseIconVariant,
  ICON_STYLES,
  getStatusBadge,
  getExpenseAmountColor,
  getStatusLabel,
  type ExpenseIconVariant,
} from "@/lib/expense-display-utils";
import StatusBadge from "@/components/StatusBadge";
import type { StatusBadgeVariant } from "@/components/StatusBadge";

type Props = {
  expense: MonthlyExpense;
  isCurrentMonth: boolean;
  onAction: (id: string, action: "paid" | "upcoming") => void;
  onOpenActions?: () => void;
};

function ExpenseIcon({ variant }: { variant: ExpenseIconVariant }) {
  const style = ICON_STYLES[variant];
  return (
    <div
      style={{
        width: "40px",
        height: "40px",
        borderRadius: "var(--radius-sm)",
        background: style.bg,
        color: style.color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      {variant === "expense-paid" ? (
        <IconCheck size={20} />
      ) : variant === "expense-in-progress" ? (
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
          <line x1="12" y1="20" x2="12" y2="10" />
          <line x1="18" y1="20" x2="18" y2="4" />
          <line x1="6" y1="20" x2="6" y2="16" />
        </svg>
      ) : variant === "expense-late" ? (
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
          <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      ) : (
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
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      )}
    </div>
  );
}

export default function ExpenseTrackingRow({
  expense,
  isCurrentMonth,
  onAction,
  onOpenActions,
}: Props) {
  const isPaid = expense.status === "PAID";
  const isProgressive = expense.is_progressive;
  // Cast to number — DB returns DECIMAL as string
  const paidAmount = Number(expense.paid_amount);
  const budgetAmount = Number(expense.amount);
  const isOverBudget =
    isProgressive && paidAmount >= budgetAmount && budgetAmount > 0;
  const progressPct =
    isProgressive && budgetAmount > 0
      ? Math.min((paidAmount / budgetAmount) * 100, 100)
      : 0;

  // For progressive expenses, derive the display status for badge/icon
  const displayStatus = isProgressive
    ? expense.status === "OVERDUE" || expense.status === "DEFERRED"
      ? expense.status
      : paidAmount > 0 && paidAmount < budgetAmount
        ? "IN_PROGRESS"
        : paidAmount >= budgetAmount
          ? "PAID"
          : expense.status
    : expense.status;

  const badge = getStatusBadge(displayStatus);
  const variant = getExpenseIconVariant(
    displayStatus,
    isProgressive,
    expense.paid_amount,
  );

  return (
    <div
      className="expense-tracking-row"
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "14px 0",
        borderBottom: "1px solid var(--slate-100)",
        transition: "background 0.15s ease",
        cursor: isCurrentMonth ? "pointer" : "default",
        opacity: expense.status === "DEFERRED" ? 0.6 : 1,
      }}
      onClick={isCurrentMonth && onOpenActions ? onOpenActions : undefined}
    >
      {/* Status icon — same SVGs as TabTimeline */}
      <ExpenseIcon variant={variant} />

      {/* Name + meta */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: "14px",
            fontWeight: 600,
            color: "var(--slate-900)",
            letterSpacing: "-0.01em",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {expense.name}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            marginTop: "2px",
          }}
        >
          <span
            style={{
              fontSize: "12px",
              fontWeight: 500,
              color: "var(--slate-400)",
            }}
          >
            Charge
          </span>
          <StatusBadge
            label={badge.label}
            variant={
              (displayStatus === "PAID" || displayStatus === "IN_PROGRESS"
                ? "success"
                : displayStatus === "OVERDUE" || displayStatus === "DEFERRED"
                  ? displayStatus === "OVERDUE"
                    ? "danger"
                    : "warning"
                  : "neutral") as StatusBadgeVariant
            }
          />
          {!expense.is_planned && (
            <StatusBadge label="Imprévu" variant="warning" />
          )}
        </div>
      </div>

      {/* Amount + status label — stacked vertically like Timeline */}
      <div
        style={{
          textAlign: "right",
          flexShrink: 0,
          minWidth: isProgressive ? "110px" : undefined,
        }}
      >
        {isProgressive ? (
          <>
            <div
              style={{
                fontSize: "14px",
                fontWeight: 800,
                letterSpacing: "-0.02em",
                fontVariantNumeric: "tabular-nums",
                color: isOverBudget ? "var(--error)" : "var(--slate-900)",
              }}
            >
              {formatCAD(expense.paid_amount)} / {formatCAD(expense.amount)}
            </div>
            {/* Mini progress bar */}
            <div
              style={{
                height: "4px",
                borderRadius: "2px",
                background: "var(--slate-100)",
                marginTop: "4px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${progressPct}%`,
                  borderRadius: "2px",
                  background: isOverBudget ? "var(--error)" : "var(--teal-700)",
                  transition: "width 0.3s ease",
                }}
              />
            </div>
          </>
        ) : (
          <>
            <div
              style={{
                fontSize: "15px",
                fontWeight: 800,
                letterSpacing: "-0.02em",
                fontVariantNumeric: "tabular-nums",
                color: getExpenseAmountColor(expense.status),
              }}
            >
              {isPaid && "-"}
              {formatCAD(Number(expense.amount))}
            </div>
            <div
              style={{
                fontSize: "11px",
                fontWeight: 500,
                color: "var(--slate-400)",
                marginTop: "2px",
              }}
            >
              {getStatusLabel(expense.status)}
            </div>
          </>
        )}
      </div>

      {/* Toggle button — far right, only for current month, hidden for progressives */}
      {isCurrentMonth && !isProgressive && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAction(expense.id, isPaid ? "upcoming" : "paid");
          }}
          title={isPaid ? "Remettre à venir" : "Marquer payée"}
          style={{
            width: "28px",
            height: "28px",
            borderRadius: "50%",
            border: isPaid ? "none" : "2px solid var(--slate-200)",
            background: isPaid ? "var(--positive)" : "var(--white)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            transition: "all 0.2s ease",
            flexShrink: 0,
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke={isPaid ? "white" : "var(--slate-300)"}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
