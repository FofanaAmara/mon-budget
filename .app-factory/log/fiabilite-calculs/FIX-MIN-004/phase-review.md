# Code Review: FIX-MIN-004

**Date:** 2026-03-05
**Reviewer:** af-reviewer
**Commit:** c084fca
**Story:** Replace all hardcoded biweekly-to-monthly multiplier values with a single shared constant (26/12)
**Level:** 1 | **Scope:** backend, frontend

---

## Git Reality Check

- **Commit c084fca** matches story claims: 7 files modified, constants added, hardcoded values replaced.
- **No uncommitted changes** related to this story.
- **Build log** (`phase-build.md`) matches git diff — no fraudulent claims.
- PASS — no discrepancies.

---

## Verdict: APPROVED WITH NOTES

| Severity | Count |
|----------|-------|
| CRITICAL | 0 |
| HIGH | 0 |
| MEDIUM | 2 |
| LOW | 1 |

---

## Findings

### [MEDIUM] F1 — Display label "4,33" still hardcoded in Onboarding previewLabel

**File:** `components/Onboarding.tsx:79`
**Skill:** `af-clean-code` § Constantes nommees, pas de magic numbers

**Problem:** The `previewLabel` function displays `"× 4,33"` as a hardcoded string to the user. The actual calculation on line 70 correctly uses `WEEKLY_MONTHLY_MULTIPLIER` (52/12 = 4.3333...), but the display label rounds to "4,33" — which is a different value. If the constant ever changes, the display label will be stale.

**Impact:** Low practical impact today (52/12 is unlikely to change), but this is exactly the kind of knowledge duplication the story was designed to eliminate. The display string and the constant encode the same knowledge (the weekly multiplier rounded for display).

**Fix:** Derive the display value from the constant:
```ts
return `${fmt(amount)} × ${WEEKLY_MONTHLY_MULTIPLIER.toFixed(2).replace('.', ',')} = ${fmt(monthly)} $ / mois`;
```

### [MEDIUM] F2 — Display label "2× par mois" is factually inaccurate

**File:** `components/Onboarding.tsx:81`
**Skill:** `af-clean-code` § Commentaires/Nommage — Noms revelateurs d'intention

**Problem:** The biweekly preview label says `"basé sur 2× par mois"` but the actual calculation uses 26/12 = 2.1667× per month, not 2×. This was one of the bugs the story was fixing (replacing `* 2` with `26/12`). The calculation is now correct, but the user-facing explanation still says "2×".

**Impact:** The user sees a label that contradicts the actual math. For a $1,000 biweekly income, the calculation produces $2,167/month but the label claims it's based on "2× per month" (which would be $2,000). This is confusing if the user does the math.

**Fix:** Update the label to reflect the actual formula:
```ts
return `${fmt(monthly)} $ / mois (26 paies ÷ 12 mois)`;
```

### [LOW] F3 — Import after export in constants.ts

**File:** `lib/constants.ts:8-11`
**Skill:** `af-clean-code` § Structure — Imports dans un seul sens

**Problem:** The two new constant exports (lines 8-9) are placed BEFORE the `import` statement (line 11). Convention is imports first, then exports.

**Impact:** Purely cosmetic — no runtime impact. But it reads oddly and may trip linters.

**Fix:** Move the constants below the import block.

---

## Completeness Check

### All biweekly multiplier occurrences accounted for:

| Location | Before | After | Correct? |
|----------|--------|-------|----------|
| `lib/constants.ts:8-9` | N/A (new) | `52/12`, `26/12` | YES |
| `lib/utils.ts` calcMonthlyCost | `52/12`, `26/12` inline | Constants | YES |
| `lib/utils.ts` calcMonthlyIncome | `* 2` | `BIWEEKLY_MONTHLY_MULTIPLIER` | YES (bug fix) |
| `components/Onboarding.tsx` toMonthly | `4.33`, `2.17` | Constants | YES (bug fix) |
| `lib/actions/monthly-expenses.ts` | `52/12`, `26/12` inline | Constants | YES |
| `lib/actions/monthly-incomes.ts` | `* 2` | `BIWEEKLY_MONTHLY_MULTIPLIER` | YES (bug fix) |
| `app/parametres/charges/page.tsx` | `52/12`, `26/12` inline | Constants | YES |
| `lib/actions/expenses.ts` (SQL) | `52.0/12`, `26.0/12` | Kept as literals + comment | YES (SQL can't import JS) |

### Remaining hardcoded values (grep results):

- `amount * 2` in `app/parametres/charges/page.tsx:26` — this is for **BIMONTHLY** (every 2 months), NOT biweekly. Correct as-is.
- `52.0/12` and `26.0/12` in SQL query (`lib/actions/expenses.ts`) — SQL cannot import JS constants. Comment added on line 257 referencing the JS constants. Acceptable.
- Display strings "4,33" and "2×" in `Onboarding.tsx` — see findings F1 and F2.

### No remaining `2.17` or incorrect `* 2` for biweekly: CONFIRMED (grep clean).

---

## Overall Assessment

The core work is solid. The constant definition is mathematically correct (`26/12` and `52/12`), all calculation sites now use the shared constants, and three genuine bugs were fixed (locations that used `2.17`, `* 2`, or `* 2` instead of `26/12`). The SQL limitation is handled pragmatically with a cross-reference comment.

The diff is large (~1500 lines) but the builder correctly noted that ~95% is Biome formatter auto-reformatting (single quotes to double quotes, trailing commas, line wrapping). The actual logical changes are approximately 20 lines — all verified correct.

The two MEDIUM findings are about display labels that still contain hardcoded approximations of the very values the story was designed to centralize. They don't affect calculations (which are correct), but they do represent residual knowledge duplication and one factually misleading label.

