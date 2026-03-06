import { z } from "zod";
import {
  idSchema,
  nameSchema,
  nonNegativeAmountSchema,
  positiveAmountSchema,
  currencySchema,
  expenseTypeSchema,
  recurrenceFrequencySchema,
  dayOfMonthSchema,
  reminderOffsetsSchema,
  isoDateSchema,
  notesSchema,
  monthSchema,
} from "./common";

// ─── CreateExpense ──────────────────────────────────────────────────────────
// amount is nonNegative (not positive) because PLANNED expenses can have amount=0.
// This is a deliberate deviation from AC "montant negatif ou zero" — zero is legitimate
// for PLANNED expenses. See design.md section 8 and review-design finding M4/L1.
export const CreateExpenseSchema = z.object({
  name: nameSchema,
  amount: nonNegativeAmountSchema,
  currency: currencySchema.optional(),
  type: expenseTypeSchema,
  section_id: idSchema.optional(),
  card_id: idSchema.optional(),
  recurrence_frequency: recurrenceFrequencySchema.optional(),
  recurrence_day: dayOfMonthSchema.optional(),
  auto_debit: z.boolean().optional(),
  spread_monthly: z.boolean().optional(),
  is_progressive: z.boolean().optional(),
  due_date: isoDateSchema.optional(),
  reminder_offsets: reminderOffsetsSchema.optional(),
  notify_push: z.boolean().optional(),
  notify_email: z.boolean().optional(),
  notify_sms: z.boolean().optional(),
  notes: notesSchema,
  // PLANNED fields
  target_amount: nonNegativeAmountSchema.nullable().optional(),
  target_date: isoDateSchema.nullable().optional(),
  saved_amount: nonNegativeAmountSchema.nullable().optional(),
});

export type CreateExpenseInput = z.infer<typeof CreateExpenseSchema>;

// ─── UpdateExpense ──────────────────────────────────────────────────────────
export const UpdateExpenseSchema = z.object({
  id: idSchema,
  data: CreateExpenseSchema.partial(),
});

export type UpdateExpenseInput = z.infer<typeof UpdateExpenseSchema>;

// ─── AddSavingsContribution ─────────────────────────────────────────────────
// amount can be negative (corrections/reversals), so we only reject zero.
export const AddSavingsContributionSchema = z.object({
  expenseId: idSchema,
  amount: z.number().refine((n) => n !== 0, "Le montant ne peut pas etre zero"),
  note: z.string().max(500).nullable().optional(),
});

export type AddSavingsContributionInput = z.infer<
  typeof AddSavingsContributionSchema
>;

// ─── TransferSavings ────────────────────────────────────────────────────────
export const TransferSavingsSchema = z.object({
  fromId: idSchema,
  toId: idSchema,
  amount: positiveAmountSchema,
  fromName: nameSchema,
  toName: nameSchema,
});

export type TransferSavingsInput = z.infer<typeof TransferSavingsSchema>;

// ─── CreateAdhocExpense ─────────────────────────────────────────────────────
export const CreateAdhocExpenseSchema = z.object({
  name: nameSchema,
  amount: positiveAmountSchema,
  sectionId: idSchema,
  month: monthSchema,
  alreadyPaid: z.boolean().optional().default(false),
  dueDate: isoDateSchema.optional(),
  cardId: idSchema.optional(),
});

export type CreateAdhocExpenseInput = z.infer<typeof CreateAdhocExpenseSchema>;
