# AUDIT-005 — Batch INSERTs in generation functions

## Type
REFACTOR

## Severity
CRITIQUE

## Feature
audit-remediation

## Description
Les trois fonctions de generation (`generateMonthlyExpenses`, `generateMonthlyIncomes`, `generateMonthlyAllocations`) executent un INSERT par item dans une boucle `for...of` avec `await`. Pour un utilisateur avec 15 depenses recurrentes + 2 dettes, ca fait 17 round-trips HTTP sequentiels vers Neon serverless (20-50ms chacun) = 340-850ms de latence pure. Ces fonctions s'executent a chaque navigation vers `/` et `/depenses`.

Pattern identique dans `reorderSections`, `reorderAllocations` et `setAllocationSections`.

## Acceptance Criteria
Given `generateMonthlyExpenses` genere 15 depenses mensuelles
When la fonction est executee
Then elle utilise un seul INSERT multi-row (ou `Promise.all`) au lieu de 15 INSERTs sequentiels

Given `generateMonthlyIncomes` genere 3 revenus mensuels
When la fonction est executee
Then elle utilise un seul INSERT multi-row (ou `Promise.all`) au lieu de 3 INSERTs sequentiels

Given `generateMonthlyAllocations` genere 5 allocations mensuelles
When la fonction est executee
Then elle utilise un seul INSERT multi-row (ou `Promise.all`) au lieu de 5 INSERTs sequentiels

Given `reorderSections` reordonne 6 sections
When la fonction est executee
Then elle utilise un seul UPDATE (CASE expression) ou `Promise.all` au lieu de 6 UPDATEs sequentiels

Given `setAllocationSections` insere 3 liens allocation-section
When la fonction est executee
Then elle utilise un seul INSERT multi-row au lieu de 3 INSERTs sequentiels

Given le `ON CONFLICT` clause existe sur les INSERTs de generation
When le batch INSERT est execute
Then la clause ON CONFLICT est preservee (les doublons sont ignores)

Given le build passait avant cette story
When tous les changements sont appliques
Then le build passe, les donnees generees sont identiques, et la latence de page est reduite

## Technical Notes
- Fichiers a modifier : `lib/actions/monthly-expenses.ts`, `lib/actions/monthly-incomes.ts`, `lib/actions/allocations.ts`, `lib/actions/sections.ts`
- Approche recommandee : `Promise.all` pour la simplicite (chaque INSERT garde sa clause ON CONFLICT)
- Alternative : batch INSERT avec VALUES multiples (meilleur perf mais plus complexe)
- Aussi battre : `ensureDefaultSections` (claim.ts:72-77), `completeOnboarding` (onboarding.ts:71-77)
- Audit findings addressed : Performance-C1, C2, C3, Performance-H2, H3, Performance-L1, L2, Data-H5
- Dependencies : Aucune
- Non-regression : les donnees generees doivent etre identiques (memes colonnes, memes valeurs, meme logique ON CONFLICT). Verifier en naviguant sur `/`, `/depenses`, `/revenus`.

## Size
S
