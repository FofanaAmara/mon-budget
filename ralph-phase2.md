# MISSION: Build Mon Budget Phase 2 — Revenus, Notifications & Cartes

Ajouter sur le MVP Phase 1 (déjà déployé et fonctionnel) : gestion des revenus avec vue "reste à vivre", notifications email (Resend) + SMS (Twilio), cron Vercel quotidien pour rappels automatiques, et vue dédiée par carte de paiement — déployé, testé Playwright, fonctionnel en production.

---

## REFERENCES (Read First)

1. **`plan-phase2.md`** — Plan détaillé Phase 2. LIRE EN ENTIER avant de commencer.
2. **`prd-budget-tracker.md`** — PRD complet, sections 4.2, 4.3, 4.5.
3. **`.env.local`** — Credentials Neon déjà présents. Vérifier que `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER` sont présents (sinon les ajouter via `vercel env add`).
4. **`tests/phase1/`** — Tests Phase 1 existants (à ne pas casser — non-régression obligatoire).

**Précondition absolue** : Vérifier que Phase 1 est bien livrée avant de commencer :
```bash
npx playwright test tests/phase1/ --project=chromium
# Doit retourner 10/10 passed
```

**Required Tools/Skills**:

- Utiliser le skill `frontend-design` pour TOUTES les nouvelles pages et composants UI.
- Utiliser `vercel` CLI pour ajouter les env vars et déployer.
- Utiliser le **MCP Playwright** pour tester visuellement chaque interface dans le browser **immédiatement après l'avoir buildée**, avant de passer à la suite.

---

## UI TESTING PROTOCOL (Obligatoire à chaque composant/page UI)

> **Règle** : Après chaque page ou composant UI construit avec `frontend-design`, IMMÉDIATEMENT tester dans le browser avec le MCP Playwright AVANT de passer à la suite.

**Protocole à suivre après chaque UI buildée** :

```
1. npm run dev (si pas déjà lancé)
2. mcp__playwright__browser_navigate → http://localhost:3000/[page]
3. mcp__playwright__browser_snapshot → vérifier la structure
4. mcp__playwright__browser_take_screenshot → vérifier le rendu visuel
5. mcp__playwright__browser_navigate en viewport 375px → vérifier mobile
6. mcp__playwright__browser_console_messages → vérifier zéro erreur console
7. Si problème → corriger AVANT de continuer
```

---

## PHASES (Incremental Goals)

### Phase A: Revenus & "Reste à vivre" — UI via `frontend-design` (Est. ~1h)

**Objective**: CRUD revenus avec normalisation mensuelle, widget "reste à vivre" sur dashboard.

**Actions**:

- Appliquer migration SQL : créer table `incomes` (`id UUID`, `name TEXT`, `amount DECIMAL`, `frequency ENUM('MONTHLY','BIWEEKLY','YEARLY')`, `is_active BOOLEAN DEFAULT true`, `created_at TIMESTAMP DEFAULT NOW()`)
- Régénérer les types TypeScript si nécessaire
- Créer `lib/actions/incomes.ts` : `createIncome`, `updateIncome`, `deleteIncome`
- Créer `lib/utils.ts` fonction `normalizeToMonthly(amount, frequency)` : MONTHLY×1, BIWEEKLY×26/12, YEARLY÷12
- Utiliser le skill `frontend-design` pour créer `app/revenus/page.tsx` : liste des revenus avec montant mensuel normalisé + total + CRUD
  - → **MCP Playwright** : naviguer vers `/revenus`, screenshot, créer un revenu via l'UI, vérifier qu'il apparaît avec le bon montant mensuel normalisé
- Ajouter onglet "Revenus" dans la navigation (ou accessible depuis /parametres)
  - → **MCP Playwright** : vérifier la navigation vers `/revenus` depuis le menu, screenshot mobile 375px
- Utiliser le skill `frontend-design` pour mettre à jour le dashboard : ajouter widget "Reste à vivre" = Revenus − Dépenses (vert si positif, rouge si négatif)
  - → **MCP Playwright** : naviguer vers `/`, screenshot, vérifier widget "Reste à vivre" présent avec couleur correcte (vert/rouge), vérifier console zéro erreur
- `git add -A && git commit -m "feat: [feature]" && git push origin main`

**Success Criteria**:

- [ ] Table `incomes` créée : `SELECT COUNT(*) FROM incomes` retourne 0 (table vide = OK)
- [ ] Créer revenu "Salaire 5000$/mois" → visible en base + total dashboard mis à jour
- [ ] Widget "Reste à vivre" affiché sur dashboard avec couleur correcte
- [ ] `normalizeToMonthly(2500, 'BIWEEKLY')` = 5416.67 (2500×26/12)

---

### Phase B: Notifications Email & SMS (Est. ~1h)

**Objective**: Routes API email (Resend) et SMS (Twilio) fonctionnelles, templates de rappel différenciés.

**Actions**:

- Vérifier les env vars Resend + Twilio dans `.env.local` et sur Vercel
- Installer : `npm install resend twilio`
- Créer `lib/notifications.ts` : `buildReminderMessage(expense, daysUntil)` — texte différencié : "auto-chargé sur [carte] ***XXXX" vs "à payer manuellement"
- Créer `app/api/notify/email/route.ts` (Node.js runtime) : POST `{to, expenseName, amount, dueDate, isAutoCharged, cardName}` → `resend.emails.send()`
- Créer `app/api/notify/sms/route.ts` (Node.js runtime) : POST même payload → `twilio.messages.create()`
- Utiliser le skill `frontend-design` pour mettre à jour `app/parametres/page.tsx` : ajouter champs email + téléphone + bouton "Envoyer notification test" (appelle les 2 routes)
  - → **MCP Playwright** : naviguer vers `/parametres`, screenshot, remplir email + téléphone, cliquer "Tester", vérifier le feedback UI (succès/erreur), recharger et vérifier persistance
- `git add -A && git commit -m "feat: revenus + reste-a-vivre + email + sms + parametres" && git push origin main`
- Attendre le deploy automatique Vercel (~1-2 min) : `vercel ls --scope amara-fofanas-projects` → statut "Ready"
- → **MCP Playwright** : naviguer vers `https://mon-budget-amara-fofanas-projects.vercel.app/revenus`, screenshot, tester le widget "Reste à vivre" sur le dashboard en production

**Success Criteria**:

- [ ] `POST /api/notify/email` avec payload test → retourne 200
- [ ] `POST /api/notify/sms` avec payload test → retourne 200
- [ ] Message dépense auto-chargée contient "auto-chargé"
- [ ] Message dépense manuelle contient "manuellement"
- [ ] `npm run build` exit code 0

---

### Phase C: Cron Vercel & Notification_Log (Est. ~1h)

**Objective**: Cron quotidien automatique envoyant les rappels et les traçant sans doublon.

**Actions**:

- Ajouter `CRON_SECRET` (valeur aléatoire) dans `.env.local` et sur Vercel : `vercel env add CRON_SECRET production --scope amara-fofanas-projects`
- Créer `app/api/cron/reminders/route.ts` :
  - Vérifier header `Authorization: Bearer ${CRON_SECRET}`
  - Query : `SELECT * FROM expenses WHERE is_active = true AND next_due_date - CURRENT_DATE = ANY(reminder_offsets)`
  - Pour chaque expense : vérifier dans `notification_log` si déjà envoyé (déduplication)
  - Envoyer push/email/sms selon `notify_push`/`notify_email`/`notify_sms`
  - Insérer dans `notification_log`
- Mettre à jour `vercel.json` : ajouter `"crons": [{"path": "/api/cron/reminders", "schedule": "0 9 * * *"}]`
- `git add -A && git commit -m "feat: cron reminders + notification log" && git push origin main`
- Attendre le deploy automatique Vercel : `vercel ls --scope amara-fofanas-projects` → statut "Ready"
- Vérifier que le cron apparaît dans Vercel Dashboard → Cron Jobs

**Success Criteria**:

- [ ] `GET /api/cron/reminders` avec header `Authorization: Bearer [CRON_SECRET]` → 200
- [ ] Après exécution : `SELECT COUNT(*) FROM notification_log` > 0 (si dépenses dans les prochains jours)
- [ ] Exécuter 2 fois → pas de doublon dans `notification_log`
- [ ] Cron visible dans Vercel Dashboard

---

### Phase D: Vue par Carte — UI via `frontend-design` (Est. ~30min)

**Objective**: Page dédiée par carte avec dépenses filtrées et total mensuel.

**Actions**:

