# Feature Brief — Suivi des depenses

## Section A — Fonctionnel

### Titre
Suivi mensuel des depenses

### Objectif utilisateur (Job-to-be-done)
En tant qu'utilisateur, je veux suivre mes depenses mois par mois, marquer ce que j'ai paye, ajouter des depenses imprevues, reporter ou modifier des montants, pour garder le controle de mes sorties d'argent.

### Description
Page de suivi mensuel des depenses (`/depenses`). Affiche un monument depense/prevu avec barre de progression. Les depenses sont groupees par statut (A venir, Payees, En retard, Reportees). Filtres par type (planifie/imprevu) et par section. Actions : marquer payee, remettre a venir, reporter a un autre mois, modifier le montant, supprimer (adhoc seulement). FAB pour ajouter une depense imprevue.

### Flows cles

1. **Consulter ses depenses du mois** : Voir toutes les depenses groupees par statut, avec progression paye/prevu.
2. **Marquer une depense comme payee** : Swipe ou menu actions -> "Marquer payee" -> statut passe a PAID, paid_at = today.
3. **Ajouter une depense imprevue** : FAB -> modal AdhocExpenseModal -> saisir nom, montant, section, carte -> ajoutee comme is_planned=false.
4. **Reporter une depense** : Menu actions -> "Reporter" -> choisir mois futur -> instance courante marquee DEFERRED, nouvelle instance UPCOMING creee dans le mois cible.
5. **Modifier le montant** : Menu actions -> "Modifier le montant" -> saisir nouveau montant -> modification pour ce mois uniquement (template inchange).
6. **Supprimer une depense imprevue** : Menu actions -> "Supprimer" -> confirmation -> supprimee (seulement si expense_id IS NULL).
7. **Filtrer** : Par type (tout/charges/imprevus) et par section (pills horizontales).

### Criteres d'acceptation (niveau feature)
- AC-1 : Les depenses sont groupees par statut dans l'ordre : OVERDUE > UPCOMING > DEFERRED > PAID
- AC-2 : Chaque groupe est collapsible et affiche le total du groupe
- AC-3 : Le toggle paid/upcoming fonctionne et rafraichit la page
- AC-4 : Le report cree une nouvelle instance dans le mois cible avec notes "Reporte depuis [mois]"
- AC-5 : La modification de montant n'affecte que l'instance du mois (pas le template)
- AC-6 : Seules les depenses adhoc (expense_id IS NULL) peuvent etre supprimees
- AC-7 : Le FAB n'est visible que pour le mois courant
- AC-8 : Les filtres type et section sont combinables
- AC-9 : Si une depense est liee a une dette (debt_id), le paiement decremente le remaining_balance et log une debt_transaction

### Stories (squelette)
1. Monument depense/prevu + barre de progression
2. Liste groupee par statut avec collapse
3. Filtres type + section
4. Action marquer payee / remettre a venir
5. Action reporter a un autre mois
6. Action modifier le montant
7. Action supprimer (adhoc)
8. Ajout depense imprevue (modal)

### Dependances
- Depends on : Charges fixes (genere les templates), Gestion sections, Gestion cartes
- Used by : Tableau de bord (consomme les donnees)

---

## Section B — Technique

### Routes
- `/depenses` (page.tsx) — Server component
- `/depenses/[id]/edit` (page.tsx) — Edit page

### Source files
- `app/depenses/page.tsx` — Server component
- `components/DepensesTrackingClient.tsx` — Client principal (~877 lignes)
- `components/ExpenseTrackingRow.tsx` — Ligne individuelle
- `components/AdhocExpenseModal.tsx` — Modal ajout imprevu

### Server actions
- `lib/actions/monthly-expenses.ts` : markAsPaid, markAsUpcoming, deleteMonthlyExpense, updateMonthlyExpenseAmount, deferExpenseToMonth

### Tables DB
- monthly_expenses (instances mensuelles)
- expenses (templates)
- debts (pour les versements)
- debt_transactions (log des paiements de dette)
- sections, cards (joins)

### Algorithmes cles
- **Defer** : marque l'instance courante DEFERRED, cree une nouvelle instance expense_id=NULL dans le mois cible.
- **Mark paid + debt** : si debt_id present, decremente remaining_balance, log debt_transaction, auto-deactivate si remaining <= 0.
- **Grouping** : GROUP_ORDER = ['OVERDUE', 'UPCOMING', 'DEFERRED', 'PAID'] depuis lib/constants.

### Notes techniques
- Les sheets sont des bottom sheets sur mobile, des modals centrees sur desktop (media query 1024px).
- Le FAB utilise la classe `fab-mobile-only` (cache sur desktop).
