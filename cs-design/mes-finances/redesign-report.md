# Rapport de Redesign — Mes Finances
**Date**: 2026-03-02
**Statut**: Complet
**Direction**: 3 — Typography Monument
**Stack**: Next.js App Router · TypeScript · Tailwind CSS v4 · CSS variables · Neon Auth

---

## Résumé exécutif

Le redesign complet de l'application "Mes Finances" est terminé. 7 features ont été redesignées et intégrées, couvrant l'intégralité du parcours utilisateur : de la landing page jusqu'au tableau de bord mensuel, en passant par la configuration, le suivi quotidien et la gestion patrimoniale.

**Périmètre total :**
- 7 features redesignées et intégrées
- 26 composants/pages modifiés
- 1 stance créative : Typography Monument (Direction 3)
- Migration identité complète : Indigo/Stone → Teal/Amber
- Police : Geist → Plus Jakarta Sans (300–800)
- 0 nouvelle dépendance npm (migration purement CSS + JSX)
- 0 erreurs TypeScript au terme de l'intégration

---

## Stance créative — Typography Monument

### Principe fondateur

**Typography IS the architecture.** Les nombres et les mots sont des monuments sculptés qui commandent le viewport. Aucune image ne concurrence le texte. L'interface communique par le poids, l'échelle et le rythme de sa typographie.

L'utilisateur ouvre l'app et le montant disponible le confronte — à `clamp(3.5rem, 15vw, 6rem)` / weight 800. Ce n'est pas une décoration. C'est le design.

### Pourquoi Typography Monument plutôt que les alternatives

| Alternative rejetée | Raison du rejet |
|---------------------|-----------------|
| **Direction 1 — Radical Simplicity** | Clarté maximale mais zéro personnalité visuelle. Une app budget qui ressemble à un tableur ne crée pas de connexion émotionnelle avec ses chiffres. |
| **Direction 2 — Invisible Interface** | L'interface disparaît — pertinent pour les outils professionnels, pas pour une app financière personnelle où l'utilisateur a besoin de ressentir le poids de ses chiffres. |

### Le sacrifice accepté

Typography Monument sacrifie les illustrations, les icônes décoratives et les graphiques ornementaux. Il n'y a pas d'images héros, pas de pictogrammes, pas de charts décoratifs. La hiérarchie typographique et les contrastes de poids/échelle **sont** l'intérêt visuel.

### Règle Teal/Amber

| Couleur | Usage | Sémantique |
|---------|-------|------------|
| Teal `#0F766E` | Actions standard, navigation, boutons primaires, symboles monétaires | "C'est une action normale" |
| Amber `#F59E0B` | CTAs de conversion, milestone moments, dot indicateur sidebar | "C'est un moment clé" |

