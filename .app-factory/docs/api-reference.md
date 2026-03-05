# API Reference — Mes Finances

## Route Handlers (REST)

L'application utilise principalement des **Server Actions** (pas de REST API). Seuls 3 endpoints REST existent pour des contraintes techniques :

### `POST /api/auth/[...path]`
Proxy vers Neon Auth. Gere l'authentification (login, signup, session).

### `POST /api/push/subscribe`
Enregistre un abonnement Web Push pour l'utilisateur connecte.

**Body** : `{ endpoint, keys: { p256dh, auth } }`
**Auth** : Session requise
**Response** : `{ success: true }`

### `POST /api/push/send`
Envoie une notification push a l'utilisateur connecte.

**Body** : `{ title?, body, url? }`
**Auth** : Session requise
**Response** : `{ success: true, sent: number, failed: number }`

### `GET /api/cron/push`
Cron job quotidien qui envoie un rappel push a tous les abonnes. Configure dans `vercel.json` avec le schedule `0 13 * * *` (13h UTC chaque jour).

**Auth** : `Authorization: Bearer <CRON_SECRET>` (header injecte automatiquement par Vercel Cron)
**Response** : `{ success: true, sent: number, failed: number }`
**Comportement** :
- Envoie le meme rappel generique a tous les abonnes
- Nettoie automatiquement les abonnements expires (HTTP 410)
- Retourne `401` si le secret est invalide

---

## Server Actions

Toute la logique metier est dans `lib/actions/`. Chaque fonction est un Server Action Next.js appele directement depuis les composants React.

### expenses.ts
- `getExpenses()` — Liste des templates charges
- `getExpenseById(id)` — Detail template
- `createExpense(data)` — Creer template
- `updateExpense(id, data)` — Modifier template
- `deleteExpense(id)` — Supprimer template
- `getMonthlySummaryBySection()` — Resume mensuel par section

### monthly-expenses.ts
- `generateMonthlyExpenses(month)` — Generer instances du mois
- `getMonthlyExpenses(month)` — Liste des instances du mois
- `getMonthSummary(month)` — Resume (total, paye, retard, etc.)
- `markAsPaid(id)` — Marquer paye
- `markAsUpcoming(id)` — Remettre a venir
- `deferToNextMonth(id)` — Reporter
- `autoMarkOverdue()` — Auto-marquer les retards
- `addAdhocExpense(data)` — Ajouter depense imprevue

### incomes.ts
- `getIncomes()` — Liste templates revenus
- `createIncome(data)` — Creer template
- `updateIncome(id, data)` — Modifier
- `deleteIncome(id)` — Supprimer
- `getIncomeSummary(month)` — Resume mensuel

### monthly-incomes.ts
- `generateMonthlyIncomes(month)` — Generer instances
- `getMonthlyIncomes(month)` — Liste du mois
- `markAsReceived(id, amount)` — Marquer recu
- `addAdhocIncome(data)` — Revenu ponctuel

### sections.ts
- `getSections()` / `createSection()` / `updateSection()` / `deleteSection()`

### cards.ts
- `getCards()` / `createCard()` / `updateCard()` / `deleteCard()`

### settings.ts
- `getSettings()` / `updateSettings()`

### allocations.ts
- `getAllocations()` / `createAllocation()` / `updateAllocation()` / `deleteAllocation()`
- `getMonthlyAllocations(month)` / `generateMonthlyAllocations(month)`

### debts.ts
- `getDebts()` / `createDebt()` / `updateDebt()` / `deleteDebt()`

### debt-transactions.ts
- `getDebtTransactions(debtId)` / `addDebtTransaction(data)`

### onboarding.ts
- `completeOnboarding(data)` — Wizard de premiere configuration
