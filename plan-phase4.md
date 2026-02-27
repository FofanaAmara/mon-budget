# Plan Phase 4 — Vision Cash Flow
**Projet** : Mon Budget PWA
**Méthode** : Gap Analysis Framework
**Date** : 2026-02-27
**Basé sur** : prd-budget-tracker-4.md (v1.3)

---

## Executive Summary

Phase 4 transforme l'app d'un tracker de dépenses en une **vue cash flow complète**. Le modèle `Income` actuel ne supporte que des revenus fixes normalisés. Phase 4 ajoute les revenus variables multi-sources, le suivi mensuel des entrées (attendu vs reçu), une vue Cash Flow unifiée (ENTRÉES - SORTIES = SOLDE), et un accès rapide aux dépenses adhoc.

---

## Current State (après Phases 1–3)

### Base de données
| Table | État |
|---|---|
| `incomes` | `id, name, amount, frequency(MONTHLY\|BIWEEKLY\|YEARLY), is_active, created_at, updated_at` |
| `monthly_incomes` | **N'existe pas** |
| `sections` | 6 sections (pas de "Épargne & Investissements") |

### Types TypeScript
```typescript
export type IncomeFrequency = 'MONTHLY' | 'BIWEEKLY' | 'YEARLY'; // manque VARIABLE
export type Income = { id, name, amount, frequency, is_active, ... }; // manque source, estimated_amount
// MonthlyIncome → n'existe pas
```

### UI / Pages
| Composant | État |
|---|---|
| `RevenusClient.tsx` | CRUD simple : nom + montant + fréquence |
| `IncomeModal.tsx` | 3 champs seulement |
| `MonMoisClient.tsx` | Uniquement SORTIES (dépenses), pas d'ENTRÉES, pas de SOLDE |
| `/cash-flow` | **N'existe pas** |
| Dépense adhoc rapide | **N'existe pas** (possible via /depenses mais pas rapide) |

### Server Actions
| Action | État |
|---|---|
| `getIncomes()` | Retourne tous les revenus actifs |
| `getMonthlyIncomeTotal()` | Total normalisé mensuel |
| `createIncome / updateIncome / deleteIncome` | CRUD basique sans source ni estimated_amount |
| `generateMonthlyIncomes()` | **N'existe pas** |
| `getMonthlyIncomeSummary()` | **N'existe pas** |
| `markIncomeReceived()` | **N'existe pas** |

---

## Future State (Phase 4 complète)

### A. Modèle Income enrichi
```typescript
export type IncomeSource = 'EMPLOYMENT' | 'BUSINESS' | 'INVESTMENT' | 'OTHER';
export type IncomeFrequency = 'MONTHLY' | 'BIWEEKLY' | 'YEARLY' | 'VARIABLE';

export type Income = {
  id: string;
  name: string;
  source: IncomeSource;
  amount: number | null;         // null si VARIABLE
  estimated_amount: number | null; // estimation pour les VARIABLE
  frequency: IncomeFrequency;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
};
```

### B. Nouvelle table monthly_incomes
```sql
CREATE TABLE monthly_incomes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  income_id UUID REFERENCES incomes(id) ON DELETE CASCADE,
  month VARCHAR(7) NOT NULL,             -- "2026-03"
  expected_amount DECIMAL(10,2),
  actual_amount DECIMAL(10,2),
  status VARCHAR(20) NOT NULL DEFAULT 'EXPECTED'
    CHECK (status IN ('EXPECTED', 'RECEIVED', 'PARTIAL', 'MISSED')),
  received_at DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(income_id, month)
);
```

### C. Vue "Mon mois" enrichie
- Bloc **ENTRÉES** : liste des revenus du mois avec badge EXPECTED/RECEIVED + bouton "Marquer reçu"
- Bloc **SORTIES** : existant (dépenses groupées par statut)
- **SOLDE** : entrées reçues - sorties payées, affiché en header
- Barre de progression double : revenus + dépenses

