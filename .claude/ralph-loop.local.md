---
active: true
iteration: 1
max_iterations: 35
completion_promise: "PHASE1_COMPLETE"
started_at: "2026-02-26T19:30:42Z"
---

# MISSION: Build Mon Budget MVP — Full Phase 1

Construire le MVP complet de l'app "Mon Budget" de zéro : infrastructure Next.js 15 + Neon PostgreSQL + Vercel, CRUD sections/cartes/dépenses, dashboard, Web Push, PWA installable iOS — déployé, testé Playwright, fonctionnel en production.

---

## REFERENCES (Read First)

1. **`plan-phase1.md`** — Plan détaillé Phase 1 avec toutes les étapes, tâches et checkpoints. LIRE EN ENTIER avant de commencer.
2. **`prd-budget-tracker.md`** — PRD complet : modèle de données, fonctionnalités, contraintes techniques.
3. **`.env.local`** — Credentials Neon PostgreSQL (`POSTGRES_URL`, etc.) et variables Vercel déjà présentes.
4. **`.vercel/`** — Projet Vercel déjà lié (`amara-fofanas-projects/mon-budget`).

**Required Tools/Skills**:

- Utiliser le skill `frontend-design` pour TOUT le code UI (composants, pages, layout, dashboard). Ne jamais coder l'UI sans ce skill.
- Utiliser `vercel` CLI (déjà installé et connecté) pour déployer et gérer les env vars.
- Utiliser `npx playwright` pour les tests E2E finaux.
- Utiliser le **MCP Playwright** (`mcp__playwright__browser_navigate`, `mcp__playwright__browser_snapshot`, `mcp__playwright__browser_take_screenshot`) pour tester visuellement chaque interface dans le browser **au fur et à mesure du développement**.

---

## UI TESTING PROTOCOL (Obligatoire à chaque composant/page UI)

> **Règle** : Après chaque page ou composant UI construit avec `frontend-design`, IMMÉDIATEMENT tester dans le browser avec le MCP Playwright AVANT de passer à la suite.

**Protocole à suivre après chaque UI buildée** :

```
1. npm run dev (si pas déjà lancé)
2. mcp__playwright__browser_navigate → http://localhost:3000/[page]
3. mcp__playwright__browser_snapshot → vérifier l'arbre d'accessibilité (structure présente)
4. mcp__playwright__browser_take_screenshot → vérifier le rendu visuel
5. mcp__playwright__browser_navigate → même page en viewport 375px (mobile)
6. mcp__playwright__browser_console_messages → vérifier zéro erreur console
7. Si problème détecté → corriger AVANT de passer à la page suivante
```

**Ce qu'on vérifie à chaque test visuel** :
- La page se charge sans erreur (pas de page blanche, pas de 500)
- Les éléments attendus sont présents (navigation, titres, boutons, listes)
- Le rendu mobile 375px est correct (pas de débordement horizontal)
- Zéro erreur rouge dans la console browser

---

## PHASES (Incremental Goals)

### Phase A: Bootstrap & Infrastructure (Est. ~2h)

**Objective**: Projet Next.js 15 fonctionnel, Neon DB configurée, Vercel déployé, VAPID générés.

**Actions**:

- Exécuter `npx create-next-app@latest . --typescript --tailwind --eslint --app --no-src-dir --import-alias "@/*"` dans le répertoire courant
- Installer les dépendances : `@neondatabase/serverless web-push @types/web-push`
- Installer Playwright : `npm init playwright@latest -- --quiet`
- Générer les clés VAPID : `npx web-push generate-vapid-keys` → stocker dans `.env.local`
- Ajouter `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_EMAIL=fofana.amara@outlook.fr` dans `.env.local`
- Pousser les VAPID keys sur Vercel : `vercel env add VAPID_PUBLIC_KEY production --scope amara-fofanas-projects` (et PRIVATE_KEY, EMAIL)
- Écrire `supabase/schema.sql` → appliquer via Node script utilisant `POSTGRES_URL_NON_POOLING`
- Schéma : tables `sections`, `cards`, `expenses`, `settings`, `notification_log`, `push_subscriptions`
- Appliquer seed : 6 sections par défaut (🏠 Maison, 👤 Perso, 👨‍👩‍👧‍👦 Famille, 🚗 Transport, 💼 Business, 🎯 Projets) + settings singleton
- Créer `lib/db.ts` : client Neon avec `POSTGRES_URL`
- Créer `.env.example` avec toutes les variables (valeurs masquées)
- Mettre à jour `.gitignore` : `.env.local`, `.vercel`, `.next/`, `node_modules/`, `test-results/`, `playwright-report/`
- Premier deploy : `git push origin main`
- Commit : `git add -A && git commit -m "chore: bootstrap Next.js 15 + Neon schema + Vercel deploy"`
- Push : `git push origin main`

