---
active: true
iteration: 2
max_iterations: 25
completion_promise: "PHASE1_COMPLEMENT_COMPLETE"
started_at: "2026-02-26T21:57:26Z"
---

# MISSION: Phase 1 Complement — Mon Budget PWA

Compléter Phase 1 du PRD v1.2 en ajoutant ce qui manque : table `monthly_expenses`, logique de génération des instances mensuelles, page `/mon-mois` (suivi mensuel avec statuts), widget "Mon mois" sur le dashboard, et champs `email`/`phone` dans les paramètres. Le MVP est déjà deployé (32/32 tests verts). Ce complement est entièrement additif — aucune régression n'est acceptable.

---

## REFERENCES (Read First — Dans cet ordre)

1. **`plan-phase1-complement.md`** — Plan détaillé avec Gap Analysis, phases A-D, success criteria. LIRE EN ENTIER avant de commencer.
2. **`prd-budget-tracker-3.md`** — PRD v1.2 complet : modèle de données MonthlyExpense, vue "Mon mois", dashboard update.
3. **`lib/types.ts`** — Types TypeScript existants (Section, Card, Expense, Settings). Comprendre avant de modifier.
4. **`supabase/schema.sql`** — Schéma DB existant. Référence pour les tables actuelles.
5. **`lib/actions/expenses.ts`** et **`lib/actions/settings.ts`** — Server Actions existantes. Ne pas casser leur signature.
6. **`app/page.tsx`** — Dashboard existant. Comprendre la structure avant de l'augmenter.
7. **`app/parametres/page.tsx`** — Page paramètres existante. Comprendre avant de modifier.
8. **`.env.local`** — Credentials Neon PostgreSQL (`POSTGRES_URL`, `POSTGRES_URL_NON_POOLING`).
9. **`.vercel/`** — Projet Vercel déjà lié (`amara-fofanas-projects/mon-budget`).

---

## Required Tools/Skills

- Utiliser le skill **`frontend-design`** pour TOUT le code UI : page `/mon-mois`, composants `MonthlyExpenseItem`, `MonthProgressBar`, mise à jour dashboard, mise à jour `/parametres`. Ne jamais écrire du JSX sans ce skill.
- Utiliser `vercel` CLI (`--scope amara-fofanas-projects`) pour vérifier le deploy.
- Utiliser le **MCP Playwright** (`mcp__playwright__browser_navigate`, `mcp__playwright__browser_snapshot`, `mcp__playwright__browser_take_screenshot`, `mcp__playwright__browser_console_messages`) pour tester visuellement chaque interface au fur et à mesure.
- Utiliser `npx playwright` pour les tests E2E finaux.

---

## UI TESTING PROTOCOL (Obligatoire apres chaque composant/page UI)

> **Règle** : Apres chaque page ou composant UI construit avec `frontend-design`, IMMÉDIATEMENT tester dans le browser avec le MCP Playwright AVANT de passer à la suite.

**Protocole a suivre apres chaque UI buildée** :

```
1. npm run dev (si pas déjà lancé — port 3000)
2. mcp__playwright__browser_navigate → http://localhost:3000/[page]
3. mcp__playwright__browser_snapshot → vérifier l'arbre d'accessibilité (structure présente)
4. mcp__playwright__browser_take_screenshot → vérifier le rendu visuel
5. mcp__playwright__browser_resize → width: 375, height: 812 (mobile)
6. mcp__playwright__browser_navigate → même URL (rechargement mobile)
7. mcp__playwright__browser_take_screenshot → vérifier rendu mobile
8. mcp__playwright__browser_console_messages (level: "error") → zéro erreur
9. Si problème détecté → corriger AVANT de passer à la page suivante
```

