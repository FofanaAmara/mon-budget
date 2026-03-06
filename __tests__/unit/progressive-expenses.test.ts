/**
 * Tests for progressive expense display logic (PROG-004).
 * Covers: getDisplayGroup, getExpenseIconVariant, getStatusBadge, getStatusLabel.
 */
import { describe, it, expect } from "vitest";
import {
  getExpenseIconVariant,
  getStatusBadge,
  getStatusLabel,
} from "@/lib/expense-display-utils";
import type { MonthlyExpense, ExpenseGroupKey } from "@/lib/types";

// --- Helper to build a minimal MonthlyExpense ---

function makeExpense(overrides: Partial<MonthlyExpense> = {}): MonthlyExpense {
  return {
    id: "me-1",
    user_id: "u-1",
    expense_id: "e-1",
    debt_id: null,
    month: "2026-03",
    name: "Epicerie",
    amount: 1000,
    due_date: "2026-03-15",
    status: "UPCOMING",
    paid_at: null,
    section_id: null,
    card_id: null,
    is_auto_charged: false,
    is_planned: true,
    is_progressive: false,
    paid_amount: 0,
    notes: null,
    created_at: "2026-03-01",
    ...overrides,
  };
}

// --- Inline getDisplayGroup (mirrors DepensesTrackingClient logic) ---

function getDisplayGroup(expense: MonthlyExpense): ExpenseGroupKey {
  if (expense.status === "OVERDUE" || expense.status === "DEFERRED") {
    return expense.status;
  }
  if (!expense.is_progressive) return expense.status;
  if (expense.paid_amount > 0 && expense.paid_amount < expense.amount) {
    return "IN_PROGRESS";
  }
  if (expense.paid_amount >= expense.amount) return "PAID";
  return "UPCOMING";
}

// ── getDisplayGroup ──

describe("getDisplayGroup", () => {
  it("returns DB status for non-progressive expenses", () => {
    expect(getDisplayGroup(makeExpense({ status: "UPCOMING" }))).toBe(
      "UPCOMING",
    );
    expect(getDisplayGroup(makeExpense({ status: "PAID" }))).toBe("PAID");
    expect(getDisplayGroup(makeExpense({ status: "OVERDUE" }))).toBe("OVERDUE");
    expect(getDisplayGroup(makeExpense({ status: "DEFERRED" }))).toBe(
      "DEFERRED",
    );
  });

  it("returns UPCOMING for progressive with paid_amount=0 (AC7)", () => {
    expect(
      getDisplayGroup(makeExpense({ is_progressive: true, paid_amount: 0 })),
    ).toBe("UPCOMING");
  });

  it("returns IN_PROGRESS for progressive with partial payment (AC7)", () => {
    expect(
      getDisplayGroup(
        makeExpense({ is_progressive: true, paid_amount: 350, amount: 1000 }),
      ),
    ).toBe("IN_PROGRESS");
  });

  it("returns PAID for progressive with paid_amount >= amount", () => {
    expect(
      getDisplayGroup(
        makeExpense({ is_progressive: true, paid_amount: 1000, amount: 1000 }),
      ),
    ).toBe("PAID");
  });

  it("returns PAID for progressive with over-budget (paid_amount > amount)", () => {
    expect(
      getDisplayGroup(
        makeExpense({ is_progressive: true, paid_amount: 1200, amount: 1000 }),
      ),
    ).toBe("PAID");
  });

  it("M1: OVERDUE takes priority over progressive logic", () => {
    expect(
      getDisplayGroup(
        makeExpense({
          is_progressive: true,
          status: "OVERDUE",
          paid_amount: 350,
          amount: 1000,
        }),
      ),
    ).toBe("OVERDUE");
  });

  it("M1: DEFERRED takes priority over progressive logic", () => {
    expect(
      getDisplayGroup(
        makeExpense({
          is_progressive: true,
          status: "DEFERRED",
          paid_amount: 350,
          amount: 1000,
        }),
      ),
    ).toBe("DEFERRED");
  });
});

// ── getExpenseIconVariant ──

