# Creative Log -- coherence-design

## @designer

### 2026-03-07 -- Harmonisation experience design

**Stance :** Typography Monument (inchange -- la coherence exige la meme stance partout)

**Decisions :**

1. **Boutons d'ajout (DESIGN-001)** -- Le pattern gagnant est Depenses : filled teal en header desktop, FAB rond en mobile. Le bouton outlined de Patrimoine et la pill full-width de Sections/Cartes mobile sont des deviations. Le FAB visible sur desktop (Revenus) est une erreur de breakpoint.

2. **Cards Patrimoine (DESIGN-002)** -- La bordure laterale coloree est un pattern orphelin. Toutes les autres pages utilisent le conteneur groupe avec separateurs. La distinction epargne/dettes se fait via l'icone dans un cercle colore (teal-50 / error-light), pas via la bordure. La barre de progression reste intacte.

3. **Section headers (DESIGN-003)** -- Le vert teal-700 uppercase est le pattern majoritaire. Certaines pages (Depenses, Sections, Cartes) utilisent du gris -- c'est une deviation. Le compteur `(N)` est present sur Depenses et Revenus mais manque sur Patrimoine, Sections, Cartes, Params. L'ajouter partout.

4. **Format montants (DESIGN-004)** -- fr-CA = `1 450,00 $`. Pas de debat. Le `$` avant est anglophone, l'absence de decimales est inconsistante. Un helper centralise `formatCAD()` evite le copier-coller.

5. **Breadcrumbs (DESIGN-005)** -- Pattern deja etabli par Params/revenus et Params/charges. Sections et Cartes sont aussi des sous-pages de Reglages, elles meritent le meme breadcrumb.

6. **Badges (DESIGN-006)** -- Le systeme actuel melange `TOUT EN MAJUSCULES` et `Capitalize`. La capitalisation uniforme est "Premiere lettre majuscule" -- plus lisible, moins criard que le full uppercase. La palette semantique (vert/gris/orange/rouge) est deja partiellement en place, juste a systematiser.

**Patterns reutilises de features precedentes :**
- Conteneur groupe avec separateurs (expense-tracking, income-tracking)
- FAB rond mobile (expense-tracking)
- Section label vert uppercase (income-tracking, patrimoine)
- Breadcrumb (income-templates via Params/revenus)

**Livrable :** `index.html` -- pattern reference sheet avec AVANT/APRES pour les 6 stories. Pas un redesign, une harmonisation.

---

## @design-integrator

### 2026-03-07 -- DESIGN-004 : Standardiser le format des montants

**Mode :** Feature (story DESIGN-004 dans la feature coherence-design)

**Fichiers modifies :**

| Fichier | Type de changement |
|---------|-------------------|
| `lib/utils.ts` | Helper `formatCAD` existant -- aucune modification necessaire |
| `components/depenses/ExpenseSummaryStats.tsx` | Remplacement toLocaleString + suppression span $ prefixe |
| `components/depenses/StatusGroupSection.tsx` | Remplacement toLocaleString par formatCAD |
| `components/depenses/ExpenseMonument.tsx` | 2 decimales hero + formatCAD pour badges |
| `components/depenses/ExpenseActionSheet.tsx` | Remplacement 4 occurrences toLocaleString |
| `components/revenus/RevenusMonument.tsx` | 2 decimales hero (structure JSX conservee) |
| `components/accueil/TabTableauDeBord.tsx` | 2 decimales pour les 5 CardAmount/valeur nette |
| `components/projets/PatrimoineMonument.tsx` | 2 decimales hero + totals bar |
| `components/projets/DebtCard.tsx` | 2 decimales + $ apres (au lieu de $ avant) |
| `components/projets/SavingsProjectCard.tsx` | 2 decimales + $ apres |
| `components/AccueilClient.tsx` | 2 decimales hero balance |
| `components/IncomeTemplateManager.tsx` | formatCAD + suppression span $ double |
| `components/ExpenseTemplateManager.tsx` | formatCAD + suppression span $ prefixe (2 occurrences) |
| `components/IncomeTrackingRow.tsx` | formatCAD pour IncomeInstanceRow + VariableIncomeRow |
| `components/ProjectModal.tsx` | formatCAD pour monthlySuggested |
| `components/DebtModal.tsx` | formatCAD pour totalInterest |
| `components/revenus/AllocationTrackingTab.tsx` | 2 decimales hero disponibleAttendu |
| `app/parametres/charges/page.tsx` | 2 decimales (cas < 1000) + formatCAD monthlyLabel |
| `app/parametres/revenus/page.tsx` | 2 decimales hero + formatCAD monthlyLabel |
| `app/parametres/allocation/page.tsx` | 2 decimales (cas < 1000) + formatCAD monthlyLabel |

