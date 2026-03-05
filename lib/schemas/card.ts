import { z } from "zod";
import { idSchema, shortNameSchema, hexColorSchema } from "./common";

// ─── CreateCard ─────────────────────────────────────────────────────────────
export const CreateCardSchema = z.object({
  name: shortNameSchema,
  last_four: z
    .string()
    .regex(/^\d{4}$/, "Doit etre exactement 4 chiffres")
    .optional(),
  bank: z.string().max(100).optional(),
  color: hexColorSchema.optional(),
});

export type CreateCardInput = z.infer<typeof CreateCardSchema>;

// ─── UpdateCard ─────────────────────────────────────────────────────────────
export const UpdateCardSchema = z.object({
  id: idSchema,
  data: CreateCardSchema.partial(),
});

export type UpdateCardInput = z.infer<typeof UpdateCardSchema>;