**Ce qu'on vérifie a chaque test visuel** :
- La page se charge sans erreur (pas de page blanche, pas de 500)
- Les éléments attendus sont présents (barre de progression, groupes par statut, boutons d'action)
- Le rendu mobile 375px est correct (pas de débordement horizontal)
- Zéro erreur rouge dans la console browser

---

## PHASES (Incremental Goals)

### Phase A: Migration DB (Est. ~30 min)

**Objective** : Table `monthly_expenses` créée en Neon + colonnes `email`/`phone` ajoutées a `settings`. Aucun code applicatif modifié dans cette phase.

**Actions** :

**A1** — Créer `scripts/migrate-phase1-complement.js` :

```javascript
const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });

const sql = neon(process.env.POSTGRES_URL_NON_POOLING);

async function migrate() {
  console.log('Starting Phase 1 Complement migration...');

  // 1. Create monthly_expenses table
  await sql`
    CREATE TABLE IF NOT EXISTS monthly_expenses (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      expense_id UUID REFERENCES expenses(id) ON DELETE SET NULL,
      month VARCHAR(7) NOT NULL,
      name VARCHAR(200) NOT NULL,
      amount DECIMAL(10, 2) NOT NULL,
      due_date DATE NOT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'UPCOMING'
        CHECK (status IN ('UPCOMING', 'PAID', 'OVERDUE', 'DEFERRED')),
      paid_at DATE,
      section_id UUID REFERENCES sections(id) ON DELETE SET NULL,
      card_id UUID REFERENCES cards(id) ON DELETE SET NULL,
      is_auto_charged BOOLEAN DEFAULT FALSE,
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      CONSTRAINT uq_expense_month UNIQUE (expense_id, month)
    )
  `;
  console.log('✓ Table monthly_expenses created');

  // 2. Create indexes
  await sql`CREATE INDEX IF NOT EXISTS idx_me_month ON monthly_expenses(month)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_me_month_status ON monthly_expenses(month, status)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_me_section ON monthly_expenses(section_id)`;
  console.log('✓ Indexes created');

  // 3. Add email and phone to settings
  await sql`ALTER TABLE settings ADD COLUMN IF NOT EXISTS email VARCHAR(255) DEFAULT NULL`;
  await sql`ALTER TABLE settings ADD COLUMN IF NOT EXISTS phone VARCHAR(50) DEFAULT NULL`;
  console.log('✓ Columns email and phone added to settings');

  console.log('Migration complete!');
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
```

**A2** — Exécuter la migration :
```bash
node scripts/migrate-phase1-complement.js
```

**A3** — Vérifier la migration via script de verification :
```bash
node -e "
const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });
const sql = neon(process.env.POSTGRES_URL_NON_POOLING);
Promise.all([
  sql\`SELECT COUNT(*) as count FROM monthly_expenses\`,
  sql\`SELECT column_name FROM information_schema.columns WHERE table_name='settings' AND column_name IN ('email','phone') ORDER BY column_name\`,
  sql\`SELECT indexname FROM pg_indexes WHERE tablename='monthly_expenses'\`
]).then(([me, cols, idx]) => {
  console.log('monthly_expenses count:', me[0].count, '(expected: 0)');
  console.log('settings new columns:', cols.map(c => c.column_name).join(', '), '(expected: email, phone)');
  console.log('indexes:', idx.map(i => i.indexname).join(', '));
}).catch(console.error);
"
```

**A4** — Mettre a jour `supabase/schema.sql` pour documenter les nouveaux DDL (ajouter le CREATE TABLE monthly_expenses et l'ALTER TABLE settings a la fin du fichier, en commentant clairement "Phase 1 Complement").

**A5** — Commit :
```bash
git add scripts/migrate-phase1-complement.js supabase/schema.sql
git commit -m "feat(db): add monthly_expenses table + email/phone to settings"
git push origin main
```

**Success Criteria Phase A** :

- [ ] `SELECT COUNT(*) FROM monthly_expenses` → retourne 0 (pas d'erreur)
- [ ] `SELECT column_name FROM information_schema.columns WHERE table_name='settings' AND column_name='email'` → 1 row
- [ ] `SELECT column_name FROM information_schema.columns WHERE table_name='settings' AND column_name='phone'` → 1 row
- [ ] Contrainte `uq_expense_month` présente dans `pg_constraint`
- [ ] Index `idx_me_month` et `idx_me_month_status` dans `pg_indexes`
- [ ] `npm run build` → exit code 0 (aucun code applicatif changé)

---

### Phase B: Business Logic — Types + Server Actions MonthlyExpense (Est. ~1h30)

**Objective** : Types TypeScript mis a jour, `lib/actions/monthly-expenses.ts` créé avec toute la logique de génération et de gestion des statuts, `settings.ts` mis a jour pour email/phone.

**Actions** :

**B1** — Mettre a jour `lib/types.ts` — AJOUTER (ne pas supprimer l'existant) :

```typescript
// Après les types existants, ajouter :

export type MonthlyExpenseStatus = 'UPCOMING' | 'PAID' | 'OVERDUE' | 'DEFERRED';

export type MonthlyExpense = {
  id: string;
  expense_id: string | null;
  month: string;           // ex: "2026-02"
  name: string;
  amount: number;
  due_date: string;
  status: MonthlyExpenseStatus;
  paid_at: string | null;
  section_id: string | null;
  card_id: string | null;
  is_auto_charged: boolean;
  notes: string | null;
  created_at: string;
  // Joined
  section?: Section;
  card?: Card;
};

export type MonthSummary = {
  count: number;
  total: number;
  paid_count: number;
  paid_total: number;
  overdue_count: number;
};
```

Et modifier le type `Settings` existant pour ajouter les deux nouveaux champs :
```typescript
// Dans Settings, ajouter AVANT les champs existants ou apres id :
email: string | null;
phone: string | null;
```

**B2** — Mettre a jour `lib/actions/settings.ts` :

- `getSettings()` : modifier le SELECT pour inclure `email, phone`
- `updateSettings(data)` : modifier pour accepter et persister `email` et `phone`
- Ne pas modifier la signature des autres fonctions

**B3** — Créer `lib/actions/monthly-expenses.ts` :

```typescript
'use server';

import { neon } from '@neondatabase/serverless';
import { revalidatePath } from 'next/cache';
import type { MonthlyExpense, MonthSummary } from '@/lib/types';

const sql = neon(process.env.POSTGRES_URL!);

// Calcule la due_date effective d'une expense RECURRING pour un mois donné
function calcDueDateForMonth(expense: {
  recurrence_frequency: string | null;
  recurrence_day: number | null;
  next_due_date: string | null;
}, month: string): string | null {
  const [year, monthNum] = month.split('-').map(Number);

  // Si next_due_date est dans ce mois, l'utiliser directement
  if (expense.next_due_date) {
    const nd = new Date(expense.next_due_date);
    if (nd.getFullYear() === year && nd.getMonth() + 1 === monthNum) {
      return expense.next_due_date;
    }
  }

  // Pour MONTHLY, QUARTERLY, YEARLY : utiliser recurrence_day dans ce mois
  if (expense.recurrence_day && ['MONTHLY', 'QUARTERLY', 'YEARLY'].includes(expense.recurrence_frequency || '')) {
    const daysInMonth = new Date(year, monthNum, 0).getDate();
    const day = Math.min(expense.recurrence_day, daysInMonth);
    return `${year}-${String(monthNum).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  // Pour WEEKLY / BIWEEKLY : retourner le 1er du mois comme fallback
  if (['WEEKLY', 'BIWEEKLY'].includes(expense.recurrence_frequency || '')) {
    return `${year}-${String(monthNum).padStart(2, '0')}-01`;
  }

  return null;
}

// Génère les instances mensuelles pour un mois donné (idempotent)
export async function generateMonthlyExpenses(month: string): Promise<void> {
  const [year, monthNum] = month.split('-').map(Number);
  const monthStart = `${year}-${String(monthNum).padStart(2, '0')}-01`;
  const monthEnd = new Date(year, monthNum, 0).toISOString().split('T')[0];

  // Récupérer les expenses RECURRING actives
  const recurringExpenses = await sql`
    SELECT id, name, amount, section_id, card_id, auto_debit,
           recurrence_frequency, recurrence_day, next_due_date, notes
    FROM expenses
    WHERE type = 'RECURRING'
      AND is_active = true
  `;

  // Récupérer les expenses ONE_TIME dont next_due_date est dans ce mois
  const oneTimeExpenses = await sql`
    SELECT id, name, amount, section_id, card_id, auto_debit, next_due_date, notes
    FROM expenses
    WHERE type = 'ONE_TIME'
      AND is_active = true
      AND next_due_date >= ${monthStart}::date
      AND next_due_date <= ${monthEnd}::date
  `;

  // Insérer les instances RECURRING
  for (const expense of recurringExpenses) {
    const dueDate = calcDueDateForMonth(expense, month);
    if (!dueDate) continue;

    await sql`
      INSERT INTO monthly_expenses
        (expense_id, month, name, amount, due_date, status, section_id, card_id, is_auto_charged, notes)
      VALUES
        (${expense.id}, ${month}, ${expense.name}, ${expense.amount},
         ${dueDate}::date, 'UPCOMING', ${expense.section_id}, ${expense.card_id},
         ${expense.auto_debit}, ${expense.notes})
      ON CONFLICT (expense_id, month) DO NOTHING
    `;
  }

  // Insérer les instances ONE_TIME
  for (const expense of oneTimeExpenses) {
    await sql`
      INSERT INTO monthly_expenses
        (expense_id, month, name, amount, due_date, status, section_id, card_id, is_auto_charged, notes)
      VALUES
        (${expense.id}, ${month}, ${expense.name}, ${expense.amount},
         ${expense.next_due_date}::date, 'UPCOMING', ${expense.section_id}, ${expense.card_id},
         ${expense.auto_debit}, ${expense.notes})
      ON CONFLICT (expense_id, month) DO NOTHING
    `;
  }
}

// Auto-marque OVERDUE les instances dont due_date est passée et statut = UPCOMING
export async function autoMarkOverdue(month: string): Promise<void> {
  await sql`
    UPDATE monthly_expenses
    SET status = 'OVERDUE'
    WHERE month = ${month}
      AND status = 'UPCOMING'
      AND due_date < CURRENT_DATE
  `;
}

// Auto-marque PAID les instances auto_debit dont due_date est passée
export async function autoMarkPaidForAutoDebit(month: string): Promise<void> {
  await sql`
    UPDATE monthly_expenses
    SET status = 'PAID', paid_at = due_date
    WHERE month = ${month}
      AND is_auto_charged = true
      AND status IN ('UPCOMING', 'OVERDUE')
      AND due_date <= CURRENT_DATE
  `;
}

// Récupérer les instances d'un mois (avec joins)
export async function getMonthlyExpenses(
  month: string,
  sectionId?: string
): Promise<MonthlyExpense[]> {
  // Générer les instances si aucune n'existe pour ce mois
  const existing = await sql`SELECT COUNT(*) as count FROM monthly_expenses WHERE month = ${month}`;
  if (Number(existing[0].count) === 0) {
    await generateMonthlyExpenses(month);
  }

  // Auto-updates
  await autoMarkOverdue(month);
  await autoMarkPaidForAutoDebit(month);

  const rows = sectionId
    ? await sql`
        SELECT me.*,
               s.name as section_name, s.icon as section_icon, s.color as section_color,
               c.name as card_name
        FROM monthly_expenses me
        LEFT JOIN sections s ON me.section_id = s.id
        LEFT JOIN cards c ON me.card_id = c.id
        WHERE me.month = ${month} AND me.section_id = ${sectionId}
        ORDER BY
          CASE me.status WHEN 'OVERDUE' THEN 1 WHEN 'UPCOMING' THEN 2 WHEN 'DEFERRED' THEN 3 WHEN 'PAID' THEN 4 END,
          me.due_date ASC
      `
    : await sql`
        SELECT me.*,
               s.name as section_name, s.icon as section_icon, s.color as section_color,
               c.name as card_name
        FROM monthly_expenses me
        LEFT JOIN sections s ON me.section_id = s.id
        LEFT JOIN cards c ON me.card_id = c.id
        WHERE me.month = ${month}
        ORDER BY
          CASE me.status WHEN 'OVERDUE' THEN 1 WHEN 'UPCOMING' THEN 2 WHEN 'DEFERRED' THEN 3 WHEN 'PAID' THEN 4 END,
          me.due_date ASC
      `;

  return rows.map((row) => ({
    ...row,
    amount: Number(row.amount),
    section: row.section_name ? {
      id: row.section_id,
      name: row.section_name,
      icon: row.section_icon,
      color: row.section_color,
    } : undefined,
    card: row.card_name ? { id: row.card_id, name: row.card_name } : undefined,
  })) as MonthlyExpense[];
}

// Résumé du mois pour la barre de progression
export async function getMonthSummary(month: string): Promise<MonthSummary> {
  const rows = await sql`
    SELECT
      COUNT(*) as count,
      COALESCE(SUM(amount), 0) as total,
      COALESCE(SUM(CASE WHEN status = 'PAID' THEN 1 ELSE 0 END), 0) as paid_count,
      COALESCE(SUM(CASE WHEN status = 'PAID' THEN amount ELSE 0 END), 0) as paid_total,
      COALESCE(SUM(CASE WHEN status = 'OVERDUE' THEN 1 ELSE 0 END), 0) as overdue_count
    FROM monthly_expenses
    WHERE month = ${month}
  `;
  return {
    count: Number(rows[0].count),
    total: Number(rows[0].total),
    paid_count: Number(rows[0].paid_count),
    paid_total: Number(rows[0].paid_total),
    overdue_count: Number(rows[0].overdue_count),
  };
}

// Marquer comme PAID
export async function markAsPaid(id: string, paidAt?: string): Promise<void> {
  await sql`
    UPDATE monthly_expenses
    SET status = 'PAID', paid_at = COALESCE(${paidAt || null}::date, CURRENT_DATE)
    WHERE id = ${id}
  `;
  revalidatePath('/mon-mois');
  revalidatePath('/');
}

// Marquer comme DEFERRED
export async function markAsDeferred(id: string): Promise<void> {
  await sql`
    UPDATE monthly_expenses SET status = 'DEFERRED' WHERE id = ${id}
  `;
  revalidatePath('/mon-mois');
  revalidatePath('/');
}

// Annuler un paiement (repasser a UPCOMING)
export async function markAsUpcoming(id: string): Promise<void> {
  await sql`
    UPDATE monthly_expenses SET status = 'UPCOMING', paid_at = NULL WHERE id = ${id}
  `;
  revalidatePath('/mon-mois');
  revalidatePath('/');
}

// Récupérer les dépenses OVERDUE du mois courant (pour dashboard)
export async function getOverdueExpenses(month: string, limit = 5): Promise<MonthlyExpense[]> {
  const rows = await sql`
    SELECT me.*, s.name as section_name, s.icon as section_icon, s.color as section_color
    FROM monthly_expenses me
    LEFT JOIN sections s ON me.section_id = s.id
    WHERE me.month = ${month} AND me.status = 'OVERDUE'
    ORDER BY me.due_date ASC
    LIMIT ${limit}
  `;
  return rows.map((row) => ({
    ...row,
    amount: Number(row.amount),
    section: row.section_name ? {
      id: row.section_id,
      name: row.section_name,
      icon: row.section_icon,
      color: row.section_color,
    } : undefined,
  })) as MonthlyExpense[];
}
```

**B4** — Vérifier `npm run build` et `npm run lint` :
```bash
npm run build
npm run lint
npx tsc --noEmit
```

**B5** — Test de la logique de génération :
```bash
node -e "
const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });
const sql = neon(process.env.POSTGRES_URL_NON_POOLING);
sql\`SELECT COUNT(*) as count FROM monthly_expenses WHERE month='2026-02'\`
  .then(r => console.log('instances 2026-02:', r[0].count))
  .catch(console.error);
"
```

Note : La génération est déclenchée côté serveur par `getMonthlyExpenses()`, pas directement via script Node. Le test ci-dessus vérifie simplement que la table est accessible.

**B6** — Commit :
```bash
git add lib/types.ts lib/actions/monthly-expenses.ts lib/actions/settings.ts
git commit -m "feat(logic): monthly-expenses server actions + types update + settings email/phone"
git push origin main
```

**Success Criteria Phase B** :

- [ ] `MonthlyExpense`, `MonthlyExpenseStatus`, `MonthSummary` exportés depuis `lib/types.ts`
- [ ] `Settings` inclut `email: string | null` et `phone: string | null`
- [ ] `lib/actions/monthly-expenses.ts` contient : `generateMonthlyExpenses`, `getMonthlyExpenses`, `getMonthSummary`, `markAsPaid`, `markAsDeferred`, `markAsUpcoming`, `autoMarkOverdue`, `autoMarkPaidForAutoDebit`, `getOverdueExpenses`
- [ ] `getSettings()` retourne les champs `email` et `phone` sans erreur TypeScript
- [ ] `npm run build` → exit code 0
- [ ] `npm run lint` → exit code 0
- [ ] `npx tsc --noEmit` → exit code 0

---

### Phase C: Page `/mon-mois` UI (Est. ~1h30)

**Objective** : Page `/mon-mois` complète, testée visuellement sur desktop et mobile, fonctionnelle en production.

**Actions** :

**C1** — Utiliser le skill `frontend-design` pour créer `components/MonthProgressBar.tsx` :

Composant réutilisable. Props : `count: number, total: number, paidCount: number, paidTotal: number, overdueCount: number`. Affiche :
- Barre de progression HTML/CSS (largeur = paidCount/count * 100%)
- Texte : "X/Y complétées · Z$ payé / W$ total"
- Couleur de la barre : vert si 100%, orange si > 50%, rouge si alertes OVERDUE
- Formatter les montants en CAD avec `Intl.NumberFormat`

Apres création : **MCP Playwright test** sur un storybook ou page de test.

**C2** — Utiliser le skill `frontend-design` pour créer `components/MonthlyExpenseItem.tsx` :

Props : `item: MonthlyExpense, onMarkPaid: () => void, onMarkDeferred: () => void`. Affiche :
- Nom de la dépense, montant (formaté), due_date
- Section icon + nom (compact)
- Badge "Auto" si `is_auto_charged = true`
- Bouton "Payer" (icone check) → fond vert — visible si statut OVERDUE ou UPCOMING
- Bouton "Reporter" (icone arrow-right) → visible si statut UPCOMING uniquement
- Si statut PAID : check icon vert + date de paiement, sans boutons d'action
- Si statut DEFERRED : badge "Reporté", bouton "Payer" uniquement
- Statut OVERDUE : fond rouge pâle, badge "En retard"

**C3** — Utiliser le skill `frontend-design` pour créer `app/mon-mois/page.tsx` :

**Structure complète** :

```typescript
// app/mon-mois/page.tsx — Server Component
// Props : searchParams : { month?: string, section?: string }

// Logique :
// 1. month = searchParams.month ?? format(new Date(), 'yyyy-MM') // mois courant
// 2. sectionId = searchParams.section
// 3. const items = await getMonthlyExpenses(month, sectionId)
// 4. const summary = await getMonthSummary(month)
// 5. const sections = await getSections()

// UI :
// En-tête :
//   - Bouton "<" → month-1 (link href avec ?month=)
//   - Titre "Février 2026" (formatter le mois)
//   - Bouton ">" → month+1

// Barre de progression :
//   - <MonthProgressBar {...summary} />

// Filtre sections :
//   - Chip "Tout" (actif si pas de sectionId)
//   - Un chip par section (actif si sectionId = section.id)
//   - Chaque chip = lien href ?month=...&section=...

// Groupes :
//   - Section OVERDUE : si items.some(i => i.status === 'OVERDUE')
//     - En-tête "En retard" avec badge count rouge
//     - Liste des items OVERDUE + <MonthlyExpenseItem>
//   - Section UPCOMING :
//     - En-tête "À venir"
//     - Liste des items UPCOMING + <MonthlyExpenseItem>
//   - Section DEFERRED (si items.some(i => i.status === 'DEFERRED')) :
//     - En-tête "Reporté"
//     - Liste des items DEFERRED + <MonthlyExpenseItem>
//   - Section PAID :
//     - En-tête "Payé" (visuellement discret, fond vert pâle)
//     - Liste des items PAID + <MonthlyExpenseItem>

// Message vide si items.length === 0 :
//   - "Aucune dépense pour ce mois. Les dépenses récurrentes seront ajoutées automatiquement."
```

**Actions Server** (dans la page ou dans un fichier séparé `app/mon-mois/actions.ts`) :
- `handleMarkPaid(id: string)` → appelle `markAsPaid(id)` → `revalidatePath('/mon-mois')` + `revalidatePath('/')`
- `handleMarkDeferred(id: string)` → appelle `markAsDeferred(id)` → `revalidatePath('/mon-mois')`

**C4** — MCP Playwright test complet apres création :

```
1. npm run dev
2. mcp__playwright__browser_navigate → http://localhost:3000/mon-mois
3. mcp__playwright__browser_snapshot → vérifier : titre mois, barre progression, groupes statuts
4. mcp__playwright__browser_take_screenshot → screenshot desktop
5. mcp__playwright__browser_resize → 375 x 812
6. mcp__playwright__browser_navigate → http://localhost:3000/mon-mois (rechargement)
7. mcp__playwright__browser_take_screenshot → screenshot mobile
8. mcp__playwright__browser_console_messages (level: "error") → zéro erreur
9. Tester navigation : cliquer "<" → vérifier URL change → mois précédent chargé
10. Si des items existent : cliquer "Payer" sur un item UPCOMING → vérifier qu'il passe dans la section PAID
```

**C5** — Vérifier l'intégration dans la bottom navigation :

Lire le fichier de la bottom nav (probablement dans `app/layout.tsx` ou `components/BottomNav.tsx`). Ajouter l'onglet "Mon mois" si pas déjà présent.

**C6** — `npm run build` doit passer :
```bash
npm run build
```

**C7** — Commit + push + vérification prod :
```bash
git add app/mon-mois/ components/MonthlyExpenseItem.tsx components/MonthProgressBar.tsx app/layout.tsx
git commit -m "feat(ui): page /mon-mois — suivi mensuel avec statuts, progression et actions rapides"
git push origin main
```

Attendre le deploy Vercel (~2 min) puis :
```bash
vercel ls --scope amara-fofanas-projects
```
```
mcp__playwright__browser_navigate → https://mon-budget-seven.vercel.app/mon-mois
mcp__playwright__browser_snapshot → vérifier que la page se charge en production
mcp__playwright__browser_console_messages (level: "error") → zéro erreur prod
```

**Success Criteria Phase C** :

- [ ] `GET /mon-mois` retourne HTTP 200 (local + production)
- [ ] Barre de progression affiche "X/Y complétées · Z$ payé / W$ total" avec données réelles
- [ ] Items groupés dans l'ordre : OVERDUE → UPCOMING → DEFERRED → PAID
- [ ] Bouton "Payer" sur item UPCOMING/OVERDUE → statut passe a PAID sans rechargement total
- [ ] Bouton "Reporter" sur item UPCOMING → statut passe a DEFERRED
- [ ] Badge "Auto" visible sur les `is_auto_charged = true`
- [ ] Navigation mois : "<" et ">" modifient l'URL `?month=` et rechargent les données
- [ ] Filtre sections : chips visibles, cliquer change l'URL `?section=` et filtre les items
- [ ] Message "Aucune dépense" si liste vide
- [ ] Rendu mobile 375px correct (pas de débordement horizontal)
- [ ] Zéro erreur console browser
- [ ] `npm run build` → exit code 0

---

### Phase D: Dashboard Update + Parametres + Tests Playwright (Est. ~1h)

**Objective** : Widget "Mon mois" opérationnel sur le dashboard, champs email/phone dans /parametres, 40/40 tests Playwright verts sur URL Vercel production.

**Actions** :

**D1** — Utiliser le skill `frontend-design` pour mettre a jour `app/page.tsx` :

Ajouter en TÊTE du dashboard, avant les widgets existants, un nouveau widget "Mon mois" :

```
Widget "Mon mois" :
- Titre : "Mon mois" (h2) avec icone calendrier + lien texte "Voir tout →" → /mon-mois
- <MonthProgressBar summary={summary} /> avec données du mois courant
- Si summary.overdue_count > 0 :
    - Section "En retard" avec fond rouge pâle
    - Liste des dépenses OVERDUE (max 3) : nom + montant + due_date
    - Lien "Voir tout les retards →" → /mon-mois?status=OVERDUE
- Données via : const summary = await getMonthSummary(currentMonth)
  et : const overdueItems = await getOverdueExpenses(currentMonth, 3)
```

Utiliser `Promise.all()` pour paralléliser les requêtes DB du dashboard.

**D2** — MCP Playwright test apres mise a jour dashboard :

```
mcp__playwright__browser_navigate → http://localhost:3000/
mcp__playwright__browser_snapshot → vérifier widget "Mon mois" en tête
mcp__playwright__browser_take_screenshot → screenshot dashboard complet
mcp__playwright__browser_console_messages (level: "error") → zéro erreur
```

**D3** — Utiliser le skill `frontend-design` pour mettre a jour `app/parametres/page.tsx` :

Ajouter dans le formulaire paramètres (dans sa propre section "Notifications") :
- Label "Email" + input type="email" lié a `settings.email` (nullable)
- Label "Téléphone" + input type="tel" lié a `settings.phone` (nullable)
- Placeholder email : "votre@email.com"
- Placeholder téléphone : "+1 514 555 0000"
- Note sous les champs : "Utilisés pour les notifications (Phase 3)"
- Sauvegarder via `updateSettings()` mis a jour

**D4** — MCP Playwright test /parametres :
```
mcp__playwright__browser_navigate → http://localhost:3000/parametres
mcp__playwright__browser_snapshot → vérifier champs email et phone présents
```

**D5** — Commit dashboard + parametres :
```bash
git add app/page.tsx app/parametres/page.tsx
git commit -m "feat(ui): dashboard widget mon-mois + parametres email/phone"
git push origin main
```

**D6** — Ecrire 8 nouveaux tests Playwright dans `tests/phase1-complement/` :

```typescript
// tests/phase1-complement/test-mon-mois-load.spec.ts
// - GET /mon-mois → HTTP 200
// - Titre contenant "Mon mois" ou nom du mois visible
// - Barre de progression présente (data-testid="month-progress" ou role="progressbar")
// - Aucune erreur console

// tests/phase1-complement/test-mon-mois-status.spec.ts
// - Ouvrir /mon-mois
// - Vérifier qu'au moins un groupe (OVERDUE, UPCOMING, DEFERRED ou PAID) est présent
// - Si items UPCOMING présents : cliquer "Payer" → item passe dans section PAID
// - Recharger la page → item toujours dans PAID (persisté)

// tests/phase1-complement/test-mon-mois-overdue.spec.ts
// - Ouvrir /mon-mois
// - Vérifier que la section "En retard" existe dans le DOM (peut être vide ou cachée si 0 items)
// - Vérifier l'absence d'erreur 500

// tests/phase1-complement/test-mon-mois-filter.spec.ts
// - Ouvrir /mon-mois
// - Vérifier que les chips de filtre sections sont présents
// - Cliquer un chip section → URL contient ?section=
// - Page se recharge sans erreur

// tests/phase1-complement/test-mon-mois-navigation.spec.ts
// - Ouvrir /mon-mois (mois courant = 2026-02)
// - Cliquer "<" → URL contient ?month=2026-01
// - Titre du mois mis a jour (contient "Janvier" ou "2026-01")
// - Cliquer ">" → URL revient a 2026-02

// tests/phase1-complement/test-dashboard-widget.spec.ts
// - Ouvrir /
// - Vérifier élément avec texte "Mon mois" visible
// - Vérifier barre de progression ou compteur de dépenses présent
// - Cliquer "Voir tout" → navigation vers /mon-mois

// tests/phase1-complement/test-parametres-email.spec.ts
// - Ouvrir /parametres
// - Vérifier input[type="email"] présent
// - Vérifier input[type="tel"] présent
// - Remplir email : "test@test.com" → sauvegarder
// - Recharger → valeur persistée

// tests/phase1-complement/test-auto-debit-paid.spec.ts
// - Ouvrir /mon-mois
// - Vérifier que les items avec badge "Auto" et due_date passée sont dans la section PAID
// - Ou vérifier l'absence d'erreur si aucun item auto_debit
```

Ajouter `data-testid` sur les éléments clés lors de la création de l'UI (Phase C/D) pour rendre les tests robustes :
- `data-testid="month-progress"` sur la barre de progression
- `data-testid="section-overdue"`, `data-testid="section-upcoming"`, `data-testid="section-paid"`
- `data-testid="mark-paid-btn"` sur les boutons "Payer"
- `data-testid="mark-deferred-btn"` sur les boutons "Reporter"
- `data-testid="badge-auto"` sur les badges "Auto"
- `data-testid="month-widget"` sur le widget dashboard

**D7** — Exécuter tous les tests :
```bash
# 1. Tests phase1 existants (régression)
npx playwright test tests/phase1/ --project=chromium --reporter=list

# 2. Nouveaux tests complement
npx playwright test tests/phase1-complement/ --project=chromium --reporter=list

# 3. Tous les tests (total attendu : 40/40)
npx playwright test --project=chromium --reporter=list
```

**D8** — Si des tests existants (phase1) échouent : analyser et corriger SANS modifier les tests eux-mêmes. L'objectif est zéro régression.

**D9** — Commit final :
```bash
git add tests/phase1-complement/
git commit -m "feat(tests): playwright tests phase1 complement — 8 nouveaux tests /mon-mois et dashboard"
git push origin main
```

**D10** — Vérification finale sur URL Vercel production :
```bash
# Attendre le deploy (verifier via vercel ls --scope amara-fofanas-projects)
npx playwright test --project=chromium --reporter=list
# → 40/40 passed
```

**D11** — Vérification DB finale :
```bash
node -e "
const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });
const sql = neon(process.env.POSTGRES_URL_NON_POOLING);
Promise.all([
  sql\`SELECT COUNT(*) as count FROM monthly_expenses\`,
  sql\`SELECT COUNT(*) as count FROM monthly_expenses WHERE month='2026-02'\`,
  sql\`SELECT email, phone FROM settings LIMIT 1\`,
  sql\`SELECT COUNT(*) as count FROM expenses\`
]).then(([me, me_current, s, e]) => {
  console.log('monthly_expenses total:', me[0].count);
  console.log('monthly_expenses 2026-02:', me_current[0].count);
  console.log('settings email:', s[0].email, '| phone:', s[0].phone);
  console.log('expenses total:', e[0].count);
}).catch(console.error);
"
```

**D12** — Git status final :
```bash
git status
# Attendu : "nothing to commit, working tree clean"
git log --oneline origin/main -5
```

**Success Criteria Phase D** :

- [ ] Widget "Mon mois" visible en haut du dashboard avec barre de progression réelle
- [ ] Alertes OVERDUE affichées sur dashboard si instances en retard
- [ ] Champs email + phone visibles et fonctionnels sur `/parametres`
- [ ] 32 tests existants toujours verts (zéro régression)
- [ ] 8 nouveaux tests verts dans `tests/phase1-complement/`
- [ ] Total `npx playwright test --project=chromium` → 40/40 passed sur URL Vercel prod
- [ ] `npm run build` → exit code 0
- [ ] `npm run lint` → exit code 0
- [ ] `git status` → "nothing to commit, working tree clean"
- [ ] Zéro erreur console browser sur `/`, `/mon-mois`, `/parametres`

---

## SELF-CORRECTION LOOP (Iteration Workflow)

### 1. Test (How to Verify)

Apres chaque modification, exécuter dans l'ordre :

```bash
# Etape 1 : Build TypeScript
npm run build

# Etape 2 : Lint
npm run lint

# Etape 3 : TypeScript strict
npx tsc --noEmit

# Etape 4 : Vérification DB (apres Phase A)
node -e "
const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });
const sql = neon(process.env.POSTGRES_URL_NON_POOLING);
Promise.all([
  sql\`SELECT COUNT(*) as count FROM monthly_expenses\`,
  sql\`SELECT COUNT(*) as count FROM monthly_expenses WHERE month='2026-02'\`,
  sql\`SELECT column_name FROM information_schema.columns WHERE table_name='settings' AND column_name IN ('email','phone')\`
]).then(([me, me_current, cols]) => {
  console.log('monthly_expenses:', me[0].count, '(table accessible)');
  console.log('monthly_expenses 2026-02:', me_current[0].count);
  console.log('settings new cols:', cols.map(c => c.column_name).join(', '), '(expected: email, phone)');
}).catch(console.error);
"

# Etape 5 : Tests Playwright phase1 (régression — apres Phase D)
npx playwright test tests/phase1/ --project=chromium --reporter=list

# Etape 6 : Tests Playwright complement (apres Phase D)
npx playwright test tests/phase1-complement/ --project=chromium --reporter=list

# Etape 7 : Tous les tests
npx playwright test --project=chromium --reporter=list
```

### 2. If Failures

**Build error (TypeScript)** :
1. Lire le message exact (fichier:ligne:colonne)
2. Vérifier si le type `Settings` mis a jour casse des usages existants dans `/parametres` ou `settings.ts`
3. Corriger le type ou le code qui l'utilise
4. Relancer `npm run build`

**Lint error** :
1. `npm run lint -- --fix` pour les auto-fixables
2. Corriger manuellement les erreurs restantes
3. Relancer `npm run lint`

**Migration DB error** :
1. Lire l'erreur PostgreSQL exacte dans le terminal
2. Si "column already exists" : normal, la migration est idempotente — pas d'action requise
3. Si "table already exists" : normal — `CREATE TABLE IF NOT EXISTS`
4. Si erreur de connexion : vérifier `POSTGRES_URL_NON_POOLING` dans `.env.local`
5. Si erreur de permissions : vérifier que la DB Neon est accessible

**Playwright test failure** :
1. Lire le screenshot dans `test-results/`
2. Identifier l'élément manquant ou l'assertion fausse
3. Vérifier si le `data-testid` est présent dans le composant
4. Si erreur 500 : vérifier les logs Next.js dans le terminal
5. Corriger le code ou le test → redéployer si nécessaire → relancer

**Régression tests phase1** :
1. Identifier quel test échoue exactement
2. Vérifier si une modification du dashboard (`app/page.tsx`) a cassé un sélecteur
3. Corriger `app/page.tsx` en preservant les `data-testid` existants
4. Ne PAS modifier les fichiers de test `tests/phase1/`

**Deploy Vercel échoue** :
1. `vercel ls --scope amara-fofanas-projects` → voir le statut
2. Ouvrir les logs du build dans le Vercel Dashboard
3. Identifier l'erreur de build → corriger le code → `git push origin main`
4. Attendre le redeploy automatique

**Page /mon-mois retourne 500 en production** :
1. Vérifier que Phase A (migration DB) a bien été executée ET vérifiée AVANT le deploy
2. Vérifier via MCP Playwright console_messages les erreurs exactes
3. Si `monthly_expenses` n'existe pas : exécuter la migration, puis redéployer
4. Si erreur de type TypeScript au runtime : revoir `lib/types.ts`

**Doublon dans monthly_expenses** :
1. Si la contrainte UNIQUE a été omise : `ALTER TABLE monthly_expenses ADD CONSTRAINT uq_expense_month UNIQUE (expense_id, month)`
2. Nettoyer les doublons si nécessaire : `DELETE FROM monthly_expenses WHERE id NOT IN (SELECT MIN(id) FROM monthly_expenses GROUP BY expense_id, month)`

### 3. If Tests Pass

- Vérifier visuellement chaque page modifiée dans le navigateur (375px mobile)
- Vérifier la console browser : zéro erreur rouge (warnings acceptables)
- Vérifier les données en base avec le script Node
- Vérifier que le code est committé : `git status` → "nothing to commit"
- Vérifier le deploy Vercel : `vercel ls --scope amara-fofanas-projects` → "Ready"
- Cocher chaque condition de sortie (section COMPLETION CRITERIA)

### 4. Determine Next Action

- Si **TOUTES les conditions de sortie sont remplies** → Output `<promise>PHASE1_COMPLEMENT_COMPLETE</promise>`
- Si **Phase A non vérifiée** → Revenir Phase A avant tout
- Si **conditions Phase B non remplies** → Vérifier types, server actions, npm run build
- Si **conditions Phase C non remplies** → Vérifier page /mon-mois, MCP Playwright test
- Si **conditions Phase D non remplies** → Vérifier tests, dashboard, parametres
- Si **bloqué apres 25 itérations** → suivre l'Escape Hatch

---

## COMPLETION CRITERIA (Exit Conditions)

Output `<promise>PHASE1_COMPLEMENT_COMPLETE</promise>` **UNIQUEMENT** quand **TOUTES** ces conditions sont vraies :

### A. Features Développées et Fonctionnelles

- [ ] Table `monthly_expenses` créée en base (SELECT COUNT(*) ne génère pas d'erreur)
- [ ] Instances du mois courant accessibles (`SELECT COUNT(*) FROM monthly_expenses WHERE month='2026-02'` >= 0)
- [ ] Page `/mon-mois` accessible HTTP 200
- [ ] Statuts UPCOMING/PAID/OVERDUE/DEFERRED fonctionnels (marquage manuel OK)
- [ ] Auto-marquage PAID pour les `is_auto_charged=true` dont `due_date <= CURRENT_DATE`
- [ ] Barre de progression sur dashboard visible avec données réelles
- [ ] Filtre par section fonctionnel sur /mon-mois (chips + filtrage URL)
- [ ] Navigation mois précédent/suivant fonctionnelle sur /mon-mois
- [ ] Champs email et phone présents et éditables dans /parametres
- [ ] `getSettings()` retourne email et phone (nullable)

### B. Déploiement Vercel

- [ ] `git push origin main` déclenche le deploy → `vercel ls --scope amara-fofanas-projects` retourne statut "Ready"
- [ ] `https://mon-budget-seven.vercel.app` retourne HTTP 200
- [ ] `https://mon-budget-seven.vercel.app/mon-mois` retourne HTTP 200

### C. Base de Données Neon Vérifiée

- [ ] `SELECT COUNT(*) FROM monthly_expenses` → 0 ou plus (table existe, pas d'erreur)
- [ ] `SELECT email, phone FROM settings LIMIT 1` → colonnes accessibles (pas d'erreur)
- [ ] Index `idx_me_month` présent dans `pg_indexes`
- [ ] Contrainte `uq_expense_month` présente dans `pg_constraint`

### D. Build et Qualité

- [ ] `npm run build` → exit code 0, zéro erreur TypeScript
- [ ] `npm run lint` → zéro erreur ESLint
- [ ] `npx tsc --noEmit` → exit code 0
- [ ] Zéro `console.error` dans la console browser sur /, /mon-mois, /parametres
- [ ] Zéro placeholder "TODO" ou "Coming soon" dans l'UI

### E. Tests Playwright

- [ ] `npx playwright test tests/phase1/ --project=chromium` → 32/32 passed (zéro régression)
- [ ] `npx playwright test tests/phase1-complement/ --project=chromium` → 8/8 passed
- [ ] `npx playwright test --project=chromium` → **40/40 passed**
- [ ] Tous les tests s'exécutent sur l'URL Vercel de production (pas localhost)
- [ ] Rapport Playwright généré : `playwright-report/index.html` existe

### F. Fonctionnalités PWA et Push (inchangées)

- [ ] `GET /manifest.json` retourne JSON valide (non cassé par le complement)
- [ ] Service Worker toujours visible dans DevTools sur l'URL Vercel

### G. Git

- [ ] `git status` retourne "nothing to commit, working tree clean"
- [ ] `git log --oneline origin/main -5` → commits Phase 1 Complement présents
- [ ] Toutes les features committées et pushées sur `main`

**Quand TOUTES les conditions ci-dessus sont TRUE :**

```
<promise>PHASE1_COMPLEMENT_COMPLETE</promise>
```

---

## ESCAPE HATCH (If Stuck After 25 Iterations)

Si apres 25 itérations les conditions ne sont pas toutes remplies :

### 1. Créer `phase1-complement-blockers.md`

```markdown
## BLOCKERS REPORT — Phase 1 Complement

**Date** : [date]
**Iterations complétées** : 25
**Phase atteinte** : [A / B / C / D]

### Conditions Non Remplies
- [ ] Condition X.Y : [description précise] → Erreur : [message exact]

### Tentatives
1. Itération N : [ce qui a été essayé]
2. Itération N+5 : [ce qui a été essayé]

### Causes Probables
- [Cause 1] : [explication]

### Approches Alternatives
1. [Approche A] : pros/cons
2. [Approche B] : pros/cons

### Actions Recommandées pour Amara
- [Action 1]
- [Action 2]

### Etat DB (à vérifier)
- monthly_expenses : [existe / n'existe pas]
- settings.email : [existe / n'existe pas]
- Instances 2026-02 : [count]

### Etat Code (à vérifier)
- lib/types.ts MonthlyExpense : [présent / absent]
- lib/actions/monthly-expenses.ts : [présent / absent]
- app/mon-mois/page.tsx : [présent / absent]
- app/page.tsx modifié : [oui / non]
```

### 2. Committer ce qui fonctionne

```bash
git add -A
git commit -m "wip: phase1-complement partial — see phase1-complement-blockers.md"
git push origin main
```

### 3. Output

```
<promise>BLOCKED</promise>
```

---

## TECHNICAL NOTES

### Ordre d'exécution obligatoire

```
Phase A (DB Migration) → Phase B (Types + Logic) → Phase C (UI /mon-mois) → Phase D (Dashboard + Tests)
```

**Ne jamais passer a Phase B sans que la Phase A soit entièrement vérifiée.** Ne jamais déployer du code qui importe depuis `monthly-expenses.ts` sans que la table `monthly_expenses` existe en base.

### DB Client

- **Migrations (scripts Node)** : `POSTGRES_URL_NON_POOLING` via `@neondatabase/serverless`
- **Server Actions Next.js** : `POSTGRES_URL` (pooled) via `@neondatabase/serverless`
- Pattern : `const sql = neon(process.env.POSTGRES_URL!);`

### Divergences de nommage a respecter

| En base (existant) | Dans le code | Dans monthly_expenses | Note |
|---|---|---|---|
| `expenses.auto_debit` | `expense.auto_debit` | `is_auto_charged` | Copier auto_debit → is_auto_charged lors de l'INSERT |
| `expenses.recurrence_frequency` | `expense.recurrence_frequency` | — | Utiliser recurrence_frequency dans toutes les requêtes |
| `cards.bank`, `cards.color` | `card.bank`, `card.color` | — | Ne pas supprimer, ne pas référencer dans monthly_expenses |

### Idempotence de la génération

La contrainte `UNIQUE (expense_id, month)` + `ON CONFLICT DO NOTHING` garantit qu'appeler `generateMonthlyExpenses()` plusieurs fois ne crée pas de doublons. C'est intentionnel.

### Mois courant

Le mois courant au moment de l'exécution est `2026-02`. Utiliser `new Date()` côté serveur Next.js pour calculer le mois courant dynamiquement (format : `YYYY-MM`).

### Server Components vs Client Components

- `app/mon-mois/page.tsx` : Server Component (`async function`) — récupère les données directement
- Les boutons "Payer" et "Reporter" nécessitent un Client Component pour l'interactivité : créer `components/MonthlyExpenseItem.tsx` avec `'use client'` et des Server Actions bindées
- `components/MonthProgressBar.tsx` : peut être un Server Component (pas d'état client)

### revalidatePath

Apres toute mutation sur `monthly_expenses`, revalider :
```typescript
revalidatePath('/mon-mois');
revalidatePath('/');  // dashboard widget
```

### Vercel Scope

Toujours ajouter `--scope amara-fofanas-projects` aux commandes `vercel` :
```bash
vercel ls --scope amara-fofanas-projects
vercel env ls --scope amara-fofanas-projects
```

### URL de production

```
https://mon-budget-seven.vercel.app
```

Les tests Playwright doivent s'exécuter sur cette URL (configurer `baseURL` dans `playwright.config.ts`).

### Ne pas modifier

- `.env.local` (déjà configuré)
- `.vercel/` (projet déjà lié)
- `tests/phase1/` (tests existants — ne pas toucher)
- `app/api/push/` (Web Push — hors scope)
- `public/sw.js`, `public/manifest.json` (PWA — hors scope)

### Convention de commits

```
feat(db): description          → Phase A
feat(logic): description       → Phase B
feat(ui): description          → Phase C
feat(tests): description       → Phase D
fix: description               → corrections
chore: description             → scripts, config
```

---

## FINAL SUCCESS CRITERIA

```
40/40 tests Playwright verts sur URL Vercel production
Table monthly_expenses créée et accessible
Instances mensuelles générées pour 2026-02
Page /mon-mois avec statuts OVERDUE/UPCOMING/PAID/DEFERRED
Barre de progression sur dashboard avec données réelles
Filtre sections fonctionnel sur /mon-mois
Champs email et phone dans /parametres
npm run build + npm run lint sans erreur
Code committé et pushé sur GitHub main
Zéro erreur console browser
```

**Output quand tout est complet :**

```
<promise>PHASE1_COMPLEMENT_COMPLETE</promise>
```
