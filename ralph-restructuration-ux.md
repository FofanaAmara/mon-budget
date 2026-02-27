# MISSION: Restructurer l'UX complete de Mon Budget PWA

Reorganiser toute la navigation et les pages de l'app Mon Budget pour que chaque page corresponde au modele mental de l'utilisateur : suivi mensuel dans les pages principales, templates dans les reglages, projets & epargne dans la nav.

---

## REFERENCES (Lire en premier)

1. **`plan-restructuration-ux.md`** — Plan detaille complet avec Gap Analysis, etat actuel/futur, 4 phases, fichiers a creer/modifier/supprimer. LIRE EN ENTIER avant de commencer.
2. **`components/MonMoisClient.tsx`** (851 lignes) — Source principale de toutes les extractions. Contient les utilitaires mois, constantes, composants de suivi.
3. **`app/mon-mois/page.tsx`** — Pattern de reference pour les server components (generateMonthlyExpenses → fetch → render).
4. **`lib/actions/monthly-expenses.ts`** — Actions suivi mensuel depenses (generateMonthlyExpenses, getMonthlyExpenses, markAsPaid, etc.).
5. **`lib/actions/monthly-incomes.ts`** — Actions suivi mensuel revenus (generateMonthlyIncomes, getMonthlyIncomeSummary, markIncomeReceived, etc.).
6. **`lib/actions/expenses.ts`** — Actions CRUD depenses + getPlannedExpenses + updateSavedAmount + createAdhocExpense.
7. **`lib/actions/incomes.ts`** — Actions CRUD revenus (a etendre avec createAdhocIncome).
8. **`lib/types.ts`** — Types TypeScript (Expense, Income, MonthlyExpense, MonthlyIncome, etc.).
9. **`components/BottomNav.tsx`** — Navigation actuelle (6 tabs) a rewriter en 5 tabs.
10. **`components/ParametresClient.tsx`** — Page reglages a etendre avec templates.
11. **`app/page.tsx`** — Dashboard actuel (377 lignes) a remplacer par Accueil = Mon Mois.
12. **`components/DepensesClient.tsx`** — Vue templates depenses actuelle (a remplacer).
13. **`components/RevenusClient.tsx`** — Vue templates revenus actuelle (a remplacer).
14. **`components/ProjetsClient.tsx`** — Vue projets actuelle (a enrichir).
15. **`components/ExpenseModal.tsx`** — Modal creation/edition depense (reutiliser dans templates).
16. **`lib/utils.ts`** — Utilitaires existants (formatCAD, daysUntil, calcMonthlySuggested, etc.).

**Skill obligatoire** : Utiliser `frontend-design` skill pour TOUS les nouveaux composants UI.

---

## PHASES D'IMPLEMENTATION

### Phase 1: Extraction des composants partages

**Objectif** : Extraire de `MonMoisClient.tsx` les blocs reutilisables en composants/modules separes. L'app reste 100% fonctionnelle — ZERO changement de comportement.

**Actions** :

1. Lire `MonMoisClient.tsx` en entier pour comprendre la structure
2. Creer `lib/month-utils.ts` — extraire `parseMonth`, `monthLabel`, `prevMonth`, `nextMonth`, `currentMonthKey` (lignes 20-50)
3. Creer `lib/constants.ts` — extraire `STATUS_LABELS`, `STATUS_STYLES`, `GROUP_ORDER`, `GROUP_LABELS`, `SOURCE_META` (lignes 52-82)
4. Creer `components/MonthNavigator.tsx` — extraire le header navigation mois (lignes 162-218). Props: `{ month: string, basePath: string }`
5. Creer `components/ExpenseTrackingRow.tsx` — extraire `ExpenseRow` (lignes 702-774). Props: `{ expense, isCurrentMonth, onAction }`
6. Creer `components/IncomeTrackingRow.tsx` — extraire `IncomeInstanceRow` (lignes 572-644) + `VariableIncomeRow` (lignes 648-698)
7. Creer `components/AdhocExpenseModal.tsx` — extraire `AdhocModal` (lignes 778-851). Props: `{ sections, month, onClose }`
8. Verifier `npm run build` passe sans erreur

**Success Criteria** :

- [ ] Les 6 fichiers sont crees avec le bon code extrait
- [ ] `npm run build` passe sans erreur TypeScript
- [ ] L'app fonctionne identiquement (aucun changement visible)

