# Feature Brief — Tableau de bord

## Section A — Fonctionnel

### Titre
Tableau de bord mensuel

### Objectif utilisateur (Job-to-be-done)
En tant qu'utilisateur, je veux voir en un coup d'oeil ma situation financiere du mois (combien j'ai de disponible, combien j'ai depense, combien j'ai recu) pour savoir si mon mois est sous controle.

### Description
Page d'accueil de l'app. Affiche un "monument" central avec le montant disponible (revenus recus - depenses payees). Trois onglets : Tableau de bord (grille de 4 cartes + valeur nette), Timeline (flux chronologique de toutes les depenses et revenus du mois), Sante financiere (score de sante, alertes prioritaires, metriques). Navigation mensuelle pour consulter les mois passes/futurs.

### Flows cles

1. **Voir la balance disponible** : L'utilisateur arrive sur `/`, voit le montant disponible en grand, avec un badge vert/rouge selon la situation.
2. **Naviguer les onglets** : Cliquer sur "Tableau de bord", "Timeline" ou "Sante financiere" pour alterner les vues.
3. **Consulter un autre mois** : Utiliser le navigateur de mois pour voir un mois passe ou futur. La generation des instances mensuelles se fait automatiquement.
4. **Acceder aux details** : Depuis le tableau de bord, cliquer sur une carte (Revenus, Depenses, Epargne, Dettes) pour naviguer vers la page correspondante.

### Criteres d'acceptation (niveau feature)
- AC-1 : Le montant disponible = revenus recus (actual_total) - depenses payees (paid_total)
- AC-2 : La grille 4 cartes affiche Revenus (recu/attendu), Depenses (paye/prevu), Epargne (total + % objectif), Dettes (balance totale + mensualites)
- AC-3 : La valeur nette = epargne totale - dettes totales
- AC-4 : La timeline affiche tous les evenements du mois (depenses + revenus) tries chronologiquement, avec les en-retard en premier
- AC-5 : Le score de sante est un blend : couverture depenses 60% + taux epargne 20% + bonus sans retard 20%
- AC-6 : Les alertes prioritaires affichent : charges en retard (critique), gros paiements a venir (warning), depassement budget (warning), controle (good), taux epargne (good)
- AC-7 : La generation des instances mensuelles (expenses + incomes) est idempotente
- AC-8 : L'auto-mark overdue et auto-mark paid (auto-debit) ne s'executent que pour le mois courant

### Stories (squelette)
1. Affichage du monument "balance disponible"
2. Grille 4 cartes du tableau de bord
3. Carte valeur nette
4. Timeline unifiee depenses + revenus
5. Score de sante financiere + alertes
6. Metriques secondaires (taux epargne, couverture, jours restants, coussin)
7. Navigation mensuelle
8. Generation automatique des instances mensuelles

### Dependances
- Depends on : Charges fixes (templates), Revenus recurrents (templates), Epargne/Projets, Gestion dettes
- Used by : Aucune (c'est la page d'entree)

---

## Section B — Technique

### Routes
- `/` (page.tsx) — Server component, data fetching + generation

### Source files
- `app/page.tsx` — Server component orchestrateur
- `components/AccueilClient.tsx` — Client shell (onglets, onboarding check)
- `components/accueil/TabTableauDeBord.tsx` — Grille 4 cartes + valeur nette
- `components/accueil/TabTimeline.tsx` — Timeline unifiee
- `components/accueil/TabSanteFinanciere.tsx` — Score + alertes + metriques
- `components/MonthNavigator.tsx` — Navigation mensuelle
- `components/Onboarding.tsx` — Overlay onboarding (si new user)

### Server actions
- `lib/actions/monthly-expenses.ts` : generateMonthlyExpenses, getMonthlyExpenses, getMonthSummary, autoMarkOverdue, autoMarkPaidForAutoDebit
- `lib/actions/monthly-incomes.ts` : generateMonthlyIncomes, getMonthlyIncomeSummary, autoMarkReceivedForAutoDeposit
- `lib/actions/expenses.ts` : getMonthlySummaryBySection, getPlannedExpenses, getMonthlySavingsSummary
- `lib/actions/incomes.ts` : getMonthlyIncomeTotal
- `lib/actions/debts.ts` : getTotalDebtBalance
- `lib/actions/debt-transactions.ts` : getMonthlyDebtSummary
- `lib/actions/claim.ts` : hasOrphanedData, ensureDefaultSections
- `lib/actions/demo-data.ts` : hasUserData

### Tables DB
- monthly_expenses, monthly_incomes, expenses, incomes, debts, debt_transactions, savings_contributions, sections

### Algorithmes cles
- **Generation mensuelle** : idempotente via ON CONFLICT DO NOTHING. Genere depuis expenses (RECURRING + ONE_TIME) et debts (actives avec balance > 0).
- **Auto-overdue** : marque UPCOMING -> OVERDUE si due_date < today et pas auto_debit.
- **Auto-paid** : marque UPCOMING -> PAID si auto_debit et due_date <= today.
- **Score de sante** : coverageActual * 0.6 + savingsRate * 0.2 + overdueBonus (0 ou 20).
- **Calcul monthly amount** : multiplicateurs WEEKLY=52/12, BIWEEKLY=26/12, MONTHLY=1, BIMONTHLY=1/2, QUARTERLY=1/3, YEARLY=1/12.

### Notes techniques
- La page est `force-dynamic` (pas de cache).
- L'onboarding s'affiche si isNewUser ET localStorage flag absent.
- La generation se fait au render (server side), pas via cron.
