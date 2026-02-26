---
active: true
iteration: 1
max_iterations: 25
completion_promise: "PHASE2_COMPLETE"
started_at: "2026-02-26T23:18:13Z"
---

# MISSION: Implement Mon Budget Phase 2

Implémenter les quatre fonctionnalités Phase 2 de l'app "Mon Budget" : (1) gestion des revenus avec widget "Reste à vivre", (2) vue détaillée par carte de paiement (`/cartes/[id]`), (3) support complet des dépenses planifiées (type PLANNED) avec formulaire enrichi et page `/projets`, (4) navigation historique entre les mois passés sur `/mon-mois` — le tout déployé sur Vercel, testé Playwright (44/44 verts), zéro erreur TypeScript et console.

---

## REFERENCES (Read First)

Lire ces fichiers DANS CET ORDRE avant de commencer :

1. **`plan-phase2-new.md`** — Plan détaillé Phase 2 avec toutes les étapes, tâches, success criteria, et notes techniques. LIRE EN ENTIER avant de commencer.
2. **`prd-budget-tracker-3.md`** — PRD complet v1.2 : modèle de données, fonctionnalités Phase 2 (section 7), contraintes techniques.
3. **`status-phase1.md`** — État exact de ce qui a été livré en Phase 1 + Complement : tables, pages, actions, divergences de schéma.
4. **`.env.local`** — Credentials Neon PostgreSQL (`POSTGRES_URL`, `POSTGRES_URL_NON_POOLING`) et variables Vercel.
5. **`.vercel/`** — Projet Vercel déjà lié (`amara-fofanas-projects/mon-budget`).

---

## Required Tools / Skills

- **Skill `frontend-design`** : Utiliser pour TOUT le code UI (composants, pages, widgets, modals, layout). Ne jamais écrire du JSX/TSX sans ce skill.
- **MCP Playwright** (`mcp__playwright__browser_navigate`, `mcp__playwright__browser_snapshot`, `mcp__playwright__browser_take_screenshot`, `mcp__playwright__browser_console_messages`) : tester visuellement chaque interface dans le browser immédiatement après chaque UI buildée.
- **`vercel` CLI** (déjà installé et connecté) : déployer, vérifier statut. Toujours utiliser `--scope amara-fofanas-projects`.
- **`npx playwright`** : lancer les tests E2E.
- **Node.js scripts** : vérifier la DB, exécuter les migrations.

---

## UI TESTING PROTOCOL (Obligatoire à chaque composant/page UI)

> **Règle** : Après chaque page ou composant UI construit avec `frontend-design`, IMMÉDIATEMENT tester dans le browser avec le MCP Playwright AVANT de passer à la suite.

**Protocole à suivre après chaque UI buildée** :

```
1. npm run dev (si pas déjà lancé)
2. mcp__playwright__browser_navigate → http://localhost:3000/[page]
3. mcp__playwright__browser_snapshot → vérifier l'arbre d'accessibilité (structure présente)
4. mcp__playwright__browser_take_screenshot → vérifier le rendu visuel
5. mcp__playwright__browser_resize 375px → même page en viewport mobile
6. mcp__playwright__browser_console_messages → vérifier zéro erreur console
7. Si problème détecté → corriger AVANT de passer à la page suivante
```

**Ce qu'on vérifie à chaque test visuel** :
- La page se charge sans erreur (pas de page blanche, pas de 500)
- Les éléments attendus sont présents (navigation, titres, boutons, listes, widgets)
- Le rendu mobile 375px est correct (pas de débordement horizontal)
- Zéro erreur rouge dans la console browser

---

## PHASES (Incremental Goals)

### Phase A: Migration DB — Table `incomes` (Est. ~30 min)

**Objectif** : Créer la table `incomes` en production Neon PostgreSQL.

**Actions** :

- Écrire `scripts/migrate-phase2.mjs` avec le contenu suivant :

