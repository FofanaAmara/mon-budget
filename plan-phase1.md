# Plan — Phase 1 : MVP Opérationnel
**Projet** : Mon Budget PWA
**Phase PRD** : Phase 1 — "Aujourd'hui"
**Date** : 26 février 2026
**Statut** : En attente de validation

---

## Executive Summary

**En bref** :
- Construire le MVP complet de zéro : infrastructure, base de données, UI, CRUD dépenses + sections + cartes, dashboard, notifications push locales, PWA installable
- Stack : Next.js 15 App Router + Tailwind + Supabase PostgreSQL + Vercel
- Livrable : app MVP déployée sur Vercel, testée E2E avec Playwright, installable sur iPhone

**Contexte** : Le projet n'existe pas encore. Cette phase pose toutes les fondations techniques et livre les fonctionnalités core du PRD Phase 1.

**Objectif** : App fonctionnelle sur Vercel où Amara peut gérer ses dépenses récurrentes et ponctuelles par section, voir un dashboard consolidé, recevoir des push locaux et installer l'app sur iPhone.

**Approche** : Exécution séquentielle en 6 étapes internes (setup → DB → UI shell → CRUD → dashboard → push + PWA), tests Playwright sur Vercel en clôture.

**Impact** : Création de ~35 fichiers, 0 fichier existant modifié.

---

## Current State

**Description** : Le projet n'existe pas en tant que code.

- Seul artefact : `prd-budget-tracker.md` (source de vérité)
- Aucun code, aucun service provisionné, aucun déploiement
- Git initialisé sur `main`, aucun commit

**Artefacts actuels** :
- `prd-budget-tracker.md`

---

## Future State

**Description** : MVP déployé sur Vercel, 100% fonctionnel, testé Playwright.

**Critères mesurables** :
- CRUD sections : créer, renommer, réordonner, supprimer — persisté Supabase
- CRUD cartes : créer, modifier, supprimer — persisté Supabase
- CRUD dépenses récurrentes et ponctuelles : tous les champs du PRD, `next_due_date` calculée correctement
- Dashboard : prochaines dépenses (7 jours) + total mensuel par section + alertes dépenses manuelles
- Notification push locale reçue sur device lors d'un test manuel
- App installable sur iOS 16.4+ (manifest + service worker valides)
- `npx playwright test` : 100% vert sur l'URL Vercel de production

**Livrables attendus** :
- Projet Next.js 15 complet dans le répertoire courant
- `supabase/schema.sql` + `supabase/seed.sql` appliqués en production
- `public/manifest.json` + `public/sw.js`
- `tests/` — suite Playwright Phase 1
- App déployée sur Vercel avec toutes les env vars

---

## Gap Analysis

| # | Gap | État actuel | État cible | Comment combler |
|---|-----|-------------|------------|-----------------|
| 1 | Projet Next.js | Inexistant | Next.js 15 + Tailwind + TypeScript configurés | `create-next-app` + config |
| 2 | Base de données | Inexistante | Supabase : tables Section, Card, Expense + RLS + seed | Schema SQL + Supabase project |
| 3 | Déploiement | Inexistant | Vercel project, CI/CD automatique, env vars | `vercel link` + env vars |
| 4 | PWA shell | Inexistant | Manifest + SW + installable iOS | manifest.json + sw.js + next-pwa |
| 5 | Navigation & UI | Inexistante | Layout mobile-first, bottom nav, design system | layout.tsx + composants Tailwind |
| 6 | Gestion sections | Inexistante | CRUD complet + réordonnancement persisté | Pages + Server Actions Supabase |
| 7 | Gestion cartes | Inexistante | CRUD complet | Pages + Server Actions Supabase |
| 8 | Gestion dépenses | Inexistante | CRUD récurrentes + ponctuelles, next_due_date correcte | Formulaire + Server Actions + logique date |
| 9 | Dashboard | Inexistant | Prochaines dépenses 7j + total par section + alertes | Page dashboard + queries agrégées |
| 10 | Push notifications | Inexistant | Permission accordée → push reçu sur device | VAPID + SW push listener + /api/push |
| 11 | Tests Playwright | Inexistants | Suite E2E Phase 1, 100% verte sur Vercel | `tests/phase1/` + playwright.config.ts |

---

## Impact Analysis

### Fichiers à créer

