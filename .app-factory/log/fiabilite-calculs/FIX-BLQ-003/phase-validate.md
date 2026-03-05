# FIX-BLQ-003 — PM Validation

**Date:** 2026-03-05
**Validator:** af-pm
**Story:** Dashboard balance uses actualTotal instead of expectedTotal
**Environment:** localhost:3000 (dev server)

## Evidence Reviewed

1. **Code inspection** — `components/AccueilClient.tsx` line 69
2. **Build log** — `.app-factory/log/fiabilite-calculs/FIX-BLQ-003/phase-build.md`
3. **Review log** — `.app-factory/log/fiabilite-calculs/FIX-BLQ-003/phase-review.md`
4. **Data flow** — `app/page.tsx` passes `incomeSummary.expectedTotal` correctly

## AC1 — Balance uses expectedTotal and total (not actualTotal and paid_total)

**Criterion:** Given $6500 income / $4000 expected expenses ($2500 paid, $1500 upcoming), balance = $2500 (not $4000).

**Verification:**
- Formula in code: `incomeSummary.expectedTotal - summary.total` (line 69)
- With real data: 6,500 - 4,874 = 1,626 (positive)
- Old formula would have been: `incomeSummary.actualTotal - summary.paid_total` = 0 - 2,400 = -2,400 (wrong, negative)
- Builder's visual validation confirms dashboard displays **1 627$** with "Disponible ce mois-ci" label
- The balance correctly includes ALL expected expenses, not just paid ones

**Verdict: CONFORME**

## AC2 — When all expenses are paid, balance is correct either way

**Criterion:** When actualTotal = expectedTotal (all paid), both formulas converge.

**Verification:**
- This is a logical property of the formula. When all expenses are paid, `summary.total == summary.paid_total` and `incomeSummary.expectedTotal == incomeSummary.actualTotal`. Both formulas produce the same result.
- The fix does not break this property — it only corrects the case where they differ (which is the common case during the month).

**Verdict: CONFORME**

## Visual Scan

Based on Builder's visual validation during build phase:
- Dashboard hero shows positive amount (1 627$) in teal color
- "Disponible ce mois-ci" label displays correctly
- "Ton mois est sous controle" status badge displays correctly
- No visual defects reported

**Note:** PM could not perform independent Playwright visual validation — Playwright MCP tools were not available in this session. Verdict relies on Builder's documented visual evidence from the build phase + code inspection.

## Regressions Check

- The change is isolated to line 69 of `AccueilClient.tsx` — one variable reference change
- No other tabs (Timeline, Sante financiere) use `availableAmount` — they receive their own props
- No backend changes, no migration, no API changes
- Reviewer confirmed no undocumented changes in the commit

**Regression risk: MINIMAL**

## Overall Verdict

**ACCEPTED**

Both acceptance criteria are satisfied. The formula now correctly uses `expectedTotal - total` instead of `actualTotal - paid_total`. The fix is minimal, well-scoped, and does not introduce regressions.

**Caveat:** Independent visual validation via Playwright MCP was not possible in this session. The verdict relies on Builder's documented visual evidence, code inspection, and Reviewer's approval. If the orchestrator requires independent visual confirmation, this should be performed before promoting.
