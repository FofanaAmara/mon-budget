import { z } from "zod";

// ─── Push Send ──────────────────────────────────────────────────────────────
export const PushSendSchema = z.object({
  title: z.string().max(255).optional(),
  body: z.string().min(1, "Le corps du message est requis").max(1000),
  url: z
    .string()
    .startsWith("/", "URL doit etre un chemin relatif (commencer par /)")
    .max(500)
    .optional()
    .default("/"),
});

export type PushSendInput = z.infer<typeof PushSendSchema>;

// ─── Push Subscribe ─────────────────────────────────────────────────────────
export const PushSubscribeSchema = z.object({
  endpoint: z
    .string()
    .url("URL invalide")
    .startsWith("https://", "Endpoint doit etre HTTPS"),
  keys: z.object({
    p256dh: z.string().min(1, "Cle p256dh requise"),
    auth: z.string().min(1, "Cle auth requise"),
  }),
});

export type PushSubscribeInput = z.infer<typeof PushSubscribeSchema>;
