# MISSION: Build Mon Budget Phase 3 — Planifiés, Historique & Export

Compléter l'app Mon Budget avec les dépenses planifiées (objectifs d'épargne avec calcul mensuel), l'historique mensuel consultable et l'export CSV — déployé, testé Playwright, fonctionnel en production. C'est la phase finale qui rend l'app pleinement fonctionnelle selon tous les critères du PRD.

---

## REFERENCES (Read First)

1. **`plan-phase3.md`** — Plan détaillé Phase 3. LIRE EN ENTIER avant de commencer.
2. **`prd-budget-tracker.md`** — PRD §3.3 (dépenses planifiées), §4.3 (vue budget), §7 (Phase 3).
3. **`.env.local`** — Credentials Neon déjà présents.
4. **`tests/phase1/`** + **`tests/phase2/`** — Tests existants (non-régression obligatoire : 22/22 doit rester vert).

**Précondition absolue** : Vérifier que Phases 1 et 2 sont livrées :
```bash
npx playwright test tests/phase1/ tests/phase2/ --project=chromium
# Doit retourner 22/22 passed
```

**Required Tools/Skills**:

- Utiliser le skill `frontend-design` pour TOUTES les nouvelles pages et composants UI.
- Skill `frontend-design` également pour le widget projets sur le dashboard.
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

### Phase A: Dépenses Planifiées (Type PLANNED) — UI via `frontend-design` (Est. ~1.5h)

**Objective**: Permettre de créer des objectifs d'épargne et les suivre visuellement avec calcul mensuel automatique.

**Actions**:

- Vérifier que les colonnes `target_amount`, `target_date`, `saved_amount` existent dans la table `expenses` — si absent, appliquer migration SQL :
  ```sql
  ALTER TABLE expenses
    ADD COLUMN IF NOT EXISTS target_amount DECIMAL,
    ADD COLUMN IF NOT EXISTS target_date DATE,
    ADD COLUMN IF NOT EXISTS saved_amount DECIMAL DEFAULT 0;
  ```
- Ajouter dans `lib/utils.ts` : `calcMonthlySavings(targetAmount, savedAmount, targetDate)` → `(target - saved) / monthsUntilTarget(targetDate)` — retourne null si date passée
- Mettre à jour `components/ExpenseForm.tsx` : afficher conditionnellement les 3 champs PLANNED (`target_amount`, `target_date`, `saved_amount`) quand `type === 'PLANNED'` — cacher pour RECURRING et ONE_TIME
- Créer `lib/actions/expenses.ts` (ou mettre à jour) : `updateSavedAmount(id, amount)` Server Action
- Utiliser le skill `frontend-design` pour créer `app/projets/page.tsx` : liste toutes les `expenses WHERE type = 'PLANNED'`, pour chacune : barre de progression (`saved/target` en %), épargne mensuelle suggérée, date cible, montant restant
  - → **MCP Playwright** : naviguer vers `/projets`, screenshot, vérifier barre de progression % correct, épargne mensuelle affichée, snapshot mobile 375px
- Utiliser le skill `frontend-design` pour créer `app/projets/[id]/page.tsx` : détail projet + input inline pour mettre à jour `saved_amount` → recalcul instantané de la progression
  - → **MCP Playwright** : naviguer vers `/projets/[id]`, modifier `saved_amount` via l'UI, screenshot avant/après, vérifier recalcul instantané visible, vérifier console zéro erreur
- Utiliser le skill `frontend-design` pour mettre à jour le dashboard (`app/page.tsx`) : ajouter widget "Projets planifiés" avec top 3 projets (les plus urgents par `target_date`), mini-barre progression, épargne mensuelle suggérée, lien vers `/projets`
  - → **MCP Playwright** : naviguer vers `/`, screenshot dashboard complet, vérifier widget projets présent, cliquer lien vers `/projets`, vérifier navigation
- Mettre à jour `components/BottomNav.tsx` : ajouter accès à "Projets" (onglet ou lien depuis dashboard)
  - → **MCP Playwright** : tester navigation via bottom nav, screenshot mobile
- Commit + push

**Success Criteria**:

