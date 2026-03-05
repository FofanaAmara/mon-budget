# AUDIT-003 — Extract calcDueDateForMonth from server action + write tests

## Type
REFACTOR

## Severity
CRITIQUE

## Feature
audit-remediation

## Description
La fonction `calcDueDateForMonth` (69 lignes) est une fonction pure emprisonnee dans un fichier `"use server"` (`monthly-expenses.ts:13-82`). Elle contient la logique complexe de calcul de dates d'echeance pour 6 types de frequence. C'est le coeur du pattern Template/Transaction — elle determine quand chaque depense est generee. Elle est actuellement non testable car elle ne peut pas etre importee dans un fichier de test sans importer le contexte serveur.

De plus, `generateMonthlyExpenses` (162 lignes) melange 3 responsabilites : generation des recurrentes, des ponctuelles, et des paiements de dettes.

## Acceptance Criteria
Given `calcDueDateForMonth` est dans `lib/actions/monthly-expenses.ts`
When elle est extraite vers `lib/utils.ts` (ou un module dedie)
Then elle est importable dans un fichier de test sans erreur "use server"

Given `calcDueDateForMonth` est extraite
When des tests couvrent chaque frequence (MONTHLY, BIMONTHLY, QUARTERLY, YEARLY, WEEKLY, BIWEEKLY)
Then chaque cas retourne la date attendue

Given une frequence MONTHLY avec jour 31
When le mois cible est fevrier (28 jours)
Then la date est clampee au 28 (ou 29 en annee bissextile)

Given une frequence BIMONTHLY
When le mois cible est un mois "skip" (pas dans le pattern d'alternance)
Then la fonction retourne null (pas de generation ce mois)

Given une frequence QUARTERLY
When le mois cible est a 2 mois de la reference
Then la fonction retourne null (generation tous les 3 mois seulement)

Given une frequence YEARLY
When le mois cible ne correspond pas au mois de reference
Then la fonction retourne null

Given le spread_monthly divise un montant QUARTERLY par 3 et YEARLY par 12
When les tests verifient la logique de spread
Then les montants sont corrects (100$ quarterly = 33.33$/mois)

Given `generateMonthlyExpenses` a 3 responsabilites
When elle est refactorisee
Then elle est decomposee en sous-fonctions (generateRecurringInstances, generateOneTimeInstances, generateDebtPaymentInstances)

Given le build passait avant cette story
When tous les changements sont appliques
Then le build passe, les fonctionnalites de generation sont identiques, et tous les tests passent

## Technical Notes
- Extraire `calcDueDateForMonth` de `lib/actions/monthly-expenses.ts` vers `lib/utils.ts` ou `lib/date-calc.ts`
- Conserver l'import dans `monthly-expenses.ts` pour backward compatibility
- Decomposer `generateMonthlyExpenses` en 3 sous-fonctions (Clean Code H-05, M-07)
- Fichier de test : `__tests__/unit/calc-due-date.test.ts`
- ~15 tests : 6 frequences x happy path + edge cases (day clamping, skip months, leap year)
- Audit findings addressed : Testing-C3, Clean Code H-05, M-07, Architecture H-4 (partiel)
- Dependencies : AUDIT-001 (Vitest installe)
- Non-regression : la generation mensuelle doit produire exactement les memes resultats qu'avant. Verifier avec les donnees existantes.

## Size
M
