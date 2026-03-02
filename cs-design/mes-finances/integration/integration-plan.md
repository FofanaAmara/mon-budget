# Plan d'intégration — Mes Finances

**Date**: 2026-03-01
**Préparé par**: Design Integrator
**Mode**: Plan only (exécution déléguée aux étapes suivantes)

---

## Stack détecté

| Aspect | Valeur |
|--------|--------|
| Framework | Next.js 16.1.6 (App Router, TypeScript) |
| React | 19.2.3 |
| CSS | Tailwind CSS v4 (`@import "tailwindcss"`) + CSS custom properties dans `globals.css` |
| Auth | `@neondatabase/auth` (composants `AuthView` pré-construits) |
| Base de données | Neon (PostgreSQL serverless) |
| Font actuelle | Geist (via `next/font/google`, variable `--font-geist`) |
| Font cible | Plus Jakarta Sans (via `next/font/google`) |
| Icônes | SVG inline (aucune librairie externe) |
| Breakpoints | `md` = 768px (Tailwind), app utilise `@media (min-width: 768px)` pour sidebar |

---

## Delta identitaire (situation actuelle vs cible)

### Ce qui est DIFFÉRENT et doit changer

| Élément | Actuel | Cible (maquettes) |
|---------|--------|-------------------|
| **Police** | Geist (geometrique, neutre) | Plus Jakarta Sans (humanist, expressif) |
| **Palette de couleurs** | Indigo (`--accent: #3D3BF3`) + tons chauds ("warm stone") | Teal (`--teal-700: #0F766E`) + Amber (`--amber-500: #F59E0B`) |
| **Fond de page** | `--surface-ground: #F5F4F1` (stone chaud) | `--slate-50: #FAFBFC` (neige froide) |
| **Ombres** | Tintées indigo-chaud (`rgba(13,13,13,x)`) | Tintées teal (`rgba(15,118,110,x)`) |
| **Rayon de bordure** | `--radius-lg: 14px`, `--radius-xl: 20px` | `--radius-lg: 18px`, pas de xl sur cartes |
| **Logo/symbole** | Carré indigo + graphe en W blanc | Carré teal + courbe de croissance + point amber |
| **Wordmark** | "Mes Finances" (texte simple, Geist 700) | "**Mes** Finances" (800 slate-900 + 600 teal-700, Jakarta) |
| **Sidebar (desktop)** | Fond blanc, accent = indigo, indicateur dot | Fond blanc, accent = teal-50/teal-700, indicateur amber left border |
| **Bottom nav** | Frosted glass, icônes indigo actives | Fond solide blanc, icônes teal actives |
| **FAB** | Indigo `--accent` | Teal `--teal-700` |
| **Boutons primaires** | Indigo | Teal (standard) ou Amber (conversion) |
| **Auth pages** | Page centrée simple, fond `--surface-ground` | Split layout: brand panel teal gauche + formulaire droit |
| **Onboarding** | Overlay simple sur fond `--surface-ground` | Wizard 3 étapes sur fond `--teal-50` avec textures |
| **Landing** | Typography monument indigo (tagline + mockup téléphone) | Typography monument teal/amber (tagline géante + figure 847$) |
| **Dashboard (accueil)** | Patrimoine card gradient + tabs + month navigator | Monument balance centré + flow bar 3 colonnes + sections staggerées |

### Ce qui est CORRECT et peut rester

- Structure App Router (routes identiques aux maquettes)
- Logique de données (server components, actions)
- Composant `BottomNav` (structure, 4-5 items) — adapter les couleurs
- Composant `LayoutShell` (sidebar/nav conditionnels) — adapter dimensions + couleurs
- Composants modaux (structure sheet) — adapter couleurs
- `ScrollReveal` sur la landing — garder
- Patterns de formulaire existants dans auth — adapter via CSS cible

---

## Approche globale

### Stratégie de remplacement des tokens

Le projet utilise **CSS custom properties dans `globals.css`** comme source de vérité. Tailwind v4 lit le fichier via `@import "tailwindcss"`. Il n'y a pas de `tailwind.config.ts` — la configuration est CSS-first.

**Approche**: Remplacer les tokens CSS dans `globals.css` pour établir la nouvelle identité teal/amber, puis mettre à jour les composants qui utilisent les anciens tokens (`var(--accent)`, `var(--surface-ground)`, etc.).

Les nouveaux tokens doivent:
1. Remplacer les variables existantes (`--accent`, `--surface-ground`, etc.) par les valeurs teal
2. Ajouter les nouveaux tokens teal/amber comme variables nommées
3. Conserver les mappings shadcn/ui (requis par `@neondatabase/auth`)
4. Modifier la police root de Geist à Plus Jakarta Sans

### Stratégie fonts

