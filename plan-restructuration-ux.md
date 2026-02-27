# Plan : Restructuration UX Mon Budget

## Executive Summary

**Objectif** : Reorganiser l'UX de Mon Budget pour que la navigation corresponde au modele mental de l'utilisateur — voir le suivi mensuel (depenses, revenus) directement dans les pages principales, pas les definitions/templates.

**Probleme** : L'app melange templates et suivi. `/depenses` montre des definitions de charges, pas ce qui est paye/a venir ce mois. `/revenus` montre des templates, pas les revenus recus. `/mon-mois` concentre tout le suivi dans une seule page surchargee (852 lignes). `/cash-flow` est redondant. Le dashboard ne sert a rien si Mon Mois existe.

**Approche** : Redistribuer le contenu de `MonMoisClient.tsx` dans des pages dediees, fusionner Accueil et Mon Mois, deplacer les templates dans Reglages, enrichir la page Projets.

**Impact** : ~17 fichiers crees, ~11 modifies, ~9 supprimes. Zero changement de schema DB.

---

## 1. Etat Actuel

### Routes existantes (11 routes)

| Route | Page server | Client component | Role actuel |
|-------|------------|------------------|-------------|
| `/` | `app/page.tsx` (377L) | Widgets inline | Dashboard avec widgets (total, sections, alertes) |
| `/depenses` | `app/depenses/page.tsx` (16L) | `DepensesClient.tsx` (327L) | CRUD templates depenses groupes par section |
| `/mon-mois` | `app/mon-mois/page.tsx` (57L) | `MonMoisClient.tsx` (851L) | Suivi mensuel complet (depenses + revenus + solde) |
| `/revenus` | `app/revenus/page.tsx` (14L) | `RevenusClient.tsx` | CRUD templates revenus |
| `/cash-flow` | `app/cash-flow/page.tsx` | `CashFlowClient.tsx` | Entrees - Sorties = Solde (redondant avec Mon Mois) |
| `/projets` | `app/projets/page.tsx` (55L) | `ProjetsClient.tsx` | Liste projets PLANNED avec progress bars |
| `/parametres` | `app/parametres/page.tsx` (10L) | `ParametresClient.tsx` (252L) | Reglages + liens navigation |
| `/sections` | `app/sections/page.tsx` | `SectionsClient.tsx` | CRUD sections |
| `/cartes` | `app/cartes/page.tsx` | `CartesClient.tsx` | CRUD cartes bancaires |
| `/cartes/[id]` | `app/cartes/[id]/page.tsx` | `CarteDetailClient.tsx` | Detail depenses par carte |
| `/depenses/[id]/edit` | `app/depenses/[id]/edit/page.tsx` | | Edition depense inline |

### Navigation actuelle (BottomNav.tsx — 6 tabs)

1. Accueil `/` — icone maison
2. Depenses `/depenses` — icone carte
3. Mon mois `/mon-mois` — icone calendrier
4. Revenus `/revenus` — icone dollar
5. Cash Flow `/cash-flow` — icone fleches
6. Reglages `/parametres` — icone engrenage

### MonMoisClient.tsx — Le monolithe (851 lignes)

Ce fichier concentre TOUT le suivi mensuel. Blocs principaux :

| Lignes | Bloc | Reutilisable ? |
|--------|------|----------------|
| 20-50 | Utilitaires mois (`parseMonth`, `monthLabel`, `prevMonth`, `nextMonth`) | Oui → `lib/month-utils.ts` |
| 52-82 | Constantes (`STATUS_LABELS`, `STATUS_STYLES`, `GROUP_ORDER`, `SOURCE_META`) | Oui → `lib/constants.ts` |
| 162-218 | Navigation mois (header avec fleches prev/next) | Oui → `components/MonthNavigator.tsx` |
| 220-273 | Hero SOLDE + Progress bar | Oui → reutilise dans Accueil |
| 275-327 | Bloc ENTREES (revenus preview, limite a 3) | Oui → `/revenus` complet |
| 330-371 | Filtres section (pills horizontales) | Oui → `/depenses` |
| 386-434 | Groupes depenses par statut (OVERDUE→UPCOMING→DEFERRED→PAID) | Oui → `/depenses` |
| 451-565 | Modals (all incomes, receive, group detail, adhoc) | Oui → distribues |
| 572-643 | `IncomeInstanceRow` (revenu fixe avec badge statut) | Oui → composant partage |
| 648-697 | `VariableIncomeRow` (revenu variable) | Oui → composant partage |
| 702-773 | `ExpenseRow` (depense avec actions expandable) | Oui → composant partage |
| 778-851 | `AdhocModal` (ajout depense ponctuelle) | Oui → composant partage |