**Règle absolue :** Amber = moment de jalon (inscription, fin d'onboarding, objectif atteint). Teal = action standard (connexion, ajout de transaction, navigation).

### Typographie — Niveaux d'échelle

| Niveau | Taille | Weight | Usage |
|--------|--------|--------|-------|
| Monument | `clamp(3.5rem, 15vw, 6rem)` | 800 | Solde disponible dashboard |
| Display | `clamp(3.2rem, 10vw, 9rem)` | 800 | Tagline landing hero |
| Hero Figure | `clamp(4rem, 14vw, 10rem)` | 800 | Montant hero landing (847$) |
| Dépenses/Revenus | `clamp(2.5rem, 12vw, 5rem)` | 800 | Totaux pages tracking |
| Patrimoine | `clamp(3rem, 12vw, 5rem)` | 800 | Valeur nette |
| Label architectural | 11–13px / 700 / uppercase | — | Titres de sections ("BUDGET", "PATRIMOINE") |

---

## Features redesignées

### Feature 1 — Données de référence

**Pages** : `/sections`, `/cartes`, `/cartes/[id]`
**Composants redesignés** :
- `components/SectionsClient.tsx`
- `components/CartesClient.tsx`
- `components/CarteDetailClient.tsx`

**Patterns clés appliqués :**
- Monument count header : nombre de sections/cartes en monument au sommet de page
- Grille 7 colonnes pour les emojis (36 emojis), 8 colonnes pour les swatches de couleurs
- Cartes bancaires visuelles avec dégradé (`min-height: 130px`), 8 thèmes couleurs
- `BankCardVisual` — sous-composant dédié pour le rendu graphique des cartes
- FAB mobile-only 56px + bouton desktop-only (utilitaires `.fab-mobile-only` / `.btn-desktop-only`)
- Bottom sheet amélioré avec preview carte en temps réel

**Avant/après :**
- Avant : listes plates sans hiérarchie visuelle, boutons indigo, aucune preview carte.
- Après : monument count, cartes bancaires visuelles en gradient, preview live dans le sheet, couleurs teal/amber, nouvelles utilitaires CSS.

---

### Feature 2 — Configuration des charges fixes

**Pages** : `/parametres/charges`
**Composants redesignés** :
- `components/ExpenseTemplateManager.tsx`
- `components/ExpenseModal.tsx`
- `app/parametres/charges/page.tsx`

**Patterns clés appliqués :**
- Groupement par section avec label architectural uppercase
- Barre accent 3px gauche sur les items selon le statut
- Chips de sélection fréquence (pill 100px radius) : Hebdomadaire / Bimensuel / Mensuel / Annuel
- Badge "Prélèvement auto" teal-50 sur les charges automatiques
- Total mensuel normalisé affiché en monument de sous-section
- Sheet header structuré avec icône dans conteneur coloré 40×40px

**Avant/après :**
- Avant : liste simple avec boutons indigo, modal générique sans structure header.
- Après : groupement clair par section, chips fréquence visuels, badge auto-débit, inputs montant monumentaux (24px/800/tabular-nums).

---

### Feature 3 — Configuration des revenus récurrents

**Pages** : `/parametres/revenus`
**Composants redesignés** :
- `components/IncomeTemplateManager.tsx`
- `components/IncomeModal.tsx`
- `app/parametres/revenus/page.tsx`

**Patterns clés appliqués :**
- Monument total annualisé des revenus
- Chips sélection type source (Emploi / Business / Autre) en pill
- Chips fréquence de paiement (Bimensuel / Mensuel / Annuel / Variable)
- Badge "Dépôt automatique" teal-50 pour les revenus à dépôt auto
- Datepicker spécial pour l'ancrage bimensuel
- Champ montant estimé conditionnel pour les revenus variables

**Avant/après :**
- Avant : formulaire plat sans distinction visuelle entre revenu fixe et variable.
- Après : chips de sélection, badge dépôt auto, inputs monumentaux, preview date de prochain paiement.

---

### Feature 4 — Suivi des dépenses mensuelles

**Pages** : `/depenses`
**Composants redesignés** :
- `components/DepensesTrackingClient.tsx`
- `components/ExpenseTrackingRow.tsx`
- `components/AdhocExpenseModal.tsx`

**Patterns clés appliqués :**
- Monument total dépensé : `clamp(2.5rem, 12vw, 5rem)` / 800 en tête de page
- Filter chips pill (100px radius) : teal actif / blanc inactif, `padding: 8px 16px`
- Barre progression 6–8px : teal sous 80% / amber 80–100% / rouge au-dessus
- Labels de groupe uppercase 12px/700/0.08em letter-spacing
- `font-variant-numeric: tabular-nums` sur tous les montants
- FAB 56px mobile-only sur mois courant (masqué sur mois passés)
- Barre overflow avec color coding dynamique

**Avant/après :**
- Avant : header texte simple, filtres scrollables basic, barre de progression sans coding couleur.
- Après : monument total dominant, filter chips pills, barre dynamique teal/amber/rouge, groupement par statut (À venir / Payées / En retard / Reportées), FAB contextuel.

---

### Feature 5 — Suivi des revenus & allocation mensuelle

**Pages** : `/revenus`
**Composants redesignés** :
- `components/RevenusTrackingClient.tsx`
- `components/AdhocAllocationModal.tsx` (nouveau)

**Patterns clés appliqués :**
- Monument total reçu/attendu : format scoreboard fraction (`received / expected`) — slash 300 weight
- Tab "Revenus" + tab "Allocation" avec FAB contextuel qui change selon le tab actif
- Barres progression d'allocation avec code couleur teal/amber/rouge
- Badge surallocation (warning non bloquant) : fond amber-100, texte amber-700
- Teal pour les revenus reçus (positif), slate pour les attendus (neutre)
- Chip allocation suggérée par enveloppe budgétaire

**Avant/après :**
- Avant : liste revenus sans structure claire, pas de vue allocation dédiée.
- Après : monument scoreboard, deux tabs fonctionnels, vue allocation avec enveloppes et barres, FAB adaptif selon le tab, alerte surallocation.

---

### Feature 6 — Patrimoine (Épargne & Dettes)

**Pages** : `/projets`
**Composants redesignés** :
- `components/ProjetsEpargneClient.tsx` (~870 lignes)
- `components/ProjectModal.tsx`
- `components/DebtModal.tsx`
- `components/AddSavingsModal.tsx`
- `components/TransferSavingsModal.tsx`

**Patterns clés appliqués :**
- Monument +/- patrimoine : `clamp(3rem, 12vw, 5rem)` / 800, teal si positif / rouge si négatif
- Barre totaux 2 colonnes côte à côte : épargne (teal) + dettes (rouge)
- Card épargne : `border-left: 4px solid var(--teal-700)`
- Card dette : `border-left: 4px solid var(--error)`
- Badge PERMANENT sur l'épargne libre (non supprimable)
- Barre progression 8px gradient teal + amber dot à la pointe (`<span>` inline)
- Chip contribution suggérée : horloge icon + "~/mois", fond teal-50
- FAB expandable 3 options (mobile-only) avec backdrop
- 4 modals refaits avec sheet header structuré (icône 40×40px + titre)
- Form ID association HTML5 pour boutons submit hors du `<form>` DOM

**Avant/après :**
- Avant : onglets Actifs / Passifs séparés, cards plates sans accent couleur, FAB avec emojis, modals sans header structuré.
- Après : vue unifiée épargne + dettes simultanément, monument +/- patrimoine, cards avec border-left colorée, FAB expandable, 4 modals refaits, chip contribution suggérée auto-calculée.

---

### Feature 7 — Tableau de bord mensuel

**Pages** : `/`
**Composants redesignés** :
- `components/AccueilClient.tsx`
- `components/accueil/TabTableauDeBord.tsx`
- `components/accueil/TabTimeline.tsx`
- `components/accueil/TabSanteFinanciere.tsx`
- `components/MonthNavigator.tsx`

**Patterns clés appliqués :**
- Monument balance disponible : `clamp(3.5rem, 15vw, 6rem)` / 800, centré en tête de page
- Greeting contextuel + label architectural mois en uppercase
- MonthNavigator repositionné sous le badge monument
- Flow bar 3 colonnes : fond slate-100, `gap: 2px`, `border-radius: var(--radius-md)`
- Budget progress bars : teal / amber (>80%) / rouge (>100%)
- Card patrimoine token-based (suppression des gradients hardcodés `#1A7F5A`, `#145C42`)
- Animations staggerées (délais 0s → 0.4s sur les sections)
- SVG score ring animé (santé financière)
- Valeur nette en snapshot permanent

**Avant/après :**
- Avant : card patrimoine gradient hardcodé, monument absent, flow bar format différent, pas d'animations staggerées.
- Après : monument solde dominant, flow bar standardisée, card patrimoine token-based, animations staggerées, score ring santé financière, 9 appels SQL parallèles côté serveur.

---

## Composants transversaux redesignés

En plus des 7 features, les composants suivants ont été redesignés :

| Composant | Travail réalisé |
|-----------|----------------|
| `components/ParametresClient.tsx` | Tokens teal appliqués par cascade + link rows teal-50 bg, labels uppercase |
| `app/parametres/allocation/page.tsx` | Nouvelle page allocation mensuelle |
| `app/globals.css` | Remplacement complet des tokens `:root`, ajout amber, ombres teal, utilitaires FAB/desktop |
| Navigation (`BottomNav`, `LayoutShell`) | Logo SVG Le Compas, wordmark typographique, amber left border sidebar |

---

## Patterns design system établis

Ces 10 patterns sont documentés comme réutilisables pour toutes les futures pages de l'application.

### Pattern 1 — Monument Typography Hero

Chaque page possède UN élément monumental dominant le viewport.

```tsx
<div style={{ textAlign: 'center', padding: '32px 0 24px' }}>
  <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-tertiary)',
              textTransform: 'uppercase', letterSpacing: '0.08em' }}>
    LABEL ARCHITECTURAL
  </p>
  <h1 style={{ fontSize: 'clamp(3.5rem, 15vw, 6rem)', fontWeight: 800,
               letterSpacing: '-0.04em', lineHeight: 1, color: 'var(--text-primary)' }}>
    <span style={{ fontSize: '0.45em', fontWeight: 600, color: 'var(--accent)',
                  verticalAlign: 'super' }}>$</span>
    {montant}
  </h1>
  <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{label}</p>
</div>
```

### Pattern 2 — Bottom sheet (mobile) + Centered modal (desktop)

Pattern uniforme pour toutes les actions de création/modification. Bottom sheet sur mobile (slide up depuis le bas), modal centré sur desktop. La même structure JSX s'adapte via CSS.

### Pattern 3 — Barre accent 3px gauche

Indicateur de statut ou de catégorie via une bordure gauche colorée.

```tsx
// Active sidebar item — amber
<div style={{ position: 'absolute', left: 0, top: 8, bottom: 8,
              width: '3px', background: 'var(--amber)', borderRadius: '0 2px 2px 0' }} />

// Card épargne — teal
style={{ borderLeft: '4px solid var(--teal-700)' }}

// Card dette — rouge
style={{ borderLeft: '4px solid var(--error)' }}
```

### Pattern 4 — Scoreboard fraction (received / expected)

Format de lecture rapide pour les totaux revenus.

```tsx
<span style={{ fontWeight: 800 }}>{received}</span>
<span style={{ fontWeight: 300, color: 'var(--text-tertiary)' }}> / </span>
<span style={{ fontWeight: 500, color: 'var(--text-tertiary)' }}>{expected}</span>
```

### Pattern 5 — Card avec bordure gauche colorée

Épargne = teal, Dette = rouge. 4px de large, `border-radius: var(--radius-lg)` sur le reste.

### Pattern 6 — FAB 56px mobile-only + bouton desktop-only

```css
/* globals.css */
.fab-mobile-only  { /* visible < 768px */ }
.btn-desktop-only { /* visible >= 768px */ }
```

Les deux coexistent dans le JSX — CSS gère la visibilité selon le breakpoint. Jamais de duplication de logique.

### Pattern 7 — Chips sélection (fréquence, type)

```tsx
<button style={{
  padding: '8px 16px',
  background: active ? 'var(--accent)' : 'var(--surface-raised)',
  color: active ? 'white' : 'var(--text-secondary)',
  border: active ? '1px solid var(--accent)' : '1px solid var(--border-default)',
  borderRadius: '100px',
  fontSize: '13px', fontWeight: 600,
}}>
  {label}
</button>
```

### Pattern 8 — Barres progression 6–8px avec color coding

```tsx
const getBarColor = (ratio: number) =>
  ratio > 1 ? 'var(--error)' : ratio > 0.8 ? 'var(--warning)' : 'var(--accent)';

<div style={{ height: '8px', background: 'var(--slate-100)', borderRadius: '4px' }}>
  <div style={{ height: '100%', borderRadius: '4px',
                background: getBarColor(spent / budget),
                width: `${Math.min(ratio * 100, 100)}%`,
                transition: 'width 0.8s ease' }} />
</div>
```

### Pattern 9 — FAB expandable (2 ou 3 options Patrimoine)

Menu avec backdrop, 3 items dans la liste, icône dans conteneur coloré (teal-50 / error-light). Backdrop `className="fab-mobile-only"` pour éviter collision desktop.

### Pattern 10 — SVG score ring animé (santé financière)

Score circulaire SVG avec `strokeDasharray` animé. Calcul : `coverageActual = min(actualTotal / planned_total * 100, 100)`. Rendu dans `TabSanteFinanciere`.

---

## Design tokens utilisés

### Palette principale

| Token CSS | Valeur | Usage principal |
|-----------|--------|-----------------|
| `--accent` | `#0F766E` (teal-700) | Couleur primaire : boutons, liens, symboles monétaires, nav active |
| `--accent-hover` | `#115E59` (teal-800) | Hover boutons primaires |
| `--accent-subtle` | `#F0FDFA` (teal-50) | Fonds états actifs, badges positifs, conteneurs icônes |
| `--amber` | `#F59E0B` (amber-500) | CTAs conversion, dot sidebar, amber dot barre progression |
| `--amber-hover` | `#D97706` (amber-600) | Hover boutons amber |
| `--amber-subtle` | `#FEF3C7` (amber-100) | Fonds amber, badge surallocation |
| `--surface-ground` | `#FAFBFC` (slate-50) | Fond de page |
| `--surface-sunken` | `#F1F5F9` (slate-100) | Insets, tracks barres progression |
| `--text-primary` | `#0F172A` (slate-900) | Texte principal, montants monument |
| `--text-secondary` | `#334155` (slate-700) | Texte secondaire |
| `--text-tertiary` | `#64748B` (slate-500) | Labels, hints, slash scoreboard |
| `--positive` | `#059669` (emerald-600) | États positifs, épargne |
| `--negative` | `#DC2626` (red-600) | Erreurs, dépenses en retard, dettes |
| `--border-default` | `#E2E8F0` (slate-200) | Bordures, dividers |

### Tokens de shadow

```css
--shadow-sm:  0 1px 2px rgba(15, 118, 110, 0.05);     /* Cards au repos */
--shadow-md:  0 4px 12px rgba(15, 118, 110, 0.08);    /* Cards au hover */
--shadow-lg:  0 8px 24px rgba(15, 118, 110, 0.12);    /* FAB, éléments élevés */
--shadow-xl:  0 16px 48px rgba(15, 23, 42, 0.12);     /* Modals */
--shadow-accent: 0 4px 16px rgba(15, 118, 110, 0.18), 0 1px 4px rgba(15, 118, 110, 0.08);
--shadow-fab:    0 8px 24px rgba(15, 118, 110, 0.12);
```

Toutes les ombres sont teal-tintées. Jamais `rgba(0,0,0,x)` dans les composants.

### Tokens de radius

| Token | Valeur | Usage |
|-------|--------|-------|
| `--radius-sm` | 8px | Inputs, petits boutons, conteneurs icônes |
| `--radius-md` | 12px | Boutons, cards moyennes, filter chips |
| `--radius-lg` | 18px | Cards principales, modals, cartes bancaires |
| `100px` (pill) | 100px | Chips de sélection, badges statut, FAB |

### Typographie

```css
--font: 'Plus Jakarta Sans', system-ui, sans-serif;
/* Weights chargés : 300, 400, 500, 600, 700, 800 */
```

Migration : Geist → Plus Jakarta Sans via `next/font/google` dans `app/layout.tsx`.

### Utilitaires CSS ajoutés

```css
/* globals.css */
.fab-mobile-only  — masque FAB >= 768px
.btn-desktop-only — affiche bouton add uniquement >= 768px
.btn-amber        — bouton CTA conversion (landing + onboarding)
::selection       — { background: rgba(15, 118, 110, 0.15); color: var(--text-primary); }
```

---

## Migration de la palette (avant/après)

| Token | Avant (Indigo/Stone) | Après (Teal/Amber) |
|-------|---------------------|---------------------|
| `--accent` | `#3D3BF3` (indigo) | `#0F766E` (teal-700) |
| `--accent-hover` | `#3230D4` | `#115E59` (teal-800) |
| `--accent-subtle` | `#EDEDFE` | `#F0FDFA` (teal-50) |
| `--surface-ground` | `#F5F4F1` (stone chaud) | `#FAFBFC` (slate-50 froid) |
| `--surface-sunken` | `#EEEDEA` | `#F1F5F9` (slate-100) |
| `--text-primary` | `#0D0D0D` | `#0F172A` (slate-900) |
| `--radius-md` | `10px` | `12px` |
| `--radius-lg` | `14px` | `18px` |

Nouveaux tokens ajoutés : `--amber`, `--amber-hover`, `--amber-subtle`, `--shadow-accent`, `--shadow-fab`, `--shadow-fab-hover`.

---

## Décisions architecturales

### 1. CSS-first, pas de tailwind.config.ts

Tailwind v4 lit les variables directement via `@import "tailwindcss"`. Toutes les personnalisations sont dans `globals.css`. Aucun fichier `tailwind.config.ts` créé — ce serait une régression.

### 2. Tokens comme source de vérité unique

Jamais de valeurs hex hardcodées dans les composants, sauf le SVG du logo (exception documentée). Tous les composants utilisent `var(--accent)`, `var(--amber)`, `var(--surface-raised)` etc.

### 3. Suppression des gradients hardcodés

Hotfix réalisé lors de l'intégration : suppression de tous les gradients avec valeurs hex directes (`#1A7F5A`, `#145C42`, `#3D3BF3`) dans `AccueilClient.tsx`. Remplacés par `var(--positive)`, `var(--accent)`.

### 4. Form ID association HTML5

Les boutons submit des modals sont placés dans le footer (hors du `<form>` dans le DOM) via l'attribut HTML5 `form="id"`. Permet de séparer visuellement le footer du corps sans `onClick` hacky.

### 5. Amber dot de progression = `<span>` inline

Les pseudo-éléments CSS (`::after`) ne fonctionnent pas avec les `style` inline en React. Le dot amber à la pointe des barres de progression est un `<span>` enfant avec `position: absolute`.

### 6. Compromis bouton signup

Le composant `AuthView` de `@neondatabase/auth` génère son propre HTML. Le bouton signup reste teal via `--primary: var(--accent)` — il est impossible de le rendre amber sans forker le composant tiers. Compromis accepté et documenté.

---

## Fichiers de référence

### Maquettes HTML

| Fichier | Feature couverte |
|---------|-----------------|
| `cs-design/mes-finances/final/landing.html` | Landing page |
| `cs-design/mes-finances/final/login.html` | Auth (Login + Signup) |
| `cs-design/mes-finances/final/onboarding.html` | Onboarding wizard |
| `cs-design/mes-finances/final/dashboard.html` | Tableau de bord |
| `cs-design/mes-finances/final/depenses.html` | Suivi dépenses |
| `patrimoine-main.html` + `patrimoine-actions.html` | Patrimoine (Feature 6) |

### Fichiers de configuration design

| Fichier | Contenu |
|---------|---------|
| `cs-design/mes-finances/project-preferences.md` | Stance, tokens, patterns, règles Teal/Amber |
| `cs-design/mes-finances/redesign-status.yaml` | Statut d'avancement par feature |
| `cs-design/mes-finances/features/feature-map.md` | Carte des features, dépendances, composants |
| `cs-design/mes-finances/integration/integration-report.md` | Journal d'intégration détaillé par composant |

### Fichiers applicatifs clés

| Fichier | Rôle |
|---------|------|
| `app/globals.css` | Tokens CSS, animations, utilitaires — source de vérité du design system |
| `app/layout.tsx` | Police Plus Jakarta Sans, themeColor PWA |
| `components/BottomNav.tsx` | Logo SVG Le Compas, wordmark, amber border |
| `components/AccueilClient.tsx` | Monument dashboard, stagger animations |
| `components/ProjetsEpargneClient.tsx` | Monument +/- patrimoine, FAB expandable |
| `components/DepensesTrackingClient.tsx` | Monument dépenses, filter chips, barres progression |
| `components/RevenusTrackingClient.tsx` | Monument revenus, scoreboard fraction, onglets |

---

## Logo Le Compas

```tsx
<svg viewBox="-50 -50 100 100" fill="none" width={size} height={size}>
  <rect x="-36" y="-36" width="72" height="72" rx="18" fill="#0F766E"/>
  <path d="M-18 22 C-10 18, -4 8, 0 0 S10 -8, 14 -4 S22 -14, 24 -22"
        stroke="#FAFBFC" strokeWidth="4" strokeLinecap="round"/>
  <circle cx="24" cy="-22" r="3.5" fill="#F59E0B"/>
</svg>
```

Variante inversée (sur fond teal) : `rect fill="rgba(255,255,255,0.12)"`.

### Wordmark

```tsx
<span>
  <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>Mes</span>
  <span style={{ fontWeight: 600, color: 'var(--accent)' }}> Finances</span>
</span>
```

---

## Checklist de conformité design

| Règle | Statut |
|-------|--------|
| Chaque page a un élément monument | Conforme |
| Ombres teal-tintées partout | Conforme |
| Symbole $ en `<span>` superscript teal | Conforme |
| Amber uniquement sur CTAs conversion et milestones | Conforme |
| Tokens CSS — zéro hex hardcodé dans les composants | Conforme (exception logo SVG documentée) |
| Police Plus Jakarta Sans 300–800 | Conforme |
| FAB 56px mobile-only | Conforme |
| Bouton desktop-only en complément | Conforme |
| 0 erreur TypeScript | Conforme |
| 0 nouvelle dépendance npm | Conforme |
