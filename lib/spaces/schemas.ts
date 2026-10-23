import { z } from "zod";

export const SpaceIdSchema = z.uuid("Espace invalide.");
export const SpaceNameSchema = z.string().trim().min(1, "Donne un nom à ton espace.")
  .max(80, "Le nom est limité à 80 caractères.")
  .refine(value => !/[\u0000-\u001f\u007f]/.test(value), "Le nom contient des caractères non autorisés.");
export const CreateSpaceSchema = z.object({
  expectedActorId: z.string().min(1).max(256),
  name: SpaceNameSchema,
  creationKey: z.uuid("La demande de création est invalide. Réessaie."),
});
