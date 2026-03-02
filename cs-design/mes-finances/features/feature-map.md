# Feature Map — Mes Finances

**App scannée** : /Users/amarafofana/Projects/Perso Workspace/Mon Budget
**Date** : 2026-03-02
**Total features** : 7
**Total pages/routes** : 15 (hors landing/auth/onboarding)

---

## Features

| # | Slug | Titre | Pages | Dépend de |
|---|------|-------|-------|-----------|
| 1 | reference-data | Données de référence (Sections & Cartes) | `/sections`, `/cartes`, `/cartes/[id]` | — |
| 2 | expense-templates | Configuration des charges fixes | `/parametres/charges`, `/depenses/[id]/edit` | reference-data |
| 3 | income-templates | Configuration des revenus récurrents | `/parametres/revenus` | — |
| 4 | expense-tracking | Suivi des dépenses mensuelles | `/depenses` | expense-templates, reference-data |
| 5 | income-tracking | Suivi des revenus & allocation mensuelle | `/revenus` | income-templates, expense-templates |
| 6 | patrimoine | Patrimoine — Épargne & Dettes | `/projets` | reference-data |
| 7 | dashboard | Tableau de bord mensuel | `/` | expense-tracking, income-tracking, patrimoine |

---

## Dépendances

```
reference-data (1)
    ├── expense-templates (2)
    │       └── expense-tracking (4) ──────┐
    └── patrimoine (6) ───────────────────► dashboard (7)
income-templates (3)                        │
    └── income-tracking (5) ───────────────┘
```

---

## Détail par feature

---

### Feature 1 — Données de référence (Sections & Cartes)

**Slug** : `reference-data`
**Pages** : `/sections`, `/cartes`, `/cartes/[id]`
**Composants** : `SectionsClient`, `CartesClient`, `CarteDetailClient`

#### Section A — Brief fonctionnel

**Objectif utilisateur**
Créer et gérer les catégories (sections) et les moyens de paiement (cartes) qui servent à classifier toutes les dépenses et revenus. C'est la couche de configuration fondamentale dont tout le reste dépend.

**User stories clés**
1. Je veux créer des sections (🏠 Logement, 🚗 Transport) pour organiser mes dépenses par catégorie.
2. Je veux attribuer un emoji et une couleur à chaque section pour les distinguer visuellement.
3. Je veux réordonner mes sections par drag-and-drop.
4. Je veux ajouter mes cartes bancaires (nom, 4 derniers chiffres, banque) pour les associer à mes charges.

**Données affichées** : sections (nom, emoji, couleur, position), cartes (nom, 4 derniers chiffres, banque, couleur)

**Actions disponibles** : sections — créer/modifier/supprimer/réordonner. Cartes — créer/modifier/supprimer.

**Contraintes UX** : drag-and-drop tactile mobile, suppression irréversible avec confirmation.

#### Section B — Contexte technique

**Fichiers source**
- `app/sections/page.tsx`, `app/cartes/page.tsx`, `app/cartes/[id]/page.tsx`
- `components/SectionsClient.tsx`, `components/CartesClient.tsx`, `components/CarteDetailClient.tsx`
- `lib/actions/sections.ts`, `lib/actions/cards.ts`

**Types** : `Section { id, name, icon, color, position }`, `Card { id, name, last_four, bank, color }`

---

### Feature 2 — Configuration des charges fixes

**Slug** : `expense-templates`
**Pages** : `/parametres/charges`, `/depenses/[id]/edit`
**Composants** : `ExpenseTemplateManager`, `ExpenseModal`, `EditExpenseClient`

#### Section A — Brief fonctionnel

**Objectif utilisateur**
Définir le catalogue permanent des charges récurrentes et ponctuelles. Ces gabarits génèrent automatiquement les instances mensuelles.

**User stories clés**
1. Je veux créer une charge récurrente (loyer, abonnement) avec montant, fréquence, date de prélèvement pour qu'elle apparaisse automatiquement chaque mois.
2. Je veux associer une charge à une section et une carte pour une meilleure organisation.
3. Je veux activer le "prélèvement automatique" pour qu'une charge soit marquée payée sans action.
4. Je veux créer une charge ponctuelle avec une date précise (impôts, assurance annuelle).
5. Je veux voir le total mensuel normalisé de toutes mes charges actives.

**Données affichées** : liste groupée par section, total mensuel normalisé, badge "prélèvement auto".

**Contraintes UX** : modifications touchent uniquement les gabarits — jamais le mois en cours déjà généré.

#### Section B — Contexte technique

**Fichiers source**
- `app/parametres/charges/page.tsx`
- `components/ExpenseTemplateManager.tsx`, `components/ExpenseModal.tsx`, `components/EditExpenseClient.tsx`
- `lib/actions/expenses.ts`

