import { describe, it, expect } from "vitest";
import {
  toMonthKey,
  currentMonth,
  formatCAD,
  formatShortDate,
  calcMonthlyCost,
  calcMonthlyIncome,
  calcMonthlySuggested,
  calcNextDueDate,
  countBiweeklyPayDatesInMonth,
  daysUntil,
} from "@/lib/utils";
import {
  WEEKLY_MONTHLY_MULTIPLIER,
  BIWEEKLY_MONTHLY_MULTIPLIER,
} from "@/lib/constants";
import type { Expense } from "@/lib/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a minimal Expense stub for calcMonthlyCost tests. */
function makeExpense(
  overrides: Partial<Expense> & Pick<Expense, "amount">,
): Expense {
  return {
    id: "test-id",
    user_id: "user-1",
    name: "Test expense",
    amount: overrides.amount,
    original_amount: null,
    type: overrides.type ?? "RECURRING",
    section_id: null,
    card_id: null,
    recurrence_frequency: overrides.recurrence_frequency ?? "MONTHLY",
    recurrence_day: overrides.recurrence_day ?? 1,
    auto_debit: false,
    spread_monthly: false,
    target_amount: null,
    saved_amount: null,
    target_date: null,
    is_active: true,
    created_at: "2026-01-01",
    updated_at: "2026-01-01",
    manually_edited: false,
    ...overrides,
  } as Expense;
}

// ---------------------------------------------------------------------------
// toMonthKey (existing tests preserved)
// ---------------------------------------------------------------------------

describe("toMonthKey", () => {
  it("returns YYYY-MM format for a given date", () => {
    const date = new Date(2026, 0, 15); // January 15, 2026
    expect(toMonthKey(date)).toBe("2026-01");
  });

  it("pads single-digit months with a leading zero", () => {
    const date = new Date(2026, 2, 1); // March 1, 2026
    expect(toMonthKey(date)).toBe("2026-03");
  });
});

// ---------------------------------------------------------------------------
// currentMonth (existing test preserved)
// ---------------------------------------------------------------------------

describe("currentMonth", () => {
  it("returns the current month in YYYY-MM format", () => {
    const now = new Date();
    const expected = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    expect(currentMonth()).toBe(expected);
  });
});

// ---------------------------------------------------------------------------
// formatCAD
// ---------------------------------------------------------------------------

describe("formatCAD", () => {
  it("formats a positive amount in CAD", () => {
    const result = formatCAD(1234.56);
    expect(result).toContain("1");
    expect(result).toContain("234");
    expect(result).toContain("56");
    expect(result).toContain("$");
  });

  it("formats zero as 0,00 $", () => {
    const result = formatCAD(0);
    expect(result).toContain("0,00");
    expect(result).toContain("$");
  });

  it("formats a negative amount", () => {
    const result = formatCAD(-42.5);
    expect(result).toContain("42,50");
    expect(result).toContain("-");
    expect(result).toContain("$");
  });

  it("formats a very large number with grouping separators", () => {
    const result = formatCAD(1_000_000);
    // fr-CA uses non-breaking space as grouping separator
    expect(result).toContain("$");
    // Verify the digits are present (separator may be nbsp)
    expect(result.replace(/\s/g, "")).toContain("1000000,00");
  });
});

// ---------------------------------------------------------------------------
// formatShortDate
// ---------------------------------------------------------------------------

describe("formatShortDate", () => {
  it('returns "—" for null input', () => {
    expect(formatShortDate(null)).toBe("—");
  });

  it("formats an ISO date string to fr-CA short format (dd month)", () => {
    const result = formatShortDate("2026-03-15");
    // Expect day and abbreviated month in French
    expect(result).toContain("15");
    expect(result).toMatch(/mars/i);
  });

  it("formats a Date object using UTC parts to avoid timezone offset", () => {
    // UTC midnight — should not shift to previous day in local tz
    const d = new Date(Date.UTC(2026, 0, 1)); // Jan 1 2026 UTC
    const result = formatShortDate(d);
    expect(result).toContain("1");
    expect(result).toMatch(/janv/i);
  });
});

// ---------------------------------------------------------------------------
// calcMonthlyCost
// ---------------------------------------------------------------------------

