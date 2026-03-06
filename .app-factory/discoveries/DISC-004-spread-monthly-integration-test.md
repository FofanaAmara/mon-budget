# DISC-004 — spread_monthly logic needs integration test

**Type:** IMPROVEMENT
**Severity:** P2
**Discovered by:** af-builder
**During:** AUDIT-003 build
**Status:** Open

## Description

Story AUDIT-003 AC7 requires testing spread_monthly logic (QUARTERLY/3 and YEARLY/12 division). However, this logic lives inside `generateRecurringInstances` which does SQL I/O — it cannot be tested as a pure unit test.

The spread_monthly calculation itself is trivial (`Math.round((amount / periodCount) * 100) / 100`), but the AC explicitly asks for test coverage.

## Impact

AC7 of AUDIT-003 is not covered by unit tests. The logic is correct (verified by code inspection) but not automatically validated.

## Recommendation

Create an integration test with mocked DB (or extract the spread calculation into a pure helper) in a future story. This could be addressed by AUDIT-005 (batch INSERTs) or a dedicated test story.
