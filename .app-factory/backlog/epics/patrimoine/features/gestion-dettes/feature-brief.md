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
- AC-1 : Chaque dette affiche : nom, balance restante, versement/frequence, % rembourse, montant original
- AC-2 : Les versements reguliers sont generes comme monthly_expenses (via generateMonthlyExpenses)
- AC-3 : Marquer un versement paye decremente le remaining_balance et loge une debt_transaction
- AC-4 : Le paiement supplementaire decremente la balance et loge une debt_transaction source=EXTRA_PAYMENT
- AC-5 : Une dette est auto-desactivee quand remaining_balance <= 0

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