```javascript
// scripts/migrate-phase2.mjs
import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';

config({ path: '.env.local' });

const sql = neon(process.env.POSTGRES_URL_NON_POOLING);

async function migrate() {
  console.log('Applying Phase 2 migration...');

  // Créer le type ENUM pour la fréquence (PostgreSQL)
  await sql`
    DO $$ BEGIN
      CREATE TYPE income_frequency AS ENUM ('MONTHLY', 'BIWEEKLY', 'YEARLY');
    EXCEPTION WHEN duplicate_object THEN null;
    END $$
  `;

  // Créer la table incomes
  await sql`
    CREATE TABLE IF NOT EXISTS incomes (
      id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name        VARCHAR(255) NOT NULL,
      amount      DECIMAL(10, 2) NOT NULL,
      frequency   income_frequency NOT NULL DEFAULT 'MONTHLY',
      is_active   BOOLEAN NOT NULL DEFAULT TRUE,
      created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `;

  console.log('Migration complete.');

  const result = await sql`SELECT COUNT(*) as count FROM incomes`;
  console.log('incomes count:', result[0].count, '(expected: 0 for new table)');
}

migrate().catch((e) => { console.error(e); process.exit(1); });
```

- Exécuter : `node scripts/migrate-phase2.mjs`
- Vérifier la table avec le script DB (voir SELF-CORRECTION LOOP section)
- Ajouter dans `lib/types.ts` les types `IncomeFrequency` et `Income` :

```typescript
export type IncomeFrequency = 'MONTHLY' | 'BIWEEKLY' | 'YEARLY';

export type Income = {
  id: string;
  name: string;
  amount: number;
  frequency: IncomeFrequency;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};
```

- `npm run build` pour valider que le code compile
- Commit : `git add -A && git commit -m "feat: add incomes table migration + Income type" && git push origin main`

**Success Criteria** :

- [ ] `node scripts/migrate-phase2.mjs` → exit code 0, message "Migration complete"
- [ ] Script DB : `SELECT table_name FROM information_schema.tables WHERE table_name='incomes'` → 1 ligne
- [ ] Script DB : `SELECT COUNT(*) FROM incomes` → 0 (table vide)
- [ ] `npm run build` → exit code 0 après ajout des types
- [ ] Commit pushé sur main

---

### Phase B: CRUD Revenus + Widget "Reste à vivre" (Est. ~2h)

**Objectif** : Page `/revenus` fonctionnelle, widget "Reste à vivre" visible sur le dashboard.

**Actions** :

- Créer `lib/actions/incomes.ts` avec `'use server'` et les Server Actions suivantes :
  - `getIncomes()` : `SELECT * FROM incomes WHERE is_active = true ORDER BY created_at DESC`
  - `getMonthlyIncomeTotal()` : sélectionner tous les revenus actifs, normaliser chaque montant selon la fréquence (MONTHLY×1 / BIWEEKLY×26/12 / YEARLY×1/12), retourner la somme totale mensuelle normalisée
  - `createIncome(data: { name: string, amount: number, frequency: IncomeFrequency })` : INSERT INTO incomes, puis `revalidatePath('/')` et `revalidatePath('/revenus')`
  - `updateIncome(id: string, data: { name: string, amount: number, frequency: IncomeFrequency })` : UPDATE incomes SET ..., puis revalidate
  - `deleteIncome(id: string)` : DELETE FROM incomes WHERE id = $1 (ou UPDATE SET is_active = false), puis revalidate

- Utiliser le skill `frontend-design` pour créer `components/IncomeModal.tsx` :
  - Champs : name (texte, requis), amount (nombre, requis, ≥ 0), frequency (select : Mensuel/Bimensuel/Annuel)
  - Afficher en temps réel le montant mensuel normalisé calculé sous le champ amount
  - Mode création + mode édition (recevant un `Income` optionnel en prop)
  - Boutons : Enregistrer / Annuler

  → **MCP Playwright** : Ouvrir `/revenus`, cliquer "+", snapshot → vérifier que le modal s'ouvre avec les 3 champs

- Utiliser le skill `frontend-design` pour créer `components/RevenusClient.tsx` :
  - Liste des revenus actifs : nom, montant brut, fréquence, montant mensuel normalisé
  - Ligne de total en bas : "Total mensuel net : X $" (gras, taille plus grande)
  - Bouton "+" (ou FAB) pour ouvrir `IncomeModal` en mode création
  - Bouton Modifier et Supprimer par ligne
  - État vide informatif si aucun revenu ("Aucun revenu enregistré — cliquez + pour commencer")

- Créer `app/revenus/page.tsx` (Server Component) :
  - Fetch `getIncomes()` et passer aux props de `RevenusClient`
  - Titre de page : "Mes revenus"

  → **MCP Playwright** (obligatoire) :
  ```
  1. navigate → http://localhost:3000/revenus
  2. snapshot → vérifier titre, liste (ou état vide), bouton +
  3. screenshot → rendu visuel
  4. resize 375px → mobile
  5. console_messages → zéro erreur
  ```

- Utiliser le skill `frontend-design` pour créer `components/ResteAVivreWidget.tsx` :
  - Appeler `getMonthlyIncomeTotal()` et la fonction/action existante pour le total des dépenses mensuelles
  - Calculer `reste = total_revenus - total_depenses`
  - Afficher : "Revenus ce mois : X $", "Dépenses ce mois : Y $", "Reste à vivre : Z $"
  - Couleur : vert si `reste >= 0`, rouge si `reste < 0`
  - Si aucun revenu enregistré → afficher "Ajoutez vos revenus → /revenus" avec lien

- Intégrer `ResteAVivreWidget` dans `app/page.tsx` (dashboard) :
  - Ajouter sous l'en-tête existant (premier ou deuxième widget)

  → **MCP Playwright** (obligatoire) :
  ```
  1. navigate → http://localhost:3000/
  2. snapshot → vérifier que le widget "Reste à vivre" est présent
  3. screenshot → rendu visuel
  4. resize 375px → mobile
  5. console_messages → zéro erreur
  ```

- Ajouter un lien vers `/revenus` depuis `components/ParametresClient.tsx` :
  - Ajouter une section "Revenus" avec un lien "Gérer mes revenus →"

- Commit : `git add -A && git commit -m "feat: revenus CRUD + widget reste-a-vivre" && git push origin main`

**Success Criteria** :

- [ ] `SELECT COUNT(*) FROM incomes` = 0 initialement
- [ ] Créer "Salaire" 5000$ MONTHLY → visible dans la liste sur `/revenus`
- [ ] Modifier le revenu → changement persisté après rechargement de la page
- [ ] Supprimer le revenu → disparu de la liste
- [ ] Widget "Reste à vivre" visible sur dashboard
- [ ] Revenu 5000$/mois + dépenses 3500$/mois → widget affiche +1 500,00 $ en vert
- [ ] Revenu 2000$/mois + dépenses 3500$/mois → widget affiche -1 500,00 $ en rouge
- [ ] `npm run build` → exit code 0
- [ ] Zéro erreur console browser sur `/revenus` et `/`

---

### Phase C: Vue par carte + Dépenses PLANNED + Widgets dashboard (Est. ~2.5h)

**Objectif** : `/cartes/[id]` fonctionnel, formulaire PLANNED complet, `/projets` avec progression, widgets dashboard.

#### C.1 — Champs PLANNED dans ExpenseModal

- Modifier `components/ExpenseModal.tsx` :
  - Ajouter les champs conditionnels suivants (visibles uniquement quand `type === 'PLANNED'`) :
    - `target_amount` : champ numérique "Montant objectif ($)"
    - `target_date` : champ date "Date cible"
    - `saved_amount` : champ numérique "Montant épargné à ce jour ($)"
    - Affichage calculé en temps réel : "Épargne mensuelle suggérée : X $/mois" (`(target_amount - saved_amount) / mois_restants`)
    - Si `target_date` dans le passé ou champs manquants → afficher "N/A"
  - Vérifier que quand `type !== 'PLANNED'`, ces champs sont masqués
  - Vérifier que les champs RECURRING et ONE_TIME existants ne régressent pas

  → **MCP Playwright** :
  ```
  1. navigate → http://localhost:3000/depenses → cliquer "+"
  2. Sélectionner type "Planifiée"
  3. snapshot → vérifier champs target_amount, target_date, saved_amount visibles
  4. Sélectionner type "Récurrente"
  5. snapshot → vérifier que ces champs disparaissent
  6. console_messages → zéro erreur
  ```

#### C.2 — Server Actions PLANNED

- Ajouter dans `lib/actions/expenses.ts` :
  - `getPlannedExpenses()` : `SELECT * FROM expenses WHERE type = 'PLANNED' AND is_active = true ORDER BY created_at DESC`
  - `updateSavedAmount(id: string, saved_amount: number)` : `UPDATE expenses SET saved_amount = $1, updated_at = NOW() WHERE id = $2` puis `revalidatePath('/projets')` et `revalidatePath('/')`

#### C.3 — Page /projets

- Utiliser le skill `frontend-design` pour créer `components/ProjetsClient.tsx` :
  - Liste des dépenses PLANNED avec pour chaque projet :
    - Nom du projet
    - Ligne "8 000 $ / 25 000 $" (saved_amount / target_amount)
    - Barre de progression (percentage = saved_amount / target_amount × 100)
    - Date cible formatée
    - "Épargne suggérée : X $/mois" calculée
    - Bouton "Mettre à jour l'épargne" → modal simple (input numérique pour saved_amount) → appelle `updateSavedAmount`
  - État vide informatif : "Aucun projet planifié — créez une dépense de type Planifiée"
  - Lien vers `/depenses` pour créer un projet

- Créer `app/projets/page.tsx` (Server Component) :
  - Fetch `getPlannedExpenses()`
  - Render `ProjetsClient`
  - Titre : "Mes projets planifiés"

  → **MCP Playwright** (obligatoire) :
  ```
  1. navigate → http://localhost:3000/projets
  2. snapshot → vérifier structure (liste ou état vide, lien /depenses)
  3. screenshot → rendu visuel
  4. resize 375px → mobile
  5. console_messages → zéro erreur
  ```

#### C.4 — Widget projets sur dashboard

- Utiliser le skill `frontend-design` pour créer `components/ProjetsWidget.tsx` :
  - Afficher les 3 premiers projets PLANNED actifs (triés par date cible croissante)
  - Pour chacun : nom + barre de progression + montant mensuel suggéré
  - Lien "Voir tous les projets →" vers `/projets`
  - Si aucun projet → "Aucun projet planifié" avec lien pour en créer

- Intégrer `ProjetsWidget` dans `app/page.tsx` (dashboard)

  → **MCP Playwright** (obligatoire) :
  ```
  1. navigate → http://localhost:3000/
  2. snapshot → vérifier widget projets présent
  3. screenshot → rendu visuel
  4. resize 375px → mobile
  5. console_messages → zéro erreur
  ```

#### C.5 — Page /cartes/[id]

- Ajouter dans `lib/actions/expenses.ts` (ou `lib/actions/cards.ts`) :
  - `getExpensesByCard(cardId: string, month: string)` : sélectionner les `monthly_expenses` où `card_id = cardId` ET `month = month` ET `auto_debit = true` (utiliser le nom de colonne exact vérifié dans le schéma)
  - `getCardMonthlyTotal(cardId: string, month: string)` : `SUM(amount)` des monthly_expenses pour cette carte et ce mois
  - `getCardById(cardId: string)` : sélectionner une carte par son id (depuis `lib/actions/cards.ts`)

- Utiliser le skill `frontend-design` pour créer `components/CarteDetailClient.tsx` :
  - En-tête : nom de la carte + 4 derniers chiffres (ex: "Visa Desjardins ***4532")
  - Total mensuel affiché en grand : "Total chargé ce mois : X $"
  - Liste des dépenses auto-chargées du mois courant : nom, montant, date, statut (chip coloré)
  - État vide informatif : "Aucune dépense auto-chargée sur cette carte ce mois-ci"
  - Bouton/lien retour "← Mes cartes" vers `/cartes`

- Créer `app/cartes/[id]/page.tsx` (Server Component) :
  - Lire le param `id` depuis les props
  - Fetch `getCardById(id)` → si null → appeler `notFound()` de Next.js
  - Calculer le mois courant : `const month = new Date().toISOString().slice(0, 7)`
  - Fetch `getExpensesByCard(id, month)` et `getCardMonthlyTotal(id, month)`
  - Render `CarteDetailClient` avec ces données

- Modifier `components/CartesClient.tsx` :
  - Rendre chaque carte cliquable : ajouter un lien `<Link href={\`/cartes/${card.id}\`}>` autour de la carte (ou un bouton "Voir les dépenses →" par carte)
  - Conserver les boutons "Modifier" et "Supprimer" existants

  → **MCP Playwright** (obligatoire) :
  ```
  1. navigate → http://localhost:3000/cartes
  2. snapshot → vérifier que les cartes sont cliquables (link ou bouton présent)
  3. Cliquer sur une carte → vérifier navigation vers /cartes/[id]
  4. snapshot → vérifier titre carte, total mensuel, liste dépenses
  5. screenshot → rendu visuel
  6. resize 375px → mobile
  7. console_messages → zéro erreur
  8. navigate → /cartes/uuid-inexistant → vérifier 404 propre
  ```

- Commit : `git add -A && git commit -m "feat: planned expenses form + /projets + /cartes/[id] + widgets dashboard" && git push origin main`

**Success Criteria Phase C** :

- [ ] Formulaire dépense : type PLANNED → affiche target_amount, target_date, saved_amount, monthly_suggested
- [ ] Formulaire dépense : type RECURRING → masque ces 4 éléments
- [ ] Créer une dépense PLANNED "Piscine" (25000$, date future, 0$ épargné) → apparaît dans `/projets`
- [ ] Barre de progression 0% visible pour ce projet
- [ ] Montant mensuel suggéré calculé et affiché
- [ ] Cliquer "Mettre à jour l'épargne" → modal s'ouvre → saisir 5000$ → barre passe à 20%
- [ ] Widget projets visible sur dashboard
- [ ] `/cartes` : les cartes sont cliquables → navigation vers `/cartes/[id]`
- [ ] `/cartes/[id]` : affiche nom carte, total mensuel, liste dépenses auto-chargées
- [ ] URL `/cartes/uuid-bidon` → 404 géré proprement (pas de crash)
- [ ] `npm run build` → exit code 0
- [ ] `npm run lint` → exit code 0
- [ ] Zéro erreur console browser sur toutes les pages Phase C

---

### Phase D: Historique + Tests Playwright (12 nouveaux tests) (Est. ~2h)

**Objectif** : Navigation historique mois passés activée, 44/44 tests Playwright verts total.

#### D.1 — Navigation historique sur /mon-mois

- Vérifier le contenu de `lib/actions/monthly-expenses.ts` :
  - Si `getMonthlyExpenses(month: string)` accepte déjà un paramètre `month` → RAS
  - Si non → modifier pour accepter `month: string` en paramètre (utiliser ce paramètre dans la query WHERE)

- Modifier `app/mon-mois/page.tsx` :
  - Lire le paramètre de recherche `searchParams.month` (type `string | undefined`)
  - Si absent → utiliser le mois courant : `new Date().toISOString().slice(0, 7)`
  - Passer le mois à `getMonthlyExpenses(month)`
  - Passer `isReadOnly = selectedMonth < currentMonth` au composant client

- Utiliser le skill `frontend-design` pour enrichir le composant client de `/mon-mois` (ou créer un sous-composant `MonthNavigator`) :
  - Bouton "< Mois précédent" : navigation vers `?month=[mois-1]`
  - Affichage du mois sélectionné en français : "Janvier 2026", "Février 2026", etc.
  - Bouton "Mois suivant >" : disabled si mois courant, navigation vers `?month=[mois+1]` sinon
  - Si `isReadOnly = true` :
    - Masquer ou désactiver les boutons "Marquer payé"
    - Afficher un badge "Lecture seule" discret
  - Si aucune donnée pour le mois sélectionné → afficher "Aucune dépense enregistrée pour ce mois"

  → **MCP Playwright** (obligatoire) :
  ```
  1. navigate → http://localhost:3000/mon-mois
  2. snapshot → vérifier navigateur mois (boutons < > et mois affiché)
  3. Cliquer "< Mois précédent"
  4. snapshot → vérifier que le mois change (affichage + URL ?month=)
  5. Vérifier mode lecture seule (boutons "Marquer payé" absents/disabled)
  6. Cliquer "> Mois suivant"
  7. snapshot → retour au mois courant, boutons réactifs
  8. screenshot → rendu visuel
  9. resize 375px → mobile
  10. console_messages → zéro erreur
  ```

- Commit intermédiaire : `git add -A && git commit -m "feat: historique navigation mois passés /mon-mois" && git push origin main`

#### D.2 — Tests Playwright Phase 2

Créer le répertoire `tests/phase2/` et les 6 fichiers spec suivants :

**`tests/phase2/test-revenus.spec.ts`** (3 tests) :
```typescript
// Test 1: Page /revenus accessible et structure correcte
// Test 2: Créer un revenu "Salaire" 5000$ MONTHLY → visible dans la liste
// Test 3: Supprimer le revenu → disparu de la liste
```

**`tests/phase2/test-reste-a-vivre.spec.ts`** (2 tests) :
```typescript
// Test 1: Widget "Reste à vivre" présent sur le dashboard (contient le texte "Reste à vivre")
// Test 2: Widget affiche une valeur numérique (positif ou négatif selon données)
```

**`tests/phase2/test-carte-detail.spec.ts`** (2 tests) :
```typescript
// Test 1: /cartes affiche des liens vers /cartes/[id] (ou bouton cliquable)
// Test 2: Cliquer sur une carte navigue vers /cartes/[id] qui charge sans erreur HTTP 200
// Note: si aucune carte, créer une carte d'abord dans le beforeEach
```

**`tests/phase2/test-planned.spec.ts`** (2 tests) :
```typescript
// Test 1: Ouvrir formulaire dépense, sélectionner type "Planifiée" →
//         champs target_amount, target_date, saved_amount visibles
// Test 2: Créer une dépense PLANNED "Piscine" 25000$ → apparaît dans /projets
```

**`tests/phase2/test-projets.spec.ts`** (2 tests) :
```typescript
// Test 1: Page /projets accessible et affiche titre "projets" ou liste (ou état vide)
// Test 2: Si projet PLANNED existe → barre de progression visible sur /projets
```

**`tests/phase2/test-historique.spec.ts`** (1 test) :
```typescript
// Test 1: /mon-mois affiche un navigateur de mois avec boutons < et >
//         Cliquer "< Mois précédent" → URL contient ?month= avec le mois précédent
```

- Lancer les tests Phase 1 pour valider la non-régression :

```bash
npx playwright test tests/phase1/ --project=chromium --reporter=list
```

- Lancer les nouveaux tests Phase 2 :

```bash
npx playwright test tests/phase2/ --project=chromium --reporter=list
```

- Si tous les tests passent, lancer la suite complète :

```bash
npx playwright test --project=chromium --reporter=list
```

- Commit final : `git add -A && git commit -m "feat: phase2 playwright tests (12 nouveaux) — 44/44 verts" && git push origin main`

**Success Criteria Phase D** :

- [ ] `/mon-mois` : navigateur mois avec boutons "< Mois précédent" et "Mois suivant >" visible
- [ ] Clic "< Mois précédent" → URL change, mois affiché change
- [ ] Mois passé → mode lecture seule activé (boutons "Marquer payé" absents/disabled)
- [ ] URL `/mon-mois?month=2026-01` fonctionne directement (accessible via bookmark)
- [ ] Mois sans données → état vide informatif affiché (pas de crash)
- [ ] `npx playwright test tests/phase1/ --project=chromium` → **32/32 passed** (non-régression)
- [ ] `npx playwright test tests/phase2/ --project=chromium` → **12/12 passed**
- [ ] `npx playwright test --project=chromium` → **44/44 total passed**
- [ ] `npm run build` → exit code 0
- [ ] `npm run lint` → exit code 0
- [ ] `git status` → "nothing to commit, working tree clean"
- [ ] Tout pushé sur main

---

## SELF-CORRECTION LOOP (Iteration Workflow)

### 1. Comment tester (dans l'ordre)

Après chaque modification significative, exécuter dans l'ordre :

```bash
# Étape 1 : Build TypeScript
npm run build

# Étape 2 : Lint
npm run lint

# Étape 3 : Vérification DB (après Phase A)
node -e "
const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });
const sql = neon(process.env.POSTGRES_URL_NON_POOLING);
Promise.all([
  sql\`SELECT COUNT(*) as count FROM sections\`,
  sql\`SELECT COUNT(*) as count FROM cards\`,
  sql\`SELECT COUNT(*) as count FROM expenses\`,
  sql\`SELECT COUNT(*) as count FROM incomes\`,
  sql\`SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name='incomes'\`
]).then(([s, c, e, i, t]) => {
  console.log('sections:', s[0].count, '(expected: >=6)');
  console.log('cards:', c[0].count);
  console.log('expenses:', e[0].count);
  console.log('incomes:', i[0].count);
  console.log('incomes table exists:', t.length > 0 ? 'YES' : 'NO');
}).catch(console.error);
"

# Étape 4 (après Phase D) : Tests Playwright sur Vercel production
npx playwright test tests/phase1/ --project=chromium --reporter=list
npx playwright test tests/phase2/ --project=chromium --reporter=list

# Ou tous ensemble
npx playwright test --project=chromium --reporter=list
```

### 2. En cas d'échec

**Erreur build TypeScript** :
- Lire le message exact (fichier:ligne:colonne)
- Corriger le type/import manquant
- Relancer `npm run build`
- Si erreur dans `lib/types.ts` → vérifier les exports et les imports dans les fichiers qui utilisent ces types

**Erreur lint** :
- `npm run lint -- --fix` pour les corrections automatiques
- Corriger manuellement les erreurs restantes
- Relancer `npm run lint`

**Test Playwright en échec** :
- Lire le message d'erreur exact dans le terminal
- Vérifier le screenshot dans `test-results/` si disponible
- Identifier si c'est un problème d'UI (élément absent), de navigation (mauvaise URL), ou de données (DB vide)
- Corriger le code correspondant
- Si le test échoue à cause de données manquantes → ajouter un `beforeEach` ou `beforeAll` dans le spec pour créer les données nécessaires
- Redéployer si nécessaire (`git push origin main`) et attendre le deploy Vercel
- Relancer le test

**Erreur DB / migration** :
- Vérifier que `POSTGRES_URL_NON_POOLING` est dans `.env.local`
- Tester la connexion : `node -e "const {neon}=require('@neondatabase/serverless');require('dotenv').config({path:'.env.local'});const sql=neon(process.env.POSTGRES_URL_NON_POOLING);sql\`SELECT 1 as ok\`.then(r=>console.log('DB connected:', r[0].ok)).catch(console.error);"`
- Vérifier les logs dans le Neon Dashboard si connexion échoue
- Relancer `node scripts/migrate-phase2.mjs`

**Erreur 500 / page blanche** :
- Vérifier les logs du serveur dans le terminal `npm run dev`
- Identifier l'erreur (Server Action échouée, variable d'environnement manquante, SQL invalide)
- Corriger et recharger la page