- [ ] Créer dépense PLANNED "Piscine" avec `target_amount=25000`, `target_date` dans 18 mois, `saved_amount=5000` → `calcMonthlySavings` = ~1111$/mois
- [ ] Page `/projets` : barre progression à 20% (5000/25000), épargne suggérée affichée
- [ ] Modifier `saved_amount` à 10000 → progression recalculée à 40% instantanément
- [ ] Widget projets visible sur dashboard
- [ ] Champs PLANNED masqués pour RECURRING/ONE_TIME dans le formulaire (non-régression formulaire)
- [ ] `npm run build` exit code 0

---

### Phase B: Historique Mensuel — UI via `frontend-design` (Est. ~1h)

**Objective**: Consulter les dépenses de n'importe quel mois passé avec totaux par section.

**Actions**:

- Ajouter dans `lib/utils.ts` : `getExpensesForMonth(expenses, year, month)` — logique : inclure les dépenses RECURRING actives (toujours présentes dans le mois) + ONE_TIME dont `next_due_date` est dans ce mois + PLANNED exclues de l'historique
- Utiliser le skill `frontend-design` pour créer `app/historique/page.tsx` : sélecteur de mois (12 mois en arrière max, format "Février 2026"), liste des dépenses du mois sélectionné groupées par section, sous-totaux par section, total global du mois
  - → **MCP Playwright** : naviguer vers `/historique`, screenshot, changer le mois sélectionné, vérifier que les dépenses se mettent à jour, snapshot mobile 375px, vérifier console zéro erreur
- Lien "Historique" accessible depuis la navigation (onglet ou menu)
  - → **MCP Playwright** : vérifier navigation vers `/historique` depuis le menu
- Commit + push

**Success Criteria**:

- [ ] Page `/historique` accessible
- [ ] Sélectionner le mois précédent → dépenses RECURRING actives présentes
- [ ] Sous-totaux par section corrects
- [ ] Changer de mois → données mises à jour sans rechargement complet de la page

---

### Phase C: Export CSV (Est. ~30min)

**Objective**: Télécharger les dépenses d'un mois sélectionné en CSV lisible dans Numbers/Excel.

**Actions**:

- Créer `app/api/export/route.ts` : `GET /api/export?month=YYYY-MM` → query dépenses du mois (même logique que historique) → générer CSV avec :
  - BOM UTF-8 : `\uFEFF` au début
  - Séparateur : `;` (standard Excel/Numbers FR)
  - Colonnes : `Date;Nom;Montant;Devise;Type;Section;Carte;Notes`
  - Headers HTTP : `Content-Type: text/csv; charset=utf-8`, `Content-Disposition: attachment; filename="budget-YYYY-MM.csv"`
