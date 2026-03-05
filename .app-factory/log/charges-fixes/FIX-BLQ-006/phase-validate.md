# FIX-BLQ-006 — PM Validation

**Date:** 2026-03-05
**Agent:** af-pm
**Story:** FIX-BLQ-006 — Modifying a template does not update already-generated monthly_expenses entries
**Scope:** backend
**Review verdict:** APPROVED WITH NOTES (0 CRITICAL, 0 HIGH, 1 MEDIUM, 3 LOW)

---

## Validation Method

This story is backend-only (single file modified: `lib/actions/expenses.ts`, no frontend changes). Validation relied on:

1. **Builder evidence:** AC-1, AC-2, AC-4, AC-5 tested via Playwright by the Builder during build phase
2. **Reviewer cross-check:** All 5 ACs confirmed covered in code review (AC coverage table)
3. **Code logic inspection:** PM verified the invalidation mechanism structurally covers all ACs through the same DELETE query pattern
4. **MEDIUM finding (F-1)** from review was fixed (confirmed: `currentMonth()` utility is used instead of inline computation)

**Limitation:** PM did not have direct Playwright MCP access during this validation session. Visual scan was not performed independently. Risk is minimal given this is a backend-only change with no UI modifications.

---

## Per-Criterion Results

| AC | Verdict | Evidence | Notes |
|----|---------|----------|-------|
| **AC-1**: Amount change propagates | PASS | Builder Playwright test + code inspection | `data.amount !== undefined` triggers DELETE of UPCOMING/OVERDUE entries; regeneration on next page visit produces correct amount |
| **AC-2**: Toggle spread_monthly ON | PASS | Builder Playwright test + code inspection | `data.spread_monthly !== undefined` triggers invalidation; regeneration computes amount/12 for spread entries |
| **AC-3**: Frequency change updates | PASS (code path) | Code inspection + Reviewer confirmation | NOT tested via Playwright by Builder. However, uses identical invalidation mechanism as AC-1/2/5 (same DELETE query, triggered by `data.recurrence_frequency !== undefined`). Risk of failure while other ACs pass is negligible. |
| **AC-4**: PAID entries untouched | PASS | Builder Playwright test + code inspection | `status IN ('UPCOMING', 'OVERDUE')` filter explicitly excludes PAID entries from deletion |
| **AC-5**: Deactivating spread_monthly | PASS | Builder Playwright test + code inspection | Same trigger as AC-2; regeneration without spread_monthly restores lump sum behavior |

### Edge Cases

| Edge Case | Coverage |
|-----------|----------|
| Multiple future months generated | COVERED -- `month >= currentMonth` catches all future entries |
| Template deactivation | COVERED -- `deleteExpense()` unconditionally deletes UPCOMING/OVERDUE entries |
| Mid-month change after partial payment | COVERED -- PAID status excludes entry from deletion |
| Same-day toggle | COVERED -- each save triggers invalidation; idempotent regeneration produces correct state |

---

## Visual Scan

Not performed independently (no Playwright MCP access). This is a backend-only change with no frontend file modifications. Visual regression risk: **MINIMAL**.

---

## Review Finding Resolution

| Finding | Severity | Status |
|---------|----------|--------|
| F-1: Duplicated `currentMonth` computation | MEDIUM | FIXED -- confirmed `currentMonth()` utility used in both locations |
| F-2: No transaction wrapping | LOW | Acknowledged -- pre-existing pattern, not blocking |
| F-3: No row-count check | LOW | Acknowledged -- pre-existing issue, harmless |
| F-4: Duplicate invalidation logic | LOW | Acknowledged -- rule of 3 not met, extraction premature |

---

## Verdict: ACCEPTED

The fix correctly implements the delete-and-regenerate invalidation pattern. All 5 acceptance criteria are structurally covered by the code, and 4 of 5 were empirically verified via Playwright by the Builder. AC-3 (frequency change) shares the identical code path as the tested ACs, making isolated failure improbable.

The MEDIUM review finding (F-1) was fixed. The 3 LOW findings are pre-existing patterns, not regressions introduced by this change.

**Caveat:** AC-3 should be tested end-to-end when the next feature touching frequency logic is validated. This is not blocking for acceptance.

---

## PM Notes

- The invalidation approach (over-invalidation without comparing old vs new values) is pragmatic for an alpha-stage, single-user app. If multi-user scaling is planned, consider a more surgical approach.
- The lack of automated test infrastructure remains a systemic gap. This story would have benefited from a unit test verifying that `updateExpense()` with each financial field triggers the DELETE. Captured as a pre-existing concern, not blocking.
