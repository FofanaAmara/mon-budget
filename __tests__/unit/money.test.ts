import { describe, it, expect } from "vitest";
import { monetaryAmountSchema, positiveAmountSchema, largePositiveAmountSchema } from "@/lib/schemas/common";

describe("money precision before PostgreSQL writes", () => {
  it("rejects fractions of a cent, infinities and amounts beyond NUMERIC(10,2)", () => {
    for (const amount of [0.005,0.004,-0.005,-0.004,1.001,Infinity,NaN,100_000_000]) {
      expect(monetaryAmountSchema.safeParse(amount).success).toBe(false);
    }
  });
  it("normalizes floating point arithmetic without silently rounding input", () => {
    expect(positiveAmountSchema.parse(0.1+0.2)).toBe(0.3);
    expect(monetaryAmountSchema.parse(0.3-0.2)).toBe(0.1);
    expect(monetaryAmountSchema.parse(-0.1-0.2)).toBe(-0.3);
    expect(monetaryAmountSchema.parse(99_999_999.99)).toBe(99_999_999.99);
    expect(largePositiveAmountSchema.parse(9_999_999_999.99)).toBe(9_999_999_999.99);
    expect(largePositiveAmountSchema.safeParse(10_000_000_000).success).toBe(false);
  });
});