Remplacer dans `app/layout.tsx`:
- `import { Geist } from 'next/font/google'` → `import { Plus_Jakarta_Sans } from 'next/font/google'`
- Charger les poids 300, 400, 500, 600, 700, 800
- Mettre à jour la variable CSS de `--font-geist` à `--font-jakarta`
- Mettre à jour `body.className` en conséquence

### Triage UX : Skin vs Experience Design

| Page / Flow | Triage | Justification |
|-------------|--------|---------------|
| **Landing** | Skin | Structure existante (nav + hero + features + steps + trust + CTA + footer) est proche de la maquette. Changements: couleurs, police, tagline, hero typography monument |
| **Auth (login/signup)** | Experience Design partielle | L'actuel est un composant `<AuthView>` préfabriqué centré. La maquette demande un split layout teal brand panel + form. Il faut wraper `AuthView` dans ce layout — cela ne modifie pas le composant auth mais change le layout de la page |
| **Onboarding** | Experience Design | L'actuel est un overlay 2 étapes (bienvenue + comment ça marche). La maquette montre un wizard 3 étapes sur fond teal-50 avec chips catégories et objectifs. Le composant doit être refait |
| **Dashboard (Accueil)** | Experience Design partielle | La page actuelle a tabs + patrimoine card + month navigator. La maquette montre monument balance + flow bar + sections sans tabs. Il faut restructurer `AccueilClient` et `TabTableauDeBord` |
| **Dépenses** | Skin | Structure similaire (liste de dépenses + filtres + modal). Changer: couleurs, monument total, filter chips teal |
| **Navigation (sidebar/bottom nav)** | Skin | Structure correcte, changer identité visuelle (teal, amber border indicator, logo) |

---

## Setup global (Step 3)

Changements à faire UNE FOIS avant tout travail sur les pages.

### 3.1 — `app/globals.css` : Remplacement complet des tokens

Remplacer tout le bloc `:root { ... }` par les nouveaux tokens teal/amber. Conserver les classes utilitaires (`.card`, `.fab`, `.sheet`, etc.) en les adaptant aux nouvelles valeurs.

**Tokens à remplacer:**

```css
:root {
  /* SURFACES */
  --surface-ground:   #FAFBFC;   /* était: #F5F4F1 (stone) → snow */
  --surface-raised:   #FFFFFF;
  --surface-sunken:   #F1F5F9;   /* était: #EEEDEA → slate-100 */
  --surface-inset:    #F1F5F9;   /* était: #F8F7F5 → slate-100 */
  --surface-overlay:  rgba(15, 23, 42, 0.5);  /* était: rgba(13,13,13,0.45) */

  /* TEXT */
  --text-primary:     #0F172A;   /* était: #0D0D0D → slate-900 */
  --text-secondary:   #334155;   /* était: #6B6966 → slate-700 */
  --text-tertiary:    #64748B;   /* était: #A3A09A → slate-500 */
  --text-inverted:    #FFFFFF;

  /* ACCENT (teal remplace indigo) */
  --accent:           #0F766E;   /* était: #3D3BF3 (indigo) → teal-700 */
  --accent-hover:     #115E59;   /* était: #3230D4 → teal-800 */
  --accent-subtle:    #F0FDFA;   /* était: #EDEDFE → teal-50 */
  --accent-muted:     #5EEAD4;   /* teal-300 pour états désactivés */

  /* AMBER (nouveau: pour CTAs conversion + achievements) */
  --amber:            #F59E0B;
  --amber-hover:      #D97706;
  --amber-subtle:     #FEF3C7;

  /* SEMANTIC */
  --positive:         #059669;   /* était: #1A7F5A → emerald-600 */
  --positive-subtle:  #ECFDF5;   /* était: #E8F5EE */
  --positive-text:    #065F46;   /* était: #145C42 */
  --negative:         #DC2626;   /* était: #C7382D → red-600 */
  --negative-subtle:  #FEF2F2;   /* était: #FBE9E7 */
  --negative-text:    #991B1B;   /* était: #9A2B23 */
  --warning:          #F59E0B;
  --warning-subtle:   #FEF3C7;
  --warning-text:     #92400E;

  /* BORDERS */
  --border-default:   #E2E8F0;   /* était: #E5E3DF → slate-200 */
  --border-strong:    #CBD5E1;   /* était: #D1CFC9 → slate-300 */
  --border-focus:     var(--accent);

  /* SHADOWS (teal-tinted) */
  --shadow-xs:   0 1px 2px rgba(15, 118, 110, 0.05);
  --shadow-sm:   0 1px 2px rgba(15, 118, 110, 0.05),
                 0 1px 3px rgba(15, 118, 110, 0.03);
  --shadow-md:   0 4px 12px rgba(15, 118, 110, 0.08),
                 0 1px 4px rgba(15, 118, 110, 0.04);
  --shadow-lg:   0 8px 24px rgba(15, 118, 110, 0.12),
                 0 2px 8px rgba(15, 118, 110, 0.04);
  --shadow-xl:   0 16px 48px rgba(15, 23, 42, 0.12),
                 0 4px 12px rgba(15, 118, 110, 0.05);
  --shadow-accent: 0 4px 16px rgba(15, 118, 110, 0.18),
                   0 1px 4px rgba(15, 118, 110, 0.08);
  --shadow-fab:      0 8px 24px rgba(15, 118, 110, 0.12);
  --shadow-fab-hover: 0 12px 32px rgba(15, 118, 110, 0.16);

  /* RADIUS */
  --radius-xs:   4px;
  --radius-sm:   8px;    /* était: 6px → maquette utilise 8px pour inputs */
  --radius-md:   12px;   /* était: 10px → maquette utilise 12px pour boutons */
  --radius-lg:   18px;   /* était: 14px → maquette utilise 18px pour cards */
  --radius-xl:   24px;   /* était: 20px */
  --radius-full: 9999px;
  --radius-sheet: 24px;
}
```

