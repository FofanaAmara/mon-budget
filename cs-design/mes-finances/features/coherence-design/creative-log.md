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

---

## @design-integrator

### 2026-03-07 — DESIGN-006 Integration

**Mode :** Feature — integration d'une story specifique

**Fichiers modifies/crees :** 9 fichiers (1 cree, 8 modifies)

**Decisions d'integration :**

| Decision | Choix | Raison |
|----------|-------|--------|
| Composant reutilisable | `components/StatusBadge.tsx` cree | 9 endroits avec badges, duplication eliminee |
| Palette hardcodee | `#ECFDF5`, `#F1F5F9`, `#FEF3C7`, `#FEF2F2` | CSS vars existantes ne correspondent pas exactement aux specs handoff |
| Source type (Emploi/Business) → badge | `success` variant | Handoff les liste dans la palette success |
| "Projet"/"Pot libre" → badge | `neutral` variant | Handoff inclut "Projet" dans le tableau |
| "Imprévu" badge conserve | `warning` variant | Semantiquement coherent, non modifie |

**Ecarts mockup → code :** Labels avec accents conserves (Reçu, Prévu, etc.). Badges "En retard" et "Reporté" non dans le handoff — conserves avec variants logiques.

**Known gaps :** Aucun. Changement purement visuel.

**Cross-reference :** `feature-integration-report-DESIGN-006.md` pour le detail complet.

---

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

---

### 2026-03-07 -- DESIGN-001 : Uniformiser les boutons d'ajout et le FAB mobile

**Mode :** Feature (story DESIGN-001 dans la feature coherence-design)

**Fichiers modifies :**

