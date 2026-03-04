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

**AC-1 : Monument balance disponible**
- Given des revenus et depenses existent pour le mois
- When l'utilisateur arrive sur la page d'accueil
- Then le montant disponible s'affiche en grand (revenus recus - depenses payees)
- And si positif : badge vert "Ton mois est sous controle"
- And si negatif : badge rouge "Budget depasse"
- **Edge case** : si aucun revenu n'est marque RECEIVED, actualTotal=0 → balance negative (a discuter : utiliser expectedTotal ?)

**AC-2 : Grille 4 cartes**
- Given les donnees du mois sont chargees
- When l'onglet "Tableau de bord" est actif
- Then 4 cartes s'affichent : Revenus (recu/attendu), Depenses (paye/prevu), Epargne (total + % objectif), Dettes (balance totale + mensualites)
- And chaque carte est cliquable et navigue vers la page correspondante

**AC-3 : Valeur nette**
- Given des projets d'epargne et/ou des dettes existent
- When la valeur nette est calculee
- Then valeur nette = epargne totale (sum saved_amount) - dettes totales (sum remaining_balance)
- And affichee en teal si positive, rouge si negative

**AC-4 : Timeline unifiee**
- Given des depenses et revenus existent pour le mois
- When l'onglet "Timeline" est actif
- Then tous les evenements sont affiches groupes par date, tries chronologiquement (plus recent en premier)
- And les evenements OVERDUE sont dans un groupe separe en tete
- And chaque evenement montre : icone, nom, montant, badge statut (Paye/Recu/Prevu/En retard/Attendu)
- **Edge case** : aucun evenement → message "Aucun evenement ce mois"

**AC-5 : Score de sante financiere**
- Given les donnees du mois sont chargees
- When l'onglet "Sante financiere" est actif
- Then le score = couverture_actual * 0.6 + savings_rate * 0.2 + overdueBonus (0 ou 20 si aucun overdue)
- And score >= 80 → vert "Bonne sante", >= 50 → jaune "Points a surveiller", < 50 → rouge "Situation critique"
- And le score est affiche dans un ring anime circulaire

**AC-6 : Alertes prioritaires dynamiques**
- Given les donnees du mois sont chargees
- When des charges sont en retard → alerte critique "X charges en retard"
- When des depenses >= 500$ sont a venir → alerte warning "X gros paiements a venir"
- When paid_total > planned_total → alerte warning "Depenses au-dessus du prevu"
- When aucun overdue ET balance positive → alerte good "Ton mois est sous controle"
- When taux d'epargne >= 10% → alerte good "Taux d'epargne a X%"

**AC-7 : Generation mensuelle idempotente**
- Given c'est la premiere visite du mois
- When la page d'accueil se charge
- Then les instances monthly_expenses et monthly_incomes sont generees depuis les templates
- And appeler la generation plusieurs fois ne cree pas de doublons (ON CONFLICT DO NOTHING)

**AC-8 : Auto-mark mois courant uniquement**
- Given des depenses/revenus UPCOMING existent
- When la page se charge pour le mois courant
- Then autoMarkOverdue marque OVERDUE les depenses non-auto-debit dont due_date < today
- And autoMarkPaidForAutoDebit marque PAID les auto-debit dont due_date <= today
- And autoMarkReceivedForAutoDeposit marque RECEIVED les auto-deposit
- Given le mois affiche n'est PAS le mois courant
- Then aucun auto-mark ne s'execute

**AC-9 : Navigation mensuelle**
- Given l'utilisateur est sur la page d'accueil
- When il navigue vers un mois passe ou futur
- Then les donnees de ce mois sont chargees (avec generation si necessaire)
- And les 3 onglets refletent les donnees du mois selectionne

**AC-10 : Metriques secondaires**
- Given les donnees du mois sont chargees
- When l'onglet "Sante financiere" est actif
- Then les metriques affichent : taux d'epargne, couverture depenses, jours restants ($/jour), coussin de securite (mois couverts par l'epargne, bar a 100% pour 3 mois), valeur nette

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
