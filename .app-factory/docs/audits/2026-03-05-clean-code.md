# Audit Clean Code — 2026-03-05

## Summary

- **Files scanned:** 87 (all `.ts` and `.tsx` files in `lib/`, `app/`, `components/`)
- **Findings:** 0 critical, 5 high, 14 medium, 8 low

| Severity | Count |
|----------|-------|
| CRITICAL | 0 |
| HIGH | 5 |
| MEDIUM | 14 |
| LOW | 8 |

---

## HIGH

### H-01 — God Component: `ProjetsEpargneClient.tsx` (1275 lines)

**File:** `components/ProjetsEpargneClient.tsx:1-1275`
**Rule:** `af-clean-code` § Anti-patterns critiques #1 (Long Method) + #2 (God Object)
**Problem:** Single component file is 1275 lines. It manages savings projects, debts, extra payments, savings history, transfers, debt transactions — all in one render function. Impossible to test individual behaviors in isolation.
**Fix:** Extract into sub-components: `SavingsProjectCard`, `DebtCard`, `ExtraPaymentSheet`, `DebtTransactionSheet`. Each manages its own state and receives callbacks. Target: main orchestrator < 200 lines.

### H-02 — God Component: `RevenusTrackingClient.tsx` (1196 lines)

**File:** `components/RevenusTrackingClient.tsx:1-1196`
**Rule:** `af-clean-code` § Anti-patterns critiques #1 (Long Method) + #2 (God Object)
**Problem:** Single component manages two tabs (revenus + allocations), income marking, allocation editing, adhoc modals, variable income forms, month navigation — all in one file.
**Fix:** Split into `IncomeTrackingTab` and `AllocationTrackingTab` components. Extract sheet/modal sub-components. Target: main file < 200 lines.

### H-03 — God Component: `DepensesTrackingClient.tsx` (876 lines)

**File:** `components/DepensesTrackingClient.tsx:1-876`
**Rule:** `af-clean-code` § Anti-patterns critiques #1 (Long Method)
**Problem:** 876 lines. Mixes monument display, progress bar, filters, grouped list, action sheet, defer sheet, edit amount sheet, delete confirmation, adhoc modal — all in one render.
**Fix:** Extract `ExpenseMonument`, `StatusGroupSection`, `DeferSheet`, `EditAmountSheet`, `DeleteConfirmSheet` into separate components.

### H-04 — Duplicated knowledge: `DEFAULT_SECTIONS` defined twice

**File:** `lib/actions/claim.ts:58-65` and `lib/actions/demo-data.ts:398-405`
**Rule:** `af-clean-code` § Principes fondamentaux #4 (DRY — pas de connaissance dupliquee)
**Problem:** The exact same `DEFAULT_SECTIONS` array (names, icons, colors, positions) is defined in two files. If default sections change, both files must be updated in sync. This is duplicated knowledge (same data, same reason to change).
**Fix:** Extract `DEFAULT_SECTIONS` into `lib/constants.ts` and import from both files.

### H-05 — Long function: `generateMonthlyExpenses` (162 lines)

**File:** `lib/actions/monthly-expenses.ts:85-246`
**Rule:** `af-clean-code` § Fonctions — regles de design (> 30 lignes = extraire)
**Problem:** This function is 162 lines, mixing recurring expense generation, one-time expense generation, and debt payment generation. Three distinct responsibilities in one function.
**Fix:** Extract into `generateRecurringInstances(month, userId)`, `generateOneTimeInstances(month, userId)`, and `generateDebtPaymentInstances(month, userId)`. The orchestrator `generateMonthlyExpenses` calls all three.

---

## MEDIUM

### M-01 — Magic number: `86400000` (milliseconds per day)

**File:** `lib/utils.ts:197` and `lib/utils.ts:236`
**Rule:** `af-clean-code` § Nommage — Constantes nommees, pas de magic numbers
**Problem:** `14 * 86400000` appears without explanation. The reader must mentally compute "86400000 = 1000 * 60 * 60 * 24 = one day in ms."
**Fix:** Define `const MS_PER_DAY = 86_400_000;` in `lib/constants.ts` and use `14 * MS_PER_DAY`.

### M-02 — Magic number: `999` as sentinel return value

**File:** `lib/utils.ts:253`
**Rule:** `af-clean-code` § Nommage — Constantes nommees, pas de magic numbers
**Problem:** `daysUntil()` returns `999` when date is null. This magic sentinel value leaks into callers who must know "999 means no date."
**Fix:** Return `Infinity` (semantic meaning: infinitely far) or `null` with appropriate type.

### M-03 — Non-descriptive variable names: `y`, `m`, `d`

