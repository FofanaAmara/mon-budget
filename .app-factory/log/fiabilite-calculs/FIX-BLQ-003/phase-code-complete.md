# Code Complete Report: FIX-BLQ-003

Date: 2026-03-05
Level: 1
Scope: [frontend]

## Summary

Fixed the dashboard balance hero to use `expectedTotal - total` instead of `actualTotal - paid_total`. The old formula excluded upcoming expenses and unreceived income, making the balance appear inflated or deflated depending on timing. Single-line fix in `components/AccueilClient.tsx`.

## Phases Completed

- Classification: Level 1, scope [frontend]
- Design: Skipped (Level 1)
- Design Review: Skipped (Level 1)
- Build: 1 file modified, 0 tests (no test suite), build SUCCESS, visual validation via Playwright
- Code Review: APPROVED — 0 CRITICAL, 0 HIGH, 0 MEDIUM, 1 LOW (noisy diff from reformatting)
- PM Validate: ACCEPTED — 2/2 AC pass (attempt 1)

## Tests

Baseline: build OK, 0 test suite
Final: build OK
Delta: No test suite available

## Discoveries

None

## Commits

- `dfbba4a` [FIX-BLQ-003] use expectedTotal instead of actualTotal for dashboard balance