- Utiliser le skill `frontend-design` pour ajouter bouton "Exporter CSV" sur `/historique` → appelle `/api/export?month=YYYY-MM` avec le mois sélectionné → déclenche le téléchargement
  - → **MCP Playwright** : naviguer vers `/historique`, screenshot avec bouton "Exporter" visible, cliquer le bouton, vérifier que le téléchargement se déclenche (pas d'erreur 500), console zéro erreur
- Commit + push

**Success Criteria**:

- [ ] `GET /api/export?month=2026-02` retourne 200 avec `Content-Type: text/csv`
- [ ] Fichier CSV téléchargé contient les bonnes colonnes et les bonnes dépenses
- [ ] Ouvrir le CSV dans une app → accents corrects, colonnes bien séparées

---

### Phase D: Tests Playwright Phase 3 + Régression Globale 32/32 (Est. ~1h)

**Objective**: 10 tests Phase 3 verts + 22 tests Phases 1&2 encore verts → **32/32 total**.

**Actions**:

- Écrire `tests/phase3/test-planned-create.spec.ts` : créer "Piscine 25K dans 18 mois, épargné 5K" → épargne suggérée ~1111$/mois affichée
- Écrire `tests/phase3/test-planned-list.spec.ts` : page `/projets` affiche barre progression + % correct
- Écrire `tests/phase3/test-planned-update.spec.ts` : modifier `saved_amount` → progression recalculée
- Écrire `tests/phase3/test-planned-dashboard.spec.ts` : widget "Projets" sur dashboard, top 3 affichés
- Écrire `tests/phase3/test-historique-mois.spec.ts` : sélectionner mois précédent → dépenses correctes, totaux bons
- Écrire `tests/phase3/test-historique-navigation.spec.ts` : changer de mois → données mises à jour
- Écrire `tests/phase3/test-export-csv.spec.ts` : clic "Exporter" → téléchargement CSV, Content-Type correct
- Écrire `tests/phase3/test-export-content.spec.ts` : contenu CSV valide, colonnes présentes
- Écrire `tests/phase3/test-form-planned-fields.spec.ts` : champs PLANNED visibles pour type PLANNED, masqués pour RECURRING/ONE_TIME
- Écrire `tests/phase3/test-regression-global.spec.ts` : exécute un sous-ensemble des tests Phase 1 et Phase 2 pour confirmer non-régression
- Exécuter : `npx playwright test --project=chromium --reporter=list`

**Success Criteria**:

- [ ] `npx playwright test tests/phase3/ --project=chromium` → **10/10 passed**
- [ ] `npx playwright test tests/phase1/ tests/phase2/ --project=chromium` → **22/22 passed**
- [ ] Total : **32/32 passed**

---

## SELF-CORRECTION LOOP (Iteration Workflow)

### 1. Test (How to Verify)

```bash
# Build
npm run build

# Lint
npm run lint

# Tests Phase 3
npx playwright test tests/phase3/ --project=chromium --reporter=list

# Régression globale
npx playwright test tests/phase1/ tests/phase2/ --project=chromium --reporter=list

# Vérification DB
node -e "
const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });
const sql = neon(process.env.POSTGRES_URL_NON_POOLING);
sql\`
  SELECT type, COUNT(*) as count
  FROM expenses
  GROUP BY type
\`.then(rows => {
  console.log('Expenses par type:');
  rows.forEach(r => console.log(' ', r.type, ':', r.count));
  const planned = rows.find(r => r.type === 'PLANNED');
  console.log('PLANNED présents:', planned ? planned.count : 0);
}).catch(console.error);
"

# Vérifier colonnes PLANNED dans schema
node -e "
const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });
const sql = neon(process.env.POSTGRES_URL_NON_POOLING);
sql\`
  SELECT column_name FROM information_schema.columns
  WHERE table_name = 'expenses'
  AND column_name IN ('target_amount', 'target_date', 'saved_amount')
\`.then(cols => console.log('Colonnes PLANNED présentes:', cols.map(c => c.column_name))).catch(console.error);
"
```

### 2. If Failures

- **Migration manquante** → colonnes `target_amount`/`target_date`/`saved_amount` absentes → exécuter le `ALTER TABLE` ci-dessus
- **calcMonthlySavings incorrect** → vérifier la logique de calcul des mois restants (attention aux mois partiels → arrondir au supérieur)
- **Formulaire PLANNED casse RECURRING** → les champs conditionnels doivent être isolés → vérifier que `type === 'PLANNED'` est la seule condition
- **Export CSV illisible** → vérifier BOM UTF-8 (`\uFEFF`) + séparateur `;` + headers HTTP corrects
- **Playwright test failure** → lire screenshot → corriger → redéployer → retester
- **Régression Phase 1 ou 2** → ne pas modifier les tests Phase 1/2 → corriger le code applicatif

### 3. If Tests Pass

- Vérifier visuellement : page `/projets`, widget dashboard projets, `/historique` avec sélecteur de mois
- Vérifier export CSV : ouvrir le fichier dans Numbers → accents OK, colonnes séparées
- Vérifier console browser : zéro erreur rouge
- Vérifier données PLANNED en base avec le script Node

### 4. Determine Next Action

- Si **TOUTES les conditions remplies** → `<promise>PHASE3_COMPLETE</promise>`
- Si **non remplies** → identifier → corriger → re-tester
- Si **bloqué après 25 itérations** → Escape Hatch

---

## COMPLETION CRITERIA (Exit Conditions)

Output `<promise>PHASE3_COMPLETE</promise>` **UNIQUEMENT** quand **TOUTES** ces conditions sont vraies :

### A. Features Développées & Fonctionnelles

- [ ] Créer dépense PLANNED → champs `target_amount`, `target_date`, `saved_amount` persistés en base
- [ ] `calcMonthlySavings(25000, 5000, dateIn18Months)` ≈ 1111$/mois
- [ ] Page `/projets` : barre progression, %, épargne mensuelle suggérée corrects
- [ ] Modifier `saved_amount` → progression recalculée instantanément
- [ ] Widget "Projets" sur dashboard : top 3 par urgence (date cible)
- [ ] Page `/historique` : sélecteur de mois fonctionnel, dépenses du mois correctes
- [ ] Export CSV : téléchargement déclenché, fichier lisible dans Numbers avec `;` comme séparateur

### B. Déploiement Vercel

- [ ] `vercel deploy --prod` réussit
- [ ] URL Vercel retourne HTTP 200 après deploy

### C. Base de Données Neon Vérifiée

- [ ] Colonnes `target_amount`, `target_date`, `saved_amount` présentes dans `expenses`
- [ ] Au moins 1 expense de type `PLANNED` créée lors des tests
- [ ] `saved_amount` mis à jour correctement après modification

### D. Build & Qualité

- [ ] `npm run build` → exit code 0
- [ ] `npm run lint` → zéro erreur
- [ ] Zéro `console.error` dans browser
- [ ] Zéro placeholder "TODO" dans l'UI

### E. Tests Playwright — RÉGRESSION GLOBALE

- [ ] `npx playwright test tests/phase3/ --project=chromium` → **10/10 passed**
- [ ] `npx playwright test tests/phase1/ --project=chromium` → **10/10 passed**
- [ ] `npx playwright test tests/phase2/ --project=chromium` → **12/12 passed**
- [ ] **Total : 32/32 passed** — L'app est pleinement fonctionnelle

### F. Critères PRD Globaux Vérifiés

- [ ] Voir le "reste à vivre" en un coup d'œil ✅ (Phase 2)
- [ ] Savoir combien chaque sphère de vie coûte ✅ (Phase 1)
- [ ] Recevoir un rappel avant chaque dépense non automatique ✅ (Phase 2)
- [ ] Planifier un gros achat et savoir combien épargner/mois ✅ **(Phase 3 — ce critère)**
- [ ] Ajouter une dépense en < 30 secondes ✅ (Phase 1)
- [ ] App installable sur iPhone ✅ (Phase 1)

### G. Git

- [ ] `git status` → "nothing to commit, working tree clean"
- [ ] Tout pushé sur `main`

**Quand TOUTES les conditions ci-dessus sont TRUE — L'APP EST COMPLÈTE :**

```
<promise>PHASE3_COMPLETE</promise>
```

---

## ESCAPE HATCH (If Stuck After 25 Iterations)

### 1. Créer `phase3-blockers.md`

```markdown
## BLOCKERS REPORT — Phase 3

### Conditions Non Remplies
- [x] Condition X.Y : [description] → Erreur : [message]

### Tentatives
1. Itération N : [ce qui a été essayé]

### Causes Probables
- [Cause] : [explication]

### Alternatives
1. [Approche A] : pros/cons
2. [Approche B] : pros/cons

### Actions Recommandées
- [Action pour Amara]
```

### 2. Commit ce qui fonctionne

```bash
git add -A && git commit -m "wip: phase3 partial — see phase3-blockers.md"
git push origin main
```

### 3. Output

```
<promise>BLOCKED</promise>
```

---

## TECHNICAL NOTES

- **UI obligatoire** : Skill `frontend-design` pour tous les composants et pages.
- **calcMonthlySavings** : Utiliser `Math.ceil()` pour les mois restants (arrondi au mois supérieur évite de sous-estimer). Si `target_date` est dans le passé ou dans moins d'1 mois, retourner le montant restant total (pas de division).
- **Historique des récurrentes** : Les dépenses RECURRING sont toujours incluses dans l'historique (elles se produisent tous les mois). ONE_TIME : inclure si `next_due_date` dans le mois sélectionné. PLANNED : exclure de l'historique mensuel.
- **CSV BOM** : `\uFEFF` obligatoire au début du CSV pour que Numbers et Excel ouvrent correctement les accents.
- **Séparateur CSV** : `;` (point-virgule) — standard français pour Numbers et Excel FR.
- **Non-régression** : Ne jamais modifier les tests Phase 1 et Phase 2. Corriger uniquement le code applicatif.
- **Vercel scope** : Toujours `--scope amara-fofanas-projects`.

---

## FINAL SUCCESS CRITERIA

✅ **32/32 tests Playwright verts — régression globale confirmée**
✅ **Dépenses PLANNED avec calcul épargne mensuelle correct**
✅ **Historique mensuel consultable**
✅ **Export CSV téléchargeable et lisible**
✅ **Widget projets sur dashboard**
✅ **Données PLANNED confirmées en Neon**
✅ **Build + lint sans erreur**
✅ **Code pushé sur GitHub main**
✅ **TOUS les critères PRD remplis — app pleinement fonctionnelle**

```
<promise>PHASE3_COMPLETE</promise>
```