**Calcul clé** : `normalizeToMonthly(amount, frequency)` — WEEKLY×52/12, BIWEEKLY×26/12, QUARTERLY÷3, YEARLY÷12

**Types** : `Expense { type: 'RECURRING'|'ONE_TIME'|'PLANNED', recurrence_frequency, recurrence_day, auto_debit }`

---

### Feature 3 — Configuration des revenus récurrents

**Slug** : `income-templates`
**Pages** : `/parametres/revenus`
**Composants** : `IncomeTemplateManager`, `IncomeModal`

#### Section A — Brief fonctionnel

**Objectif utilisateur**
Déclarer les sources de revenus permanentes qui génèrent les instances mensuelles.

**User stories clés**
1. Je veux créer une source de revenu avec nom, source (emploi/business) et fréquence.
2. Je veux définir une date d'ancrage de paiement pour que la prochaine date soit calculée automatiquement.
3. Je veux activer le "dépôt automatique" pour un revenu marqué reçu sans action.
4. Je veux déclarer un revenu variable avec un montant estimé pour les prévisions.

**Contraintes UX** : VARIABLE = pas de montant fixe, seulement une estimation. Date d'ancrage pour BIWEEKLY = datepicker spécial.

#### Section B — Contexte technique

**Fichiers source**
- `app/parametres/revenus/page.tsx`
- `components/IncomeTemplateManager.tsx`, `components/IncomeModal.tsx`
- `lib/actions/incomes.ts`

**Calcul clé** : `normalizeIncomeToMonthly` — BIWEEKLY×26/12, YEARLY÷12, VARIABLE=estimated_amount

**Types** : `Income { source: IncomeSource, frequency: IncomeFrequency, amount, estimated_amount, pay_anchor_date, auto_deposit }`

---

### Feature 4 — Suivi des dépenses mensuelles

**Slug** : `expense-tracking`
**Pages** : `/depenses`
**Composants** : `DepensesTrackingClient`, `ExpenseTrackingRow`, `AdhocExpenseModal`

#### Section A — Brief fonctionnel

**Objectif utilisateur**
Suivre en temps réel l'état de paiement des charges du mois (fixes auto-générées + imprévus adhoc). L'utilisateur valide les paiements au fur et à mesure.

**User stories clés**
1. Je veux voir toutes les dépenses groupées par statut (À venir / Payées / En retard / Reportées).
2. Je veux marquer une dépense comme payée ou la remettre en "À venir" en un geste.
3. Je veux ajouter une dépense imprévue (adhoc) pour enregistrer un achat non planifié.
4. Je veux reporter une dépense à un mois futur si je ne peux pas la payer ce mois.
5. Je veux modifier le montant d'une dépense pour ce mois uniquement.
6. Je veux filtrer par section ou par type (charges fixes / imprévus).

**Données affichées** : hero monument total dépensé/prévu, groupes par statut, badges overflow.

**Contraintes UX** : mobile-first avec bottom sheets, FAB uniquement sur le mois courant, mois passés en lecture seule.

#### Section B — Contexte technique

**Fichiers source**
- `app/depenses/page.tsx` (génère instances, auto-mark)
- `components/DepensesTrackingClient.tsx` (~547 lignes)
- `components/ExpenseTrackingRow.tsx`, `components/AdhocExpenseModal.tsx`
- `lib/actions/monthly-expenses.ts`, `lib/constants.ts`

**Server actions clés** : `generateMonthlyExpenses`, `markAsPaid`, `markAsUpcoming`, `deferExpenseToMonth`, `updateMonthlyExpenseAmount`, `deleteMonthlyExpense`

**Types** : `MonthlyExpense { status: 'UPCOMING'|'PAID'|'OVERDUE'|'DEFERRED' }`, `MonthSummary`

---

### Feature 5 — Suivi des revenus & allocation mensuelle

**Slug** : `income-tracking`
**Pages** : `/revenus` (tabs revenus + allocation)
**Composants** : `RevenusTrackingClient`, `IncomeTrackingRow`, `AdhocIncomeModal`, `AdhocAllocationModal`

#### Section A — Brief fonctionnel

**Objectif utilisateur**
Confirmer les revenus reçus ce mois et visualiser comment le revenu est alloué par enveloppe budgétaire.

