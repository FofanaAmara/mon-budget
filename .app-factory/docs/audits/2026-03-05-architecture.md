# Audit Architecture — 2026-03-05

## Summary
- Files scanned: 90 (all `.ts`/`.tsx` in `lib/`, `app/`, `components/`)
- Findings: 0 critical, 5 high, 6 medium, 3 low

## Context

Personal finance PWA. Alpha stage, single user. Stack: Next.js 16 App Router + React 19 + Neon PostgreSQL + Server Actions (no REST API). Template/Transaction pattern (expenses = templates, monthly_expenses = instances).

The skill `af-clean-architecture` defines 3 architecture levels and mandates feature-based organization with `features/[name]/backend/`, `frontend/`, `shared/` structure. The decision framework states that 60-70% of features are Level 1 (simple CRUD), 15-20% Level 2, 10-20% Level 3. The key principles are: feature-based always, `app/` is a thin routing layer, dependencies point inward, and calibrate to real need (not future need).

---

## HIGH

### H-1. Layer-based structure instead of feature-based

**File:** `lib/actions/`, `components/`, `lib/types.ts`, `lib/utils.ts`
**Rule:** `af-clean-architecture` § Principes fondamentaux #2, § Feature-based vs Layer-based
**Problem:** The entire codebase is organized by technical layer (`lib/actions/`, `components/`, `lib/types.ts`, `lib/utils.ts`) instead of by feature (`features/expenses/`, `features/incomes/`, `features/allocations/`, etc.). There is no `features/` directory at all. Server actions for expenses, incomes, allocations, debts, sections, cards, settings, and onboarding all live together in `lib/actions/`. All 40+ components live in a flat `components/` directory. All types for every domain entity are in a single `lib/types.ts` (270 lines). This is the classic "layer-based" anti-pattern the skill explicitly warns against.
**Impact:** Adding a feature requires modifying 3+ directories. Files for different domains are interleaved. Colocation is non-existent -- a developer working on allocations must navigate `lib/actions/allocations.ts`, `components/AllocationsManager.tsx`, `components/AllocationModal.tsx`, `components/AdhocAllocationModal.tsx`, `lib/types.ts` (scroll to find the right types), and `app/parametres/allocation/page.tsx`. At 90 files this is manageable; at 150+ it becomes a navigation nightmare.
**Fix:** Migrate progressively to feature-based structure. Start with the largest domains:
```
features/
  expenses/
    backend/   -> expenses.ts, monthly-expenses.ts (server actions)
    frontend/  -> ExpenseModal.tsx, ExpenseTemplateManager.tsx, ExpenseTrackingRow.tsx, DepensesTrackingClient.tsx, AdhocExpenseModal.tsx
    shared/    -> expense types, expense constants
  incomes/
    backend/   -> incomes.ts, monthly-incomes.ts
    frontend/  -> IncomeModal.tsx, IncomeTemplateManager.tsx, IncomeTrackingRow.tsx, RevenusTrackingClient.tsx, AdhocIncomeModal.tsx
    shared/    -> income types, income constants
  ...
```
Move types from `lib/types.ts` into each feature's `shared/` directory. Keep `lib/` for infrastructure only (`db.ts`, `auth/`). Keep `components/` only for truly shared UI components (BottomNav, MonthNavigator, LayoutShell, Breadcrumb).

---

### H-2. `app/page.tsx` is not a thin routing layer -- contains orchestration logic

**File:** `app/page.tsx:30-66`
**Rule:** `af-clean-architecture` § Feature-based structure, § reference.md ("app/ est un thin routing layer")
**Problem:** The home page server component contains significant orchestration: calling `ensureDefaultSections()`, checking `hasOrphanedData()`, `hasUserData()`, calling three generation functions (`generateMonthlyExpenses`, `generateMonthlyIncomes`), three auto-mark functions (`autoMarkOverdue`, `autoMarkPaidForAutoDebit`, `autoMarkReceivedForAutoDeposit`), then fetching 9 data sources in parallel. This is 35+ lines of orchestration logic, not a thin routing layer.
**Impact:** The home page knows about monthly generation, auto-marking, orphaned data migration, new user detection, and data fetching for 4+ different domains. Any change to the monthly tracking lifecycle (e.g., adding a new auto-mark step) requires modifying the page, not a service.
**Fix:** Extract a `prepareHomePage(month: string)` orchestrator function in a dedicated server action or service file (e.g., `lib/actions/page-data.ts` or future `features/dashboard/backend/`). The page should call one function and receive all data in a single return value. Same applies to `app/depenses/page.tsx` and `app/revenus/page.tsx` which exhibit the same pattern.

