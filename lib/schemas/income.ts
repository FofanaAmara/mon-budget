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
const IncomeFieldsSchema = z.object({
  name: nameSchema,
  source: incomeSourceSchema,
  amount: positiveAmountSchema.nullable(),
  estimated_amount: nonNegativeAmountSchema.nullable(),
  frequency: incomeFrequencySchema,
  pay_anchor_date: isoDateSchema.nullable().optional(),
  auto_deposit: z.boolean().optional(),
  notes: notesSchema,
});

export const CreateIncomeSchema = IncomeFieldsSchema.refine(
  income => income.frequency === "VARIABLE" || (income.amount !== null && income.amount > 0),
  { message: "Un revenu fixe doit avoir un montant positif.", path: ["amount"] },
);
export const UpdateIncomeDataSchema = IncomeFieldsSchema.partial();

export type CreateIncomeInput = z.infer<typeof CreateIncomeSchema>;

// ─── UpdateIncome ───────────────────────────────────────────────────────────
export const UpdateIncomeSchema = z.object({
  id: idSchema,
  data: UpdateIncomeDataSchema,
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
