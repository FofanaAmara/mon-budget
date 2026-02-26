# Plan — Phase 3 : Dépenses Planifiées, Historique & Export
**Projet** : Mon Budget PWA
**Phase PRD** : Phase 3 — "Plus tard"
**Date** : 26 février 2026
**Statut** : En attente de validation

---

## Executive Summary

**En bref** :
- Ajouter sur l'app Phase 2 : dépenses planifiées (objectifs d'épargne), historique mensuel, export de données
- C'est la phase qui complète l'app et réalise le critère PRD n°4 : "planifier un gros achat et savoir combien épargner par mois"
- Livrable : Phase 3 déployée sur Vercel, testée Playwright, app pleinement fonctionnelle selon tous les critères du PRD

**Contexte** : Phases 1 et 2 livrées. Amara peut gérer ses dépenses récurrentes/ponctuelles, ses revenus, recevoir des rappels. Il manque la planification financière à long terme, l'historique et l'export.

**Objectif** : Livrer les 3 fonctionnalités restantes du PRD Phase 3, puis valider l'ensemble de l'app avec une suite Playwright complète sur Vercel.

**Approche** : 3 étapes fonctionnelles (planifiées → historique → export) + tests finaux E2E complets.

**Impact** : ~10 nouveaux fichiers créés, ~3 fichiers existants modifiés (dashboard, formulaire dépense, schema Neon si nécessaire).

> ⚠️ **Convention UI** : Toute implémentation de composants et pages UI doit utiliser le skill `frontend-design`.

---

## Current State

**Description** : Phases 1 et 2 livrées et fonctionnelles sur Vercel.

- CRUD sections, cartes, revenus, dépenses (RECURRING + ONE_TIME) ✅
- Dashboard complet avec "reste à vivre" ✅
- Push + email + SMS + cron Vercel ✅
- Vue par carte ✅
- 22/22 tests Playwright (Phase 1 + Phase 2) verts ✅

**Ce qui manque** :
- Type de dépense PLANNED non implémenté (schema présent mais champs `target_amount`, `target_date`, `saved_amount` inutilisés)
- Aucune vue historique (données passées non consultables)
- Aucun export de données
- Widget "Projets planifiés" absent du dashboard

**Artefacts existants** :
- Projet Next.js 15 déployé sur Vercel
- Supabase : 6 tables opérationnelles
- `lib/actions/`, `lib/utils.ts`, `lib/notifications.ts`
- `tests/phase1/` (10 tests) + `tests/phase2/` (12 tests)

---

## Future State

**Description** : App pleinement fonctionnelle selon tous les critères du PRD, testée Playwright.

**Critères mesurables** :
- Créer un projet "Piscine 25 000$ dans 18 mois" → dashboard affiche la progression + "Épargner 1 389$/mois"
- Page `/projets` : liste tous les projets planifiés avec progression visuelle (barre + %)
- Modifier `saved_amount` manuellement → recalcul instantané de l'épargne mensuelle suggérée
- Page `/historique` : sélecteur de mois → affiche dépenses du mois sélectionné avec totaux par section
- Bouton "Exporter" dans `/historique` → télécharge CSV des dépenses du mois
- `npx playwright test tests/phase3/` → **10/10 ✅**
- `npx playwright test` (tous) → **32/32 ✅** sur Vercel prod

**Livrables attendus** :
- `app/projets/page.tsx` — liste + CRUD projets planifiés
- `app/projets/[id]/page.tsx` — détail projet + mise à jour `saved_amount`
- `app/historique/page.tsx` — sélecteur de mois + tableau dépenses
- `app/api/export/route.ts` — génération CSV
- Mise à jour `app/page.tsx` (dashboard) — widget projets planifiés
- Mise à jour `components/ExpenseForm.tsx` — champs PLANNED
- `tests/phase3/*.spec.ts` — 10 tests Playwright

---

## Gap Analysis

| # | Gap | État actuel | État cible | Comment combler |
|---|-----|-------------|------------|-----------------|
| 1 | Type PLANNED dans formulaire | Champs présents en DB mais cachés dans UI | Formulaire affiche `target_amount`, `target_date`, `saved_amount` si type = PLANNED | Mise à jour `ExpenseForm` conditionnel |
| 2 | Page projets planifiés | Inexistante | `/projets` avec liste, progression, épargne mensuelle suggérée | Page + queries Supabase |
| 3 | Calcul épargne mensuelle | Inexistant | `(target_amount - saved_amount) / mois_restants` | Fonction dans `lib/utils.ts` |
| 4 | Widget dashboard projets | Absent | Widget "Projets" avec top 3 progressions + lien vers /projets | Mise à jour dashboard |
| 5 | Page historique | Inexistante | `/historique` avec sélecteur mois → dépenses du mois + totaux | Page + query filtrée par période |
| 6 | Logique historique | Inexistante | Query dépenses actives + ponctuelles passées pour un mois donné | Fonction `getExpensesForMonth(year, month)` |
| 7 | Export CSV | Inexistant | Route GET `/api/export?month=YYYY-MM` → fichier CSV téléchargeable | Route API + génération CSV |
| 8 | Tests Playwright Phase 3 | Inexistants | 10 tests verts sur Vercel | `tests/phase3/` |
| 9 | Test régression global | Partiel | 32/32 tests (Phase 1 + 2 + 3) verts | `npx playwright test` all |

