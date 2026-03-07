# AUDIT-004 — Review-Design: Add Zod validation schemas to all server actions

**Date:** 2026-03-05
**Agent:** af-reviewer/review-design
**Level:** 2
**Scope:** backend, security
**Skills loaded:** af-conventions, af-clean-code, af-clean-architecture, af-security, af-api-design, af-documentation

---

## Verdict: APPROVED WITH NOTES

**0 CRITICAL | 0 HIGH | 4 MEDIUM | 2 LOW**

The design is architecturally sound, well-structured, and addresses the audit findings effectively. The `lib/schemas/` location, domain-based splitting, `safeParse` + `ValidationError` approach, and type inference strategy are all correct decisions. The edge cases (amount=0 for PLANNED, negative amounts for savings contributions) are properly identified and mitigated. The design can proceed to build with the notes below addressed.

---

## Git Reality Check

- No source code changes detected (design-only phase -- expected).
- Design log file exists at `.app-factory/log/audit-remediation/AUDIT-004/design.md` (untracked, expected).
- No discrepancies between declared state and git state.

---

## Findings

### MEDIUM

#### M1 — Incomplete field coverage in CreateExpenseSchema table

**File:** `.app-factory/log/audit-remediation/AUDIT-004/design.md:59`
**Rule:** `af-documentation` § finding format / `af-security` § input validation completeness
**Problem:** The design's schema table for `CreateExpenseSchema` (section 3.1) lists validation rules but omits several fields present in the actual `CreateExpenseInput` type (lines 66-87 of `lib/actions/expenses.ts`):
- `auto_debit: boolean` (optional) -- not mentioned
- `spread_monthly: boolean` (optional) -- not mentioned
- `notify_push/notify_email/notify_sms: boolean` (optional) -- not mentioned
- `notes: string` (optional) -- not mentioned

These fields all accept user input and go directly into SQL INSERT statements. While booleans have limited attack surface, `notes` is a string field that should have length validation (max 500, consistent with other note fields).

**Impact:** Builder may miss these fields during schema creation, leaving them unvalidated. The `notes` field in particular should be length-bounded.
**Fix:** Add all missing fields to the schema table. Specifically: `auto_debit`, `spread_monthly`, `notify_push/email/sms` as optional booleans, `notes` as optional string max 500.

---

#### M2 — createAdhocExpense schema missing `alreadyPaid` parameter

**File:** `.app-factory/log/audit-remediation/AUDIT-004/design.md:65`
**Rule:** `af-security` § input validation completeness
**Problem:** The `CreateAdhocExpenseSchema` description lists validation for `name, amount, sectionId, month, dueDate, cardId` but omits the `alreadyPaid` boolean parameter (line 497 of `lib/actions/expenses.ts`: `alreadyPaid: boolean = false`). This parameter controls which SQL INSERT path is taken (PAID vs UPCOMING status), making it a behavior-controlling input.
**Impact:** Without explicit boolean validation, a non-boolean value could be coerced by JavaScript truthiness rules in unexpected ways.
**Fix:** Add `alreadyPaid: optional boolean, defaults to false` to the `CreateAdhocExpenseSchema` definition.

---

#### M3 — IncomeInput missing fields in schema table

**File:** `.app-factory/log/audit-remediation/AUDIT-004/design.md:73`
**Rule:** `af-security` § input validation completeness
**Problem:** The `CreateIncomeSchema` table lists `name, source, amount, estimated_amount, frequency, pay_anchor_date` but omits:
- `auto_deposit: boolean` (optional) -- present in `IncomeInput` (line 35 of `lib/actions/incomes.ts`)
- `notes: string | null` (optional) -- present in `IncomeInput` (line 36)

These are user-controlled fields that go into SQL queries.
**Impact:** Incomplete schema coverage. The `notes` field should have max length validation.
**Fix:** Add `auto_deposit` as optional boolean and `notes` as optional string max 500 (or nullable) to the `CreateIncomeSchema`.

---

#### M4 — amount validation for `createExpense` should be `nonNegative`, not `positive`

**File:** `.app-factory/log/audit-remediation/AUDIT-004/design.md:59`
**Rule:** `af-security` § input validation correctness
**Problem:** The design states `amount: positive number` for `CreateExpenseSchema`. However, PLANNED expenses have `amount: 0` as the default (line 139: `saved_amount ?? 0`), and the risk assessment section (section 8) correctly identifies this edge case: "PLANNED expenses have `amount: 0` -- use `nonNegativeAmountSchema` for these." But this contradicts the schema table in section 3.1 which says `amount: positive number`.

