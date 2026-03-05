# Feature — Audit Remediation

## Epic
stabilisation

## Description
Feature transversale regroupant les corrections issues de l'audit complet du 2026-03-05. L'audit a identifie 170 findings (13 CRITICAL, 43 HIGH, 72 MEDIUM, 42 LOW) repartis sur 9 domaines : Testing, Performance, Data Model, Frontend, Security, Clean Code, Architecture, Conventions, Documentation.

Les findings sont regroupes en **15 stories par action** (pas par domaine). Chaque story est independamment deployable et inclut un critere de non-regression obligatoire.

**Contrainte #1 : Zero regression.** Chaque story doit laisser l'application fonctionnellement identique apres deploiement. Le build doit passer. Les fonctionnalites existantes doivent continuer de fonctionner.

## Contexte
- L'audit a ete realise le 2026-03-05 par af-reviewer sur 9 domaines
- La feature fiabilite-calculs (12 stories FIX) est completee — les bugs fonctionnels sont resolus
- Cette feature adresse la dette technique, la securite, la performance et la qualite du code
- Le projet est en alpha, usage personnel — pragmatisme > perfection

## Stories

### Wave 1 — Fondations (prerequis pour les autres waves)

| ID | Titre | Taille | Type | Deps |
|----|-------|--------|------|------|
| AUDIT-001 | Install Vitest + configure test infrastructure | S | CHORE | Aucune |
| AUDIT-010 | Document current DB schema + update data-model.md | S | CHORE | Aucune |
| AUDIT-014 | Fix documentation gaps (README, env-vars, overview, api-reference) | S | CHORE | Aucune |

### Wave 2 — Securite et integrite des donnees

| ID | Titre | Taille | Type | Deps |
|----|-------|--------|------|------|
| AUDIT-004 | Add Zod validation schemas to all server actions | M | REFACTOR | Aucune |
| AUDIT-007 | Add DB transactions for multi-statement financial operations | S | REFACTOR | Aucune |
| AUDIT-008 | Add FK indexes and composite indexes | S | REFACTOR | Aucune |
| AUDIT-009 | Add middleware.ts + security headers | S | REFACTOR | Aucune |

### Wave 3 — Tests des calculs financiers (depend de Wave 1)

| ID | Titre | Taille | Type | Deps |
|----|-------|--------|------|------|
| AUDIT-002 | Write unit tests for financial calculation functions | M | CHORE | AUDIT-001 |
| AUDIT-003 | Extract calcDueDateForMonth from server action + write tests | M | REFACTOR | AUDIT-001 |

### Wave 4 — Performance

| ID | Titre | Taille | Type | Deps |
|----|-------|--------|------|------|
| AUDIT-005 | Batch INSERTs in generation functions | S | REFACTOR | Aucune |
| AUDIT-015 | Remove force-dynamic from /landing + add missing revalidatePath helpers | XS | REFACTOR | Aucune |

### Wave 5 — Accessibilite

| ID | Titre | Taille | Type | Deps |
|----|-------|--------|------|------|
| AUDIT-006 | Fix critical accessibility (htmlFor, userScalable, keyboard, ARIA) | S | FIX | Aucune |

### Wave 6 — Refactoring structurel (le plus risque, en dernier)

| ID | Titre | Taille | Type | Deps |
|----|-------|--------|------|------|
| AUDIT-012 | Extract duplicated code (DEFAULT_SECTIONS, fadeInUp, icon/status helpers) | S | REFACTOR | Aucune |
| AUDIT-013 | Split God Files (expenses.ts, monthly-expenses.ts) into focused modules | M | REFACTOR | Aucune |
| AUDIT-011 | Decompose God Components (ProjetsEpargne, RevenusTracking, DepensesTracking) | M | REFACTOR | Aucune |

## Taille totale
- 1 XS
- 7 S
- 5 M
- **15 stories total**

## Dependances critiques

```
AUDIT-001 ──> AUDIT-002
AUDIT-001 ──> AUDIT-003
```

Les Waves 1-5 sont paralleles entre elles (sauf les dependances ci-dessus).
La Wave 6 est intentionnellement en dernier car le refactoring structurel est le plus risque pour les regressions.

## Criteres de succes (feature level)
1. Le build passe apres chaque story
2. Vitest est installe et au moins 30 tests unitaires couvrent les calculs financiers
3. Toutes les server actions valident leurs inputs via Zod
4. Les operations financieres multi-statements utilisent des transactions DB
5. Les index FK et composites sont en place
6. L'app a un middleware d'authentification et des security headers
7. L'accessibilite critique est corrigee (labels, zoom, keyboard)
8. Les fonctions de generation utilisent des batch INSERTs
9. La documentation est a jour (README, env-vars, schema DB, API reference)

## Exclusions
- Migration DECIMAL vers INTEGER cents (Data C1) — trop risque pour cette iteration, ADR a creer
- Migration ENUM vers TEXT + CHECK (Data C2) — risque moyen, planifier separement
- Migration vers structure feature-based (Architecture H-1) — epic a part entiere
- Migration inline styles vers Tailwind (Frontend H2) — epic a part entiere
- Rate limiting (Security H2) — necessite un service externe (Upstash), planifier separement
- E2E tests Playwright (Testing H4) — a planifier apres les unit tests
- Decomposition de Onboarding.tsx et des modals (Clean Code S-01 partiel) — hors scope
- Triggers updated_at (Data M6) — risque modere, planifier separement
- Restructuration ON DELETE policies (Data M5) — necessite analyse d'impact

## Findings non couverts (backlog futur)
Ces findings ont ete intentionnellement exclus car ils representent des chantiers structurels majeurs :
- Architecture H-1 : Migration layer-based vers feature-based
- Frontend H2 : Migration inline styles vers Tailwind (1355 occurrences)
- Frontend H5 : Creer l'utilitaire cn() avec clsx + tailwind-merge
- Frontend H6 : Migrer les imperative DOM mutations vers Tailwind hover
- Frontend H7 : LayoutShell fait de tout l'arbre un client component
- Data C1 : Migration DECIMAL vers INTEGER cents
- Data C2 : Migration ENUM vers TEXT + CHECK
- Security H2 : Rate limiting
- Testing H4 : E2E tests Playwright
- Clean Code M-10 : Migration inline styles (systematique)
- Performance H5 : Audit force-dynamic par page (sauf /landing)
- Conventions H-001 : Creer epic.md pour les 7 epics
- Conventions H-002 : Dedupliquer les stories entre features et stabilisation
- Conventions H-003 : Standardiser les commit messages
- Documentation M6 : Creer les ADRs pour les decisions architecturales
