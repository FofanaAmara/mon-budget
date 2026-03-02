# Plan — Allocation du revenu (Envelope Budgeting) — v3

## Executive Summary

**Contexte :** L'utilisateur reçoit un revenu mensuel et veut le décomposer en enveloppes macro avant de dépenser : "2 000 $ pour les charges de la maison, 500 $ épargne voyage, 1 000 $ transport". Ce n'est pas un budget détaillé — c'est une **intention de répartition** au niveau des grandes catégories. Le détail (loyer 1 500$, assurance 200$…) reste visible dans `/depenses`.

**Ce que c'est :** Un outil de *envelope budgeting* — diviser le revenu en compartiments nommés, visualiser l'intention vs la réalité, et piloter l'épargne par projet.

**Ce que ce n'est PAS :**
- Un système de comptabilité détaillé
- Une fonctionnalité du dashboard (trop détaillé pour y figurer)
- Un créateur automatique de contributions d'épargne

**Architecture :**
- `/parametres/allocation` — CRUD des templates d'enveloppes (définition permanente)
- `/revenus` Tab "Allocation" — vue mensuelle + override pour le mois courant
- **Dashboard : inchangé** — aucune carte allocation

**Même pattern que expenses → monthly_expenses :** template → génération mensuelle idempotente.

---

## Current State — Baseline factuelle

### Données existantes (DB)

| Table | Colonnes clés | Pertinence |
|-------|--------------|-----------|
| `sections` | id, name, icon, color, position | Maison, Perso, Transport, Business… — pivot pour allocations de charges |
| `incomes` / `monthly_incomes` | amount, frequency, auto_deposit, expected_amount | Total revenu du mois = base de calcul du "disponible" |
| `expenses` (PLANNED) | id, name, target_amount, saved_amount, target_date | Projets d'épargne existants : Voyage Japon (2400$/8000$), MacBook (1200$/3500$)… |
| `monthly_expenses` | amount, section_id, month, status | Dépenses réelles par section et par mois |

### Ce qui manque
- Aucune table `income_allocations` ni `monthly_allocations`
- Aucune vue "alloué vs disponible"
- Aucune comparaison "alloué vs dépensé" par section pour un mois donné
- Aucune page `/parametres/allocation`
- Aucun onglet "Allocation" sur `/revenus`
- Pas de fonction `getMonthlyExpenseActualsBySection(month)`

---

## Future State — Critères mesurables

1. `/parametres/allocation` accessible, CRUD complet des enveloppes templates
2. `/revenus` affiche 2 tabs : "Revenus" (actuel) + "Allocation"
3. Tab Allocation : enveloppes du mois + dépensé réel si section liée + progression si projet épargne lié
4. "Disponible attendu" = revenu attendu − total alloué | "Disponible actuel" = revenu reçu − alloué
5. Allocations temporaires : skip automatique si `month > end_month`
6. Auto-skip si projet épargne atteint (`saved_amount >= target_amount`)
7. Override mensuel : modifier le montant d'une enveloppe pour un mois sans toucher au template
8. Dashboard : inchangé
9. `npm run build` → 0 erreur TypeScript à chaque phase

---

## Les 3 types d'allocations

### Type 1 : Charges (lié à une section)
> "2 000 $ pour Maison" → liée à la section 🏠 Maison

- Tab Allocation compare automatiquement : **alloué 2 000 $** vs **dépensé 1 840 $** (depuis `monthly_expenses`)
- Signal visuel : ✅ dans le budget | ⚠ si alloué < charges réelles de la section
- La granularité reste correcte : les 2 000$ couvrent loyer + assurance + internet

### Type 2 : Épargne (lié à un projet PLANNED)
> "500 $/mois → Voyage Japon 2027"

- Liée à `expenses.type = 'PLANNED'` (projets dans `/projets`)
- Si projet avec `target_amount` : progression (2 400 $/8 000 $ → 30%, ~11 mois restants)
- Si épargne libre (pas de `target_amount`) : cumul uniquement
- **Important** : l'allocation est une INTENTION — elle ne crée PAS de contribution automatique dans `savings_contributions`

