# FIX-BLQ-002 — Review-Design

**Reviewer:** af-reviewer (review-design mode)
**Date:** 2026-03-05
**Verdict:** CHANGES REQUESTED

## Migration Safety: SAFE

`ALTER TABLE expenses ADD COLUMN spread_monthly BOOLEAN NOT NULL DEFAULT false` — ADD COLUMN with DEFAULT, no table lock.

## Findings

### [HIGH] F-001 — `getMonthlySummaryBySection()` not addressed in design

**File:** `lib/actions/expenses.ts:226-232`
**Skill:** `af-clean-code` § DRY / Separation des Concerns
**Problem:** Hardcoded SQL CASE uses `QUARTERLY: amount / 3.0` and `YEARLY: amount / 12.0`. This second calculation path is not updated by the design. After the fix, monthly_expenses will show full amounts in due months, but this SQL will still divide — creating inconsistent totals between views.
**Impact:** Settings "charges par section" totals will not match monthly expenses view.
**Fix:** Add `getMonthlySummaryBySection()` to design scope. Define how it handles `spread_monthly`.

### [MEDIUM] F-002 — Control flow ambiguity for spread_monthly=true in generation loop

**File:** Design section 3.2 vs `lib/actions/monthly-expenses.ts:117-124`
**Skill:** `af-clean-code` § Fonctions (control flow clarity)
**Problem:** When spread_monthly=true, calcDueDateForMonth returns null for non-due months. The existing skip guard (lines 117-124) would skip the expense before spread_monthly logic runs.
**Impact:** spread_monthly expenses could be incorrectly skipped.
**Fix:** Clarify the if/else chain in design pseudocode. Show that spread_monthly=true bypasses both calcDueDateForMonth and the skip guard.

### [MEDIUM] F-003 — Rounding error in spread amount not acknowledged

**File:** Design section 3.2
**Skill:** `af-clean-code` § Fonctions (correctness)
**Problem:** $100 QUARTERLY / 3 = $33.33/month = $99.99 total. 1-cent discrepancy per period.
**Impact:** Minor financial discrepancy visible to attentive users.
**Fix:** Acknowledge in risks section OR use "last month absorbs delta" approach.

### [LOW] F-004 — Story references wrong file paths (src/ prefix)

**File:** Story FIX-BLQ-002.md line 29
**Skill:** `af-documentation` § Documentation vivante
**Problem:** Story says `src/app/actions/` and `src/components/` but real paths have no `src/` prefix.
**Fix:** PM to update story technical notes. Not blocking.

## AC Coverage: 3/3 PASS (with F-002 caveat)

## Architecture: Aligned (server actions pattern, migration convention, type colocation)

## Security: No concerns (boolean field, server-side only, behind requireAuth)
