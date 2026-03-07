# AUDIT-003 — Review Design

**Reviewer:** af-reviewer
**Date:** 2026-03-05
**Story:** Extract calcDueDateForMonth from server action + write tests
**Level:** 2 (logique metier avec regles de frequence)
**Scope:** backend

---

## Verdict: APPROVED WITH NOTES

Zero CRITICAL, zero HIGH. Deux MEDIUM et un LOW.

Le design est solide, bien justifie, et retrocompatible. Les decisions D1-D4 sont correctes. Le plan de tests est adequat avec quelques lacunes mineures a combler.

---

## Findings

### MEDIUM

#### M-01 — CalcDueDateInput type accepts `string | null` au lieu de `RecurrenceFrequency | null`

**File:** design.md, section D2
**Skill:** `af-clean-code` § Nommage / Type safety
**Problem:** Le type propose `CalcDueDateInput` definit `recurrence_frequency: RecurrenceFrequency | string | null`. L'union avec `string` est justifiee dans le design par "backward compat avec les callers qui passent des strings brutes de la DB". Or, en regardant le code source (`monthly-expenses.ts` L131-143, L220-230), les callers castent deja les resultats SQL en types inline avec `string | null`. Accepter `string` dans un type exporte dilue la type safety — le Builder pourra passer n'importe quelle string sans erreur TS.

**Impact:** Un caller futur pourrait passer `"monthly"` (lowercase) ou `"SEMI_ANNUAL"` sans erreur de compilation. La fonction retournerait silencieusement `null` sans signal d'erreur.

**Fix:** Definir `recurrence_frequency: RecurrenceFrequency | null` dans `CalcDueDateInput`. Les callers qui ont des `string` brutes de la DB doivent caster en `RecurrenceFrequency` au point d'appel (ce qui est deja le pattern implicite actuel). Si le cast est trop lourd pour les callers debt, ajouter un overload ou un helper `toRecurrenceFrequency(s: string): RecurrenceFrequency | null` dans utils.ts.

---

#### M-02 — Test plan manque un cas pour `spread_monthly` (AC non couvert)

**File:** design.md, section 4.2 + story AC
**Skill:** `af-documentation` § finding format / `af-conventions` § acceptance criteria coverage
**Problem:** L'acceptance criterion 7 de la story exige : "Given le spread_monthly divise un montant QUARTERLY par 3 et YEARLY par 12, When les tests verifient la logique de spread, Then les montants sont corrects (100$ quarterly = 33.33$/mois)". Or le test plan section 4.2 ne contient AUCUN test couvrant `spread_monthly`. La section 4.3 mentionne explicitement que les tests de `generateMonthlyExpenses` sont hors scope.