**Erreur deploy Vercel** :
- `vercel logs --scope amara-fofanas-projects` pour voir les logs de build
- Identifier l'erreur dans les logs
- Corriger le code, `git push origin main`, attendre le redeploy

**Régression tests Phase 1** :
- Lancer uniquement les tests Phase 1 : `npx playwright test tests/phase1/ --project=chromium --reporter=list`
- Identifier quel test échoue et pourquoi (screenshot dans test-results/)
- Vérifier si une modification Phase 2 a cassé quelque chose (ExpenseModal, dashboard, navigation)
- Corriger la régression avant de continuer Phase 2

### 3. Si les tests passent

- Vérifier visuellement chaque page Phase 2 dans le navigateur (MCP Playwright) à 375px mobile
- Vérifier la console browser : zéro erreur rouge
- Vérifier les données en base avec le script DB Node
- Vérifier que le code est committé : `git status` doit retourner "nothing to commit"
- Vérifier le deploy Vercel : `vercel ls --scope amara-fofanas-projects` → statut "Ready"
- Cocher chaque condition de sortie (section COMPLETION CRITERIA ci-dessous)

### 4. Déterminer la prochaine action

- Si **TOUTES les conditions de sortie sont remplies** → Output `<promise>PHASE2_COMPLETE</promise>`
- Si **certaines conditions non remplies** → identifier quelle condition échoue → corriger → re-tester
- Si **bloqué après 25 itérations** → suivre l'Escape Hatch

