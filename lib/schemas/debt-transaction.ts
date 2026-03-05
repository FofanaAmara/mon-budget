import { z } from "zod";
import {
  idSchema,
  positiveAmountSchema,
  monthSchema,
  debtTransactionTypeSchema,
} from "./common";

// ─── AddDebtTransaction ─────────────────────────────────────────────────────
export const AddDebtTransactionSchema = z.object({
  debtId: idSchema,
  type: debtTransactionTypeSchema,
  amount: positiveAmountSchema,
  month: monthSchema,
  note: z.string().max(500).nullable().optional(),
  source: z.string().max(50).optional().default("MANUAL"),
});

export type AddDebtTransactionInput = z.infer<typeof AddDebtTransactionSchema>;
