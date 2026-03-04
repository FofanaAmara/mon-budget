# Phase: Decompose — Audit Findings to FIX Stories

**Date:** 2026-03-04
**Input:** Audit AC report (5 BLOQUANT, 11 MINEUR issues across 18 features)
**Output:** 14 FIX stories (5 BLQ + 9 MIN after merging overlaps)

## Summary

Decomposed all audit findings into independent, actionable FIX stories following INVEST principles. Two MINEUR issues (#10 and #11) were merged into their corresponding BLOQUANT stories (FIX-BLQ-004 and FIX-BLQ-005) as they describe the same root cause.

## Stories Created

### BLOQUANT (5)

| ID | Title | Feature | Size | Dependencies |
|----|-------|---------|------|-------------|
| FIX-BLQ-001 | Recurrence day defaults to '1' | charges-fixes | S | Blocks FIX-BLQ-004 |
| FIX-BLQ-002 | Yearly/quarterly generated every month | suivi-depenses | M | Blocks FIX-BLQ-003, FIX-BLQ-004 |
| FIX-BLQ-003 | Dashboard balance uses actualTotal | tableau-de-bord | XS | Improved by FIX-BLQ-002 |
| FIX-BLQ-004 | Health score corrupted | sante-financiere | S | Blocked by BLQ-001, BLQ-002, BLQ-003 |
| FIX-BLQ-005 | Savings rate formula wrong | sante-financiere | S | None (deploy with BLQ-004) |

### MINEUR (9)

| ID | Title | Feature | Size | Dependencies |
|----|-------|---------|------|-------------|
| FIX-MIN-001 | Deferred expense loses expense_id | suivi-depenses | XS | None |
| FIX-MIN-002 | Biweekly income uses amount*2 | suivi-revenus | XS | Related to MIN-004 |
| FIX-MIN-003 | Income generation overwrites manual edits | suivi-revenus | S | May need migration |
| FIX-MIN-004 | Biweekly multiplier inconsistent | suivi-revenus | S | Enables MIN-002, MIN-007 |
| FIX-MIN-005 | No cascade protection on section delete | gestion-sections | S | None |
| FIX-MIN-006 | Onboarding creates MONTHLY even if biweekly | onboarding | XS | Deploy with MIN-007 |
| FIX-MIN-007 | Onboarding multiplier 2.17 vs 26/12 | onboarding | XS | Needs MIN-004 constant |
| FIX-MIN-008 | No cron for push notifications | push-notifications | S | None |
| FIX-MIN-009 | Favicon not cached by SW | pwa-install | XS | None |

## Merge Decisions

- **MINEUR #10** (dashboard coverage uses actualTotal) → merged into **FIX-BLQ-004** (same root cause, same file, same fix)
- **MINEUR #11** (savings rate conceptually incorrect) → merged into **FIX-BLQ-005** (same root cause, same file, same fix)

## Recommended Implementation Order

**Wave 1 — Foundation fixes (unblock everything):**
1. FIX-MIN-004 (create shared constant — enables other fixes)
2. FIX-BLQ-001 (recurrence_day default)
3. FIX-BLQ-002 (yearly/quarterly generation)

**Wave 2 — Dashboard & health (depends on Wave 1):**
4. FIX-BLQ-003 (dashboard balance)
5. FIX-BLQ-004 (health score)
6. FIX-BLQ-005 (savings rate)

**Wave 3 — Independent minors (parallel):**
7. FIX-MIN-001 (deferred expense_id)
8. FIX-MIN-002 + FIX-MIN-007 (biweekly multiplier fixes)
9. FIX-MIN-003 (income overwrite protection)
10. FIX-MIN-005 (section cascade)
11. FIX-MIN-006 (onboarding frequency)

**Wave 4 — Infra (independent):**
12. FIX-MIN-008 (push cron)
13. FIX-MIN-009 (favicon cache)

## Total Effort Estimate

- XS: 6 stories (~1h each) = ~6h
- S: 7 stories (~2-4h each) = ~14-28h
- M: 1 story (~4-8h) = ~4-8h
- **Total: ~24-42h of implementation work**
