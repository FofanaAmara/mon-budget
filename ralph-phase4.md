# MISSION: Build Mon Budget Phase 4 — Vision Cash Flow

Implémenter la Phase 4 complète du PRD v1.3 sur l'app Mon Budget déjà déployée : revenus enrichis multi-sources (fixe/variable), table `monthly_incomes`, vue "Mon Mois" avec bloc ENTRÉES + SOLDE, page `/cash-flow` (ENTRÉES - SORTIES = SOLDE), dépense adhoc rapide — le tout déployé sur Vercel, testé Playwright (74/74), zéro erreur TypeScript et console.

---

## REFERENCES (Read First)

1. **`plan-phase4.md`** — Plan détaillé Phase 4. LIRE EN ENTIER avant de commencer. Contient : Gap Analysis, Impact Analysis, Assumptions, Pre-Mortem, Rollback Strategy, Implementation Plan complet (phases A, B, C, D).
2. **`prd-budget-tracker-4.md`** — PRD complet v1.3, en particulier la section "Phase 4 Vision Cash Flow" pour les exigences fonctionnelles et le modèle de données enrichi.
3. **`.env.local`** — Credentials Neon PostgreSQL (`POSTGRES_URL`, `POSTGRES_URL_NON_POOLING`) et variables Vercel.
4. **`.vercel/`** — Projet Vercel déjà lié (`amara-fofanas-projects/mon-budget`).
5. **`lib/types.ts`** — Types actuels : `Income`, `IncomeFrequency` (sans VARIABLE), pas de `MonthlyIncome`.
6. **`lib/actions/incomes.ts`** — Actions CRUD revenus actuelles (sans `source` ni `estimated_amount`).
7. **`lib/actions/monthly-expenses.ts`** — Pattern de référence à reproduire pour `monthly-incomes.ts`.
8. **`tests/phase1/`**, **`tests/phase2/`**, **`tests/phase3/`**, **`tests/phase3-new/`** — Tests existants (~62 tests) à ne PAS casser.

**Précondition absolue** : Vérifier que les phases précédentes sont fonctionnelles avant de commencer :

```bash
npx playwright test --project=chromium --reporter=list
# Doit retourner ~62/62 passed (nombre exact selon l'état actuel du projet)
```

**Required Tools/Skills** :

- Utiliser le skill `frontend-design` pour TOUTES les nouvelles pages et composants UI (`app/cash-flow/page.tsx`, `components/CashFlowClient.tsx`, `components/AdhocModal.tsx`, refonte `components/IncomeModal.tsx`). Ne jamais écrire du JSX sans ce skill.
- Utiliser le **MCP Playwright** (`mcp__playwright__browser_navigate`, `mcp__playwright__browser_snapshot`, `mcp__playwright__browser_take_screenshot`, `mcp__playwright__browser_console_messages`) pour tester visuellement chaque interface **immédiatement après l'avoir buildée**, avant de passer à la suite.
- Utiliser `npx playwright` pour les tests E2E finaux.

---

## UI TESTING PROTOCOL (Obligatoire à chaque composant/page UI)

> **Règle** : Après chaque page ou composant UI construit avec `frontend-design`, IMMÉDIATEMENT tester dans le browser avec le MCP Playwright AVANT de passer à la suite.

**Protocole à suivre après chaque UI buildée** :

```
1. npm run dev (si pas déjà lancé en arrière-plan)
2. mcp__playwright__browser_navigate → http://localhost:3000/[page]
3. mcp__playwright__browser_snapshot → vérifier l'arbre d'accessibilité (structure présente)
4. mcp__playwright__browser_take_screenshot → vérifier le rendu visuel
5. mcp__playwright__browser_resize → width: 375, height: 812 → retester en vue mobile
6. mcp__playwright__browser_console_messages level: "error" → vérifier zéro erreur console
7. Si problème détecté → corriger AVANT de passer à la page suivante
```

**Ce qu'on vérifie à chaque test visuel** :
- La page se charge sans erreur (pas de page blanche, pas de 500)
- Les éléments attendus sont présents (titres, badges, boutons, formulaires)
- Le rendu mobile 375px est correct (pas de débordement horizontal)
- Zéro message d'erreur rouge dans la console browser

---

## PHASES (Incremental Goals)

### Phase A : DB Migration + Types TypeScript (~45min)

**Objective** : La table `incomes` est enrichie (source, estimated_amount, notes, VARIABLE), la table `monthly_incomes` existe, les types TypeScript sont à jour, `npm run build` passe sans erreur.

**Actions** :

- Exécuter la migration SQL via un script Node ou directement via l'endpoint `/api/db-migrate` (à créer temporairement) :
  ```sql
  -- Enrichir incomes
  ALTER TABLE incomes ADD COLUMN IF NOT EXISTS source VARCHAR(30) DEFAULT 'EMPLOYMENT';
  ALTER TABLE incomes ADD COLUMN IF NOT EXISTS estimated_amount DECIMAL(10,2);
  ALTER TABLE incomes ADD COLUMN IF NOT EXISTS notes TEXT;
  ALTER TABLE incomes DROP CONSTRAINT IF EXISTS incomes_frequency_check;
  ALTER TABLE incomes ADD CONSTRAINT incomes_frequency_check
    CHECK (frequency IN ('MONTHLY', 'BIWEEKLY', 'YEARLY', 'VARIABLE'));

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
  **Script Node recommandé** :
  ```bash
  node -e "
  const { neon } = require('@neondatabase/serverless');
  require('dotenv').config({ path: '.env.local' });
  const sql = neon(process.env.POSTGRES_URL_NON_POOLING);
  sql\`ALTER TABLE incomes ADD COLUMN IF NOT EXISTS source VARCHAR(30) DEFAULT 'EMPLOYMENT'\`
    .then(() => sql\`ALTER TABLE incomes ADD COLUMN IF NOT EXISTS estimated_amount DECIMAL(10,2)\`)
    .then(() => sql\`ALTER TABLE incomes ADD COLUMN IF NOT EXISTS notes TEXT\`)
    .then(() => sql\`ALTER TABLE incomes DROP CONSTRAINT IF EXISTS incomes_frequency_check\`)
    .then(() => sql\`ALTER TABLE incomes ADD CONSTRAINT incomes_frequency_check CHECK (frequency IN ('MONTHLY', 'BIWEEKLY', 'YEARLY', 'VARIABLE'))\`)
    .then(() => sql\`CREATE TABLE IF NOT EXISTS monthly_incomes (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), income_id UUID REFERENCES incomes(id) ON DELETE CASCADE, month VARCHAR(7) NOT NULL, expected_amount DECIMAL(10,2), actual_amount DECIMAL(10,2), status VARCHAR(20) NOT NULL DEFAULT 'EXPECTED' CHECK (status IN ('EXPECTED', 'RECEIVED', 'PARTIAL', 'MISSED')), received_at DATE, notes TEXT, created_at TIMESTAMPTZ DEFAULT NOW(), UNIQUE(income_id, month))\`)
    .then(() => sql\`INSERT INTO sections (name, icon, color, position) VALUES ('Épargne & Invest.', '💰', '#1A7F5A', 6) ON CONFLICT DO NOTHING\`)
    .then(() => console.log('✅ Migration OK'))
    .catch(e => { console.error('❌ Migration error:', e.message); process.exit(1); });
  "
  ```

