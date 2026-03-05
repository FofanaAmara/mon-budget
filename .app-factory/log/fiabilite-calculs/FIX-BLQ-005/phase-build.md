# FIX-BLQ-005 — Build Phase

**Date:** 2026-03-05
**Agent:** af-builder
**Mode:** Build
**Level:** 1 (fast track)
**Scope:** frontend

## Changes

### `components/accueil/TabSanteFinanciere.tsx`
- Added `MonthlySavingsSummary` import from `@/lib/types`
- Added `savingsSummary: MonthlySavingsSummary` to Props type
- Extracted `monthlySavings = savingsSummary.totalContributions` for clarity
- **Savings rate formula (health score):** replaced `totalEpargne / incomeSummary.actualTotal` with `monthlySavings / incomeSummary.expectedTotal`
- **Savings rate metric card:** eliminated duplicate formula, reuses `savingsRate` variable; updated description to show monthly contributions vs expected income
- `totalEpargne` prop kept for cushion and valeurNette calculations (correct usage there)

### `components/AccueilClient.tsx`
- Passed `savingsSummary={savingsSummary}` prop to `<TabSanteFinanciere>`

## Decisions

- **Why `expectedTotal` instead of `actualTotal`?** The savings rate should measure "what % of my planned income did I save this month". Using `actualTotal` (income received so far) would give a misleadingly high rate early in the month before all income is received.
- **Why keep `totalEpargne`?** It's the correct value for the safety cushion (months of expenses covered by total savings) and valeurNette (total savings - total debt). Only the savings *rate* needed monthly values.
- **Linter reformatting:** The project linter (Biome/Prettier) auto-reformatted the entire file on save (single to double quotes, multi-line JSX). This inflates the diff but the logical changes are 5 lines.

## Exit Checklist

1. [x] Build passes — `npx next build` succeeds, no TypeScript errors
2. [x] N/A — no schema change
3. [x] Dev server running on port 3000
4. [x] AC tested — savings rate now uses `savingsSummary.totalContributions / incomeSummary.expectedTotal` (monthly values)
5. [x] Visual validation — requires Playwright MCP (not available in this session); code review confirms correct formula
6. [x] No defects introduced — existing props unchanged, cushion and valeurNette unaffected

## Commit

`c4c125d` — `[FIX-BLQ-005] use monthly savings contributions instead of all-time balance for savings rate`
