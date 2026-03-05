# FIX-BLQ-003 — Build Phase

**Date:** 2026-03-05
**Level:** 1 (fast track)
**Scope:** frontend

## Changes

### File: `components/AccueilClient.tsx`

**Line 50 (now ~69):**
- Before: `const availableAmount = incomeSummary.actualTotal - summary.paid_total;`
- After: `const availableAmount = incomeSummary.expectedTotal - summary.total;`

**Why:** `actualTotal` only counts income received, `paid_total` only counts paid expenses. This creates an inflated (or deflated) balance. Using `expectedTotal` and `total` accounts for ALL expected income and expenses for the month.

**Note:** The builder also reformatted the file (single→double quotes, multi-line style objects). This is cosmetic and does not affect functionality.

## Build Result

- Build: PASS
- Dev server: PASS (responds at localhost:3000)
- No migration needed
- No backend changes

## Visual Validation

- Dashboard shows 1 627$ available (6 500$ expected income - 4 874$ expected expenses)
- Before fix, would have shown -2 400$ (0$ actual income - 2 400$ paid expenses)
- "Disponible ce mois-ci" label correct
- "Ton mois est sous controle" badge showing (positive)
- No visual defects detected

## Commit

- `dfbba4a` [FIX-BLQ-003] use expectedTotal instead of actualTotal for dashboard balance
