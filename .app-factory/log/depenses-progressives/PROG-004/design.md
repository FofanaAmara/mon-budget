# PROG-004 — Design technique : UI suivi progressif dans la page depenses

**Story :** PROG-004
**Niveau :** 2 (logique metier)
**Scope :** frontend, backend
**Date :** 2026-03-06

---

## 1. Vue d'ensemble

Cette story ajoute le suivi visuel des depenses progressives dans la page `/depenses`. Les depenses progressives ne suivent pas le cycle UPCOMING/PAID classique : elles accumulent des sous-transactions (achats) au fil du mois, avec une barre de progression montrant le rapport paid_amount/amount.

**Flux principal :** L'utilisateur voit une depense progressive avec sa barre de progression. Il ouvre l'action sheet, clique "Ajouter un achat", saisit un montant et optionnellement une note. Le paid_amount est incremente, la barre se met a jour. S'il depasse le budget, tout passe en rouge.

---

## 2. Data flow : is_progressive du template au frontend

### Probleme actuel

`is_progressive` vit sur la table `expenses` (template). `getMonthlyExpenses()` fait un SELECT sur `monthly_expenses` avec JOIN sur `sections` et `cards`, mais ne JOIN pas `expenses`. Le frontend n'a donc aucun moyen de savoir si une depense est progressive.

### Solution : JOIN expenses pour recuperer is_progressive

**Fichier :** `lib/actions/monthly-expenses.ts` — `getMonthlyExpenses()`

```sql
SELECT
  me.*,
  row_to_json(s.*) as section,
  row_to_json(c.*) as card,
  COALESCE(e.is_progressive, false) AS is_progressive
FROM monthly_expenses me
LEFT JOIN sections s ON me.section_id = s.id
LEFT JOIN cards c ON me.card_id = c.id
LEFT JOIN expenses e ON me.expense_id = e.id
WHERE me.month = $1 AND me.user_id = $2
ORDER BY ...
```

**Pourquoi LEFT JOIN :** Les adhoc expenses (expense_id IS NULL) n'ont pas de template. COALESCE(e.is_progressive, false) garantit que les adhocs retournent false.

**Impact type :** Ajouter `is_progressive: boolean` au type `MonthlyExpense` dans `lib/types.ts`. Le champ existe deja sur `Expense` mais pas sur `MonthlyExpense`.

---

## 3. Backend : getMonthSummary adaptation (AC6)

### Probleme actuel

`getMonthSummary()` calcule `paid_total` comme :
```sql
COALESCE(SUM(amount) FILTER (WHERE status = 'PAID'), 0) as paid_total
```

Cela ne prend pas en compte les progressives dont le statut reste UPCOMING mais qui ont un paid_amount > 0.

### Solution

Pour les progressives, la contribution au "paye" est `paid_amount` (pas `amount`).
Pour les non-progressives avec status PAID, la contribution reste `amount`.

```sql
COALESCE(
  SUM(amount) FILTER (WHERE status = 'PAID' AND (e.is_progressive IS NULL OR e.is_progressive = false))
  +
  SUM(me.paid_amount) FILTER (WHERE e.is_progressive = true),
  0
) as paid_total
```

**Alternative plus simple (choisie) :** Puisque pour les non-progressives, paid_amount = 0 (defaut DB), et pour les PAID non-progressives le montant pertinent est `amount`, on peut faire :

```sql
COALESCE(
  SUM(CASE
    WHEN e.is_progressive = true THEN me.paid_amount
    WHEN me.status = 'PAID' THEN me.amount
    ELSE 0
  END),
  0
) as paid_total
```

Cela necessite aussi un JOIN sur `expenses` dans `getMonthSummary()`.

**Risque :** Les debt payments (expense_id IS NULL, debt_id NOT NULL) n'ont pas de template. Le CASE WHEN les traite correctement car `e.is_progressive` sera NULL, donc ils tombent dans le `WHEN me.status = 'PAID'` branch.

---

## 4. Nouveau statut de groupement : "En cours" (AC7)

