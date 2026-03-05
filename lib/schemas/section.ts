import { z } from "zod";
import { idSchema, shortNameSchema, hexColorSchema } from "./common";

// ─── CreateSection ──────────────────────────────────────────────────────────
export const CreateSectionSchema = z.object({
  name: shortNameSchema,
  icon: z.string().trim().min(1).max(10),
  color: hexColorSchema,
});

export type CreateSectionInput = z.infer<typeof CreateSectionSchema>;

// ─── UpdateSection ──────────────────────────────────────────────────────────
export const UpdateSectionSchema = z.object({
  id: idSchema,
  data: CreateSectionSchema.partial(),
});

export type UpdateSectionInput = z.infer<typeof UpdateSectionSchema>;