---

### Phase 2: Pages de suivi mensuel (/depenses, /revenus, /projets)

**Objectif** : Transformer les 3 pages principales en suivi mensuel + enrichir les projets.

**Actions (2A — /depenses)** :

1. Rewriter `app/depenses/page.tsx` comme server component avec le pattern :
   ```
   generateMonthlyExpenses(month) → autoMarkOverdue → autoMarkPaidForAutoDebit
   getMonthlyExpenses(month) + getMonthSummary(month) + getSections()
   → <DepensesTrackingClient>
   ```
   Supporter `?month=YYYY-MM` via searchParams.
2. Creer `components/DepensesTrackingClient.tsx` avec :
   - `<MonthNavigator basePath="/depenses" />`
   - Hero card : Total attendu / Paye / Reste a payer + progress bar + badge overdue
   - Filtres section (pills horizontales scrollables)
   - Groupes par statut : OVERDUE → UPCOMING → DEFERRED → PAID
   - Actions par depense : Marquer paye / Reporter / Remettre a venir
   - FAB adhoc (mois courant uniquement) + `<AdhocExpenseModal>`
3. Verifier `npm run build`

**Actions (2B — /revenus)** :

4. Creer `components/AdhocIncomeModal.tsx` — formulaire : nom, montant, source
5. Ajouter `createAdhocIncome()` dans `lib/actions/incomes.ts` (pattern identique a `createAdhocExpense` dans expenses.ts L247-271)
6. Rewriter `app/revenus/page.tsx` avec `generateMonthlyIncomes(month) → <RevenusTrackingClient>`
7. Creer `components/RevenusTrackingClient.tsx` avec :
   - `<MonthNavigator basePath="/revenus" />`
   - Hero card : Revenus attendus vs Recus + progress
   - Liste COMPLETE revenus : `IncomeInstanceRow` + `VariableIncomeRow`
   - Modal "Marquer recu"
   - FAB "Revenu ponctuel" + `<AdhocIncomeModal>`
8. Verifier `npm run build`

**Actions (2C — /projets)** :

9. Creer `components/ProjectModal.tsx` — formulaire simplifie (nom, type Projet/Epargne, objectif, date cible, section, montant initial)
10. Creer `components/AddSavingsModal.tsx` — mini modal pour incrementer saved_amount
11. Rewriter `app/projets/page.tsx` avec `getPlannedExpenses() + getSections() → <ProjetsEpargneClient>`
12. Creer `components/ProjetsEpargneClient.tsx` avec :
    - Header "Projets & Epargne" + total epargne global
    - Overview cards (projets actifs + epargne libre)
    - Section "Mes projets" (PLANNED avec target_amount > 0) : progress bars, %, suggestion mensuelle
    - Section "Epargne libre" (PLANNED avec target_amount=NULL) : montant cumule
    - FAB creer projet/epargne
13. Verifier `npm run build`

**Success Criteria** :

- [ ] `/depenses` affiche le suivi mensuel avec navigation mois, filtres section, groupes par statut
- [ ] `/depenses` : les actions Marquer paye / Reporter fonctionnent
- [ ] `/depenses` : FAB adhoc cree une depense ponctuelle (mois courant)
- [ ] `/revenus` affiche le suivi mensuel avec liste revenus, progress
- [ ] `/revenus` : Marquer recu fonctionne
- [ ] `/revenus` : FAB ajoute un revenu ponctuel
- [ ] `/projets` affiche overview, projets avec progress, epargne libre
- [ ] `/projets` : creer projet et epargne libre fonctionne
- [ ] `/projets` : ajouter epargne a un projet existant fonctionne
- [ ] `npm run build` passe sans erreur

---

### Phase 3: Accueil = Overview du mois avec 3 tabs

**Objectif** : Remplacer le dashboard ET absorber Mon Mois dans `/` avec 3 sous-tabs.

**Actions** :

1. Creer `components/accueil/TabTableauDeBord.tsx` — 5 cartes : Revenus, Depenses, Solde, Reste a payer, Epargne (avec liens vers les pages dediees)
2. Creer `components/accueil/TabTimeline.tsx` — vue chronologique jour par jour (fusionner depenses + revenus)
3. Creer `components/accueil/TabSanteFinanciere.tsx` — score de sante, alertes prioritaires, reste a vivre
4. Creer `components/AccueilClient.tsx` — shell avec MonthNavigator + tab strip (3 pills) + rendu conditionnel
5. Rewriter `app/page.tsx` — server component qui fetch tout (generateMonthlyExpenses, generateMonthlyIncomes, getMonthSummary, getMonthlyIncomeSummary, getPlannedExpenses, getMonthlySummaryBySection) et passe a `<AccueilClient>`
6. Verifier `npm run build`