**Success Criteria**:

- [ ] `npm run build` retourne exit code 0
- [ ] `git push origin main` → deploy Vercel automatique → URL prod accessible HTTP 200
- [ ] Query `SELECT COUNT(*) FROM sections` via Node retourne 6
- [ ] Query `SELECT COUNT(*) FROM settings` retourne 1
- [ ] `.env.local` contient POSTGRES_URL + VAPID_PUBLIC_KEY + VAPID_PRIVATE_KEY

---

### Phase B: CRUD Sections, Cartes & Dépenses — UI via `frontend-design` (Est. ~3h)

**Objective**: CRUD complet des 3 entités, persisté en Neon, UI production-quality via frontend-design skill.

**Actions**:

- Utiliser le skill `frontend-design` pour créer le layout global, la navigation bottom bar (5 onglets), et le design system (tokens Tailwind, composants UI)
  - → **MCP Playwright** : naviguer vers `/`, screenshot + snapshot, vérifier bottom nav sur 375px
- Utiliser le skill `frontend-design` pour créer la page `/sections` : liste + modal création/édition + réordonnancement
  - → **MCP Playwright** : naviguer vers `/sections`, vérifier les 6 sections seed affichées, tester ouverture modal, screenshot mobile
- Créer les Server Actions `lib/actions/sections.ts` : `createSection`, `updateSection`, `deleteSection`, `reorderSections`
  - → **MCP Playwright** : créer une section via l'UI, vérifier qu'elle apparaît dans la liste sans rechargement
- Utiliser le skill `frontend-design` pour créer la page `/cartes` : liste + modal ajout/édition
  - → **MCP Playwright** : naviguer vers `/cartes`, screenshot, vérifier état vide + bouton ajout
- Créer les Server Actions `lib/actions/cards.ts` : `createCard`, `updateCard`, `deleteCard`
  - → **MCP Playwright** : créer une carte via l'UI, vérifier qu'elle apparaît
- Créer `lib/utils.ts` : `formatCAD(amount)`, `formatDate(date)`, `calcNextDueDate(type, recurrence, day)`, `calcMonthlyCost(expense)`
- Utiliser le skill `frontend-design` pour créer `components/ExpenseForm.tsx` : formulaire complet (nom, montant, devise, type RECURRING/ONE_TIME, section, récurrence, date, prélèvement auto, carte, notes, reminder_offsets, canaux push/email/sms)
  - → **MCP Playwright** : ouvrir le formulaire, screenshot, vérifier que les champs conditionnels s'affichent/masquent selon le type sélectionné
- Utiliser le skill `frontend-design` pour créer la page `/depenses` : liste groupée par section + FAB "+"
  - → **MCP Playwright** : naviguer vers `/depenses`, screenshot, tester le FAB "+" → formulaire s'ouvre, créer une dépense, vérifier qu'elle apparaît
- Créer les Server Actions `lib/actions/expenses.ts` : `createExpense`, `updateExpense`, `deleteExpense`
- Créer `app/depenses/[id]/edit/page.tsx` : formulaire pré-rempli
  - → **MCP Playwright** : cliquer "Modifier" sur une dépense, vérifier le formulaire pré-rempli
- Utiliser le skill `frontend-design` pour créer la page `/parametres` (Phase 1 minimal : devise + rappels par défaut)
  - → **MCP Playwright** : naviguer vers `/parametres`, screenshot, sauvegarder un paramètre, recharger et vérifier persistance
- `git add -A && git commit -m "feat: [entity] CRUD" && git push origin main` après chaque entité complète

**Success Criteria**:

- [ ] Créer une section "🏋️ Sport" → visible en base : `SELECT name FROM sections WHERE name='Sport'`
- [ ] Créer une carte "Visa ***4532" → visible en base : `SELECT COUNT(*) FROM cards`
- [ ] Créer une dépense récurrente mensuelle le 5 → `next_due_date` correcte en base
- [ ] `npm run build` retourne exit code 0
- [ ] Zéro erreur TypeScript : `npx tsc --noEmit`

---

### Phase C: Dashboard, PWA & Web Push — UI via `frontend-design` (Est. ~2h)

**Objective**: Dashboard complet avec vraies données, PWA installable, push notifications fonctionnelles.

**Actions**:

- Utiliser le skill `frontend-design` pour créer le dashboard (`app/page.tsx`) avec 4 widgets : total mensuel par section (barres), prochaines dépenses 7 jours, alertes manuelles, en-tête total mensuel
  - → **MCP Playwright** : naviguer vers `/`, screenshot, vérifier les 4 widgets présents avec de vraies données, snapshot mobile 375px, vérifier zéro erreur console
- Créer `public/manifest.json` : name "Mon Budget", icons 192+512, display standalone, theme_color #2563EB, start_url "/"
- Générer icônes PWA 192×192 et 512×512 PNG dans `public/icons/`
- Créer `public/sw.js` : cache app shell + listener `push` → `self.registration.showNotification()`
- Enregistrer le SW dans `app/layout.tsx`
  - → **MCP Playwright** : naviguer vers `/`, ouvrir DevTools via snapshot, vérifier SW enregistré
- Créer `app/api/push/subscribe/route.ts` (Node.js runtime) : POST → upsert dans `push_subscriptions`
- Créer `app/api/push/send/route.ts` (Node.js runtime) : envoyer push via `web-push.sendNotification` à toutes les subscriptions
- Utiliser le skill `frontend-design` pour créer `components/NotificationPermission.tsx` : banner "Activer les notifications"
  - → **MCP Playwright** : naviguer vers `/`, vérifier le banner de permission visible, screenshot
- Ajouter `vercel.json` avec headers PWA (pas de cron Phase 1)
- `git add -A && git commit -m "feat: dashboard + PWA + web push" && git push origin main`
- Attendre le deploy automatique Vercel (~1-2 min) : `vercel ls --scope amara-fofanas-projects` → vérifier statut "Ready"
- → **MCP Playwright** : naviguer vers `https://mon-budget-amara-fofanas-projects.vercel.app`, screenshot dashboard, vérifier que tout fonctionne en production (pas seulement localhost), console zéro erreur

**Success Criteria**:

- [ ] Dashboard affiche les 4 widgets avec de vraies données
- [ ] `GET /manifest.json` retourne 200 avec content-type application/json
- [ ] SW visible dans Chrome DevTools > Application > Service Workers
- [ ] `POST /api/push/subscribe` retourne 200
- [ ] `POST /api/push/send` retourne 200 (notification envoyée)
- [ ] Lighthouse PWA audit score ≥ 90

---

### Phase D: Tests Playwright E2E sur Vercel Production (Est. ~1h)

**Objective**: 10 tests Playwright verts sur l'URL Vercel de production.

**Actions**:

- Configurer `playwright.config.ts` : `baseURL` = URL Vercel de production (récupérer depuis `vercel ls --scope amara-fofanas-projects`)
- Écrire `tests/phase1/test-setup.spec.ts` : URL accessible HTTP 200, titre "Mon Budget", manifest accessible
- Écrire `tests/phase1/test-navigation.spec.ts` : 5 onglets fonctionnels, responsive 375px, 404 propre
- Écrire `tests/phase1/test-sections.spec.ts` : créer "🏋️ Sport" → renommer → réordonner → supprimer
- Écrire `tests/phase1/test-cartes.spec.ts` : créer "Visa ***4532" → modifier → supprimer
- Écrire `tests/phase1/test-expense-recurring.spec.ts` : créer dépense récurrente mensuelle → next_due_date correcte → visible liste
- Écrire `tests/phase1/test-expense-onetime.spec.ts` : créer dépense ponctuelle dans 3 jours → apparaît dans widget 7 jours
- Écrire `tests/phase1/test-expense-edit.spec.ts` : modifier montant → persisté après rechargement
- Écrire `tests/phase1/test-dashboard.spec.ts` : 4 widgets présents, totaux corrects après ajout dépense
- Écrire `tests/phase1/test-quick-add.spec.ts` : chronomètre ajout dépense via FAB "+" < 30 secondes
- Écrire `tests/phase1/test-pwa.spec.ts` : manifest valide, SW enregistré
- Exécuter : `npx playwright test tests/phase1/ --project=chromium`
- `git add -A && git commit -m "feat: playwright tests phase1" && git push origin main`

