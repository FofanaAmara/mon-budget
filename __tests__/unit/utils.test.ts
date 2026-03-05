import { describe, it, expect } from "vitest";
import { toMonthKey, currentMonth, formatCAD } from "@/lib/utils";

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

describe("currentMonth", () => {
  it("returns the current month in YYYY-MM format", () => {
    const now = new Date();
    const expected = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    expect(currentMonth()).toBe(expected);
  });
});

describe("formatCAD", () => {
  it("formats a positive amount in CAD", () => {
    const result = formatCAD(1234.56);
    // fr-CA format: 1 234,56 $
    expect(result).toContain("1");
    expect(result).toContain("234");
    expect(result).toContain("56");
    expect(result).toContain("$");
  });

  it("formats zero", () => {
    const result = formatCAD(0);
    expect(result).toContain("0,00");
    expect(result).toContain("$");
  });
});