### D. Vue Cash Flow (`/cash-flow`)
```
ENTRÉES (7 000$)
├── 💼 Emploi      5 000$ [RECEIVED]
├── 🏢 Business    2 000$ [EXPECTED]

SORTIES (5 800$)
├── 🏠 Maison      2 500$
├── 👨‍👩‍👧‍👦 Famille     800$
├── 💰 Épargne    1 500$
└── ...

SOLDE : +1 200$
```

### E. Adhoc expense quick-add
- Bouton "+ Adhoc" dans `/mon-mois`
- Ouvre un bottom sheet simplifié : nom + montant + section
- Crée un `ONE_TIME` expense ET son `monthly_expense` instantanément pour le mois courant

### F. Section "Épargne & Investissements"
- Ajout via migration seed si non présente

---

## Gap Analysis

| Gap | État actuel | État cible | Comment combler |
|---|---|---|---|
| Champ `source` sur incomes | Absent | `EMPLOYMENT\|BUSINESS\|INVESTMENT\|OTHER` | `ALTER TABLE incomes ADD COLUMN source VARCHAR(30) DEFAULT 'EMPLOYMENT'` |
| Champ `estimated_amount` | Absent | `DECIMAL(10,2) nullable` | `ALTER TABLE incomes ADD COLUMN estimated_amount DECIMAL(10,2)` |
| Fréquence `VARIABLE` | Absent | Enum étendu | Modifier la contrainte CHECK sur `frequency` |
| Table `monthly_incomes` | N'existe pas | Schéma complet | `CREATE TABLE monthly_incomes (...)` |
| Types TypeScript | Income simple | Income enrichi + MonthlyIncome | Mettre à jour `lib/types.ts` |
| `IncomeModal` | 3 champs | Source + Fixed/Variable + estimated | Refondre avec `frontend-design` skill |
| `generateMonthlyIncomes()` | Absent | Auto-génération analogie expenses→monthly | Créer dans `lib/actions/monthly-incomes.ts` |
| Vue Mon Mois — ENTRÉES | Absent | Bloc ENTRÉES + SOLDE | Enrichir `MonMoisClient.tsx` |
| Page Cash Flow | Absente | `/cash-flow` avec répartition | Créer `app/cash-flow/page.tsx` |
| Adhoc quick-add | Absent | FAB dans Mon Mois | Nouveau composant `AdhocModal` |
| Section Épargne | Absente des seeds | Seed par défaut | Migration SQL INSERT |

---

## Impact Analysis

### Fichiers modifiés
- `lib/types.ts` — ajout `IncomeSource`, `MonthlyIncome`, `MonthlyIncomeStatus`, mise à jour `Income`
- `lib/actions/incomes.ts` — mise à jour `createIncome`, `updateIncome` avec nouveaux champs
- `lib/utils.ts` — mise à jour `calcMonthlyIncome` pour gérer `VARIABLE`
- `components/IncomeModal.tsx` — refonte complète
- `components/RevenusClient.tsx` — affichage source badge, VARIABLE
- `components/MonMoisClient.tsx` — ajout bloc ENTRÉES + SOLDE

### Nouveaux fichiers
- `lib/actions/monthly-incomes.ts` — generateMonthlyIncomes, getMonthlyIncomeSummary, markIncomeReceived
- `app/cash-flow/page.tsx` — Server Component
- `components/CashFlowClient.tsx` — Client Component
- `components/AdhocModal.tsx` — quick-add adhoc expense
- `tests/phase4/` — 12 tests Playwright

### Blast radius
- **HAUT** : `lib/types.ts` → affecte tous les composants utilisant `Income`
- **MOYEN** : `lib/utils.ts` (calcMonthlyIncome) → affecte dashboard, ResteAVivreWidget
- **BAS** : `MonMoisClient.tsx` → ajout non-destructif

---

## Scope Boundaries