- Mettre à jour `lib/types.ts` :
  ```typescript
  export type IncomeSource = 'EMPLOYMENT' | 'BUSINESS' | 'INVESTMENT' | 'OTHER';
  export type IncomeFrequency = 'MONTHLY' | 'BIWEEKLY' | 'YEARLY' | 'VARIABLE';

  export type Income = {
    id: string;
    name: string;
    source: IncomeSource;
    amount: number | null;           // null si VARIABLE
    estimated_amount: number | null; // estimation mensuelle pour VARIABLE
    frequency: IncomeFrequency;
    is_active: boolean;
    notes: string | null;
    created_at: string;
    updated_at: string;
  };

  export type MonthlyIncomeStatus = 'EXPECTED' | 'RECEIVED' | 'PARTIAL' | 'MISSED';

  export type MonthlyIncome = {
    id: string;
    income_id: string;
    month: string;                   // "YYYY-MM"
    expected_amount: number | null;
    actual_amount: number | null;
    status: MonthlyIncomeStatus;
    received_at: string | null;
    notes: string | null;
    created_at: string;
    // Joins
    income_name?: string;
    income_source?: IncomeSource;
  };
  ```

- Mettre à jour `lib/utils.ts` — `calcMonthlyIncome` pour gérer VARIABLE :
  ```typescript
  export function calcMonthlyIncome(
    amount: number | null,
    frequency: IncomeFrequency,
    estimated_amount?: number | null
  ): number {
    if (frequency === 'VARIABLE') return estimated_amount ?? 0;
    if (amount === null) return 0;
    if (frequency === 'MONTHLY') return amount;
    if (frequency === 'BIWEEKLY') return (amount * 26) / 12;
    if (frequency === 'YEARLY') return amount / 12;
    return 0;
  }
  ```
  ⚠️ Corriger tous les call sites de `calcMonthlyIncome` dans le codebase qui ne passent que 2 arguments.

- `npm run build` → corriger **toutes** les erreurs TypeScript avant de continuer.
- Vérification DB :
  ```bash
  node -e "
  const { neon } = require('@neondatabase/serverless');
  require('dotenv').config({ path: '.env.local' });
  const sql = neon(process.env.POSTGRES_URL_NON_POOLING);
  Promise.all([
    sql\`SELECT column_name FROM information_schema.columns WHERE table_name = 'incomes' AND column_name IN ('source', 'estimated_amount', 'notes')\`,
    sql\`SELECT COUNT(*) as count FROM monthly_incomes LIMIT 1\`
  ]).then(([cols, mi]) => {
    console.log('Colonnes incomes:', cols.map(c => c.column_name));
    console.log('Table monthly_incomes accessible:', mi[0].count !== undefined ? '✅' : '❌');
  }).catch(console.error);
  "
  ```
- `git add -A && git commit -m "feat: phase4 db migration monthly_incomes + types Income enriched" && git push origin main`

**Success Criteria** :

- [ ] `SELECT column_name FROM information_schema.columns WHERE table_name='incomes'` → inclut `source`, `estimated_amount`, `notes`
- [ ] `ALTER TABLE incomes ADD CONSTRAINT incomes_frequency_check CHECK (...)` contient `'VARIABLE'`
- [ ] `SELECT * FROM monthly_incomes LIMIT 1` → requête réussit (table accessible, peut être vide)
- [ ] `lib/types.ts` : `IncomeSource` et `MonthlyIncome` exportés
- [ ] `lib/utils.ts` : `calcMonthlyIncome('VARIABLE', null, 2000)` retourne `2000`
- [ ] `npm run build` → exit code 0

---

### Phase B : CRUD Revenus enrichi (~1h)

**Objective** : Créer et modifier des revenus avec `source` (EMPLOYMENT/BUSINESS/INVESTMENT/OTHER), toggle Fixe/Variable, `estimated_amount` pour les VARIABLE. UI refaite avec `frontend-design`, affichage badge source.

**Actions** :