---

### H-3. `lib/actions/expenses.ts` is a God File -- 519 lines, 12+ functions, 4+ responsibilities

**File:** `lib/actions/expenses.ts` (519 lines)
**Rule:** `af-clean-architecture` § Anti-patterns #1 (God Class)
**Problem:** This single file handles: (1) CRUD for expense templates, (2) savings contribution management (`addSavingsContribution`, `transferSavings`, `getOrCreateFreeSavings`), (3) section-level summary aggregation (`getMonthlySummaryBySection`), (4) card-based expense queries (`getExpensesByCard`), (5) monthly savings summary (`getMonthlySavingsSummary`), (6) monthly expense actuals by section (`getMonthlyExpenseActualsBySection`), and (7) adhoc expense creation (`createAdhocExpense`). These are at least 4 different responsibilities.
**Impact:** Any change to savings logic risks breaking expense CRUD. The file is hard to navigate. Functions like `getMonthlyExpenseActualsBySection` belong to the monthly tracking domain, not the expense template domain.
**Fix:** Split into focused modules:
- `expenses.ts` -- template CRUD only (getExpenses, createExpense, updateExpense, deleteExpense, getExpenseById, getExpensesByCard)
- `savings.ts` -- planned projects/savings (getPlannedExpenses, addSavingsContribution, getSavingsContributions, transferSavings, getOrCreateFreeSavings, getMonthlySavingsSummary, updateSavedAmount)
- Move `getMonthlySummaryBySection` and `getMonthlyExpenseActualsBySection` into monthly-expenses.ts (they query `monthly_expenses`, not `expenses`)
- Move `createAdhocExpense` into monthly-expenses.ts (it creates a monthly instance, not a template)

---

### H-4. `lib/actions/monthly-expenses.ts` is a God File -- 501 lines, Level 2 logic without separation

**File:** `lib/actions/monthly-expenses.ts` (501 lines)
**Rule:** `af-clean-architecture` § Decision Framework (Level 2 signals), § Anti-patterns #1 (God Class)
**Problem:** This file contains non-trivial business logic (monthly instance generation with frequency calculations, spread_monthly handling, debt payment generation, auto-mark overdue, auto-mark paid for auto-debit) alongside simple CRUD operations (markAsPaid, markAsUpcoming, deleteMonthlyExpense, updateMonthlyExpenseAmount, deferExpenseToMonth). The `generateMonthlyExpenses` function alone is 160+ lines with complex frequency-based date calculation. The file exceeds the Level 1->2 signal threshold (service > 30 lines) and arguably the Level 2->3 signal (service > 100 lines).
**Impact:** The generation logic is untestable without a real database. The `calcDueDateForMonth` helper function (80 lines) contains pure business logic that could be unit tested but is trapped inside a "use server" file. Changes to generation logic risk breaking CRUD operations.
**Fix:** Extract `calcDueDateForMonth` into a pure utility (e.g., `lib/utils.ts` or future `features/expenses/shared/`). Extract generation logic into a separate `monthly-generation.ts` service. Keep the CRUD mutations in `monthly-expenses.ts`.

---

### H-5. `use client` components directly import server actions -- blurred server/client boundary

**File:** `components/DepensesTrackingClient.tsx:5`, `components/RevenusTrackingClient.tsx:5-6`, `components/ProjetsEpargneClient.tsx:5-7`, `components/CartesClient.tsx:6`, and 12 more components
**Rule:** `af-clean-architecture` § Zones d'une feature et regles d'import ("frontend/ -> backend/ INTERDIT")
**Problem:** Client components (`'use client'`) directly import server actions from `lib/actions/`. For example, `DepensesTrackingClient.tsx` imports 5 server actions directly. While Next.js App Router allows this (client components can call server actions), it creates a tight coupling between the presentation layer and the data access layer. Every client component "knows" which server actions exist and imports them by name.
**Impact:** In the current Next.js Server Actions model, this is technically functional. However, it violates the feature-based separation principle: if these were organized as `features/expenses/frontend/` and `features/expenses/backend/`, the frontend would import from backend -- which is explicitly forbidden. The current flat structure masks this violation. Additionally, it makes the components impossible to test in isolation without mocking server action modules.
**Fix:** This is the lowest-priority HIGH finding. In the Next.js Server Actions paradigm, direct imports are the standard pattern and are serialized at the boundary. However, for consistency with feature-based architecture, consider: (1) passing server actions as props from the Server Component parent (already partially done -- data is passed as props), or (2) creating a `features/expenses/frontend/hooks/useExpenseActions.ts` that centralizes action imports for that feature.

---

## MEDIUM

