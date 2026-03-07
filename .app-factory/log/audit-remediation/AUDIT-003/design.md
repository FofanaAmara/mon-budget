# AUDIT-003 — Design technique

**Story:** Extract calcDueDateForMonth from server action + write tests
**Level:** 2 (logique metier avec regles de frequence)
**Scope:** backend
**Date:** 2026-03-05

---

## 1. Analyse du code source

### 1.1 `calcDueDateForMonth` (L19-88 de monthly-expenses.ts)

Fonction pure de 69 lignes, actuellement `function` (non exportee) dans un fichier `"use server"`. Elle prend un objet expense minimal `{ recurrence_frequency, recurrence_day, next_due_date }` et un mois `"YYYY-MM"`, et retourne soit une date ISO `"YYYY-MM-DD"` soit `null`.

**Logique par frequence :**
1. Si `next_due_date` tombe dans le mois cible, retourne `next_due_date` directement
2. BIMONTHLY : calcule le diff en mois depuis la reference, skip si impair
3. YEARLY : skip si `monthNum !== refMonth`
4. QUARTERLY : skip si `diff % 3 !== 0` (modulo positif)
5. MONTHLY : genere toujours avec clampage du jour
6. WEEKLY/BIWEEKLY : retourne le 1er du mois (fallback)

**Callers internes :**
- `generateMonthlyExpenses` L171 (pour les RECURRING)
- `generateMonthlyExpenses` L231 (pour les DEBT payments)

### 1.2 `generateMonthlyExpenses` (L91-253)

162 lignes, 3 responsabilites melangees :
- **Recurring instances** (L100-195) : fetch + loop avec spread_monthly + calcDueDateForMonth + insert
- **One-time instances** (L197-208) : fetch + insert
- **Debt payment instances** (L210-250) : fetch + loop avec calcDueDateForMonth + insert

### 1.3 `lib/utils.ts` — structure existante

Contient deja des fonctions de calcul de dates : `calcNextDueDate`, `calcMonthlyCost`, `toMonthKey`, `countBiweeklyPayDatesInMonth`, `daysUntil`. Toutes sont des fonctions pures exportees. Le fichier fait ~262 lignes.

---

## 2. Decisions de design

### D1 — Destination : `lib/utils.ts` (pas `lib/date-calc.ts`)

**Choix :** Extraire `calcDueDateForMonth` dans `lib/utils.ts`.