### Modele de donnees projets/epargne

Utilise le type `PLANNED` dans la table `expenses` :
- `target_amount: number | null` — objectif financier (NULL = epargne libre)
- `target_date: string | null` — date cible (optionnel)
- `saved_amount: number | null` — montant epargne cumule

Actions existantes : `getPlannedExpenses()`, `updateSavedAmount()`, `createExpense({ type: 'PLANNED' })`.

### Tests automatises existants (21 fichiers .spec.ts)

```
tests/phase1/          → 10 fichiers (setup, nav, dashboard, sections, cartes, expenses, pwa)
tests/phase1-complement/ → 1 fichier (mon-mois)
tests/phase2/          → 4 fichiers (revenus, cartes-detail, mon-mois-history, planned-projets)
tests/phase4/          → 6 fichiers (solde, revenus-ui, entrees, adhoc, cash-flow x2)
```

---

## 2. Etat Futur

### Structure cible

| Route | Contenu | Tab nav |
|-------|---------|---------|
| `/` | Overview du mois avec 3 sous-tabs (Tableau de bord, Timeline, Sante) | Accueil |
| `/depenses` | Suivi depenses du mois courant (paye/a venir/en retard + FAB adhoc) | Depenses |
| `/revenus` | Suivi revenus du mois courant (attendu vs recu + FAB ponctuel) | Revenus |
| `/projets` | Projets & Epargne (objectifs + epargne libre + overview) | Projets |
| `/parametres` | Reglages + Mes charges fixes + Mes revenus recurrents | Reglages |

**BottomNav : 5 tabs** (au lieu de 6)

Pages supprimees : `/cash-flow`, `/mon-mois`
Pages inchangees : `/cartes`, `/cartes/[id]`, `/sections`, `/depenses/[id]/edit`

### Criteres de succes mesurables

- [ ] `npm run build` passe sans erreur TypeScript
- [ ] 5 tabs dans BottomNav (mobile et desktop)
- [ ] `/` affiche overview du mois avec 3 tabs fonctionnels
- [ ] `/depenses` affiche suivi mensuel avec navigation mois, filtres section, groupes par statut, FAB adhoc
- [ ] `/revenus` affiche suivi mensuel avec liste revenus, marquer recu, FAB ponctuel
- [ ] `/projets` affiche projets avec progress + epargne libre + overview total
- [ ] `/parametres` contient sections "Mes charges fixes" et "Mes revenus recurrents" avec CRUD
- [ ] `/cash-flow` et `/mon-mois` → 404
- [ ] Toutes les actions fonctionnent (marquer paye, marquer recu, ajouter adhoc, creer projet, ajouter epargne)
- [ ] Zero erreur console sur chaque page

---

## 3. Gap Analysis

| # | Gap | Etat actuel | Etat futur | Comment combler |
|---|-----|-------------|------------|-----------------|
| G1 | MonMoisClient monolithique | 851L tout-en-un | Composants partages reutilisables | Extraire utilitaires, constantes, composants |
| G2 | `/depenses` = templates | CRUD definitions depenses | Suivi mensuel (paye/a venir/retard) | Rewrite page + nouveau DepensesTrackingClient |
| G3 | `/revenus` = templates | CRUD definitions revenus | Suivi mensuel (attendu vs recu) | Rewrite page + nouveau RevenusTrackingClient |
| G4 | `/projets` basique | Liste progress bars seulement | Projets & Epargne enrichi | Rewrite avec overview, epargne libre, modals dediees |
| G5 | Dashboard et Mon Mois redondants | 2 pages separees | Fusionner dans `/` avec 3 tabs | Rewrite `app/page.tsx` + AccueilClient avec tabs |
| G6 | Cash Flow inutile | Page dediee | Supprime | Supprimer fichiers |
| G7 | Templates inaccessibles | Accessibles via `/depenses` et `/revenus` | Deplacees dans Reglages | Etendre ParametresClient + nouveaux managers |
| G8 | Nav surchargee | 6 tabs | 5 tabs pertinents | Rewrite BottomNav |
| G9 | Tests automatises non voulus | 21 fichiers .spec.ts | Supprimes | Supprimer dossier tests/ + config playwright |
| G10 | Revalidation paths incomplets | Certaines actions ne revalidatent pas les nouvelles routes | Toutes les actions revalidatent les bonnes routes | Ajouter revalidatePath() manquants |