**Success Criteria** :

- [ ] `/` affiche 3 tabs (Tableau de bord, Timeline, Sante)
- [ ] Tab Tableau de bord : 5 cartes avec donnees reelles
- [ ] Tab Timeline : evenements tries chronologiquement
- [ ] Tab Sante : score, alertes, reste a vivre
- [ ] Navigation mois fonctionne sur `/`
- [ ] `npm run build` passe sans erreur

---

### Phase 4: Reglages + Nav + Nettoyage

**Objectif** : Deplacer templates dans Reglages, BottomNav 5 tabs, supprimer fichiers obsoletes.

**Actions** :

1. Creer `components/ExpenseTemplateManager.tsx` — adapte de DepensesClient.tsx : groupes par section, edit/delete via ExpenseModal, collapsible. Filtre : RECURRING + ONE_TIME seulement (exclut PLANNED).
2. Creer `components/IncomeTemplateManager.tsx` — adapte de RevenusClient.tsx : liste avec badges source, edit/delete via IncomeModal.
3. Etendre `components/ParametresClient.tsx` — ajouter "Mes charges fixes" + "Mes revenus recurrents" apres section Gestion. Retirer lien `/revenus` des NAV_ITEMS.
4. Etendre `app/parametres/page.tsx` — ajouter fetching : `getExpenses()`, `getSections()`, `getCards()`, `getIncomes()`.
5. Rewriter `components/BottomNav.tsx` — 5 tabs : Accueil(/), Depenses(/depenses), Revenus(/revenus), Projets(/projets), Reglages(/parametres). Supprimer Mon Mois et Cash Flow.
6. Ajouter revalidation paths :
   - `lib/actions/monthly-expenses.ts` : ajouter `revalidatePath('/depenses')` et `revalidatePath('/')` dans markAsPaid, markAsDeferred, markAsUpcoming
   - `lib/actions/monthly-incomes.ts` : ajouter `revalidatePath('/revenus')` et `revalidatePath('/')` dans markIncomeReceived, markVariableIncomeReceived
   - `lib/actions/expenses.ts` : ajouter `revalidatePath('/parametres')` et `revalidatePath('/projets')` dans createExpense, updateExpense, deleteExpense
   - `lib/actions/incomes.ts` : ajouter `revalidatePath('/parametres')` dans createIncome, updateIncome, deleteIncome
7. Supprimer fichiers obsoletes :
   - `app/cash-flow/page.tsx`
   - `components/CashFlowClient.tsx`
   - `lib/actions/cash-flow.ts`
   - `app/mon-mois/` (dossier entier)
   - `components/MonMoisClient.tsx`
   - `components/DepensesClient.tsx`
   - `components/RevenusClient.tsx`
   - `components/ProjetsClient.tsx`
   - `components/ProjetsWidget.tsx`
   - `components/ResteAVivreWidget.tsx`
8. Supprimer tests automatises :
   - `tests/` (dossier entier)
   - `playwright.config.ts`
   - `test-results/` (si existe)
   - `playwright-report/` (si existe)
9. Verifier `npm run build` passe sans erreur
10. Deployer sur Vercel : `vercel deploy --prod`

**Success Criteria** :

- [ ] BottomNav : exactement 5 tabs (Accueil, Depenses, Revenus, Projets, Reglages)
- [ ] `/parametres` : sections "Mes charges fixes" et "Mes revenus recurrents" avec CRUD complet
- [ ] `/cash-flow` → 404
- [ ] `/mon-mois` → 404
- [ ] Aucun fichier obsolete ne reste
- [ ] `tests/` et `playwright.config.ts` supprimes
- [ ] `npm run build` passe sans erreur
- [ ] Deploiement Vercel production OK

---

## SELF-CORRECTION LOOP (Workflow d'iteration)

Apres chaque modification :

### 1. Test Build

```bash
npm run build
```

### 2. Si erreurs TypeScript

