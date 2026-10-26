import { z } from "zod";
import { reminderOffsetsSchema } from "@/lib/schemas/common";

export const SpaceSettingsPatch = z.object({
  default_currency: z.enum(["CAD", "USD", "EUR"]).optional(),
  default_reminder_offsets: reminderOffsetsSchema.optional(),
}).strict();

export const AccountSettingsPatch = z.object({
  email: z.string().email("Email invalide").nullable().optional(),
  phone: z.string().max(20).nullable().optional(),
  notify_push: z.boolean().optional(),
  notify_email: z.boolean().optional(),
  notify_sms: z.boolean().optional(),
}).strict();

export type SpaceSettings = {
  space_id: string;
  default_currency: string | null;
  default_reminder_offsets: number[] | null;
};

export type AccountSettings = {
  email: string | null;
  phone: string | null;
  notify_push: boolean;
  notify_email: boolean;
  notify_sms: boolean;
};