### Type 3 : Libre (sans lien)
> "300 $ Loisirs" — pas de section, pas de projet

- Budget d'intention pure, pas de suivi automatique
- Utile pour des enveloppes de vie courante (restaurant, loisirs)

---

## Angles morts identifiés et réponses

### 1. L'allocation n'est PAS une transaction
**Solution :** Sous-texte dans AllocationModal : *"L'allocation réserve le budget dans votre plan. Pour enregistrer la contribution, allez dans Projets."*

### 2. Disponible théorique vs disponible actuel
**Solution :** Deux lignes dans le Tab Allocation :
- **Disponible attendu** = revenu attendu − alloué
- **Disponible actuel** = revenu reçu − alloué (mois en cours seulement)

### 3. Surallocation (total alloué > revenu)
**Solution :** Badge orange "Surallocation de X$" dans le hero du Tab Allocation et dans les Réglages. Non-bloquant.

### 4. Sous-allocation (alloué < charges réelles de la section)
**Solution :** Badge ⚠ "Sous-alloué de 400$" sur l'enveloppe dans le Tab Allocation.

### 5. Suppression d'une section liée
**Solution :** `ON DELETE SET NULL` sur FK `section_id` → allocation devient "sans section liée" mais reste active.

### 6. Désactivation automatique d'une allocation d'épargne
**Solution :** Dans `generateMonthlyAllocations` : si `project.saved_amount >= project.target_amount` → skip. Badge "✓ Objectif atteint" dans les Réglages.

### 7. Allocations temporaires sans projet lié
**Solution :** Champ `end_month` sur le template. Skip automatique dans la génération si `month > end_month`.

### 8. L'ordre des enveloppes = priorités
**Solution :** Champ `position` + boutons ↑/↓ dans les Réglages.

### 9. Mois passés = lecture seule
**Solution :** Tab Allocation sur `/revenus` : boutons "Modifier" visibles uniquement pour le mois courant.

---

## Modèle de données

### Table `income_allocations`
```sql
CREATE TABLE income_allocations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     TEXT NOT NULL,
  label       TEXT NOT NULL,
  amount      NUMERIC(10,2) NOT NULL,
  section_id  UUID REFERENCES sections(id) ON DELETE SET NULL,
  project_id  UUID REFERENCES expenses(id) ON DELETE SET NULL,
  end_month   VARCHAR(7),           -- "YYYY-MM" — NULL = permanent
  color       VARCHAR(20) DEFAULT '#6B6966',
  position    INT DEFAULT 0,
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);
```

### Table `monthly_allocations`
```sql
CREATE TABLE monthly_allocations (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          TEXT NOT NULL,
  allocation_id    UUID NOT NULL REFERENCES income_allocations(id),
  month            VARCHAR(7) NOT NULL,
  allocated_amount NUMERIC(10,2) NOT NULL,
  notes            TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(allocation_id, month)
);
```

---

## Gap Analysis

| Gap | Actuel | Futur | Comment combler |
|-----|--------|-------|-----------------|
| Modèle de données | Aucune table allocation | 2 nouvelles tables | Migration + types |
| Actuals par section | Inexistant | `getMonthlyExpenseActualsBySection(month)` | Nouvelle fn dans `expenses.ts` |
| Génération mensuelle | Inexistante | `generateMonthlyAllocations(month)` — idempotent, skip temporel + skip si objectif atteint | `allocations.ts` |
| Override mensuel | Inexistant | `updateMonthlyAllocation(id, amount, notes?)` | `allocations.ts` |
| UI Réglages | Aucune page allocation | `/parametres/allocation` + AllocationsManager + AllocationModal | 3 nouveaux fichiers |
| UI `/revenus` | 1 seule vue | 2 tabs : Revenus + Allocation | Modifier RevenusTrackingClient |

---

## Impact Analysis

### Nouveaux fichiers (5)

