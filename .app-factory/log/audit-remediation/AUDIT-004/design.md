# AUDIT-004 — Design: Add Zod validation schemas to all server actions

**Date:** 2026-03-05
**Agent:** af-builder/design
**Level:** 2 (CRUD + non-trivial validation)
**Scope:** backend, security
**Skills loaded:** af-clean-code, af-clean-architecture, af-documentation, af-conventions, af-api-design, af-security

---

## 1. Context & Problem

All 40+ server actions accept TypeScript types that are erased at runtime. A malicious client or frontend bug can send negative amounts, empty strings, invalid enum values, or unexpected fields. The API routes (`/api/push/send`, `/api/push/subscribe`) also accept unvalidated payloads. This is the highest-impact security finding from the audit (Security-H1).

**Current state:** Zero runtime validation. Types like `CreateExpenseInput`, `IncomeInput`, `CreateDebtInput` are TypeScript-only -- they protect nothing at runtime.

---

## 2. Architecture Decision: Schema file structure

### Decision: `lib/schemas/` with one file per domain

```
lib/schemas/
  common.ts          -- shared primitives (id, month, name, amount, color, etc.)
  expense.ts         -- expense + adhoc expense + savings schemas
  income.ts          -- income + adhoc income schemas
  debt.ts            -- debt + extra payment schemas
  debt-transaction.ts -- debt transaction schemas
  monthly-expense.ts -- monthly expense mutation schemas
  monthly-income.ts  -- monthly income mutation schemas
  allocation.ts      -- allocation + adhoc allocation + monthly allocation schemas
  section.ts         -- section schemas
  card.ts            -- card schemas
  settings.ts        -- settings schemas
  onboarding.ts      -- onboarding schemas
  push.ts            -- push notification schemas (API routes)
  index.ts           -- barrel export
```

**Rationale:** One file per domain mirrors the action file structure. Each schema file is colocated with its domain, making it obvious which schemas belong to which actions. A `common.ts` file avoids duplication of shared validation primitives (UUIDs, positive amounts, non-empty names, month format, color hex).

### Why not `lib/schemas.ts` (single file)?

A single file would grow to 500+ lines and mix concerns. Domain-based splitting is the right call at this scale (13 action files, 2 API routes).

### Why not colocate schemas inside action files?

Schemas are reusable (frontend form validation will use them later). Keeping them in `lib/schemas/` makes them importable from both `lib/actions/` and future frontend code without circular dependencies. This aligns with af-clean-architecture: `shared/` schemas are the bridge between frontend and backend.

---

## 3. Mutation functions requiring validation

### 3.1 expenses.ts (6 mutations)

| Function | Schema | Validates |
|----------|--------|-----------|
| `createExpense(data)` | `CreateExpenseSchema` | name: non-empty, max 255. amount: positive number. type: enum RECURRING/ONE_TIME/PLANNED. currency: optional string max 3. section_id/card_id: optional UUID. recurrence_frequency: optional enum. recurrence_day: optional 1-31. reminder_offsets: optional array of positive ints. target_amount/saved_amount: optional non-negative. target_date/due_date: optional ISO date string. |
| `updateExpense(id, data)` | `UpdateExpenseSchema` | id: UUID. data: partial of CreateExpenseSchema (all fields optional). |
| `deleteExpense(id)` | `IdSchema` | id: UUID. |
| `updateSavedAmount(id, savedAmount)` | Inline | id: UUID. savedAmount: non-negative number. |
| `addSavingsContribution(expenseId, amount, note?)` | `AddSavingsContributionSchema` | expenseId: UUID. amount: non-zero number (can be negative for corrections). note: optional string max 500. |
| `transferSavings(fromId, toId, amount, fromName, toName)` | `TransferSavingsSchema` | fromId/toId: UUID. amount: positive number. fromName/toName: non-empty string max 255. |
| `createAdhocExpense(name, amount, sectionId, month, alreadyPaid?, dueDate?, cardId?)` | `CreateAdhocExpenseSchema` | name: non-empty max 255. amount: positive. sectionId: UUID. month: YYYY-MM format. dueDate: optional ISO date. cardId: optional UUID. |

