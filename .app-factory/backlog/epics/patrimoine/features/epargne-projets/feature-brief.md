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

**AC-1 : Liste des projets avec progression**
- Given des projets d'epargne existent (type=PLANNED)
- When l'utilisateur consulte /projets onglet Epargne
- Then chaque projet affiche : nom, saved_amount, target_amount, progress %, suggestion mensuelle
- And la suggestion = (target - saved) / mois restants jusqu'a target_date

**AC-2 : Contribution a un projet**
- Given un projet d'epargne existe
- When l'utilisateur ajoute une contribution via AddSavingsModal
- Then saved_amount est incremente du montant
- And un savings_contribution est loge (montant + note)
- And la page se rafraichit avec les nouveaux totaux

**AC-3 : Historique des contributions**
- Given un projet a des contributions
- When l'utilisateur consulte l'historique via SavingsHistoryModal
- Then toutes les contributions sont listees (montant, note, date) triees par date desc

**AC-4 : Epargne libre**
- Given l'utilisateur n'a pas de projet specifique
- When il utilise l'epargne libre
- Then c'est un expense PLANNED sans target_amount (nommee "Epargne libre")
- And il peut y ajouter des contributions comme un projet normal

**AC-5 : Transfert entre projets**
- Given deux projets d'epargne existent
- When l'utilisateur transfere un montant de A vers B
- Then saved_amount de A est decremente
- And saved_amount de B est incremente
- And deux savings_contributions sont logees (negative pour source, positive pour destination)

**AC-6 : CRUD projet**
- Given l'utilisateur veut gerer ses projets
- When il cree/modifie/supprime via ProjectModal
- Then la page se rafraichit
- And la suppression est un soft-delete (is_active=false)

**AC-7 : Etat vide**
- Given aucun projet n'existe
- When l'utilisateur consulte la page
- Then un message invite a creer son premier projet

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
