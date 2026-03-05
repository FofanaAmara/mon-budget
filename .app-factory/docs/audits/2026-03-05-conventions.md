# Audit Conventions — 2026-03-05

## Summary

- **Files scanned:** 135+ (all .app-factory/ files: backlog, docs, log, discoveries, state)
- **Git commits analyzed:** 50 (full history)
- **Findings:** 0 critical, 3 high, 7 medium, 4 low

---

## HIGH

### H-001 — Missing epic.md definition files for all 7 epics

**File:** `.app-factory/backlog/epics/*/` (all 7 directories: configuration, core-financier, notifications, onboarding-auth, patrimoine, pwa, stabilisation)
**Rule:** `af-conventions` § Documentation Model + `af-documentation` § Backlog structure
**Problem:** None of the 7 epic directories contain an `epic.md` file. The backlog structure specifies `epics/[epic]/epic.md` as the definition file for each epic. A TEMPLATE.md exists at `.app-factory/backlog/epics/TEMPLATE.md` with the expected format (Objectif, Features, Criteres de succes), but no epic uses it. Each epic directory contains only a `features/` subdirectory with no contextual definition of the epic's goal, scope, or success criteria.
**Impact:** No way to understand what each epic aims to achieve without reading all its feature briefs. The backlog README partially compensates with a table, but the hierarchical context (why these features are grouped) is lost.
**Fix:** Create `epic.md` for each epic using the TEMPLATE.md format. Minimum content: 3-5 line objective, list of features, success criteria.

### H-002 — Duplicate stories across original features and stabilisation/fiabilite-calculs

**File:** 12 stories duplicated, e.g.:
- `.app-factory/backlog/epics/stabilisation/features/fiabilite-calculs/stories/FIX-BLQ-003.md` AND `.app-factory/backlog/epics/core-financier/features/tableau-de-bord/stories/FIX-BLQ-003.md`
- `.app-factory/backlog/epics/stabilisation/features/fiabilite-calculs/stories/FIX-MIN-005.md` AND `.app-factory/backlog/epics/configuration/features/gestion-sections/stories/FIX-MIN-005.md`
**Rule:** `af-conventions` § Core Principle 4 (Log the WHY not the WHAT) + `af-documentation` § DRY principle applied to backlog
**Problem:** All 12 stories in `stabilisation/fiabilite-calculs` are exact duplicates of stories that also exist in their original feature directories. The files are byte-identical (verified with diff). This creates ambiguity about which is the source of truth. If a PM updates one, the other becomes stale immediately.
**Impact:** Maintenance burden, risk of divergence, confusion about which copy is authoritative. Violates the single source of truth principle.
**Fix:** Choose one location as canonical. Recommended: keep stories in `stabilisation/fiabilite-calculs/` (the active feature) and replace originals with a one-line reference: `See: epics/stabilisation/features/fiabilite-calculs/stories/FIX-BLQ-003.md`. Alternatively, use symlinks.

### H-003 — Git commit messages do not follow `type(scope): description` convention

**File:** Git history (30+ commits)
**Rule:** `af-conventions` § Commit Conventions
**Problem:** The convention requires `type(scope): description`. The majority of commits use a non-standard format: `[FIX-BLQ-003] use expectedTotal instead of actualTotal for dashboard balance`. This bracket-prefix format is used consistently for story-related commits (12 of 12 fiabilite-calculs commits). Only pre-AF commits partially follow the convention: `fix(DISC-002): move "/mois" below amounts`, `chore: add stabilisation epic`. Post-AF story commits dropped the `type(scope):` format entirely.
**Impact:** Inconsistent git history. Automated tooling (changelogs, semantic versioning) cannot parse these commits. The story ID is useful context but should be in the body or scope, not replacing the type.
**Fix:** Adopt the convention strictly. Story commits should be: `fix(tableau-de-bord): use expectedTotal for dashboard balance [FIX-BLQ-003]`. The type conveys intent, the scope conveys module, the bracket ID goes at the end or in the body.

---

## MEDIUM

### M-001 — Missing `ideas/` directory in backlog

**File:** `.app-factory/backlog/` (directory listing)
**Rule:** `af-conventions` § Documentation Model (backlog structure)
**Problem:** The convention specifies `ideas/` as a capture directory for vague improvements maturing into stories. This directory does not exist. Discoveries (DISC-001, DISC-002) were captured in `.app-factory/discoveries/` (correct), but there is no `ideas/` directory for non-discovery improvement ideas.
**Fix:** Create `.app-factory/backlog/ideas/` with a README.md explaining its purpose. May remain empty initially.

### M-002 — Missing `.app-factory/docs/features/` directory (Level 4 documentation)

