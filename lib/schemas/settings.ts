import { z } from "zod";
import { idSchema, currencySchema, reminderOffsetsSchema } from "./common";

// ─── UpdateSettings ─────────────────────────────────────────────────────────
export const UpdateSettingsSchema = z.object({
  id: idSchema,
  data: z.object({
    email: z.string().email("Email invalide").nullable().optional(),
    phone: z.string().max(20).nullable().optional(),
    default_currency: currencySchema.optional(),
    default_reminder_offsets: reminderOffsetsSchema.optional(),
    notify_push: z.boolean().optional(),
    notify_email: z.boolean().optional(),
    notify_sms: z.boolean().optional(),
  }),
});

export type UpdateSettingsInput = z.infer<typeof UpdateSettingsSchema>;
