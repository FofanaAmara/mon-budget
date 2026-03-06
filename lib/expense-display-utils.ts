/**
 * Shared display utilities for expense/income tracking components.
 * Extracted from TabTimeline.tsx and ExpenseTrackingRow.tsx to eliminate duplication.
 */

// ── Icon variant types ──

export type TimelineIconVariant =
  | "income-received"
  | "expense-paid"
  | "charge-upcoming"
  | "expense-late"
  | "savings"
  | "debt-payment"
  | "income-upcoming";

export type ExpenseIconVariant =
  | "charge-upcoming"
  | "expense-paid"
  | "expense-late"
  | "expense-in-progress"
  | "deferred";

// ── Timeline icon variant (for events with type + status) ──

export function getTimelineIconVariant(event: {
  type: "expense" | "income";
  status: string;
}): TimelineIconVariant {
  if (event.type === "income") {
    return event.status === "RECEIVED" ? "income-received" : "income-upcoming";
  }
  if (event.status === "OVERDUE") return "expense-late";
  if (event.status === "PAID") return "expense-paid";
  return "charge-upcoming";
}

// ── Expense icon variant (for expense-only status) ──

export function getExpenseIconVariant(
  status: string,
  isProgressive = false,
  paidAmount = 0,
): ExpenseIconVariant {
  if (status === "OVERDUE") return "expense-late";
  if (status === "PAID") return "expense-paid";
  if (status === "DEFERRED") return "deferred";
  if (isProgressive && paidAmount > 0) return "expense-in-progress";
  return "charge-upcoming";
}

// ── Icon styles map (superset of both Timeline and ExpenseTracking) ──

export const ICON_STYLES: Record<
  TimelineIconVariant | ExpenseIconVariant,
  { bg: string; color: string }
> = {
  "income-received": {
    bg: "var(--success-light)",
    color: "var(--positive)",
  },
  "income-upcoming": { bg: "var(--teal-50)", color: "var(--teal-700)" },
  "expense-paid": { bg: "var(--teal-50)", color: "var(--teal-700)" },
  "charge-upcoming": { bg: "var(--slate-100)", color: "var(--slate-400)" },
  "expense-in-progress": { bg: "var(--teal-50)", color: "var(--teal-700)" },
  "expense-late": { bg: "var(--error-light)", color: "var(--error)" },
  savings: { bg: "#ECFDF5", color: "var(--positive)" },
  "debt-payment": { bg: "var(--warning-light)", color: "var(--amber-600)" },
  deferred: { bg: "var(--amber-50)", color: "var(--amber-500)" },
};

// ── Badge variant (Timeline) ──

export type BadgeVariant =
  | "received"
  | "paid"
  | "upcoming"
  | "late"
  | "expected";

export const BADGE_STYLES: Record<
  BadgeVariant,
  { bg: string; color: string; label: string }
> = {
  received: {
    bg: "var(--success-light)",
    color: "var(--positive)",
    label: "Reçu",
  },
  paid: { bg: "var(--teal-50)", color: "var(--teal-700)", label: "Payé" },
  upcoming: {
    bg: "var(--slate-100)",
    color: "var(--slate-500)",
    label: "Prévu",
  },
  late: {
    bg: "var(--error-light)",
    color: "var(--error)",
    label: "En retard",
  },
  expected: {
    bg: "var(--slate-100)",
    color: "var(--slate-500)",
    label: "Attendu",
  },
};

export function getBadgeVariant(event: {
  type: "expense" | "income";
  status: string;
}): BadgeVariant {
  if (event.type === "income") {
    return event.status === "RECEIVED" ? "received" : "expected";
  }
  if (event.status === "OVERDUE") return "late";
  if (event.status === "PAID") return "paid";
  return "upcoming";
}

// ── Status badge (ExpenseTrackingRow) ──

export function getStatusBadge(status: string): {
  bg: string;
  color: string;
  label: string;
} {
  if (status === "PAID")
    return { bg: "var(--teal-50)", color: "var(--teal-700)", label: "Payé" };
  if (status === "OVERDUE")
    return {
      bg: "var(--error-light)",
      color: "var(--error)",
      label: "En retard",
    };
  if (status === "DEFERRED")
    return {
      bg: "var(--amber-50)",
      color: "var(--amber-500)",
      label: "Reporté",
    };
  if (status === "IN_PROGRESS")
    return {
      bg: "var(--teal-50)",
      color: "var(--teal-700)",
      label: "En cours",
    };
  return { bg: "var(--slate-100)", color: "var(--slate-500)", label: "Prévu" };
}

// ── Amount color ──

export function getTimelineAmountColor(event: {
  type: "expense" | "income";
  status: string;
}): string {
  if (event.type === "income" && event.status === "RECEIVED")
    return "var(--positive)";
  if (event.status === "OVERDUE") return "var(--error)";
  if (event.status === "PAID") return "var(--slate-900)";
  return "var(--slate-400)";
}

export function getExpenseAmountColor(status: string): string {
  if (status === "OVERDUE") return "var(--error)";
  if (status === "PAID") return "var(--slate-900)";
  return "var(--slate-400)";
}

// ── Status label ──

export function getStatusLabel(status: string): string {
  if (status === "PAID") return "Payé";
  if (status === "OVERDUE") return "En retard";
  if (status === "DEFERRED") return "Reporté";
  if (status === "IN_PROGRESS") return "En cours";
  return "Prévu";
}