The design has the right answer in section 8 but the wrong specification in section 3.1. The Builder will follow section 3.1 and break PLANNED expense creation.
**Impact:** Creating a PLANNED expense with amount=0 (legitimate) would be rejected by a `positive()` schema.
**Fix:** Change `amount` in `CreateExpenseSchema` to `nonNegativeAmountSchema` (z.number().nonnegative()), or use a conditional schema (discriminated union on `type`) where RECURRING/ONE_TIME require positive and PLANNED allows zero. The simpler approach (nonNegative for all) is recommended to avoid over-engineering.

---

### LOW

#### L1 — Story AC says "montant negatif ou zero" but design allows zero in some schemas

**File:** `.app-factory/backlog/epics/stabilisation/features/audit-remediation/stories/AUDIT-004.md:24`
**Rule:** `af-conventions` § PM defines WHAT, Builder defines HOW
**Problem:** The story AC says "When elle recoit un montant negatif ou zero, Then elle retourne une erreur de validation." This is in conflict with legitimate zero amounts (PLANNED expenses, `updateMonthlyExpenseAmount` for suspended expenses). The design correctly identifies these edge cases and proposes nonNegative where appropriate, which is the right call. However, the Builder should be aware this is a deliberate deviation from the literal AC text.
**Impact:** Informational. The design's approach is correct -- the AC is overly broad.
**Fix:** No code change needed. The Builder should document this deviation in the build log. If the PM questions it, the technical justification is sound.

---

#### L2 — `reorderSchema` naming is generic

**File:** `.app-factory/log/audit-remediation/AUDIT-004/design.md:309`
**Rule:** `af-clean-code` § nommage
**Problem:** `reorderSchema` is used for both `reorderAllocations(orderedIds)` and `reorderSections(orderedIds)`. The name is fine as a shared primitive, but in the code it may be confusing since it's just `z.array(idSchema).nonempty()` -- essentially a "non-empty UUID array" schema. Consider naming it `orderedIdsSchema` or `nonEmptyIdArraySchema` to better reveal intent.
**Impact:** Minor readability. Builder's discretion.
**Fix:** Consider renaming to `orderedIdsSchema` in `common.ts`.

---

## Architecture Assessment

### 1. `lib/schemas/` location -- APPROVED

The choice to place schemas in `lib/schemas/` rather than colocating in action files is correct per `af-clean-architecture` § shared schemas. The schemas will be reusable by frontend form validation later. The domain-based file splitting mirrors the action file structure, making navigation intuitive. The `common.ts` shared primitives file prevents duplication.

One note: the project does not currently use a `features/` structure (it uses `lib/actions/` directly). The `lib/schemas/` location is consistent with this existing flat structure.

### 2. Security -- SUFFICIENT for audit findings

The design addresses Security-H1 (no runtime validation) comprehensively:
- All mutation functions get validation
- Read functions with ID parameters get UUID validation (prevents SQL injection via malformed IDs)
- API routes get body validation with proper 400 responses
- Push subscribe validates HTTPS-only endpoints
- Push send validates relative-path-only URLs

The `safeParse` approach prevents Zod internals from leaking to clients, which is correct.

### 3. Error handling -- SOUND

The `ValidationError` class with structured `fieldErrors` is clean and consistent with `af-clean-code` § error handling. The `validateInput()` helper gives every action a one-liner integration. The decision to throw (matching 90% of the codebase) rather than return `{ error }` (matching only 2 functions) is pragmatic and correct.

The exception for `completeOnboarding` and `loadDemoData` (which already use `{ success, error }`) is properly documented.

### 4. Type inference -- WILL WORK

Using `z.infer<typeof Schema>` to replace inline types is the standard Zod pattern. The design correctly notes that TypeScript will catch any mismatch at build time, which is a safety net. The inline types (`CreateExpenseInput`, `IncomeInput`, `AllocationInput`, `CreateDebtInput`) will be deleted from action files and re-exported from schema files.

`lib/types.ts` (DB row/output types) is correctly left untouched.

### 5. Risk assessment -- ADEQUATE

The highest risks are correctly identified:
- **amount=0 for PLANNED**: identified but inconsistently specified (see M4)
- **Negative amounts for savings contributions**: correctly handled (non-zero allowed)
- **Optional vs nullable semantics**: correctly flagged with the `.optional()` vs `.nullable()` vs `.nullable().optional()` mapping
- **Month format**: verified frontend sends padded format

### 6. Gate migration -- N/A

No database changes. No migration safety concerns.

---

## Summary

The design is solid and well-reasoned. The main issue is incomplete field coverage in schema tables (M1, M2, M3) -- several boolean and string fields present in the actual TypeScript types are not listed in the design's schema specifications. The Builder needs a complete field list to create accurate schemas. The amount validation inconsistency (M4) between section 3.1 and section 8 must be resolved before build -- the section 8 analysis is correct, section 3.1 must be updated.

No CRITICAL or HIGH findings. The design can proceed to build once the Builder acknowledges these notes and plans to include the missing fields.