---

## Impact Analysis

### Fichiers à créer

| Fichier | Type | Raison |
|---|---|---|
| `app/projets/page.tsx` | CREATE | Liste + CRUD dépenses planifiées |
| `app/projets/[id]/page.tsx` | CREATE | Détail projet + update saved_amount |
| `lib/actions/expenses.ts` | CREATE (ou UPDATE) | Ajouter `createPlannedExpense`, `updateSavedAmount` |
| `app/historique/page.tsx` | CREATE | Historique mensuel |
| `app/api/export/route.ts` | CREATE | Export CSV |
| `tests/phase3/*.spec.ts` | CREATE | 10 tests Playwright |

### Fichiers à modifier

| Fichier | Type | Raison |
|---|---|---|
| `components/ExpenseForm.tsx` | UPDATE | Afficher champs PLANNED conditionnellement |
| `app/page.tsx` (dashboard) | UPDATE | Ajouter widget "Projets planifiés" |
| `components/BottomNav.tsx` | UPDATE | Ajouter onglet "Projets" ou "Historique" |
| `lib/utils.ts` | UPDATE | Ajouter `calcMonthlySavings`, `getExpensesForMonth` |

### Dépendances externes

Aucune nouvelle dépendance externe. Toutes les intégrations (Supabase, Vercel, Resend, Twilio) sont déjà configurées.

### Blast Radius

**Niveau** : FAIBLE — modifications ciblées, aucune infrastructure nouvelle. Risque principal : modifier `ExpenseForm` sans casser les types RECURRING/ONE_TIME existants.

---

## Scope Boundaries

### IN SCOPE
1. **Type PLANNED dans `ExpenseForm`** : champs `target_amount`, `target_date`, `saved_amount` affichés si type = PLANNED
2. **Page `/projets`** : liste des dépenses PLANNED avec progression + épargne mensuelle suggérée
3. **Mise à jour `saved_amount`** : modifier le montant épargné à ce jour manuellement
4. **Widget projets sur dashboard** : top 3 projets avec progression
5. **Page `/historique`** : sélecteur de mois + dépenses du mois + totaux par section
6. **Export CSV** : GET `/api/export?month=YYYY-MM` → fichier téléchargeable
7. **10 tests Playwright** Phase 3 + régression globale 32/32

### OUT OF SCOPE
1. ~~Historique graphique / tendances visuelles avancées~~ — trop complexe, hors PRD strict
2. ~~Export PDF~~ — CSV suffit selon PRD
3. ~~Export multi-mois~~ — mois par mois suffit
4. ~~Synchronisation automatique `saved_amount`~~ — mise à jour manuelle selon PRD
5. ~~Authentification / multi-utilisateur~~ — hors scope PRD définitif
6. ~~Mode sombre~~ — hors scope PRD

### Critères d'arrêt
- [ ] Tâche hors scope identifiée > 30 min → documenter, ne pas faire
- [ ] Envie de "refactorer" Phase 1/2 → ne pas toucher sauf bug bloquant
- [ ] Graphiques avancés "pendant qu'on y est" → refuser

---

## Assumptions

| Hypothèse | Risque si fausse | Comment valider |
|---|---|---|
| Colonnes `target_amount`, `target_date`, `saved_amount` présentes dans `expenses` (schema Phase 1) | Migration supplémentaire nécessaire | Vérifier schema avant de commencer |
| `ExpenseForm` est suffisamment découplé pour ajouter un cas PLANNED sans régression | Tests Phase 1/2 cassent | Exécuter tests Phase 1/2 après modification formulaire |
| L'historique peut se baser sur `next_due_date` passées pour les récurrentes | Données historiques incomplètes | Clarifier la logique : historique = dépenses actives normalisées + ponctuelles passées |
| CSV simple (virgule, UTF-8) suffisant pour Amara | Format non lisible dans Excel | Utiliser `;` comme séparateur (standard Excel FR) + BOM UTF-8 |
| Vercel free tier : pas de limite sur les routes GET standard | Téléchargement CSV bloqué | Pas de limite connue pour GET simple sans streaming |

---

## Pre-Mortem

> "Phase 3 pas livrée. Pourquoi ?"

