import type { ZodSchema } from "zod";

/**
 * Structured validation error with per-field error messages.
 * Thrown by validateInput() when Zod safeParse fails.
 */
export class ValidationError extends Error {
  public readonly fieldErrors: Record<string, string[]>;

  constructor(fieldErrors: Record<string, string[]>) {
    const message = Object.entries(fieldErrors)
      .map(([field, errors]) => `${field}: ${errors.join(", ")}`)
      .join("; ");
    super(`Validation failed: ${message}`);
    this.name = "ValidationError";
    this.fieldErrors = fieldErrors;
  }
}

/**
 * Validates input against a Zod schema. Returns typed validated data.
 * Throws ValidationError with structured field errors on failure.
 *
 * Usage: `const data = validateInput(CreateExpenseSchema, rawInput);`
 */
export function validateInput<T>(schema: ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new ValidationError(
      result.error.flatten().fieldErrors as Record<string, string[]>,
    );
  }
  return result.data;
}