---

## COMPLETION CRITERIA (Exit Conditions)

Output `<promise>PHASE2_COMPLETE</promise>` **UNIQUEMENT** quand **TOUTES** ces conditions sont vraies :

### A. Base de données

- [ ] Table `incomes` créée : `SELECT COUNT(*) FROM incomes` retourne une valeur (≥ 0)
- [ ] Données créées via l'UI persistées correctement : créer un revenu → COUNT augmente → supprimer → COUNT diminue

### B. Revenus et "Reste à vivre"

- [ ] Page `/revenus` accessible (HTTP 200), affiche la liste des revenus et le total mensuel net
- [ ] CRUD complet : créer, modifier, supprimer un revenu via l'UI — changements persistés en base
- [ ] Widget "Reste à vivre" visible sur le dashboard (`/`)
- [ ] Widget calcule correctement : total_revenus_mensuel - total_dépenses_mensuel
- [ ] Couleur verte si reste ≥ 0, rouge si reste < 0
- [ ] Lien vers `/revenus` accessible depuis `/parametres`

### C. Vue par carte

- [ ] Page `/cartes` : chaque carte est cliquable et mène vers `/cartes/[id]`
- [ ] Page `/cartes/[id]` accessible (HTTP 200) : affiche le nom de la carte + total mensuel
- [ ] Page `/cartes/[id]` affiche les dépenses auto-chargées pour la carte du mois courant
- [ ] URL `/cartes/[uuid-inexistant]` → retourne 404 (pas de crash 500)

