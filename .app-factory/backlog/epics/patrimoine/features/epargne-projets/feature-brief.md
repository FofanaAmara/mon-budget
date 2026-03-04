# Feature Brief — Epargne et projets

## Section A — Fonctionnel

### Titre
Gestion de l'epargne et des projets

### Objectif utilisateur (Job-to-be-done)
En tant qu'utilisateur, je veux creer des projets d'epargne avec des objectifs (montant cible, date cible), ajouter des contributions, voir ma progression, et gerer une epargne libre (sans objectif specifique).

### Description
Page `/projets` avec deux onglets : Epargne (projets + epargne libre) et Dettes. Pour l'onglet Epargne : liste des projets avec progress bars, epargne libre, actions (ajouter contribution, voir historique, transferer entre projets). CRUD projets via modal.

### Flows cles

1. **Voir ses projets d'epargne** : Liste des projets avec progress (saved_amount/target_amount), suggestion mensuelle, date cible.
2. **Creer un projet** : FAB -> ProjectModal -> nom, montant cible, date cible, section.
3. **Ajouter une contribution** : Bouton "+" sur un projet -> AddSavingsModal -> montant, note -> incremente saved_amount + log savings_contribution.
4. **Voir l'historique** : Bouton historique -> SavingsHistoryModal -> liste des contributions.
5. **Transferer entre projets** : TransferSavingsModal -> choisir source/destination, montant.
6. **Epargne libre** : Un pseudo-projet "Epargne libre" sans objectif, avec contributions.

### Criteres d'acceptation (niveau feature)
- AC-1 : Chaque projet affiche : nom, saved_amount, target_amount, progress %, suggestion mensuelle
- AC-2 : La suggestion mensuelle = (target - saved) / mois restants
- AC-3 : Les contributions incrementent saved_amount sur l'expense et logent un savings_contribution
- AC-4 : L'epargne libre est un expense de type PLANNED sans target_amount
- AC-5 : Le transfert deplace des fonds entre deux projets (decremente source, incremente destination)

### Stories (squelette)
1. Liste des projets avec progression
2. CRUD projet d'epargne
3. Contribution a un projet
4. Historique des contributions
5. Transfert entre projets
6. Epargne libre

### Dependances
- Depends on : Gestion sections, Gestion cartes
- Used by : Tableau de bord (carte Epargne, valeur nette), Allocation revenus (liaison projet)

---

## Section B — Technique

### Routes
- `/projets` (page.tsx) — Server component

### Source files
- `app/projets/page.tsx`
- `components/ProjetsEpargneClient.tsx` — Client principal (~600+ lignes, onglets Epargne + Dettes)
- `components/ProjectModal.tsx` — CRUD projet
- `components/AddSavingsModal.tsx` — Ajout contribution
- `components/SavingsHistoryModal.tsx` — Historique
- `components/TransferSavingsModal.tsx` — Transfert

### Server actions
- `lib/actions/expenses.ts` : createExpense (type=PLANNED), updateExpense, deleteExpense, getPlannedExpenses, addSavingsContribution, getSavingsHistory

### Tables DB
- expenses (type=PLANNED, target_amount, saved_amount)
- savings_contributions (log des contributions)
- sections, cards
