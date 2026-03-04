# Feature Brief — Charges fixes

## Section A — Fonctionnel

### Titre
Gestion des charges fixes (gabarits de depenses)

### Objectif utilisateur (Job-to-be-done)
En tant qu'utilisateur, je veux configurer mes charges fixes recurrentes (loyer, abonnements, services) et ponctuelles une seule fois, pour qu'elles apparaissent automatiquement chaque mois dans mon suivi.

### Description
Page `/parametres/charges`. Gestion des templates de depenses (RECURRING et ONE_TIME, mais pas PLANNED qui sont dans /projets). Affichage groupe par section avec totaux mensuels. Chaque charge montre : nom, frequence, badge auto-debit, montant mensualise, jour de prelevement, carte associee. CRUD via ExpenseModal.

### Flows cles

1. **Voir ses charges fixes** : Liste groupee par section, avec total mensuel par section et total global.
2. **Ajouter une charge** : Bouton/FAB -> ExpenseModal -> nom, montant, type (recurrent/ponctuel), frequence, jour, section, carte, auto-debit, rappels.
3. **Modifier une charge** : Clic edit -> modal pre-rempli.
4. **Supprimer une charge** : Clic delete -> confirmation inline (Oui/Non).

### Criteres d'acceptation (niveau feature)

**AC-1 : Liste groupee par section**
- Given des charges fixes existent dans differentes sections
- When l'utilisateur consulte /parametres/charges
- Then les charges sont groupees par section
- And chaque section affiche son total mensualise
- And un total global est affiche

**AC-2 : Mensualisation des montants**
- Given une charge a une frequence non-mensuelle
- When elle est affichee
- Then le montant est converti en equivalent mensuel : WEEKLY*52/12, BIWEEKLY*26/12, MONTHLY*1, BIMONTHLY/2, QUARTERLY/3, YEARLY/12
- And le montant original et la frequence sont aussi visibles

**AC-3 : Badge auto-debit**
- Given une charge a auto_debit = true
- When elle est affichee
- Then un badge "auto" est visible a cote du nom

**AC-4 : Charges ponctuelles (ONE_TIME)**
- Given une charge est de type ONE_TIME avec une due_date
- When elle est affichee
- Then la date d'echeance est affichee
- And l'instance mensuelle n'est generee QUE dans le mois de la due_date

**AC-5 : CRUD complet**
- Given l'utilisateur veut gerer ses charges
- When il cree/modifie/supprime une charge via ExpenseModal
- Then la page se rafraichit avec les donnees a jour
- And la suppression est un soft-delete (is_active=false)

**AC-6 : Generation mensuelle correcte**
- Given des charges RECURRING existent
- When generateMonthlyExpenses est appele pour un mois
- Then une instance est creee par charge active dans monthly_expenses
- And les charges YEARLY ne sont generees que pour le mois de l'echeance (sauf si spread_monthly=true)
- And les charges QUARTERLY ne sont generees que tous les 3 mois (sauf si spread_monthly)
- And les charges BIMONTHLY ne sont generees que tous les 2 mois
- **Edge case** : actuellement, YEARLY/QUARTERLY generent une instance CHAQUE mois (BUG connu)

**AC-7 : Jour de prelevement (recurrence_day)**
- Given une charge a un recurrence_day defini
- When l'instance mensuelle est generee
- Then la due_date est au jour indique (clampe au dernier jour du mois si necessaire)
- **Edge case** : si recurrence_day est null, la due_date devrait etre null (pas le 1er par defaut)

### Stories (squelette)
1. Liste groupee par section avec totaux
2. Creation charge (modale)
3. Modification charge
4. Suppression charge
5. Affichage montants mensualises

### Dependances
- Depends on : Gestion sections, Gestion cartes
- Used by : Suivi depenses (generation mensuelle), Tableau de bord

---

## Section B — Technique

### Routes
- `/parametres/charges` (page.tsx)

### Source files
- `app/parametres/charges/page.tsx`
- `components/ExpenseTemplateManager.tsx`
- `components/ExpenseModal.tsx`

### Server actions
- `lib/actions/expenses.ts` : createExpense, updateExpense, deleteExpense, getExpenses

### Tables DB
- expenses (type=RECURRING ou ONE_TIME)
- sections, cards (joins)

### Algorithmes cles
- **Mensualisation** : calcMonthlyCost() dans lib/utils — WEEKLY*52/12, BIWEEKLY*26/12, QUARTERLY/3, YEARLY/12, BIMONTHLY/2.
