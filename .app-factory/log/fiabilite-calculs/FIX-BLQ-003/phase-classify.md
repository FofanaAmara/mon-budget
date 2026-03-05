# Classification: FIX-BLQ-003

Date: 2026-03-05
Level: 1
Scope: [frontend]
Fast track: YES

## Rationale
Single-line variable reference fix — replacing `incomeSummary.actualTotal` with `incomeSummary.expectedTotal` (and potentially `summary.paid_total` with `summary.expected_total`) on line 50 of `AccueilClient.tsx`. No business logic change, no migration, no API change.
