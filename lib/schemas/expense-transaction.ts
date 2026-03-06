import { z } from "zod";
import { idSchema, positiveAmountSchema, notesSchema } from "./common";

// ─── AddExpenseTransaction ──────────────────────────────────────────────────
// Progressive expense sub-transaction: amount must be strictly positive.
// Unlike savings contributions, corrections are not supported via negative amounts.
export const AddExpenseTransactionSchema = z.object({
  monthlyExpenseId: idSchema,
  amount: positiveAmountSchema,
  note: notesSchema,
});

export type AddExpenseTransactionInput = z.infer<
  typeof AddExpenseTransactionSchema
>;