### D. Dépenses planifiées (PLANNED)

- [ ] `ExpenseModal` : type PLANNED → champs target_amount, target_date, saved_amount visibles
- [ ] `ExpenseModal` : type RECURRING → ces champs sont masqués
- [ ] Montant mensuel suggéré calculé automatiquement dans le modal
- [ ] Page `/projets` accessible (HTTP 200), affiche les dépenses PLANNED avec barre de progression
- [ ] Bouton "Mettre à jour l'épargne" sur `/projets` → modal s'ouvre → mise à jour persistée
- [ ] Barre de progression se met à jour après modification de `saved_amount`
- [ ] Widget projets visible sur le dashboard (`/`)

### E. Historique

- [ ] Page `/mon-mois` : navigateur mois présent avec boutons "< Mois précédent" et "Mois suivant >"
- [ ] Clic "< Mois précédent" → mois affiché change, URL contient `?month=YYYY-MM`
- [ ] URL `/mon-mois?month=2026-01` accessible directement
- [ ] Mois passé → mode lecture seule (boutons "Marquer payé" absents ou disabled)
- [ ] Mois sans données → état vide informatif (pas de crash)
- [ ] Bouton "Mois suivant" disabled si mois courant

### F. Build & Qualité

- [ ] `npm run build` → exit code 0, zéro erreur TypeScript
- [ ] `npm run lint` → zéro erreur ESLint
- [ ] Zéro `console.error` dans la console browser sur TOUTES les pages (Phase 1 + Phase 2)
- [ ] Zéro placeholder "TODO" ou "Coming soon" dans l'UI