- Utiliser le skill `frontend-design` pour créer `app/cartes/[id]/page.tsx` : en-tête carte (nom + type + ***XXXX), liste des dépenses auto-chargées sur cette carte, total mensuel en bas
  - → **MCP Playwright** : naviguer vers `/cartes/[id]` (avec un ID réel depuis la DB), screenshot, vérifier dépenses filtrées + total correct, snapshot mobile 375px
- Utiliser le skill `frontend-design` pour mettre à jour `app/cartes/page.tsx` : chaque carte affiche son total mensuel + lien vers `/cartes/[id]`
  - → **MCP Playwright** : naviguer vers `/cartes`, screenshot, vérifier totaux affichés, cliquer sur une carte → vérifier navigation vers `/cartes/[id]`
- `git add -A && git commit -m "feat: [feature]" && git push origin main`

**Success Criteria**:

- [ ] Page `/cartes/[id]` accessible, dépenses filtrées par carte, total mensuel correct
- [ ] Page `/cartes` : chaque carte affiche son total mensuel

---

### Phase E: Tests Playwright Phase 2 + Non-Régression (Est. ~1h)

**Objective**: 12 tests Phase 2 verts + 10 tests Phase 1 encore verts (22/22 total).

**Actions**:

- Écrire `tests/phase2/test-revenus.spec.ts` : créer revenu 5000$/mois → total dashboard mis à jour
- Écrire `tests/phase2/test-revenus-multifreq.spec.ts` : bimensuel 2500$ → normalisation correcte
- Écrire `tests/phase2/test-solde-dashboard.spec.ts` : widget "Reste à vivre" affiché, couleurs correctes
- Écrire `tests/phase2/test-email-route.spec.ts` : POST `/api/notify/email` → 200
- Écrire `tests/phase2/test-sms-route.spec.ts` : POST `/api/notify/sms` → 200
- Écrire `tests/phase2/test-cron-manual.spec.ts` : GET `/api/cron/reminders` avec Authorization → 200
- Écrire `tests/phase2/test-cron-dedup.spec.ts` : 2 exécutions → pas de doublon dans notification_log
- Écrire `tests/phase2/test-cron-message.spec.ts` : message différencié auto vs manuel
- Écrire `tests/phase2/test-vue-carte.spec.ts` : page `/cartes/[id]` correcte
- Écrire `tests/phase2/test-vue-cartes-list.spec.ts` : total mensuel par carte sur `/cartes`
- Écrire `tests/phase2/test-parametres-notif.spec.ts` : sauvegarder email + téléphone → persistés
- Écrire `tests/phase2/test-regression.spec.ts` : importe et ré-exécute les 10 tests Phase 1
- Exécuter : `npx playwright test tests/phase2/ --project=chromium`
- Exécuter non-régression : `npx playwright test tests/phase1/ --project=chromium`

**Success Criteria**:

- [ ] `npx playwright test tests/phase2/ --project=chromium` → **12/12 passed**
- [ ] `npx playwright test tests/phase1/ --project=chromium` → **10/10 passed** (non-régression)
- [ ] Total : 22/22 passed

---

## SELF-CORRECTION LOOP (Iteration Workflow)

### 1. Test (How to Verify)

```bash
# Build
npm run build

# Lint
npm run lint

# Tests Phase 2
npx playwright test tests/phase2/ --project=chromium --reporter=list

# Non-régression Phase 1
npx playwright test tests/phase1/ --project=chromium --reporter=list

# Vérification DB
node -e "
const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });
const sql = neon(process.env.POSTGRES_URL_NON_POOLING);
Promise.all([
  sql\`SELECT COUNT(*) as count FROM incomes\`,
  sql\`SELECT COUNT(*) as count FROM notification_log\`
]).then(([i, n]) => {
  console.log('incomes:', i[0].count);
  console.log('notification_log:', n[0].count);
}).catch(console.error);
"
```

### 2. If Failures

- **Build error** → corriger le type/import exact → `npm run build`
- **Resend/Twilio error** → vérifier les env vars avec `vercel env ls` → `vercel env pull .env.local --yes` → retester
- **Cron non autorisé (401)** → vérifier que `CRON_SECRET` est dans `.env.local` ET sur Vercel → `vercel env pull .env.local --yes`
- **Playwright failure** → lire screenshot dans `test-results/` → corriger → redéployer → retester
- **Non-régression failure** → une feature Phase 1 est cassée → corriger sans toucher aux tests Phase 1

### 3. If Tests Pass

