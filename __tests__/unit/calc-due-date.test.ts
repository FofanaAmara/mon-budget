import { describe, it, expect } from "vitest";
import { calcDueDateForMonth, formatDueDate } from "@/lib/utils";
import type { CalcDueDateInput } from "@/lib/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeInput(
  overrides: Partial<CalcDueDateInput> = {},
): CalcDueDateInput {
  return {
    recurrence_frequency: null,
    recurrence_day: null,
    next_due_date: null,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// formatDueDate
// ---------------------------------------------------------------------------

describe("formatDueDate", () => {
  it("formats single-digit month and day with zero padding", () => {
    expect(formatDueDate(2026, 3, 5)).toBe("2026-03-05");
  });

  it("formats double-digit month and day without extra padding", () => {
    expect(formatDueDate(2026, 12, 25)).toBe("2026-12-25");
  });
});

// ---------------------------------------------------------------------------
// calcDueDateForMonth
// ---------------------------------------------------------------------------

describe("calcDueDateForMonth", () => {
  // -----------------------------------------------------------------------
  // next_due_date priority
  // -----------------------------------------------------------------------

  describe("next_due_date in target month", () => {
    it("returns next_due_date directly if it falls in the target month", () => {
      const result = calcDueDateForMonth(
        makeInput({
          recurrence_frequency: "MONTHLY",
          recurrence_day: 15,
          next_due_date: "2026-03-15",
        }),
        "2026-03",
      );
      expect(result).toBe("2026-03-15");
    });

    it("ignores next_due_date if it falls outside the target month", () => {
      const result = calcDueDateForMonth(
        makeInput({
          recurrence_frequency: "MONTHLY",
          recurrence_day: 15,
          next_due_date: "2026-04-15",
        }),
        "2026-03",
      );
      expect(result).toBe("2026-03-15");
    });
  });

  // -----------------------------------------------------------------------
  // MONTHLY
  // -----------------------------------------------------------------------

  describe("MONTHLY", () => {
    it("generates with recurrence_day", () => {
      const result = calcDueDateForMonth(
        makeInput({ recurrence_frequency: "MONTHLY", recurrence_day: 15 }),
        "2026-03",
      );
      expect(result).toBe("2026-03-15");
    });

    it("clamps day 31 to February 28 (non-leap year)", () => {
      const result = calcDueDateForMonth(
        makeInput({ recurrence_frequency: "MONTHLY", recurrence_day: 31 }),
        "2026-02",
      );
      expect(result).toBe("2026-02-28");
    });

    it("clamps day 31 to February 29 (leap year)", () => {
      const result = calcDueDateForMonth(
        makeInput({ recurrence_frequency: "MONTHLY", recurrence_day: 31 }),
        "2028-02",
      );
      expect(result).toBe("2028-02-29");
    });
  });

  // -----------------------------------------------------------------------
  // BIMONTHLY
  // -----------------------------------------------------------------------

  describe("BIMONTHLY", () => {
    it("generates in even-offset month from reference", () => {
      const result = calcDueDateForMonth(
        makeInput({
          recurrence_frequency: "BIMONTHLY",
          recurrence_day: 10,
          next_due_date: "2026-01-10",
        }),
        "2026-03",
      );
      expect(result).toBe("2026-03-10");
    });

    it("skips odd-offset month from reference", () => {
      const result = calcDueDateForMonth(
        makeInput({
          recurrence_frequency: "BIMONTHLY",
          recurrence_day: 10,
          next_due_date: "2026-01-10",
        }),
        "2026-02",
      );
      expect(result).toBeNull();
    });

    it("generates without next_due_date (no skip logic)", () => {
      // When next_due_date is null, no diff check is performed —
      // the function generates for the month with day clamping
      const result = calcDueDateForMonth(
        makeInput({
          recurrence_frequency: "BIMONTHLY",
          recurrence_day: 10,
          next_due_date: null,
        }),
        "2026-05",
      );
      expect(result).toBe("2026-05-10");
    });
  });

  // -----------------------------------------------------------------------
  // QUARTERLY
  // -----------------------------------------------------------------------

  describe("QUARTERLY", () => {
    it("generates in due month (offset 0)", () => {
      const result = calcDueDateForMonth(
        makeInput({
          recurrence_frequency: "QUARTERLY",
          recurrence_day: 5,
          next_due_date: "2026-01-05",
        }),
        "2026-04",
      );
      expect(result).toBe("2026-04-05");
    });

    it("skips month at offset 1 from reference", () => {
      const result = calcDueDateForMonth(
        makeInput({
          recurrence_frequency: "QUARTERLY",
          recurrence_day: 5,
          next_due_date: "2026-01-05",
        }),
        "2026-02",
      );
      expect(result).toBeNull();
    });

    it("skips month at offset 2 from reference", () => {
      const result = calcDueDateForMonth(
        makeInput({
          recurrence_frequency: "QUARTERLY",
          recurrence_day: 5,
          next_due_date: "2026-01-05",
        }),
        "2026-03",
      );
      expect(result).toBeNull();
    });

    it("handles wrap around December-January", () => {
      const result = calcDueDateForMonth(
        makeInput({
          recurrence_frequency: "QUARTERLY",
          recurrence_day: 15,
          next_due_date: "2025-10-15",
        }),
        "2026-01",
      );
      expect(result).toBe("2026-01-15");
    });
  });

  // -----------------------------------------------------------------------
  // YEARLY
  // -----------------------------------------------------------------------

  describe("YEARLY", () => {
    it("generates in the reference month", () => {
      const result = calcDueDateForMonth(
        makeInput({
          recurrence_frequency: "YEARLY",
          recurrence_day: 20,
          next_due_date: "2026-06-20",
        }),
        "2026-06",
      );
      expect(result).toBe("2026-06-20");
    });

    it("skips all other months", () => {
      const result = calcDueDateForMonth(
        makeInput({
          recurrence_frequency: "YEARLY",
          recurrence_day: 20,
          next_due_date: "2026-06-20",
        }),
        "2026-03",
      );
      expect(result).toBeNull();
    });

    it("clamps day in February", () => {
      const result = calcDueDateForMonth(
        makeInput({
          recurrence_frequency: "YEARLY",
          recurrence_day: 29,
          next_due_date: "2026-02-28",
        }),
        "2026-02",
      );
      expect(result).toBe("2026-02-28");
    });
  });

  // -----------------------------------------------------------------------
  // WEEKLY / BIWEEKLY
  // -----------------------------------------------------------------------

  describe("WEEKLY", () => {
    it("returns the 1st of the month", () => {
      const result = calcDueDateForMonth(
        makeInput({ recurrence_frequency: "WEEKLY", recurrence_day: null }),
        "2026-05",
      );
      expect(result).toBe("2026-05-01");
    });
  });

  describe("BIWEEKLY", () => {
    it("returns the 1st of the month", () => {
      const result = calcDueDateForMonth(
        makeInput({ recurrence_frequency: "BIWEEKLY", recurrence_day: null }),
        "2026-05",
      );
      expect(result).toBe("2026-05-01");
    });
  });

  // -----------------------------------------------------------------------
  // Edge cases
  // -----------------------------------------------------------------------

  describe("edge cases", () => {
    it("returns null when frequency is null and no next_due_date", () => {
      const result = calcDueDateForMonth(makeInput(), "2026-03");
      expect(result).toBeNull();
    });

    it("returns null when frequency is null but next_due_date is in another month", () => {
      const result = calcDueDateForMonth(
        makeInput({ next_due_date: "2026-04-10" }),
        "2026-03",
      );
      expect(result).toBeNull();
    });

    it("returns next_due_date when frequency is null but next_due_date is in target month", () => {
      const result = calcDueDateForMonth(
        makeInput({ next_due_date: "2026-03-10" }),
        "2026-03",
      );
      expect(result).toBe("2026-03-10");
    });
  });
});
