# AUDIT-004 — Add Zod validation schemas to all server actions

## Type
REFACTOR

## Severity
HAUTE

## Feature
audit-remediation

## Description
Les 40+ server actions acceptent des inputs TypeScript sans aucune validation runtime. Les types TypeScript sont effaces a l'execution — un client malveillant ou un bug frontend peut envoyer des montants negatifs, des strings vides, des champs inattendus. `createExpense` accepte `amount: number` sans verifier qu'il est positif. `updateMonthlyExpenseAmount` n'a aucune borne. C'est le finding le plus impactant de l'audit securite.

Les endpoints API (`/api/push/send`, `/api/push/subscribe`) acceptent egalement des payloads non valides.

## Acceptance Criteria
Given Zod n'est pas installe dans le projet
When le package `zod` est ajoute
Then il est disponible dans les dependances de production (pas devDependencies)

Given une server action de mutation (createExpense, createIncome, createDebt, etc.)
When elle recoit un montant negatif ou zero
Then elle retourne une erreur de validation AVANT tout acces DB

Given une server action de mutation
When elle recoit un nom vide ou depassant 255 caracteres
Then elle retourne une erreur de validation

Given `createExpense` recoit un `type` qui n'est pas dans ['RECURRING', 'ONE_TIME', 'PLANNED']
When l'action est executee
Then elle rejette l'input avec un message d'erreur clair

Given l'endpoint `/api/push/send`
When il recoit un `url` qui n'est pas un chemin relatif (ex: `https://evil.com`)
Then la requete est rejetee

Given l'endpoint `/api/push/subscribe`
When il recoit un `endpoint` qui n'est pas une URL HTTPS
Then la requete est rejetee

Given toutes les actions de mutation ont des schemas Zod
When les schemas sont utilises
Then les types TypeScript sont inferes des schemas (single source of truth)

Given le build passait avant cette story
When tous les changements sont appliques
Then le build passe et toutes les fonctionnalites existantes continuent de fonctionner (les inputs valides passent la validation)

## Technical Notes
- Installer `zod` comme dependance de production
- Creer `lib/schemas/` avec un fichier par domaine : `expense.ts`, `income.ts`, `debt.ts`, `allocation.ts`, `section.ts`, `card.ts`, `settings.ts`, `push.ts`
- Valider en entree de chaque server action avec `schema.parse(data)` ou `schema.safeParse(data)`
- Les schemas doivent couvrir : montants positifs, noms non-vides, enums valides, longueurs max
- Pour les API routes : valider le body avec Zod avant traitement
- Actions concernees (mutations) : toutes les fonctions `create*`, `update*`, `delete*`, `mark*`, `transfer*`, `defer*`, `reorder*`, `load*`, `clear*`, `set*`
- Audit findings addressed : Security-H1, Testing-H1, Frontend-M2, Security-M4, Security-M5, Security-L2, Clean Code S-03
- Dependencies : Aucune
- Non-regression : les inputs valides actuels doivent passer la validation. Tester avec les formulaires existants que tout fonctionne.

## Size
M
