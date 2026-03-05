# Audit Complet — Mes Finances

**Date :** 2026-03-05
**Domaines audites :** 9
**Fichiers scannes :** ~90 fichiers source

---

## Resume Executif

| Severite | Count |
|----------|-------|
| CRITICAL | 13 |
| HIGH | 43 |
| MEDIUM | 72 |
| LOW | 42 |
| **TOTAL** | **170** |

### Repartition par domaine

| Domaine | C | H | M | L | Total | Rapport |
|---------|---|---|---|---|-------|---------|
| Testing | 4 | 5 | 3 | 2 | 14 | `2026-03-05-testing.md` |
| Performance | 3 | 5 | 8 | 5 | 21 | `2026-03-05-performance.md` |
| Data Model | 3 | 5 | 9 | 6 | 23 | `2026-03-05-data-model.md` |
| Frontend | 3 | 7 | 12 | 6 | 28 | `2026-03-05-frontend.md` |
| Security | 0 | 5 | 7 | 4 | 16 | `2026-03-05-security.md` |
| Clean Code | 0 | 5 | 14 | 8 | 27 | `2026-03-05-clean-code.md` |
| Architecture | 0 | 5 | 6 | 3 | 14 | `2026-03-05-architecture.md` |
| Conventions | 0 | 3 | 7 | 4 | 14 | `2026-03-05-conventions.md` |
| Documentation | 0 | 3 | 6 | 4 | 13 | `2026-03-05-documentation.md` |

---

## Top 10 Actions Prioritaires

### 1. Installer Vitest + tester les fonctions financieres (Testing C1-C4)
**Impact :** CRITIQUE — Domaine : Testing + Performance + Data
**Effort :** 1 semaine
**Quoi :** Les fonctions `calcMonthlyCost`, `calcMonthlyIncome`, `countBiweeklyPayDatesInMonth`, `calcDueDateForMonth` gerent l'argent des utilisateurs sans aucun test. Un bug = des montants faux affiches silencieusement.
**Comment :** Installer Vitest, extraire les fonctions pures de `"use server"` vers `lib/utils.ts`, ecrire 30+ unit tests couvrant tous les cas de frequence et edge cases.

### 2. Ajouter validation Zod sur les server actions (Security H1, Testing H1)
**Impact :** HAUT — Domaine : Securite + Clean Code
**Effort :** 3-4 jours
**Quoi :** Les 40+ server actions acceptent des inputs bruts sans validation runtime. Des montants negatifs, des strings vides, des injections de type peuvent persister en DB.
**Comment :** Installer Zod, creer des schemas par action, valider en entree de chaque server action.

### 3. Batcher les INSERTs dans les fonctions de generation (Performance C1-C3)
**Impact :** CRITIQUE — Domaine : Performance
**Effort :** 2-3 jours
**Quoi :** `generateMonthlyExpenses/Incomes/Allocations` font N requetes HTTP sequentielles (20-50ms chacune) via Neon serverless. 15 depenses = 340-850ms de latence pure a chaque navigation.
**Comment :** Remplacer les boucles `for + await sql` par des multi-row INSERTs ou `Promise.all`. Creer un helper `batchInsert()`.

### 4. Corriger l'accessibilite critique (Frontend C1-C3)
**Impact :** CRITIQUE — Domaine : Frontend + Accessibilite
**Effort :** 2 jours
**Quoi :** 79/80 labels sans `htmlFor`, zoom bloque par `userScalable: false`, 15+ divs interactifs sans support clavier. L'app est inutilisable pour les personnes utilisant un lecteur d'ecran.
**Comment :** Ajouter `htmlFor` sur tous les labels, supprimer `userScalable: false`, ajouter `role="button"` + `tabIndex` + `onKeyDown` sur les backdrops.

### 5. Ajouter les transactions DB pour les operations financieres (Data H4)
**Impact :** HAUT — Domaine : Data Model + Securite
**Effort :** 2 jours
**Quoi :** `transferSavings`, `markAsPaid`, `makeExtraPayment` executent 3-4 queries SQL sans transaction. Un echec partiel = argent perdu ou duplique.
**Comment :** Utiliser `sql.transaction()` de Neon ou wrapper les operations dans `BEGIN/COMMIT`.

### 6. Ajouter les index FK manquants (Data H1)
**Impact :** HAUT — Domaine : Data Model + Performance
**Effort :** 1 jour (une seule migration)
**Quoi :** `expenses.section_id`, `expenses.card_id`, `monthly_expenses.card_id`, etc. n'ont pas d'index. Les JOINs et lookups sont des scans sequentiels.
**Comment :** Une migration avec `CREATE INDEX IF NOT EXISTS` pour chaque FK.

### 7. Ajouter middleware.ts + security headers (Security H3-H4)
**Impact :** HAUT — Domaine : Securite
**Effort :** 1 jour
**Quoi :** Pas de middleware d'authentification = les routes protegees retournent des erreurs brutes. Pas de headers de securite (CSP, X-Frame-Options, etc.).
**Comment :** Creer `middleware.ts` avec redirect vers `/auth/sign-in`. Ajouter les headers dans `next.config.ts`.