| Scénario | Probabilité | Impact | Prévention |
|---|---|---|---|
| Modification `ExpenseForm` casse les types RECURRING/ONE_TIME | MOYENNE | Tests Phase 1/2 rouges | Ajouter champs PLANNED uniquement en conditionnel `if type === 'PLANNED'`, tester immédiatement |
| Logique historique incorrecte (dépenses manquantes ou doublons) | MOYENNE | Données fausses | Définir précisément l'algorithme avant de coder |
| Export CSV illisible dans Numbers/Excel (encoding) | FAIBLE | Export inutile | Ajouter BOM UTF-8 + utiliser `;` comme séparateur |
| Widget projets dashboard ralentit la page (trop de queries) | FAIBLE | UX dégradée | Limiter à top 3 projets, query unique |

---

## Rollback Strategy

| Situation | Action |
|---|---|
| `ExpenseForm` modifié casse des tests | `git revert` sur le fichier + re-tester |
| Page historique query incorrecte | `git stash` de la page uniquement |
| Export CSV bug | Désactiver le bouton export, fix sans impact sur le reste |

---

## Implementation Plan

### Étape 1 — Dépenses Planifiées (Type PLANNED) *(skill: `frontend-design`)*
**Objectif** : Permettre de créer des projets d'épargne et les suivre visuellement.

| # | Tâche | Dépend de | Validation |
|---|-------|-----------|------------|
| 1.1 | Vérifier que `expenses` contient bien `target_amount`, `target_date`, `saved_amount` (nullable) — migration si absent | Phase 2 ✅ | Schema vérifié |
| 1.2 | `lib/utils.ts` : `calcMonthlySavings(targetAmount, savedAmount, targetDate)` → `(target - saved) / monthsRemaining` | — | Test : 25000 - 5000 = 20000 ÷ 18 mois = 1111$/mois |
| 1.3 | Mise à jour `components/ExpenseForm.tsx` : afficher conditionnellement les 3 champs PLANNED quand `type === 'PLANNED'` | — | Champs visibles/masqués selon type sélectionné |
| 1.4 | Tester non-régression : `npm run build` ✅ + créer dépense RECURRING → formulaire identique à avant | 1.3 | Tests Phase 1/2 toujours verts |
| 1.5 | `app/projets/page.tsx` : liste tous les `expenses WHERE type = 'PLANNED'`, pour chacun : barre progression (saved/target), % atteint, épargne mensuelle suggérée (`calcMonthlySavings`), date cible | 1.2, 1.3 | Projet "Piscine 25K" affiché avec progression |
| 1.6 | `app/projets/[id]/page.tsx` : détail projet + formulaire inline pour mettre à jour `saved_amount` | 1.5 | Modifier saved_amount → progression recalculée instantanément |
| 1.7 | Server Action `updateSavedAmount(id, amount)` | 1.6 | Mise à jour persistée Supabase |
| 1.8 | Widget "Projets planifiés" sur dashboard : top 3 projets (les plus urgents par date cible) avec mini-barre + épargne suggérée + lien `/projets` | 1.5 | Widget visible sur dashboard, lien fonctionnel |
| 1.9 | Ajouter "Projets" dans `BottomNav` si espace, sinon lien depuis dashboard | 1.5 | Accessible depuis l'app |

**Checkpoint** : Créer "Piscine 25 000$ dans 18 mois, déjà épargné 5 000$" → épargne suggérée = 1 111$/mois ✅ — Dashboard widget présent ✅

---

### Étape 2 — Historique Mensuel *(skill: `frontend-design`)*
**Objectif** : Consulter les dépenses de n'importe quel mois passé.

| # | Tâche | Dépend de | Validation |
|---|-------|-----------|------------|
| 2.1 | `lib/utils.ts` : `getExpensesForMonth(expenses, year, month)` → filtre les dépenses actives + ponctuelles dont `next_due_date` est dans ce mois | — | Test : dépenses du mois de janvier correctes |
| 2.2 | `app/historique/page.tsx` : sélecteur de mois (mois/année — 12 mois en arrière max), liste dépenses filtrées, totaux par section, total global | 2.1 | Sélectionner janvier 2026 → dépenses correspondantes |
| 2.3 | Affichage : même structure que le dashboard section (groupé par section + sous-totaux) | 2.2 | Cohérence visuelle avec le reste de l'app |
| 2.4 | Lien "Historique" accessible depuis le menu (onglet ou page parametres) | 2.2 | Navigation fonctionnelle |

**Checkpoint** : Sélectionner un mois passé → dépenses correctes avec totaux ✅

---

### Étape 3 — Export CSV
**Objectif** : Télécharger les dépenses d'un mois en CSV.