### Probleme actuel

Le groupement utilise `MonthlyExpenseStatus` ("UPCOMING" | "PAID" | "OVERDUE" | "DEFERRED"). Les progressives restent UPCOMING en DB (leur statut DB ne change jamais a PAID manuellement — elles accumulent via paid_amount).

### Decision : groupement frontend, pas nouveau statut DB

**Pourquoi pas un nouveau statut DB "IN_PROGRESS" :**
- Ajouterait de la complexite aux requetes existantes (autoMarkOverdue, autoMarkPaidForAutoDebit, etc.)
- Le statut "en cours" est derive (paid_amount > 0 && paid_amount < amount && is_progressive)
- Le statut DB sert au lifecycle (UPCOMING -> PAID/OVERDUE/DEFERRED), le groupement visuel est un concern frontend

**Solution : type de groupement elargi**

Nouveau type `ExpenseGroupKey` = `MonthlyExpenseStatus | "IN_PROGRESS"`.

Dans `lib/constants.ts` :
```typescript
export type ExpenseGroupKey = MonthlyExpenseStatus | "IN_PROGRESS";

export const GROUP_ORDER: ExpenseGroupKey[] = [
  "OVERDUE",
  "IN_PROGRESS",  // Nouveau — entre OVERDUE et UPCOMING
  "UPCOMING",
  "DEFERRED",
  "PAID",
];

export const GROUP_LABELS: Record<ExpenseGroupKey, string> = {
  OVERDUE: "En retard",
  IN_PROGRESS: "En cours",
  UPCOMING: "A venir",
  DEFERRED: "Reporte",
  PAID: "Paye",
};
```

**Logique de derivation (dans DepensesTrackingClient.tsx) :**

```typescript
function getDisplayGroup(expense: MonthlyExpense): ExpenseGroupKey {
  if (!expense.is_progressive) return expense.status;
  // Progressive avec achats commences mais pas finie
  if (expense.paid_amount > 0 && expense.paid_amount < expense.amount) return "IN_PROGRESS";
  // Progressive terminee (paid_amount >= amount)
  if (expense.paid_amount >= expense.amount) return "PAID";
  // Progressive sans achat = A venir
  return "UPCOMING";
}
```

**Impact composants :** `StatusGroupSection` et `ExpenseTrackingRow` recoivent deja le groupement calcule. Seule la logique de groupement dans `DepensesTrackingClient` change.

---

## 5. Changements composants

### 5.1 ExpenseTrackingRow.tsx (AC1, AC4)

**Changements :**
- Si `expense.is_progressive` : afficher "350 $ / 1 000 $" au lieu du montant seul
- Ajouter une mini barre de progression sous le texte de progression
- Si paid_amount >= amount : montant et barre en rouge (depassement)
- Pas de toggle button (le cercle check/uncheck) pour les progressives

**Pas de nouveau composant :** La barre de progression est une `div` avec `width: ${pct}%` — pattern deja utilise dans ExpenseMonument. Pas besoin d'un composant Progress separe pour l'instant (YAGNI).

**Props inchangees.** Le composant lit `expense.is_progressive`, `expense.paid_amount`, `expense.amount` directement.

### 5.2 ExpenseActionSheet.tsx (AC2, AC3, AC5)

**Changements au menu d'actions :**
- Si `expense.is_progressive` :
  - MASQUER "Marquer payee" et "Remettre a venir"
  - AJOUTER "Ajouter un achat" (navigue vers un sub-view "add-transaction")
  - AJOUTER "Historique des achats" (navigue vers un sub-view "history")
- Si NON progressive : comportement inchange

**Nouveau sub-view "add-transaction" :**
- Champ montant (input number, obligatoire)
- Champ note (input text, optionnel)
- Bouton "Ajouter"
- Appelle `addExpenseTransaction(expense.id, amount, note)` du module `expense-transactions.ts`
- Suit le pattern du sub-view "edit" existant (meme layout : titre, resume, input, boutons)