| Fichier | Rôle |
|---------|------|
| `scripts/migrate-allocations.mjs` | Crée les 2 tables |
| `lib/actions/allocations.ts` | CRUD + génération + override + fetch |
| `components/AllocationsManager.tsx` | Client — liste + CRUD dans les Réglages |
| `components/AllocationModal.tsx` | Client — formulaire (sections + projets en picker) |
| `app/parametres/allocation/page.tsx` | Server Component — page Réglages |

### Fichiers modifiés (4)

| Fichier | Modification | Blast radius |
|---------|-------------|--------------|
| `lib/types.ts` | +`IncomeAllocation`, `MonthlyAllocation` | Faible |
| `lib/actions/expenses.ts` | +`getMonthlyExpenseActualsBySection(month)` | Faible |
| `app/revenus/page.tsx` | +fetch `getMonthlyAllocations` + `getMonthlyExpenseActualsBySection` | Faible |
| `components/RevenusTrackingClient.tsx` | +tabs (Revenus / Allocation) + onglet allocation | Moyen |
| `components/ParametresClient.tsx` | +lien `/parametres/allocation` | Faible |

> **Note :** `app/page.tsx`, `AccueilClient.tsx`, `TabTableauDeBord.tsx` — **inchangés**. Dashboard non touché.

**Blast radius : FAIBLE — aucun fichier supprimé, aucune requête existante modifiée, dashboard préservé.**

---

## Scope Boundaries

### IN scope
- ✅ Montants fixes uniquement
- ✅ Type Charges (lien section) + Type Épargne (lien projet PLANNED) + Type Libre
- ✅ Allocations temporaires avec `end_month`
- ✅ Auto-skip génération si projet épargne atteint
- ✅ Génération automatique mensuelle idempotente
- ✅ Override montant pour un mois spécifique (sur `/revenus` tab Allocation)
- ✅ Tab Allocation sur `/revenus` : alloué + dépensé (si section) + progression (si projet)
- ✅ Disponible attendu et disponible actuel
- ✅ Warning surallocation et sous-allocation
- ✅ CRUD + réordonnement (↑/↓) dans les Réglages

### OUT scope (explicitement exclu)
- ❌ **Carte allocation sur le dashboard** — trop détaillé pour le dashboard
- ❌ **Allocations en %** — montants fixes suffisent
- ❌ **Création automatique de savings_contribution** — intention uniquement (v2 possible)
- ❌ **Report de solde (carry-over)** — hors scope
- ❌ **Notifications "enveloppe épuisée"** — feature future
- ❌ **Allocations par-revenu** (Salaire vs Freelance séparés) — v2

---

## Implementation Plan

### Phase 1 — Base de données + Server Actions

**Fichiers :** `scripts/migrate-allocations.mjs`, `lib/types.ts`, `lib/actions/allocations.ts`, `lib/actions/expenses.ts`

**Étapes :**
1. Créer `scripts/migrate-allocations.mjs` avec les 2 CREATE TABLE
2. Exécuter : `node scripts/migrate-allocations.mjs`
3. `lib/types.ts` → ajouter `IncomeAllocation`, `MonthlyAllocation`
4. `lib/actions/allocations.ts` → implémenter :
   - `getAllocations(): Promise<IncomeAllocation[]>`
   - `createAllocation(data): Promise<IncomeAllocation>`
   - `updateAllocation(id, data): Promise<void>`
   - `deleteAllocation(id): Promise<void>` (soft delete via `is_active = false`)
   - `reorderAllocations(orderedIds: string[]): Promise<void>`
   - `generateMonthlyAllocations(month): Promise<void>` (idempotent + skip logic)
   - `getMonthlyAllocations(month): Promise<MonthlyAllocationWithTemplate[]>` (JOIN income_allocations + sections + projects)
   - `updateMonthlyAllocation(id, amount, notes?): Promise<void>`