| # | Tâche | Dépend de | Validation |
|---|-------|-----------|------------|
| 3.1 | `app/api/export/route.ts` : GET avec `?month=YYYY-MM` → query dépenses du mois → générer CSV (séparateur `;`, BOM UTF-8, colonnes : Date, Nom, Montant, Devise, Type, Section, Carte, Notes) | Étape 2 | Appel GET → téléchargement fichier `.csv` |
| 3.2 | Bouton "Exporter CSV" sur la page `/historique` → appelle `/api/export?month=YYYY-MM` | 3.1 | Clic → téléchargement CSV du mois sélectionné |
| 3.3 | Vérifier lisibilité CSV dans Numbers (macOS) et Excel | 3.1 | Fichier ouvert correctement, accents OK |

**Checkpoint** : Exporter janvier 2026 → fichier CSV téléchargé, ouvrable dans Numbers ✅

---

### Étape 4 — Tests Playwright Phase 3 + Régression Globale
**Objectif** : 10 tests Phase 3 verts + 32/32 tous tests verts sur Vercel.

| # | Test | Ce qui est vérifié |
|---|------|---------------------|
| 4.1 | `test-planned-create.spec.ts` | Créer "Piscine 25 000$ dans 18 mois, épargné 5 000$" → épargne suggérée = 1 111$/mois |
| 4.2 | `test-planned-list.spec.ts` | Page `/projets` : liste projets avec barre progression, % correct |
| 4.3 | `test-planned-update.spec.ts` | Modifier `saved_amount` → progression recalculée, épargne suggérée mise à jour |
| 4.4 | `test-planned-dashboard.spec.ts` | Widget "Projets" sur dashboard : top 3 projets affichés avec épargne suggérée |
| 4.5 | `test-historique-mois.spec.ts` | Sélectionner mois précédent → dépenses correctes, totaux par section justes |
| 4.6 | `test-historique-navigation.spec.ts` | Changer de mois → données mises à jour sans rechargement complet |
| 4.7 | `test-export-csv.spec.ts` | Clic "Exporter" sur /historique → téléchargement CSV, Content-Type correct |
| 4.8 | `test-export-content.spec.ts` | Contenu CSV : colonnes correctes, dépenses du bon mois, encoding UTF-8 |
| 4.9 | `test-form-planned-fields.spec.ts` | Type PLANNED dans ExpenseForm → champs target/saved/date visibles. Type RECURRING → ces champs masqués |
| 4.10 | `test-regression-global.spec.ts` | Re-run complet : 10 Phase 1 + 12 Phase 2 + 10 Phase 3 → **32/32 ✅** |

**Checkpoint Final Phase 3** : `npx playwright test` → **32/32 ✅** sur Vercel prod. L'app est pleinement fonctionnelle selon tous les critères du PRD.

---

## Success Criteria

**Par étape** :
- Étape 1 : Créer projet planifié → calcul épargne mensuelle correct → widget dashboard ✅
- Étape 2 : Historique mois sélectionné → dépenses correctes ✅
- Étape 3 : Export CSV téléchargeable et lisible ✅
- Étape 4 : **32/32 tests Playwright verts sur Vercel** ✅

**Critères PRD Phase 3** :
- [ ] Dépenses planifiées (projets futurs avec objectif d'épargne) — ✅
- [ ] Historique / tendances mensuelles — ✅
- [ ] Export de données — ✅

**Critères PRD globaux — tous remplis après Phase 3** :
- [ ] Voir en un coup d'œil le "reste à vivre" ce mois-ci — ✅ (Phase 2)
- [ ] Savoir combien chaque sphère de vie coûte — ✅ (Phase 1)
- [ ] Recevoir un rappel avant chaque dépense non automatique — ✅ (Phase 2)
- [ ] Planifier un gros achat et savoir combien épargner/mois — ✅ **(Phase 3)**
- [ ] Ajouter une dépense en < 30 secondes — ✅ (Phase 1)
- [ ] App installable sur iPhone — ✅ (Phase 1)

---

## Testing Strategy

| Type | Ce qui est testé | Comment | Quand |
|---|---|---|---|
| Build | TypeScript compile sans erreur | `npm run build` | Fin de chaque étape |
| Unitaire (inline) | `calcMonthlySavings`, `getExpensesForMonth` | Tests inline `lib/utils.ts` | Étape 1, 2 |
| Non-régression formulaire | RECURRING/ONE_TIME non cassé | `npm run build` + test manuel | Après étape 1.3 |
| Export CSV | Fichier correct, encoding | Test GET `/api/export?month=` | Étape 3 |
| E2E Playwright Phase 3 | Tous flux Phase 3 | `npx playwright test tests/phase3/` | Étape 4 |
| Régression globale | 32/32 tests tous verts | `npx playwright test` | Étape 4 (final) |

---

*Point de retour vers Amara : uniquement après 32/32 tests Playwright verts sur l'URL Vercel de production — l'app est alors pleinement fonctionnelle.*
