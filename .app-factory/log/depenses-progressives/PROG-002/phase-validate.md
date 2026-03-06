# Validation — PROG-002 — Server actions pour les depenses progressives

**Date:** 2026-03-06
**Validator:** af-pm
**Commit:** caa8fd4
**Story level:** 1 (backend-only, no UI)

---

## Criteres d'acceptation

### AC1 — addExpenseTransaction action: CONFORME

**Attendu:**
- INSERT into expense_transactions + UPDATE monthly_expenses SET paid_amount = paid_amount + amount
- Les deux operations dans une meme transaction SQL

**Constate:**
- `lib/actions/expense-transactions.ts` L27-37: `sql.transaction((txn) => [...])` contient exactement les deux operations attendues
- INSERT dans expense_transactions avec user_id, monthly_expense_id, amount, note (L28-31)
- UPDATE monthly_expenses SET paid_amount = paid_amount + amount WHERE id AND user_id (L32-36)
- Atomicite garantie par `sql.transaction`
- Auth verifiee via `requireAuth()` avant la transaction
- Revalidation des pages apres succes (`revalidateExpensePages()`)

**Verdict:** CONFORME

---

### AC2 — Validation Zod: CONFORME

**Attendu:**
- amount > 0 obligatoire
- monthlyExpenseId UUID valide obligatoire
- Rejet avec erreur de validation si invalide

**Constate:**
- `lib/schemas/expense-transaction.ts`: schema avec `positiveAmountSchema` (z.number().positive()) et `idSchema` (z.string().uuid())
- `lib/schemas/common.ts` L25-27: `positiveAmountSchema` rejette 0 et negatifs
- `lib/schemas/common.ts` L4: `idSchema` valide format UUID
- `lib/actions/expense-transactions.ts` L20-24: `validateInput()` appele AVANT toute operation DB
- Tests unitaires (`__tests__/unit/schemas.test.ts`):
  - Accepte montant valide avec/sans note (L299-313)
  - Accepte note null (L316-322)
  - Rejette amount = 0 (L325-330)
  - Rejette amount negatif (L333-338)
  - Rejette UUID invalide (L341-346)
  - Rejette monthlyExpenseId manquant (L349-353)
  - Rejette note > 500 caracteres (L356-360)

**Verdict:** CONFORME

---

### AC3 — Requete historique: CONFORME

**Attendu:**
- getExpenseTransactions(monthlyExpenseId) retourne la liste ORDER BY created_at DESC

**Constate:**
- `lib/actions/expense-transactions.ts` L46-58: fonction `getExpenseTransactions`
- L55: `ORDER BY created_at DESC` — ordre chronologique inverse confirme
- Auth verifiee, input valide via `idSchema`
- Retour type `ExpenseTransaction[]` (type defini dans `lib/types.ts` L138-145)

**Verdict:** CONFORME

---

### AC4 — Generation mensuelle adaptee: CONFORME

**Attendu:**
- Les instances monthly_expenses creees pour des templates is_progressive=true obtiennent paid_amount=0

**Constate:**
- `lib/actions/monthly-expenses.ts` L77-85 (spread path) et L114-122 (normal path): les INSERT n'incluent pas `paid_amount` dans la liste de colonnes
- `scripts/migrate-progressive-expenses.mjs` L36-39: la colonne `paid_amount` est definie `DECIMAL(10,2) DEFAULT 0`
- Le DEFAULT 0 de la colonne DB garantit que toute nouvelle ligne obtient paid_amount=0 sans besoin de le specifier explicitement
- Le status est bien 'UPCOMING' dans les deux chemins d'insertion

**Verdict:** CONFORME

---

## Verification hors criteres

- **Auth:** requireAuth() appele dans les deux actions — pas de faille d'acces
- **Coherence des types:** ExpenseTransaction defini dans lib/types.ts, importe correctement
- **Tests:** 156 tests passent (+8 nouveaux pour ce schema)
- **Review:** APPROVED WITH NOTES — aucun finding CRITICAL ou HIGH

---

## Verdict

**ACCEPTED**

Tous les criteres d'acceptation sont satisfaits. Les server actions suivent le pattern transactionnel existant (identique a addSavingsContribution). La validation Zod est complete avec une couverture de tests adequate. La generation mensuelle s'appuie correctement sur le DEFAULT 0 de la colonne DB.
