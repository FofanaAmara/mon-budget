# FIX-MIN-006 — Code Review

**Date:** 2026-03-05
**Reviewer:** af-reviewer
**Commit:** d9ecb58
**Scope:** backend (server action)
**Skills loaded:** af-conventions, af-clean-code, af-clean-architecture, af-documentation

---

## Step 0 — Git Reality Check

| Check | Result |
|-------|--------|
| Files declared modified | `lib/actions/onboarding.ts` |
| Files changed in git (HEAD~1) | `lib/actions/onboarding.ts` |
| Undocumented changes | None |
| Uncommitted changes | Untracked log files only (expected) |

**Result:** PASS — no discrepancies.

---

## Findings

### [LOW] — F1: Formatting-only changes mixed with logic changes

- **File:** `lib/actions/onboarding.ts` (throughout)
- **Skill:** `af-conventions` § Commit Conventions — "one commit = one atomic logical change"
- **Problem:** The commit mixes the actual bug fix (frequency logic, lines 39-60) with unrelated formatting changes (single quotes to double quotes, alignment reformatting) across the entire file. This makes the diff harder to review — the real change is ~15 lines buried in ~50 lines of quote-style noise.
- **Impact:** Review friction. The actual logic change is small and correct, but the diff is inflated by formatter output.
- **Fix:** In future commits, separate formatting changes from logic changes, or run the formatter in a prior commit. No action needed on this commit.

---

## Verification: Frequency Mapping Logic

### Flow analysis

1. **Form** (`Onboarding.tsx`): User enters amount + frequency → `toMonthly()` converts to monthly → passes `{ monthlyRevenue: <monthly>, frequency: <original> }` to `completeOnboarding`
2. **Action** (`onboarding.ts`): Receives monthly amount + original frequency → reverse-calculates per-pay amount for biweekly → stores with correct `IncomeFrequency`

### Case-by-case verification

| User frequency | monthlyRevenue (from form) | incomeFrequency stored | incomeAmount stored | Correct? |
|----------------|---------------------------|----------------------|---------------------|----------|
| monthly ($3000) | 3000 | MONTHLY | 3000 | YES |
| biweekly ($1385) | 3001 (1385 * 26/12) | BIWEEKLY | 1385 (3001 / 26*12) | YES |
| weekly ($500) | 2167 (500 * 52/12) | MONTHLY | 2167 | YES (see note) |

**Note on weekly:** `IncomeFrequency` type does not include "WEEKLY" (only MONTHLY, BIWEEKLY, YEARLY, VARIABLE). Storing weekly income as monthly equivalent is the correct fallback given the type system constraint. The comment at line 43 documents this decision.

### Math verification

`BIWEEKLY_MONTHLY_MULTIPLIER = 26 / 12 = 2.1666...`

For biweekly $1385/pay:
- Form sends: `Math.round(1385 * 2.1666) = 3001` as monthlyRevenue
- Action reverse-calculates: `Math.round(3001 / 2.1666) = 1385` as incomeAmount
- Stored as: amount=1385, frequency=BIWEEKLY

Round-trip is correct. `Math.round` prevents floating-point drift.

### Constants reuse

Uses `BIWEEKLY_MONTHLY_MULTIPLIER` from `@/lib/constants` (extracted in FIX-MIN-004). Single source of truth — no magic numbers.

### Type safety

`IncomeFrequency` type imported and used correctly. The `frequency` field in `createIncome` accepts this type. No type mismatch.

---

## Checklist — af-clean-code

| Check | Status |
|-------|--------|
| Naming reveals intention | PASS — `incomeFrequency`, `incomeAmount` are clear |
| Functions: single responsibility | PASS — frequency logic is a contained block within `completeOnboarding` |
| No magic numbers | PASS — uses named constant `BIWEEKLY_MONTHLY_MULTIPLIER` |
| No hidden side effects | PASS |
| Comments explain WHY | PASS — lines 40-43 explain the reverse-calculation rationale |
| No dead code | PASS |
| Guard clauses / early return | N/A |
| Error handling | PASS — existing try/catch preserved |

## Checklist — af-clean-architecture

| Check | Status |
|-------|--------|
| Dependency direction correct | PASS — action imports from lib/constants, lib/types |
| No cross-feature leakage | PASS |
| Server action = validate + delegate + respond | PASS |

## Checklist — af-documentation

| Check | Status |
|-------|--------|
| Implementation log written | PASS — phase-build.md exists |
| Inline comments adequate | PASS — rationale documented |

---

## Verdict

**APPROVED**

- CRITICAL: 0
- HIGH: 0
- MEDIUM: 0
- LOW: 1 (formatting noise in commit — informational only)

The fix is correct, minimal, and well-documented. The frequency mapping logic handles all three cases (monthly, biweekly, weekly) appropriately given the type system constraints. The shared constant from FIX-MIN-004 is properly reused. The reverse-calculation math is verified round-trip safe.
