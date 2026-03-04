# Feature Brief — Revenus recurrents

## Section A — Fonctionnel

### Titre
Gestion des sources de revenus recurrents

### Objectif utilisateur (Job-to-be-done)
En tant qu'utilisateur, je veux configurer mes sources de revenus (emploi, business, investissement) une seule fois, pour que mes revenus attendus apparaissent automatiquement chaque mois.

### Description
Page `/parametres/revenus`. Gestion des templates de revenus. Chaque source a : nom, type de source (Emploi/Business/Investissement/Autre), montant, frequence (Mensuel/Bi-hebdo/Annuel/Variable), date d'ancrage paie, auto-depot. Affichage en cartes avec montant mensualise, prochaine date de depot, badges (auto-depot, variable).

### Flows cles

1. **Voir ses sources de revenus** : Liste de cartes, chacune avec icone source, nom, frequence, montant mensualise, prochaine date.
2. **Ajouter une source** : Bouton/FAB -> IncomeModal -> nom, source, montant, frequence, date d'ancrage, auto-depot.
3. **Modifier une source** : Menu 3 points -> Modifier -> modal pre-rempli.
4. **Supprimer une source** : Menu 3 points -> Supprimer -> confirm() natif.

### Criteres d'acceptation (niveau feature)

**AC-1 : Mensualisation des montants**
- Given une source de revenu a une frequence non-mensuelle
- When elle est affichee
- Then le montant est mensualise : BIWEEKLY * 2.17, YEARLY / 12
- **Edge case** : le multiplicateur BIWEEKLY 2.17 vs 26/12=2.1667 — incoherence potentielle avec la generation mensuelle qui utilise le vrai nombre de paies

**AC-2 : Prochaines dates biweekly**
- Given une source BIWEEKLY a une date d'ancrage (pay_anchor_date)
- When elle est affichee
- Then la prochaine date de paie est calculee en ajoutant 14 jours depuis l'ancrage

**AC-3 : Sources variables**
- Given une source est de type VARIABLE
- When elle est affichee
- Then un badge "Variable" est visible
- And le montant estime est affiche (pas un montant fixe)

**AC-4 : Badge auto-depot**
- Given une source a auto_deposit = true
- When elle est affichee
- Then un badge "Depot auto" est visible

**AC-5 : CRUD complet**
- Given l'utilisateur veut gerer ses sources de revenus
- When il cree/modifie/supprime via IncomeModal
- Then la page se rafraichit
- And la suppression utilise confirm() natif

### Stories (squelette)
1. Liste des sources avec metriques
2. Creation source (modale)
3. Modification source
4. Suppression source

### Dependances
- Depends on : Aucune
- Used by : Suivi revenus (generation mensuelle), Allocation revenus (revenu mensuel attendu), Tableau de bord

---

## Section B — Technique

### Routes
- `/parametres/revenus` (page.tsx)

### Source files
- `app/parametres/revenus/page.tsx`
- `components/IncomeTemplateManager.tsx`
- `components/IncomeModal.tsx`

### Server actions
- `lib/actions/incomes.ts` : createIncome, updateIncome, deleteIncome, getIncomes, getMonthlyIncomeTotal

### Tables DB
- incomes

### Algorithmes cles
- **Mensualisation** : calcMonthlyIncome() dans lib/utils.
- **Prochaine date biweekly** : getNextBiweeklyPayDate() — ajoute 14 jours depuis l'ancrage jusqu'a depasser today.
- **countBiweeklyPayDatesInMonth** : compte les dates de paie biweekly dans un mois donne (2 ou 3 selon le mois).
