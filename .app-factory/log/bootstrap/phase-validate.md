# Phase: Validate Backlog

> Date: 2026-03-04
> Validator: af-pm (VALIDATE-BACKLOG mode)
> Scope: 14 FIX stories (5 BLOQUANT, 9 MINEUR)

---

## Overall Verdict: READY

The backlog is ready for implementation. All 14 stories pass INVEST criteria with only minor observations (no blockers). Audit coverage is complete — every finding has a corresponding story.

---

## 1. Per-Story INVEST Validation

### BLOQUANT Stories

| Story | I | N | V | E | S | T | Verdict |
|-------|:-:|:-:|:-:|:-:|:-:|:-:|---------|
| FIX-BLQ-001 | PASS | PASS | PASS | PASS | PASS | PASS | **PASS** |
| FIX-BLQ-002 | PASS | PASS | PASS | PASS | PASS | PASS | **PASS** |
| FIX-BLQ-003 | PASS | PASS | PASS | PASS | PASS | PASS | **PASS** |
| FIX-BLQ-004 | PASS | PASS | PASS | PASS | PASS | PASS | **PASS** |
| FIX-BLQ-005 | PASS | PASS | PASS | PASS | PASS | PASS | **PASS** |

### MINEUR Stories

| Story | I | N | V | E | S | T | Verdict |
|-------|:-:|:-:|:-:|:-:|:-:|:-:|---------|
| FIX-MIN-001 | PASS | PASS | PASS | PASS | PASS | PASS | **PASS** |
| FIX-MIN-002 | PASS | PASS | PASS | PASS | PASS | PASS | **PASS** |
| FIX-MIN-003 | PASS | PASS | PASS | PASS | PASS | PASS | **PASS** |
| FIX-MIN-004 | PASS | PASS | PASS | PASS | PASS | PASS | **PASS** |
| FIX-MIN-005 | PASS | PASS | PASS | PASS | PASS | NOTE | **PASS** (see note) |
| FIX-MIN-006 | PASS | PASS | PASS | PASS | PASS | PASS | **PASS** |
| FIX-MIN-007 | PASS | PASS | PASS | PASS | PASS | PASS | **PASS** |
| FIX-MIN-008 | PASS | PASS | PASS | PASS | PASS | PASS | **PASS** |
| FIX-MIN-009 | PASS | PASS | PASS | PASS | PASS | PASS | **PASS** |

### Detailed Notes

**FIX-MIN-005 (section cascade protection) — Testable: NOTE**
AC1 requires a confirmation dialog with "move" or "delete" options. This introduces new UI that is more of a small feature than a pure fix. The AC is testable, but the implementer should be aware this requires a UI component, not just a server action change. Size S is borderline — could be M depending on UI effort. Acceptable as-is.

---

## 2. AC Completeness

| Story | AC Count | Happy Path | Edge Case | Given/When/Then | Verdict |
|-------|:--------:|:----------:|:---------:|:---------------:|---------|
| FIX-BLQ-001 | 2 | YES | YES (validation hint) | YES | PASS |
| FIX-BLQ-002 | 3 | YES | YES (spread_monthly) | YES | PASS |
| FIX-BLQ-003 | 2 | YES | YES (all paid) | YES | PASS |
| FIX-BLQ-004 | 2 | YES | YES (after upstream fix) | YES | PASS |
| FIX-BLQ-005 | 2 | YES | YES (0 contributions) | YES | PASS |
| FIX-MIN-001 | 2 | YES | YES (no duplicate) | YES | PASS |
| FIX-MIN-002 | 2 | YES | YES (anchor date) | YES | PASS |
| FIX-MIN-003 | 2 | YES | YES (never-edited entry) | YES | PASS |
| FIX-MIN-004 | 2 | YES | YES (dev search) | YES | PASS |
| FIX-MIN-005 | 2 | YES | YES (no linked expenses) | YES | PASS |
| FIX-MIN-006 | 2 | YES | YES (monthly freq) | YES | PASS |
| FIX-MIN-007 | 1 | YES | NO | YES | **FLAG** |
| FIX-MIN-008 | 2 | YES | YES (no pending) | YES | PASS |
| FIX-MIN-009 | 2 | YES | YES (SW update) | YES | PASS |