- Lire les erreurs (fichier, ligne, type d'erreur)
- Identifier la cause (import manquant, type incorrect, prop manquante)
- Corriger le fichier concerne
- Re-run `npm run build`
- Repeter jusqu'a zero erreur

### 3. Si build passe — Verification visuelle via Playwright MCP

Utiliser les outils Playwright MCP pour verifier manuellement chaque page :

```
# Verifier chaque page
browser_navigate → http://localhost:3000/depenses
browser_snapshot → verifier la structure (hero card, filtres, groupes statut)

browser_navigate → http://localhost:3000/revenus
browser_snapshot → verifier la structure (hero card, liste revenus, progress)

browser_navigate → http://localhost:3000/projets
browser_snapshot → verifier la structure (overview, projets, epargne libre)

browser_navigate → http://localhost:3000/
browser_snapshot → verifier les 3 tabs (Tableau de bord, Timeline, Sante)

browser_navigate → http://localhost:3000/parametres
browser_snapshot → verifier les sections templates

# Verifier les 404
browser_navigate → http://localhost:3000/cash-flow → doit etre 404
browser_navigate → http://localhost:3000/mon-mois → doit etre 404
```

### 4. Si problemes visuels/fonctionnels

- Identifier le composant concerne
- Lire le code source du composant
- Corriger (style, logique, props)
- Re-build + re-verifier

### 5. Verifier les interactions

```
# Sur /depenses : cliquer "Marquer paye" sur une depense
browser_click → bouton action
browser_snapshot → verifier que le statut change

# Sur /revenus : cliquer "Marquer recu"
browser_click → bouton action
browser_snapshot → verifier la mise a jour

# Sur /projets : cliquer FAB + creer un projet
browser_click → FAB
browser_snapshot → verifier le modal
```

### 6. Determiner l'action suivante

- Si **TOUS les criteres de sortie** sont remplis → Output `<promise>UX_RESTRUCTURE_COMPLETE</promise>`
- Si **PAS tous remplis** → identifier ce qui manque → corriger → re-tester
- Si **bloque apres 25 iterations** → suivre l'escape hatch

---

## COMPLETION CRITERIA (Conditions de sortie)

Output `<promise>UX_RESTRUCTURE_COMPLETE</promise>` **SEULEMENT** quand **TOUTES** ces conditions sont remplies :

### A. Build & Deploy

- [ ] `npm run build` passe sans erreur TypeScript
- [ ] Deploiement Vercel production reussi

### B. Navigation

- [ ] BottomNav affiche exactement 5 tabs : Accueil, Depenses, Revenus, Projets, Reglages
- [ ] Chaque tab navigue vers la bonne route
- [ ] Active state fonctionne sur chaque tab

### C. Page /depenses (suivi mensuel)

- [ ] Hero card avec Total attendu / Paye / Reste a payer + progress bar
- [ ] Filtres section (pills) fonctionnels
- [ ] Groupes par statut : OVERDUE, UPCOMING, DEFERRED, PAID
- [ ] Actions depense : Marquer paye, Reporter, Remettre a venir
- [ ] Navigation mois (fleches prev/next, ?month=YYYY-MM)
- [ ] FAB adhoc cree une depense ponctuelle

### D. Page /revenus (suivi mensuel)

- [ ] Hero card Revenus attendus vs Recus + progress
- [ ] Liste complete des revenus (IncomeInstanceRow + VariableIncomeRow)
- [ ] Action "Marquer recu" fonctionne
- [ ] Navigation mois fonctionne
- [ ] FAB revenu ponctuel fonctionne

### E. Page /projets (Projets & Epargne)

- [ ] Header "Projets & Epargne" + total epargne global
- [ ] Overview cards (projets actifs + epargne libre)
- [ ] Section projets avec progress bars, %, suggestion mensuelle
- [ ] Section epargne libre avec montant cumule
- [ ] FAB creer projet/epargne fonctionne
- [ ] Ajouter epargne a un projet existant fonctionne

### F. Page / (Accueil = Mon Mois)

- [ ] 3 tabs visibles : "Tableau de bord", "Timeline", "Sante"
- [ ] Tab switch fonctionne (cliquer change le contenu)
- [ ] Tab Tableau de bord : 5 cartes avec donnees reelles
- [ ] Tab Timeline : evenements chronologiques
- [ ] Tab Sante : score, alertes, reste a vivre
- [ ] Navigation mois fonctionne

### G. Page /parametres (Templates)

- [ ] Section "Mes charges fixes" avec liste depenses RECURRING/ONE_TIME groupees par section
- [ ] Section "Mes revenus recurrents" avec liste revenus
- [ ] CRUD complet (creer, modifier, supprimer un template)

### H. Nettoyage

- [ ] `/cash-flow` retourne 404
- [ ] `/mon-mois` retourne 404
- [ ] Aucun fichier obsolete : MonMoisClient.tsx, DepensesClient.tsx, RevenusClient.tsx, ProjetsClient.tsx, ProjetsWidget.tsx, ResteAVivreWidget.tsx, CashFlowClient.tsx — tous supprimes
- [ ] `tests/` dossier supprime
- [ ] `playwright.config.ts` supprime
- [ ] Aucun import casse (pas de reference a des fichiers supprimes)

### I. Qualite

- [ ] Zero erreur console sur chaque page
- [ ] Zero placeholder ("TODO", "Coming soon")
- [ ] Code propre, pas de code commente inutile
- [ ] Tous les composants utilisent le design system existant (CSS variables)

**QUAND TOUTES CES CONDITIONS SONT REMPLIES :**

```
<promise>UX_RESTRUCTURE_COMPLETE</promise>
```

---

## ESCAPE HATCH (Si bloque apres 25 iterations)

Si apres 25 iterations, les conditions ne sont PAS toutes remplies :

### 1. Documenter les blockers

Creer `restructuration-blockers.md` :

```markdown
## BLOCKERS REPORT

### Conditions non remplies
- [x] Condition X.Y: [description] → Error: [message]

### Tentatives effectuees
1. Iteration N: [ce qui a ete tente]
2. Iteration N+2: [ce qui a ete tente]

### Causes probables
- [Issue]: [pourquoi ca bloque]

### Approches alternatives
1. [Approche 1]: [description]
2. [Approche 2]: [description]

### Recommandations
- [Action pour le dev humain]
```

### 2. Output

```
<promise>BLOCKED</promise>
```

---

## NOTES TECHNIQUES

- **Design system** : Utiliser les CSS variables existantes (--accent, --positive, --warning, --text-primary, etc.). Ne PAS hardcoder les couleurs.
- **Inline styles** : Le projet utilise des inline styles (pas Tailwind classes). Suivre cette convention.
- **Server vs Client** : Les `page.tsx` sont des Server Components (pas de 'use client'). Les composants interactifs sont des Client Components avec 'use client'.
- **Pattern MonMoisClient** : Le pattern de `app/mon-mois/page.tsx` (generate → fetch → render) est LE pattern a reproduire pour `/depenses` et `/revenus`.
- **Projets = PLANNED expenses** : Les projets sont des `expenses` avec `type='PLANNED'`. Epargne libre = PLANNED avec `target_amount=NULL`.
- **Revalidation** : Chaque server action doit `revalidatePath()` les routes concernees.
- **Navigation mois** : Utiliser `searchParams.month` (format YYYY-MM) pour la navigation entre les mois.
- **Pas de tests automatises** : Ne PAS creer de fichiers .spec.ts. Verification manuelle via Playwright MCP.
- **Skill frontend-design** : Utiliser ce skill pour tous les nouveaux composants visuels.
- **Imports** : Apres chaque suppression de fichier, verifier qu'aucun autre fichier ne l'importe encore.

---

## CRITERES DE SUCCES FINAL

✅ **`npm run build` zero erreur**
✅ **5 tabs dans la nav** (Accueil, Depenses, Revenus, Projets, Reglages)
✅ **`/depenses` = suivi mensuel** (groupes par statut, filtres, FAB adhoc)
✅ **`/revenus` = suivi mensuel** (attendu vs recu, FAB ponctuel)
✅ **`/projets` = Projets & Epargne** (progress, epargne libre, overview)
✅ **`/` = Mon Mois avec 3 tabs** (Tableau de bord, Timeline, Sante)
✅ **`/parametres` = Templates CRUD** (charges fixes + revenus recurrents)
✅ **Fichiers obsoletes supprimes** (MonMoisClient, CashFlow, tests/)
✅ **Deploy Vercel production OK**
✅ **Zero erreur console, zero placeholder**

**Output final :**

```
<promise>UX_RESTRUCTURE_COMPLETE</promise>
```
