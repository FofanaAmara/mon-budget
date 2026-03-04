# Plan : Corrections depenses + enveloppes budget

## Contexte

Tests avec compte reel revelent 5 problemes dans la gestion des depenses :
1. Favicon affiche l'ancien logo (cache PWA)
2. Dashboard dit "2 400$ budget depasse" alors que le revenu attendu est 6 500$
3. Tax Scolaire (annuelle $3,642) ajoutee en entier au mois courant
4. Toutes les depenses marquees "en retard" car `recurrence_day` default a `1`
5. Pas de concept d'enveloppe budget (Epicerie $1,000/mois = budget avec sous-depenses, pas une facture unique)

---

## Correction 1 — Favicon (cache PWA)

**Probleme** : Le SVG est correct (`public/icons/favicon.svg` = compass teal) mais le navigateur/SW cache l'ancien.

**Fichiers** :
- `public/sw.js` — bumper `CACHE_NAME` de `'mes-finances-v1'` a `'mes-finances-v2'`
- `public/manifest.json` — changer `theme_color` de `#3D3BF3` (ancien bleu) a `#0F766E` (teal actuel)

---

## Correction 2 — "Budget depasse" sur le dashboard

**Probleme** : `AccueilClient.tsx:50` calcule `availableAmount = incomeSummary.actualTotal - summary.paid_total`. Comme aucun revenu n'est marque RECEIVED, `actualTotal = 0`, donc `0 - 2400 = -2400`.

**Fix** : Utiliser `expectedTotal` au lieu de `actualTotal` pour le calcul du budget disponible.

**Fichier** : `components/AccueilClient.tsx`
```
// Avant
const availableAmount = incomeSummary.actualTotal - summary.paid_total;

// Apres
const availableAmount = incomeSummary.expectedTotal - summary.paid_total;
```

Resultat : `6500 - 2400 = 4100$` → "Ton mois est sous controle" avec 4 100$ disponible.

---

## Correction 3 — "En retard" pour toutes les depenses

**Probleme double** :
- `ExpenseModal.tsx:32` : `day` default a `'1'` → toute charge creee sans date explicite a `due_date = 1er du mois` → passe le 2 = OVERDUE
- Certaines depenses (enveloppes) ne devraient jamais etre "en retard"

**Fichiers** :

### 3a. `components/ExpenseModal.tsx`
- Changer default de `day` : `useState(expense?.recurrence_day?.toString() ?? '')` (vide au lieu de '1')
- Rendre le champ "Jour du mois" optionnel dans l'UI (afficher un placeholder "Optionnel")
- Si vide, envoyer `recurrence_day: undefined` au server action

### 3b. `lib/actions/monthly-expenses.ts`
- `calcDueDateForMonth()` : si `recurrence_day` est null, retourner null (pas de due_date)
- `generateMonthlyExpenses()` : permettre `due_date = null` dans l'INSERT
- `autoMarkOverdue()` : ajouter condition `AND due_date IS NOT NULL` au WHERE

```sql
-- Avant
AND due_date < ${today}::date

-- Apres
AND due_date IS NOT NULL
AND due_date < ${today}::date
```

### 3c. Nettoyage donnees existantes
- Requete SQL one-shot : remettre les OVERDUE sans vraie date a UPCOMING

---

## Correction 4 — Depenses annuelles/trimestrielles

**Probleme** : `calcDueDateForMonth()` retourne une date pour CHAQUE mois pour YEARLY/QUARTERLY (lignes 37-41), creant 12 instances. Le multiplier `1/12` devrait donner $303.50, mais `ON CONFLICT DO NOTHING` preserve les anciens montants errones.

**Choix utilisateur** : Laisser l'utilisateur choisir entre "repartir mensuellement" et "paiement aux dates prevues".

**Fichiers** :

### 4a. Schema DB — ajouter champ `spread_monthly`
```sql
ALTER TABLE expenses ADD COLUMN spread_monthly BOOLEAN DEFAULT false;
```
- `spread_monthly = true` → repartir (12 × montant/12 pour YEARLY)
- `spread_monthly = false` → instance seulement au mois du (montant complet)

### 4b. `components/ExpenseModal.tsx`
- Quand frequence = QUARTERLY ou YEARLY : afficher toggle "Repartir mensuellement ?"
- Si coche → `spread_monthly = true`

### 4c. `lib/actions/monthly-expenses.ts` — `generateMonthlyExpenses()`
- Si `spread_monthly = true` : comportement actuel (multiplier + instance chaque mois)
- Si `spread_monthly = false` ET frequence YEARLY :
  - `calcDueDateForMonth()` ne retourne une date que dans le mois du `next_due_date`
  - Montant = montant complet (pas de multiplier)
- Si `spread_monthly = false` ET frequence QUARTERLY :
  - Instance seulement tous les 3 mois, montant complet

### 4d. `lib/actions/monthly-expenses.ts` — `ON CONFLICT`
- Changer de `DO NOTHING` a `DO UPDATE SET amount = EXCLUDED.amount WHERE status = 'UPCOMING'`
- Permet de corriger les montants des instances existantes non-payees

### 4e. `lib/actions/expenses.ts` — `getMonthlySummaryBySection()`
- Garder le calcul mensuel equivalent (pour le resume dans reglages)
- Cette vue montre toujours le cout mensuel lisse, meme si le paiement est annuel

---

