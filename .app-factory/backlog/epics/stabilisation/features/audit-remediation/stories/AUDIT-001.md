# AUDIT-001 — Install Vitest + configure test infrastructure

## Type
CHORE

## Severity
CRITIQUE

## Feature
audit-remediation

## Description
Le projet n'a aucun framework de test unitaire. Aucun fichier de test, aucune configuration, aucun script npm. L'audit Testing a identifie 4 findings CRITICAL et 5 HIGH, tous lies a l'absence totale de tests. Cette story installe l'infrastructure de base pour que les stories suivantes puissent ecrire des tests.

## Acceptance Criteria
Given le projet n'a pas de framework de test
When Vitest est installe et configure
Then `npm test` execute Vitest sans erreur (0 tests, 0 failures)

Given Vitest est configure
When les path aliases du tsconfig.json sont utilises dans un fichier de test (ex: `import { formatCAD } from '@/lib/utils'`)
Then l'import se resout correctement

Given le projet a un fichier de test de base
When `npm run test:coverage` est execute
Then un rapport de couverture est genere

Given la configuration est en place
When un test trivial existe (ex: `toMonthKey` ou `currentMonth`)
Then il passe et confirme que l'infrastructure fonctionne

Given le build passait avant cette story
When tous les changements sont appliques
Then le build passe toujours avec zero regressions

## Technical Notes
- Packages a installer : `vitest`, `@vitest/coverage-v8`
- Creer `vitest.config.ts` avec les path aliases de `tsconfig.json`
- Ajouter `"test": "vitest"` et `"test:coverage": "vitest run --coverage"` dans package.json
- Creer un fichier `__tests__/unit/utils.test.ts` avec 2-3 tests triviaux (`toMonthKey`, `currentMonth`, `formatCAD`)
- Audit findings addressed : Testing-M1, Testing-L2
- Dependencies : Aucune
- Non-regression : le build (`npm run build`) doit passer, l'app fonctionne identiquement

## Size
S