**User stories clés**
1. Je veux marquer un revenu comme reçu avec le montant réel (peut différer de l'attendu).
2. Je veux ajouter un revenu ponctuel non prévu (prime, remboursement).
3. Je veux voir comment mon revenu est alloué par enveloppe (section, projet d'épargne, reste libre).
4. Je veux surcharger une allocation pour ce mois uniquement sans modifier le gabarit permanent.
5. Je veux ajouter une allocation ponctuelle ce mois.
6. Je veux voir une alerte si mon total alloué dépasse mon revenu attendu (surallocation).

**Données affichées** : hero monument total reçu/attendu, tab revenus (instances), tab allocation (enveloppes avec barres progression).

**Contraintes UX** : FAB change selon le tab actif (revenu adhoc vs allocation adhoc), surallocation = warning non bloquant.

#### Section B — Contexte technique

**Fichiers source**
- `app/revenus/page.tsx`
- `components/RevenusTrackingClient.tsx` (~772 lignes)
- `components/AdhocIncomeModal.tsx`, `components/AdhocAllocationModal.tsx`
- `lib/actions/monthly-incomes.ts`, `lib/actions/allocations.ts`

**Types** : `MonthlyIncome { status: 'EXPECTED'|'RECEIVED'|'PARTIAL'|'MISSED' }`, `IncomeAllocation`, `MonthlyAllocation`

---

### Feature 6 — Patrimoine (Épargne & Dettes)

**Slug** : `patrimoine`
**Pages** : `/projets`
**Composants** : `ProjetsEpargneClient`, `ProjectModal`, `DebtModal`, `AddSavingsModal`, `TransferSavingsModal`, `SavingsHistoryModal`

#### Section A — Brief fonctionnel

**Objectif utilisateur**
Gérer les actifs (épargne libre + projets) et passifs (dettes) pour calculer la valeur nette patrimoniale.

**User stories clés**
1. Je veux voir ma valeur nette (épargne − dettes) en temps réel.
2. Je veux créer des projets d'épargne avec objectif et date cible pour suivre ma progression.
3. Je veux ajouter une contribution à un pot d'épargne.
4. Je veux transférer de l'épargne d'un pot à un autre.
5. Je veux enregistrer mes dettes avec solde restant, taux d'intérêt et paiement mensuel.
6. Je veux faire un paiement supplémentaire ou enregistrer une charge sur une dette.

**Contraintes UX** : vue snapshot (pas de navigation mensuelle), épargne libre non supprimable, FAB expandable 2 options.

#### Section B — Contexte technique

**Fichiers source**
- `app/projets/page.tsx`
- `components/ProjetsEpargneClient.tsx` (~667 lignes)
- `components/ProjectModal.tsx`, `components/DebtModal.tsx`, `components/AddSavingsModal.tsx`, `components/TransferSavingsModal.tsx`, `components/SavingsHistoryModal.tsx`
- `lib/actions/expenses.ts` (projets = Expense PLANNED), `lib/actions/debts.ts`, `lib/actions/debt-transactions.ts`

**Calcul clé** : `calcMonthlySuggested(target, saved, targetDate)` = `(target - saved) / monthsRemaining`

**Types** : Projets = `Expense { type:'PLANNED', target_amount, saved_amount, target_date }`, `Debt`, `DebtTransaction { type:'PAYMENT'|'CHARGE' }`

---

### Feature 7 — Tableau de bord mensuel

**Slug** : `dashboard`
**Pages** : `/`
**Composants** : `AccueilClient`, `TabTableauDeBord`, `TabTimeline`, `TabSanteFinanciere`, `MonthNavigator`

#### Section A — Brief fonctionnel

**Objectif utilisateur**
Vue de synthèse mensuelle. Point d'entrée quotidien — l'utilisateur voit d'un coup d'oeil sa situation financière complète.

**User stories clés**
1. Je veux voir en ouvrant l'app le montant disponible ce mois (revenus reçus − dépenses payées) comme héros central.
2. Je veux un tableau de bord avec 4 cartes cliquables (Revenus, Dépenses, Épargne, Dettes).
3. Je veux une timeline chronologique de tous les événements du mois.
4. Je veux un score de santé financière avec alertes prioritaires.
5. Je veux voir ma valeur nette patrimoniale en snapshot permanent.

**Contraintes UX** : page la plus chargée (9 appels SQL parallèles), héros montant ultra-large (clamp 3.5–6rem), toutes données en lecture seule.

#### Section B — Contexte technique

**Fichiers source**
- `app/page.tsx` (9 appels parallèles, auto-génération idempotente)
- `components/AccueilClient.tsx`, `components/accueil/TabTableauDeBord.tsx`
- `components/accueil/TabTimeline.tsx`, `components/accueil/TabSanteFinanciere.tsx`
- `components/MonthNavigator.tsx`, `components/Onboarding.tsx`, `components/ClaimBanner.tsx`

**Calculs clés** : `availableAmount = incomeSummary.actualTotal - summary.paid_total`, `valeurNette = totalEpargne - totalDebtBalance`, `coverageActual = min(actualTotal / planned_total * 100, 100)`
