# Feature Brief — Depenses a consommation progressive

## Section A — Fonctionnel

### Titre
Depenses a consommation progressive (budget enveloppe)

### Objectif utilisateur (Job-to-be-done)
En tant qu'utilisateur, je veux pouvoir suivre certaines depenses (epicerie, carburant, etc.) de maniere progressive — ajouter mes achats au fur et a mesure et voir l'evolution de ma consommation par rapport au budget que je me suis fixe — pour savoir en temps reel ou j'en suis dans mes enveloppes budgetaires.

### Description
Certaines charges fixes ne sont pas payees en une seule fois : on depense progressivement tout au long du mois (epicerie, carburant, sorties, etc.). L'utilisateur marque ces charges comme "progressives" a la creation. Au lieu du toggle binaire "A venir → Paye", une depense progressive affiche une barre de progression (depense/budget) et permet d'ajouter des sous-transactions incrementales. Quand le cumul depasse le budget, l'indicateur passe en rouge.

### Concepts cles
- **Depense progressive** : une charge recurrente dont le montant est un budget-enveloppe, consomme par petites transactions au fil du mois.
- **Sous-transaction** : un achat individuel enregistre contre une depense progressive (ex: "Epicerie Metro — 87,50$").
- **Budget-enveloppe** : le montant defini sur le template (expenses.amount) sert de plafond, pas de montant exact.

### Decisions utilisateur
1. **Qui decide si une charge est progressive ?** L'utilisateur, a la creation du template (toggle dans le formulaire).
2. **Que se passe-t-il si on depasse le budget ?** Affichage en rouge du montant et de la barre — aucun blocage.
3. **Que se passe-t-il en fin de mois ?** Rien d'automatique. L'utilisateur gere. S'il veut epargner le reste, il le fait manuellement.
4. **Peut-on convertir une charge existante en progressive ?** Oui, via l'edition du template.

### Flows cles

1. **Creer une charge progressive** : Formulaire charges → activer le toggle "Consommation progressive" → le montant devient un budget-enveloppe.
2. **Ajouter une sous-transaction** : Page depenses → depense progressive → action "Ajouter un achat" → saisir montant + note optionnelle → paid_amount incremente, sous-transaction enregistree.
3. **Voir la progression** : La depense affiche [depense / budget] avec barre de progression. Si depense > budget → barre rouge + badge.
4. **Voir l'historique** : L'utilisateur peut voir la liste des sous-transactions de ce mois.

### Criteres d'acceptation (niveau feature)

**AC-1 : Toggle progressif a la creation**
- Given l'utilisateur cree une nouvelle charge recurrente
- When il active le toggle "Consommation progressive"
- Then le template est cree avec is_progressive=true
- And le champ montant affiche un label "Budget mensuel" au lieu de "Montant"

**AC-2 : Affichage progressif dans la liste des depenses**
- Given une depense progressive existe pour le mois avec paid_amount=350 et amount=1000
- When l'utilisateur consulte la page /depenses
- Then la depense affiche "350 $ / 1 000 $" avec une barre de progression a 35%
- And le statut n'est PAS un toggle UPCOMING/PAID mais un indicateur de progression

**AC-3 : Ajouter une sous-transaction**
- Given une depense progressive existe pour le mois
- When l'utilisateur clique "Ajouter un achat" et saisit 87,50
- Then paid_amount passe de 350 a 437,50
- And une sous-transaction est enregistree avec montant=87,50, date=now
- And la barre de progression se met a jour

**AC-4 : Depassement du budget**
- Given une depense progressive a paid_amount >= amount (budget)
- When l'utilisateur consulte la page
- Then le montant et la barre sont affiches en rouge
- And un badge "Depassement" ou equivalent visuel s'affiche

**AC-5 : Historique des sous-transactions**
- Given une depense progressive a plusieurs sous-transactions ce mois
- When l'utilisateur ouvre le detail
- Then il voit la liste chronologique des achats (date, montant, note)

**AC-6 : Pas de toggle PAID/UPCOMING pour les progressives**
- Given une depense est progressive
- When l'utilisateur consulte les actions disponibles
- Then "Marquer payee" et "Remettre a venir" ne sont PAS disponibles
- And "Ajouter un achat" est disponible a la place

**AC-7 : Generation mensuelle**
- Given un template est is_progressive=true
- When le mois est genere (monthly_expenses)
- Then l'instance est creee avec paid_amount=0 et status=UPCOMING

**AC-8 : Edition du template existant**
- Given une charge recurrente non-progressive existe
- When l'utilisateur l'edite et active "Consommation progressive"
- Then les futures instances generees seront progressives
- And l'instance du mois courant n'est PAS modifiee retroactivement

### Stories
1. Migration DB : is_progressive, paid_amount, expense_transactions
2. Server actions : addExpenseTransaction, requetes de calcul
3. UI creation/edition : toggle progressif sur le formulaire de charges
4. UI suivi : barre de progression, action "Ajouter un achat", historique, depassement rouge

### Dependances
- Depends on : Charges fixes (templates), Suivi depenses (page /depenses, action sheet)
- Used by : Tableau de bord (consomme les totaux)

---

## Section B — Technique

### Approche DB

**Nouvelle colonne sur expenses (template)** :
- `is_progressive` BOOLEAN DEFAULT FALSE

**Nouvelle colonne sur monthly_expenses (instance)** :
- `paid_amount` DECIMAL(10,2) DEFAULT 0

**Nouvelle table expense_transactions** (miroir de savings_contributions) :
| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | |
| user_id | TEXT | NOT NULL | |
| monthly_expense_id | UUID | NOT NULL, FK monthly_expenses ON DELETE CASCADE | Instance mensuelle cible |
| amount | DECIMAL(10,2) | NOT NULL | Montant de la transaction |
| note | TEXT | | Description optionnelle |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |

Index : idx_expense_tx_monthly(monthly_expense_id, created_at DESC).

### Routes
- `/depenses` — Enrichi (pas de nouvelle page)

### Server actions
- `addExpenseTransaction(monthlyExpenseId, amount, note?)` : insere une sous-transaction + incremente paid_amount dans la meme transaction SQL.
- Generation mensuelle : si is_progressive=true → paid_amount=0 sur l'instance.

### Composants UI
- Toggle dans le formulaire de creation/edition de charge
- Barre de progression dans ExpenseTrackingRow (conditionnel sur is_progressive)
- Sheet "Ajouter un achat" dans ExpenseActionSheet
- Vue historique des sous-transactions (expansion ou sheet)

### Patterns a suivre
- `expense_transactions` suit le meme pattern que `savings_contributions` (FK vers l'instance, montant, note, timestamps)
- `addExpenseTransaction` suit le meme pattern que `addSavingsContribution` (transaction SQL : INSERT + UPDATE paid_amount)
- La barre de progression suit le pattern existant du monument (pourcentage + couleur conditionnelle)