5. `lib/actions/expenses.ts` → ajouter :
   - `getMonthlyExpenseActualsBySection(month): Promise<{section_id: string; total: number}[]>`
   - `SELECT section_id, SUM(amount) FROM monthly_expenses WHERE month=$month AND status='PAID' GROUP BY section_id`

**Logique `generateMonthlyAllocations(month)` :**
```typescript
for each active allocation (is_active = true):
  // Skip si allocation temporaire expirée
  if (end_month && month > end_month) continue
  // Skip si projet d'épargne déjà atteint
  if (project_id) {
    const project = await getProject(project_id)
    if (project.target_amount && project.saved_amount >= project.target_amount) continue
  }
  // Insert idempotent
  INSERT INTO monthly_allocations (user_id, allocation_id, month, allocated_amount)
  VALUES ($userId, $id, $month, $amount)
  ON CONFLICT (allocation_id, month) DO NOTHING
```

**Checkpoint :** `npm run build` → 0 erreur TypeScript

---

### Phase 2 — UI Réglages `/parametres/allocation`

**Fichiers :** `app/parametres/allocation/page.tsx`, `components/AllocationModal.tsx`, `components/AllocationsManager.tsx`, `components/ParametresClient.tsx`

**`app/parametres/allocation/page.tsx`** (Server Component) :
```typescript
const [allocations, sections, projects, incomeSummary] = await Promise.all([
  getAllocations(),
  getSections(),
  getPlannedExpenses(),         // picker "lier à un projet"
  getMonthlyIncomeSummary(currentMonth()),  // pour afficher le disponible
])
return <AllocationsManager {...} />
```

**`components/AllocationModal.tsx`** (Client) :
- Champ "Label" (texte libre)
- Champ "Montant mensuel ($)"
- Sélecteur de type (3 options visuelles) :
  - 📦 **Charges** → picker de sections existantes
  - 💰 **Épargne** → picker de projets (Voyage Japon, MacBook, Épargne libre…)
  - 🔖 **Autre** → sans lien
- Champ "Date de fin" (optionnel, YYYY-MM) — visible si Type = Autre ou si projet sans `target_date`
  - Si projet avec `target_date` : "Date de fin calculée auto selon l'objectif du projet"
- Sélecteur de couleur (8 couleurs hex prédéfinies)
- Compteur live en bas : "Total alloué : 4 000 $ | Revenu : 5 000 $ | Disponible : 1 000 $" (orange si < 0)

**`components/AllocationsManager.tsx`** (Client) :
- Hero card :
  - Revenu mensuel attendu | Total alloué | Disponible (vert/orange)
  - Badge ⚠ "Surallocation de X$" si disponible < 0
- Liste triée par `position` :
  - Couleur | Label | Montant | Badge section/projet
  - Si projet lié : progression (2 400 $/8 000 $) ou "✓ Objectif atteint"
  - Si temporaire : "Jusqu'à [end_month]"
  - Actions : ↑ ↓ | ✏️ | 🗑️
- Bouton "+ Ajouter une enveloppe"

**`components/ParametresClient.tsx`** :
- Ajouter entrée "Allocation du revenu" dans la liste de navigation des Réglages

**Checkpoint :**
- `/parametres/allocation` accessible
- CRUD complet (créer, modifier, supprimer, réordonner)
- `npm run build` → 0 erreur

---

### Phase 3 — Tab "Allocation" sur `/revenus`

**Fichiers :** `app/revenus/page.tsx`, `components/RevenusTrackingClient.tsx`

**`app/revenus/page.tsx`** — ajouter dans le fetch :
```typescript
await generateMonthlyAllocations(month)   // après generateMonthlyIncomes

const [monthlyIncomes, incomeSummary, allIncomes, monthlyAllocations, sectionActuals, sections, projects] =
  await Promise.all([
    getMonthlyIncomes(month),
    getMonthlyIncomeSummary(month),
    getIncomes(),
    getMonthlyAllocations(month),              // ← nouveau
    getMonthlyExpenseActualsBySection(month),   // ← nouveau
    getSections(),                             // ← nouveau (pour les labels section)
    getPlannedExpenses(),                      // ← nouveau (pour la progression projets)
  ])
```