**File:** `lib/utils.ts:115-116`, `lib/month-utils.ts:7-8`, and many components
**Rule:** `af-clean-code` § Nommage — Nom prononcable, cherchable, pas d'abbreviation
**Problem:** Single-letter variables `y`, `m`, `d` used outside of lambdas. In `parseMonth`, `y` and `m` are destructured into scope — while short, they border on acceptable for local use but violate the "searchable" criterion.
**Fix:** Use `year`, `monthNum` consistently (already used in some places like `parseMonth` return type, but not for the local destructure).

### M-04 — Side effect hidden in name: `markAsPaid` also decrements debt balance

**File:** `lib/actions/monthly-expenses.ts:327-368`
**Rule:** `af-clean-code` § Anti-patterns critiques #8 (Hidden Side Effects — nom != comportement)
**Problem:** `markAsPaid(id)` silently does far more than its name implies: it checks if the monthly expense is linked to a debt, decrements the debt balance, auto-deactivates the debt if fully paid, and logs a debt transaction. The caller has no idea 4 additional SQL operations happen.
**Fix:** Rename to `markAsPaidAndProcessDebt(id)` or extract the debt logic into a separate `processDebtPayment(debtId, amount, month)` function called explicitly.

### M-05 — Duplicated `revalidatePath` calls across actions

**File:** Multiple files in `lib/actions/` (137 total `revalidatePath` calls across 13 files)
**Rule:** `af-clean-code` § Principes fondamentaux #4 (DRY)
**Problem:** The same `revalidatePath` patterns are repeated verbatim: `revalidatePath('/depenses'); revalidatePath('/'); revalidatePath('/projets');` etc. Each action manually lists which pages to invalidate, duplicating the knowledge of "what pages depend on what data."
**Fix:** Create helper functions: `revalidateExpensePages()`, `revalidateIncomePages()`, `revalidateAllPages()` in `lib/revalidation.ts`. Call the helper instead of repeating paths.

### M-06 — Long function: `loadDemoData` (338 lines)

**File:** `lib/actions/demo-data.ts:29-373`
**Rule:** `af-clean-code` § Fonctions — regles de design (> 30 lignes)
**Problem:** 338 lines of sequential inserts. While understandable as seed data, it violates the 30-line guideline by 10x. Adding or modifying demo data requires reading through hundreds of lines.
**Fix:** Extract into helper functions: `seedSections(userId)`, `seedCards(userId)`, `seedIncomes(userId)`, `seedExpenses(userId, sectionIds, cardIds)`, etc. The orchestrator reads like a summary.

### M-07 — Long function: `calcDueDateForMonth` (69 lines with repetitive pattern)

**File:** `lib/actions/monthly-expenses.ts:13-82`
**Rule:** `af-clean-code` § Fonctions — regles de design (> 30 lignes) + Anti-patterns #6 (Switch Duplication)
**Problem:** 69 lines of repeated if-else pattern. Each frequency type (BIMONTHLY, YEARLY, QUARTERLY, MONTHLY, WEEKLY, BIWEEKLY) follows the same structure: check frequency, compute days in month, clamp day, format date.
**Fix:** Use a strategy map keyed by frequency, where each entry defines `shouldGenerateForMonth(refDate, targetMonth)` and `computeDay(recurrenceDay, daysInMonth)`.

### M-08 — Inconsistent boolean naming: `is_auto_charged` vs `auto_debit`

**File:** `lib/types.ts:118` vs `lib/types.ts:49`
**Rule:** `af-clean-code` § Nommage — Booleens: `is/has/can/should`
**Problem:** `auto_debit` on `Expense` has no `is` prefix, while `is_auto_charged` on `MonthlyExpense` does. Same semantic concept (automatic payment), inconsistent naming convention.
**Fix:** Align naming. Since DB columns use snake_case, the ideal fix is at the DB level (`is_auto_debit`). If DB migration is too expensive, document the inconsistency and add a type alias comment.

### M-09 — Inline SVG icons duplicated across components

**File:** `components/DepensesTrackingClient.tsx` (multiple), `components/ExpenseTemplateManager.tsx`, `components/ProjetsEpargneClient.tsx`
**Rule:** `af-clean-code` § Principes fondamentaux #4 (DRY)
**Problem:** The same SVG icons (close/X, plus, edit pencil, trash, check, chevron) are copy-pasted as inline JSX across 10+ component files. Each with slightly different sizes and stroke widths.
**Fix:** Create an `Icon` component or icon map in `components/icons.ts` exporting named icon components: `<IconClose />`, `<IconPlus />`, `<IconEdit />`, etc.

### M-10 — Inline styles dominate over semantic CSS