### G. Tests Playwright

- [ ] `npx playwright test tests/phase1/ --project=chromium` → **32/32 passed** (non-régression)
- [ ] `npx playwright test tests/phase2/ --project=chromium` → **12/12 passed** (nouveaux)
- [ ] `npx playwright test --project=chromium` → **44/44 total passed**
- [ ] Rapport Playwright généré : `playwright-report/index.html` existe

### H. Déploiement & Git

- [ ] `git push origin main` déclenche le deploy automatique Vercel
- [ ] `vercel ls --scope amara-fofanas-projects` → statut "Ready"
- [ ] `https://mon-budget-seven.vercel.app` + toutes les nouvelles pages → HTTP 200
- [ ] `git status` → "nothing to commit, working tree clean"
- [ ] `git log --oneline origin/main` → dernier commit contient code Phase 2

**Quand TOUTES les conditions ci-dessus sont TRUE :**

```
<promise>PHASE2_COMPLETE</promise>
```

---

## ESCAPE HATCH (Si bloqué après 25 itérations)

Si après 25 itérations toutes les conditions ne sont pas remplies :

### 1. Créer `phase2-blockers.md`

```markdown
## BLOCKERS REPORT — Phase 2

### Conditions Non Remplies
- [x] Condition [lettre.numéro] : [description précise] → Erreur : [message exact]

### Tentatives
1. Itération N : [ce qui a été essayé]
2. Itération N+5 : [résultat]

### Causes Probables
- [Cause 1] : [explication]
- [Cause 2] : [explication]

### Features Complètes
- [x] Phase A : Migration DB — OK
- [ ] Phase B : Revenus — BLOQUÉ à [étape précise]
- [ ] Phase C : PLANNED + Vue carte — non commencé
- [ ] Phase D : Historique + Tests — non commencé

### Approches Alternatives
1. [Approche A] : pros/cons
2. [Approche B] : pros/cons

### Actions Recommandées pour Amara
- [Action 1]
- [Action 2]
```