- Mettre à jour `lib/actions/incomes.ts` — ajouter `source`, `estimated_amount`, `notes` aux actions `createIncome` et `updateIncome` :
  ```typescript
  'use server'

  import { revalidatePath } from 'next/cache';
  import { sql } from '@/lib/db';
  import type { IncomeSource, IncomeFrequency } from '@/lib/types';

  export async function createIncome(data: {
    name: string;
    source: IncomeSource;
    amount: number | null;
    estimated_amount: number | null;
    frequency: IncomeFrequency;
    notes?: string | null;
  }) {
    await sql`
      INSERT INTO incomes (name, source, amount, estimated_amount, frequency, notes, is_active)
      VALUES (${data.name}, ${data.source}, ${data.amount}, ${data.estimated_amount},
              ${data.frequency}, ${data.notes ?? null}, true)
    `;
    revalidatePath('/revenus');
    revalidatePath('/');
    revalidatePath('/mon-mois');
  }

  export async function updateIncome(id: string, data: {
    name: string;
    source: IncomeSource;
    amount: number | null;
    estimated_amount: number | null;
    frequency: IncomeFrequency;
    notes?: string | null;
  }) {
    await sql`
      UPDATE incomes
      SET name = ${data.name}, source = ${data.source}, amount = ${data.amount},
          estimated_amount = ${data.estimated_amount}, frequency = ${data.frequency},
          notes = ${data.notes ?? null}, updated_at = NOW()
      WHERE id = ${id}
    `;
    revalidatePath('/revenus');
    revalidatePath('/');
    revalidatePath('/mon-mois');
  }
  ```

- Refondre `components/IncomeModal.tsx` avec `frontend-design` skill :
  - **Source picker** : 4 boutons sélectionnables avec icône + label (💼 Emploi, 🏢 Business, 📈 Investissement, 🔧 Autre)
  - **Toggle Fixe / Variable** : radio ou toggle visuellement distinct
  - Si **Fixe** : champ montant (required) + sélecteur fréquence (MONTHLY/BIWEEKLY/YEARLY)
  - Si **Variable** : champ "Estimation mensuelle" (optional, hint: "Utilisé pour le calcul du reste à vivre") + note
  - Champ notes (textarea, optionnel)
  - → **MCP Playwright** : naviguer `/revenus`, ouvrir le modal, snapshot, screenshot mobile 375px, 0 erreur console

- Mettre à jour `components/RevenusClient.tsx` :
  - Badge source coloré : Emploi (bleu), Business (violet), Investissement (vert), Autre (gris)
  - Pour les revenus VARIABLE : afficher "Variable (~2 000$/mois)" au lieu du montant fixe
  - Utiliser `calcMonthlyIncome(inc.amount, inc.frequency, inc.estimated_amount)` (3 paramètres)
  - → **MCP Playwright** : screenshot, vérifier badge + VARIABLE visible

- `npm run build` + `npm run lint`
- `git add -A && git commit -m "feat: phase4 income crud enriched source fixed/variable + IncomeModal redesign" && git push origin main`
- Vérifier deploy Vercel : `vercel ls --scope amara-fofanas-projects` → "Ready"

**Success Criteria** :

- [ ] Créer un revenu EMPLOYMENT MONTHLY 5000$ → visible dans la liste avec badge "Emploi" (bleu)
- [ ] Créer un revenu BUSINESS VARIABLE estimated_amount=2000$ → visible avec "Variable (~2 000$/mois)", `amount=null` en DB
- [ ] `SELECT source, estimated_amount FROM incomes WHERE frequency = 'VARIABLE' LIMIT 1` → `source` non null, `estimated_amount` non null
- [ ] `npm run build` → exit code 0
- [ ] `npm run lint` → exit code 0
- [ ] Zéro erreur console browser sur `/revenus`

---

### Phase C : Monthly Incomes + Mon Mois enrichi (~1.5h)

**Objective** : Actions `generateMonthlyIncomes`, `getMonthlyIncomeSummary`, `markIncomeReceived` créées ; page Mon Mois affiche bloc ENTRÉES + SOLDE en header ; "Marquer reçu" fonctionnel.

**Actions** :

- Créer `lib/actions/monthly-incomes.ts` (en suivant le pattern de `lib/actions/monthly-expenses.ts`) :
  ```typescript
  'use server'

  import { revalidatePath } from 'next/cache';
  import { sql } from '@/lib/db';
  import type { MonthlyIncome } from '@/lib/types';

  // Génère les instances monthly_incomes pour les revenus FIXES du mois donné
  // Les revenus VARIABLE ne sont PAS auto-générés (saisie manuelle uniquement)
  export async function generateMonthlyIncomes(month: string): Promise<void> {
    const incomes = await sql`
      SELECT id, name, source, amount, frequency
      FROM incomes
      WHERE is_active = true AND frequency != 'VARIABLE'
    `;
    for (const inc of incomes) {
      const expectedAmount = inc.frequency === 'MONTHLY' ? inc.amount
        : inc.frequency === 'BIWEEKLY' ? (inc.amount * 26 / 12)
        : inc.amount / 12; // YEARLY
      await sql`
        INSERT INTO monthly_incomes (income_id, month, expected_amount, status)
        VALUES (${inc.id}, ${month}, ${expectedAmount}, 'EXPECTED')
        ON CONFLICT (income_id, month) DO NOTHING
      `;
    }
    revalidatePath('/mon-mois');
  }

  // Retourne le résumé des revenus pour un mois donné (expected + actual totals)
  export async function getMonthlyIncomeSummary(month: string): Promise<{
    items: MonthlyIncome[];
    expectedTotal: number;
    actualTotal: number;
  }> {
    const items = await sql`
      SELECT mi.*, i.name as income_name, i.source as income_source
      FROM monthly_incomes mi
      JOIN incomes i ON mi.income_id = i.id
      WHERE mi.month = ${month}
      ORDER BY i.source ASC, i.name ASC
    `;
    const expectedTotal = items.reduce((s: number, i: MonthlyIncome) => s + Number(i.expected_amount ?? 0), 0);
    const actualTotal = items.reduce((s: number, i: MonthlyIncome) => s + Number(i.actual_amount ?? 0), 0);
    return { items, expectedTotal, actualTotal };
  }

  // Marquer un revenu fixe comme reçu (met à jour l'instance existante)
  export async function markIncomeReceived(
    monthlyIncomeId: string,
    actualAmount: number,
    notes?: string
  ): Promise<void> {
    await sql`
      UPDATE monthly_incomes
      SET status = 'RECEIVED', actual_amount = ${actualAmount},
          received_at = CURRENT_DATE, notes = ${notes ?? null}
      WHERE id = ${monthlyIncomeId}
    `;
    revalidatePath('/mon-mois');
  }

  // Créer ET marquer reçu un revenu VARIABLE pour le mois courant (saisie manuelle)
  export async function markVariableIncomeReceived(
    incomeId: string,
    month: string,
    actualAmount: number,
    notes?: string
  ): Promise<void> {
    await sql`
      INSERT INTO monthly_incomes (income_id, month, expected_amount, actual_amount, status, received_at, notes)
      VALUES (${incomeId}, ${month}, ${actualAmount}, ${actualAmount}, 'RECEIVED', CURRENT_DATE, ${notes ?? null})
      ON CONFLICT (income_id, month) DO UPDATE
        SET actual_amount = ${actualAmount}, status = 'RECEIVED', received_at = CURRENT_DATE, notes = ${notes ?? null}
    `;
    revalidatePath('/mon-mois');
  }
  ```