### M-1. `lib/actions/demo-data.ts` -- 428 lines of procedural seed data

**File:** `lib/actions/demo-data.ts` (428 lines)
**Rule:** `af-clean-architecture` § Anti-patterns #1 (God Class)
**Problem:** `loadDemoData()` is a single 340-line function that creates data across 8+ tables in sequence. While it is seed data (not business logic), it lives alongside production server actions and inflates the `lib/actions/` directory.
**Fix:** Move to `scripts/` or a dedicated `lib/seed/` directory. It should not be a server action -- expose it via a thin server action wrapper that calls the seed function. Alternatively, accept as tech debt since it is alpha-stage tooling.

---

### M-2. `lib/types.ts` -- single file for all domain types (270 lines)

**File:** `lib/types.ts`
**Rule:** `af-clean-architecture` § reference-code-by-level.md (shared/ contains Zod schemas as single source of truth)
**Problem:** All 18 domain types (Section, Card, Expense, Income, Debt, MonthlyExpense, MonthlyIncome, IncomeAllocation, MonthlyAllocation, etc.) live in a single file. No Zod schemas exist for validation -- types are plain TypeScript interfaces with no runtime validation.
**Impact:** Types are scattered across unrelated domains. Adding a new entity type modifies a file that all domains depend on. There is no runtime validation at the server action boundary -- all inputs are trusted TypeScript types.
**Fix:** When migrating to feature-based structure, split types into feature-specific `shared/` directories. Consider adding Zod schemas for mutation inputs (createExpense, createIncome, etc.) as the single source of truth for both validation and types.

---

### M-3. `lib/utils.ts` mixes pure business logic with formatting utilities

**File:** `lib/utils.ts` (260 lines)
**Rule:** `af-clean-architecture` § reference.md ("utils/ = fonctions pures SANS logique metier")
**Problem:** `lib/utils.ts` contains both formatting utilities (`formatCAD`, `formatDate`, `formatShortDate`, `toMonthKey`, `currentMonth`) and business logic functions (`calcNextDueDate`, `calcMonthlyCost`, `calcMonthlyIncome`, `calcMonthlySuggested`, `countBiweeklyPayDatesInMonth`, `getNextBiweeklyPayDate`, `daysUntil`). The skill explicitly states that utils should contain pure functions WITHOUT business logic.
**Fix:** Move business calculation functions into domain-specific modules: `calcMonthlyCost`, `calcNextDueDate` -> expense calculation module; `calcMonthlyIncome`, `countBiweeklyPayDatesInMonth`, `getNextBiweeklyPayDate` -> income calculation module; `calcMonthlySuggested` -> savings calculation module. Keep formatting/date helpers in utils.

---

### M-4. No middleware.ts for authentication

**File:** (missing)
**Rule:** `af-clean-architecture` § Les 4 couches ("Presentation: Routes API, Validation Zod, Error->HTTP mapping")
**Problem:** There is no `middleware.ts` at the project root. Authentication is handled per-function via `requireAuth()` calls at the top of every server action (repeated 40+ times). There is no centralized route protection. Any new server action that forgets to call `requireAuth()` would be unauthenticated.
**Fix:** Add a `middleware.ts` that protects all routes except `/landing`, `/auth/*`, `/api/cron/*`. This provides defense-in-depth alongside the per-action `requireAuth()` calls. The `requireAuth()` pattern in server actions should remain as a second layer.

---

### M-5. `lib/constants.ts` mixes UI concerns (STATUS_STYLES, SOURCE_META) with business constants

**File:** `lib/constants.ts`
**Rule:** `af-clean-architecture` § Zones d'une feature ("backend/, frontend/, shared/ correctement separes")
**Problem:** `lib/constants.ts` contains both business constants (`WEEKLY_MONTHLY_MULTIPLIER`, `BIWEEKLY_MONTHLY_MULTIPLIER`) shared across server/client, and pure UI constants (`STATUS_STYLES` with CSS color values, `SOURCE_META` with emoji icons and hex colors). These have different reasons to change.
**Fix:** Split into: (1) business constants (multipliers, group order) -- shared across server and client, and (2) UI constants (styles, colors, icons) -- client-only. In a feature-based structure, UI constants belong in `features/expenses/frontend/constants.ts`.

---

### M-6. Duplicated DEFAULT_SECTIONS constant in two files

**File:** `lib/actions/claim.ts:58-65`, `lib/actions/demo-data.ts:398-405`
**Rule:** `af-clean-architecture` § reference-code-by-level.md ("Concepts partages: un element commence dans sa feature, migre vers shared/ quand une deuxieme feature en a besoin")
**Problem:** The `DEFAULT_SECTIONS` array is defined identically in both `claim.ts` and `demo-data.ts`. If default sections change, both files must be updated.
**Fix:** Extract `DEFAULT_SECTIONS` into a shared constant (e.g., `lib/constants.ts` or future `features/sections/shared/defaults.ts`) and import it in both files.

