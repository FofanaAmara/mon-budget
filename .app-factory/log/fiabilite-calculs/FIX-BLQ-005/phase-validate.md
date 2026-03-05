# FIX-BLQ-005 — Validation Phase

**Date:** 2026-03-05
**Agent:** af-pm
**Mode:** Validate (story level)
**Environment:** Code analysis + data source verification (Playwright MCP not available in this session)

## Story Re-read

**Title:** Savings rate formula uses all-time savings / income instead of monthly rate
**Severity:** BLOQUANT
**Fix:** Replace `totalEpargne / incomeSummary.actualTotal` with `savingsSummary.totalContributions / incomeSummary.expectedTotal`

## Acceptance Criteria Verification

### AC1: Monthly savings rate formula

**Given** a user has $6500 monthly income and contributes $500 to savings this month
**When** the savings rate is calculated
**Then** it shows 7.7% ($500 / $6500), not a cumulative historical ratio

**Verdict: CONFORME**

Evidence:
- `TabSanteFinanciere.tsx:442-445`: `monthlySavings = savingsSummary.totalContributions` then `savingsRate = Math.min((monthlySavings / incomeSummary.expectedTotal) * 100, 100)`
- Data source (`lib/actions/expenses.ts:421-466`): `getMonthlySavingsSummary(month)` queries `savings_contributions` filtered by `created_at >= monthStart AND created_at < monthEnd + 1 day`. This is genuinely monthly, not cumulative.
- With $500 contributions and $6500 expected income: (500/6500)*100 = 7.69% -> `Math.round()` in the display = 8% (or 7.7% before rounding). Formula is correct.
- Description shows `"500,00 $ / 6 500,00 $"` (line 597: `formatCAD(monthlySavings) / formatCAD(incomeSummary.expectedTotal)`)

### AC2: 0% with no contributions

**Given** a user has no savings contributions this month
**When** the savings rate is calculated
**Then** it shows 0%, regardless of historical savings balance

**Verdict: CONFORME**

Evidence:
- If `savingsSummary.totalContributions = 0`, then `monthlySavings = 0`, then `savingsRate = (0 / expectedTotal) * 100 = 0`
- Guard clause at line 444: `incomeSummary.expectedTotal > 0 ? ... : 0` handles division by zero
- The old `totalEpargne` (cumulative savings balance) is NOT used in the savings rate calculation anymore. It is only used for cushion (months of expenses covered) and valeurNette (net worth) -- both correct usages.
- Current test data: 0 contributions this month, $6500 expected income -> rate = 0%, description = "0,00 $ / 6 500,00 $"

## Beyond Criteria Check

### Health score integration
- Line 449: `healthScore = coverageActual * 0.6 + savingsRate * 0.2 + overdueBonus` -- savings rate feeds into the health score with correct 20% weight. No regression.

### Display coherence
- MetricCard (line 593): `value={Math.round(savingsRatePct)}%` -- correct display
- Progress bar (line 601): `barPct={savingsRatePct * 5}` -- 20% target = full bar (20*5=100). Correct scaling.
- Badge (line 546-549): only shows when `savingsRate >= 10` -- correct, won't show for 0%.

### Regression check
- `totalEpargne` prop still present and used for cushion metric (line 559-562 area) and valeurNette -- NOT affected by this change
- `coverageActual` metric unchanged
- `coveragePct` metric unchanged
- No new data fetching added -- `savingsSummary` was already fetched in `page.tsx` and passed through `AccueilClient`

### Review finding (MEDIUM - dead alias)
- `savingsRatePct = savingsRate` at line 458 is a trivial alias. Not blocking, but should be cleaned up. This is a code quality issue, not a product issue.

## Visual Validation

**LIMITATION:** Playwright MCP tools are not available in this agent session. Visual validation could not be performed directly.

**Mitigation:** The change is purely computational (formula swap), not visual. The display components (MetricCard, ScoreRing) are unchanged. The only visual difference is the VALUE shown (0% instead of whatever the old cumulative ratio was). The layout, formatting, and component structure are identical.

**Recommendation:** The orchestrator should perform a quick visual check on http://localhost:3000 -> "Sante financiere" tab to confirm the savings rate metric card shows "0%" with description "0,00 $ / 6 500,00 $" given the current test data (0 contributions this month).

## Verdict

**ACCEPTED**

Both acceptance criteria are met. The formula correctly uses monthly savings contributions divided by expected monthly income. The guard clause for zero income is present. The cumulative `totalEpargne` is correctly preserved for its proper use cases (cushion, net worth). No regressions detected.

### Conditions
- Visual confirmation recommended but not blocking: the change is purely computational, not layout-affecting.
- MEDIUM finding (dead `savingsRatePct` alias) noted by reviewer -- not a product concern, can be cleaned up separately.