| Fichier | Type | Raison |
|---|---|---|
| `package.json` | CREATE | Dépendances projet |
| `next.config.ts` | CREATE | Config Next.js + PWA |
| `tailwind.config.ts` | CREATE | Tokens design |
| `.env.local` / `.env.example` | CREATE | Variables d'environnement |
| `vercel.json` | CREATE | Config Vercel (Phase 1 : sans cron) |
| `supabase/schema.sql` | CREATE | Tables Section, Card, Expense, Settings, Notification_Log |
| `supabase/seed.sql` | CREATE | 6 sections par défaut + Settings singleton |
| `public/manifest.json` | CREATE | PWA manifest |
| `public/sw.js` | CREATE | Service Worker (cache + push listener) |
| `app/layout.tsx` | CREATE | Root layout + SW registration |
| `app/page.tsx` | CREATE | Dashboard |
| `app/sections/page.tsx` | CREATE | Liste + CRUD sections |
| `app/cartes/page.tsx` | CREATE | Liste + CRUD cartes |
| `app/depenses/page.tsx` | CREATE | Liste dépenses par section |
| `app/depenses/[id]/edit/page.tsx` | CREATE | Formulaire édition |
| `app/api/push/subscribe/route.ts` | CREATE | Enregistrement subscription push |
| `app/api/push/send/route.ts` | CREATE | Envoi push (Node.js runtime) |
| `lib/supabase/server.ts` | CREATE | Client SSR |
| `lib/supabase/client.ts` | CREATE | Client browser |
| `lib/database.types.ts` | CREATE | Types TypeScript générés depuis schema |
| `lib/utils.ts` | CREATE | formatCAD, formatDate, calcNextDueDate, calcMonthlyCost |
| `lib/push.ts` | CREATE | Helpers Web Push VAPID |
| `components/BottomNav.tsx` | CREATE | Navigation PWA |
| `components/ExpenseForm.tsx` | CREATE | Formulaire dépense complet |
| `components/ui/` | CREATE | Button, Card, Input, Select, Badge, Modal, ProgressBar |
| `tests/phase1/*.spec.ts` | CREATE | 10 tests Playwright |
| `playwright.config.ts` | CREATE | Config pointant sur URL Vercel |

### Dépendances externes à provisionner

| Service | Action requise | Clés nécessaires |
|---|---|---|
| Supabase | Créer projet free | `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY` |
| Vercel | Créer projet, lier repo | Auto (via `vercel link`) |
| VAPID | Générer clés | `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_EMAIL` |

### Blast Radius

**Niveau** : MEDIUM — nouveau projet, aucun code existant à casser. Risque principal : intégration Supabase RLS + Web Push en production.

---

## Scope Boundaries

### IN SCOPE (Phase 1 uniquement)
1. **Setup complet** : Next.js 15, Tailwind, TypeScript, Vercel, Supabase, VAPID
2. **CRUD Sections** : créer, renommer, réordonner, supprimer (avec icône emoji)
3. **CRUD Cartes** : créer, modifier, supprimer (nom + last_four + type)
4. **CRUD Dépenses** : types RECURRING et ONE_TIME uniquement — tous les champs PRD, `next_due_date` calculée
5. **Dashboard** : prochaines dépenses 7 jours + total mensuel par section + alertes manuelles
6. **Web Push** : permission + subscription + envoi depuis `/api/push/send`
7. **PWA** : manifest + service worker + installable iOS 16.4+
8. **Tests Playwright** sur URL Vercel prod (10 tests)

### OUT OF SCOPE (reporté Phase 2 ou 3)
1. ~~Revenus / "reste à vivre"~~ → Phase 2
2. ~~Notifications email (Resend) et SMS (Twilio)~~ → Phase 2
3. ~~Cron Vercel automatique~~ → Phase 2
4. ~~Vue dédiée par carte~~ → Phase 2
5. ~~Type de dépense PLANNED~~ → Phase 3
6. ~~Historique / tendances~~ → Phase 3
7. ~~Export de données~~ → Phase 3
8. ~~Mode sombre~~ → hors scope PRD

### Critères d'arrêt (scope creep)
- [ ] Tâche non listée > 30 min découverte → documenter, ne pas faire
- [ ] Envie d'"améliorer" hors scope → ignorer
- [ ] Bug non lié trouvé → noter, continuer

---

## Assumptions