### 8. Decomposer les God Components (Clean Code H1-H3, Frontend H1)
**Impact :** HAUT — Domaine : Clean Code + Frontend + Architecture
**Effort :** 1 semaine
**Quoi :** 5 composants depassent 500 lignes (jusqu'a 1275L). `ProjetsEpargneClient`, `RevenusTrackingClient`, `DepensesTrackingClient` sont des monolithes impossibles a maintenir.
**Comment :** Extraire les modals, sheets, filtres en sous-composants. Viser < 200L par composant. Creer des custom hooks pour la logique.

### 9. Documenter le schema DB actuel (Data C3)
**Impact :** CRITIQUE — Domaine : Data Model + Documentation
**Effort :** 1 jour
**Quoi :** `supabase/schema.sql` est 10+ migrations en retard. Le CREATE TABLE de `monthly_incomes` n'existe nulle part. Aucune source de verite pour le schema.
**Comment :** Regenerer le schema complet depuis la DB de prod (`pg_dump --schema-only`), stocker dans `supabase/schema.sql`, mettre a jour `data-model.md`.

### 10. Migrer les inline styles vers Tailwind (Frontend H2)
**Impact :** MOYEN — Domaine : Frontend + Clean Code
**Effort :** 1-2 semaines (progressif)
**Quoi :** 1355 `style={}` vs 315 `className=`. Tailwind v4 est installe mais a peine utilise. Les composants sont 50-70% plus longs que necessaire.
**Comment :** Migrer progressivement, composant par composant. Creer un utilitaire `cn()` pour la fusion conditionnelle de classes.

---

## Problemes Systemiques (cross-domain)

### S1. Absence totale de tests
Detecte par : Testing, Security, Data Model, Performance
Impact : Toutes les fonctions financieres, les calculs de frequence, les generations mensuelles ne sont pas testees. C'est le risque #1 du projet.

### S2. Pas de validation des inputs
Detecte par : Security, Clean Code, Frontend
Impact : 40+ server actions acceptent n'importe quoi. Un appel malveillant ou un bug frontend peut corrompre les donnees.

### S3. Latence Neon amplifiee par les patterns sequentiels
Detecte par : Performance, Data Model, Architecture
Impact : Chaque `await sql` = un round-trip HTTP (20-50ms). Les boucles sequentielles multiplient cette latence. Le pattern est systemique — il faut un helper de batch.

### S4. God Components / God Files
Detecte par : Clean Code, Architecture, Frontend
Impact : 5 composants > 500L, 2 fichiers d'actions > 500L. La maintenabilite se degrade. Les bugs se cachent dans la complexite.

### S5. Structure layer-based au lieu de feature-based
Detecte par : Architecture, Clean Code
Impact : Tout est dans `lib/actions/`, `components/`, `lib/types.ts`. Pas de decouplage par feature. Tenable en alpha, problematique pour la croissance.

### S6. Inline styles comme approche principale
Detecte par : Frontend, Clean Code
Impact : 1355 inline styles = composants gonfles, pas de design system coherent, duplication, difficulte de maintenance.

---

## Points Positifs

Malgre les 170 findings, le projet a des fondations solides :

- **Auth consistante** : `requireAuth()` appele systematiquement sur toutes les server actions
- **Pas de SQL injection** : tagged template literals utilises partout
- **Pas d'IDOR** : toutes les queries scoped par `user_id`
- **Pas de XSS** : pas de contenu non-sanitise injecte dans le DOM
- **Pas de secrets hardcodes** : tout en env vars
- **CSRF gere** : server actions = POST par defaut
- **Pattern Template/Transaction** : modele de donnees coherent et bien pense
- **Server Actions** : pas d'API REST a securiser/maintenir separement
- **Conventions AF** : le projet suit un processus structure (backlog, stories, logs)

---

## Plan d'Action Recommande

### Sprint 1 (semaine 1-2) — Fondations
- [ ] Action 1 : Tests financiers (Vitest)
- [ ] Action 2 : Validation Zod
- [ ] Action 3 : Batch INSERTs
- [ ] Action 7 : Middleware + headers

### Sprint 2 (semaine 3-4) — Integrite
- [ ] Action 4 : Accessibilite critique
- [ ] Action 5 : Transactions DB
- [ ] Action 6 : Index FK
- [ ] Action 9 : Schema documentation

### Sprint 3 (semaine 5-8) — Qualite
- [ ] Action 8 : Decomposition God Components
- [ ] Action 10 : Migration Tailwind (progressif)

### Backlog futur
- Migration DECIMAL vers INTEGER cents (Data C1)
- Migration ENUM vers TEXT + CHECK (Data C2)
- Structure feature-based (Architecture H1)
- E2E tests Playwright
- Rate limiting
- ADR pour les decisions architecturales

---

## Fichiers des rapports detailles

| Rapport | Chemin |
|---------|--------|
| Clean Code | `.app-factory/docs/audits/2026-03-05-clean-code.md` |
| Architecture | `.app-factory/docs/audits/2026-03-05-architecture.md` |
| Securite | `.app-factory/docs/audits/2026-03-05-security.md` |
| Performance | `.app-factory/docs/audits/2026-03-05-performance.md` |
| Frontend | `.app-factory/docs/audits/2026-03-05-frontend.md` |
| Data Model | `.app-factory/docs/audits/2026-03-05-data-model.md` |
| Conventions | `.app-factory/docs/audits/2026-03-05-conventions.md` |
| Documentation | `.app-factory/docs/audits/2026-03-05-documentation.md` |
| Testing | `.app-factory/docs/audits/2026-03-05-testing.md` |
| **Consolide** | `.app-factory/docs/audits/2026-03-05-full-audit.md` |