### 2. Committer ce qui fonctionne

```bash
git add -A && git commit -m "wip: phase2 partial — see phase2-blockers.md"
git push origin main
```

### 3. Output

```
<promise>BLOCKED</promise>
```

---

## TECHNICAL NOTES

### Normalisation des revenus (calcul exact)

```typescript
// lib/utils.ts — ajouter cette fonction
export function calcMonthlyIncome(amount: number, frequency: IncomeFrequency): number {
  switch (frequency) {
    case 'MONTHLY':   return amount;
    case 'BIWEEKLY':  return (amount * 26) / 12;  // 26 paies par an / 12 mois
    case 'YEARLY':    return amount / 12;
    default:          return amount;
  }
}
```

### Calcul monthly_suggested pour PLANNED

```typescript
// lib/utils.ts — ajouter cette fonction
export function calcMonthlySuggested(
  targetAmount: number,
  savedAmount: number,
  targetDate: string  // format "YYYY-MM-DD"
): number {
  const now = new Date();
  const target = new Date(targetDate);
  const monthsRemaining =
    (target.getFullYear() - now.getFullYear()) * 12 +
    (target.getMonth() - now.getMonth());
  if (monthsRemaining <= 0) return 0;
  const remaining = targetAmount - savedAmount;
  if (remaining <= 0) return 0;
  return remaining / monthsRemaining;
}
```

### Format mois pour historique