**`components/RevenusTrackingClient.tsx`** — ajouter structure tabs :
```
Tab strip : [Revenus] [Allocation]

Tab "Revenus" = contenu actuel (inchangé)
Tab "Allocation" = nouveau
```

**Tab "Allocation" :**
- **Hero card** :
  - Revenu attendu X$ | Alloué Y$ | Disponible attendu Z$
  - Si mois courant : Revenu reçu X'$ | Disponible actuel Z'$
  - Badge ⚠ "Surallocation de X$" si total alloué > revenu attendu
- **Liste des enveloppes** (depuis `monthlyAllocations`) :
  - Si Type Charges : label + montant alloué + montant dépensé réel (depuis `sectionActuals`) + barre de progression + badge ⚠ si sous-alloué
  - Si Type Épargne : label + montant/mois + progression projet (saved/target + %) + "✓ Objectif atteint" si complet
  - Si Type Libre : label + montant + "(sans suivi)"
  - **Bouton "Modifier"** sur chaque enveloppe — visible uniquement si `isCurrentMonth`
    - → Sheet bottom : nouveau montant + note optionnelle → `updateMonthlyAllocation(id, amount, note)`
- **Si aucune allocation configurée** :
  - Message "Aucune allocation configurée" + lien "→ Configurer dans les Réglages"

**Checkpoint :**
- Tab switch Revenus ↔ Allocation fonctionne
- Tab Allocation : enveloppes visibles avec les bons types
- Enveloppe Charges : dépensé réel vs alloué visible
- Enveloppe Épargne : progression projet visible
- Override : modifier montant → template Réglages inchangé, mois courant mis à jour
- Mois passé : boutons "Modifier" absents (lecture seule)
- `npm run build` → 0 erreur

---

## Rollback Strategy

| Phase | Rollback | Impact |
|-------|---------|--------|
| Migration | `DROP TABLE monthly_allocations; DROP TABLE income_allocations;` | Zéro impact données existantes |
| Phase 2 | Supprimer 3 fichiers + retirer lien ParametresClient | App fonctionnelle |
| Phase 3 | Reverter `app/revenus/page.tsx` + `RevenusTrackingClient.tsx` | App fonctionnelle, onglet disparu |

---

## Success Criteria complets

### Phase 1
- [ ] Migration OK (`income_allocations` + `monthly_allocations` créées)
- [ ] `generateMonthlyAllocations` : skip si `month > end_month` ou si projet atteint
- [ ] `getMonthlyExpenseActualsBySection` retourne les bons totaux (PAID seulement)
- [ ] `npm run build` → 0 erreur

### Phase 2
- [ ] `/parametres/allocation` accessible
- [ ] Créer allocation Charges + section → badge section visible
- [ ] Créer allocation Épargne + projet → progression (saved/target) visible
- [ ] Créer allocation temporaire → date de fin visible
- [ ] Disponible = revenu − alloué calculé correctement
- [ ] Warning surallocation si disponible < 0
- [ ] Réordonner via ↑/↓ fonctionnel
- [ ] `npm run build` → 0 erreur

### Phase 3
- [ ] `/revenus` affiche 2 tabs (Revenus + Allocation)
- [ ] Tab Allocation : enveloppes du mois visibles
- [ ] Enveloppe Charges : dépensé réel vs alloué
- [ ] Enveloppe Épargne : barre de progression projet
- [ ] Warning surallocation si total alloué > revenu
- [ ] Override mensuel fonctionne (mois courant uniquement) sans toucher au template
- [ ] Mois passés : lecture seule (pas de bouton Modifier)
- [ ] Si aucune allocation : message + lien vers Réglages
- [ ] `npm run build` → 0 erreur
- [ ] Zéro régression sur `/`, `/depenses`, `/parametres`

---

## Maquettes conceptuelles