### IN scope (Phase 4)
- Migration DB incomes + création monthly_incomes
- CRUD revenus enrichi (source + fixed/variable)
- Génération automatique monthly_incomes (même pattern que monthly_expenses)
- "Marquer reçu" avec montant réel (VARIABLE surtout)
- Vue Mon Mois enrichie (ENTRÉES + SORTIES + SOLDE)
- Page /cash-flow (répartition visuelle)
- Adhoc quick-add dans /mon-mois
- Section "Épargne & Investissements" dans seeds

### OUT scope (Phase 4)
- Connexion bancaire / import automatique
- Graphiques de tendances revenus (déjà traité en Phase 3)
- Notifications sur revenus manqués (Phase 5 éventuelle)
- Mode sombre

---

## Assumptions

| Hypothèse | Risque si faux | Validation |
|---|---|---|
| La table `incomes` existe déjà en prod avec les colonnes Phase 2 | ALTER TABLE échoue si colonnes déjà présentes | `SELECT column_name FROM information_schema.columns WHERE table_name='incomes'` |
| `monthly_expenses` pattern peut être reproduit pour `monthly_incomes` | Architecture divergente | Vérifier `lib/actions/monthly-expenses.ts` |
| `calcMonthlyIncome(amount=null, 'VARIABLE')` doit retourner `estimated_amount` | Division par 0 ou NaN | Traiter null explicitement |
| Les revenus VARIABLE ne génèrent PAS d'instance monthly_income automatique | Génération superflue | Les VARIABLE = saisie manuelle uniquement, pas auto-générés |

---

## Pre-Mortem

| Scénario d'échec | Probabilité | Prévention |
|---|---|---|
| ALTER TABLE échoue (colonne déjà existante) | Moyenne | Utiliser `IF NOT EXISTS` ou vérifier avant |
| `calcMonthlyIncome` retourne NaN pour VARIABLE | Haute | Guard `if (frequency === 'VARIABLE') return estimated_amount ?? 0` |
| MonMoisClient trop complexe avec double bloc | Haute | Extraire `IncomesBlock` en composant séparé |
| Tests Phase 1/2/3 cassent après migration | Faible | La migration n'altère pas les tables existantes sauf `incomes` |
| Cash flow page blanche si monthly_incomes vide | Certaine | Prévoir empty state explicite |

---

## Rollback Strategy

| Phase | Rollback |
|---|---|
| DB migration | Les colonnes ajoutées sont NULLABLE → pas de breaking change |
| monthly_incomes | DROP TABLE IF EXISTS monthly_incomes (pas référencé ailleurs) |
| Types TypeScript | Git revert sur lib/types.ts |
| UI components | Git revert sur composants individuels |

---

## Implementation Plan (4 phases)

### Phase A — DB Migration + Types (~45min)

**Actions :**
1. Exécuter migration SQL :
   ```sql
   -- Enrichir incomes
   ALTER TABLE incomes ADD COLUMN IF NOT EXISTS source VARCHAR(30) DEFAULT 'EMPLOYMENT';
   ALTER TABLE incomes ADD COLUMN IF NOT EXISTS estimated_amount DECIMAL(10,2);
   ALTER TABLE incomes DROP CONSTRAINT IF EXISTS incomes_frequency_check;
   ALTER TABLE incomes ADD CONSTRAINT incomes_frequency_check
     CHECK (frequency IN ('MONTHLY', 'BIWEEKLY', 'YEARLY', 'VARIABLE'));
   ALTER TABLE incomes ADD COLUMN IF NOT EXISTS notes TEXT;

   -- Nouvelle table monthly_incomes
   CREATE TABLE IF NOT EXISTS monthly_incomes (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     income_id UUID REFERENCES incomes(id) ON DELETE CASCADE,
     month VARCHAR(7) NOT NULL,
     expected_amount DECIMAL(10,2),
     actual_amount DECIMAL(10,2),
     status VARCHAR(20) NOT NULL DEFAULT 'EXPECTED'
       CHECK (status IN ('EXPECTED', 'RECEIVED', 'PARTIAL', 'MISSED')),
     received_at DATE,
     notes TEXT,
     created_at TIMESTAMPTZ DEFAULT NOW(),
     UNIQUE(income_id, month)
   );

   -- Seed section Épargne & Investissements si absente
   INSERT INTO sections (name, icon, color, position)
   VALUES ('Épargne & Invest.', '💰', '#1A7F5A', 6)
   ON CONFLICT DO NOTHING;
   ```