Le design a raison que les sous-fonctions avec I/O sont hors scope des tests unitaires. Cependant, la story a un AC explicite sur `spread_monthly`. Deux options : (a) le test plan couvre `spread_monthly` differemment, ou (b) le Builder documente pourquoi cet AC est non testable dans le cadre de cette story (et cree une discovery pour un test d'integration futur).

**Impact:** AC non couvert = risque de validation PM echouee.

**Fix:** Ajouter dans le design une note explicite : "AC spread_monthly : la logique de spread est dans `generateRecurringInstances` (I/O), pas dans `calcDueDateForMonth` (pur). Elle sera testable quand un test d'integration avec mock DB sera disponible. Discovery recommandee." Le Builder doit creer une discovery AUDIT-003-D1 pour couvrir ce cas plus tard.

---

### LOW

#### L-01 — formatDueDate pourrait etre exporte pour reutilisation

**File:** design.md, section D4
**Skill:** `af-clean-code` § DRY
**Problem:** Le design note que `formatDueDate` reste dans utils.ts "(non exporte) ou est exporte si utilise ailleurs". Le meme pattern `YYYY-MM-DD` est aussi construit manuellement dans `generateMonthlyExpenses` L97 (`monthEnd`) et L156 (`syntheticDueDate`). Apres decomposition, ces sous-fonctions continueront a dupliquer ce pattern.

**Impact:** Mineur — duplication de connaissance (format de date ISO) entre `formatDueDate` et les sous-fonctions. Pas bloquant.

**Fix:** Exporter `formatDueDate` par defaut et l'utiliser aussi dans les sous-fonctions de `monthly-expenses.ts`. Decision a la discretion du Builder.

---

## Validation des 4 axes demandes

### 1. Architecture alignment — lib/utils.ts est le bon choix

**Verdict:** APPROUVE.

- `lib/utils.ts` contient deja `calcNextDueDate`, `calcMonthlyCost`, `toMonthKey`, `countBiweeklyPayDatesInMonth` — toutes des fonctions pures de calcul de dates/montants. `calcDueDateForMonth` est exactement dans la meme famille.
- Le fichier passe de ~262L a ~330L apres ajout — sous le seuil de 400L mentionne dans le design.
- Creer `lib/date-calc.ts` serait du YAGNI (la story AUDIT-013 planifie un split si necessaire).
- La direction de dependance est correcte : `lib/utils.ts` → `lib/types.ts` (types purs, pas de runtime). `lib/actions/monthly-expenses.ts` → `lib/utils.ts`. Pas de circulaire.

Conforme a `af-clean-architecture` § feature-based structure (niveau 1-2, pas de separation ports/adapters requise).

### 2. Backward compatibility — zero break

**Verdict:** APPROUVE.

- `calcDueDateForMonth` est actuellement une `function` non exportee (L19). Aucun import externe n'existe — seuls les deux appels internes (L171 pour recurring, L231 pour debts).
- La signature reste identique : `(expense: {...}, month: string) => string | null`. Les callers ne changent pas.
- L'import dans `monthly-expenses.ts` remplace simplement la definition locale. Le build TS validera la compatibilite.
- Aucune migration DB, aucun changement d'API. Zero risque de regression runtime.

### 3. Decomposition — sous-fonctions dans le meme fichier

**Verdict:** APPROUVE.

- Les 3 sous-fonctions (`generateRecurringInstances`, `generateOneTimeInstances`, `generateDebtPaymentInstances`) font du I/O (SQL). Elles ne sont PAS pures → elles n'ont rien a faire dans `lib/utils.ts`.
- Les garder dans le fichier `"use server"` est correct : elles sont des helpers internes de la server action `generateMonthlyExpenses`.
- Le refactoring est mecanique (couper/coller les blocs L100-195, L197-208, L210-250 dans des fonctions nommees). La logique ne change pas.
- `generateMonthlyExpenses` devient un orchestrateur lisible de ~15L, conforme a `af-clean-code` § Fonctions / patron de la fonction orchestratrice.

Conforme a `af-clean-code` § SRP (separation au niveau fonction) et `af-clean-architecture` § niveau 2 (pas de separation module requise).

### 4. Test plan — 17 tests adequats, avec une lacune

**Verdict:** APPROUVE avec reserve (voir M-02).

- 6 frequences couvertes avec happy path + edge cases = exhaustif pour la logique pure.
- Les cas de clampage (fevrier 28, fevrier 29 bissextile) sont presents.
- Le wrap decembre-janvier pour QUARTERLY (test 17) est un bon edge case.
- Le cas `freq=null` (test 16) couvre le fallback.
- Le cas `next_due_date` dans/hors du mois cible est couvert (tests 14-15).

**Lacune :** pas de test pour BIMONTHLY avec `next_due_date=null` (le code actuel L38 verifie `expense.next_due_date` pour le diff — que se passe-t-il si null?). Le Builder devrait ajouter un test #18 pour ce cas edge.

---

## Synthese

| Axe | Verdict | Notes |
|-----|---------|-------|
| Architecture (lib/utils.ts) | OK | Meme famille que calcNextDueDate, sous 400L |
| Backward compat | OK | Fonction privee, zero caller externe, signature identique |
| Decomposition | OK | I/O dans server action, pure dans utils — correct |
| Tests (17) | OK avec reserve | Ajouter cas BIMONTHLY next_due_date=null + noter AC spread_monthly hors scope |

**Le Builder peut implementer ce design.** Les findings M-01 et M-02 doivent etre adresses pendant le build ou documentes comme decisions conscientes.