**Success Criteria**:

- [ ] `npx playwright test tests/phase1/ --project=chromium` → 10/10 passed, exit code 0
- [ ] Zéro test skipped ou pending
- [ ] Rapport HTML généré dans `playwright-report/`

---

## SELF-CORRECTION LOOP (Iteration Workflow)

### 1. Test (How to Verify)

Après chaque modification, exécuter dans l'ordre :

```bash
# Étape 1 : Build TypeScript
npm run build

# Étape 2 : Lint
npm run lint

# Étape 3 (après Phase D) : Tests Playwright sur Vercel prod
npx playwright test tests/phase1/ --project=chromium --reporter=list

# Vérification DB (après Phase A)
node -e "
const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });
const sql = neon(process.env.POSTGRES_URL_NON_POOLING);
Promise.all([
  sql\`SELECT COUNT(*) as count FROM sections\`,
  sql\`SELECT COUNT(*) as count FROM settings\`,
  sql\`SELECT COUNT(*) as count FROM cards\`,
  sql\`SELECT COUNT(*) as count FROM expenses\`
]).then(([s, st, c, e]) => {
  console.log('sections:', s[0].count, '(expected: >=6)');
  console.log('settings:', st[0].count, '(expected: 1)');
  console.log('cards:', c[0].count);
  console.log('expenses:', e[0].count);
}).catch(console.error);
"
```

### 2. If Failures

- **Build error** → lire le message exact (fichier:ligne:colonne) → corriger le type/import → relancer `npm run build`
- **Lint error** → `npm run lint -- --fix` pour les auto-fixables → corriger manuellement les autres → relancer
- **Playwright test failure** → lire le screenshot dans `test-results/` → identifier l'élément manquant ou l'assertion fausse → corriger le code ou le test → redéployer si nécessaire → relancer
- **DB query error** → vérifier que le schéma est bien appliqué → vérifier `POSTGRES_URL_NON_POOLING` dans `.env.local` → relancer le script de migration
- **Deploy Vercel échoue** → vérifier les logs dans le Vercel Dashboard (Deployments → dernier deploy → Build Logs) → identifier l'erreur → corriger le code → `git push origin main` → attendre le redeploy automatique

### 3. If Tests Pass

- Vérifier visuellement chaque page dans le navigateur (375px mobile)
- Vérifier la console browser : zéro erreur rouge (les warnings sont OK)
- Vérifier les données en base avec le script Node ci-dessus
- Vérifier que le code est committé : `git status` doit retourner "nothing to commit"
- Vérifier le deploy Vercel : `vercel ls --scope amara-fofanas-projects`
- Cocher chaque condition de sortie (section COMPLETION CRITERIA)

### 4. Determine Next Action

- Si **TOUTES les conditions de sortie sont remplies** → Output `<promise>PHASE1_COMPLETE</promise>`
- Si **conditions non remplies** → identifier quelle condition échoue → corriger → re-tester
- Si **bloqué après 30 itérations** → suivre l'Escape Hatch

---

## COMPLETION CRITERIA (Exit Conditions)

Output `<promise>PHASE1_COMPLETE</promise>` **UNIQUEMENT** quand **TOUTES** ces conditions sont vraies :

### A. Features Développées & Fonctionnelles

- [ ] CRUD sections : créer, renommer, réordonner, supprimer — persisté en base
- [ ] CRUD cartes : créer, modifier, supprimer — persisté en base
- [ ] CRUD dépenses RECURRING : tous les champs, `next_due_date` calculée correctement
- [ ] CRUD dépenses ONE_TIME : tous les champs, date d'échéance correcte
- [ ] Dashboard : 4 widgets affichent de vraies données (total mensuel, 7 jours, alertes, en-tête)
- [ ] FAB "+" sur dashboard → formulaire → dépense créée en moins de 30 secondes

### B. Déploiement Vercel

- [ ] `git push origin main` déclenche le deploy → `vercel ls --scope amara-fofanas-projects` retourne statut "Ready"
- [ ] URL Vercel retourne HTTP 200
- [ ] Toutes les env vars présentes sur Vercel : `vercel env ls --scope amara-fofanas-projects`