- Vérifier visuellement : dashboard widget "Reste à vivre", page `/revenus`, page `/cartes/[id]`
- Vérifier console browser : zéro erreur rouge
- Vérifier `notification_log` en base après exécution manuelle du cron
- Vérifier que le cron est visible dans Vercel Dashboard > Cron Jobs

### 4. Determine Next Action

- Si **TOUTES les conditions remplies** → `<promise>PHASE2_COMPLETE</promise>`
- Si **non remplies** → identifier → corriger → re-tester
- Si **bloqué après 25 itérations** → Escape Hatch

---

## COMPLETION CRITERIA (Exit Conditions)

Output `<promise>PHASE2_COMPLETE</promise>` **UNIQUEMENT** quand **TOUTES** ces conditions sont vraies :

### A. Features Développées & Fonctionnelles

- [ ] CRUD revenus fonctionnel, normalisation mensuelle correcte
- [ ] Widget "Reste à vivre" sur dashboard : Revenus − Dépenses, couleur verte/rouge
- [ ] Email de rappel envoyé via Resend (`POST /api/notify/email` → 200)
- [ ] SMS de rappel envoyé via Twilio (`POST /api/notify/sms` → 200)
- [ ] Messages différenciés : "auto-chargé sur [carte]" vs "à payer manuellement"
- [ ] Page `/cartes/[id]` : dépenses filtrées + total mensuel corrects
- [ ] Page `/cartes` : total mensuel affiché par carte

### B. Déploiement Vercel

- [ ] `git push origin main` déclenche le deploy Vercel → statut "Ready" confirmé
- [ ] Cron `0 9 * * *` visible dans Vercel Dashboard > Cron Jobs
- [ ] Toutes les env vars Phase 2 présentes : RESEND_API_KEY, TWILIO_*, CRON_SECRET

### C. Base de Données Neon Vérifiée

- [ ] Table `incomes` existe et est requêtable
- [ ] Après exécution manuelle cron : `SELECT COUNT(*) FROM notification_log` ≥ 1
- [ ] Déduplication confirmée : 2 exécutions → pas de doublon

### D. Build & Qualité

- [ ] `npm run build` → exit code 0
- [ ] `npm run lint` → zéro erreur
- [ ] Zéro `console.error` dans browser sur l'URL Vercel

### E. Tests Playwright

- [ ] `npx playwright test tests/phase2/ --project=chromium` → **12/12 passed**
- [ ] `npx playwright test tests/phase1/ --project=chromium` → **10/10 passed** (non-régression)
- [ ] Total : **22/22 passed**

### F. Git

- [ ] `git status` → "nothing to commit, working tree clean"
- [ ] Tout pushé sur `main`

```
<promise>PHASE2_COMPLETE</promise>
```

---

## ESCAPE HATCH (If Stuck After 25 Iterations)

### 1. Créer `phase2-blockers.md` avec : conditions non remplies, tentatives, causes probables, alternatives, actions recommandées.

### 2. Commit ce qui fonctionne

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

- **UI obligatoire** : Skill `frontend-design` pour tous les composants et pages.
- **Runtime API routes** : `export const runtime = 'nodejs'` sur `/api/notify/*` et `/api/cron/*` (Resend + Twilio incompatibles Edge Runtime).
- **Cron security** : Vérifier `Authorization: Bearer ${process.env.CRON_SECRET}` au début de la route cron, retourner 401 sinon.
- **Déduplication cron** : Avant envoi, vérifier `notification_log` WHERE `expense_id = $1 AND channel = $2 AND DATE(scheduled_for) = CURRENT_DATE`.
- **Twilio trial** : En mode trial, SMS envoyés uniquement aux numéros vérifiés dans la console Twilio.
- **Vercel scope** : Toujours `--scope amara-fofanas-projects`.
- **Ne pas modifier** : Tests Phase 1 (`tests/phase1/`).

---

## FINAL SUCCESS CRITERIA

✅ **22/22 tests Playwright verts (12 Phase 2 + 10 Phase 1 non-régression)**
✅ **Widget "Reste à vivre" fonctionnel sur dashboard**
✅ **Email + SMS reçus lors du test**
✅ **Cron Vercel configuré et visible**
✅ **Vue par carte correcte**
✅ **Données Neon vérifiées (incomes + notification_log)**
✅ **Build + lint sans erreur**
✅ **Code pushé sur GitHub main**

```
<promise>PHASE2_COMPLETE</promise>
```
