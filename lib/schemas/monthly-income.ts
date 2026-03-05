import { z } from "zod";
import { idSchema, nonNegativeAmountSchema, monthSchema } from "./common";

// ─── MarkIncomeReceived ─────────────────────────────────────────────────────
export const MarkIncomeReceivedSchema = z.object({
  monthlyIncomeId: idSchema,
  actualAmount: nonNegativeAmountSchema,
  notes: z.string().max(500).optional(),
});

export type MarkIncomeReceivedInput = z.infer<typeof MarkIncomeReceivedSchema>;

// ─── UpdateMonthlyIncomeAmount ──────────────────────────────────────────────
export const UpdateMonthlyIncomeAmountSchema = z.object({
  id: idSchema,
  newExpectedAmount: nonNegativeAmountSchema,
});

export type UpdateMonthlyIncomeAmountInput = z.infer<
  typeof UpdateMonthlyIncomeAmountSchema
>;

// ─── MarkVariableIncomeReceived ─────────────────────────────────────────────
export const MarkVariableIncomeReceivedSchema = z.object({
  incomeId: idSchema,
  month: monthSchema,
  actualAmount: nonNegativeAmountSchema,
  notes: z.string().max(500).optional(),
});

export type MarkVariableIncomeReceivedInput = z.infer<
  typeof MarkVariableIncomeReceivedSchema
>;