**Attention**: Conserver les mappings shadcn/ui (requis par `AuthView`):
```css
--primary: var(--accent);
--ring: var(--accent);
--radius: 12px;  /* était: 10px */
```

**Ajouter le token de couleur de sélection:**
```css
::selection {
  background: rgba(15, 118, 110, 0.15);
  color: var(--text-primary);
}
```

### 3.2 — `app/layout.tsx` : Remplacement de la police

```tsx
// AVANT
import { Geist } from 'next/font/google';
const geist = Geist({ subsets: ['latin'], variable: '--font-geist', display: 'swap' });

// APRÈS
import { Plus_Jakarta_Sans } from 'next/font/google';
const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-jakarta',
  display: 'swap',
});
```

Mettre à jour:
- `html` className: `${plusJakarta.variable}` (au lieu de `geist.variable`)
- `body` className: `font-[family-name:var(--font-jakarta)]`
- Dans `globals.css`: ajouter `--font: var(--font-jakarta), system-ui, sans-serif;` dans `:root`
- Mettre à jour `themeColor` dans `viewport`: `'#FAFBFC'` (était `'#F5F4F1'`)

### 3.3 — `globals.css` : Classe `.fab` mise à jour

La FAB doit utiliser `--teal-700` via `var(--accent)` (ce qui sera automatiquement juste après le changement de tokens), mais la forme doit passer de carré arrondi à cercle parfait:

```css
.fab {
  /* Doit être 56px (maquette) au lieu de 52px */
  width: 56px;
  height: 56px;
  /* bottom positioning: maquette = max(72px, calc(56px + env(safe-area-inset-bottom))) */
  bottom: max(72px, calc(56px + var(--safe-bottom)));
  right: 20px;
}
```

### 3.4 — `globals.css` : Selection color

Ajouter hors de `:root`:
```css
::selection {
  background: rgba(15, 118, 110, 0.15);
  color: var(--text-primary);
}
```

---

## Pages (Step 4) — Ordonnées par dépendance

---

### Page 1: Navigation partagée (BottomNav + LayoutShell)

**Fichiers**: `components/BottomNav.tsx`, `components/LayoutShell.tsx`
**Maquettes de référence**: `dashboard.html` (sidebar + bottom nav patterns)
**Type de travail**: Skin

#### Sidebar desktop — Changements

Le composant actuel utilise indigo pour les états actifs. Il faut migrer vers teal/amber.

**Logo/symbole** (dans `BottomNav.tsx`, partout où il y a le logo):
- Remplacer le SVG `M8 44 L18 14...` (graphe en W) par le Compas SVG:
  ```svg
  <svg viewBox="-50 -50 100 100" fill="none">
    <rect x="-36" y="-36" width="72" height="72" rx="18" fill="#0F766E"/>
    <path d="M-18 22 C-10 18, -4 8, 0 0 S10 -8, 14 -4 S22 -14, 24 -22"
          stroke="#FAFBFC" stroke-width="4" stroke-linecap="round"/>
    <circle cx="24" cy="-22" r="3.5" fill="#F59E0B"/>
  </svg>
  ```
- Sur fond sombre (brand panel teal): variante avec `rect fill="rgba(255,255,255,0.12)"`

**Wordmark** (dans `BottomNav.tsx` header mobile + sidebar desktop):
```html
<b style="fontWeight: 800, color: 'var(--text-primary)'">Mes</b>
<span style="fontWeight: 600, color: 'var(--accent)'"> Finances</span>
```

