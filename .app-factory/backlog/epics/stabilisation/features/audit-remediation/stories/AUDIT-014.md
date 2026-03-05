# AUDIT-014 — Fix documentation gaps (README, env-vars, overview, api-reference)

## Type
CHORE

## Severity
HAUTE

## Feature
audit-remediation

## Description
La documentation du projet a des lacunes significatives :
1. Le `README.md` est le boilerplate create-next-app non modifie
2. 3 variables d'environnement sont utilisees dans le code mais non documentees (`NEON_AUTH_BASE_URL`, `NEON_AUTH_COOKIE_SECRET`, `NEXT_PUBLIC_VAPID_PUBLIC_KEY`). `CRON_SECRET` est dans env-vars.md mais pas dans `.env.example`
3. L'endpoint `/api/cron/push` n'est pas documente dans `api-reference.md`
4. `overview.md` (vue 30,000 ft) n'existe pas
5. `product/current-state.md` n'existe pas
6. `implementation_log.md` (resume scannable) n'existe pas

## Acceptance Criteria
Given le README.md est le boilerplate Next.js
When il est remplace par un README specifique au projet
Then il contient : description du projet, stack, prerequisites, instructions de setup (clone, env vars, migrations, `npm run dev`), lien vers `.app-factory/docs/`

Given 3 env vars sont absentes de `env-vars.md` et `.env.example`
When les deux fichiers sont mis a jour
Then `NEON_AUTH_BASE_URL`, `NEON_AUTH_COOKIE_SECRET`, `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, et `CRON_SECRET` sont documentes dans les deux fichiers avec description et valeur d'exemple

Given l'endpoint `/api/cron/push` n'est pas dans `api-reference.md`
When le document est mis a jour
Then l'endpoint est documente avec : methode, URL, authentification (Bearer CRON_SECRET), frequence (cron daily), response format

Given `overview.md` n'existe pas
When il est cree dans `.app-factory/docs/`
Then il contient : objectif du projet, utilisateur cible, fonctionnalites cles, liens vers architecture.md et vision.md

Given `product/current-state.md` n'existe pas
When il est cree
Then il liste les features live avec leur statut (stable/partial), les problemes connus, et le niveau de maturite

Given le build passait avant cette story
When tous les changements sont appliques
Then le build passe (aucun changement de code)

## Technical Notes
- Fichiers a creer :
  - Remplacement de `README.md`
  - `.app-factory/docs/overview.md`
  - `.app-factory/docs/product/current-state.md`
  - `.app-factory/log/implementation_log.md`
- Fichiers a modifier :
  - `.app-factory/docs/infrastructure/env-vars.md` : ajouter les 3 vars manquantes
  - `.env.example` : ajouter les 4 vars manquantes
  - `.app-factory/docs/api-reference.md` : ajouter `/api/cron/push`
- Audit findings addressed : Documentation-H1, H2, H3, Documentation-M1, M2, M5, Conventions-M-003, M-002 (partiel), Security-M2
- Dependencies : Aucune
- Non-regression : aucun changement de code, zero risque de regression

## Size
S