2. Mettre à jour `lib/types.ts` : `IncomeSource`, `IncomeFrequency` (+ VARIABLE), `Income`, `MonthlyIncomeStatus`, `MonthlyIncome`
3. Mettre à jour `lib/utils.ts` : `calcMonthlyIncome` gère VARIABLE
4. `npm run build` → corriger toutes les erreurs TypeScript avant de continuer

**Success criteria :**
- `SELECT column_name FROM information_schema.columns WHERE table_name = 'incomes'` → inclut `source`, `estimated_amount`, `notes`
- `SELECT * FROM monthly_incomes LIMIT 1` → table accessible (même si vide)
- `npm run build` → exit 0

---

### Phase B — CRUD Revenus enrichi (~1h)

**Actions :**
1. Mettre à jour `lib/actions/incomes.ts` : `createIncome` et `updateIncome` avec nouveaux champs, `calcMonthlyIncome` pour VARIABLE utilise `estimated_amount`
2. Refondre `IncomeModal.tsx` avec `frontend-design` skill :
   - Source picker (4 options avec icône)
   - Toggle Fixe / Variable
   - Si Fixe : champ montant + fréquence
   - Si Variable : champ estimation mensuelle optionnelle + note
3. Mettre à jour `RevenusClient.tsx` : badge source coloré, affichage "Variable (~X$/mois)" pour VARIABLE
4. MCP Playwright : naviguer `/revenus`, snapshot, screenshot mobile 375px, 0 erreur console

**Success criteria :**
- Créer un revenu EMPLOYMENT MONTHLY 5000$ → visible dans la liste avec badge Emploi
- Créer un revenu BUSINESS VARIABLE estimated=2000$ → visible avec "Variable (~2 000$/mois)"
- `npm run build` → exit 0

---

### Phase C — MonthlyIncomes + Mon Mois enrichi (~1.5h)

**Actions :**
1. Créer `lib/actions/monthly-incomes.ts` :
   - `generateMonthlyIncomes(month)` : crée instances pour revenus FIXES uniquement (skip VARIABLE)
   - `getMonthlyIncomeSummary(month)` : retourne liste + totaux expected/actual
   - `markIncomeReceived(id, actualAmount, notes?)` : met à jour status=RECEIVED, actual_amount
   - `markVariableIncomeReceived(incomeId, month, actualAmount)` : crée l'instance ET la marque reçue
2. Appeler `generateMonthlyIncomes(month)` dans `app/page.tsx` (comme `generateMonthlyExpenses`)
3. Enrichir `MonMoisClient.tsx` :
   - Nouveau prop `monthlyIncomes: MonthlyIncome[]` + `incomeSummary`
   - Bloc ENTRÉES en haut : liste compacte revenus attendus + bouton "Marquer reçu"
   - SOLDE = actual_incomes_total - paid_expenses_total (affiché en header)
4. Mettre à jour `app/mon-mois/page.tsx` pour passer les nouvelles données
5. MCP Playwright : snapshot `/mon-mois`, vérifier bloc ENTRÉES présent, 0 erreur console

**Success criteria :**
- Après `generateMonthlyIncomes(month)` : `SELECT COUNT(*) FROM monthly_incomes WHERE month = '2026-02'` ≥ 1 (si revenus fixes existent)
- Cliquer "Marquer reçu" sur un revenu → status RECEIVED + montant actual visible
- SOLDE affiché dans header de Mon Mois

---

### Phase D — Cash Flow + Adhoc + Tests (~1.5h)