---

## LOW

### L-1. `app/` pages use `export const dynamic = 'force-dynamic'` globally

**File:** `app/page.tsx:1`, `app/depenses/page.tsx:1`, `app/revenus/page.tsx:1`
**Rule:** `af-clean-architecture` § Les 4 couches (Presentation layer)
**Problem:** All data-fetching pages use `force-dynamic`. This prevents any caching or static optimization by Next.js. While understandable for a personal finance app with per-user data, it is worth noting as an architectural decision that should be documented.
**Fix:** Add an ADR documenting this choice and the rationale (per-user server actions make static generation impossible). No code change needed.

---

### L-2. Generation functions called during page render (side effects in GET)

**File:** `app/page.tsx:44-52`, `app/depenses/page.tsx:24-30`, `app/revenus/page.tsx:24-30`
**Rule:** `af-clean-architecture` § Les 4 couches ("Presentation: Routes API = valider + deleguer + repondre")
**Problem:** The `generate*` and `autoMark*` functions perform database writes (INSERT, UPDATE) during page render (GET request). While they are idempotent, having write operations triggered by reading a page is an unusual pattern. It means navigating to `/depenses` may modify the database.
**Fix:** This is an intentional architectural choice (lazy generation on first visit to a month). Document it as an ADR. Consider moving generation to a background job or explicit user action in the future if multi-user scenarios arise.

---

### L-3. `app/providers.tsx` -- thin wrapper could live in `lib/`

**File:** `app/providers.tsx`
**Rule:** `af-clean-architecture` § reference.md ("app/ = thin routing layer")
**Problem:** Minor organizational note -- `providers.tsx` is a thin client wrapper for auth context. It is correctly placed for Next.js App Router conventions but worth noting that it adds logic to `app/`.
**Fix:** No action needed. This follows Next.js conventions.

---

## Systemic Issues

### S-1. The codebase is organized by technical layer, not by feature (affects all files)

Every finding above traces back to the same root cause: the project uses a layer-based structure (`lib/actions/`, `components/`, `lib/types.ts`) instead of a feature-based structure (`features/expenses/`, `features/incomes/`, etc.). This is not a refactoring emergency at the current scale (~90 files), but it will become painful as the app grows toward family/friends/SaaS stages described in the roadmap.

**Recommendation:** Plan a progressive migration before the next feature wave. The migration can be done feature-by-feature without breaking changes:
1. Start with the largest domain (expenses: 519 + 501 + 874 + 924 + 189 = ~3000 lines)
2. Create `features/expenses/backend/`, move action files
3. Create `features/expenses/frontend/`, move component files
4. Create `features/expenses/shared/`, extract types
5. Update imports (path aliases make this straightforward)
6. Repeat for incomes, allocations, debts, savings

### S-2. Architecture level is uniformly Level 1 despite Level 2 complexity

The monthly generation system (`generateMonthlyExpenses`, `generateMonthlyIncomes`, `generateMonthlyAllocations`) with frequency calculations, spread logic, biweekly pay date counting, and auto-marking contains Level 2 complexity (non-trivial business rules, workflow logic). However, it is structured as Level 1 (flat server actions with SQL queries). The business logic embedded in `calcDueDateForMonth` (80 lines of frequency handling) is pure logic that would benefit from Level 2 separation (service + helpers) for testability.

---

## Verdict

Given the project context (alpha stage, single user, personal finance PWA), the current architecture is **functional and pragmatic**. The codebase works, the patterns are consistent, and the complexity is managed. However, the layer-based structure and God File issues (H-1, H-3, H-4) are real architectural debts that will compound as the app grows.

**5 HIGH findings** -> **CHANGES REQUESTED**

The HIGH findings represent genuine violations of `af-clean-architecture` principles. H-1 (layer-based structure) is the systemic root cause. H-3 and H-4 (God Files) are the most actionable short-term fixes. H-2 (fat pages) is straightforward to extract. H-5 (client importing server actions) is the least urgent and is partially a Next.js convention clash.

**Recommended priority order:**
1. H-3 + H-4: Split God Files (immediate, low risk)
2. M-3 + M-6: Extract business logic from utils, deduplicate constants (quick wins)
3. H-2: Extract page orchestration into service functions
4. H-1: Progressive migration to feature-based structure (plan before next feature wave)
5. H-5: Address when migrating to feature-based structure