**File:** All components in `components/` (every single file uses `style={{...}}` extensively)
**Rule:** `af-clean-code` § Principes fondamentaux #1 (Le code est lu 10x plus qu'il est ecrit)
**Problem:** Components are 50-70% inline style objects, making them extremely hard to read. Example: `DepensesTrackingClient.tsx` line 266 has a single `<div>` with 7 style properties. The business logic is buried in style noise.
**Fix:** Use Tailwind CSS classes (already in the project stack) or CSS Modules to separate visual concerns from logic. At minimum, extract repeated style patterns into named constants at the top of the file.

### M-11 — Function component defined inside component render: `ExpenseRow`

**File:** `components/ExpenseTemplateManager.tsx:84-470`
**Rule:** `af-clean-code` § Fonctions — Effets de bord caches + Testabilite
**Problem:** `ExpenseRow` is defined as a `const` inside the parent component's body (not as a top-level function). This means it is re-created every render and cannot be memoized. Same issue with `SectionCard` on line 472.
**Fix:** Move `ExpenseRow` and `SectionCard` to top-level function components in the same file or separate files. Pass needed data and callbacks via props.

### M-12 — `createAdhocExpense` has 7 parameters (boolean default in the middle)

**File:** `lib/actions/expenses.ts:492-499`
**Rule:** `af-clean-code` § Fonctions — ≤ 3 params (ou objet) + Anti-patterns #3 (Flag Arguments)
**Problem:** `createAdhocExpense(name, amount, sectionId, month, alreadyPaid = false, dueDate?, cardId?)` has 7 positional parameters with a boolean flag in position 5. Callers must remember parameter order.
**Fix:** Use a parameter object: `createAdhocExpense(data: { name, amount, sectionId, month, alreadyPaid, dueDate?, cardId? })`.

### M-13 — `transferSavings` takes 5 positional parameters including two names

**File:** `lib/actions/expenses.ts:353-359`
**Rule:** `af-clean-code` § Fonctions — ≤ 3 params (ou objet)
**Problem:** `transferSavings(fromId, toId, amount, fromName, toName)` — 5 positional parameters. The `fromName` and `toName` are only used for building note strings, making them confusing in the signature.
**Fix:** Use a parameter object: `transferSavings({ fromId, toId, amount, fromName, toName })`.

### M-14 — Unused variable: `ty`, `tm` in `deferExpenseToMonth`

**File:** `lib/actions/monthly-expenses.ts:414`
**Rule:** `af-clean-code` § Checklist — Structure: Pas de code mort
**Problem:** `const [ty, tm] = targetMonth.split("-").map(Number);` — `ty` and `tm` are destructured but never used. The `dueDate` is constructed from `targetMonth` string directly on line 415.
**Fix:** Remove the destructuring: `const dueDate = \`${targetMonth}-01\``.

---

## LOW

### L-01 — Comment restates code: `// Calculate next_due_date`

**File:** `lib/actions/expenses.ts:93`
**Rule:** `af-clean-code` § Commentaires — Repete le code = Bruit — supprimer
**Problem:** Comment `// Calculate next_due_date` directly above the code that calculates `next_due_date`. The code is self-documenting.
**Fix:** Remove the comment.

### L-02 — Comment restates code: `// Fetch active RECURRING expenses`

**File:** `lib/actions/monthly-expenses.ts:92`
**Rule:** `af-clean-code` § Commentaires — Repete le code = Bruit
**Problem:** The SQL query itself shows `WHERE type = 'RECURRING'`. The comment adds no value.
**Fix:** Remove the comment.

### L-03 — Generic variable name `rows` used everywhere

**File:** All files in `lib/actions/` (every single action uses `const rows = await sql\`...\``)
**Rule:** `af-clean-code` § Nommage — pas de `data`/`temp`/`result`
**Problem:** Every query result is named `rows` regardless of what it contains. When a function has multiple queries, this leads to shadowing or awkward naming (`r1`, `r2`, ... `r11` in `claim.ts:26-35`).
**Fix:** Use descriptive names: `const recurringExpenses`, `const oneTimeExpenses`, `const debtRows`. In `claim.ts`, use semantic names like `sectionUpdates`, `cardUpdates`, etc.

### L-04 — `as any` type cast in `providers.tsx`

**File:** `app/providers.tsx:14`
**Rule:** `af-clean-code` § Conventions TypeScript — Typer les retours publics
**Problem:** `authClient as any` casts away type safety. If the API changes, no compile error will surface.
**Fix:** Define the correct type or use a more specific cast. If the types are genuinely incompatible, add a comment explaining why with a link to the library issue.

### L-05 — Redundant re-export in `month-utils.ts`