**Sidebar nav links** — état actif:
- Background: `var(--accent-subtle)` (teal-50) — déjà correct via mapping
- Couleur texte/icône: `var(--accent)` (teal-700) — déjà correct via mapping
- **AJOUTER**: indicateur amber left border (::before ou div absolu):
  ```tsx
  {active && (
    <div style={{
      position: 'absolute', left: 0, top: 8, bottom: 8,
      width: '3px', background: 'var(--amber)',
      borderRadius: '0 2px 2px 0',
    }}/>
  )}
  ```
- Remplacer le dot actif en fin de ligne par ce left border

**Sidebar user area** — avatar:
- Couleur background: `var(--accent)` → correct via mapping

**Bottom nav mobile** — changements:
- Fond: passer de frosted glass (`rgba(255,255,255,0.82)`) à solide blanc (`var(--surface-raised)`)
- Border-top: `1px solid var(--border-default)` (plus de rgba teinté)
- Icônes actives: `var(--accent)` → correct via mapping (maintenant teal)
- Labels actifs: `var(--accent)` → correct via mapping
- Remplacer le dot indicateur sous l'icône par l'absence de dot (la maquette n'en montre pas dans le bottom nav)
- La FAB doit être séparée du bottom nav et placée directement dans les pages qui en ont besoin

**`LayoutShell.tsx`** — Changements:
- `md:ml-[240px]` → `md:ml-[260px]` (sidebar maquette = 260px)
- Vérifier que `max-w-lg` reste approprié ou remplacer par `max-w-2xl` sur desktop (maquette: `max-width: 900px`)
- Ajouter les pages d'onboarding à la liste `isAuthPage` (la page `/` quand `isNewUser`)

**Complexité**: Faible

---

### Page 2: Landing (`/landing`)

**Route**: `app/landing/page.tsx`
**Maquette**: `cs-design/mes-finances/final/landing.html`
**Existant**: Page complète avec hero, features, steps, trust, CTA final, footer
**Type de travail**: Skin (structure proche) + ajustements typography monument

#### Gap analysis

| Section | Actuel | Maquette | Action |
|---------|--------|----------|--------|
| Header/Nav | Fond frosted glass indigo, logo W | Fond frosted glass teal, logo Compas + wordmark | Mettre à jour logo et couleurs |
| Hero headline | "Toute ta vie financière..." (text-2xl/text-3xl) | "Tes finances. En clair." (clamp 3.2rem–9rem, 800) | Reécrire `<h1>` avec le bon texte et échelle typographique |
| Hero badge | Absent | Badge teal-50 "100% gratuit. Aucune carte requise." avec dot amber | Ajouter |
| Hero figure | Absent (pas de figure 847$) | "847$" monument (clamp 4rem–10rem, 800) | Ajouter après le sous-titre |
| Hero CTA | Bouton indigo "Creer mon compte gratuit" | Bouton **amber** "Commencer gratuitement" + outline teal "Se connecter" | Changer couleur CTA → amber, ajouter bouton secondaire |
| Hero sub | Correct | "Sais exactement ou va ton argent. Pas de surprise..." | Mettre à jour le texte |
| Proof banner | Section trust cards (100% gratuit, vie privée, PWA) | Texte seul: "Deja utilise par **2 400+** Quebecois..." | Remplacer la section trust par un simple bandeau de preuve |
| Value prop | Absent | Section avec 3 chiffres (2min, 200$, 0$) | Créer la section |
| Features cards | 4 cartes avec screenshot téléphone | 6 cartes avec stat chiffre + titre | Restructurer (supprimer les téléphones, ajouter les stats) |
| Comment ca marche | 3 étapes avec badge rond numéroté | 3 étapes avec grand numéro grisé + amber dot | Modifier le style de la section |
| Testimonial | Section trust | Section teal-700 background avec quote amber | Remplacer la section trust par le testimonial |
| CTA final | Section gradient indigo | Section sans fond spécial, headline "Ton argent, ton rythme." | Modifier le fond et le texte |
| Footer | Minimal avec liens connexion/inscription | Logo + liens légaux + copyright | Enrichir le footer |

#### Composants à modifier
- `app/landing/page.tsx` — toute la page (inline styles)
- `components/landing/ScrollReveal.tsx` — garder tel quel

#### Attention
- La landing actuelle utilise les tokens `--accent` (indigo) partout. Après le Global Setup, `--accent` vaudra teal → les couleurs changeront automatiquement. Il faudra vérifier que la palette finale est correcte.
- L'amber est utilisé pour les CTAs de conversion (hero + final CTA). Sur la landing, **le bouton principal DOIT être amber** (pas teal comme les autres boutons).
- Introduire un nouveau style de bouton `.btn-amber` dans `globals.css` pour la landing et la signup.

**Complexité**: Moyenne (beaucoup de contenu à réécrire, mais structure HTML simple)

---

### Page 3: Auth pages (Login + Signup)

**Route**: `app/auth/[path]/page.tsx`
**Maquette**: `cs-design/mes-finances/final/login.html` + `signup.html`
**Existant**: Page centrée simple utilisant `<AuthView>` pré-construit
**Type de travail**: Experience Design — wraper `AuthView` dans le split layout

#### Gap analysis

| Aspect | Actuel | Maquette | Action |
|--------|--------|----------|--------|
| Layout | `flexDirection: 'column', alignItems: 'center'` (centré) | Split: brand panel teal gauche (50%) + formulaire droit | Créer un wrapper `auth-layout` flex-row sur desktop |
| Brand panel | Absent | Teal-700 avec logo, tagline, features list, testimonial (desktop) + compact (mobile) | Créer le composant brand panel |
| Formulaire | `<AuthView>` dans un div max-width 400px | `<AuthView>` dans la partie droite du split | Garder `AuthView`, changer le conteneur |
| Logo (mobile) | Logo simple indigo centré au-dessus du formulaire | Intégré dans le brand panel (compact header teal) | Déplacer dans le brand panel |
| Background | `var(--surface-ground)` | `var(--surface-ground)` (= slate-50 après setup) | Correct via mapping |

#### Composants à modifier
- `app/auth/[path]/page.tsx` — restructurer le layout

#### Attention auth
- `<AuthView>` est un composant shadcn/ui fourni par `@neondatabase/auth`. Il utilise les tokens shadcn (`--primary`, `--ring`, `--radius`, `--border`, etc.) qui sont tous mappés sur nos tokens dans `globals.css`. Après le Global Setup, `--primary` = teal et le bouton de login sera teal automatiquement.
- **Pour signup**: la maquette veut un bouton amber. Mais `AuthView` gère son propre bouton submit. Il faudra overrider via CSS ciblé: `.auth-view-submit-btn { background: var(--amber) !important; }` — ou vérifier si `AuthView` expose une prop de style pour le bouton.
- Il n'est **pas** possible de modifier les internals de `AuthView` sans fork. Documenter ce compromis.
- Le brand panel affiche un contenu différent sur login vs signup (tagline différente, etc.). Détecter via `path` param.

**Complexité**: Moyenne (layout uniquement, AuthView géré par la lib)

---

### Page 4: Onboarding

**Route**: Via `AccueilClient.tsx` (overlay, pas de route dédiée)
**Maquette**: `cs-design/mes-finances/final/onboarding.html`
**Existant**: `components/Onboarding.tsx` — overlay 2 étapes (bienvenue + comment ça marche) avec options "Charger les données de démo" ou "Configurer"
**Type de travail**: Experience Design — refonte du composant

#### Gap analysis

| Aspect | Actuel | Maquette | Action |
|--------|--------|----------|--------|
| Fond | `var(--surface-ground)` solide | `var(--teal-50)` avec texture de grille subtile | Changer le fond + ajouter texture pseudo-element |
| Nombre d'étapes | 2 (bienvenue + comment) | 3 (revenus + catégories + objectif) | Refaire les étapes |
| Étape 1 | N/A | Revenu mensuel: input montant + sélecteur fréquence + preview annuel/bimensuel | Créer |
| Étape 2 | N/A | Catégories: grille 2 colonnes de chips avec toggle sélection + compteur | Créer |
| Étape 3 | N/A | Objectif financier: 3 cartes radio (Contrôler / Économiser / Rembourser) | Créer |
| Progression | Boutons "Suivant" / textes | Dots de progression (teal rempli / slate vide) + bouton "Retour" outline | Créer indicator + navigation |
| CTA final | Bouton indigo | Bouton **amber** "Accéder à mon tableau de bord" | Amber pour la conversion |
| Animations | `animation: 'onb-fade-in 0.3s ease'` | Fade + translate -20px entre étapes | Animer les transitions d'étapes |
| Logo | Absent | Logo Compas + wordmark en haut | Ajouter |

#### Données collectées et usage

La maquette collecte:
1. Revenu mensuel → à stocker pour le dashboard (préremplir les templates)
2. Catégories sélectionnées → pour les sections de dépenses
3. Objectif financier → insight card sur le dashboard

**Décision importante**: L'onboarding actuel propose "Charger les données de démo" ou "Configurer les charges". La maquette montre un vrai wizard de saisie de données. Il faut décider:
- **Option A** (recommandée, plus proche de la maquette): Remplacer l'onboarding par le wizard 3 étapes. Les données saisies alimentent directement les sections/revenus via des server actions existantes.
- **Option B**: Garder l'option démo + ajouter un chemin "configuration manuelle" qui lance le wizard.

**Option A** est retenue pour correspondre à la maquette. Documenter que l'option "données démo" est supprimée de l'onboarding (ou proposée discrètement en lien secondaire: "Ou explorer avec des données de test").

#### Composants à modifier
- `components/Onboarding.tsx` — refonte complète
- Potentiellement: créer `lib/actions/onboarding.ts` pour les server actions de l'étape 1 (si on persiste le revenu)

**Complexité**: Haute

---

### Page 5: Dashboard (Accueil)

**Route**: `app/page.tsx` → `AccueilClient.tsx`
**Maquette**: `cs-design/mes-finances/final/dashboard.html`
**Existant**: `AccueilClient.tsx` avec tabs (Tableau de bord / Timeline / Santé) + patrimoine card + month navigator + `TabTableauDeBord`
**Type de travail**: Experience Design partielle — restructurer `AccueilClient.tsx`

#### Gap analysis

| Section | Actuel | Maquette | Action |
|---------|--------|----------|--------|
| Patrimoine hero card | Carte gradient en haut de page | Absent de la maquette (pas de carte patrimoine en haut) | **NE PAS supprimer** — la maquette ne couvre pas cette fonctionnalité; la dériver des patterns |
| Month navigator | `<MonthNavigator>` avec flèches | Intégré dans la section monument | Repositionner dans/après le monument |
| Tab strip | 3 tabs (Dashboard / Timeline / Santé) | Absent | Les tabs ne sont pas dans la maquette. **Décision**: garder les tabs comme fonctionnalité dérivée (les 2 tabs non couverts "Timeline" et "Santé" sont des features supplémentaires, pas dans les 6 maquettes) |
| Monument balance | Absent (dans `TabTableauDeBord`) | Section monument centrée: greeting + mois + montant giant + label + status badge | Créer dans `AccueilClient` ou `TabTableauDeBord` |
| Flow bar | Dans `TabTableauDeBord` (format différent) | 3 colonnes avec fond slate-100 + gap 2px + radius-md | Mettre à jour le style dans `TabTableauDeBord` |
| Budget progress | Dans `TabTableauDeBord` | Même structure, couleurs teal/warning/error | Mettre à jour les couleurs |
| Recent transactions | Dans `TabTableauDeBord` | Liste avec icônes catégories 38px + montants tabular | Vérifier et adapter |
| Savings goal | Dans `TabTableauDeBord` ou absent | Carte centrée avec barre gradient teal + amber dot | Créer ou adapter |
| Insight card | Absent | Carte teal-50 avec texte d'insight | Créer |
| Animations | `animate-in` classe globale | Stagger fadeIn 0.6s avec délais 0, 0.15, 0.25, 0.3, 0.35, 0.4s | Ajouter les délais d'animation |

#### Composants à modifier
- `components/AccueilClient.tsx` — restructuration du layout (retrait patrimoine card du top si décidé, ajout monument section)
- `components/accueil/TabTableauDeBord.tsx` — mise à jour complète des styles vers les patterns teal

#### Attention dashboard
- La maquette montre 4 items en bottom nav: Accueil, Dépenses, Revenus, Réglages. L'app en a 5: Accueil, Dépenses, Revenus, Patrimoine, Réglages. La carte patrimoine héro actuelle en haut du dashboard est une fonctionnalité non couverte par la maquette. Elle sera **dérivée** des patterns: gradient vert, card-press, même structure. Elle peut rester au-dessus du monument ou être intégrée différemment.
- Le "monument balance" de la maquette montre `847$` disponible ce mois-ci. Dans l'app, c'est calculé depuis `summary.available_amount`. Adapter l'affichage.

**Complexité**: Haute

---

### Page 6: Dépenses

**Route**: `app/depenses/page.tsx` → `DepensesTrackingClient.tsx`
**Maquette**: `cs-design/mes-finances/final/depenses.html`
**Existant**: `DepensesTrackingClient.tsx` avec filtres type + filtres section + liste groupée par status + modals
**Type de travail**: Skin + ajustements structure

#### Gap analysis

| Section | Actuel | Maquette | Action |
|---------|--------|----------|--------|
| Monument total | Header simple avec titre | Monument total dépensé (clamp 3rem–5rem, 800 weight) + label | Ajouter le monument en haut de page |
| Category filter chips | Filtres par section (horizontal scroll) | Filter chips teal actif / white inactif (pill shape 100px) | Mettre à jour les styles des filter chips vers les patterns teal |
| Transaction list | `ExpenseTrackingRow` avec groupes par status | Liste groupée avec date headers uppercase 12px + items avec icônes | Adapter `ExpenseTrackingRow` + headers de groupe |
| Summary stats | Barre de progression en haut | 2x2 grid avec stat cards au bas (montant payé, nb transactions, catégorie max, rest à payer) | Ajouter section summary stats en bas de liste |
| Add expense modal | `AdhocExpenseModal` (sheet) | Modal centré (pas sheet) avec amount input 24px/800 | Vérifier si le composant modal correspond ou s'il faut adapter |
| FAB | Via `globals.css .fab` | FAB teal, 56px, position bottom: max(72px...) | Correct après Global Setup |

#### Composants à modifier
- `app/depenses/page.tsx` — vérifier les props passées
- `components/DepensesTrackingClient.tsx` — ajouter monument + mettre à jour les styles des chips + header de groupe
- `components/ExpenseTrackingRow.tsx` — adapter la mise en page et les couleurs
- `components/AdhocExpenseModal.tsx` — vérifier styles du modal

**Complexité**: Moyenne

---

## Composants partagés non couverts par les maquettes

Ces composants existent dans l'app mais n'apparaissent pas dans les 6 maquettes. Les dériver des patterns brand + project-preferences.

| Composant | Dérivation |
|-----------|-----------|
| `RevenusTrackingClient.tsx` | Même pattern que Dépenses: monument (total revenus), liste items, teal pour reçu, slate pour attendu |
| `ParametresClient.tsx` | Link rows avec icône teal-50 bg + teal-700 icon, `--radius-lg` cards, section labels uppercase |
| `parametres/DeviseClient.tsx` | Sélecteur devise: input-field pattern, bouton teal primaire |
| `parametres/NotificationsClient.tsx` | Toggles teal actif + liste de settings rows |
| `parametres/RappelsClient.tsx` | Même pattern que Notifications |
| `MonthNavigator.tsx` | Flèches avec `.nav-arrow` pattern, mois en `font-weight: 650`, teal pour le mois actif |
| `ExpenseModal.tsx` | Sheet pattern existant avec couleurs teal |
| `IncomeModal.tsx` | Idem |
| `AllocationModal.tsx` | Idem |
| `AdhocAllocationModal.tsx` | Idem |
| `AddSavingsModal.tsx` | Idem |
| `ProjetsEpargneClient.tsx` | Cards avec barre de progression: gradient teal-700→teal-800 + amber dot indicator |
| `CartesClient.tsx` | Cards avec pattern standard |
| `SectionsClient.tsx` | List card pattern avec reorder handle |
| `Breadcrumb.tsx` | Texte tertiary + séparateur slate-300 |
| `ClaimBanner.tsx` | Bandeau informatif: `--warning-subtle` bg + texte |

**Règle de dérivation**: Appliquer systématiquement:
1. Ombres teal-tintées
2. Focus rings teal (`var(--accent)`)
3. Labels uppercase: 11-13px / 600-700 / 0.06-0.1em
4. Fond de page: `--surface-ground` (slate-50)
5. Cartes: `--surface-raised` blanc, `border: 1px solid var(--border-default)`, `border-radius: var(--radius-lg)`

---

## Points d'attention critiques

### 1. AuthView et les boutons amber
`<AuthView>` de `@neondatabase/auth` génère ses propres boutons HTML avec ses propres classes CSS. Après le Global Setup, le bouton submit utilisera `--primary` = teal. Pour la page signup, la maquette veut un bouton amber. Solutions par ordre de préférence:
- Vérifier si `AuthView` accepte une `className` ou `style` prop sur le bouton submit
- Sinon: CSS override ciblé dans `globals.css`: `[data-auth-submit-button] { background-color: var(--amber) !important; }` (inspecter les classes rendues par `AuthView`)
- Si impossible: accepter le compromis (bouton teal sur signup) et documenter

### 2. Tailwind v4 — Pas de config
Le projet utilise Tailwind v4 avec CSS-first config. Il n'y a pas de `tailwind.config.ts`. Les classes Tailwind comme `md:ml-[240px]` fonctionnent directement. Les tokens CSS sont dans `globals.css` et lus via `@theme inline`. Les classes de couleurs Tailwind basées sur les tokens CSS seront automatiquement disponibles.

**Ne pas créer** de `tailwind.config.ts` — ce serait une régression. Rester CSS-first.

### 3. Composant `AuthView` — Styles externes
Le fichier `globals.css` importe `@neondatabase/auth/ui/tailwind`. Ces styles ont la priorité sur nos styles de base dans certains cas. Observer le comportement du composant après le changement de tokens.

### 4. Onboarding — Persistance des données
La maquette collecte revenus + catégories + objectif. L'app existante a des server actions pour créer des revenus (`lib/actions/incomes.ts`), sections (`lib/actions/claim.ts`), et charges (`lib/actions/expenses.ts`). Ces actions sont déjà en place — l'onboarding doit juste les appeler correctement.

### 5. Dashboard — Compatibilité des tabs
Les tabs "Timeline" et "Santé" sur la page Accueil ne sont pas dans les maquettes mais sont des features existantes. La stratégie:
- Garder le tab strip (fonctionnalité utile)
- Mais intégrer le monument et le flow bar dans le tab "Tableau de bord"
- Appliquer les tokens teal/amber sans changer la structure des tabs

### 6. Logo SVG — Disponibilité des fichiers
Les fichiers `cs-brand/final/logo-full-color.svg` sont référencés dans le brand-config. Vérifier leur existence avant d'implémenter.

```bash
ls cs-brand/final/
```

Si les SVG n'existent pas, utiliser le SVG inline documenté dans `project-preferences.md`.

---

## Ordre d'intégration recommandé

```
1. Setup global (globals.css + layout.tsx)
   └── Fondations: palette teal/amber, police Jakarta, tokens → OBLIGATOIRE EN PREMIER

2. Navigation partagée (BottomNav + LayoutShell)
   └── Visible sur toutes les pages app → à faire avant les pages intérieures

3. Landing (/landing)
   └── Page indépendante, pas de dépendance aux composants app

4. Auth pages (/auth/*)
   └── Dépend du Global Setup (tokens shadcn/ui) mais pas des composants app

5. Onboarding (components/Onboarding.tsx)
   └── Dépend du setup global, invoqué depuis AccueilClient

6. Dashboard (/ → AccueilClient + TabTableauDeBord)
   └── Page principale app, la plus complexe, dépend de la nav

7. Dépenses (/depenses)
   └── Dépend de la nav, patterns similaires au dashboard
```

---

## Fichiers à modifier — Inventaire complet

### Global Setup (Step 3)
- [ ] `app/globals.css` — Remplacement tokens + ajout selection color
- [ ] `app/layout.tsx` — Remplacement police Geist → Plus Jakarta Sans

### Navigation (Page 1)
- [ ] `components/BottomNav.tsx` — Logo SVG, wordmark, amber left border, fond solide bottom nav
- [ ] `components/LayoutShell.tsx` — sidebar width 240px → 260px, max-width desktop

### Landing (Page 2)
- [ ] `app/landing/page.tsx` — Réécriture tagline, hero figure, hero CTA amber, sections

### Auth (Page 3)
- [ ] `app/auth/[path]/page.tsx` — Split layout brand panel + form panel

### Onboarding (Page 4)
- [ ] `components/Onboarding.tsx` — Refonte complète wizard 3 étapes

### Dashboard (Page 5)
- [ ] `components/AccueilClient.tsx` — Restructurer layout, ajouter monument
- [ ] `components/accueil/TabTableauDeBord.tsx` — Mise à jour styles flow bar, budget bars, transactions

### Dépenses (Page 6)
- [ ] `components/DepensesTrackingClient.tsx` — Ajouter monument, mettre à jour filter chips
- [ ] `components/ExpenseTrackingRow.tsx` — Mise à jour styles

---

## Composants à ne PAS modifier (hors scope)

- `app/api/` — Routes API (aucun changement UI)
- `lib/` — Actions, utils, types (logique métier intacte)
- `scripts/` — Scripts de seed
- `app/cartes/`, `app/projets/`, `app/sections/`, `app/revenus/` — Pages existantes dérivées automatiquement des nouveaux tokens globaux, à revoir si nécessaire mais hors scope initial

---

## Risques identifiés

| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|--------|-----------|
| `AuthView` ne respecte pas les tokens teal pour signup | Moyen | Faible | CSS override ou compromis documenté |
| Plus Jakarta Sans non disponible offline (PWA) | Faible | Moyen | `font-display: swap` + fallback system-ui |
| Changement de `--radius-md` (10px→12px) casse l'alignement de composants existants | Faible | Faible | Inspecter visuellement après setup |
| Onboarding wizard collecte des données sans server actions correspondantes | Moyen | Moyen | Réutiliser les actions existantes (incomes, sections) |
| Tabs Accueil (Timeline/Santé) vissuellement incohérents après changement palette | Faible | Faible | S'occuper de ces tabs dans la foulée du Dashboard |

---

## Fichiers de référence

| Fichier | Rôle |
|---------|------|
| `cs-brand/brand-config.md` | Tokens identité, logo SVG spec |
| `cs-design/mes-finances/project-preferences.md` | Patterns composants, typescale, layout rules |
| `cs-design/mes-finances/final/dashboard.html` | Navigation, monument, flow bar, cards |
| `cs-design/mes-finances/final/landing.html` | Hero, proof, value, features, testimonial, footer |
| `cs-design/mes-finances/final/depenses.html` | Monument total, filter chips, transaction list, modal |
| `cs-design/mes-finances/final/login.html` | Split layout, brand panel, form patterns |
| `cs-design/mes-finances/final/signup.html` | Idem + amber CTA + password strength |
| `cs-design/mes-finances/final/onboarding.html` | Wizard 3 étapes, category chips, objective cards |