**FIX-MIN-007 has only 1 AC.** Missing edge case AC, e.g.:
> Given a user enters monthly (not biweekly) income during onboarding
> When the monthly estimate is displayed
> Then no multiplier is applied (amount shown as-is)

**Severity: Low.** The story is an XS one-liner (replace `2.17` with constant). The single AC is sufficient to verify the fix. The missing edge case is implicitly covered by FIX-MIN-006 AC2. Not a blocker.

---

## 3. Dependency Analysis

### Dependency Graph

```
FIX-BLQ-001 (recurrence_day default)
  |
  +--> FIX-BLQ-004 (health score)

FIX-BLQ-002 (YEARLY/QUARTERLY generation)
  |
  +--> FIX-BLQ-003 (dashboard balance — accuracy improves)
  +--> FIX-BLQ-004 (health score)

FIX-BLQ-003 (dashboard balance)
  |
  +--> FIX-BLQ-004 (health score)

FIX-MIN-004 (biweekly constant)
  |
  +--> FIX-MIN-002 (uses the constant)
  +--> FIX-MIN-007 (uses the constant)

FIX-MIN-006 + FIX-MIN-007 (should deploy together)

All others: independent (no dependencies)
```

### Dependency Check Results

| Check | Result |
|-------|--------|
| Circular dependencies | **NONE** — Graph is a clean DAG |
| Dependencies explicit in stories | **PASS** — All stories declare their deps in Technical Notes |
| Implementation order respects deps | **PASS** — See wave ordering below |

### Corrected Implementation Waves

**Wave 1 (no dependencies):**
- FIX-BLQ-001 (recurrence_day default)
- FIX-BLQ-002 (YEARLY/QUARTERLY generation)
- FIX-BLQ-003 (dashboard balance — can be done in parallel, full accuracy after BLQ-002)
- FIX-MIN-001 (deferred expense_id)
- FIX-MIN-003 (income overwrite protection)
- FIX-MIN-004 (biweekly constant) — **should be Wave 1 because MIN-002 and MIN-007 depend on it**
- FIX-MIN-005 (section cascade)
- FIX-MIN-008 (cron job)
- FIX-MIN-009 (favicon cache)

**Wave 2 (depends on Wave 1):**
- FIX-BLQ-004 (health score — depends on BLQ-001, BLQ-002, BLQ-003)
- FIX-BLQ-005 (savings rate — independent but best deployed with BLQ-004)
- FIX-MIN-002 (biweekly amount — depends on MIN-004 for constant)
- FIX-MIN-006 + FIX-MIN-007 (onboarding fixes — MIN-007 depends on MIN-004)

**NOTE:** FIX-BLQ-005 is listed as independent in its story ("Dependencies: None") but the story also says "ideally deployed with FIX-BLQ-004 for coherent health tab." This is a soft co-deployment preference, not a hard dependency. Correct as-is.

---

## 4. Sizing Consistency

| Size | Stories | Estimated Effort | Consistent? |
|------|---------|-----------------|:-----------:|
| XS (< 1h) | FIX-MIN-001, FIX-MIN-002, FIX-BLQ-003, FIX-MIN-006, FIX-MIN-007, FIX-MIN-009 | One-liner or single-file fix | **PASS** |
| S (1-4h) | FIX-BLQ-001, FIX-BLQ-004, FIX-BLQ-005, FIX-MIN-003, FIX-MIN-004, FIX-MIN-005, FIX-MIN-008 | Multi-file or logic change | **PASS** |
| M (4-8h) | FIX-BLQ-002 | DB migration + multi-file logic change | **PASS** |

### Sizing Observations

- **FIX-MIN-005 (S)** — Could be M if the UI confirmation dialog requires a new component. Acceptable at S if using a simple `window.confirm` or existing modal pattern.
- **FIX-MIN-003 (S)** — Requires DB migration (add `manually_edited` column). Comparable to FIX-BLQ-002 (M) which also needs a migration. However, MIN-003's migration is simpler (boolean column vs new behavior logic), so S is defensible.
- **All XS stories** are genuinely single-line or single-function fixes. Consistent.
- **All S stories** involve 1-2 files with moderate logic changes. Consistent.
- **The single M story** (BLQ-002) involves a DB migration + conditional generation logic across multiple code paths. M is appropriate.