---

## 4. Impact Analysis

### Fichiers impactes par blast radius

**Haute criticite** (coeur de l'app) :
- `components/MonMoisClient.tsx` — source de toutes les extractions, supprime apres
- `app/page.tsx` — rewrite complet (dashboard → accueil)
- `components/BottomNav.tsx` — change la nav de toute l'app

**Criticite moyenne** (pages individuelles) :
- `app/depenses/page.tsx` — rewrite (templates → suivi)
- `app/revenus/page.tsx` — rewrite (templates → suivi)
- `app/projets/page.tsx` — rewrite (enrichi)
- `app/parametres/page.tsx` — etendu (+ templates)
- `components/ParametresClient.tsx` — etendu

**Faible criticite** (actions server) :
- `lib/actions/monthly-expenses.ts` — ajout revalidatePath
- `lib/actions/monthly-incomes.ts` — ajout revalidatePath
- `lib/actions/expenses.ts` — ajout revalidatePath
- `lib/actions/incomes.ts` — ajout revalidatePath + createAdhocIncome

### Dependances

```
MonMoisClient.tsx (851L)
  ├── Utilitaires mois → lib/month-utils.ts (NOUVEAU)
  ├── Constantes → lib/constants.ts (NOUVEAU)
  ├── MonthNavigator → components/MonthNavigator.tsx (NOUVEAU)
  ├── ExpenseRow → components/ExpenseTrackingRow.tsx (NOUVEAU)
  ├── IncomeInstanceRow + VariableIncomeRow → components/IncomeTrackingRow.tsx (NOUVEAU)
  ├── AdhocModal → components/AdhocExpenseModal.tsx (NOUVEAU)
  ├── Bloc SORTIES → DepensesTrackingClient.tsx (NOUVEAU)
  ├── Bloc ENTREES → RevenusTrackingClient.tsx (NOUVEAU)
  └── Bloc SOLDE + Overview → AccueilClient.tsx (NOUVEAU)
```

---

## 5. Scope

### IN SCOPE

- Reorganisation UX (redistribution du contenu existant)
- Extraction de MonMoisClient en composants
- Nouvelle page Projets & Epargne enrichie
- Templates dans Reglages
- BottomNav 6→5 tabs
- Suppression Cash Flow et Mon Mois
- Suppression de TOUS les tests automatises (.spec.ts + config Playwright)
- Ajout revalidatePath manquants

### OUT SCOPE

- Changement de schema DB
- Pre-financement (reporte)
- Authentification
- Nouvelles fonctionnalites non mentionnees
- Redesign visuel (on garde le design system actuel)
- Nouvelles notifications
- Export CSV / historique

---

## 6. Assumptions

| # | Assumption | Risque si faux | Validation |
|---|-----------|---------------|------------|
| A1 | Le schema DB actuel supporte tout | Il manque peut-etre des champs | Verifier types.ts vs DB schema |
| A2 | PLANNED avec target_amount=NULL = epargne libre | Confusion possible dans le code existant | Tester createExpense avec target_amount=null |
| A3 | Les server actions existantes sont correctes | Bugs caches | Tester manuellement chaque action |
| A4 | Le design system CSS actuel suffit | Il faudra peut-etre des nouveaux styles | Adapter si necessaire |

---

## 7. Pre-Mortem

| Scenario d'echec | Probabilite | Prevention |
|-----------------|-------------|------------|
| MonMoisClient extraction casse l'app existante | Moyenne | Phase 1 = extraction PURE, zero modif fonctionnelle. Tester que l'app marche encore avant Phase 2 |
| Donnees manquantes sur les nouvelles pages | Faible | Reutiliser exactement les memes queries SQL que MonMoisClient |
| Revalidation paths oublies → donnees stale | Moyenne | Lister systematiquement toutes les actions et leurs paths dans Phase 4 |
| Confusion entre template PLANNED (projet) et expense PLANNED | Faible | Filtrer par target_amount pour distinguer projet vs epargne |
| Build casse entre les phases | Haute | Verifier `npm run build` apres CHAQUE phase |

---

## 8. Rollback Strategy

Chaque phase est un commit git separe. Rollback = `git revert` du commit de la phase.

| Phase | Point de rollback |
|-------|-------------------|
| Phase 1 (extraction) | Revert supprime les nouveaux fichiers, aucun impact |
| Phase 2 (depenses + revenus + projets) | Revert restaure les anciennes pages |
| Phase 3 (accueil) | Revert restaure le dashboard original |
| Phase 4 (reglages + nav + nettoyage) | Revert restaure l'ancienne nav et les anciens fichiers |

---

## 9. Implementation Plan

### Phase 1 : Extraction des composants partages

**Objectif** : Extraire de MonMoisClient.tsx les blocs reutilisables. L'app reste 100% fonctionnelle — ZERO modif de comportement.

**Checkpoint** : `npm run build` passe, l'app fonctionne identiquement.

| Fichier a creer | Source (MonMoisClient lignes) | Contenu |
|-----------------|------------------------------|---------|
| `lib/month-utils.ts` | L20-50 | `parseMonth`, `monthLabel`, `prevMonth`, `nextMonth`, `currentMonthKey` |
| `lib/constants.ts` | L52-82 | `STATUS_LABELS`, `STATUS_STYLES`, `GROUP_ORDER`, `GROUP_LABELS`, `SOURCE_META` |
| `components/MonthNavigator.tsx` | L162-218 | Header navigation mois. Props: `{ month, basePath }` |
| `components/ExpenseTrackingRow.tsx` | L702-774 | Ligne depense avec actions expandable. Props: `{ expense, isCurrentMonth, onAction }` |
| `components/IncomeTrackingRow.tsx` | L572-697 | `IncomeInstanceRow` + `VariableIncomeRow` |
| `components/AdhocExpenseModal.tsx` | L778-851 | Modal ajout depense ponctuelle. Props: `{ sections, month, onClose }` |

---

### Phase 2 : Pages de suivi mensuel (`/depenses`, `/revenus`, `/projets`)

**Objectif** : Transformer les 3 pages en suivi mensuel et enrichir les projets.

**Checkpoint** : Chaque page affiche le suivi du mois courant avec navigation mois.

#### 2A — `/depenses` → suivi mensuel

**`app/depenses/page.tsx`** — Rewrite

Pattern identique a `app/mon-mois/page.tsx` actuel :
```
generateMonthlyExpenses(month) → autoMarkOverdue → autoMarkPaidForAutoDebit
getMonthlyExpenses(month) + getMonthSummary(month) + getSections()
→ <DepensesTrackingClient>
```
Supporte `?month=YYYY-MM` via searchParams.

**`components/DepensesTrackingClient.tsx`** — Nouveau

Partie depenses extraite de MonMoisClient :
1. `<MonthNavigator basePath="/depenses" />`
2. Hero card : Total attendu / Paye / Reste a payer + progress bar + badge overdue
3. Filtres section (pills horizontales scrollables)
4. Groupes par statut : OVERDUE → UPCOMING → DEFERRED → PAID
5. Chaque groupe : preview 3 items + "Voir tout" → modal detail
6. Actions par depense : Marquer paye / Reporter / Remettre a venir
7. FAB adhoc (mois courant uniquement) + `<AdhocExpenseModal>`

#### 2B — `/revenus` → suivi mensuel

**`app/revenus/page.tsx`** — Rewrite

```
generateMonthlyIncomes(month)
getMonthlyIncomeSummary(month) + getIncomes()
→ <RevenusTrackingClient>
```

**`components/RevenusTrackingClient.tsx`** — Nouveau

1. `<MonthNavigator basePath="/revenus" />`
2. Hero card : Revenus attendus vs Recus + progress (vert/ambre)
3. Liste COMPLETE des revenus (pas de limite a 3) : `IncomeInstanceRow` + `VariableIncomeRow`
4. Modal "Marquer recu" (input montant + confirmation)
5. FAB "Revenu ponctuel" + `<AdhocIncomeModal>`

**`components/AdhocIncomeModal.tsx`** — Nouveau
Formulaire : nom, montant, source. Appelle `createAdhocIncome()`.

**`lib/actions/incomes.ts`** — Ajouter `createAdhocIncome()`
Pattern identique a `createAdhocExpense()` (expenses.ts L247-271) : creer income VARIABLE + inserer dans monthly_incomes comme RECEIVED.

#### 2C — `/projets` → Projets & Epargne (enrichi)

**Concept** :
- **Projet avec objectif** : PLANNED avec target_amount > 0 → progress bar, %, suggestion mensuelle
- **Epargne libre** : PLANNED avec target_amount=NULL → montant cumule, pas de progress bar
- Zero changement schema DB.

**`app/projets/page.tsx`** — Rewrite

```
getPlannedExpenses() + getSections()
→ <ProjetsEpargneClient>
```

**`components/ProjetsEpargneClient.tsx`** — Nouveau (remplace ProjetsClient.tsx)

1. **Header** : "Projets & Epargne" + total epargne global (somme de tous `saved_amount`)
2. **Overview cards** (2 cartes) :
   - Projets actifs : count + total epargne projets + progression moyenne
   - Epargne libre : total epargne sans objectif
3. **Section "Mes projets"** : PLANNED avec target_amount > 0
   - Chaque projet : nom, progress bar, saved/target, %, suggestion mensuelle (via `calcMonthlySuggested()`), bouton "Ajouter"
4. **Section "Epargne libre"** : PLANNED avec target_amount=NULL
   - Chaque epargne : nom, montant cumule, bouton "Ajouter"
5. **FAB** : ouvre `<ProjectModal>` (choix Projet ou Epargne)

**`components/ProjectModal.tsx`** — Nouveau
Formulaire simplifie :
- Nom
- Type : Projet (avec objectif) | Epargne libre (toggle)
- Si Projet : objectif ($), date cible (optionnel)
- Section (optionnel)
- Montant initial (optionnel, defaut 0)
- Appelle `createExpense({ type: 'PLANNED', target_amount: ..., saved_amount: ... })`

**`components/AddSavingsModal.tsx`** — Nouveau
Mini modal pour incrementer :
- Affiche nom + montant actuel
- Input : montant a ajouter
- Appelle `updateSavedAmount(id, currentSaved + newAmount)`

---

### Phase 3 : Accueil = Overview du mois avec 3 tabs

**Objectif** : Remplacer le dashboard ET absorber Mon Mois dans `/`.

**Checkpoint** : `/` affiche 3 tabs fonctionnels, navigation mois ok.

**`app/page.tsx`** — Rewrite complet

Server component qui fait le meme fetching que `app/mon-mois/page.tsx` actuel, plus :
- `getMonthlyIncomeTotal()`
- `getMonthlySummaryBySection()`
- `getPlannedExpenses()` (pour le widget epargne)

Passe tout a `<AccueilClient>`.

**`components/AccueilClient.tsx`** — Nouveau (shell avec tabs)

Props : `summary`, `incomeSummary`, `expenses`, `monthlyIncomes`, `month`, `totalMonthlyExpenses`, `projets`

Structure :
1. `<MonthNavigator basePath="/" />`
2. **Tab strip** (3 pills horizontales) : "Tableau de bord" | "Timeline" | "Sante"
3. Rendu conditionnel du tab actif

**`components/accueil/TabTableauDeBord.tsx`**

5 cartes :
- **Revenus** : attendus/recus + progress + lien `/revenus`
- **Depenses** : attendues/payees + progress + badge overdue + lien `/depenses`
- **Solde du mois** : revenus recus - depenses payees (vert/rouge)
- **Reste a payer** : resume de ce qui reste ce mois
- **Epargne** : total epargne + projets actifs count + lien `/projets`

**`components/accueil/TabTimeline.tsx`**

Vue chronologique :
1. Fusionner depenses (par `due_date`) et revenus (par `received_at` ou jour 1)
2. Grouper par jour, trier chronologiquement
3. Timeline verticale avec badge statut par ligne

**`components/accueil/TabSanteFinanciere.tsx`**

3 sections :
1. **Score de sante** : gauge (% charges couvertes par revenus recus)
2. **Alertes prioritaires** : OVERDUE count + gros montants a venir
3. **Reste a vivre** : theorique (templates) + actuel (recu - paye)

---

### Phase 4 : Reglages + Nav + Nettoyage

**Objectif** : Deplacer templates dans Reglages, mettre a jour la nav, supprimer les pages/fichiers obsoletes.

**Checkpoint** : 5 tabs dans la nav, templates dans Reglages, `/cash-flow` et `/mon-mois` → 404.

#### Templates dans Reglages

**`components/ExpenseTemplateManager.tsx`** — Nouveau
Adapte de `DepensesClient.tsx` : groupes par section, edit/delete via ExpenseModal, sections collapsibles.
Filtre : uniquement les expenses avec type RECURRING ou ONE_TIME (exclut PLANNED).

**`components/IncomeTemplateManager.tsx`** — Nouveau
Adapte de `RevenusClient.tsx` : liste avec badges source, edit/delete via IncomeModal.

**`components/ParametresClient.tsx`** — Etendre
Ajouter 2 sections apres "Gestion" :
- "Mes charges fixes" → `<ExpenseTemplateManager>`
- "Mes revenus recurrents" → `<IncomeTemplateManager>`
Retirer le lien `/revenus` dans NAV_ITEMS.

**`app/parametres/page.tsx`** — Etendre
Ajouter fetching : `getExpenses()`, `getSections()`, `getCards()`, `getIncomes()`.

#### BottomNav 6 → 5 tabs

**`components/BottomNav.tsx`** — Rewrite

| # | Label | Route | Icone |
|---|-------|-------|-------|
| 1 | Accueil | `/` | Maison |
| 2 | Depenses | `/depenses` | Carte |
| 3 | Revenus | `/revenus` | Dollar+fleche |
| 4 | Projets | `/projets` | Cible/target |
| 5 | Reglages | `/parametres` | Engrenage |

#### Revalidation paths

| Fichier | revalidatePath a ajouter |
|---------|--------------------------|
| `lib/actions/monthly-expenses.ts` (markAsPaid, markAsDeferred, markAsUpcoming) | `'/depenses'`, `'/'` |
| `lib/actions/monthly-incomes.ts` (markIncomeReceived, markVariableIncomeReceived) | `'/revenus'`, `'/'` |
| `lib/actions/expenses.ts` (createExpense, updateExpense, deleteExpense) | `'/parametres'`, `'/projets'` |
| `lib/actions/incomes.ts` (createIncome, updateIncome, deleteIncome) | `'/parametres'` |

#### Suppressions

| Supprimer | Raison |
|-----------|--------|
| `app/cash-flow/page.tsx` | Page supprimee |
| `components/CashFlowClient.tsx` | Idem |
| `lib/actions/cash-flow.ts` | Idem |
| `app/mon-mois/` (dossier entier) | Fusionne dans `/` |
| `components/MonMoisClient.tsx` | Eclate en composants extraits |
| `components/DepensesClient.tsx` | Remplace par ExpenseTemplateManager + DepensesTrackingClient |
| `components/RevenusClient.tsx` | Remplace par IncomeTemplateManager + RevenusTrackingClient |
| `components/ProjetsClient.tsx` | Remplace par ProjetsEpargneClient |
| `components/ProjetsWidget.tsx` | Integre dans TabTableauDeBord |
| `components/ResteAVivreWidget.tsx` | Integre dans TabSanteFinanciere |

#### Suppression tests automatises

| Supprimer | Raison |
|-----------|--------|
| `tests/` (dossier entier) | Plus de tests automatises |
| `playwright.config.ts` | Plus necessaire |
| `test-results/` | Artefacts de tests |
| `playwright-report/` | Artefacts de tests |

---

## 10. Verification (Tests manuels via Playwright MCP)

Apres chaque phase, verification manuelle via Playwright MCP (browser_navigate + browser_snapshot) :

### Apres Phase 1
- [ ] `npm run build` passe
- [ ] L'app fonctionne identiquement (aucun changement visible)

### Apres Phase 2
- [ ] `/depenses` : naviguer au mois courant, voir les depenses groupees par statut, cliquer "Marquer paye" sur une depense, verifier le badge change
- [ ] `/depenses?month=YYYY-MM` : navigation mois fonctionne (fleches prev/next)
- [ ] `/depenses` : FAB "+" ajoute une depense adhoc (mois courant uniquement)
- [ ] `/revenus` : voir la liste des revenus attendus, marquer un revenu comme recu, verifier le montant mis a jour
- [ ] `/revenus` : FAB ajoute un revenu ponctuel
- [ ] `/projets` : overview affiche total epargne, projets actifs, epargne libre
- [ ] `/projets` : creer un nouveau projet avec objectif, verifier la progress bar
- [ ] `/projets` : creer une epargne libre (sans objectif), verifier l'affichage
- [ ] `/projets` : ajouter une somme a un projet existant, verifier la progression
- [ ] `npm run build` passe

### Apres Phase 3
- [ ] `/` : 3 tabs visibles (Tableau de bord, Timeline, Sante)
- [ ] `/` tab Tableau de bord : 5 cartes (revenus, depenses, solde, reste a payer, epargne)
- [ ] `/` tab Timeline : evenements du mois tries chronologiquement
- [ ] `/` tab Sante : score, alertes, reste a vivre
- [ ] `/` : navigation mois fonctionne
- [ ] `npm run build` passe

### Apres Phase 4
- [ ] BottomNav : exactement 5 tabs (Accueil, Depenses, Revenus, Projets, Reglages)
- [ ] `/parametres` : sections "Mes charges fixes" et "Mes revenus recurrents" visibles
- [ ] `/parametres` : CRUD templates (creer, modifier, supprimer une charge fixe)
- [ ] `/cash-flow` → 404
- [ ] `/mon-mois` → 404
- [ ] Zero erreur console sur chaque page
- [ ] `npm run build` passe
- [ ] Deploy Vercel OK

---

## 11. Resume des fichiers

### A creer (~18 fichiers)

| Fichier | Role |
|---------|------|
| `lib/month-utils.ts` | Utilitaires navigation mois |
| `lib/constants.ts` | Constantes partagees (statuts, styles, sources) |
| `components/MonthNavigator.tsx` | Header navigation mois reutilisable |
| `components/ExpenseTrackingRow.tsx` | Ligne depense avec actions |
| `components/IncomeTrackingRow.tsx` | Lignes revenu (fixe + variable) |
| `components/AdhocExpenseModal.tsx` | Modal ajout depense ponctuelle |
| `components/AdhocIncomeModal.tsx` | Modal ajout revenu ponctuel |
| `components/DepensesTrackingClient.tsx` | Page suivi depenses mensuel |
| `components/RevenusTrackingClient.tsx` | Page suivi revenus mensuel |
| `components/ProjetsEpargneClient.tsx` | Page projets & epargne |
| `components/ProjectModal.tsx` | Modal creation projet/epargne |
| `components/AddSavingsModal.tsx` | Modal ajout montant epargne |
| `components/AccueilClient.tsx` | Shell accueil avec 3 tabs |
| `components/accueil/TabTableauDeBord.tsx` | Tab dashboard overview |
| `components/accueil/TabTimeline.tsx` | Tab timeline chronologique |
| `components/accueil/TabSanteFinanciere.tsx` | Tab sante financiere |
| `components/ExpenseTemplateManager.tsx` | CRUD templates depenses (Reglages) |
| `components/IncomeTemplateManager.tsx` | CRUD templates revenus (Reglages) |

### A modifier (~11 fichiers)

`app/depenses/page.tsx`, `app/revenus/page.tsx`, `app/projets/page.tsx`, `app/page.tsx`, `app/parametres/page.tsx`, `components/BottomNav.tsx`, `components/ParametresClient.tsx`, `lib/actions/monthly-expenses.ts`, `lib/actions/monthly-incomes.ts`, `lib/actions/expenses.ts`, `lib/actions/incomes.ts`

### A supprimer (~13 fichiers/dossiers)

`app/cash-flow/page.tsx`, `components/CashFlowClient.tsx`, `lib/actions/cash-flow.ts`, `app/mon-mois/` (dossier), `components/MonMoisClient.tsx`, `components/DepensesClient.tsx`, `components/RevenusClient.tsx`, `components/ProjetsClient.tsx`, `components/ProjetsWidget.tsx`, `components/ResteAVivreWidget.tsx`, `tests/` (dossier entier), `playwright.config.ts`, `test-results/`, `playwright-report/`