| Hypothèse | Risque si fausse | Comment valider |
|---|---|---|
| Supabase free tier suffisant pour MVP (500MB, 50K req/mois) | App lente en prod | Dashboard Supabase → surveiller usage |
| `web-push` compatible Node.js runtime Vercel (pas Edge) | Build échoue | Forcer `export const runtime = 'nodejs'` sur /api/push |
| iOS 16.4+ disponible pour push PWA | Push non reçu sur iPhone | Tester sur device réel en Phase 7 |
| Vercel free tier sans limitation bloquante pour Phase 1 (pas de cron) | Deploy fail | Pas de cron en Phase 1 → pas de risque |
| Next.js 15 LTS stable avec App Router + Server Actions | Bugs framework | Utiliser version LTS publiée, pas canary |
| RLS Supabase configuré en "accès total pour anon" (app mono-user sans auth) | Données invisibles | Tester query anon immédiatement après setup |

---

## Pre-Mortem

> "On est dans 5 jours. Le MVP n'est pas livré. Pourquoi ?"

| Scénario | Probabilité | Impact | Prévention |
|---|---|---|---|
| Variables d'env manquantes sur Vercel → build fail | HAUTE | Bloquant | Créer `.env.example` exhaustif dès l'étape 0, checklist avant chaque deploy |
| RLS Supabase mal configuré → tables vides en prod | HAUTE | App inutilisable | Tester chaque query depuis client anon juste après création |
| Web Push non fonctionnel sur iOS (SW non enregistré) | MOYENNE | Feature manquante | Tester SW registration tôt (Phase 2 interne) |
| `next_due_date` calculée incorrectement → dashboard faux | MOYENNE | Données fausses | Tests unitaires inline sur `calcNextDueDate` + test Playwright |
| Formulaire dépense trop complexe → bugs UX | FAIBLE | Expérience dégradée | Tests Playwright sur tous les cas du formulaire |
| `web-push` en Edge Runtime → erreur à la volée | MOYENNE | Push cassé | Ajouter `export const runtime = 'nodejs'` systématiquement sur les routes push |

---

## Rollback Strategy

| Situation | Action |
|---|---|
| Fichier cassé en cours d'édition | `git checkout -- <fichier>` |
| Étape entière à défaire | `git stash` → reprendre depuis checkpoint |
| Commit problématique (local) | `git reset --soft HEAD~1` |
| Deploy Vercel cassé | Promouvoir le deploy précédent (Vercel Dashboard) |
| Schema Supabase mal appliqué | Exécuter SQL de rollback dans Supabase SQL Editor |

**Fichiers critiques** : `.env.local` — jamais commité (dans `.gitignore`).

---

## Implementation Plan

### Étape 1 — Project Bootstrap
**Objectif** : Projet Next.js fonctionnel, dépendances installées, repo git prêt.