**File:** `.app-factory/docs/`
**Rule:** `af-documentation` § Three-space model, Level 4 (Features)
**Problem:** The documentation model requires Level 4 documentation: `.app-factory/docs/features/[feature]/README.md` for every feature. This directory does not exist. Feature briefs exist in the backlog (`feature-brief.md`), but these describe the FUTURE (what to build), not the PRESENT (how things work now). The 18 existing features have no runtime documentation.
**Fix:** Create `.app-factory/docs/features/` with a README per feature. For the 18 existing features, even 5-10 lines each (what it does, key tables, key server actions) would satisfy the minimum.

### M-003 — Missing `overview.md` (Level 1 documentation)

**File:** `.app-factory/docs/`
**Rule:** `af-documentation` § Three-space model, Level 1 (30,000 ft)
**Problem:** Level 1 documentation requires both `overview.md` and `architecture.md`. The `architecture.md` exists and is thorough, but `overview.md` (big picture, what the app does for a new reader) is absent. `vision.md` partially covers this but is product-focused, not technical-overview focused.
**Fix:** Create `.app-factory/docs/overview.md` — a 20-30 line document covering: what the app is, who it's for, key user flows, link to architecture.md for technical details.

### M-004 — Discovery DISC-001 missing required fields (Impact, Recommendation, Discovered by)

**File:** `.app-factory/discoveries/DISC-001-modal-double-close-button.md`
**Rule:** `af-conventions` § Discovery format
**Problem:** The convention requires: ID, Type, Severity, Discovered by, During, Status, Description, Impact, Resolution (if blocker), Recommendation. DISC-001 is missing: `Discovered by`, `Impact`, and `Recommendation` fields. The `Status` is `FIXING — corrige en dehors du cycle AF` which is non-standard (should be OPEN, TRIAGED, IN_PROGRESS, or RESOLVED).
**Fix:** Add the missing fields. Update Status to `RESOLVED` (since it was fixed per commit `21c494f`).

### M-005 — Discovery DISC-002 missing required fields (Impact, Recommendation, Discovered by)

**File:** `.app-factory/discoveries/DISC-002-charges-amount-alignment.md`
**Rule:** `af-conventions` § Discovery format
**Problem:** Same as M-004. Missing `Discovered by`, `Impact`, `Recommendation`. Also uses non-standard severity `MINEUR` instead of `P1/P2/P3` as required by the template. Status `DONE` is non-standard (should be `RESOLVED`).
**Fix:** Add missing fields, change severity to `P3`, change status to `RESOLVED`.

### M-006 — Feature report discoveries not filed as discovery files

**File:** `.app-factory/log/fiabilite-calculs/feature-report.md` (lines 49-52)
**Rule:** `af-conventions` § Core Principle 1 (Discovery over scope creep) + `af-documentation` § Discoveries
**Problem:** The feature report mentions 2 discoveries: (1) unused `ty`/`tm` variables in `deferExpenseToMonth`, (2) section expense count only queries templates. Neither has a corresponding file in `.app-factory/discoveries/`. Discoveries must be filed as individual documents for PM triage.
**Fix:** Create `DISC-003-unused-variables-defer-expense.md` and `DISC-004-section-expense-count-scope.md` in `.app-factory/discoveries/`.

### M-007 — Inconsistent feature brief naming: `FEATURE.md` vs `feature-brief.md`

**File:** `.app-factory/backlog/epics/stabilisation/features/fiabilite-calculs/FEATURE.md` vs all others using `feature-brief.md`
**Rule:** `af-conventions` § File naming consistency
**Problem:** 17 features use `feature-brief.md` as their feature definition file. The stabilisation/fiabilite-calculs feature uses `FEATURE.md` (uppercase, different name). This breaks naming consistency and makes automated tooling harder.
**Fix:** Rename `FEATURE.md` to `feature-brief.md` for consistency. Update any references in README.md.

---

## LOW

### L-001 — Stories use `BLOQUANT/MINEUR` severity instead of consistent English or P1/P2/P3

**File:** All 14 story files (e.g., `.app-factory/backlog/epics/stabilisation/features/fiabilite-calculs/stories/FIX-BLQ-003.md`)
**Rule:** `af-conventions` § Finding Severity (uses CRITICAL/HIGH/MEDIUM/LOW) and Discovery format (uses P1/P2/P3)
**Problem:** Stories use a third severity system: `BLOQUANT` and `MINEUR` (French). While internally consistent, this differs from both the finding severity scale (CRITICAL/HIGH/MEDIUM/LOW) and the discovery severity scale (P1/P2/P3). Three different severity vocabularies in the same project.
**Fix:** Standardize. Recommended: map BLOQUANT to P1 and MINEUR to P2/P3 in story files, or at minimum document the mapping in the backlog README.