- Mettre à jour `app/page.tsx` (dashboard) : appeler `generateMonthlyIncomes(month)` au chargement (comme `generateMonthlyExpenses`) :
  ```typescript
  // Dans app/page.tsx, après avoir obtenu `month`
  await generateMonthlyIncomes(month);
  ```

- Mettre à jour `app/mon-mois/page.tsx` :
  - Importer `getMonthlyIncomeSummary` et `generateMonthlyIncomes`
  - Appeler les deux et passer les données à `MonMoisClient`
  - Calculer `solde = incomeSummary.actualTotal - paidExpensesTotal`

- Enrichir `components/MonMoisClient.tsx` avec `frontend-design` skill :
  - **Nouveau prop** : `monthlyIncomes: MonthlyIncome[]` + `incomeSummary: { expectedTotal: number; actualTotal: number }`
  - **Header enrichi** : afficher le SOLDE = `actualTotal - paidExpenses` (positif = vert, négatif = rouge)
  - **Nouveau bloc ENTRÉES** (en haut, avant SORTIES) :
    - Liste compacte des `monthlyIncomes` (max 3 + "Voir tout" modal)
    - Chaque ligne : badge status (EXPECTED = gris, RECEIVED = vert, PARTIAL = orange, MISSED = rouge) + nom du revenu + montant attendu + bouton "Marquer reçu" (si EXPECTED ou PARTIAL)
    - Pour les revenus VARIABLE : bouton "Saisir montant reçu" → ouvre un mini-modal avec champ montant
  - Extraire `IncomesBlock` en composant séparé pour éviter la surcharge de `MonMoisClient`
  - → **MCP Playwright** : naviguer `/mon-mois`, snapshot, screenshot, vérifier bloc ENTRÉES présent + SOLDE visible

- `npm run build` + `npm run lint`
- Vérification DB :
  ```bash
  node -e "
  const { neon } = require('@neondatabase/serverless');
  require('dotenv').config({ path: '.env.local' });
  const sql = neon(process.env.POSTGRES_URL_NON_POOLING);
  const month = new Date().toISOString().slice(0,7);
  sql\`SELECT COUNT(*) as count FROM monthly_incomes WHERE month = \${month}\`
    .then(r => console.log('monthly_incomes ce mois:', r[0].count))
    .catch(console.error);
  "
  ```
- `git add -A && git commit -m "feat: phase4 monthly-incomes actions + mon-mois block entrées + solde" && git push origin main`
- Vérifier deploy Vercel → "Ready"

**Success Criteria** :

- [ ] `generateMonthlyIncomes('2026-02')` → `SELECT COUNT(*) FROM monthly_incomes WHERE month = '2026-02'` ≥ 1 (si revenus fixes existent)
- [ ] `markIncomeReceived(id, 5000)` → `SELECT status, actual_amount FROM monthly_incomes WHERE id = 'id'` retourne `{status: 'RECEIVED', actual_amount: 5000}`
- [ ] Page `/mon-mois` affiche un bloc "Entrées" avec les revenus attendus
- [ ] SOLDE visible dans le header de Mon Mois
- [ ] `npm run build` → exit code 0
- [ ] Zéro erreur console browser sur `/mon-mois`

---

### Phase D : Cash Flow + Adhoc + Tests Playwright 74/74 (~1.5h)

**Objective** : Page `/cash-flow` accessible HTTP 200, affichant ENTRÉES par source + SORTIES par section + SOLDE global. Dépense adhoc créable depuis `/mon-mois`. 12 nouveaux tests Playwright. Régression globale 74/74.

**Actions** :

- Créer `lib/actions/cash-flow.ts` :
  ```typescript
  'use server'

  import { sql } from '@/lib/db';

  export type CashFlowData = {
    month: string;
    entrées: {
      bySource: { source: string; label: string; icon: string; expected: number; actual: number }[];
      total_expected: number;
      total_actual: number;
    };
    sorties: {
      bySection: { section_name: string; section_icon: string; section_color: string; total: number }[];
      total: number;
    };
    solde: number; // actual_incomes - paid_expenses
  };

  export async function getCashFlowData(month: string): Promise<CashFlowData> {
    const [incomeRows, expenseRows] = await Promise.all([
      sql`
        SELECT i.source,
          SUM(mi.expected_amount) as expected,
          SUM(COALESCE(mi.actual_amount, 0)) as actual
        FROM monthly_incomes mi
        JOIN incomes i ON mi.income_id = i.id
        WHERE mi.month = ${month}
        GROUP BY i.source
      `,
      sql`
        SELECT s.name as section_name, s.icon as section_icon, s.color as section_color,
          SUM(me.amount) as total
        FROM monthly_expenses me
        JOIN sections s ON me.section_id = s.id
        WHERE me.month = ${month}
        GROUP BY s.id, s.name, s.icon, s.color
        ORDER BY total DESC
      `
    ]);

    const SOURCE_META: Record<string, { label: string; icon: string }> = {
      EMPLOYMENT: { label: 'Emploi', icon: '💼' },
      BUSINESS: { label: 'Business', icon: '🏢' },
      INVESTMENT: { label: 'Investissement', icon: '📈' },
      OTHER: { label: 'Autre', icon: '🔧' },
    };

    const bySource = incomeRows.map((r: { source: string; expected: number; actual: number }) => ({
      source: r.source,
      label: SOURCE_META[r.source]?.label ?? r.source,
      icon: SOURCE_META[r.source]?.icon ?? '💰',
      expected: Number(r.expected),
      actual: Number(r.actual),
    }));

    const total_expected = bySource.reduce((s: number, r: { expected: number }) => s + r.expected, 0);
    const total_actual = bySource.reduce((s: number, r: { actual: number }) => s + r.actual, 0);
    const total_sorties = expenseRows.reduce((s: number, r: { total: number }) => s + Number(r.total), 0);

    return {
      month,
      entrées: { bySource, total_expected, total_actual },
      sorties: {
        bySection: expenseRows.map((r: { section_name: string; section_icon: string; section_color: string; total: number }) => ({
          ...r, total: Number(r.total)
        })),
        total: total_sorties,
      },
      solde: total_actual - total_sorties,
    };
  }
  ```

