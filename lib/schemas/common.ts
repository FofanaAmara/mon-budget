import { z } from "zod";

// ─── IDs ────────────────────────────────────────────────────────────────────
export const idSchema = z.string().uuid("Identifiant invalide");

// ─── Month format ───────────────────────────────────────────────────────────
export const monthSchema = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Format YYYY-MM attendu");

// ─── Name fields ────────────────────────────────────────────────────────────
export const nameSchema = z
  .string()
  .trim()
  .min(1, "Le nom est requis")
  .max(255, "Le nom ne peut pas depasser 255 caracteres");

export const shortNameSchema = z
  .string()
  .trim()
  .min(1, "Le nom est requis")
  .max(100, "Le nom ne peut pas depasser 100 caracteres");

// ─── Money ──────────────────────────────────────────────────────────────────
function currencyAmount(maximum: number) {
  return z.number().min(-maximum).max(maximum).refine(value => {
    const cents = value * 100;
    // Accept binary floating-point noise (0.1 + 0.2), never a fraction of a cent.
    return Math.abs(cents - Math.round(cents)) <= Number.EPSILON * Math.max(1, Math.abs(cents)) * 4;
  }, "Le montant doit avoir au plus deux décimales.")
    .transform(value => Math.round(value * 100) / 100);
}

// Match PostgreSQL NUMERIC(10,2); debt principal/balance use NUMERIC(12,2).
export const monetaryAmountSchema = currencyAmount(99_999_999.99);
export const positiveAmountSchema = monetaryAmountSchema.refine(value => value > 0, "Le montant doit etre positif");
export const nonNegativeAmountSchema = monetaryAmountSchema.refine(value => value >= 0, "Le montant ne peut pas etre negatif");
export const largePositiveAmountSchema = currencyAmount(9_999_999_999.99).refine(value => value > 0, "Le montant doit etre positif");
export const largeNonNegativeAmountSchema = currencyAmount(9_999_999_999.99).refine(value => value >= 0, "Le montant ne peut pas etre negatif");

// ─── Color ──────────────────────────────────────────────────────────────────
export const hexColorSchema = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, "Couleur hex invalide (ex: #FF5733)");

// ─── Date ───────────────────────────────────────────────────────────────────
export const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Format YYYY-MM-DD attendu");

// ─── Notes ──────────────────────────────────────────────────────────────────
export const notesSchema = z.string().max(500).nullable().optional();

// ─── Enums (matching lib/types.ts) ──────────────────────────────────────────
export const expenseTypeSchema = z.enum(["RECURRING", "ONE_TIME", "PLANNED"]);

export const recurrenceFrequencySchema = z.enum([
  "WEEKLY",
  "BIWEEKLY",
  "MONTHLY",
  "BIMONTHLY",
  "QUARTERLY",
  "YEARLY",
]);

export const debtFrequencySchema = z.enum([
  "WEEKLY",
  "BIWEEKLY",
  "MONTHLY",
  "QUARTERLY",
  "YEARLY",
]);

export const incomeSourceSchema = z.enum([
  "EMPLOYMENT",
  "BUSINESS",
  "INVESTMENT",
  "OTHER",
]);

export const incomeFrequencySchema = z.enum([
  "MONTHLY",
  "BIWEEKLY",
  "YEARLY",
  "VARIABLE",
]);

export const debtTransactionTypeSchema = z.enum(["PAYMENT", "CHARGE"]);

// ─── Day of month ───────────────────────────────────────────────────────────
export const dayOfMonthSchema = z.number().int().min(1).max(31);

// ─── Reorder (non-empty UUID array) ─────────────────────────────────────────
export const orderedIdsSchema = z
  .array(idSchema)
  .nonempty("Au moins un element requis");

// ─── Currency ───────────────────────────────────────────────────────────────
export const currencySchema = z.string().min(1).max(3);

// ─── Reminder offsets ───────────────────────────────────────────────────────
export const reminderOffsetsSchema = z.array(z.number().int().positive());