**Read-only functions (no validation needed):** `getExpenses`, `getUpcomingExpenses`, `getExpenseById`, `getMonthlySummaryBySection`, `getPlannedExpenses`, `getExpensesByCard`, `getMonthlySavingsSummary`, `getMonthlyExpenseActualsBySection`, `getOrCreateFreeSavings`. Note: query parameter functions like `getExpenseById(id)` and `getExpensesByCard(cardId)` WILL get UUID validation on their `id` parameter since they accept user input that goes directly into SQL queries.

### 3.2 incomes.ts (4 mutations)

| Function | Schema | Validates |
|----------|--------|-----------|
| `createIncome(data)` | `CreateIncomeSchema` | name: non-empty max 255. source: enum EMPLOYMENT/BUSINESS/INVESTMENT/OTHER. amount: nullable positive number. estimated_amount: nullable non-negative. frequency: enum. pay_anchor_date: optional ISO date. |
| `updateIncome(id, data)` | `UpdateIncomeSchema` | id: UUID. data: partial of CreateIncomeSchema. |
| `deleteIncome(id)` | `IdSchema` | id: UUID. |
| `createAdhocIncome(name, amount, source, month)` | `CreateAdhocIncomeSchema` | name: non-empty max 255. amount: positive. source: enum. month: YYYY-MM. |

### 3.3 debts.ts (4 mutations)

| Function | Schema | Validates |
|----------|--------|-----------|
| `createDebt(data)` | `CreateDebtSchema` | name: non-empty max 255. original_amount: positive. remaining_balance: non-negative. interest_rate: optional 0-100. payment_amount: positive. payment_frequency: enum. payment_day: optional 1-31. card_id/section_id: optional UUID. |
| `updateDebt(id, data)` | `UpdateDebtSchema` | id: UUID. data: partial. |
| `deleteDebt(id)` | `IdSchema` | id: UUID. |
| `makeExtraPayment(id, amount)` | Inline | id: UUID. amount: positive. |

### 3.4 debt-transactions.ts (1 mutation)

| Function | Schema | Validates |
|----------|--------|-----------|
| `addDebtTransaction(debtId, type, amount, month, note?, source?)` | `AddDebtTransactionSchema` | debtId: UUID. type: enum PAYMENT/CHARGE. amount: positive. month: YYYY-MM. note: optional max 500. source: optional string max 50. |

### 3.5 monthly-expenses.ts (6 mutations)

| Function | Schema | Validates |
|----------|--------|-----------|
| `markAsPaid(id)` | `IdSchema` | id: UUID. |
| `deferExpenseToMonth(id, targetMonth)` | `DeferExpenseSchema` | id: UUID. targetMonth: YYYY-MM. |
| `markAsUpcoming(id)` | `IdSchema` | id: UUID. |
| `deleteMonthlyExpense(id)` | `IdSchema` | id: UUID. |
| `updateMonthlyExpenseAmount(id, newAmount)` | Inline | id: UUID. newAmount: non-negative (can be 0 for suspended). |

**Generation functions (`generateMonthlyExpenses`, `autoMarkOverdue`, `autoMarkPaidForAutoDebit`):** These take a `month` string parameter. We validate `month` as YYYY-MM format since they are called from page render with user-navigable month parameters.

### 3.6 monthly-incomes.ts (5 mutations)

| Function | Schema | Validates |
|----------|--------|-----------|
| `markIncomeReceived(monthlyIncomeId, actualAmount, notes?)` | `MarkIncomeReceivedSchema` | id: UUID. actualAmount: non-negative. notes: optional max 500. |
| `markIncomeAsExpected(monthlyIncomeId)` | `IdSchema` | id: UUID. |
| `deleteMonthlyIncome(id)` | `IdSchema` | id: UUID. |
| `updateMonthlyIncomeAmount(id, newExpectedAmount)` | Inline | id: UUID. newExpectedAmount: non-negative. |
| `markVariableIncomeReceived(incomeId, month, actualAmount, notes?)` | `MarkVariableIncomeReceivedSchema` | incomeId: UUID. month: YYYY-MM. actualAmount: non-negative. notes: optional max 500. |