**Decisions d'integration :**

| Decision | Choix | Raison |
|----------|-------|--------|
| Helper formatCAD | Utilise tel quel (pas de modification) | Deja conforme a la spec fr-CA avec normalisation `\u202f` -> `\u00a0` |
| Heroes monument (superscript $) | Conservation de la structure JSX, deplacement du $ apres le nombre, suppression `verticalAlign: super` | Le handoff dit "le monument est dans la taille de police, pas dans le format". La structure visuelle est conservee, le $ est maintenant apres le nombre (fr-CA correct) |
| `k` shorthand dans charges/allocation hero | Conserve pour les montants >= 1000 | C'est une decision d'affichage hero (2,4k vs 2 403,97). La sub-label utilise formatCAD complet. Acceptable car c'est du shorthand dans un contexte visuel monument, pas une valeur calculable |
| Doubles spans `$` | Supprimes quand formatCAD retourne deja `X,XX $` | Eviter `1 200,00 $ $` (double symbole) |
| `Math.round()` avant affichage | Supprime dans TabTableauDeBord | Les 2 decimales montrent maintenant les centimes exacts, pas une valeur arrondie |

**Ecarts mockup -> code :**
- Aucun ecart de format : tous les montants sont maintenant `N NNN,NN $`
- Le $ superscript visuel est conserve dans les heroes (design choice existant pre-integration, conforme au handoff)

**Known gaps :**
- Aucun. DESIGN-004 est purement display, aucune logique metier touchee.

**Screenshots validation :** `.tmp/screenshots/DESIGN-004/`
- accueil.png, depenses.png, revenus.png, projets.png, charges.png, revenus-params.png

---

### 2026-03-07 -- DESIGN-003 : Uniformiser les headers de section

**Mode :** Feature (story DESIGN-003 dans la feature coherence-design)

**Fichiers modifies :**

| Fichier | Type de changement |
|---------|-------------------|
| `components/depenses/StatusGroupSection.tsx` | Couleur `slate-400` → `teal-700` ; font-size 12px → 11px. Compteur deja present. |
| `components/SectionsClient.tsx` | Couleur `text-tertiary` → `teal-700` ; font-size 12px → 11px ; letter-spacing 0.1em → 0.08em ; ajout `(N)` = `sections.length` |
| `components/CartesClient.tsx` | Couleur `text-tertiary` → `teal-700` ; font-size 12px → 11px ; letter-spacing 0.1em → 0.08em ; ajout `(N)` = `initial.length` |
| `components/IncomeTemplateManager.tsx` | Couleur `slate-400` → `teal-700` ; font-size 12px → 11px ; letter-spacing 0.1em → 0.08em ; label uppercase ; ajout `(N)` = `incomes.length` |
| `components/ExpenseTemplateManager.tsx` | Couleur `text-tertiary` → `teal-700` ; font-size 12px → 11px ; letter-spacing 0.1em → 0.08em ; label uppercase ; ajout `(N)` = `templateExpenses.length` |
| `components/projets/EpargneSection.tsx` | Couleur deja teal-700 ; font-size 13px → 11px ; ajout `(N)` = `1 + projets.length` (épargne libre + projets) |
| `components/projets/DettesSection.tsx` | Couleur `error` → `teal-700` (uniformisation per spec) ; font-size 13px → 11px ; ajout `(N)` = `debts.length` |

**Decisions d'integration :**

| Decision | Choix | Raison |
|----------|-------|--------|
| DettesSection : couleur rouge → teal | Changement effectue | Le handoff dit "toujours vert, jamais gris". La couleur rouge etait semantique mais le patron SectionLabel est uniforme teal. La semantique erreur est portee par les montants et badges (rouges), pas par le label de section. |
| EpargneSection compteur | `1 + projets.length` | FreeSavings (épargne libre) est toujours 1 pot, plus les N projets = total réel de la section |
| Labels en UPPERCASE | Uniformises | Certains etaient en title case ("Mes revenus récurrents"). Spec dit uppercase. |
| `templateExpenses.length` pour charges | Correct | Ce sont les dépenses affichées dans la liste, filtrees par type != PLANNED |

**Ecarts mockup -> code :**
- `DettesSection` bouton reste outlined red (DESIGN-001, hors scope)
- `EpargneSection` bouton reste outlined teal (DESIGN-001, hors scope)

**Known gaps :**
- Aucun. DESIGN-003 est purement display (CSS color + counter), aucune logique metier touchee.

**Screenshots validation :** `.tmp/screenshots/after-design-003/`
- depenses-desktop.png, sections-desktop.png, cartes-desktop.png, projets-desktop.png, params-revenus-desktop.png, params-charges-desktop.png
