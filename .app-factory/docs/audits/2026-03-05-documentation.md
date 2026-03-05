# Audit Documentation — 2026-03-05

## Summary
- Files scanned: 18 documentation files + cross-reference with codebase
- Findings: 0 critical, 3 high, 6 medium, 4 low

## HIGH

### H1 — README.md is the default create-next-app boilerplate
**File:** `/README.md`
**Rule:** `af-documentation` § Niveau 1 (30 000 ft — Big picture)
**Problem:** The project README is the unmodified Next.js create-next-app template. It contains no information about Mes Finances — not the project purpose, not the stack, not the setup instructions, not the env vars needed, not the architecture. A new contributor (or the human in 6 months) opening this repo gets zero useful information.
**Fix:** Replace with a project-specific README covering: what the project is, stack summary, prerequisites, setup instructions (clone, env vars, migrations, `npm run dev`), project structure overview, link to `.app-factory/docs/` for detailed docs.

### H2 — Three env vars used in code are undocumented everywhere
**File:** `.app-factory/docs/infrastructure/env-vars.md` + `.env.example`
**Rule:** `af-documentation` § Checklist par tache ("env-vars.md mis a jour si variable d'env ajoutee") + § Niveau 5 (infra/env-vars.md)
**Problem:** Three environment variables are used in code but documented nowhere — not in env-vars.md, not in .env.example:
1. `NEON_AUTH_BASE_URL` — used in `lib/auth/server.ts:4`
2. `NEON_AUTH_COOKIE_SECRET` — used in `lib/auth/server.ts:6`
3. `NEXT_PUBLIC_VAPID_PUBLIC_KEY` — used in `components/NotificationPermission.tsx:30`

Additionally, `CRON_SECRET` was added to env-vars.md but is missing from `.env.example`.
**Fix:** Add all 4 variables to both `env-vars.md` and `.env.example`. The Neon Auth variables are critical for the app to function at all — a new developer would be stuck without them.

### H3 — `api-reference.md` does not document the cron endpoint
**File:** `.app-factory/docs/api-reference.md`
**Rule:** `af-documentation` § Principe 3 ("Touche le code, touche la doc — Ajoute un endpoint -> api-surface.md")
**Problem:** The `/api/cron/push` endpoint was added in FIX-MIN-008 (commit 3209306) but `api-reference.md` still lists only 3 endpoints. This endpoint has a distinct authentication mechanism (Bearer token via `CRON_SECRET` instead of session auth) which makes it especially important to document.
**Fix:** Add `GET /api/cron/push` to api-reference.md with: purpose (daily notification cron), authentication method (Bearer CRON_SECRET), when it runs (Vercel cron, daily), and response format.

## MEDIUM

### M1 — `overview.md` does not exist
**File:** `.app-factory/docs/overview.md` (missing)
**Rule:** `af-documentation` § Niveau 1 (30 000 ft — overview.md, architecture.md)
**Problem:** The three-space model prescribes `overview.md` as the 30,000 ft big picture document. It does not exist. `architecture.md` exists but serves a different purpose (technical stack and patterns). `vision.md` exists but is product-oriented (roadmap, phases). There is no single document answering "what is this project and how does it all fit together?"
**Fix:** Create `overview.md` with: project purpose in one paragraph, target user, key features list, architecture diagram (text-based), link to architecture.md for details, link to vision.md for roadmap.

### M2 — `product/current-state.md` does not exist
**File:** `.app-factory/docs/product/current-state.md` (missing)
**Rule:** `af-documentation` § Niveau 3 (5 000 ft — product/current-state.md)
**Problem:** No document captures the current state of the product — what features are live, what works, what is broken, what is in progress. The backlog README.md has some of this info, but it describes the future (what to do next), not the present (what exists now).
**Fix:** Create `product/current-state.md` listing: all live features with status (stable/buggy/partial), known issues, last deployment date, metrics if available.

### M3 — `data-model.md` is missing the `spread_monthly` column on expenses
**File:** `.app-factory/docs/data-model.md`
**Rule:** `af-documentation` § Principe 3 ("Modifie le schema -> data-model.md") + § Checklist ("data-model.md mis a jour si schema DB change")
**Problem:** The `expenses` table in `data-model.md` does not list the `spread_monthly` column (BOOLEAN), which exists in the actual DB (added by `scripts/migrate-spread-monthly.mjs`) and is actively used in `lib/actions/expenses.ts` and `lib/actions/monthly-expenses.ts`. This means the doc does not reflect the actual schema.
**Fix:** Add `spread_monthly | BOOLEAN | Repartir charges quarterly/yearly sur chaque mois` to the expenses table in data-model.md.

### M4 — Feature READMEs do not exist at all
**File:** `.app-factory/docs/features/` (directory missing entirely)
**Rule:** `af-documentation` § Niveau 4 ("Features — features/[feature]/README.md — toutes sans exception") + § Checklist sante globale ("Toutes les features ont un README dans .app-factory/docs/features/")
**Problem:** The `features/` directory under `.app-factory/docs/` does not exist. The project has at least 15 distinct features (suivi-depenses, suivi-revenus, charges-fixes, sections, cartes, parametres, onboarding, push-notifications, etc.) with zero feature-level documentation in the prescribed location. Feature briefs exist in the backlog but those describe the future (what to build), not the present (how it works now).
**Fix:** Create `.app-factory/docs/features/` with a README per feature. Start with the most complex ones (suivi-depenses, charges-fixes, tableau-de-bord). Simple features need only 5-10 lines per the skill guidelines.