- Créer `app/cash-flow/page.tsx` (Server Component) + `components/CashFlowClient.tsx` (Client Component) avec `frontend-design` skill :
  - **Server Component** : appelle `getCashFlowData(month)`, `generateMonthlyIncomes(month)`, passe les données à `CashFlowClient`
  - **CashFlowClient** :
    - Header avec SOLDE global en grand (vert si positif, rouge si négatif)
    - Section ENTRÉES : par source (Emploi, Business, Investissement, Autre) avec badge "Attendu: X$ / Reçu: Y$" et barre de progression
    - Section SORTIES : par section budgétaire avec barres proportionnelles (style existant)
    - Empty state explicite si `monthly_incomes` est vide
  - → **MCP Playwright** : naviguer `/cash-flow`, snapshot, screenshot mobile + desktop, 0 erreur console

- Créer `components/AdhocModal.tsx` avec `frontend-design` skill :
  - **Champs** : Nom (text, required), Montant (number, required), Section (select parmi sections existantes)
  - **Action** : appelle `createAdhocExpense(name, amount, sectionId, month)` (à créer dans `lib/actions/expenses.ts`)
  - `createAdhocExpense` crée un expense ONE_TIME ET insère directement dans `monthly_expenses` pour le mois courant :
    ```typescript
    export async function createAdhocExpense(
      name: string, amount: number, sectionId: string, month: string
    ) {
      // 1. Créer l'expense parent
      const [expense] = await sql`
        INSERT INTO expenses (name, amount, type, section_id, is_active, next_due_date)
        VALUES (${name}, ${amount}, 'ONE_TIME', ${sectionId}, true, CURRENT_DATE)
        RETURNING id
      `;
      // 2. Insérer directement dans monthly_expenses pour le mois courant
      await sql`
        INSERT INTO monthly_expenses (expense_id, section_id, month, name, amount, status, due_date)
        VALUES (${expense.id}, ${sectionId}, ${month}, ${name}, ${amount}, 'PENDING', CURRENT_DATE)
      `;
      revalidatePath('/mon-mois');
      revalidatePath('/depenses');
    }
    ```

- Ajouter bouton "+ Adhoc" dans `MonMoisClient.tsx` :
  - FAB secondaire ou bouton header visible sur mobile et desktop
  - Ouvre `AdhocModal`
  - → **MCP Playwright** : tester l'ajout d'une dépense adhoc, vérifier qu'elle apparaît dans la liste

- Ajouter lien `/cash-flow` dans la navigation :
  - Dans `components/BottomNav.tsx` : ajouter onglet "Cash Flow" (avec icône balance/flux)
  - Sur desktop sidebar : ajouter le lien "Cash Flow" dans la liste de navigation

- **Écrire les 12 tests Playwright** dans `tests/phase4/` :
  ```
  tests/phase4/
  ├── test-incomes-migration.spec.ts      — colonnes source, estimated_amount existent
  ├── test-monthly-incomes-table.spec.ts  — table monthly_incomes accessible (HTTP GET /api/db-check)
  ├── test-income-create-fixed.spec.ts    — créer revenu EMPLOYMENT MONTHLY via form → 200
  ├── test-income-create-variable.spec.ts — créer revenu BUSINESS VARIABLE → amount=null en DB
  ├── test-generate-monthly.spec.ts       — generateMonthlyIncomes → COUNT > 0
  ├── test-mark-received.spec.ts          — markIncomeReceived → status=RECEIVED dans DB
  ├── test-mon-mois-entrees.spec.ts       — /mon-mois affiche section "Entrées"
  ├── test-mon-mois-solde.spec.ts         — SOLDE visible dans /mon-mois
  ├── test-cash-flow-page.spec.ts         — /cash-flow accessible HTTP 200
  ├── test-cash-flow-sections.spec.ts     — /cash-flow affiche "Entrées" et "Sorties"
  ├── test-adhoc-create.spec.ts           — adhoc dépense apparaît dans monthly_expenses
  └── test-revenus-ui.spec.ts             — /revenus affiche badge source + "Variable"
  ```

  Structure type pour chaque test :
  ```typescript
  import { test, expect } from '@playwright/test';

  // test-cash-flow-page.spec.ts
  test('Page /cash-flow accessible HTTP 200', async ({ page }) => {
    await page.goto('/cash-flow');
    await expect(page).not.toHaveURL(/error/);
    const heading = page.getByRole('heading', { name: /[Cc]ash [Ff]low|[Ff]lux/ });
    await expect(heading).toBeVisible();
  });

  test('/cash-flow affiche sections ENTRÉES et SORTIES', async ({ page }) => {
    await page.goto('/cash-flow');
    await expect(page.getByText(/[Ee]ntrées/)).toBeVisible();
    await expect(page.getByText(/[Ss]orties/)).toBeVisible();
  });

  // test-mon-mois-entrees.spec.ts
  test('/mon-mois affiche bloc Entrées', async ({ page }) => {
    await page.goto('/mon-mois');
    await expect(page.getByText(/[Ee]ntrées/)).toBeVisible();
  });

  test('/mon-mois affiche le SOLDE', async ({ page }) => {
    await page.goto('/mon-mois');
    await expect(page.getByText(/[Ss]olde/i)).toBeVisible();
  });

  // test-revenus-ui.spec.ts
  test('/revenus affiche badge source sur les revenus', async ({ page }) => {
    await page.goto('/revenus');
    // Au moins un badge source visible (Emploi, Business, etc.)
    const badge = page.locator('text=/Emploi|Business|Investissement|Autre/').first();
    await expect(badge).toBeVisible();
  });
  ```

