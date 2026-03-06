import { describe, it, expect } from "vitest";
import {
  prevMonth,
  nextMonth,
  parseMonth,
  monthLabel,
} from "@/lib/month-utils";

// ---------------------------------------------------------------------------
// prevMonth
// ---------------------------------------------------------------------------

describe("prevMonth", () => {
  it('returns "2025-12" for "2026-01" (year boundary crossing)', () => {
    expect(prevMonth("2026-01")).toBe("2025-12");
  });

  it('returns "2026-02" for "2026-03"', () => {
    expect(prevMonth("2026-03")).toBe("2026-02");
  });

  it('returns "2025-11" for "2025-12"', () => {
    expect(prevMonth("2025-12")).toBe("2025-11");
  });
});

// ---------------------------------------------------------------------------
// nextMonth
// ---------------------------------------------------------------------------

describe("nextMonth", () => {
  it('returns "2026-01" for "2025-12" (year boundary crossing)', () => {
    expect(nextMonth("2025-12")).toBe("2026-01");
  });

  it('returns "2026-04" for "2026-03"', () => {
    expect(nextMonth("2026-03")).toBe("2026-04");
  });

  it('returns "2026-02" for "2026-01"', () => {
    expect(nextMonth("2026-01")).toBe("2026-02");
  });
});

// ---------------------------------------------------------------------------
// parseMonth
// ---------------------------------------------------------------------------

describe("parseMonth", () => {
  it("parses a YYYY-MM string into year and monthNum", () => {
    expect(parseMonth("2026-03")).toEqual({ year: 2026, monthNum: 3 });
  });

  it("parses January correctly", () => {
    expect(parseMonth("2026-01")).toEqual({ year: 2026, monthNum: 1 });
  });

  it("parses December correctly", () => {
    expect(parseMonth("2025-12")).toEqual({ year: 2025, monthNum: 12 });
  });
});

// ---------------------------------------------------------------------------
// monthLabel
// ---------------------------------------------------------------------------

describe("monthLabel", () => {
  it("returns a French label for a given month", () => {
    const label = monthLabel("2026-03");
    expect(label).toMatch(/mars/i);
    expect(label).toContain("2026");
  });

  it("returns a French label for January", () => {
    const label = monthLabel("2026-01");
    expect(label).toMatch(/janvier/i);
    expect(label).toContain("2026");
  });
});
