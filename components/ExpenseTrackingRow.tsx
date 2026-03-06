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
  const badge = getStatusBadge(expense.status);
  const variant = getExpenseIconVariant(expense.status);

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
          <span
            style={{
              fontSize: "10px",
              fontWeight: 700,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              padding: "2px 8px",
              borderRadius: "4px",
              background: badge.bg,
              color: badge.color,
            }}
          >
            {badge.label}
          </span>
          {!expense.is_planned && (
            <span
              style={{
                fontSize: "10px",
                fontWeight: 700,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                padding: "2px 8px",
                borderRadius: "4px",
                background: "var(--amber-100)",
                color: "var(--amber-600)",
              }}
            >
              Imprévu
            </span>
          )}
        </div>
      </div>

      {/* Amount + status label — stacked vertically like Timeline */}
      <div style={{ textAlign: "right", flexShrink: 0 }}>
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
      </div>

      {/* Toggle button — far right, only for current month */}
      {isCurrentMonth && (
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
