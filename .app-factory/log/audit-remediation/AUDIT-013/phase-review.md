# Review — AUDIT-013: Split God Files

**Date:** 2026-03-05
**Reviewer:** af-reviewer
**Commit:** c340e03 `[AUDIT-013] split God files: extract savings.ts + reorganize monthly-expenses.ts`
**Level:** 1
**Scope:** backend, frontend

---

## Step 0 — Git Reality Check

| Check | Result |
|-------|--------|
| Files in commit match claimed changes | PASS — 1 created, 11 modified, matches claim |
| Uncommitted changes | PASS — only untracked .app-factory/log/ files |
| Commit message format | PASS — `[AUDIT-013]` prefix, descriptive |

No CRITICAL git discrepancies.

---

## Findings

### CRITICAL

#### C1 — Accent dropped in getOrCreateFreeSavings: data corruption risk

**File:** `lib/actions/savings.ts:153,161,168`
**Skill:** `af-clean-code` SS Nommage / `af-conventions` SS Data Integrity
**Problem:** The original `expenses.ts` used `'Epargne libre'` (with accent E-acute: `'\u00c9pargne libre'`). The new `savings.ts` uses `'Epargne libre'` (plain ASCII, no accent). This means:
1. `getOrCreateFreeSavings()` will NOT find existing records created with the accented name
2. It will then INSERT a duplicate "Epargne libre" (unaccented) row
3. Users will have two "free savings" pots, causing data inconsistency

**Impact:** Silent data duplication for every user. Savings contributions could be split across two pots. Financial data corruption.

**Fix:** Restore the original accented string `'\u00c9pargne libre'` in lines 153, 161, and 168 of `savings.ts`. Also in the comment on line 153.

---

### MEDIUM

#### M1 — Misleading section comment in monthly-expenses.ts

**File:** `lib/actions/monthly-expenses.ts:500`
**Skill:** `af-clean-code` SS Commentaires
**Problem:** The comment `// --- Aggregation functions (query monthly_expenses) ---` is misleading. `getMonthlySummaryBySection()` actually queries the `expenses` table (templates) joined with `sections`, NOT `monthly_expenses`. Only `getMonthlyExpenseActualsBySection()` and `createAdhocExpense()` actually touch `monthly_expenses`.

**Impact:** Future developers may misunderstand the function's scope and make incorrect assumptions about what data it accesses.

**Fix:** Change comment to `// --- Section & expense aggregation functions ---` or split with separate comments per function clarifying which table each queries.

#### M2 — getMonthlySummaryBySection placed in wrong file

**File:** `lib/actions/monthly-expenses.ts:502`
**Skill:** `af-clean-architecture` SS SRP / Feature-based structure
**Problem:** `getMonthlySummaryBySection()` queries `sections` + `expenses` (templates), not `monthly_expenses`. It computes planned monthly budget from template recurrence frequencies. Logically, it belongs in `expenses.ts` (template CRUD and queries) or a dedicated file, not `monthly-expenses.ts` (transaction tracking).

**Impact:** Weakens the SRP separation that this refactoring was designed to achieve. A function about expense templates lives alongside transaction functions.

**Fix:** Move `getMonthlySummaryBySection()` back to `expenses.ts` or into a new `sections.ts`/`expense-queries.ts`. This is not blocking but should be addressed.

---

### LOW

#### L1 — Quote style formatting changes mixed into refactoring commit

**Files:** `app/page.tsx`, `app/parametres/allocation/page.tsx`, `app/projets/page.tsx`, `app/revenus/page.tsx`
**Skill:** `af-conventions` SS Commits
**Problem:** The commit includes extensive quote style changes (single to double quotes) and formatting reformats in page files that are unrelated to the "split god files" refactoring. This inflates the diff (528 insertions, 433 deletions) when the actual logic changes are much smaller.

**Impact:** Makes the commit harder to review and understand. The actual meaningful changes (import path updates) are buried in formatting noise.

**Fix:** In future refactorings, consider separating formatting changes into a dedicated `chore(format)` commit.

#### L2 — Unused import cleanup could be more thorough

**File:** `components/accueil/TabTableauDeBord.tsx`
**Skill:** `af-clean-code` SS Dead Code
**Problem:** The `ChevronRight` component was removed (good — it was unused), but the Builder should verify that no other dead code remains in modified files.

**Impact:** Minimal. The cleanup was done correctly; this is a reminder for completeness.

**Fix:** N/A — this was handled correctly.

---

## Verification Summary

| Check | Result |
|-------|--------|
| `"use server"` in savings.ts | PASS — line 1 |
| All moved functions present in savings.ts | PASS — 7 functions: getPlannedExpenses, updateSavedAmount, addSavingsContribution, getSavingsContributions, transferSavings, getOrCreateFreeSavings, getMonthlySavingsSummary |
| All moved functions removed from expenses.ts | PASS — expenses.ts is now CRUD-only (get, create, update, delete, getByCard) |
| Consumer imports updated (savings.ts) | PASS — app/page.tsx, app/parametres/allocation/page.tsx, app/projets/page.tsx, AddSavingsModal, SavingsHistoryModal, TransferSavingsModal |
| Consumer imports updated (monthly-expenses.ts) | PASS — app/page.tsx (getMonthlySummaryBySection), app/revenus/page.tsx (getMonthlyExpenseActualsBySection), AdhocExpenseModal (createAdhocExpense) |
| transferSavings signature (positional to object) | PASS — savings.ts uses object params, TransferSavingsModal.tsx updated to object syntax |
| createAdhocExpense signature (positional to object) | PASS — monthly-expenses.ts uses object params, AdhocExpenseModal.tsx updated to object syntax |
| No business logic accidentally changed | FAIL — accent dropped in getOrCreateFreeSavings (C1) |
| No remaining imports of moved functions from expenses.ts | PASS — only CRUD functions (deleteExpense, createExpense, updateExpense, getExpenses, getExpenseById, getExpensesByCard) still imported from expenses.ts |
| expenses.ts responsibilities make sense | PASS — clean CRUD-only file for expense templates |
| savings.ts responsibilities make sense | PASS — savings/planned expense operations |
| monthly-expenses.ts additions make sense | PARTIAL — getMonthlyExpenseActualsBySection and createAdhocExpense fit well, but getMonthlySummaryBySection does not (M2) |
| Tests pass | Reported as PASS (148 tests) |
| Build OK | Reported as PASS |

---

## Verdict

**CHANGES REQUESTED**

1 CRITICAL finding must be fixed before merge:
- **C1**: Accent dropped in `getOrCreateFreeSavings` — will cause data duplication in production

2 MEDIUM findings to address:
- **M1**: Fix misleading comment
- **M2**: Consider moving `getMonthlySummaryBySection` to correct file (can be deferred if documented)

2 LOW findings noted for awareness.
