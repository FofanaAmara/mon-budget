import { z } from "zod";
import {
  idSchema,
  nameSchema,
  positiveAmountSchema,
  nonNegativeAmountSchema,
  incomeSourceSchema,
  incomeFrequencySchema,
  isoDateSchema,
  notesSchema,
  monthSchema,
} from "./common";

// ─── CreateIncome ───────────────────────────────────────────────────────────
export const CreateIncomeSchema = z.object({
  name: nameSchema,
  source: incomeSourceSchema,
  amount: positiveAmountSchema.nullable(),
  estimated_amount: nonNegativeAmountSchema.nullable(),
  frequency: incomeFrequencySchema,
  pay_anchor_date: isoDateSchema.nullable().optional(),
  auto_deposit: z.boolean().optional(),
  notes: notesSchema,
});

export type CreateIncomeInput = z.infer<typeof CreateIncomeSchema>;

// ─── UpdateIncome ───────────────────────────────────────────────────────────
export const UpdateIncomeSchema = z.object({
  id: idSchema,
  data: CreateIncomeSchema.partial(),
});

export type UpdateIncomeInput = z.infer<typeof UpdateIncomeSchema>;

// ─── CreateAdhocIncome ──────────────────────────────────────────────────────
export const CreateAdhocIncomeSchema = z.object({
  name: nameSchema,
  amount: positiveAmountSchema,
  source: incomeSourceSchema,
  month: monthSchema,
});

export type CreateAdhocIncomeInput = z.infer<typeof CreateAdhocIncomeSchema>;