- Exécuter tous les nouveaux tests :
  ```bash
  npx playwright test tests/phase4/ --project=chromium --reporter=list
  # Attendu : 12/12 passed
  ```
- Exécuter la régression globale :
  ```bash
  npx playwright test --project=chromium --reporter=list
  # Attendu : 74/74 passed (62 existants + 12 nouveaux)
  ```
- `npm run build` + `npm run lint` — vérifier exit code 0
- `git add -A && git commit -m "feat: phase4 cash-flow page + adhoc modal + nav + 12 playwright tests 74/74" && git push origin main`
- Attendre le deploy automatique Vercel → `vercel ls --scope amara-fofanas-projects` → "Ready"
- → **MCP Playwright** : naviguer vers `https://mon-budget-seven.vercel.app/cash-flow`, screenshot production

**Success Criteria** :

- [ ] Page `/cash-flow` accessible HTTP 200 sur localhost et production
- [ ] `/cash-flow` affiche sections ENTRÉES + SORTIES + SOLDE global
- [ ] Empty state affiché sur `/cash-flow` si aucune donnée (pas de page blanche)
- [ ] Adhoc : ajouter "Réparation plombier 350$" → apparaît dans `/mon-mois` du mois courant
- [ ] Lien `/cash-flow` accessible depuis la navigation principale
- [ ] `npx playwright test tests/phase4/ --project=chromium` → **12/12 passed**
- [ ] `npx playwright test --project=chromium` → **74/74 passed** (régression globale)
- [ ] `npm run build` → exit code 0
- [ ] `npm run lint` → exit code 0
- [ ] `git status` → "nothing to commit, working tree clean"

---

## SELF-CORRECTION LOOP (Iteration Workflow)

### 1. Test (How to Verify)

Après chaque modification, exécuter dans l'ordre :

```bash
# Étape 1 : Build TypeScript
npm run build

# Étape 2 : Lint
npm run lint

# Étape 3 : Tests Phase 4 seulement
npx playwright test tests/phase4/ --project=chromium --reporter=list

# Étape 4 : Régression globale (après Phase D)
npx playwright test --project=chromium --reporter=list

# Vérification DB — état migration + monthly_incomes
node -e "
const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });
const sql = neon(process.env.POSTGRES_URL_NON_POOLING);
const month = new Date().toISOString().slice(0,7);
Promise.all([
  sql\`SELECT column_name FROM information_schema.columns WHERE table_name = 'incomes' AND column_name IN ('source', 'estimated_amount', 'notes')\`,
  sql\`SELECT COUNT(*) as count FROM monthly_incomes WHERE month = \${month}\`,
  sql\`SELECT status, COUNT(*) as n FROM monthly_incomes GROUP BY status\`,
]).then(([cols, mi, statuses]) => {
  console.log('Colonnes incomes enrichies:', cols.map(c => c.column_name));
  console.log('monthly_incomes ce mois:', mi[0].count);
  console.log('Statuts monthly_incomes:', statuses);
}).catch(console.error);
"
```

### 2. If Failures

**Build error TypeScript** :
- Lire le message exact (fichier:ligne:colonne)
- Si erreur sur `calcMonthlyIncome` (argument count) → vérifier tous les call sites dans `RevenusClient.tsx`, `ResteAVivreWidget.tsx`, `app/page.tsx` — passer le 3ème argument `inc.estimated_amount`
- Si erreur sur `Income.amount` null → utiliser `Number(inc.amount ?? 0)` aux endroits qui supposaient que `amount` est non-null
- Si erreur sur `MonthlyIncome` non trouvé → vérifier que l'export est dans `lib/types.ts` et que l'import est correct
- Si `window is not defined` → composant avec state ou DOM API utilisé côté serveur → ajouter `'use client'`
- Corriger → relancer `npm run build`

**Lint error** :
- `npm run lint -- --fix` pour les auto-fixables
- Corriger manuellement `no-unused-vars`, `@typescript-eslint/no-explicit-any`
- Relancer `npm run lint`

**Playwright test failure** :
- Lire le screenshot dans `test-results/` — identifier l'élément manquant ou l'assertion fausse
- Si test `test-mon-mois-entrees` échoue "Entrées non visible" → `MonMoisClient.tsx` ne reçoit pas les données `monthlyIncomes` → vérifier `app/mon-mois/page.tsx` passe bien le prop
- Si test `test-cash-flow-page` échoue avec 500 → lire les logs Vercel : `vercel logs --scope amara-fofanas-projects`
- Si test `test-generate-monthly` échoue "COUNT = 0" → vérifier qu'il existe bien des revenus fixes actifs en DB : `SELECT COUNT(*) FROM incomes WHERE is_active = true AND frequency != 'VARIABLE'`
- Si test `test-adhoc-create` échoue → vérifier que `createAdhocExpense` insère bien dans les 2 tables (expenses + monthly_expenses)
- Si test de régression Phase 1/2/3 échoue → NE PAS modifier les tests existants → corriger le code applicatif
- Corriger → relancer le test spécifique → relancer la régression

**Migration DB échoue** :
- Si `ALTER TABLE ... ADD CONSTRAINT` échoue → contrainte déjà existante avec un autre nom : `ALTER TABLE incomes DROP CONSTRAINT IF EXISTS incomes_frequency_check` d'abord
- Si `CREATE TABLE monthly_incomes` échoue → vérifier que `uuid_generate_v4()` est disponible : `CREATE EXTENSION IF NOT EXISTS "uuid-ossp"` sinon utiliser `gen_random_uuid()`
- Si `INSERT INTO sections ... ON CONFLICT DO NOTHING` échoue → vérifier la contrainte unique sur `sections`