## Correction 5 — Enveloppes budget (Epicerie, Transport, etc.)

**Concept** : Certaines charges sont des **factures** (paiement unique), d'autres sont des **enveloppes budget** (budget mensuel avec sous-depenses tout au long du mois).

### 5a. Schema DB

```sql
-- Nouveau champ sur le template
ALTER TABLE expenses ADD COLUMN budget_type VARCHAR(10) DEFAULT 'BILL'
  CHECK (budget_type IN ('BILL', 'ENVELOPE'));

-- Lien parent pour les sous-depenses
ALTER TABLE monthly_expenses ADD COLUMN parent_id UUID REFERENCES monthly_expenses(id) ON DELETE CASCADE;
```

### 5b. `components/ExpenseModal.tsx`
- Pour RECURRING : ajouter toggle "Type" → Facture / Budget (enveloppe)
- Facture : comportement actuel (montant fixe, date de paiement)
- Enveloppe : montant = budget mensuel, pas de date requise

### 5c. `lib/actions/monthly-expenses.ts`

**generateMonthlyExpenses()** :
- Pour `budget_type = 'ENVELOPE'` : creer instance avec `due_date = NULL`, `status = 'UPCOMING'`
- Ne JAMAIS marquer OVERDUE (ajouter `AND budget_type != 'ENVELOPE'` ou verifier via JOIN)

**Nouvelle fonction `addEnvelopeTransaction()`** :
```typescript
export async function addEnvelopeTransaction(data: {
  parentId: string;      // monthly_expense id de l'enveloppe
  amount: number;
  note?: string;
}): Promise<void>
```
- Cree un `monthly_expenses` avec :
  - `parent_id = data.parentId`
  - `status = 'PAID'`, `paid_at = today`
  - `month`, `section_id`, `user_id` herites du parent
  - `expense_id = NULL` (pas de template, c'est une sous-depense)
  - `is_planned = false`

**Nouvelle fonction `getEnvelopeTransactions(parentId)`** :
- Retourne les sous-depenses d'une enveloppe pour l'affichage

**Mise a jour `getMonthSummary()`** :
- `paid_total` : inclure les sous-depenses (elles ont `status = 'PAID'`)
- `planned_total` : compter le montant de l'enveloppe parent (pas les sous-depenses)
- Eviter le double-comptage : les sous-depenses ne doivent pas etre comptees dans `planned_total`
  → Condition : `WHERE parent_id IS NULL` pour planned_total, ou `is_planned` deja gere ca

**Mise a jour `getMonthlyExpenses()`** :
- Exclure les sous-depenses de la liste principale (`WHERE parent_id IS NULL`)
- Les sous-depenses sont chargees separement par enveloppe

### 5d. UI — Page Depenses (delegation design-integrator)

**Affichage enveloppe** (remplace la ligne facture) :
- Icone section + Nom (ex: "Epicerie")
- Barre de progression : `depense / budget` (ex: "200$ / 1 000$")
- Badge : "800$ restant" (vert) ou "400$ depasse" (rouge si > budget)
- Bouton "+" pour ajouter une sous-depense
- Clic → expand pour voir les sous-depenses (date + montant + note)

**Mini-modal "Ajouter une depense"** :
- Montant (requis)
- Note (optionnel, ex: "Metro St-Laurent")
- Date (optionnel, default aujourd'hui)
- Bouton "Ajouter"

---

## Fichiers modifies (resume)

| Fichier | Corrections |
|---------|-------------|
| `public/sw.js` | #1 bump cache |
| `public/manifest.json` | #1 theme_color |
| `components/AccueilClient.tsx` | #2 expectedTotal |
| `components/ExpenseModal.tsx` | #3 day optionnel, #4 spread toggle, #5 budget_type |
| `lib/actions/monthly-expenses.ts` | #3 overdue NULL, #4 spread logic + DO UPDATE, #5 envelope functions |
| `lib/actions/expenses.ts` | #5 summary adjustments |
| `components/DepensesTrackingClient.tsx` | #5 envelope UI (via design-integrator) |
| Schema DB (migration SQL) | #4 spread_monthly, #5 budget_type + parent_id |

---

## Ordre d'execution

1. **Migration DB** : ALTER TABLE (spread_monthly, budget_type, parent_id)
2. **Corrections 1-3** : Favicon + budget depasse + en retard (rapides, independants)
3. **Correction 4** : Spread monthly pour annuelles/trimestrielles
4. **Correction 5a-c** : Backend enveloppes (server actions + generation)
5. **Correction 5d** : UI enveloppes (delegation design-integrator par CLAUDE.md)
6. **Nettoyage** : Remettre les OVERDUE invalides a UPCOMING, recalculer montants

---

## Verification (Playwright MCP)

1. `npm run build` → 0 erreurs
2. Login avec fofana.amara@outlook.fr
3. Dashboard : plus "budget depasse", affiche montant disponible positif
4. Depenses : aucune depense "en retard" par defaut
5. Creer charge YEARLY $3,642 avec spread=false → apparait 1 seul mois
6. Creer charge YEARLY $3,642 avec spread=true → $303.50/mois
7. Creer enveloppe "Epicerie" $1,000 → affichage barre progression
8. Ajouter sous-depense $200 → barre montre "200$ / 1 000$", "800$ restant"
9. Favicon = compass teal (pas ancien logo bleu)
10. Deployer et verifier en production