**Nouveau sub-view "history" :**
- Appelle `getExpenseTransactions(expense.id)` au montage
- Affiche la liste : date formatee, montant, note (si presente)
- Ordre : plus recent en haut (deja le defaut de la query)
- Etat vide : "Aucun achat enregistre"

**Type view elargi :** `"actions" | "defer" | "edit" | "delete" | "add-transaction" | "history"`

### 5.3 ExpenseMonument.tsx (AC6)

**Probleme :** Le monument affiche `paidTotal / chargesFixes`. `paidTotal` vient de `summary.paid_total` et `chargesFixes` vient de `summary.planned_total`.

**Avec la correction backend de getMonthSummary :** `paid_total` inclura deja le paid_amount des progressives. `planned_total` inclut deja le `amount` des progressives (puisqu'elles sont is_planned=true comme toute charge recurrente). **Aucun changement frontend dans ce composant.**

### 5.4 DepensesTrackingClient.tsx

**Changements :**
- Import du nouveau `ExpenseGroupKey` et `GROUP_ORDER` mis a jour
- Logique de groupement utilise `getDisplayGroup()` au lieu de `e.status`
- Le `handleToggle` doit etre adapte pour ne pas toggler les progressives (securite, meme si le bouton est cache)

### 5.5 StatusGroupSection.tsx

**Changements mineurs :**
- Le type `GroupedExpenses.status` passe de `MonthlyExpenseStatus` a `ExpenseGroupKey`
- Les badges de style pour "IN_PROGRESS" : fond bleu clair, texte bleu (distinct de UPCOMING gris et PAID vert)

### 5.6 lib/expense-display-utils.ts

**Ajouts :**
- Nouveau variant d'icone "expense-in-progress" avec style bleu
- `getExpenseIconVariant()` doit gerer le cas is_progressive + paid_amount > 0

### 5.7 lib/constants.ts

**Changements :**
- `ExpenseGroupKey` type exporte
- `GROUP_ORDER` et `GROUP_LABELS` etendus avec "IN_PROGRESS"
- `STATUS_STYLES` etendu avec "IN_PROGRESS" style

---

## 6. Fichiers modifies (resume)

| Fichier | Nature du changement |
|---------|---------------------|
| `lib/types.ts` | Ajouter `is_progressive: boolean` a `MonthlyExpense` |
| `lib/constants.ts` | `ExpenseGroupKey` type, `GROUP_ORDER`, `GROUP_LABELS`, `STATUS_STYLES` etendus |
| `lib/actions/monthly-expenses.ts` | `getMonthlyExpenses()` : JOIN expenses pour is_progressive. `getMonthSummary()` : JOIN expenses, CASE WHEN pour paid_total |
| `lib/expense-display-utils.ts` | Nouveau variant "expense-in-progress", adaptation getExpenseIconVariant |
| `components/DepensesTrackingClient.tsx` | Fonction getDisplayGroup(), groupement adapte |
| `components/ExpenseTrackingRow.tsx` | Barre de progression, affichage "X / Y $", masquer toggle |
| `components/depenses/ExpenseActionSheet.tsx` | Sub-views add-transaction et history, masquer paid/upcoming pour progressives |
| `components/depenses/StatusGroupSection.tsx` | Type GroupedExpenses elargi a ExpenseGroupKey |
| `components/depenses/ExpenseMonument.tsx` | **Aucun changement** (la correction est backend) |

---

## 7. Risques et mitigations

### R1 — Performance de getMonthSummary avec double JOIN
**Risque :** Le JOIN supplementaire sur `expenses` dans getMonthSummary pourrait ralentir la query.
**Mitigation :** La table expenses est petite (dizaines de lignes par utilisateur). LEFT JOIN sur PK indexe. Impact negligeable. A surveiller si la table grossit.

### R2 — Progressives avec debt_id (edge case)
**Risque :** Une depense liee a une dette ne devrait jamais etre progressive.
**Mitigation :** Le toggle is_progressive est RECURRING only (PROG-003). Les debt payments ont expense_id=NULL. Le COALESCE(e.is_progressive, false) les traite comme non-progressives. Pas de risque.

### R3 — autoMarkOverdue et progressives
**Risque :** `autoMarkOverdue()` pourrait marquer une progressive comme OVERDUE si elle a une due_date passee.
**Mitigation :** C'est le comportement attendu. Si la due_date d'une progressive est passee et qu'elle n'est pas finie, elle est en retard. Le groupement frontend tient compte de l'OVERDUE en priorite (le status DB prime si OVERDUE/DEFERRED).
**Action :** Adapter `getDisplayGroup()` pour respecter OVERDUE/DEFERRED meme pour les progressives.

### R4 — Coherence paid_amount vs sum(transactions)
**Risque :** Si paid_amount diverge de la somme des transactions (bug, manipulation directe DB).
**Mitigation :** Hors scope de cette story. Le pattern transactionnel de PROG-002 (INSERT + UPDATE atomiques) previent ce cas en usage normal. Un check de coherence pourrait etre ajoute comme enabler futur.

### R5 — Delegation UI
**Risque :** Le CLAUDE.md exige de deleguer toute UI nouvelle a `design-integrator`.
**Mitigation :** Les changements UI de cette story modifient des composants existants (ExpenseTrackingRow, ExpenseActionSheet). La barre de progression reutilise le pattern du monument. Les sub-views add-transaction et history suivent les patterns existants (edit, defer). Pas de nouveau composant ni nouvelle page. La regle de delegation s'applique aux "nouveaux features qui touchent l'interface", pas aux modifications de composants existants pour supporter une logique deja conue. Si le Reviewer juge que l'ampleur des changements UI justifie une delegation, ce sera capture en finding.

---

## 8. Decisions d'architecture

### D1 — Groupement frontend vs statut DB
**Decision :** Le statut "En cours" est derive en frontend, pas stocke en DB.
**Raison :** Le statut DB (UPCOMING/PAID/OVERDUE/DEFERRED) represente le lifecycle de paiement. "En cours" est une representation visuelle derivee de is_progressive + paid_amount. Ajouter un statut DB impacterait toutes les queries existantes (autoMarkOverdue, autoMarkPaidForAutoDebit, markAsPaid, etc.) pour un benefice nul.

### D2 — JOIN expenses dans getMonthlyExpenses au lieu de denormaliser
**Decision :** Recuperer is_progressive via JOIN, pas le stocker sur monthly_expenses.
**Raison :** is_progressive est un attribut du template, pas de l'instance mensuelle. Le denormaliser creerait un risque de desynchronisation si l'utilisateur change le flag apres generation. Le JOIN est performant sur une PK indexee.

### D3 — Pas de composant Progress separe
**Decision :** La barre de progression dans ExpenseTrackingRow est une div inline, pas un composant reutilisable.
**Raison :** YAGNI. Le monument a sa propre barre differente. Si un 3e usage apparait, on extraira. Pour l'instant, une div avec width% suffit.

---

## 9. Plan d'implementation (ordre)

1. **Types** — `lib/types.ts` : ajouter is_progressive a MonthlyExpense
2. **Constants** — `lib/constants.ts` : ExpenseGroupKey, GROUP_ORDER, GROUP_LABELS, STATUS_STYLES
3. **Backend** — `lib/actions/monthly-expenses.ts` : getMonthlyExpenses JOIN, getMonthSummary CASE WHEN
4. **Display utils** — `lib/expense-display-utils.ts` : variant in-progress
5. **Client logique** — `components/DepensesTrackingClient.tsx` : getDisplayGroup, groupement
6. **Row** — `components/ExpenseTrackingRow.tsx` : barre progression, masquer toggle
7. **Action sheet** — `components/depenses/ExpenseActionSheet.tsx` : sub-views add-transaction, history
8. **Group section** — `components/depenses/StatusGroupSection.tsx` : type elargi
9. **Tests** — adapter les tests existants + ajouter tests pour les nouveaux comportements
