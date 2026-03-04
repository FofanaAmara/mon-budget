# Feature Brief — Gestion des dettes

## Section A — Fonctionnel

### Titre
Gestion des dettes et paiements

### Objectif utilisateur (Job-to-be-done)
En tant qu'utilisateur, je veux suivre mes dettes (prets, cartes de credit), voir la balance restante, programmer les versements mensuels automatiques, et faire des paiements supplementaires pour rembourser plus vite.

### Description
Onglet "Dettes" de la page `/projets`. Liste des dettes actives avec balance restante, montant de versement, frequence. Actions : creer/modifier/supprimer une dette, faire un paiement supplementaire. Les versements reguliers sont generes comme monthly_expenses (lies via debt_id). Quand un versement est marque paye, le remaining_balance est decremente et une debt_transaction est logee.

### Flows cles

1. **Voir ses dettes** : Liste des dettes avec balance restante, versement, frequence, % rembourse.
2. **Creer une dette** : Bouton -> DebtModal -> nom, montant original, balance restante, taux interet, versement, frequence, jour, carte.
3. **Paiement supplementaire** : Bouton -> saisir montant + type (regulier/extra) -> decremente balance, log transaction.
4. **Versement automatique** : Genere comme monthly_expense avec debt_id. Quand marque paye -> decremente balance + log.
5. **Auto-deactivation** : Si remaining_balance <= 0 apres paiement -> dette desactivee automatiquement.

### Criteres d'acceptation (niveau feature)

**AC-1 : Liste des dettes avec metriques**
- Given des dettes actives existent
- When l'utilisateur consulte /projets onglet Dettes
- Then chaque dette affiche : nom, balance restante, versement, frequence, % rembourse, montant original
- And les dettes sont triees par balance restante decroissante

**AC-2 : Generation versements mensuels**
- Given une dette active a remaining_balance > 0
- When generateMonthlyExpenses est appele
- Then un monthly_expense est cree avec debt_id, is_planned=true, nom = "[dette] (versement)"
- And le montant est le payment_amount
- And la due_date est calculee depuis payment_day

**AC-3 : Marquer versement paye**
- Given un monthly_expense lie a une dette existe
- When l'utilisateur le marque comme paye (via page /depenses)
- Then remaining_balance de la dette est decremente du montant
- And une debt_transaction type=PAYMENT source=MONTHLY_EXPENSE est logee

**AC-4 : Paiement supplementaire**
- Given une dette active existe
- When l'utilisateur fait un paiement supplementaire via makeExtraPayment
- Then remaining_balance est decremente
- And une debt_transaction type=PAYMENT source=EXTRA_PAYMENT est logee

**AC-5 : Auto-deactivation**
- Given remaining_balance atteint 0 ou moins
- When un paiement est effectue (regulier ou extra)
- Then la dette est automatiquement desactivee (is_active=false)

**AC-6 : CRUD dette**
- Given l'utilisateur veut gerer ses dettes
- When il cree/modifie/supprime via DebtModal
- Then la page se rafraichit
- And la suppression est un soft-delete (is_active=false)

**AC-7 : Etat vide**
- Given aucune dette n'existe
- When l'utilisateur consulte l'onglet Dettes
- Then un message invite a ajouter une dette

### Stories (squelette)
1. Liste des dettes avec metriques
2. CRUD dette
3. Paiement supplementaire
4. Integration versements dans monthly_expenses
5. Auto-deactivation

### Dependances
- Depends on : Gestion cartes, Gestion sections
- Used by : Tableau de bord (carte Dettes, valeur nette), Suivi depenses (versements)

---

## Section B — Technique

### Routes
- `/projets` (page.tsx) — Onglet Dettes du meme composant

### Source files
- `components/ProjetsEpargneClient.tsx` — Onglet Dettes
- `components/DebtModal.tsx` — CRUD dette

### Server actions
- `lib/actions/debts.ts` : getDebts, createDebt, updateDebt, deleteDebt, getTotalDebtBalance, makeExtraPayment
- `lib/actions/debt-transactions.ts` : addDebtTransaction, getMonthlyDebtSummary
- `lib/actions/monthly-expenses.ts` : generateMonthlyExpenses (genere les versements), markAsPaid (decremente balance)

### Tables DB
- debts, debt_transactions, monthly_expenses (debt_id), sections, cards