describe("getExpenseIconVariant (progressive)", () => {
  it("returns expense-in-progress for progressive with partial payment", () => {
    expect(getExpenseIconVariant("UPCOMING", true, 350)).toBe(
      "expense-in-progress",
    );
  });

  it("returns charge-upcoming for progressive with zero payment", () => {
    expect(getExpenseIconVariant("UPCOMING", true, 0)).toBe("charge-upcoming");
  });

  it("returns expense-late for OVERDUE progressive (priority)", () => {
    expect(getExpenseIconVariant("OVERDUE", true, 350)).toBe("expense-late");
  });

  it("returns expense-paid for PAID progressive", () => {
    expect(getExpenseIconVariant("PAID", true, 1000)).toBe("expense-paid");
  });

  it("preserves existing behavior for non-progressive", () => {
    expect(getExpenseIconVariant("UPCOMING")).toBe("charge-upcoming");
    expect(getExpenseIconVariant("PAID")).toBe("expense-paid");
    expect(getExpenseIconVariant("OVERDUE")).toBe("expense-late");
    expect(getExpenseIconVariant("DEFERRED")).toBe("deferred");
  });
});

// ── getStatusBadge ──

describe("getStatusBadge (IN_PROGRESS)", () => {
  it("returns En cours badge for IN_PROGRESS status", () => {
    const badge = getStatusBadge("IN_PROGRESS");
    expect(badge.label).toBe("En cours");
    expect(badge.bg).toBe("var(--teal-50)");
    expect(badge.color).toBe("var(--teal-700)");
  });

  it("preserves existing badges", () => {
    expect(getStatusBadge("PAID").label).toBe("Payé");
    expect(getStatusBadge("OVERDUE").label).toBe("En retard");
    expect(getStatusBadge("DEFERRED").label).toBe("Reporté");
    expect(getStatusBadge("UPCOMING").label).toBe("Prévu");
  });
});

// ── getStatusLabel ──

describe("getStatusLabel (IN_PROGRESS)", () => {
  it("returns 'En cours' for IN_PROGRESS", () => {
    expect(getStatusLabel("IN_PROGRESS")).toBe("En cours");
  });

  it("preserves existing labels", () => {
    expect(getStatusLabel("PAID")).toBe("Payé");
    expect(getStatusLabel("OVERDUE")).toBe("En retard");
    expect(getStatusLabel("DEFERRED")).toBe("Reporté");
    expect(getStatusLabel("UPCOMING")).toBe("Prévu");
  });
});

// ── Progress bar calculations ──

describe("Progress bar calculations", () => {
  it("calculates correct percentage (AC1)", () => {
    const expense = makeExpense({
      is_progressive: true,
      paid_amount: 350,
      amount: 1000,
    });
    const pct = Math.min((expense.paid_amount / expense.amount) * 100, 100);
    expect(pct).toBe(35);
  });

  it("caps at 100% even when over-budget (AC4)", () => {
    const expense = makeExpense({
      is_progressive: true,
      paid_amount: 1200,
      amount: 1000,
    });
    const pct = Math.min((expense.paid_amount / expense.amount) * 100, 100);
    expect(pct).toBe(100);
  });

  it("is 0% when no payment", () => {
    const expense = makeExpense({
      is_progressive: true,
      paid_amount: 0,
      amount: 1000,
    });
    const pct =
      expense.amount > 0
        ? Math.min((expense.paid_amount / expense.amount) * 100, 100)
        : 0;
    expect(pct).toBe(0);
  });

  it("detects over-budget (AC4)", () => {
    const expense = makeExpense({
      is_progressive: true,
      paid_amount: 1000,
      amount: 1000,
    });
    const isOverBudget =
      expense.is_progressive &&
      expense.paid_amount >= expense.amount &&
      expense.amount > 0;
    expect(isOverBudget).toBe(true);
  });

  it("not over-budget when under", () => {
    const expense = makeExpense({
      is_progressive: true,
      paid_amount: 999,
      amount: 1000,
    });
    const isOverBudget =
      expense.is_progressive &&
      expense.paid_amount >= expense.amount &&
      expense.amount > 0;
    expect(isOverBudget).toBe(false);
  });
});