```typescript
// Mois courant
const currentMonth = new Date().toISOString().slice(0, 7); // "2026-02"

// Mois précédent
function prevMonth(month: string): string {
  const [year, m] = month.split('-').map(Number);
  const date = new Date(year, m - 2, 1); // m-2 car JS Date months 0-indexed
  return date.toISOString().slice(0, 7);
}

// Mois suivant
function nextMonth(month: string): string {
  const [year, m] = month.split('-').map(Number);
  const date = new Date(year, m, 1);
  return date.toISOString().slice(0, 7);
}

// Affichage français
function formatMonthFr(month: string): string {
  const [year, m] = month.split('-').map(Number);
  const date = new Date(year, m - 1, 1);
  return date.toLocaleDateString('fr-CA', { month: 'long', year: 'numeric' });
  // → "février 2026"
}
```

### Colonne auto_debit vs is_auto_charged

Le schéma existant utilise `auto_debit` (pas `is_auto_charged`). Vérifier le nom exact de la colonne dans `monthly_expenses` en exécutant :

```bash
node -e "
const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });
const sql = neon(process.env.POSTGRES_URL_NON_POOLING);
sql\`SELECT column_name FROM information_schema.columns WHERE table_name = 'monthly_expenses' ORDER BY ordinal_position\`
  .then(cols => console.log('monthly_expenses columns:', cols.map(c => c.column_name)))
  .catch(console.error);
"
```

Utiliser le nom exact retourné dans toutes les queries impliquant `monthly_expenses`.

### Skill frontend-design — rappel obligatoire

**NE JAMAIS écrire du JSX/TSX sans utiliser le skill `frontend-design`.** Cela inclut :
- Tous les nouveaux composants React
- Toutes les nouvelles pages Next.js
- Tous les widgets dashboard
- Toutes les modifications de composants existants (ExpenseModal, CartesClient, etc.)

### Server Actions — conventions

- Toujours ajouter `'use server'` en première ligne du fichier
- Toujours appeler `revalidatePath(path)` après toute mutation en base
- Revalider TOUTES les pages concernées : ex après `updateSavedAmount` → `revalidatePath('/projets')` ET `revalidatePath('/')`

### DB client — quel URL utiliser

- **Requêtes standard (dans Server Actions)** : `POSTGRES_URL` (connection pooling via `@neondatabase/serverless`)
- **Scripts Node.js / migrations** : `POSTGRES_URL_NON_POOLING` (connexion directe)

### Vercel scope — toujours spécifier

```bash
vercel ls --scope amara-fofanas-projects
vercel logs --scope amara-fofanas-projects
vercel env ls --scope amara-fofanas-projects
```

### Convention de nommage

- Fichiers : kebab-case (`lib/actions/incomes.ts`, `components/income-modal.tsx` → Non : PascalCase pour composants)
- Composants React : PascalCase (`IncomeModal.tsx`, `ResteAVivreWidget.tsx`)
- Server Actions : camelCase (`createIncome`, `getMonthlyIncomeTotal`)
- Types TypeScript : PascalCase (`Income`, `IncomeFrequency`)

### Ne pas modifier

- `.env.local` — déjà configuré avec toutes les variables
- `.vercel/` — projet déjà lié
- `public/manifest.json` et `public/sw.js` — PWA déjà fonctionnelle
- `playwright.config.ts` — baseURL déjà configuré sur Vercel production
- `tests/phase1/` — ne pas modifier les tests existants (non-régression)

### Ordre d'itération recommandé

Si une feature est bloquante → passer à la suivante et revenir. L'ordre de priorité si temps limité :
1. Phase A (DB) — fondation de tout
2. Phase B (Revenus) — feature la plus visible et indépendante
3. Phase C.1 (champs PLANNED dans modal) — simple enrichissement
4. Phase C.3 (page /projets) — feature complète autonome
5. Phase C.5 (vue carte) — feature autonome
6. Phase D (historique + tests) — finalisation

### Commandes utiles de référence

```bash
# Voir le statut du deploy Vercel
vercel ls --scope amara-fofanas-projects

# Voir les logs Vercel build
vercel logs --scope amara-fofanas-projects

# Vérifier toutes les env vars Vercel
vercel env ls --scope amara-fofanas-projects

# Lancer seulement les tests qui matchent un pattern
npx playwright test --grep "revenus" --project=chromium

# Voir le rapport HTML des tests
npx playwright show-report

# TypeScript check sans build
npx tsc --noEmit

# Format code (si prettier configuré)
npx prettier --write .
```

---

## FINAL SUCCESS CRITERIA

44/44 tests Playwright verts sur URL Vercel production
CRUD revenus complet persisté en Neon
Widget "Reste à vivre" sur dashboard avec calcul correct
Vue `/cartes/[id]` avec total mensuel et liste dépenses carte
Formulaire PLANNED enrichi avec 3 champs conditionnels et calcul mensuel
Page `/projets` avec progression et montant mensuel suggéré
Widget projets sur dashboard
Navigation historique `/mon-mois` avec mois passés en lecture seule
`npm run build` + `npm run lint` sans erreur
Code committé et pushé sur GitHub main
Zéro erreur console browser

**Output quand tout est complet :**

```
<promise>PHASE2_COMPLETE</promise>
```