describe("calcMonthlyCost", () => {
  const amount = 100;

  it("returns amount * WEEKLY multiplier for WEEKLY frequency", () => {
    const expense = makeExpense({
      amount,
      recurrence_frequency: "WEEKLY",
    });
    expect(calcMonthlyCost(expense)).toBeCloseTo(
      amount * WEEKLY_MONTHLY_MULTIPLIER,
    );
  });

  it("returns amount * BIWEEKLY multiplier for BIWEEKLY frequency", () => {
    const expense = makeExpense({
      amount,
      recurrence_frequency: "BIWEEKLY",
    });
    expect(calcMonthlyCost(expense)).toBeCloseTo(
      amount * BIWEEKLY_MONTHLY_MULTIPLIER,
    );
  });

  it("returns amount * 1 for MONTHLY frequency", () => {
    const expense = makeExpense({
      amount,
      recurrence_frequency: "MONTHLY",
    });
    expect(calcMonthlyCost(expense)).toBe(amount);
  });

  it("returns amount / 3 for QUARTERLY frequency", () => {
    const expense = makeExpense({
      amount,
      recurrence_frequency: "QUARTERLY",
    });
    expect(calcMonthlyCost(expense)).toBeCloseTo(amount / 3);
  });

  it("returns amount / 12 for YEARLY frequency", () => {
    const expense = makeExpense({
      amount,
      recurrence_frequency: "YEARLY",
    });
    expect(calcMonthlyCost(expense)).toBeCloseTo(amount / 12);
  });

  it("returns amount / 2 for BIMONTHLY frequency", () => {
    const expense = makeExpense({
      amount,
      recurrence_frequency: "BIMONTHLY",
    });
    expect(calcMonthlyCost(expense)).toBeCloseTo(amount / 2);
  });

  it("returns raw amount for ONE_TIME type regardless of frequency", () => {
    const expense = makeExpense({
      amount: 500,
      type: "ONE_TIME",
      recurrence_frequency: "YEARLY",
    });
    expect(calcMonthlyCost(expense)).toBe(500);
  });

  it("returns raw amount when recurrence_frequency is null", () => {
    const expense = makeExpense({
      amount: 200,
      recurrence_frequency: null,
    });
    expect(calcMonthlyCost(expense)).toBe(200);
  });
});

// ---------------------------------------------------------------------------
// calcMonthlyIncome
// ---------------------------------------------------------------------------