**Verdict: Sizing is consistent.** No re-sizing needed.

---

## 5. Feature Coverage — Audit Issues vs Stories

### BLOQUANT Issues (5 audit findings, 5 stories)

| Audit # | Audit Issue | Story | Covered? |
|---------|------------|-------|:--------:|
| 1 | recurrence_day default '1' | FIX-BLQ-001 | YES |
| 2 | YEARLY/QUARTERLY generated every month | FIX-BLQ-002 | YES |
| 3 | Dashboard balance uses actualTotal | FIX-BLQ-003 | YES |
| 4 | Health score corrupted by upstream bugs | FIX-BLQ-004 | YES |
| 5 | Savings rate uses all-time ratio | FIX-BLQ-005 | YES |

### MINEUR Issues (11 audit findings, 9 stories)

| Audit # | Audit Issue | Story | Covered? |
|---------|------------|-------|:--------:|
| 1 | Deferred expense loses expense_id | FIX-MIN-001 | YES |
| 2 | Biweekly income uses amount*2 | FIX-MIN-002 | YES |
| 3 | Income generation overwrites manual changes | FIX-MIN-003 | YES |
| 4 | Biweekly multiplier inconsistent | FIX-MIN-004 | YES |
| 5 | No cascade protection on section delete | FIX-MIN-005 | YES |
| 6 | Onboarding creates MONTHLY instead of BIWEEKLY | FIX-MIN-006 | YES |
| 7 | Onboarding uses 2.17 multiplier | FIX-MIN-007 | YES |
| 8 | No cron for push notifications | FIX-MIN-008 | YES |
| 9 | Favicon not cached by SW | FIX-MIN-009 | YES |
| 10 | Dashboard coverage uses actualTotal | — | **MERGED into FIX-BLQ-004** (noted in story) |
| 11 | Savings rate conceptually incorrect | — | **MERGED into FIX-BLQ-005** (noted in story) |

**Coverage: 100%.** All 16 audit findings (5 BLOQUANT + 11 MINEUR) are covered by 14 stories. Two MINEUR findings (#10, #11) were correctly merged into their corresponding BLOQUANT stories where the fix addresses both issues. This is good — no artificial story inflation.

---

## 6. Priority Coherence

| Check | Result |
|-------|--------|
| All BLOQUANT stories in Wave 1 or early Wave 2 | **PASS** — BLQ-001/002/003 in Wave 1, BLQ-004/005 in Wave 2 (blocked by Wave 1) |
| No MINEUR blocking a BLOQUANT | **PASS** — No MINEUR story appears in any BLOQUANT dependency chain |
| Dependencies respect priority ordering | **PASS** — BLQ-004 depends only on other BLQ stories |
| BLOQUANT before MINEUR in execution | **PASS** — Wave 1 prioritizes BLQ stories, MINEUR in Wave 1 are independent (can be parallelized) |

---

## Summary

### Strengths
1. **Complete audit coverage** — Every finding mapped to a story, merges are explicit and justified
2. **Clean dependency graph** — No cycles, all deps declared, logical wave ordering
3. **Consistent sizing** — XS/S/M align with actual scope
4. **Quality ACs** — Given/When/Then format, both happy path and edge cases covered
5. **Good technical context** — File references, line numbers, root causes, and fix approaches in every story

### Issues Found
1. **FIX-MIN-007** has only 1 AC (minimum is 2). Severity: Low. The missing edge case is implicitly covered by FIX-MIN-006.

### Recommendations
1. **Add a second AC to FIX-MIN-007** for completeness (e.g., "Given monthly income, no multiplier applied"). Optional — not a blocker.
2. **Consider co-implementing FIX-MIN-004 before FIX-MIN-002 and FIX-MIN-007** — the constant must exist before consumers can import it. The wave ordering above already accounts for this.
3. **FIX-MIN-005 implementer should be warned** this is closer to M if a proper dialog UI is needed. A `window.confirm` approach keeps it at S.
4. **After all fixes, a regression sweep is recommended** — the cascading bug chain (BLQ-001 -> overdue -> score) means fixing one bug changes behavior in multiple features.

---

## Verdict

### READY

14 stories validated. 0 blockers. 1 minor observation (MIN-007 single AC). The backlog is ready for implementation in the wave order specified above.