**Generation functions:** `generateMonthlyIncomes(month)`, `autoMarkReceivedForAutoDeposit(month)` -- validate month as YYYY-MM.

### 3.7 allocations.ts (6 mutations)

| Function | Schema | Validates |
|----------|--------|-----------|
| `createAllocation(data)` | `CreateAllocationSchema` | label: non-empty max 255. amount: positive. section_ids: optional array of UUIDs. project_id: optional UUID. end_month: optional YYYY-MM. color: optional hex color. position: optional non-negative int. |
| `updateAllocation(id, data)` | `UpdateAllocationSchema` | id: UUID. data: same as create. |
| `deleteAllocation(id)` | `IdSchema` | id: UUID. |
| `reorderAllocations(orderedIds)` | `ReorderSchema` | orderedIds: non-empty array of UUIDs. |
| `createAdhocMonthlyAllocation(month, data)` | `CreateAdhocAllocationSchema` | month: YYYY-MM. data: label, amount, section_ids, project_id, color. |
| `updateMonthlyAllocation(id, amount, notes?)` | `UpdateMonthlyAllocationSchema` | id: UUID. amount: non-negative. notes: optional max 500. |

### 3.8 sections.ts (3 mutations)

| Function | Schema | Validates |
|----------|--------|-----------|
| `createSection(data)` | `CreateSectionSchema` | name: non-empty max 100. icon: non-empty max 10 (emoji). color: hex color. |
| `updateSection(id, data)` | `UpdateSectionSchema` | id: UUID. data: partial of create. |
| `deleteSection(id)` | `IdSchema` | id: UUID. |
| `reorderSections(orderedIds)` | `ReorderSchema` | orderedIds: non-empty array of UUIDs. |

**Read-only with ID param:** `getSectionExpenseCount(id)` -- validate id as UUID.

### 3.9 cards.ts (3 mutations)

| Function | Schema | Validates |
|----------|--------|-----------|
| `createCard(data)` | `CreateCardSchema` | name: non-empty max 100. last_four: optional string exactly 4 digits. bank: optional max 100. color: optional hex color. |
| `updateCard(id, data)` | `UpdateCardSchema` | id: UUID. data: partial of create. |
| `deleteCard(id)` | `IdSchema` | id: UUID. |

**Read-only with ID param:** `getCardById(id)` -- validate id as UUID.

### 3.10 settings.ts (1 mutation)

| Function | Schema | Validates |
|----------|--------|-----------|
| `updateSettings(id, data)` | `UpdateSettingsSchema` | id: UUID. data: email (optional valid email or null), phone (optional string max 20 or null), default_currency (optional 3-char string), default_reminder_offsets (optional array of positive ints), notify_push/email/sms (optional booleans). |

### 3.11 onboarding.ts (1 mutation)

| Function | Schema | Validates |
|----------|--------|-----------|
| `completeOnboarding(data)` | `CompleteOnboardingSchema` | monthlyRevenue: non-negative. frequency: enum weekly/biweekly/monthly. categories: array of strings (from CATEGORY_MAP keys). objective: nullable string max 255. |

### 3.12 demo-data.ts (0 mutations needing input validation)

`loadDemoData()` and `clearAllUserData()` take no user input -- they only require authentication (already handled by `requireAuth()`). `hasUserData()` is a read-only function. **No schemas needed.**

### 3.13 claim.ts (0 mutations needing input validation)

`claimOrphanedData()` and `ensureDefaultSections()` take no user input. `hasOrphanedData()` is read-only. **No schemas needed.**

### 3.14 API Routes (2 endpoints)