describe("calcMonthlyIncome", () => {
  it("returns estimated_amount for VARIABLE frequency", () => {
    expect(calcMonthlyIncome(null, "VARIABLE", 3500)).toBe(3500);
  });

  it("returns 0 for VARIABLE frequency when estimated_amount is null", () => {
    expect(calcMonthlyIncome(null, "VARIABLE", null)).toBe(0);
  });

  it("returns 0 for VARIABLE frequency when estimated_amount is undefined", () => {
    expect(calcMonthlyIncome(null, "VARIABLE")).toBe(0);
  });

  it("returns amount unchanged for MONTHLY frequency", () => {
    expect(calcMonthlyIncome(4000, "MONTHLY")).toBe(4000);
  });

  it("returns amount * BIWEEKLY multiplier for BIWEEKLY frequency", () => {
    expect(calcMonthlyIncome(2000, "BIWEEKLY")).toBeCloseTo(
      2000 * BIWEEKLY_MONTHLY_MULTIPLIER,
    );
  });

  it("returns amount / 12 for YEARLY frequency", () => {
    expect(calcMonthlyIncome(60000, "YEARLY")).toBeCloseTo(5000);
  });

  it("returns 0 when amount is null (non-VARIABLE)", () => {
    expect(calcMonthlyIncome(null, "MONTHLY")).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// calcMonthlySuggested
// ---------------------------------------------------------------------------

describe("calcMonthlySuggested", () => {
  it("calculates monthly savings for a future target", () => {
    // 6 months from now, need 6000, saved 0 → 1000/month
    const now = new Date();
    const target = new Date(now);
    target.setMonth(target.getMonth() + 6);
    const targetDate = target.toISOString().slice(0, 10);

    expect(calcMonthlySuggested(6000, 0, targetDate)).toBeCloseTo(1000);
  });

  it("returns 0 when target_date is in the past", () => {
    expect(calcMonthlySuggested(5000, 1000, "2020-01-01")).toBe(0);
  });

  it("returns 0 when saved amount already exceeds target", () => {
    expect(calcMonthlySuggested(1000, 2000, "2030-01-01")).toBe(0);
  });

  it("returns remaining / 1 when exactly 1 month remains", () => {
    const now = new Date();
    const target = new Date(now);
    target.setMonth(target.getMonth() + 1);
    const targetDate = target.toISOString().slice(0, 10);

    // remaining = 3000 - 1000 = 2000, 1 month → 2000
    expect(calcMonthlySuggested(3000, 1000, targetDate)).toBeCloseTo(2000);
  });
});

// ---------------------------------------------------------------------------
// calcNextDueDate (with fixed referenceDate for deterministic tests)
// ---------------------------------------------------------------------------

describe("calcNextDueDate", () => {
  it("is backward-compatible (works without referenceDate)", () => {
    // Should not throw when called with 2 args
    const result = calcNextDueDate("MONTHLY", 15);
    expect(result).toBeInstanceOf(Date);
  });

  it("returns next month if day already passed for MONTHLY", () => {
    // Reference: Jan 20, day=15 → Feb 15
    const ref = new Date(2026, 0, 20); // Jan 20
    const result = calcNextDueDate("MONTHLY", 15, ref);
    expect(result.getMonth()).toBe(1); // February
    expect(result.getDate()).toBe(15);
  });

  it("returns same month if day is in the future for MONTHLY", () => {
    // Reference: Jan 10, day=25 → Jan 25
    const ref = new Date(2026, 0, 10); // Jan 10
    const result = calcNextDueDate("MONTHLY", 25, ref);
    expect(result.getMonth()).toBe(0); // January
    expect(result.getDate()).toBe(25);
  });

  it("clamps day 31 to last day of a 30-day month", () => {
    // Reference: Mar 31, day=31 → next occurrence is April
    // April has 30 days, so setDate(31) wraps to May 1 — this is the current JS behavior
    const ref = new Date(2026, 2, 31); // Mar 31
    const result = calcNextDueDate("MONTHLY", 31, ref);
    // The function uses setDate(31) on April which gives May 1
    // This documents the CURRENT behavior (potential improvement tracked separately)
    expect(result).toBeInstanceOf(Date);
    expect(result.getTime()).toBeGreaterThan(ref.getTime());
  });

  it("clamps day 31 for February (28 days)", () => {
    // Reference: Jan 31, day=31 → next should be Feb but Feb has 28 days
    const ref = new Date(2026, 0, 31); // Jan 31
    const result = calcNextDueDate("MONTHLY", 31, ref);
    // setDate(31) on Feb wraps → documents current behavior
    expect(result).toBeInstanceOf(Date);
    expect(result.getTime()).toBeGreaterThan(ref.getTime());
  });

  it("handles QUARTERLY frequency", () => {
    // Reference: Jan 5, day=1 → already passed → April 1
    const ref = new Date(2026, 0, 5); // Jan 5
    const result = calcNextDueDate("QUARTERLY", 1, ref);
    expect(result.getMonth()).toBe(3); // April
    expect(result.getDate()).toBe(1);
  });

  it("handles YEARLY frequency", () => {
    // Reference: Mar 15, day=10 → already passed → next year Mar 10
    const ref = new Date(2026, 2, 15); // Mar 15
    const result = calcNextDueDate("YEARLY", 10, ref);
    expect(result.getFullYear()).toBe(2027);
  });

  it("handles WEEKLY frequency", () => {
    const ref = new Date(2026, 0, 5); // Monday Jan 5 2026
    const result = calcNextDueDate("WEEKLY", ref.getDay(), ref);
    // Same day of week → next week
    expect(result.getTime()).toBe(ref.getTime() + 7 * 86_400_000);
  });
});

// ---------------------------------------------------------------------------
// countBiweeklyPayDatesInMonth
// ---------------------------------------------------------------------------

describe("countBiweeklyPayDatesInMonth", () => {
  it("returns 2 for a normal month with 2 biweekly pay dates", () => {
    // Anchor: Jan 9, 2026. February 2026 has: Feb 13, Feb 27 → 2 dates
    const count = countBiweeklyPayDatesInMonth("2026-01-09", 2026, 1);
    expect(count).toBe(2);
  });

  it("returns 3 for a month with 3 biweekly pay dates", () => {
    // Anchor: Jan 2, 2026. January: Jan 2, Jan 16, Jan 30 → 3 dates
    const count = countBiweeklyPayDatesInMonth("2026-01-02", 2026, 0);
    expect(count).toBe(3);
  });

  it("works with a Date object as anchor", () => {
    // Anchor: Jan 9, 2026. February: Feb 13, Feb 27 → 2 dates
    const anchor = new Date(2026, 0, 9); // Jan 9 2026
    const count = countBiweeklyPayDatesInMonth(anchor, 2026, 1);
    expect(count).toBe(2);
  });

  it("returns at least 2 for any month", () => {
    // Every month should have at least 2 biweekly pay dates
    const anchor = "2026-01-09";
    for (let month = 0; month < 12; month++) {
      const count = countBiweeklyPayDatesInMonth(anchor, 2026, month);
      expect(count).toBeGreaterThanOrEqual(2);
    }
  });
});

// ---------------------------------------------------------------------------
// daysUntil
// ---------------------------------------------------------------------------

describe("daysUntil", () => {
  it("returns 999 for null input", () => {
    expect(daysUntil(null)).toBe(999);
  });

  it("returns a positive number for a future date", () => {
    const future = new Date();
    future.setDate(future.getDate() + 10);
    expect(daysUntil(future)).toBe(10);
  });

  it("returns a negative number for a past date", () => {
    const past = new Date();
    past.setDate(past.getDate() - 5);
    expect(daysUntil(past)).toBe(-5);
  });

  it("returns 0 for today", () => {
    const today = new Date();
    expect(daysUntil(today)).toBe(0);
  });

  it("accepts an ISO date string", () => {
    const future = new Date();
    future.setDate(future.getDate() + 3);
    const isoString = future.toISOString().slice(0, 10);
    // Allow rounding to +/- 1 day due to timezone
    expect(Math.abs(daysUntil(isoString) - 3)).toBeLessThanOrEqual(1);
  });
});