**Actions :**
1. Créer `app/cash-flow/page.tsx` (Server Component) + `CashFlowClient.tsx` avec `frontend-design` skill :
   - Section ENTRÉES : par source (Emploi / Business / Investissement / Autre) avec expected vs actual
   - Section SORTIES : par section budgétaire avec barres visuelles (existant)
   - SOLDE global en bas
2. Créer `components/AdhocModal.tsx` :
   - Champs : nom, montant, section
   - Action : crée expense ONE_TIME + insère dans monthly_expenses pour le mois courant
3. Ajouter bouton "+ Adhoc" dans `MonMoisClient.tsx` (FAB secondaire ou bouton header)
4. Ajouter lien `/cash-flow` dans le dashboard (card clickable) et dans la sidebar desktop
5. Écrire 12 tests Playwright dans `tests/phase4/` (voir section Tests)
6. `npm run build` + `npm run lint`
7. `git push origin main` → deploy Vercel → vérifier statut Ready

**Success criteria :**
- Page `/cash-flow` accessible HTTP 200, affiche ENTRÉES + SORTIES + SOLDE
- Adhoc : ajouter "Réparation plombier 350$" → apparaît dans Mon Mois du mois courant
- `npx playwright test tests/phase4/ --project=chromium` → 12/12 passed
- `npx playwright test --project=chromium` → 74/74 passed (62 existants + 12 nouveaux)

---

## Testing Strategy

### Tests Phase 4 (12 tests dans `tests/phase4/`)

| Fichier | Test |
|---|---|
| `test-incomes-migration.spec.ts` | Table incomes a colonnes source, estimated_amount |
| `test-monthly-incomes-table.spec.ts` | Table monthly_incomes accessible |
| `test-income-create-fixed.spec.ts` | POST créer revenu fixe EMPLOYMENT → 200 |
| `test-income-create-variable.spec.ts` | POST créer revenu VARIABLE → 200, amount=null |
| `test-generate-monthly-incomes.spec.ts` | generateMonthlyIncomes → COUNT > 0 pour revenus fixes |
| `test-mark-income-received.spec.ts` | markIncomeReceived → status=RECEIVED dans DB |
| `test-mon-mois-entrees.spec.ts` | Page /mon-mois affiche section "Entrées" |
| `test-mon-mois-solde.spec.ts` | SOLDE visible dans /mon-mois |
| `test-cash-flow-page.spec.ts` | Page /cash-flow accessible HTTP 200 |
| `test-cash-flow-sections.spec.ts` | /cash-flow affiche sections ENTRÉES + SORTIES |
| `test-adhoc-create.spec.ts` | Créer dépense adhoc → apparaît dans monthly_expenses mois courant |
| `test-revenus-ui.spec.ts` | Page /revenus affiche badge source + VARIABLE |

---

## Success Criteria Globaux

- [ ] `SELECT column_name FROM information_schema.columns WHERE table_name='incomes'` → inclut `source`, `estimated_amount`, `notes`
- [ ] `SELECT * FROM monthly_incomes LIMIT 1` → table accessible
- [ ] Income VARIABLE créable avec `estimated_amount` non null
- [ ] `generateMonthlyIncomes('2026-02')` → instances créées pour revenus MONTHLY/BIWEEKLY/YEARLY
- [ ] "Marquer reçu" → `actual_amount` enregistré, `status=RECEIVED`
- [ ] `/mon-mois` : bloc ENTRÉES visible + SOLDE calculé
- [ ] `/cash-flow` : accessible HTTP 200, ENTRÉES + SORTIES + SOLDE
- [ ] Adhoc : dépense ponctuelle créée ET dans monthly_expenses du mois
- [ ] `npx playwright test tests/phase4/ --project=chromium` → 12/12 passed
- [ ] `npx playwright test --project=chromium` → 74/74 passed
- [ ] `npm run build` → exit 0
- [ ] `npm run lint` → exit 0
- [ ] `vercel ls` → statut Ready
- [ ] Zéro erreur console browser en production
