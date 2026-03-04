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

**AC-1 : Groupement par statut**
- Given des depenses existent pour le mois
- When l'utilisateur consulte la page /depenses
- Then les depenses sont groupees dans l'ordre : OVERDUE > UPCOMING > DEFERRED > PAID
- And chaque groupe affiche son total et le nombre d'items
- And chaque groupe est collapsible (expand/collapse)

**AC-2 : Monument depense/prevu avec barre de progression**
- Given des depenses existent pour le mois
- When l'utilisateur consulte la page
- Then le monument affiche paye/prevu (charges planifiees)
- And la barre de progression montre le % depense
- And si paye > prevu, un badge "au-dessus" s'affiche en rouge
- And si des depenses sont en retard, un badge "{N} en retard" s'affiche

**AC-3 : Toggle paye/a venir**
- Given une depense est en statut UPCOMING ou OVERDUE
- When l'utilisateur la marque comme payee
- Then le statut passe a PAID, paid_at = today
- And la page se rafraichit avec les nouveaux totaux
- Given une depense est en statut PAID
- When l'utilisateur la remet a venir
- Then le statut revient a UPCOMING, paid_at = null

**AC-4 : Reporter une depense**
- Given une depense est UPCOMING ou OVERDUE (pas PAID ni DEFERRED)
- When l'utilisateur choisit "Reporter" et selectionne un mois futur
- Then l'instance courante est marquee DEFERRED
- And une nouvelle instance UPCOMING est creee dans le mois cible avec expense_id=NULL
- And la note "Reporte depuis [mois source]" est ajoutee

**AC-5 : Modifier le montant (ce mois uniquement)**
- Given une depense est UPCOMING ou OVERDUE
- When l'utilisateur modifie le montant
- Then seule l'instance monthly_expenses est modifiee
- And le template (expenses) reste inchange
- And un montant negatif ou zero est refuse cote client

**AC-6 : Suppression (adhoc seulement)**
- Given une depense a expense_id IS NULL (adhoc/imprevu)
- When l'utilisateur supprime la depense
- Then elle est supprimee de monthly_expenses
- Given une depense a un expense_id (liee a un template)
- Then l'option supprimer n'est PAS disponible

**AC-7 : FAB mois courant uniquement**
- Given le mois affiche est le mois courant
- Then le FAB "Ajouter une depense imprevue" est visible
- Given le mois affiche est un mois passe ou futur
- Then le FAB est masque

**AC-8 : Filtres combinables**
- Given des depenses de types planifie et imprevu existent, reparties sur plusieurs sections
- When l'utilisateur filtre par type "Charges" ET section "Logement"
- Then seules les depenses planifiees de la section Logement s'affichent
- And le filtre "Tout" affiche toutes les depenses

**AC-9 : Integration dette**
- Given une depense est liee a une dette (debt_id non null)
- When l'utilisateur la marque payee
- Then remaining_balance de la dette est decremente du montant
- And une debt_transaction source=MONTHLY_EXPENSE est logee
- And si remaining_balance <= 0, la dette est auto-desactivee

**AC-10 : Etat vide**
- Given aucune depense n'existe pour le mois
- When l'utilisateur consulte la page
- Then un message "Aucune depense ce mois" s'affiche

**AC-11 : Auto-mark overdue**
- Given des depenses UPCOMING ont une due_date passee et ne sont pas auto-debit
- When la page est chargee pour le mois courant
- Then ces depenses sont automatiquement marquees OVERDUE

**AC-12 : Auto-mark paid (auto-debit)**
- Given des depenses UPCOMING sont auto-debit et due_date <= today
- When la page est chargee pour le mois courant
- Then ces depenses sont automatiquement marquees PAID avec paid_at = due_date

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