### L-002 — Log naming convention inconsistency: `phase-*.md` vs `design.md`/`build.md`/`review-design.md`

**File:** `.app-factory/log/suivi-depenses/FIX-BLQ-002/` (contains both `phase-build.md` AND `build.md`, both `phase-review-design.md` AND `review-design.md`) and `.app-factory/log/charges-fixes/FIX-BLQ-006/` (contains `design.md` and `review-design.md` alongside `phase-*.md` files)
**Rule:** `af-documentation` § Implementation log naming (YYYY-MM-DD-[agent]-[mode].md)
**Problem:** Mixed naming conventions within the same story's log directory. The `fiabilite-calculs` feature uses `phase-*.md` consistently. Earlier stories (FIX-BLQ-002, FIX-BLQ-006) use a mix of `phase-*.md` and bare names (`design.md`, `build.md`, `review-design.md`). This suggests a convention shift mid-project without cleanup.
**Fix:** Pick one convention (recommend `phase-*.md` since it's the most recent and most consistent) and rename the older files, or document that the earlier stories used a prior convention.

### L-003 — Backlog README references "stories completees hors feature" without story status in the story files

**File:** `.app-factory/backlog/README.md` (lines 39-46)
**Rule:** `af-documentation` § Backlog lifecycle
**Problem:** The README declares FIX-BLQ-001, FIX-BLQ-002, FIX-BLQ-006 as completed, but the story files themselves contain no status field. The status lives only in `.app-factory/state/stories/*.yaml` and the README. The story .md files are effectively write-once (no lifecycle tracking within them).
**Fix:** Either add a `## Status` section to completed story files, or document explicitly that story .md files are immutable and status is tracked exclusively in state YAML files.

### L-004 — `current-state.md` (Level 3 product documentation) missing

**File:** `.app-factory/docs/`
**Rule:** `af-documentation` § Three-space model, Level 3
**Problem:** Level 3 documentation includes `product/current-state.md` describing the current state of the product. This file does not exist. The vision.md covers the future but not the present state (what's live, what works, what's known-broken).
**Fix:** Create `.app-factory/docs/product/current-state.md` summarizing: deployed features, known issues, and current maturity level.

---

## Systemic Issues

### 1. Convention adoption was mid-project, creating a before/after split

The project bootstrapped App Factory after significant development. Commits before `8d34d9d` (chore: sync project with App Factory plugin v1.8.0) follow ad-hoc conventions. Commits after follow AF conventions inconsistently. This is expected for a mid-project adoption but should be explicitly acknowledged. The log files show two eras: discovery/bootstrap logs (well-structured) and pre-AF commits (no logs at all).

**Recommendation:** Add a note in `.app-factory/docs/architecture.md` or `overview.md` acknowledging the AF adoption point and that earlier commits predate the convention.

### 2. Three severity vocabularies coexist

- Findings: CRITICAL / HIGH / MEDIUM / LOW
- Discoveries: P1 / P2 / P3
- Stories: BLOQUANT / MINEUR

This creates cognitive overhead. While each has its context, a mapping table would help.

**Recommendation:** Add a severity mapping table to the backlog README or a conventions reference document.

### 3. No automated tests means DoD cannot be fully verified

`af-conventions` § Anti-patterns #13 states tests are mandatory at every level. The feature report acknowledges "0 test suite" and every code_complete report says "No test suite available." This is documented tech debt (in `enablers/tech-debt.md`) but represents a systemic gap in the Definition of Done.

**Recommendation:** This is already tracked. Prioritize it before new feature development.

---

## Audit Verdict

**Overall compliance:** PARTIAL — The project demonstrates strong adoption of AF conventions for backlog structure, logging, and discovery flow. The three-space documentation model is well-understood but incompletely implemented (missing Level 1, 3, 4 docs). Commit conventions need standardization. The duplicate story problem and missing epic definitions are the most impactful structural issues.

**Score by category:**

| Category | Compliance | Notes |
|----------|-----------|-------|
| Backlog structure (epics/features/stories) | 70% | Good hierarchy, missing epic.md, duplicate stories |
| Git commit format | 40% | Consistent within eras but does not match `type(scope): description` |
| Documentation model (3-space) | 60% | docs/ and log/ good, backlog/ good, but missing Level 1/3/4 docs |
| Discovery flow | 75% | DISC-001/002 captured, but incomplete format + 2 unfiled discoveries |
| Scope creep management | 90% | Well-handled during fiabilite-calculs feature (discoveries logged, not implemented) |
| Story structure (AC format) | 95% | Given/When/Then consistently used, technical notes present, clear sizing |
| Log completeness | 85% | All phases logged for fiabilite-calculs, good detail level, minor naming inconsistency |
| Definition of Done | 50% | No tests, no CI — acknowledged as tech debt but still a gap |