| Endpoint | Schema | Validates |
|----------|--------|-----------|
| `POST /api/push/send` | `PushSendSchema` | title: optional string max 255. body: required string max 1000. url: optional relative path (must start with `/`, no protocol). |
| `POST /api/push/subscribe` | `PushSubscribeSchema` | endpoint: required HTTPS URL. keys.p256dh: required non-empty string. keys.auth: required non-empty string. |

---

## 4. Integration Pattern

### Decision: `safeParse` at top of function, return error object

**Pattern chosen:**

```typescript
export async function createExpense(data: CreateExpenseInput): Promise<Expense> {
  const parsed = CreateExpenseSchema.safeParse(data);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.flatten().fieldErrors);
  }
  const userId = await requireAuth();
  // ... use parsed.data (typed, validated)
}
```

**Why `safeParse` + throw (not `parse`)?**

- `parse` throws a `ZodError` directly, which leaks Zod internals to the client. We want a controlled error boundary.
- `safeParse` lets us inspect the error, format it, and throw a domain-appropriate `ValidationError`.
- Server Actions in Next.js serialize errors. A clean `ValidationError` with structured field errors is better than a raw `ZodError` stack trace.

**Why throw instead of return `{ error }`?**

Looking at the existing codebase: most actions throw implicitly (no try/catch, errors propagate to the Next.js error boundary). Only `completeOnboarding` and `loadDemoData` use the `{ success, error }` pattern. Throwing is consistent with 90% of the codebase. Adding `{ success, error }` to all 40+ functions would be a massive refactor beyond scope.

**Exception:** For `completeOnboarding` and `loadDemoData` which already use `{ success, error }`, validation errors will be caught and returned in the same format.

**For API routes:** Use `safeParse` and return `NextResponse.json({ error }, { status: 400 })`.

### Validation helper

Create a small `lib/schemas/validate.ts` utility:

```typescript
import { ZodSchema, ZodError } from 'zod';

export class ValidationError extends Error {
  public fieldErrors: Record<string, string[]>;
  constructor(fieldErrors: Record<string, string[]>) {
    const message = Object.entries(fieldErrors)
      .map(([field, errors]) => `${field}: ${errors.join(', ')}`)
      .join('; ');
    super(`Validation failed: ${message}`);
    this.name = 'ValidationError';
    this.fieldErrors = fieldErrors;
  }
}

export function validateInput<T>(schema: ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new ValidationError(
      result.error.flatten().fieldErrors as Record<string, string[]>
    );
  }
  return result.data;
}
```

This gives every action a one-liner: `const validated = validateInput(CreateExpenseSchema, data);`

---

## 5. Type inference strategy

### Decision: Schemas are the single source of truth for input types

**Current state:** Types like `CreateExpenseInput` are manually defined inline in action files. `lib/types.ts` defines DB row types (output types).

**Target state:**

```typescript
// lib/schemas/expense.ts
export const CreateExpenseSchema = z.object({ ... });
export type CreateExpenseInput = z.infer<typeof CreateExpenseSchema>;

// lib/actions/expenses.ts
import { CreateExpenseSchema, type CreateExpenseInput } from '@/lib/schemas/expense';
```

**What changes:**
- The inline `type CreateExpenseInput = { ... }` declarations in action files are DELETED.
- They are replaced by `z.infer<typeof Schema>` exports from schema files.
- `lib/types.ts` (DB row types / output types) is NOT touched -- those types describe query results, not user input.

**Risk mitigation:** The inferred types must match the existing inline types exactly. Any mismatch will cause TypeScript build errors, which is actually a safety net -- the build will fail loudly if a schema doesn't match the current usage.

---

## 6. Shared primitives (`common.ts`)

Reusable validation building blocks:

```typescript
// IDs
export const idSchema = z.string().uuid();

// Month format
export const monthSchema = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Format YYYY-MM attendu');

// Name fields
export const nameSchema = z.string().trim().min(1, 'Le nom est requis').max(255);
export const shortNameSchema = z.string().trim().min(1).max(100);

// Money
export const positiveAmountSchema = z.number().positive('Le montant doit etre positif');
export const nonNegativeAmountSchema = z.number().nonnegative('Le montant ne peut pas etre negatif');

// Color
export const hexColorSchema = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Couleur hex invalide');

// Date
export const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format YYYY-MM-DD attendu');

// Notes
export const notesSchema = z.string().max(500).nullable().optional();

// Enums (matching lib/types.ts)
export const expenseTypeSchema = z.enum(['RECURRING', 'ONE_TIME', 'PLANNED']);
export const recurrenceFrequencySchema = z.enum(['WEEKLY', 'BIWEEKLY', 'MONTHLY', 'BIMONTHLY', 'QUARTERLY', 'YEARLY']);
export const debtFrequencySchema = z.enum(['WEEKLY', 'BIWEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY']);
export const incomeSourceSchema = z.enum(['EMPLOYMENT', 'BUSINESS', 'INVESTMENT', 'OTHER']);
export const incomeFrequencySchema = z.enum(['MONTHLY', 'BIWEEKLY', 'YEARLY', 'VARIABLE']);
export const debtTransactionTypeSchema = z.enum(['PAYMENT', 'CHARGE']);

// Day of month
export const dayOfMonthSchema = z.number().int().min(1).max(31);

// Reorder
export const reorderSchema = z.array(idSchema).nonempty();
```

---

## 7. API route validation pattern

```typescript
// app/api/push/subscribe/route.ts
import { PushSubscribeSchema } from '@/lib/schemas/push';

export async function POST(req: NextRequest) {
  // ... auth check ...
  const body = await req.json();
  const parsed = PushSubscribeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid subscription', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }
  const { endpoint, keys } = parsed.data;
  // ... proceed with validated data
}
```

**Push send URL validation (AC requirement):**

```typescript
export const PushSendSchema = z.object({
  title: z.string().max(255).optional(),
  body: z.string().min(1).max(1000),
  url: z.string()
    .startsWith('/', 'URL must be a relative path')
    .max(500)
    .optional()
    .default('/'),
});
```

This rejects `https://evil.com` because it doesn't start with `/`.

**Push subscribe endpoint validation (AC requirement):**

```typescript
export const PushSubscribeSchema = z.object({
  endpoint: z.string().url().startsWith('https://', 'Endpoint must be HTTPS'),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
});
```

---

## 8. Risk Assessment

### HIGH risk -- Breaking existing valid inputs

| Risk | Impact | Mitigation |
|------|--------|------------|
| Schema too strict for existing valid data (e.g., saved_amount can be 0, `amount` for PLANNED is 0) | Existing forms break | PLANNED expenses have `amount: 0` -- use `nonNegativeAmountSchema` for these. Test with demo data. |
| UUID validation rejects non-UUID IDs | If any legacy IDs are not UUIDs, all operations break | Verify: Neon uses UUID primary keys by default. Confirmed safe. |
| Month format validation | If any frontend sends `2026-2` instead of `2026-02` | Frontend already sends padded format. Safe. |
| `addSavingsContribution` amount validation | Transfers use negative amounts for debit entries | Allow non-zero (positive or negative) for contributions. `transferSavings` uses positive amount only. |

### MEDIUM risk -- Type inference mismatch

| Risk | Impact | Mitigation |
|------|--------|------------|
| Schema inferred type differs from existing inline type | TypeScript build errors | This is actually a FEATURE -- the build will catch mismatches. Fix the schema to match. |
| Optional vs nullable vs undefined semantics | Zod `.optional()` vs `.nullable()` differ from TS `?:` | Carefully match: `field?: type` -> `.optional()`, `field: type \| null` -> `.nullable()`, `field?: type \| null` -> `.nullable().optional()` |

### LOW risk

| Risk | Impact | Mitigation |
|------|--------|------------|
| Bundle size increase from Zod | Zod is ~13KB gzipped | Acceptable for server-side code. Tree-shaking handles unused schemas. |
| Performance impact of validation | Extra CPU per request | Zod parsing is <1ms for these simple schemas. Negligible. |

