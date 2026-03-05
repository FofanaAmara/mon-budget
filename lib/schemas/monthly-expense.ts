import { z } from "zod";
import { idSchema, nonNegativeAmountSchema, monthSchema } from "./common";

// ─── DeferExpense ───────────────────────────────────────────────────────────
export const DeferExpenseSchema = z.object({
  id: idSchema,
  targetMonth: monthSchema,
});

export type DeferExpenseInput = z.infer<typeof DeferExpenseSchema>;

// ─── UpdateMonthlyExpenseAmount ─────────────────────────────────────────────
// Amount can be 0 (suspended expense), so nonNegative is correct.
export const UpdateMonthlyExpenseAmountSchema = z.object({
  id: idSchema,
  newAmount: nonNegativeAmountSchema,
});

export type UpdateMonthlyExpenseAmountInput = z.infer<
  typeof UpdateMonthlyExpenseAmountSchema
>;
