import { z } from "zod";
import {
  idSchema,
  nameSchema,
  positiveAmountSchema,
  nonNegativeAmountSchema,
  monthSchema,
  hexColorSchema,
  notesSchema,
} from "./common";

// ─── CreateAllocation ───────────────────────────────────────────────────────
export const CreateAllocationSchema = z.object({
  label: nameSchema,
  amount: positiveAmountSchema,
  section_ids: z.array(idSchema).optional(),
  project_id: idSchema.nullable().optional(),
  end_month: monthSchema.nullable().optional(),
  color: hexColorSchema.optional(),
  position: z.number().int().nonnegative().optional(),
});

export type CreateAllocationInput = z.infer<typeof CreateAllocationSchema>;

// ─── UpdateAllocation ───────────────────────────────────────────────────────
export const UpdateAllocationSchema = z.object({
  id: idSchema,
  data: CreateAllocationSchema,
});

export type UpdateAllocationInput = z.infer<typeof UpdateAllocationSchema>;

// ─── CreateAdhocAllocation ──────────────────────────────────────────────────
export const CreateAdhocAllocationSchema = z.object({
  month: monthSchema,
  data: z.object({
    label: nameSchema,
    amount: positiveAmountSchema,
    section_ids: z.array(idSchema).optional(),
    project_id: idSchema.nullable().optional(),
    color: hexColorSchema.optional(),
  }),
});

export type CreateAdhocAllocationInput = z.infer<
  typeof CreateAdhocAllocationSchema
>;

// ─── UpdateMonthlyAllocation ────────────────────────────────────────────────
export const UpdateMonthlyAllocationSchema = z.object({
  id: idSchema,
  amount: nonNegativeAmountSchema,
  notes: notesSchema,
});

export type UpdateMonthlyAllocationInput = z.infer<
  typeof UpdateMonthlyAllocationSchema
>;
