import { z } from "zod";
import { nonNegativeAmountSchema } from "./common";

// ─── CompleteOnboarding ─────────────────────────────────────────────────────
export const CompleteOnboardingSchema = z.object({
  monthlyRevenue: nonNegativeAmountSchema,
  frequency: z.enum(["weekly", "biweekly", "monthly"]),
  categories: z.array(z.string()),
  objective: z.string().max(255).nullable(),
});

export type CompleteOnboardingInput = z.infer<typeof CompleteOnboardingSchema>;