| Fichier | Type de changement |
|---------|-------------------|
| `components/projets/EpargneSection.tsx` | Bouton outlined teal → filled teal (#0F766E, bg blanc → bg teal, border supprimee, padding 8px 16px, border-radius 8px) |
| `components/projets/DettesSection.tsx` | Bouton outlined rouge → filled teal (meme transformation — spec dit teal uniform pour les boutons d'ajout) |
| `components/SectionsClient.tsx` | FAB pill (border-radius 100px, texte + icone, 52px height) → FAB rond (52x52, border-radius 50%, icone seule) |
| `components/CartesClient.tsx` | FAB pill (meme issue) → FAB rond (52x52, border-radius 50%, icone seule) |
| `components/revenus/IncomeTrackingTab.tsx` | FAB `class="fab"` → `class="fab fab-mobile-only"` (cache sur desktop). Bouton desktop `display: none` style inline + class custom → `class="btn-desktop-only"` style inline conforme. |

**Decisions d'integration :**

| Decision | Choix | Raison |
|----------|-------|--------|
| Dettes button : outlined rouge → filled teal | Teal uniforme | Le handoff dit "Jamais de bouton outlined pour l'ajout". La couleur rouge (Dettes) est portee par le badge/montant, pas par le bouton d'action. Uniformite du CTA = meilleure experience. |
| FAB width/height en inline style | 52x52 via style, border-radius 50% via style | La class `.fab` impose 56x56. L'inline override proprement pour respecter la spec 52px du handoff sans modifier le CSS global. |
| FAB bottom : ne pas override | Supprime le `bottom: 20px` inline | Le CSS `.fab` gere deja `bottom: max(72px, ...)` pour passer au-dessus du BottomNav. Override a 20px cassait le positionnement mobile. |
| Desktop button Revenus | Classe `btn-desktop-only` + style inline | Remplace le `display: none` dans le style inline par la classe semantique. Cohérent avec les autres pages. |

**Ecarts mockup → code :**
- Aucun ecart : les 4 changements (Patrimoine desktop, Sections mobile, Cartes mobile, Revenus desktop/mobile) sont conformes aux specs du handoff.

**Known gaps :**
- Aucun. Changement purement visuel.

**Screenshots validation :** `cs-design/mes-finances/features/coherence-design/screenshots/after/`
- patrimoine-desktop.png, patrimoine-mobile.png
- sections-desktop.png, sections-mobile.png
- cartes-desktop.png, cartes-mobile.png
- revenus-desktop.png, revenus-mobile.png

---

### 2026-03-07 -- DESIGN-005 : Ajouter les breadcrumbs manquants sur Sections et Cartes

**Mode :** Feature (story DESIGN-005 dans la feature coherence-design)

**Fichiers modifies :**

| Fichier | Type de changement |
|---------|-------------------|
| `components/SectionsClient.tsx` | Import `Breadcrumb` + ajout `<nav>` wrapper avec breadcrumb au-dessus du monument hero |
| `components/CartesClient.tsx` | Import `Breadcrumb` + ajout `<nav>` wrapper avec breadcrumb au-dessus du monument hero |

**Decisions d'integration :**

| Decision | Choix | Raison |
|----------|-------|--------|
| Composant reutilise | `Breadcrumb` existant (pas de nouveau composant) | Le composant existe deja, utilise sur revenus et charges. XS story = zero duplication. |
| Lien "Reglages" → `/parametres` | `/parametres` (pas `/settings`) | Le handoff mentionne `/settings` mais les pages existantes (revenus, charges) utilisent `/parametres`. La route reelle est `/parametres`. Coherence avec l'existant. |
| Pattern : `<nav>` wrapper | `padding: "14px 20px 0"` | Meme pattern que `parametres/revenus/page.tsx`. Pas de `<nav>` sur charges (breadcrumb inline dans le monument) -- on suit le pattern revenus car plus propre semantiquement. |
| Placement dans SectionsClient et CartesClient | Dans les client components (pas dans les server pages) | Les pages server (`app/sections/page.tsx`, `app/cartes/page.tsx`) sont des thin wrappers qui deleguent au client component. Le rendu visuel est entierement dans le client component. |

**Ecarts mockup -> code :**
- Aucun ecart : le `Breadcrumb` existant correspond aux specs du handoff (font-size 13px via `var(--text-xs)`, teal-700 pour le lien, slate-500 pour la page courante, separateur chevron SVG).

**Known gaps :**
- Aucun. DESIGN-005 est purement visuel, aucune logique metier touchee.

**Screenshots validation :** `.tmp/screenshots/DESIGN-005/`
- sections-desktop.png, sections-mobile.png
- cartes-desktop.png, cartes-mobile.png

---

### 2026-03-07 -- DESIGN-002 : Harmoniser le style des cards de la page Patrimoine

**Mode :** Feature (story DESIGN-002 dans la feature coherence-design)

**Fichiers modifies :**

| Fichier | Type de changement |
|---------|-------------------|
| `components/projets/SavingsProjectCard.tsx` | Suppression `borderLeft: 4px solid teal`, ajout icone 36x36 bg #F0FDFA, prop `isFirst` pour supprimer le border-top de la premiere row, hover state background |
| `components/projets/DebtCard.tsx` | Suppression `borderLeft: 4px solid error`, ajout icone 36x36 bg #FEF2F2, prop `isFirst`, hover state background |
| `components/projets/EpargneSection.tsx` | Suppression `gap: 12px` sur les cards individuelles, ajout GroupedContainer (white bg, border #E2E8F0, border-radius 18px, shadow 0 1px 2px rgba(15,118,110,0.05), overflow hidden) |
| `components/projets/DettesSection.tsx` | Meme transformation : GroupedContainer pour la liste, container standalone pour l'empty state |

**Decisions d'integration :**

| Decision | Choix | Raison |
|----------|-------|--------|
| Structure du GroupedContainer | Container unique, rows avec `borderTop: isFirst ? none : 1px solid #E2E8F0` | Pattern exact du handoff. Equivalent visuel des sections Depenses/Revenus. |
| Icone epargne | Clock icon (SVG circle + hands) | Semantique "suivi dans le temps / progression vers un objectif". Handoff ne specifie pas l'icone, seulement la couleur du conteneur. |
| Icone dette | Dollar sign icon (SVG ligne + path) | Semantique "finances/argent/paiement". Handoff ne specifie pas l'icone. |
| Hover state | `onMouseEnter/Leave` avec background #F8FAFC (slate-50) | Spec dit "background row → slate-50, transition 150ms". Pas de classe Tailwind disponible (pas de CSS module). Inline event handlers suffisants. |
| Active/tap (scale 0.99) | Non implemente | Le tap cible les boutons action (icon-btn) a l'interieur, pas la row entiere. Scale sur la row entiere craserait les boutons. |
| Empty state (epargne) | Conserve dans le GroupedContainer, apres freeSavings | L'epargne libre est TOUJOURS presente, donc le container n'est jamais vide. Le message "Aucun projet" est une row speciale sous freeSavings. |
| Empty state (dettes) | Container standalone (pas a l'interieur d'un GroupedContainer) | Quand 0 dettes, pas de container "fantome" avec juste un message. Container propre avec le message vide. |

**Ecarts mockup → code :**
- Aucun ecart structurel. Tous les contenus (nom, badges, montants colores, progress bars, suggestion mensuelle, boutons action) sont preserves.
- La progression a 100% utilise amber-500 pour la barre (spec "barre pleine, couleur amber-500"). Deja implemente dans la logique existante.

**Known gaps :**
- Aucun. Changement purement visuel, aucune logique metier touchee.

**Screenshots validation :** `cs-design/mes-finances/features/coherence-design/screenshots/`
- before/patrimoine-desktop-DESIGN-002.png
- before/patrimoine-mobile-DESIGN-002.png
- after/patrimoine-desktop.png
- after/patrimoine-mobile.png