### `/parametres/allocation`
```
┌──────────────────────────────────────────────────────┐
│  Revenu mensuel    Total alloué    Disponible          │
│    5 000 $           4 000 $        1 000 $ ✅         │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│ ● Maison         2 000 $/mois   🏠 Maison     ↑↓ ✏️🗑 │
│ ● Transport        500 $/mois   🚗 Transport   ↑↓ ✏️🗑 │
│ ● Voyage Japon     500 $/mois   2 400/8 000$   ↑↓ ✏️🗑 │
│                                 30% · ~11 mois         │
│ ● MacBook Pro      300 $/mois   1 200/3 500$   ↑↓ ✏️🗑 │
│ ● Épargne libre    500 $/mois   💰 Épargne lib  ↑↓ ✏️🗑│
│ ● Loisirs          200 $/mois   (sans suivi)   ↑↓ ✏️🗑 │
│                                                        │
│                       [+ Ajouter une enveloppe]        │
└──────────────────────────────────────────────────────┘
```

### `/revenus` — Tab "Allocation"
```
[Revenus]  [Allocation]
              ↑ actif

┌──────────────────────────────────────────────────────┐
│  Revenu attendu  5 000 $  │  Alloué  4 000 $          │
│  Revenu reçu     4 200 $  │  Disponible actuel  200 $  │
│                              Disponible attendu 1 000 $│
└──────────────────────────────────────────────────────┘

● Maison        2 000 alloué  ████████████░░  1 840 dép ✅  [Modifier]
● Transport       500 alloué  ████████████░░    490 dép ✅  [Modifier]
● Voyage Japon  500/mois      ████░░░░░░░░  2 400/8 000$ 30%  [Modifier]
● MacBook Pro   300/mois      ████████░░░░  1 200/3 500$ 34%  [Modifier]
● Épargne libre 500/mois      ─────────────  (sans suivi)     [Modifier]
● Loisirs       200/mois      ─────────────  (sans suivi)     [Modifier]
```
*(Boutons "Modifier" visibles mois courant uniquement)*

### `AllocationModal` — Mode Épargne
```
┌──────────────────────────────────────────────────────┐
│  Nouvelle enveloppe                                    │
│                                                        │
│  Label :  [Voyage Japon         ]                      │
│  Montant : [500        ] $/mois                        │
│                                                        │
│  Type :  ○ Charges  ● Épargne  ○ Autre                 │
│                                                        │
│  Affecter à :                                          │
│  ● Voyage Japon 2027     2 400 / 8 000 $               │
│  ○ MacBook Pro M4        1 200 / 3 500 $               │
│  ○ Fonds d'urgence       6 500 / 10 000 $              │
│  ○ Épargne libre         5 000 $ cumulé                │
│                                                        │
│  Date de fin : calculée auto (mars 2027)               │
│  Couleur : ● ○ ○ ○ ○ ○ ○ ○                            │
│                                                        │
│  Total alloué 4 500$ | Revenu 5 000$ | Dispo 500$      │
│  [Ajouter l'enveloppe]                                 │
└──────────────────────────────────────────────────────┘
```

---

## Récapitulatif fichiers

| Fichier | Action | Phase |
|---------|--------|-------|
| `scripts/migrate-allocations.mjs` | **Créer** | 1 |
| `lib/types.ts` | Modifier (+2 types) | 1 |
| `lib/actions/allocations.ts` | **Créer** | 1 |
| `lib/actions/expenses.ts` | Modifier (+1 fn) | 1 |
| `app/parametres/allocation/page.tsx` | **Créer** | 2 |
| `components/AllocationModal.tsx` | **Créer** | 2 |
| `components/AllocationsManager.tsx` | **Créer** | 2 |
| `components/ParametresClient.tsx` | Modifier (+lien) | 2 |
| `app/revenus/page.tsx` | Modifier (+fetch) | 3 |
| `components/RevenusTrackingClient.tsx` | Modifier (+tabs + onglet Allocation) | 3 |

**Total : 5 fichiers créés, 5 fichiers modifiés. 0 supprimé. Dashboard inchangé.**