| # | Tâche | Dépend de | Validation |
|---|-------|-----------|------------|
| 1.1 | `npx create-next-app@latest` avec TypeScript + Tailwind + App Router + ESLint + `src/` désactivé | — | `npm run dev` → localhost:3000 fonctionne |
| 1.2 | Installer dépendances : `@supabase/supabase-js @supabase/ssr web-push @types/web-push` | 1.1 | `npm run build` passe sans erreur |
| 1.3 | Installer Playwright : `npm init playwright@latest` + config `playwright.config.ts` | 1.1 | `npx playwright test --list` fonctionne |
| 1.4 | Générer clés VAPID : `npx web-push generate-vapid-keys` | — | 2 clés générées |
| 1.5 | Créer `.env.local` (toutes les vars) + `.env.example` + `.gitignore` entry | 1.4 | `.env.local` exclu du git |
| 1.6 | Configurer `tailwind.config.ts` : palette couleurs budget (bleu #2563EB, vert #16A34A, rouge #DC2626), font Inter | 1.1 | Classes custom disponibles |
| 1.7 | Premier commit : `chore: bootstrap Next.js 15 project` | 1.6 | `git log --oneline` → 1 commit |

**Checkpoint** : `npm run build` ✅ — `npm run lint` 0 erreur ✅

---

### Étape 2 — Base de données Supabase
**Objectif** : Schéma complet appliqué, seed présent, client configuré, types générés.

| # | Tâche | Dépend de | Validation |
|---|-------|-----------|------------|
| 2.1 | Écrire `supabase/schema.sql` : tables `sections`, `cards`, `expenses`, `settings`, `notification_log` + FK + contraintes + index | — | SQL syntaxiquement valide |
| 2.2 | Appliquer `schema.sql` dans Supabase SQL Editor | 2.1 | 5 tables visibles dans Table Editor |
| 2.3 | Configurer RLS : policies `ALL` pour `anon` sur chaque table | 2.2 | Query `SELECT * FROM sections` depuis client anon → fonctionne |
| 2.4 | Écrire + appliquer `supabase/seed.sql` : 6 sections par défaut + settings singleton | 2.3 | 6 lignes `sections`, 1 ligne `settings` |
| 2.5 | Créer `lib/supabase/server.ts` (cookies SSR) + `lib/supabase/client.ts` (browser) | 2.3 | Import TypeScript sans erreur |
| 2.6 | Générer `lib/database.types.ts` depuis schema | 2.2 | Types `Section`, `Card`, `Expense` disponibles |

**Checkpoint** : Query depuis Server Component Next.js retourne les 6 sections ✅

---

### Étape 3 — UI Shell & PWA
**Objectif** : Layout, navigation, design system, manifest, service worker.

| # | Tâche | Dépend de | Validation |
|---|-------|-----------|------------|
| 3.1 | `app/layout.tsx` : HTML shell, meta PWA, font Inter, enregistrement SW, viewport mobile | Étape 1 | Page s'affiche correctement |
| 3.2 | `public/manifest.json` : name "Mon Budget", icons (192+512), display standalone, theme #2563EB, start_url "/" | 3.1 | Chrome DevTools Application → manifest valide |
| 3.3 | `public/sw.js` : cache shell (app shell strategy), listener `push` → `showNotification` | 3.2 | SW visible dans DevTools Application > Service Workers |
| 3.4 | Composants UI de base dans `components/ui/` : `Button`, `Card`, `Input`, `Select`, `Badge`, `Modal`, `ProgressBar`, `EmptyState` | Étape 1 | Composants importables sans erreur TypeScript |
| 3.5 | `components/BottomNav.tsx` : 5 onglets (Dashboard `/`, Dépenses `/depenses`, Sections `/sections`, Cartes `/cartes`, Réglages `/parametres`) avec icônes SVG inline | 3.1 | Navigation cliquable, route active mise en valeur |
| 3.6 | `components/NotificationPermission.tsx` : bouton "Activer les notifications" → `Notification.requestPermission()` → POST `/api/push/subscribe` | 3.3 | Permission accordée → subscription stockée Supabase |
| 3.7 | Page 404 custom (`app/not-found.tsx`) + error boundary (`app/error.tsx`) | 3.1 | Route inconnue → 404 propre |

**Checkpoint** : App mobile-first (375px) ✅ — Navigation entre onglets ✅ — SW enregistré ✅ — Manifest valide ✅

---

### Étape 4 — CRUD Sections, Cartes
**Objectif** : Gestion des entités de configuration avant les dépenses.

| # | Tâche | Dépend de | Validation |
|---|-------|-----------|------------|
| 4.1 | `app/sections/page.tsx` : liste des sections avec icône, nom, sous-total (0$ initialement), boutons réordonnement | Étape 2, 3 | 6 sections par défaut affichées |
| 4.2 | Server Actions `lib/actions/sections.ts` : `createSection`, `updateSection`, `deleteSection`, `reorderSections` | 4.1 | CRUD persisté sans rechargement de page |
| 4.3 | Modal création/édition section : champ nom + picker emoji simple (liste fixe 20 emojis pertinents) | 4.2 | Créer "🏋️ Sport" → apparaît dans la liste |
| 4.4 | `app/cartes/page.tsx` : liste des cartes (nom, `***XXXX`, badge type Visa/MC/Amex) | Étape 3 | Page accessible depuis nav |
| 4.5 | Server Actions `lib/actions/cards.ts` : `createCard`, `updateCard`, `deleteCard` | 4.4 | CRUD cartes fonctionnel |
| 4.6 | Modal création/édition carte : nom + last_four (4 chiffres max) + select type | 4.5 | Ajouter "Visa Desjardins ***4532" → visible |
| 4.7 | Confirmation suppression section/carte si des dépenses y sont rattachées | 4.2, 4.5 | Warning avant suppression + blocage si dépenses liées |

**Checkpoint** : CRUD sections ✅ — CRUD cartes ✅ — Réordonnancement sections persisté ✅

---

### Étape 5 — CRUD Dépenses (Récurrentes + Ponctuelles)
**Objectif** : Cœur du MVP — gestion des dépenses avec calcul de next_due_date.

| # | Tâche | Dépend de | Validation |
|---|-------|-----------|------------|
| 5.1 | `lib/utils.ts` : `calcNextDueDate(type, recurrence, recurrenceDay, dueDate)` → retourne la prochaine date d'échéance | — | Tests inline : mensuel le 5 → date correcte |
| 5.2 | `lib/utils.ts` : `calcMonthlyCost(expense)` → normalise tout en CAD mensuel (hebdo×52/12, annuel÷12) | — | Tests inline : annuel 1200$ → 100$/mois |
| 5.3 | `components/ExpenseForm.tsx` : formulaire complet — nom, montant, devise (CAD/USD), type (RECURRING/ONE_TIME), section (select), récurrence (si RECURRING), date, prélèvement auto (oui/non), carte (si auto), notes, reminder_offsets (multi-select J-7/J-3/J-1), canaux push/email/sms | 5.1 | Formulaire s'affiche, champs conditionnels correctement affichés |
| 5.4 | `app/depenses/page.tsx` : liste toutes dépenses, groupées par section, avec montant + next_due_date + badge type | Étape 2, 3, 5.3 | Page se charge, 0 dépense initialement |
| 5.5 | Server Action `createExpense` : validation + insertion + calcul `next_due_date` | 5.3, 5.4 | Dépense créée, visible dans la liste |
| 5.6 | Server Actions `updateExpense` + `deleteExpense` | 5.5 | Modifier montant → persisté. Supprimer → disparu |
| 5.7 | `app/depenses/[id]/edit/page.tsx` : formulaire pré-rempli avec données existantes | 5.6 | Toutes les valeurs correctement pré-remplies |
| 5.8 | Bouton "+" flottant (FAB) sur `/depenses` et sur le dashboard → ouvre `ExpenseForm` en modal | 5.5 | Dépense ajoutée depuis le "+" en < 30 secondes |

**Checkpoint** : Créer dépense récurrente mensuelle le 5 → `next_due_date` correcte ✅ — Modifier ✅ — Supprimer ✅ — `calcMonthlyCost` correct ✅

---

### Étape 6 — Dashboard
**Objectif** : Écran principal avec vue consolidée des dépenses du mois.

| # | Tâche | Dépend de | Validation |
|---|-------|-----------|------------|
| 6.1 | Query `getMonthlyExpenses()` : toutes les dépenses actives avec `monthly_cost` calculé | Étape 5 | Retourne liste correcte |
| 6.2 | Widget "Total mensuel par section" : liste des sections avec leur sous-total + barre proportionnelle | 6.1 | Montants corrects, barres proportionnelles |
| 6.3 | Widget "Prochaines dépenses (7 jours)" : dépenses dont `next_due_date` ≤ aujourd'hui + 7j, triées par date | 6.1 | Liste correcte |
| 6.4 | Widget "Alertes" : sous-ensemble des 7 jours = dépenses non auto-chargées → badge rouge "Action requise" | 6.3 | Seules les dépenses manuelles en alerte |
| 6.5 | En-tête dashboard : total dépenses du mois (sans revenus — Phase 2), nombre de dépenses actives | 6.1 | Chiffres corrects |
| 6.6 | Bouton "+" flottant sur le dashboard → ExpenseForm en modal | Étape 5 | Ajout dépense < 30 secondes depuis dashboard |
| 6.7 | `app/parametres/page.tsx` : page settings minimale Phase 1 — devise par défaut + délais rappels par défaut + canaux par défaut (sans email/SMS pour l'instant) | Étape 2 | Settings sauvegardés, persistés |

**Checkpoint** : Dashboard avec vraies données ✅ — Alertes correctes ✅ — "+" fonctionnel ✅

---

### Étape 7 — Web Push & PWA Final
**Objectif** : Notifications push fonctionnelles, app installable sur iPhone.

| # | Tâche | Dépend de | Validation |
|---|-------|-----------|------------|
| 7.1 | Ajouter table `push_subscriptions` dans Supabase : `id`, `endpoint`, `p256dh`, `auth`, `created_at` | Étape 2 | Table visible |
| 7.2 | `app/api/push/subscribe/route.ts` (Node.js runtime) : reçoit subscription JSON → upsert dans `push_subscriptions` | 7.1 | POST → 200, subscription stockée |
| 7.3 | `app/api/push/send/route.ts` (Node.js runtime) : lit `push_subscriptions`, envoie push via `web-push.sendNotification` | 7.2 | Appel manual → notification reçue sur device |
| 7.4 | Intégrer `NotificationPermission` dans le dashboard (banner au premier chargement si pas encore souscrit) | Étape 3 (3.6) | Banner visible, permission accordée, push fonctionnel |
| 7.5 | Générer et placer icônes PWA : 192x192 + 512x512 PNG dans `public/icons/` | — | Icons référencées dans manifest.json |
| 7.6 | Vérifier installabilité PWA : Lighthouse PWA audit → score ≥ 90 | 7.5 | Score confirmé via Lighthouse |

**Checkpoint** : Push reçu sur device ✅ — Lighthouse PWA ≥ 90 ✅ — Installable sur iOS simulateur ou device ✅

---

### Étape 8 — Tests Playwright E2E sur Vercel
**Objectif** : Suite de tests complète, 100% verte, sur l'URL Vercel de production.

| # | Test | Ce qui est vérifié |
|---|------|---------------------|
| 8.1 | `test-setup.spec.ts` | URL Vercel accessible (HTTP 200), titre correct, manifest accessible |
| 8.2 | `test-navigation.spec.ts` | 5 onglets bottom nav fonctionnels, responsive 375px, 404 propre |
| 8.3 | `test-sections.spec.ts` | Créer section "🏋️ Sport", la renommer, la réordonner, la supprimer |
| 8.4 | `test-cartes.spec.ts` | Créer "Visa Desjardins ***4532", modifier, supprimer |
| 8.5 | `test-expense-recurring.spec.ts` | Créer dépense récurrente mensuelle → next_due_date correcte → visible dans la liste |
| 8.6 | `test-expense-onetime.spec.ts` | Créer dépense ponctuelle dans 3 jours → apparaît dans widget "7 jours" du dashboard |
| 8.7 | `test-expense-edit.spec.ts` | Modifier montant d'une dépense → persisté après rechargement |
| 8.8 | `test-dashboard.spec.ts` | Dashboard se charge, 4 widgets présents, totaux corrects après ajout dépense |
| 8.9 | `test-quick-add.spec.ts` | Chronomètre ajout dépense via FAB "+" → completed < 30 secondes |
| 8.10 | `test-pwa.spec.ts` | Manifest JSON valide, SW enregistré, Lighthouse PWA ≥ 90 |

**Checkpoint Final Phase 1** : `npx playwright test` → **10/10 ✅** sur URL Vercel prod. Rapport HTML généré.

---

## Success Criteria

**Par étape** :
- Étape 1 : `npm run build` ✅, `npm run lint` 0 erreur ✅
- Étape 2 : 6 sections en base, RLS fonctionnel ✅
- Étape 3 : PWA manifest valide, SW enregistré ✅
- Étape 4 : CRUD sections + cartes persisté ✅
- Étape 5 : CRUD dépenses, `next_due_date` correcte ✅
- Étape 6 : Dashboard avec vraies données ✅
- Étape 7 : Push reçu, Lighthouse PWA ≥ 90 ✅
- Étape 8 : **10/10 tests Playwright verts sur Vercel** ✅

**Critères PRD Phase 1** :
- [ ] CRUD dépenses récurrentes + ponctuelles avec sections — ✅
- [ ] Gestion des cartes de paiement — ✅
- [ ] Dashboard : prochaines dépenses + total mensuel par section — ✅
- [ ] Notifications push locales (PWA) — ✅
- [ ] Installable sur iPhone — ✅

---

## Testing Strategy

| Type | Ce qui est testé | Comment | Quand |
|---|---|---|---|
| Build | Compilation TypeScript sans erreur | `npm run build` | Fin de chaque étape |
| Lint | 0 erreur ESLint | `npm run lint` | Fin de chaque étape |
| Unitaire (inline) | `calcNextDueDate`, `calcMonthlyCost`, `formatCAD` | Tests inline dans `lib/utils.ts` | Étape 5 |
| Intégration Supabase | RLS, queries, seed | Manuellement via SQL Editor + logs Next.js | Étape 2 |
| Intégration Push | Push reçu sur device | Appel manuel `/api/push/send` | Étape 7 |
| E2E Playwright | Tous les flux MVP | `npx playwright test` sur URL Vercel | Étape 8 (final) |
| PWA | Manifest + SW + Lighthouse | Lighthouse CLI + DevTools | Étape 7 + 8.10 |
| Responsive | 375px mobile, 768px tablet | Playwright viewport | Test 8.2 |

---

*Point de retour vers Amara : uniquement après 10/10 tests Playwright verts sur l'URL Vercel de production.*