### M5 — No `implementation_log.md` summary file exists
**File:** `.app-factory/log/implementation_log.md` (missing)
**Rule:** `af-documentation` § .app-factory/log/ ("DEUX NIVEAUX: implementation_log.md -> Pour l'humain")
**Problem:** The two-level logging model requires an `implementation_log.md` file that serves as a scannable summary for the human. This file does not exist. The per-story phase logs exist (which is good), but there is no top-level summary that lets a human scan all implementation activity in 2 minutes.
**Fix:** Create `.app-factory/log/implementation_log.md` with one line per feature/story implemented, in chronological order. Example format: `| 2026-03-05 | FIX-BLQ-003 | Dashboard balance formula | DONE | 1 commit |`

### M6 — No ADRs written despite multiple qualifying decisions
**File:** `.app-factory/docs/adr/` (only TEMPLATE.md exists)
**Rule:** `af-documentation` § Regle ADR ("Choix de techno significatif, Pattern structurant, Choix impactant 2+ features, Choix qu'on se demandera pourquoi dans 6 mois")
**Problem:** The project has made several decisions that warrant ADRs, but zero ADRs exist (only the template). Qualifying decisions include:
1. Neon Auth over other auth solutions (auth choice impacting all features)
2. Server Actions over REST API (architectural pattern impacting all CRUD)
3. Template vs Transaction pattern (core data model pattern)
4. Manual migration scripts over Prisma/Drizzle (tooling choice with ongoing maintenance impact)
5. No RLS — server-side filtering instead (security architecture)
**Fix:** Create ADRs for at least the top 3 decisions above. They are decisions that will be questioned in 6 months. The richer the "alternatives considered" section, the more useful the ADR.

## LOW

### L1 — `data-model.md` tables `income_allocations`, `monthly_allocations`, `savings_contributions` are stubs
**File:** `.app-factory/docs/data-model.md:132-139`
**Rule:** `af-documentation` § Anti-pattern #3 ("README fantome — 5 lignes > TODO")
**Problem:** Three tables are listed with only a one-line description and no column listing: `income_allocations`, `monthly_allocations`, `savings_contributions`. This is the documentation equivalent of a TODO placeholder.
**Fix:** Add column-level detail for these three tables, matching the format of the other tables in the document.

### L2 — `push_subscriptions` and `notification_log` tables are collapsed into a single line
**File:** `.app-factory/docs/data-model.md:149-150`
**Rule:** `af-documentation` § Anti-pattern #3 ("README fantome")
**Problem:** Two tables are described in a single line: "Tables support pour les notifications Web Push." No columns documented.
**Fix:** Add column-level detail for both tables.

### L3 — Runbooks only cover deploy — no migration runbook
**File:** `.app-factory/docs/runbooks/`
**Rule:** `af-documentation` § Niveau 5 (runbooks/) + § Checklist sante globale ("Runbooks testes recemment < 3 mois")
**Problem:** Only `deploy.md` exists as a runbook. Given that the project uses manual migration scripts (15 scripts, no migration tool), a dedicated migration runbook would be valuable — especially since migrations are irreversible and there is no schema source of truth.
**Fix:** Create `runbooks/migration.md` covering: when to run migrations, order dependencies, how to verify success, rollback strategy (or lack thereof), and the list of all migration scripts with their purpose.

### L4 — `architecture.md` lists "15 scripts au total" but 15 scripts actually exist
**File:** `.app-factory/docs/architecture.md:107`
**Rule:** `af-documentation` § Principe 3 ("Touche le code, touche la doc")
**Problem:** Minor: architecture.md says "15 scripts au total" and lists 7 by name with `...`. The actual count matches but the list is incomplete. This is a minor transparency issue — someone reading the doc cannot know which scripts exist without checking the filesystem.
**Fix:** Either list all 15 scripts or link to the `scripts/` directory with a note to check there for the complete list.

## Systemic Issues

### SI-1 — "Touche le code, touche la doc" is not being followed consistently
Multiple findings (H2, H3, M3) show that code changes (new env vars, new endpoints, new columns) were committed without updating the corresponding documentation. This is the #2 anti-pattern in af-documentation ("Doc separee du workflow"). The documentation was treated as a separate task rather than part of the implementation workflow. This is likely a process issue — the Builder exit checklist is either not being checked or not being enforced by the Reviewer.

### SI-2 — Level 4 documentation (feature READMEs) is entirely absent
The project has 15+ features but zero feature-level documentation. This means there is no documentation that answers "how does feature X work?" at any level of detail. The backlog has feature briefs (what to build) and the logs have implementation details (what happened), but the present-tense documentation (how it works now) does not exist at the feature level.

### SI-3 — Architectural decisions are undocumented
Zero ADRs exist for a project with at least 5 qualifying architectural decisions. This means the "why" behind the project's technical foundations is stored only in human memory. When the project reaches Phase 2 (family/friends) or Phase 3 (SaaS), these decisions will need to be revisited, and the rationale will be lost.
