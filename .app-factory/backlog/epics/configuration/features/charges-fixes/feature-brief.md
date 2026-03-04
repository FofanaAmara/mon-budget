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
- AC-1 : Les charges sont groupees par section avec total mensualise par section
- AC-2 : Les montants non-mensuels sont convertis en equivalent mensuel (BIWEEKLY * 26/12, etc.)
- AC-3 : Le badge "auto" indique les prelevements automatiques
- AC-4 : Les charges ONE_TIME affichent leur date d'echeance
- AC-5 : CRUD fonctionnel avec rafraichissement de la page

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