---

## 9. Estimated Scope

### Files to create (14 new files)

| File | Estimated schemas |
|------|-------------------|
| `lib/schemas/common.ts` | ~15 shared primitives |
| `lib/schemas/expense.ts` | 5 schemas |
| `lib/schemas/income.ts` | 3 schemas |
| `lib/schemas/debt.ts` | 3 schemas |
| `lib/schemas/debt-transaction.ts` | 1 schema |
| `lib/schemas/monthly-expense.ts` | 3 schemas |
| `lib/schemas/monthly-income.ts` | 3 schemas |
| `lib/schemas/allocation.ts` | 4 schemas |
| `lib/schemas/section.ts` | 2 schemas |
| `lib/schemas/card.ts` | 2 schemas |
| `lib/schemas/settings.ts` | 1 schema |
| `lib/schemas/onboarding.ts` | 1 schema |
| `lib/schemas/push.ts` | 2 schemas |
| `lib/schemas/validate.ts` | ValidationError class + helper |
| `lib/schemas/index.ts` | barrel export |

**Total schemas:** ~45

### Files to modify (13 action files + 2 API routes)

| File | Mutations to wrap | Reads to validate ID |
|------|-------------------|---------------------|
| `lib/actions/expenses.ts` | 6 | 3 (getExpenseById, getExpensesByCard, getSavingsContributions) |
| `lib/actions/incomes.ts` | 4 | 0 |
| `lib/actions/debts.ts` | 4 | 0 |
| `lib/actions/debt-transactions.ts` | 1 | 1 (getDebtTransactions) |
| `lib/actions/monthly-expenses.ts` | 5 | 0 (generation functions get month validation) |
| `lib/actions/monthly-incomes.ts` | 5 | 0 (generation functions get month validation) |
| `lib/actions/allocations.ts` | 6 | 0 (generation/fetch get month validation) |
| `lib/actions/sections.ts` | 3 | 1 (getSectionExpenseCount) |
| `lib/actions/cards.ts` | 3 | 1 (getCardById) |
| `lib/actions/settings.ts` | 1 | 0 |
| `lib/actions/onboarding.ts` | 1 | 0 |
| `app/api/push/send/route.ts` | 1 | 0 |
| `app/api/push/subscribe/route.ts` | 1 | 0 |

**Total functions to modify:** ~47 mutations + ~5 reads with ID validation + ~5 generation functions with month validation = ~57 functions

### Files NOT modified

| File | Reason |
|------|--------|
| `lib/types.ts` | DB row types stay as-is. Input types move to schemas. |
| `lib/actions/demo-data.ts` | No user input (auth-only). |
| `lib/actions/claim.ts` | No user input (auth-only). |

---

## 10. Implementation Order

1. Install `zod` as production dependency
2. Create `lib/schemas/common.ts` (shared primitives)
3. Create `lib/schemas/validate.ts` (ValidationError + helper)
4. Create domain schema files (expense, income, debt, etc.) -- one at a time
5. For each domain, modify the corresponding action file to use `validateInput()` and the inferred types
6. Create `lib/schemas/push.ts` and update API routes
7. Create `lib/schemas/index.ts` barrel export
8. Run TypeScript build to verify no type mismatches
9. Test with existing frontend forms to verify non-regression

---

## 11. Non-Decisions (out of scope)

- **Frontend form validation with Zod:** The schemas are designed to be importable from frontend, but integrating them into React Hook Form or form components is a separate story.
- **Custom error messages in French:** Schema error messages will be in French where practical (field-level messages in `.min()`, `.max()`, etc.) but Zod's built-in messages remain English. Full i18n of Zod errors is out of scope.
- **Refactoring action signatures:** Some functions like `createAdhocExpense` take 7 positional params. Refactoring to an object param is a clean code improvement but out of scope for this story. The validation will work with the current signatures.