**File:** `lib/month-utils.ts:33`
**Rule:** `af-clean-code` § Structure — Un fichier = un export principal
**Problem:** `export { currentMonth as currentMonthKey } from '@/lib/utils'` re-exports `currentMonth` with a different name. Two names for the same function creates confusion.
**Fix:** Use one consistent name across the codebase. Either always `currentMonth` or always `currentMonthKey`.

### L-06 — `formatSectionTotal` is a one-liner that could be inline

**File:** `components/ExpenseTemplateManager.tsx:31-36`
**Rule:** `af-clean-code` § YAGNI — pas de code anticipatoire
**Problem:** This function just wraps `toLocaleString` with specific options. It is used in only one file and could be a constant format config.
**Fix:** If kept, move to `lib/utils.ts` alongside `formatCAD`. If it is only used once, inline it.

### L-07 — Section comment dividers in `allocations.ts`

**File:** `lib/actions/allocations.ts:8,51,78,185,224,258,317`
**Rule:** `af-clean-code` § Commentaires — Sections dans une longue fonction = Smell
**Problem:** `// ─── Helpers ───`, `// ─── Fetch templates ───`, etc. — decorative section comments are a smell indicating the file contains multiple concerns that should be separate modules.
**Fix:** For now these are acceptable as organization aids in a single-responsibility actions file. If the file grows beyond ~300 lines, extract into separate files per concern.

### L-08 — `onboarding.ts` uses `CATEGORY_MAP` with hardcoded French strings

**File:** `lib/actions/onboarding.ts:11-27`
**Rule:** `af-clean-code` § Nommage — Constantes nommees
**Problem:** Category metadata (names, icons, colors) is hardcoded in a server action. This is duplicated knowledge if the onboarding UI also defines category labels.
**Fix:** Extract to a shared constants file if the UI references the same categories.

---

## Systemic Issues

### S-01 — Monolithic client components (architectural pattern)

Multiple client components exceed 800+ lines. The pattern is: one "page client" component that manages ALL state, ALL modals, ALL sheets, ALL filters for an entire page. This is a recurring God Object pattern across the codebase.

**Affected files:**
- `ProjetsEpargneClient.tsx` (1275 lines)
- `RevenusTrackingClient.tsx` (1196 lines)
- `Onboarding.tsx` (1113 lines)
- `ExpenseTemplateManager.tsx` (924 lines)
- `DepensesTrackingClient.tsx` (876 lines)
- `ExpenseModal.tsx` (874 lines)
- `SectionsClient.tsx` (871 lines)
- `CartesClient.tsx` (769 lines)
- `IncomeModal.tsx` (682 lines)
- `DebtModal.tsx` (680 lines)

**Root cause:** Each page is implemented as a single `*Client.tsx` component that handles the entire page interaction. No component composition pattern is applied.

**Recommendation:** This should become a discovery for the PM to prioritize. A refactoring epic to break these into composed sub-components would significantly improve maintainability. Logged as discovery below.

### S-02 — Pervasive inline styles instead of utility classes

All 60+ component files use `style={{}}` objects for ALL styling. The project has Tailwind v4 in its stack but components do not use it. This bloats component code by 50-70%, making business logic hard to find.

**Recommendation:** Migrate to Tailwind utility classes incrementally, starting with the most-edited components.

### S-03 — No input validation on server actions

Server actions receive data directly from the client and pass it to SQL queries without Zod or any validation schema. While the Neon serverless driver parameterizes queries (preventing SQL injection), there is no business-level validation (e.g., amount > 0, name not empty, valid frequency enum). This is an architecture concern but manifests as a clean code issue: server actions mix data access with implicit validation.

**Recommendation:** Logged as discovery. Add Zod schemas for all action inputs.

---

## Discoveries

The following systemic issues were found during this audit and should be logged as discoveries for PM triage:

1. **TECH_DEBT / P2** — Monolithic client components (S-01): 10 components exceed 680 lines. Refactoring epic needed.
2. **TECH_DEBT / P2** — Inline styles everywhere (S-02): Tailwind is in the stack but unused in components.
3. **TECH_DEBT / P2** — No input validation (S-03): Server actions lack Zod validation schemas.
4. **TECH_DEBT / P3** — Duplicated SVG icons (M-09): Same icons copy-pasted across 10+ files.
5. **TECH_DEBT / P3** — Duplicated `revalidatePath` patterns (M-05): 137 calls across 13 files with repeated path lists.

---

*Audit performed by af-reviewer in audit mode against `af-clean-code` skill.*
*Codebase: Mes Finances — Next.js 16 + React 19 + Neon PostgreSQL, personal finance PWA (fr-CA).*
*Context: Alpha stage, personal use, no test suite.*