**Rationale :**
- `lib/utils.ts` contient deja `calcNextDueDate` (meme domaine : calcul de dates d'echeance pour recurrences)
- Creer `lib/date-calc.ts` fragmenterait les fonctions de calcul de dates entre deux fichiers sans raison suffisante (YAGNI)
- Le fichier utils.ts reste sous 300 lignes apres ajout (~70 lignes) — acceptable
- La story AUDIT-013 planifie une reorganisation plus profonde plus tard ; pas besoin d'anticiper ici

**Note :** Si utils.ts depasse 400 lignes a l'avenir, AUDIT-013 pourra extraire un module `lib/date-utils.ts` regroupant toutes les fonctions de dates.

### D2 — Type d'input pour `calcDueDateForMonth`

**Choix :** Definir un type `CalcDueDateInput` dans `lib/types.ts` plutot que l'inline object actuel.

```typescript
export type CalcDueDateInput = {
  recurrence_frequency: RecurrenceFrequency | string | null;
  recurrence_day: number | null;
  next_due_date: string | null;
};
```

**Rationale :** La fonction est appelee avec deux shapes differentes (expense et debt). Un type nomme rend l'API claire et testable. Le type accepte `string | null` en plus de `RecurrenceFrequency` pour backward compat avec les callers qui passent des strings brutes de la DB.

### D3 — Decomposition de `generateMonthlyExpenses`

**Choix :** Extraire 3 sous-fonctions **dans le meme fichier** `monthly-expenses.ts` (pas dans utils.ts).

**Rationale :**
- Ces fonctions font du I/O (SQL queries + inserts) — elles ne sont PAS pures
- Elles restent dans le fichier `"use server"` car elles sont des helpers de `generateMonthlyExpenses`
- La separation SRP est au niveau fonction, pas au niveau module
- AUDIT-013 gerera la separation fichier si necessaire

**Sous-fonctions :**

| Fonction | Responsabilite | Lignes estimees |
|----------|---------------|-----------------|
| `generateRecurringInstances(userId, month, year, monthNum)` | Fetch recurring + spread_monthly + calcDueDateForMonth + insert | ~60L |
| `generateOneTimeInstances(userId, month, monthStart, monthEnd)` | Fetch one-time + insert | ~20L |
| `generateDebtPaymentInstances(userId, month)` | Fetch debts + calcDueDateForMonth + insert | ~30L |

`generateMonthlyExpenses` devient un orchestrateur de ~15 lignes :

```
export async function generateMonthlyExpenses(month: string): Promise<void> {
  validateInput(monthSchema, month);
  const userId = await requireAuth();
  const [year, monthNum] = month.split("-").map(Number);
  const monthStart = ...;
  const monthEnd = ...;

  await generateRecurringInstances(userId, month, year, monthNum);
  await generateOneTimeInstances(userId, month, monthStart, monthEnd);
  await generateDebtPaymentInstances(userId, month);
}
```

### D4 — Helper interne `formatDueDate`

Le pattern `${year}-${String(monthNum).padStart(2, "0")}-${String(day).padStart(2, "0")}` est repete 5 fois dans `calcDueDateForMonth`. Extraire en helper interne :

```typescript
function formatDueDate(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}
```

Ce helper reste dans `lib/utils.ts` (non exporte) ou est exporte si utilise ailleurs.

---

## 3. Backward compatibility

### 3.1 Strategie zero-break

1. **Extraire** `calcDueDateForMonth` vers `lib/utils.ts` avec `export`
2. **Importer** dans `monthly-expenses.ts` : `import { calcDueDateForMonth } from "@/lib/utils"`
3. **Supprimer** la definition locale dans `monthly-expenses.ts`
4. Les deux callers internes (L171, L231) continuent d'appeler `calcDueDateForMonth(expense, month)` sans changement — la signature est identique

### 3.2 Verification

- Aucun import externe de `calcDueDateForMonth` n'existe (la fonction etait `function` non exportee)
- Les callers passent le meme shape d'objet — pas de changement de contrat
- Le build TypeScript validera que les types sont compatibles

---

## 4. Plan de tests

### 4.1 Fichier : `__tests__/unit/calc-due-date.test.ts`

Coherent avec la convention existante (`utils.test.ts`, `month-utils.test.ts`, `schemas.test.ts`).

### 4.2 Tests pour `calcDueDateForMonth`

| # | Groupe | Test | Input | Expected |
|---|--------|------|-------|----------|
| 1 | MONTHLY | Genere chaque mois avec recurrence_day | freq=MONTHLY, day=15, month="2026-03" | "2026-03-15" |
| 2 | MONTHLY | Clampe au dernier jour du mois (fevrier) | freq=MONTHLY, day=31, month="2026-02" | "2026-02-28" |
| 3 | MONTHLY | Clampe au 29 fevrier (annee bissextile) | freq=MONTHLY, day=31, month="2028-02" | "2028-02-29" |
| 4 | BIMONTHLY | Genere dans un mois pair (offset 0) | freq=BIMONTHLY, day=10, next_due="2026-01-10", month="2026-03" | "2026-03-10" |
| 5 | BIMONTHLY | Skip mois impair (offset 1) | freq=BIMONTHLY, day=10, next_due="2026-01-10", month="2026-02" | null |
| 6 | QUARTERLY | Genere dans un mois du (offset 0) | freq=QUARTERLY, day=5, next_due="2026-01-05", month="2026-04" | "2026-04-05" |
| 7 | QUARTERLY | Skip mois non-du (offset 1) | freq=QUARTERLY, day=5, next_due="2026-01-05", month="2026-02" | null |
| 8 | QUARTERLY | Skip mois non-du (offset 2) | freq=QUARTERLY, day=5, next_due="2026-01-05", month="2026-03" | null |
| 9 | YEARLY | Genere dans le mois de reference | freq=YEARLY, day=20, next_due="2026-06-20", month="2026-06" | "2026-06-20" |
| 10 | YEARLY | Skip tout autre mois | freq=YEARLY, day=20, next_due="2026-06-20", month="2026-03" | null |
| 11 | YEARLY | Day clamping en fevrier | freq=YEARLY, day=29, next_due="2026-02-28", month="2026-02" | "2026-02-28" |
| 12 | WEEKLY | Retourne le 1er du mois | freq=WEEKLY, day=null, month="2026-05" | "2026-05-01" |
| 13 | BIWEEKLY | Retourne le 1er du mois | freq=BIWEEKLY, day=null, month="2026-05" | "2026-05-01" |
| 14 | next_due_date | Retourne next_due_date si dans le mois cible | freq=MONTHLY, next_due="2026-03-15", month="2026-03" | "2026-03-15" |
| 15 | next_due_date | Ignore next_due_date si hors du mois | freq=MONTHLY, day=15, next_due="2026-04-15", month="2026-03" | "2026-03-15" |
| 16 | edge | Retourne null si freq=null et pas de next_due_date | freq=null, day=null, next_due=null, month="2026-03" | null |
| 17 | edge | QUARTERLY wrap autour de decembre-janvier | freq=QUARTERLY, day=15, next_due="2025-10-15", month="2026-01" | "2026-01-15" |

**Total : ~17 tests**

### 4.3 Tests NON inclus (hors scope)

- Tests de `generateMonthlyExpenses` et sous-fonctions : ils font du I/O (SQL) et necessiteraient des mocks DB. Hors scope de cette story (focus sur la logique pure).
- Tests de `formatDueDate` : trop trivial pour un test dedie, couvert implicitement par les tests de `calcDueDateForMonth`.

---

## 5. Ordre d'implementation

1. **Definir `CalcDueDateInput`** dans `lib/types.ts`
2. **Extraire `calcDueDateForMonth`** vers `lib/utils.ts` avec export + helper `formatDueDate`
3. **Mettre a jour `monthly-expenses.ts`** : import de `calcDueDateForMonth` depuis utils
4. **Decomposer `generateMonthlyExpenses`** en 3 sous-fonctions dans `monthly-expenses.ts`
5. **Ecrire les tests** dans `__tests__/unit/calc-due-date.test.ts`
6. **Verifier le build** (`npm run build`) — zero regression

---

## 6. Fichiers impactes

| Fichier | Action | Changement |
|---------|--------|------------|
| `lib/types.ts` | MODIFY | Ajouter `CalcDueDateInput` type |
| `lib/utils.ts` | MODIFY | Ajouter `calcDueDateForMonth` (export) + `formatDueDate` (helper) |
| `lib/actions/monthly-expenses.ts` | MODIFY | Supprimer `calcDueDateForMonth` local, ajouter import, decomposer `generateMonthlyExpenses` en 3 sous-fonctions |
| `__tests__/unit/calc-due-date.test.ts` | CREATE | ~17 tests unitaires |

---

## 7. Risques

| # | Risque | Probabilite | Impact | Mitigation |
|---|--------|-------------|--------|------------|
| R1 | La signature change subtilement lors de l'extraction (type narrowing perdu) | Faible | Moyen | Le type `CalcDueDateInput` accepte `string \| null` comme l'original. Le build TS validera. |
| R2 | Les sous-fonctions de `generateMonthlyExpenses` changent le comportement SQL | Faible | Eleve | Refactoring mecanique — couper/coller les blocs existants sans modifier la logique. Verification via build. |
| R3 | Import circulaire entre `utils.ts` et `monthly-expenses.ts` | Nul | Moyen | `utils.ts` n'importe rien de `monthly-expenses.ts`. Sens unique. |
| R4 | `calcDueDateForMonth` dans utils.ts importe des types de `lib/types.ts` qui importent d'autres choses | Nul | Faible | `lib/types.ts` ne contient que des types — pas de runtime deps. |
| R5 | Tests revelent un bug dans la logique existante de `calcDueDateForMonth` | Moyen | Moyen | Si un bug est decouvert, le documenter comme discovery. Le fixer uniquement s'il s'agit d'un cas deja teste par la production (backward compat). |

---

## 8. Audit findings adresses

| Finding | Remediation |
|---------|-------------|
| Testing-C3 (logique financiere non testee) | 17 tests unitaires pour calcDueDateForMonth |
| Clean Code H-05 (fonction trop longue) | Decomposition de generateMonthlyExpenses |
| Clean Code M-07 (pattern repetitif dans calcDueDateForMonth) | Helper formatDueDate |
| Architecture H-4 (logique pure dans fichier server action) | Extraction vers lib/utils.ts |