**calcMonthlyIncome NaN pour VARIABLE** :
- Guard obligatoire : `if (frequency === 'VARIABLE') return estimated_amount ?? 0`
- Ne jamais appeler le calcul BIWEEKLY/YEARLY avec `amount = null`

**MonMoisClient trop complexe** :
- Si le composant dépasse 400 lignes → extraire `IncomesBlock` comme composant séparé dans le même fichier ou dans `components/IncomesBlock.tsx`
- Le bloc ENTRÉES peut être simplifié : juste la liste des monthly_incomes avec badge + bouton "Marquer reçu"

**Cash flow page blanche** :
- Vérifier l'empty state : si `monthly_incomes` est vide pour le mois, afficher un message explicatif
- Ne jamais retourner une page blanche — toujours prévoir un empty state

**Deploy Vercel échoue** :
- `vercel ls --scope amara-fofanas-projects` → voir le statut du dernier deploy
- Identifier l'erreur dans Vercel Dashboard → Deployments → Build Logs
- Corriger → `git push origin main` → attendre redeploy

### 3. If Tests Pass

- Vérifier visuellement dans le browser : `/cash-flow` avec SOLDE, `/mon-mois` avec bloc ENTRÉES, `/revenus` avec badges source
- Vérifier la console browser : zéro erreur rouge
- Vérifier la DB avec le script Node ci-dessus
- Vérifier `git status` → "nothing to commit, working tree clean"
- Cocher chaque condition dans la section COMPLETION CRITERIA

### 4. Determine Next Action

- Si **TOUTES les conditions de sortie sont remplies** → Output `<promise>PHASE4_COMPLETE</promise>`
- Si **conditions non remplies** → identifier quelle condition échoue → corriger → re-tester
- Si **bloqué après 20 itérations** → suivre l'Escape Hatch

---

## COMPLETION CRITERIA (Exit Conditions)

Output `<promise>PHASE4_COMPLETE</promise>` **UNIQUEMENT** quand **TOUTES** ces conditions sont vraies :

### A. Base de Données Neon Vérifiée

- [ ] `SELECT column_name FROM information_schema.columns WHERE table_name='incomes'` → inclut `source`, `estimated_amount`, `notes`
- [ ] `SELECT * FROM monthly_incomes LIMIT 1` → requête réussit (table accessible)
- [ ] Income VARIABLE créable : `SELECT amount, estimated_amount FROM incomes WHERE frequency = 'VARIABLE' LIMIT 1` → `amount IS NULL`, `estimated_amount IS NOT NULL`
- [ ] `generateMonthlyIncomes(month)` → `SELECT COUNT(*) FROM monthly_incomes WHERE month = 'YYYY-MM'` ≥ 1 (si revenus fixes existent)
- [ ] `markIncomeReceived(id, amount)` → `SELECT status FROM monthly_incomes WHERE id = 'X'` → `'RECEIVED'`

### B. Features Développées & Fonctionnelles

- [ ] Créer revenu EMPLOYMENT MONTHLY → badge "Emploi" visible dans `/revenus`
- [ ] Créer revenu BUSINESS VARIABLE estimated=2000$ → affichage "Variable (~2 000$/mois)"
- [ ] Page `/mon-mois` : bloc "Entrées" visible avec revenus du mois
- [ ] Page `/mon-mois` : SOLDE calculé et affiché (positif ou négatif)
- [ ] Bouton "Marquer reçu" sur un revenu EXPECTED → status passe à RECEIVED, SOLDE mis à jour
- [ ] Page `/cash-flow` accessible HTTP 200
- [ ] `/cash-flow` affiche ENTRÉES (par source) + SORTIES (par section) + SOLDE global
- [ ] Empty state affiché sur `/cash-flow` si aucune donnée (pas de page blanche)
- [ ] Dépense adhoc : ajouter depuis `/mon-mois` → apparaît immédiatement dans la liste du mois
- [ ] Lien `/cash-flow` accessible depuis la navigation principale (mobile + desktop)

### C. Déploiement Vercel

- [ ] `git push origin main` → deploy automatique → `vercel ls --scope amara-fofanas-projects` retourne "Ready"
- [ ] `https://mon-budget-seven.vercel.app/cash-flow` → HTTP 200 en production
- [ ] `https://mon-budget-seven.vercel.app/mon-mois` → bloc ENTRÉES visible en production

### D. Build & Qualité

- [ ] `npm run build` → exit code 0, zéro erreur TypeScript
- [ ] `npm run lint` → zéro erreur ESLint
- [ ] Zéro `console.error` dans browser sur `https://mon-budget-seven.vercel.app` (vérifier via MCP Playwright)
- [ ] Zéro placeholder "TODO" ou "Coming soon" dans l'UI Phase 4
- [ ] `calcMonthlyIncome(null, 'VARIABLE', 2000)` → retourne `2000` (pas NaN, pas 0 si estimated_amount fourni)

### E. Tests Playwright

- [ ] `npx playwright test tests/phase4/ --project=chromium` → **12/12 passed**
- [ ] `npx playwright test --project=chromium` → **74/74 passed** (62 existants + 12 nouveaux)
- [ ] Tous les tests s'exécutent sur l'URL Vercel de **production** (configurer `baseURL` dans `playwright.config.ts`)
- [ ] Rapport Playwright généré : `playwright-report/index.html` existe

### F. Git

- [ ] `git status` → "nothing to commit, working tree clean"
- [ ] `git log --oneline origin/main | head -5` → derniers commits contiennent les features Phase 4
- [ ] Toutes les features committées et pushées sur `main`

**Quand TOUTES les conditions ci-dessus sont TRUE :**

```
<promise>PHASE4_COMPLETE</promise>
```

---

## ESCAPE HATCH (If Stuck After 20 Iterations)

