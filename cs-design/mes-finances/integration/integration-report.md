# Integration Report — Mes Finances

## Feature 1: Données de Référence (Sections & Cartes)

**Date**: 2026-03-02
**Branch**: `design-integration/reference-data-2026-03-02`
**Scope**: SectionsClient, CartesClient, CarteDetailClient + cartes/[id]/page.tsx + globals.css
**Stack**: Next.js App Router · TypeScript · Tailwind CSS v4 · CSS variables (globals.css)
**TypeScript errors**: 0

---

### Brand Tokens Applied

| Token | Value | Applied in |
|-------|-------|------------|
| `--accent` (#0F766E) | Teal 700 | Monument label, add buttons, FAB, sheet icon |
| `--accent-hover` (#115E59) | Teal 800 | Button hover states |
| `--accent-subtle` (#F0FDFA) | Teal 50 | Empty state icon bg, selected emoji bg |
| `--text-primary` (#0F172A) | Slate 900 | Monument number, section names |
| `--text-tertiary` (#64748B) | Slate 500 | Sub-labels, page header labels |
| `--border-default` (#E2E8F0) | Slate 200 | Section item borders |
| `--radius-md` (12px) | — | Section items, buttons |
| `--radius-lg` (18px) | — | Bank card visuals, sheet |
| clamp(3.5rem, 14vw, 6rem) / 800 | Monument scale | Count monument |
| `--shadow-sm`, `--shadow-md` | Teal-tinted | Card hover states |

### Changes

- **SectionsClient**: Monument count header · 7-col emoji grid (36 emojis) · 8-col color swatches · colored emoji containers · desktop add button · mobile FAB pill · improved bottom sheet
- **CartesClient**: Monument count header · visual gradient bank cards (min-height 130px) · live card preview in sheet · 8 gradient color themes · BankCardVisual sub-component
- **CarteDetailClient**: Gradient map for bank card · Monument-aligned stat numbers · updated empty state
- **cartes/[id]/page.tsx**: Removed outer h1 header — CarteDetailClient owns its layout
- **globals.css**: Added `.fab-mobile-only` and `.btn-desktop-only` utilities

### New CSS Utilities

```css
.fab-mobile-only  — hides FAB at >= 768px
.btn-desktop-only — shows add button only at >= 768px
```

### Known Gaps

- Both demo cards share the same emerald (#059669) color (data issue, not code issue)
- Old color hex values from pre-redesign data fall back to raw gradient (graceful, no crash)
- Mobile tactile drag-and-drop requires dnd-kit (HTML5 drag API works on desktop, out of scope)

---

## Overview

- **Date de completion**: 2026-03-02
- **Maquettes utilisées**: `landing.html`, `dashboard.html`, `depenses.html`, `login.html`, `signup.html`, `onboarding.html` (6 fichiers)
- **Stack**: Next.js 16.1.6 (App Router, TypeScript) + React 19.2.3 + Tailwind CSS v4 (CSS-first, pas de tailwind.config.ts) + Neon Auth
- **Scope**: 9 composants/pages intégrés + Feature 6 Patrimoine (5 fichiers) + setup global
- **Mode**: Existing App (migration identité Indigo → Teal/Amber)

### Résumé exécutif

L'identité visuelle complète de l'application "Mes Finances" a été migrée du système Indigo/Stone vers le système Teal/Amber de Direction 3 (stance Typography Monument). Les tokens CSS ont été remplacés à la racine dans `globals.css`, la police Geist a été remplacée par Plus Jakarta Sans, et 9 composants/pages ont été mis à jour pour correspondre aux maquettes validées. L'intégration couvre l'ensemble du parcours utilisateur : landing → auth → onboarding → dashboard → dépenses → revenus → patrimoine.

**Feature 6 — Patrimoine (ajout post-initial)**: La page Patrimoine a été entièrement refaite avec des maquettes dédiées (`patrimoine-main.html` + `patrimoine-actions.html`). Les onglets Actifs/Passifs ont été remplacés par une vue unifiée (épargne + dettes simultanément), 5 composants réécrits (ProjetsEpargneClient, ProjectModal, DebtModal, AddSavingsModal, TransferSavingsModal), et 8 screenshots de validation Playwright produits.

---

## Tokens de marque appliqués

### Palette

Remplacement complet dans `app/globals.css` via CSS custom properties en `:root`. Tailwind v4 lit ces variables directement via `@import "tailwindcss"` — aucun `tailwind.config.ts` créé.

| Token | Avant | Après | Usage |
|-------|-------|-------|-------|
| `--accent` | `#3D3BF3` (indigo) | `#0F766E` (teal-700) | Couleur primaire app |
| `--accent-hover` | `#3230D4` | `#115E59` (teal-800) | Hover boutons primaires |
| `--accent-subtle` | `#EDEDFE` | `#F0FDFA` (teal-50) | Fond états actifs nav |
| `--surface-ground` | `#F5F4F1` (stone chaud) | `#FAFBFC` (slate-50 froid) | Fond de page |
| `--surface-sunken` | `#EEEDEA` | `#F1F5F9` (slate-100) | Insets, fonds barres |
| `--text-primary` | `#0D0D0D` | `#0F172A` (slate-900) | Texte primaire |
| `--text-secondary` | `#6B6966` | `#334155` (slate-700) | Texte secondaire |
| `--text-tertiary` | `#A3A09A` | `#64748B` (slate-500) | Labels, hints |
| `--positive` | `#1A7F5A` | `#059669` (emerald-600) | États positifs |
| `--positive-text` | `#145C42` | `#065F46` | Texte positif |
| `--negative` | `#C7382D` | `#DC2626` (red-600) | Erreurs |
| `--border-default` | `#E5E3DF` | `#E2E8F0` (slate-200) | Bordures |
| `--radius-sm` | `6px` | `8px` | Inputs, petits boutons |
| `--radius-md` | `10px` | `12px` | Boutons, cards moyennes |
| `--radius-lg` | `14px` | `18px` | Cards principales |

**Nouveaux tokens ajoutés:**
```css
--amber:         #F59E0B;   /* amber-500 — CTAs de conversion */
--amber-hover:   #D97706;   /* amber-600 */
--amber-subtle:  #FEF3C7;   /* amber-100 */
--shadow-accent: 0 4px 16px rgba(15, 118, 110, 0.18), 0 1px 4px rgba(15, 118, 110, 0.08);
--shadow-fab:    0 8px 24px rgba(15, 118, 110, 0.12);
--shadow-fab-hover: 0 12px 32px rgba(15, 118, 110, 0.16);
```

### Typographie

```diff
- import { Geist } from 'next/font/google';
- const geist = Geist({ subsets: ['latin'], variable: '--font-geist', display: 'swap' });
+ import { Plus_Jakarta_Sans } from 'next/font/google';
+ const plusJakarta = Plus_Jakarta_Sans({
+   subsets: ['latin'],
+   weight: ['300', '400', '500', '600', '700', '800'],
+   variable: '--font-jakarta',
+   display: 'swap',
+ });
```

- `html.className` mis à jour: `plusJakarta.variable` (variable CSS `--font-jakarta`)
- `body.className` mis à jour: `font-[family-name:var(--font-jakarta)]`
- Token racine ajouté dans `:root`: `--font: var(--font-jakarta), system-ui, sans-serif;`
- `themeColor` mis à jour: `'#FAFBFC'` (était `'#F5F4F1'`)

### Ombres

Toutes les ombres sont teal-tintées (`rgba(15, 118, 110, x)`), jamais grises. Remplacement complet du système shadow dans `globals.css`.

### Autres tokens

- FAB: `width: 56px; height: 56px` (était 52px), `border-radius: 50%`, `bottom: max(72px, calc(56px + var(--safe-bottom)))`
- Selection color: `::selection { background: rgba(15, 118, 110, 0.15); color: var(--text-primary); }`
- Bouton `.btn-amber` ajouté dans `globals.css` pour les CTAs de conversion (landing + onboarding)

---

## Changements par composant

### Setup global

**Fichiers modifiés**: `app/globals.css`, `app/layout.tsx`

**Avant**: Palette Indigo (`#3D3BF3`), surfaces stone chaudes (`#F5F4F1`), police Geist, ombres grises/neutres, radius 14px sur les cartes.

**Après**: Palette Teal-700 (`#0F766E`) + Amber (`#F59E0B`), surfaces slate froides (`#FAFBFC`), police Plus Jakarta Sans (300–800), ombres teal-tintées, radius 18px sur les cartes.

**Pourquoi**: Le brand-config Direction 3 définit le teal comme couleur primaire, l'amber comme accent de conversion, et Jakarta Sans comme police humaniste. Le setup global est la fondation qui fait cascader l'identité sur tous les composants via `var(--accent)` et `var(--surface-ground)`.

**Comportement vérifié**:
- [x] Les tokens shadcn/ui (`--primary`, `--ring`, `--radius`) sont préservés et mappés sur teal
- [x] `@neondatabase/auth/ui/tailwind` reste fonctionnel (import conservé)
- [x] PWA themeColor mis à jour
- [x] Tous les composants qui utilisaient `var(--accent)` passent automatiquement en teal

---

### Page 1: Navigation (BottomNav + LayoutShell)

**Fichiers modifiés**: `components/BottomNav.tsx`, `components/LayoutShell.tsx`
**Type de travail**: Skin
**Statut**: ✅

**Avant**: Logo carré indigo avec graphe en W, wordmark "Mes Finances" texte simple Geist, nav active en indigo, fond bottom nav frosted glass, dot indicateur.

**Après**:
- Logo SVG Le Compas: carré teal-700, courbe de croissance slate-50, point amber
- Wordmark typographique: **Mes** (800, slate-900) + Finances (600, teal-700)
- Nav active: `background: var(--accent-subtle)`, `color: var(--accent)`, amber left border 3px
- Bottom nav: fond solide blanc, `border-top: 1px solid var(--border-default)` (plus de frosted glass)
- Sidebar width: 260px (était adaptable)

**Patterns établis**:
- Logo inline SVG (pas d'import fichier) — `viewBox="-50 -50 100 100"`
- Logo variante inversée pour fonds teal: `rect fill="rgba(255,255,255,0.12)"`
- Amber left border comme indicateur actif sidebar (pattern réutilisable)

**Comportement vérifié**:
- [x] Navigation entre pages fonctionne
- [x] États actifs visibles (teal + amber border)
- [x] Mobile bottom nav affiche 4-5 items selon la route

---

### Page 2: Landing (`/landing`)

**Fichiers modifiés**: `app/landing/page.tsx`
**Type de travail**: Skin + ajustements typography monument
**Statut**: ✅

**Avant**: Hero "Toute ta vie financière..." (texte 2xl/3xl), CTA indigo, sections features avec screenshots téléphone, fond indigo sur CTA final.

**Après**:
- Hero tagline: "Tes finances. En clair." à `clamp(3.2rem, 10vw, 9rem)` / 800 — stance Typography Monument
- Hero figure: "847$" à `clamp(4rem, 14vw, 10rem)` / 800 (proof-of-concept, preuve concrète)
- Badge hero: teal-50 bg + dot amber "100% gratuit. Aucune carte requise."
- CTA principal: **amber** "Commencer gratuitement" (bouton de conversion)
- CTA secondaire: outline teal "Se connecter"
- Bandeau preuve: "Déjà utilisé par **2 400+** Québécois..."
- Section valeur: 3 chiffres monument (2 min, 200$, 0$)
- Feature cards: 6 cartes avec stat chiffre + titre (plus de screenshots)
- Étapes: numéros grisés + amber dot
- Testimonial: fond teal-700, guillemets amber
- CTA final: "Ton argent, ton rythme." sans gradient
- Footer enrichi avec logo + liens légaux

**Décision documentée**: L'amber est utilisé uniquement sur les CTAs de conversion (hero + final CTA). Le bouton de navigation header reste teal (action standard, pas conversion).

**Comportement vérifié**:
- [x] ScrollReveal toujours fonctionnel (composant conservé)
- [x] Navigation vers `/auth/signin` et `/auth/signup` fonctionnelle
- [x] Page responsive 375px → 1280px

---

### Page 3: Auth — Login / Signup

**Fichiers modifiés**: `app/auth/[path]/page.tsx`
**Type de travail**: Experience Design (layout restructuré)
**Statut**: ✅

**Avant**: Layout centré simple, `<AuthView>` dans un `div max-width: 400px` centré, fond `--surface-ground`.

**Après**:
- Layout split: brand panel teal gauche (50%) + formulaire droit (50%)
- Mobile: brand panel compact en header, formulaire en bas
- Brand panel: `background: var(--teal-700)`, logo inversé + tagline + feature list + testimonial (desktop only)
- Tagline différente selon la route: login vs signup
- Lien retour vers `/landing` depuis le logo brand panel

**Décision documentée**: `<AuthView>` de `@neondatabase/auth` génère ses propres boutons. Le bouton login est teal automatiquement via `--primary: var(--accent)`. Le bouton signup est également teal (compromis accepté — impossible de le rendre amber sans fork du composant). Ce compromis est documenté dans les notes développeurs.

**Note pour développeurs**: Si l'amber sur le bouton signup devient une priorité, inspecter les classes CSS rendues par `AuthView` et appliquer un CSS override ciblé. Ou proposer à @designer de valider teal sur signup.

**Comportement vérifié**:
- [x] Login fonctionnel
- [x] Signup fonctionnel
- [x] Lien "Retour" depuis le brand panel vers `/landing`
- [x] Redirection post-auth vers le dashboard

---

### Page 4: Onboarding

**Fichiers modifiés**: `components/Onboarding.tsx`
**Type de travail**: Experience Design (refonte complète)
**Statut**: ✅

**Avant**: Overlay 2 étapes (Bienvenue + Comment ça marche), options "Charger données démo" ou "Configurer".

**Après**:
- Wizard 3 étapes sur fond teal-50 (`var(--accent-subtle)`) avec texture de grille subtile
- Logo Le Compas + wordmark en haut du card
- Étape 1: Revenu mensuel — input montant 24px/800 + sélecteur fréquence + preview annuel/bimensuel en temps réel
- Étape 2: Catégories — grille 2 colonnes de chips toggleables avec compteur sélectionné
- Étape 3: Objectif financier — 3 cartes radio (Contrôler / Économiser / Rembourser)
- Dots de progression: teal rempli / slate vide
- Bouton "Retour" outline teal, bouton "Suivant" primaire teal
- Bouton finish étape 3: **amber** "Accéder à mon tableau de bord"
- Animations: fade + translateY(-20px) entre étapes, completionPop sur finish

**Décision documentée**: L'option "données démo" de l'ancien onboarding est supprimée du wizard principal. Elle reste accessible via un lien discret "Ou explorer avec des données de test" sous le bouton finish. Ce choix correspond à la maquette validée.

**Données collectées**: Le revenu saisi à l'étape 1 est passé en prop à `AccueilClient` pour préremplir le dashboard. Les catégories et objectif sont stockés en état local pour le tableau de bord initial.

**Comportement vérifié**:
- [x] Navigation entre les 3 étapes
- [x] Preview revenu en temps réel (annuel / bimensuel)
- [x] Chips catégories toggleables avec compteur
- [x] Sélection objectif (une seule carte active)
- [x] Bouton Finish déclenche la transition vers le dashboard
- [x] Animation completionPop visible

---

### Page 5: Dashboard (Accueil)

**Fichiers modifiés**: `components/AccueilClient.tsx`, `components/accueil/TabTableauDeBord.tsx`
**Type de travail**: Experience Design partielle
**Statut**: ✅

**Avant**: Card patrimoine gradient en haut, month navigator, tab strip (Tableau de bord / Timeline / Santé), flow bar format différent.

**Après**:
- Section monument centrée: greeting + mois + solde disponible à `clamp(3.5rem, 15vw, 6rem)` / 800 + status badge
- `<MonthNavigator>` repositionné sous le badge monument
- Tab strip conservé (fonctionnalité non couverte par les maquettes, dérivée des patterns teal)
- Flow bar: 3 colonnes fond slate-100, `gap: 2px`, `border-radius: var(--radius-md)`
- Budget progress bars: code couleur teal/warning/error
- Card patrimoine: token-based, sans gradient hardcodé (suppression de `#1A7F5A` et `#145C42`)
- Animations staggerées: délais 0s, 0.15s, 0.25s, 0.3s, 0.35s, 0.4s sur les sections

**Décision documentée**: Les tabs "Timeline" et "Santé" ne sont pas dans les maquettes mais sont des fonctionnalités existantes utiles. Stratégie retenue: garder le tab strip, intégrer le monument et la flow bar dans le tab "Tableau de bord". Les tabs appliquent les tokens teal sans changer leur structure.

**Hotfix gradients**: Suppression de tous les gradients hardcodés (`#1A7F5A`, `#145C42`, `#3D3BF3`) dans la card patrimoine. Remplacés par `var(--positive)`, `var(--positive-text)`, `var(--accent)`.

**Comportement vérifié**:
- [x] Navigation mensuelle (mois précédent / suivant)
- [x] Calcul `summary.available_amount` affiché dans le monument
- [x] Tab strip fonctionnel (Tableau de bord / Timeline / Santé)
- [x] Flow bar responsive (3 colonnes sur desktop et mobile)
- [x] Card patrimoine sans gradient hardcodé

---

### Page 6: Dépenses

**Fichiers modifiés**: `components/DepensesTrackingClient.tsx`
**Type de travail**: Skin + ajustements structure
**Statut**: ✅

**Avant**: Header simple avec titre, filtres section (horizontal scroll), liste groupée, barre de progression.

**Après**:
- Monument total dépensé: `clamp(2.5rem, 12vw, 5rem)` / 800 en haut de page
- Filter chips: fond teal-700 actif / blanc inactif, `border-radius: 100px` (pill), `padding: 8px 16px`
- Barre de progression: track slate-100, fill teal/amber/rouge selon le pourcentage
- Labels de groupe: 12px / 700 / uppercase / 0.08em letter-spacing / `var(--text-tertiary)`
- Montants transactions: `font-variant-numeric: tabular-nums`, 800 weight

**Comportement vérifié**:
- [x] Filtres par catégorie/section fonctionnels
- [x] Modal ajout dépense accessible via FAB
- [x] Liste groupée par statut/date
- [x] Barre de progression reflète le budget utilisé

---

### Page 7: Revenus (dérivé)

**Fichiers modifiés**: `components/RevenusTrackingClient.tsx`
**Type de travail**: Skin (dérivé — non couvert par les maquettes)
**Statut**: ✅

**Dérivation**: Même pattern que Dépenses — monument total revenus, liste items avec teal pour reçu / slate pour attendu.

**Comportement vérifié**:
- [x] Affichage revenus par période
- [x] Ajout revenu fonctionnel
- [x] Total monument affiché

---

### Page 8: Patrimoine — Épargne & Dettes (Feature 6)

**Fichiers modifiés**:
- `components/ProjetsEpargneClient.tsx` — Refonte complète (~870 lignes)
- `components/ProjectModal.tsx` — Refonte complète
- `components/DebtModal.tsx` — Refonte complète
- `components/AddSavingsModal.tsx` — Refonte complète
- `components/TransferSavingsModal.tsx` — Refonte complète

**Maquettes utilisées**: `patrimoine-main.html`, `patrimoine-actions.html`
**Branch**: `design-integration/patrimoine-2026-03-02`
**Type de travail**: Experience Design (maquettes dédiées)
**TypeScript**: 0 erreurs
**Statut**: ✅

**Avant**:
- Onglets "Actifs" / "Passifs" séparant épargne et dettes (montrait une section à la fois)
- Cards plates sans accent couleur border-left
- FAB avec emoji dans les boutons du menu
- Modals sans header structuré (pas d'icône, pas de pattern sheet)
- Pas de chip "contribution suggérée"
- Pas de badge PERMANENT sur l'épargne libre

**Après**:

1. **Monument patrimoine** (`clamp(3rem, 12vw, 5rem)` / 800):
   - Signe +/- en prefixe (`0.65em` / 700)
   - Symbole `$` en superscript (`0.4em` / 600 / `verticalAlign: super`)
   - Couleur teal-700 si positif, `var(--error)` si négatif
   - Badge "En croissance" (teal-50 + teal-700) ou "En déficit" (error-light + error)
   - Label architectural "PATRIMOINE" 11px/700/uppercase teal-700

2. **Barre totaux** (2 colonnes côte à côte):
   - Colonne gauche: total épargne en teal-700
   - Colonne droite: total dettes en `var(--error)`
   - Bordure `1px solid var(--slate-200)`, `borderRadius: var(--radius-md)`

3. **Section Épargne** (ex: onglet Actifs → section permanente):
   - Header label teal-700 uppercase + bouton "Nouveau projet" desktop (`btn-desktop-only`)
   - Épargne libre: `border-left: 4px solid var(--teal-700)`, badge PERMANENT teal-50
   - Projets: `border-left: 4px solid var(--teal-700)`, barre 8px gradient teal + amber dot, chip "~/mois suggéré"
   - Chip contribution: horloge icon + `~X$/mois`, fond teal-50, texte teal-700

4. **Section Dettes** (ex: onglet Passifs → section permanente):
   - Header label `var(--error)` uppercase + bouton "Nouvelle dette" rouge outline desktop
   - Cartes: `border-left: 4px solid var(--error)`, montant restant en rouge
   - Rangée de détails: solde initial · taux · durée · paiement mensuel (4 colonnes)
   - Bouton "Rembourser" icon-btn-danger

5. **FAB expandable** (`className="fab-mobile-only"`):
   - 3 items dans le menu: blanc, `border-radius: var(--radius-md)`, icône dans conteneur coloré (teal-50 / teal-50 / error-light)
   - Backdrop `className="fab-mobile-only"` pour éviter collision desktop

6. **Modals (tous 4 refaits)** — Pattern sheet uniforme:
   - `ProjectModal`: icône piggy-bank teal-50 + "Nouveau projet", contribution suggérée auto-calculée
   - `AddSavingsModal`: icône flèche-haut teal-50 + "Ajouter au pot", résumé progression %
   - `TransferSavingsModal`: icône swap amber-100 + "Transférer", layout Depuis → flèche → Vers
   - `DebtModal`: icône carte-credit error-light + "Nouvelle dette", résumé durée + intérêts totaux
   - Tous: inputs montant monumentaux (24px/800/tabular-nums), footer [Annuler | Action] via `form="id"` HTML5

**Décisions documentées**:
- Suppression complète des onglets actifs/passifs: les deux sections sont toujours visibles, l'utilisateur voit son patrimoine global d'un coup d'oeil
- L'amber dot à la pointe de la barre de progression est un `<span>` inline (les pseudo-éléments CSS ne sont pas accessibles via inline styles React)
- Le FAB est masqué sur desktop via `className="fab-mobile-only"` — les boutons "desktop only" (section headers) servent d'alternative
- Form id association (`id="project-form"` + `form="project-form"` sur submit button en dehors du form) permet de placer les boutons dans le footer de la sheet sans casser la sémantique HTML

**Comportement vérifié** (Playwright):
- [x] Monument affiche valeur nette positive/négative avec bonne couleur
- [x] Section Épargne + Section Dettes visibles simultanément (plus d'onglets)
- [x] FAB expandable: clic ouvre le menu, clic backdrop ferme
- [x] Modal "Ajouter au pot" ouvre, calcule le résumé, ferme correctement
- [x] Modal "Transférer" ouvre, dropdown destinations, "Tout transférer" remplit le montant
- [x] Modal "Rembourser une dette" ouvre, radio Régulier/Supplémentaire fonctionne
- [x] Modal "Nouveau projet" (desktop, btn-desktop-only) s'ouvre et soumet
- [x] Modal "Nouvelle dette" (desktop) s'ouvre et soumet
- [x] TypeScript: 0 erreurs

**Screenshots**:
- `screenshots/after/patrimoine-mobile-after.png` — Vue mobile complète (375px)
- `screenshots/after/patrimoine-desktop-after.png` — Vue desktop complète (1280px)
- `screenshots/after/patrimoine-fab-open.png` — FAB menu expandé
- `screenshots/after/patrimoine-savings-modal.png` — Modal "Ajouter au pot"
- `screenshots/after/patrimoine-transfer-modal.png` — Modal "Transférer"
- `screenshots/after/patrimoine-pay-modal.png` — Modal "Rembourser"
- `screenshots/after/patrimoine-project-modal-desktop.png` — Modal "Nouveau projet" desktop
- `screenshots/after/patrimoine-debt-modal-desktop.png` — Modal "Nouvelle dette" desktop

---

### Page 9: Card Patrimoine Accueil (dérivé + hotfix)

**Fichiers modifiés**: `components/AccueilClient.tsx`
**Type de travail**: Hotfix + dérivation token-based
**Statut**: ✅

**Avant**: Gradient hardcodé `linear-gradient(135deg, #1A7F5A, #145C42)`.

**Après**: `background: var(--positive)`, `color: var(--text-inverted)`, sans gradient. Token-based pour cohérence avec le système de couleurs.

---

## Composants dérivés (non couverts par les maquettes)

### RevenusTrackingClient

**Pourquoi**: La page revenus existe dans l'app mais n'a pas de maquette dédiée.
**Dérivation**: Pattern identique à `depenses.html` — monument en haut + liste items + tokens teal.
**Décisions**: Teal pour les revenus reçus (positif), slate pour les attendus (neutre). Monument = total du mois.
**Ajouté à project-preferences**: Non (pattern déjà documenté via Dépenses).

### ProjetsEpargneClient

**Note**: Ce composant est désormais couvert par des maquettes dédiées (`patrimoine-main.html`, `patrimoine-actions.html`). Voir **Page 8: Patrimoine — Épargne & Dettes (Feature 6)** ci-dessus pour le détail complet. La section dérivée initiale (barre gradient teal + amber dot) a été remplacée par une implémentation complète conforme aux maquettes validées.

### ParametresClient (hors scope final mais tokens appliqués)

**Pourquoi**: Le changement des tokens globaux a automatiquement mis à jour les couleurs de `ParametresClient` sans intervention manuelle.
**Résultat**: Link rows teal-50 background + teal-700 icon, section labels uppercase — correct par cascade de tokens.

---

## Résumé des tests visuels

### Vérification visuelle

| Page | Desktop Match | Mobile Match | Screenshots |
|------|--------------|-------------|-------------|
| Landing | Conforme maquette | Conforme | `screenshots/after/landing-desktop.png`, `landing-desktop-full.png`, `landing-mobile-revealed.png` |
| Auth (Login / Signup) | Conforme (split layout) | Conforme (compact header) | — |
| Onboarding | Conforme (3 étapes) | Conforme | — |
| Dashboard | Conforme (monument + flow bar) | Conforme | — |
| Dépenses | Conforme (monument + chips) | Conforme | — |
| Revenus | Dérivé, cohérent | Dérivé, cohérent | — |
| Patrimoine | Dérivé, cohérent | Dérivé, cohérent | — |

**Note**: Les captures d'écran "before" n'ont pas été sauvegardées au démarrage (compaction en cours au moment du baseline). Les captures "after" de la landing sont disponibles dans `cs-design/mes-finances/integration/screenshots/after/`.

### Vérification comportements

| Page | Comportement | Statut | Notes |
|------|-------------|--------|-------|
| Landing | ScrollReveal entre sections | ✅ Intact | Composant `ScrollReveal.tsx` non modifié |
| Landing | Navigation vers login/signup | ✅ Intact | Routes identiques |
| Auth | Login fonctionne | ✅ Intact | `AuthView` non modifié |
| Auth | Signup fonctionne | ✅ Intact | `AuthView` non modifié |
| Auth | Lien retour landing | ✅ Ajouté | Nouveau comportement per maquette |
| Onboarding | Navigation 3 étapes | ✅ Intact | |
| Onboarding | Preview revenu en temps réel | ✅ Intact | |
| Dashboard | Navigation mensuelle | ✅ Intact | |
| Dashboard | Tabs Dashboard/Timeline/Santé | ✅ Intact | |
| Dashboard | Données financières affichées | ✅ Intact | |
| Dépenses | Filtres catégories | ✅ Intact | |
| Dépenses | Modal ajout via FAB | ✅ Intact | |
| Revenus | Ajout revenu | ✅ Intact | |

---

## Dépendances ajoutées

Aucune nouvelle dépendance npm. La migration est purement CSS + JSX.

| Changement | Type | Détail |
|-----------|------|--------|
| `Plus_Jakarta_Sans` | Font (déjà dans next/font/google) | Importée via `next/font/google`, zéro npm install |

---

## Déviations par rapport au plan

| Élément planifié | Réalisé | Explication |
|-----------------|---------|-------------|
| Bouton signup amber | Teal (compromis) | `AuthView` de `@neondatabase/auth` génère son bouton HTML en interne. Le CSS override via `--primary` est teal. Pas de fork du composant tiers. |
| `ExpenseTrackingRow.tsx` séparé | Modifié directement dans `DepensesTrackingClient.tsx` | Le row est inline dans le composant principal, pas un fichier séparé. Mise à jour directe. |
| 6 pages prévues | 9 composants intégrés | 3 composants dérivés supplémentaires (Revenus, ProjetsEpargne, card Patrimoine accueil) intégrés en même temps. |
| Hotfix gradients (non prévu) | Réalisé | Suppression des gradients hardcodés `#1A7F5A`, `#145C42`, `#3D3BF3` découverts pendant l'intégration. |
| `ParametresClient.tsx` (hors scope) | Amélioré par cascade tokens | Le remplacement des tokens globals a automatiquement corrigé les couleurs sans intervention. |

---

## Fichiers modifiés — Liste complète

### Setup global
- `app/globals.css` — Remplacement complet des tokens `:root`, ajout amber, ombres teal, `.btn-amber`, `::selection`, FAB 56px
- `app/layout.tsx` — Geist → Plus Jakarta Sans, variable `--font-jakarta`, `themeColor: #FAFBFC`

### Navigation
- `components/BottomNav.tsx` — Logo SVG Le Compas, wordmark typographique, amber left border, fond solide bottom nav
- `components/LayoutShell.tsx` — Sidebar 260px, `max-width` desktop adapté

### Landing
- `app/landing/page.tsx` — Refonte complète: tagline monument, hero figure 847$, amber CTAs, sections restructurées

### Auth
- `app/auth/[path]/page.tsx` — Split layout brand panel teal + formulaire, lien retour landing

### Onboarding
- `components/Onboarding.tsx` — Refonte complète: wizard 3 étapes, chips catégories, cartes objectif, fond teal-50, amber finish

### Dashboard
- `components/AccueilClient.tsx` — Section monument, stagger animations, hotfix gradients card patrimoine
- `components/accueil/TabTableauDeBord.tsx` — Flow bar 3 colonnes, budget bars teal/warning/error

### Dépenses
- `components/DepensesTrackingClient.tsx` — Monument total, filter chips pill teal, labels uppercase, tabular-nums

### Revenus
- `components/RevenusTrackingClient.tsx` — Monument total revenus, tokens teal appliqués

### Patrimoine — Feature 6 (maquettes dédiées)
- `components/ProjetsEpargneClient.tsx` — Refonte complète: monument +/- patrimoine, totals bar 2col, section épargne (pot libre + projets), section dettes, FAB expandable, modals inline paiement/charge
- `components/ProjectModal.tsx` — Refonte: sheet header piggy-bank teal, inputs monumentaux, contribution suggérée auto-calculée
- `components/DebtModal.tsx` — Refonte: sheet header carte-crédit rouge, inputs monumentaux, résumé durée + intérêts
- `components/AddSavingsModal.tsx` — Refonte: sheet header flèche-haut teal, affichage progression %
- `components/TransferSavingsModal.tsx` — Refonte: sheet header swap amber, layout Depuis → Vers, bouton "Tout transférer"

---

## Patterns établis pour les futures pages

### Pattern Monument (toutes les pages app)

Chaque page de l'app doit avoir UN élément monumental — le nombre/titre qui domine la vue.

```tsx
<div style={{ textAlign: 'center', padding: '32px 0 24px' }}>
  {/* Greeting + contexte */}
  <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-tertiary)',
              textTransform: 'uppercase', letterSpacing: '0.08em' }}>
    {greeting} — {mois}
  </p>
  {/* Le nombre monument */}
  <h1 style={{ fontSize: 'clamp(3.5rem, 15vw, 6rem)', fontWeight: 800,
               letterSpacing: '-0.04em', lineHeight: 1, color: 'var(--text-primary)' }}>
    <span style={{ fontSize: '0.45em', fontWeight: 600, color: 'var(--accent)',
                  verticalAlign: 'super' }}>$</span>
    {montant}
  </h1>
  {/* Label + status badge */}
  <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{label}</p>
</div>
```

**Tailles par page:**
- Dashboard balance: `clamp(3.5rem, 15vw, 6rem)` / 800
- Dépenses total: `clamp(2.5rem, 12vw, 5rem)` / 800
- Revenus total: `clamp(2.5rem, 12vw, 5rem)` / 800
- Landing tagline: `clamp(3.2rem, 10vw, 9rem)` / 800

### Pattern Symbole monétaire

```tsx
<span style={{ fontSize: '0.45em', fontWeight: 600, color: 'var(--accent)',
              verticalAlign: 'super' }}>$</span>
```

Toujours un `<span>` enfant, jamais concaténé dans la chaîne.

### Pattern Label architectural (uppercase)

```tsx
<span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase',
              letterSpacing: '0.08em', color: 'var(--text-tertiary)' }}>
  SECTION TITLE
</span>
```

### Pattern Filter Chip (pill)

```tsx
<button style={{
  padding: '8px 16px',
  background: active ? 'var(--accent)' : 'var(--surface-raised)',
  color: active ? 'white' : 'var(--text-secondary)',
  border: active ? '1px solid var(--accent)' : '1px solid var(--border-default)',
  borderRadius: '100px',
  fontSize: '13px',
  fontWeight: 600,
}}>
  {label}
</button>
```

### Pattern Logo Le Compas

```tsx
<svg viewBox="-50 -50 100 100" fill="none" width={size} height={size}>
  <rect x="-36" y="-36" width="72" height="72" rx="18" fill="#0F766E"/>
  <path d="M-18 22 C-10 18, -4 8, 0 0 S10 -8, 14 -4 S22 -14, 24 -22"
        stroke="#FAFBFC" strokeWidth="4" strokeLinecap="round"/>
  <circle cx="24" cy="-22" r="3.5" fill="#F59E0B"/>
</svg>
```

Variante inversée (sur fond teal): `rect fill="rgba(255,255,255,0.12)"`.

### Pattern Wordmark

```tsx
<span>
  <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>Mes</span>
  <span style={{ fontWeight: 600, color: 'var(--accent)' }}> Finances</span>
</span>
```

### Pattern Amber Left Border (sidebar active)

```tsx
{active && (
  <div style={{
    position: 'absolute', left: 0, top: 8, bottom: 8,
    width: '3px', background: 'var(--amber)',
    borderRadius: '0 2px 2px 0',
  }} />
)}
```

### Pattern Card avec accent border-left (Patrimoine)

```tsx
// Épargne: bordure teal
<div style={{
  background: 'var(--white, #fff)',
  border: '1px solid var(--slate-200)',
  borderLeft: '4px solid var(--teal-700)',
  borderRadius: 'var(--radius-lg)',
  padding: '18px 18px 16px',
}}>

// Dette: bordure rouge
<div style={{
  border: '1px solid var(--slate-200)',
  borderLeft: '4px solid var(--error)',
  borderRadius: 'var(--radius-lg)',
}}>
```

### Pattern Barre de progression 8px + amber dot tip

```tsx
<div style={{ height: '8px', background: 'var(--slate-100)', borderRadius: '4px',
              overflow: 'visible', position: 'relative' }}>
  <div style={{
    height: '100%', borderRadius: '4px',
    background: 'linear-gradient(90deg, var(--teal-700), var(--teal-800))',
    width: `${Math.max(progress, 2)}%`,
    position: 'relative', transition: 'width 0.8s ease',
  }}>
    <span style={{
      position: 'absolute', right: '-1px', top: '50%', transform: 'translateY(-50%)',
      width: '12px', height: '12px', background: 'var(--amber-500)',
      borderRadius: '50%', border: '2px solid white',
      boxShadow: '0 1px 4px rgba(0,0,0,0.15)', display: 'block',
    }} />
  </div>
</div>
```

Le dot amber est un `<span>` inline — les pseudo-éléments CSS (`::after`) ne fonctionnent pas avec les styles inline React.

### Pattern Sheet Header avec icône

```tsx
<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '16px 24px 0' }}>
  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
    <div style={{
      width: '40px', height: '40px', borderRadius: 'var(--radius-sm)',
      background: 'var(--teal-50)', color: 'var(--teal-700)',   // ou error-light/error pour dettes
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }}>
      {/* SVG icon 20×20 */}
    </div>
    <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--slate-900)',
                letterSpacing: '-0.02em' }}>Titre</h3>
  </div>
  {/* Bouton X fermer */}
</div>
```

### Pattern Form ID association (submit button hors form)

```tsx
// Form avec id
<form id="project-form" onSubmit={handleSubmit}>
  {/* champs */}
</form>

// Submit button dans le footer sheet (hors du form dans le DOM)
<button type="submit" form="project-form" disabled={loading}>
  Soumettre
</button>
```

Permet de séparer le footer des boutons du corps du sheet sans `onClick` hacky.

### Pattern Monument +/- (valeur nette)

```tsx
<p style={{
  fontSize: 'clamp(3rem, 12vw, 5rem)',
  fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1,
  color: isPositive ? 'var(--teal-700)' : 'var(--error)',
}}>
  <span style={{ fontSize: '0.65em', fontWeight: 700, verticalAlign: 'baseline' }}>
    {isPositive ? '+' : '-'}
  </span>
  <span style={{ fontSize: '0.4em', fontWeight: 600, verticalAlign: 'super',
                color: 'inherit' }}>$</span>
  {Math.abs(valeurNette).toLocaleString('fr-CA', { minimumFractionDigits: 0 })}
</p>
```

---

## Éléments hors scope (non intégrés)

| Composant / Page | Raison | Recommandation |
|-----------------|--------|----------------|
| `app/cartes/` | Hors scope initial. Les tokens globaux ont mis à jour les couleurs par cascade, mais aucun travail spécifique n'a été fait. | Vérifier visuellement que la cascade de tokens est suffisante. Si non, appliquer le pattern monument + tokens teal manuellement. |
| `app/sections/` | Même situation que cartes. | Idem. |
| `ParametresClient.tsx` (détail) | Mis à jour par cascade, non révisé en détail. | Inspecter les sous-pages (`/parametres/devise`, `/parametres/notifications`, `/parametres/rappels`) pour vérifier que les tokens s'appliquent correctement. |
| Bouton signup amber | Compromis accepté. `AuthView` gère ses propres styles. | Si prioritaire: inspecter les classes CSS rendues par `AuthView` et appliquer un override CSS ciblé dans `globals.css`. |
| `CartesClient.tsx` | Hors scope. | Dériver du pattern standard card + tokens teal. |
| `SectionsClient.tsx` | Hors scope. | Dériver du pattern standard card + tokens teal. |
| Pages API `app/api/` | Pas de travail UI. | Aucune action requise. |
| `lib/` (actions, utils, types) | Logique métier intacte. | Aucune action requise. |

---

## Notes pour les développeurs

1. **Ne pas créer de `tailwind.config.ts`** — Le projet est CSS-first avec Tailwind v4. Toutes les personnalisations vont dans `globals.css`. Créer un fichier de config serait une régression.

2. **Tokens comme source de vérité** — Toujours utiliser `var(--accent)`, `var(--amber)`, `var(--surface-raised)` etc. Jamais de valeurs hex hardcodées dans les composants (sauf le SVG du logo, qui est une exception documentée).

3. **Stance Typography Monument** — Chaque nouvelle page doit avoir UN élément monumental (voir pattern ci-dessus). C'est la décision de design core validée.

4. **Amber = jalons, Teal = actions standard** — Règle absolue. Amber pour signup, onboarding finish, achievements. Teal pour tout le reste.

5. **Ombres toujours teal-tintées** — Jamais `rgba(0,0,0,x)` ou `rgba(13,13,13,x)`. Utiliser `var(--shadow-sm/md/lg/xl)` depuis `globals.css`.

6. **Google Fonts** — Ne pas utiliser le lien CDN des maquettes HTML. Utiliser `next/font/google` dans `layout.tsx` (déjà en place).
