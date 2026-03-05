import { z } from "zod";
import {
  idSchema,
  nameSchema,
  positiveAmountSchema,
  nonNegativeAmountSchema,
  debtFrequencySchema,
  dayOfMonthSchema,
  notesSchema,
} from "./common";

// ─── CreateDebt ─────────────────────────────────────────────────────────────
export const CreateDebtSchema = z.object({
  name: nameSchema,
  original_amount: positiveAmountSchema,
  remaining_balance: nonNegativeAmountSchema,
  interest_rate: z.number().min(0).max(100).nullable().optional(),
  payment_amount: positiveAmountSchema,
  payment_frequency: debtFrequencySchema,
  payment_day: dayOfMonthSchema.nullable().optional(),
  auto_debit: z.boolean().optional(),
  card_id: idSchema.nullable().optional(),
  section_id: idSchema.nullable().optional(),
  notes: notesSchema,
});

export type CreateDebtInput = z.infer<typeof CreateDebtSchema>;

// ─── UpdateDebt ─────────────────────────────────────────────────────────────
export const UpdateDebtSchema = z.object({
  id: idSchema,
  data: CreateDebtSchema.partial(),
});

export type UpdateDebtInput = z.infer<typeof UpdateDebtSchema>;

// ─── MakeExtraPayment ───────────────────────────────────────────────────────
export const MakeExtraPaymentSchema = z.object({
  id: idSchema,
  amount: positiveAmountSchema,
});

export type MakeExtraPaymentInput = z.infer<typeof MakeExtraPaymentSchema>;