Si après 20 itérations les conditions ne sont **pas toutes remplies** :

### 1. Créer `phase4-blockers.md`

```markdown
## BLOCKERS REPORT — Phase 4 Vision Cash Flow

### Conditions Non Remplies
- [x] Condition X.Y : [description précise] → Erreur : [message exact]

### Tentatives
1. Itération N : [ce qui a été essayé] → [résultat]
2. Itération N+5 : [ce qui a été essayé] → [résultat]

### Causes Probables
- [Cause 1] : [explication technique]
- [Cause 2] : [explication technique]

### Approches Alternatives
1. [Approche A] : [description] — pros : [...] — cons : [...]
2. [Approche B] : [description] — pros : [...] — cons : [...]

### Actions Recommandées pour Amara
- [Action 1] : [étapes précises]
- [Action 2] : [étapes précises]

### Features Implémentées (ce qui fonctionne)
- [Feature X] : [état]

### Features Bloquées
- [Feature Y] : [raison précise]
```

### 2. Commit ce qui fonctionne

```bash
git add -A && git commit -m "wip: phase4 partial — see phase4-blockers.md"
git push origin main
```

### 3. Output

```
<promise>BLOCKED</promise>
```

---

## TECHNICAL NOTES

### Migration DB — Safety Rules

Toutes les colonnes ajoutées sont NULLABLE ou ont une valeur DEFAULT → pas de breaking change sur les données existantes :
- `source VARCHAR(30) DEFAULT 'EMPLOYMENT'` → les revenus existants auront `source = 'EMPLOYMENT'` automatiquement
- `estimated_amount DECIMAL(10,2)` → nullable, pas de breaking change
- `notes TEXT` → nullable

`CREATE TABLE IF NOT EXISTS monthly_incomes` → sans risque si la table n'existe pas encore.

```bash
# Vérifier l'état de la migration avant de commencer
node -e "
const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });
const sql = neon(process.env.POSTGRES_URL_NON_POOLING);
sql\`SELECT column_name FROM information_schema.columns WHERE table_name = 'incomes'\`
  .then(cols => console.log('Colonnes incomes actuelles:', cols.map(c => c.column_name)))
  .catch(console.error);
"
```

### calcMonthlyIncome — Signature mise à jour

```typescript
// AVANT (Phase 1-3) — 2 arguments
calcMonthlyIncome(amount: number, frequency: IncomeFrequency): number

// APRÈS (Phase 4) — 3 arguments, amount nullable
calcMonthlyIncome(
  amount: number | null,
  frequency: IncomeFrequency,
  estimated_amount?: number | null
): number
```

⚠️ **Tous les call sites existants doivent être mis à jour** :
- `components/RevenusClient.tsx` → `calcMonthlyIncome(Number(inc.amount), inc.frequency, inc.estimated_amount)`
- `app/page.tsx` (widget "Reste à vivre") → même mise à jour
- `components/ResteAVivreWidget.tsx` (si existant) → même mise à jour

### VARIABLE incomes — Règles de génération

- Les revenus `VARIABLE` ne génèrent **PAS** d'instance `monthly_incomes` automatiquement
- Ils sont saisis manuellement via `markVariableIncomeReceived(incomeId, month, actualAmount)`
- Dans `getMonthlyIncomeSummary`, les revenus VARIABLE apparaissent seulement si une instance a été créée manuellement

### ON CONFLICT — Pattern monthly_incomes

```sql
-- Safe insert : évite les doublons si generateMonthlyIncomes est appelé plusieurs fois
INSERT INTO monthly_incomes (income_id, month, expected_amount, status)
VALUES ($1, $2, $3, 'EXPECTED')
ON CONFLICT (income_id, month) DO NOTHING
```

### uuid_generate_v4() vs gen_random_uuid()

Si `uuid_generate_v4()` n'est pas disponible (extension `uuid-ossp` non installée) :
```sql
-- Utiliser à la place :
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
```
Vérifier : `SELECT uuid_generate_v4()` → si erreur, utiliser `gen_random_uuid()`.

### Non-régression — Règle absolue

Ne **JAMAIS** modifier les fichiers dans `tests/phase1/`, `tests/phase2/`, `tests/phase3/`, `tests/phase3-new/`.
Si un test existant échoue après un changement Phase 4 → corriger le **CODE APPLICATIF**, pas le test.

### Vercel scope — toutes les commandes

```bash
# Toujours ajouter --scope amara-fofanas-projects
vercel ls --scope amara-fofanas-projects
vercel logs --scope amara-fofanas-projects
```

### URL de production

`https://mon-budget-seven.vercel.app` — configurer comme `baseURL` dans `playwright.config.ts` pour les tests sur prod.

### Frontend-design skill — Usage obligatoire

Appeler `frontend-design` pour TOUT le JSX Phase 4 :
- `components/IncomeModal.tsx` (refonte)
- `components/CashFlowClient.tsx`
- `components/AdhocModal.tsx`
- `components/IncomesBlock.tsx` (si extrait)
- `app/cash-flow/page.tsx`

Design tokens disponibles : `--accent`, `--positive`, `--positive-subtle`, `--positive-text`, `--warning`, `--warning-subtle`, `sheet`, `sheet-backdrop`, `sheet-handle`, `fab`, `card`, `hero-card`.

---

## FINAL SUCCESS CRITERIA

- 74/74 tests Playwright verts sur URL Vercel production (`https://mon-budget-seven.vercel.app`)
- Table `monthly_incomes` créée avec au moins 1 instance pour le mois courant
- Revenus VARIABLE créables avec `estimated_amount`
- Page `/mon-mois` affiche ENTRÉES + SOLDE
- Page `/cash-flow` HTTP 200, affiche ENTRÉES/SORTIES/SOLDE
- Dépense adhoc fonctionnelle depuis `/mon-mois`
- `npm run build` + `npm run lint` sans erreur
- Code committé et pushé sur GitHub `main`
- Zéro erreur console browser sur l'URL de production

```
<promise>PHASE4_COMPLETE</promise>
```