### C. Base de Données Neon Vérifiée

- [ ] `SELECT COUNT(*) FROM sections` ≥ 6 (seed appliqué)
- [ ] `SELECT COUNT(*) FROM settings` = 1 (singleton présent)
- [ ] Après test CRUD : données créées/modifiées/supprimées confirmées en base

### D. Build & Qualité

- [ ] `npm run build` → exit code 0, zéro erreur TypeScript
- [ ] `npm run lint` → zéro erreur ESLint
- [ ] Zéro `console.error` dans la console browser (vérifier DevTools sur l'URL Vercel)
- [ ] Zéro placeholder "TODO" ou "Coming soon" dans l'UI

### E. Tests Playwright

- [ ] `npx playwright test tests/phase1/ --project=chromium` → **10/10 passed**
- [ ] Tous les tests s'exécutent sur l'URL Vercel de **production** (pas localhost)
- [ ] Rapport Playwright généré : `playwright-report/index.html` existe

### F. PWA & Push

- [ ] `GET /manifest.json` retourne JSON valide avec name, icons, display: standalone
- [ ] Service Worker visible dans DevTools > Application > Service Workers sur l'URL Vercel
- [ ] `POST /api/push/subscribe` retourne 200
- [ ] `POST /api/push/send` retourne 200

### G. Git

- [ ] `git status` retourne "nothing to commit, working tree clean"
- [ ] `git log --oneline origin/main` → dernier commit contient le code Phase 1
- [ ] Toutes les features committées et pushées sur `main`

**Quand TOUTES les conditions ci-dessus sont TRUE :**

```
<promise>PHASE1_COMPLETE</promise>
```

---

## ESCAPE HATCH (If Stuck After 30 Iterations)

Si après 30 itérations les conditions ne sont **pas toutes remplies** :

### 1. Créer `phase1-blockers.md`

```markdown
## BLOCKERS REPORT — Phase 1

### Conditions Non Remplies
- [x] Condition X.Y : [description précise] → Erreur : [message exact]

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
```

### 2. Commit ce qui fonctionne

```bash
git add -A && git commit -m "wip: phase1 partial — see phase1-blockers.md"
git push origin main
```

### 3. Output

```
<promise>BLOCKED</promise>
```

---

## TECHNICAL NOTES

- **UI obligatoire** : Utiliser le skill `frontend-design` pour TOUS les composants et pages. Ne jamais écrire du JSX sans ce skill.
- **DB client** : Utiliser `@neondatabase/serverless` avec `POSTGRES_URL` (pooled) pour les requêtes standard, `POSTGRES_URL_NON_POOLING` pour les migrations/scripts.
- **Server Actions** : Toujours utiliser `'use server'` + `revalidatePath()` après mutations.
- **Runtime API routes push** : Toujours ajouter `export const runtime = 'nodejs'` sur `/api/push/*` (web-push incompatible Edge Runtime).
- **Vercel scope** : Toujours ajouter `--scope amara-fofanas-projects` aux commandes `vercel`.
- **VAPID email** : `fofana.amara@outlook.fr`
- **next_due_date** : Pour RECURRING mensuel le jour X du mois, calculer la prochaine occurrence à partir d'aujourd'hui.
- **Convention fichiers** : kebab-case pour tous les fichiers, PascalCase pour les composants React.
- **Ne pas modifier** : `.env.local`, `.vercel/` — ces fichiers sont déjà configurés.
- **Itérations UI** : Après avoir utilisé `frontend-design` pour une page, vérifier le rendu à 375px avant de passer à la suivante.

---

## FINAL SUCCESS CRITERIA

✅ **10/10 tests Playwright verts sur URL Vercel production**
✅ **CRUD sections + cartes + dépenses persisté en Neon**
✅ **Dashboard avec vraies données**
✅ **PWA installable : manifest + SW valides**
✅ **Web Push fonctionnel**
✅ **`npm run build` + `npm run lint` sans erreur**
✅ **Code committé et pushé sur GitHub main**
✅ **Zéro erreur console browser**
✅ **Données seed confirmées en base**

**Output quand tout est complet :**

```
<promise>PHASE1_COMPLETE</promise>
```
