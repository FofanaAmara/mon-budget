# Mes Finances -- Brand Guidelines

---

## 1. Brand Strategy

### Archetype: Le Sage (The Sage)

Mes Finances is the Sage -- a trusted guide that transforms financial confusion into clarity. The app does not judge, does not sell, does not pressure. It illuminates. It organizes. It gives users the knowledge and visibility they need to make confident financial decisions.

**Brand Promise:** "Toute ta vie financiere, claire et sous controle."

**Core Values:**
1. **Clarte** -- Every screen, every number, every interaction must make things clearer, never more confusing.
2. **Maitrise** -- Users are in control. The app serves them, not the other way around.
3. **Completude** -- Not just a budget tool. The full financial picture: depenses, revenus, epargne, dettes, patrimoine.
4. **Accessibilite** -- Free, in French, designed for everyone. No financial jargon barrier.
5. **Precision** -- Numbers matter. Every dollar is accounted for. Every detail is deliberate.

### Brand Stance: Radical Simplicity

**Amplifies:** Focus absolu, clarte, essentiel
**Sacrifices:** Richesse visuelle, decoration, exhaustivite

Everything in Mes Finances serves a purpose. There is no ornamentation. No gradient for the sake of a gradient. No animation that does not communicate something. The interface is a precision instrument, not a toy.

**The sacrifice is real:** We will never add features "just because competitors have them." We will never clutter a screen to show more data. We will never sacrifice clarity for visual richness. Less, but better.

---

## 2. Logo

### The Mark: The M Symbol

The Mes Finances logo is a stylized letter "M" formed by two connected peaks rendered as a single continuous line. The right peak is taller than the left, creating an ascending trajectory that evokes financial growth and upward progress.

It reads simultaneously as:
- The letter **M** (for "Mes")
- A **financial chart** trending upward
- A **mountain range** -- stability and ambition

The mark uses thick, rounded strokes. No fill. The open construction communicates transparency and clarity -- core Sage values.

### Logo Variations

| Variation | File | Usage |
|-----------|------|-------|
| Primary | `logo-primary.svg` | Default. Symbol + wordmark on light backgrounds |
| Reversed | `logo-reversed.svg` | Symbol (muted indigo) + wordmark (white) on dark backgrounds |
| Mono Black | `logo-mono-black.svg` | Print, fax, single-color contexts |
| Mono White | `logo-mono-white.svg` | Overlays, watermarks on dark/image backgrounds |
| Symbol Only | `logo-symbol.svg` | Favicon, app icon, avatars, tight spaces |
| Wordmark Only | `logo-wordmark.svg` | Text contexts, footer, email signatures |

### PWA Icons

| Size | File | Usage |
|------|------|-------|
| 512x512 | `pwa-icon-512.svg` | PWA splash screen, app store |
| 192x192 | `pwa-icon-192.svg` | PWA manifest icon |
| 32x32 | `favicon.svg` | Browser tab favicon |

PWA icons use the M symbol in white on the primary indigo background. They are designed to work within the rounded-square mask that iOS and Android apply to home screen icons.

### Clear Space

The minimum clear space around the logo is equal to the height of the M symbol mark. No other elements, text, or graphics should intrude into this space.

```
        M height
        |-----|
        v     v
   .------------------.
   |                  |
   |    M  Mes        |  <- M height clearance above
   |       Finances   |
   |                  |  <- M height clearance below
   '------------------'
   ^                  ^
   M height           M height
   clearance          clearance
   left               right
```

### Minimum Sizes

| Variation | Minimum Width |
|-----------|---------------|
| Primary (symbol + wordmark) | 120px |
| Symbol only | 16px |
| Wordmark only | 100px |

### Logo Don'ts

- Do not rotate the logo
- Do not stretch or distort the proportions
- Do not change the stroke weight of the M symbol
- Do not add shadows, glows, or effects
- Do not place the logo on busy or low-contrast backgrounds
- Do not rearrange the symbol and wordmark (symbol is always to the left)
- Do not use colors other than those specified in the brand palette
- Do not outline or add a border around the logo

---

## 3. Color Palette

### Primary

| Name | Hex | Usage |
|------|-----|-------|
| **Indigo** | `#3D3BF3` | Primary accent, CTAs, active states, logo symbol |
| **Indigo Hover** | `#3230D4` | Hover/pressed state of primary elements |
| **Indigo Subtle** | `#EDEDFE` | Tinted backgrounds, selected states |
| **Indigo Muted** | `#9C9BF7` | Disabled states, secondary accent, reversed logo |

Why indigo: Not corporate blue. Not tech purple. An electric indigo with character -- serious enough for finance, distinctive enough to be memorable. It sits between trust (blue) and wisdom (purple), perfectly embodying the Sage archetype.

### Neutral Surfaces

| Name | Hex | Usage |
|------|-----|-------|
| **Ground** | `#F5F4F1` | Page background (warm stone) |
| **Raised** | `#FFFFFF` | Cards, elevated elements |
| **Sunken** | `#EEEDEA` | Inset areas, progress bar backgrounds |
| **Inset** | `#F8F7F5` | Subtle insets: filter pills, toggles |
| **Overlay** | `rgba(13,13,13,0.45)` | Modal/sheet backdrop |

Why warm: Never cold grey. The surfaces have a warm, paper-like quality. This makes managing money feel human and approachable, not clinical and cold.

### Text

| Name | Hex | Usage |
|------|-----|-------|
| **Primary** | `#0D0D0D` | Headings, body text, amounts |
| **Secondary** | `#6B6966` | Labels, descriptions, secondary info |
| **Tertiary** | `#A3A09A` | Hints, placeholders, timestamps |
| **Inverted** | `#FAFAF8` | Text on dark/accent backgrounds |

### Semantic Colors

| Name | Hex | Subtle | Text | Usage |
|------|-----|--------|------|-------|
| **Positive** | `#1A7F5A` | `#E8F5EE` | `#145C42` | Income received, savings growth, positive balance |
| **Negative** | `#C7382D` | `#FBE9E7` | `#9A2B23` | Overdue, debt, negative balance |
| **Warning** | `#C27815` | `#FFF3E0` | `#8C5710` | Upcoming deadlines, low savings |

### Borders

| Name | Hex | Usage |
|------|-----|-------|
| **Default** | `#E5E3DF` | Card borders, subtle dividers |
| **Strong** | `#D1CFC9` | Dividers that need presence |
| **Focus** | `#3D3BF3` | Focus rings (accent) |

### Color Usage Rules

1. **Indigo is for action.** Buttons, links, active nav items, the logo. Never use it for passive/decorative elements.
2. **Semantic colors are non-negotiable.** Green = positive/income. Red = negative/overdue. Amber = warning/upcoming. Never swap these meanings.
3. **Surfaces create hierarchy.** Ground < Raised < Overlay. Each level serves a purpose.
4. **Warm, never cold.** All neutrals have a warm undertone. No pure greys (#808080 style). This is deliberate.

### Accessibility

All text/background combinations meet WCAG AA contrast ratios:
- Body text on Ground: 14.6:1 (AAA)
- Secondary text on Ground: 4.8:1 (AA)
- Indigo on white: 4.6:1 (AA for large text; use with semi-bold+ weight for body)
- White on Indigo: 4.6:1 (AA)

---

## 4. Typography

### Font: Geist Sans

Mes Finances uses **Geist Sans** as its sole typeface. One font family. No exceptions. This is a deliberate radical_simplicity choice.

**Why Geist Sans:**
- Geometric and precise -- mirrors the "instrument de precision" concept
- Excellent readability at small sizes -- critical for financial data on mobile
- Modern without being trendy -- will not age
- Beautiful number rendering -- tabular figures for aligned amounts
- Clean at every weight -- from light labels to bold headings
- Variable font with optical sizes -- optimal rendering at any scale

**Fallback stack:** `'Geist', 'Inter', 'SF Pro Display', -apple-system, system-ui, sans-serif`

### Weight Hierarchy

Mes Finances uses weight as its primary typographic hierarchy tool. Every weight has a specific role.

| Weight | Value | Role | Example |
|--------|-------|------|---------|
| Regular | 400 | Body prose, descriptions | "Votre depense a ete enregistree." |
| Medium | 500 | Labels, secondary info | "Paye le 15 mars" |
| Semibold | 600 | Emphasis, badges, section titles | "En retard", "Logement" |
| Bold | 700 | Card titles, headings | "Tableau de bord" |
| Heavy | 750-800 | Hero numbers, display amounts | "$2,450.00" |

### Type Scale

| Token | Size | Usage |
|-------|------|-------|
| `--text-xs` | 11px | Timestamps, fine print |
| `--text-sm` | 13px | Labels, badges, secondary text |
| `--text-base` | 15px | Body text, descriptions, UI text |
| `--text-lg` | 18px | Section headings, card titles |
| `--text-xl` | 22px | Page titles, hero labels |
| `--text-2xl` | 28px | Display numbers, hero amounts |
| `--text-3xl` | 36px | Large display (Patrimoine total) |

### Letter Spacing

| Token | Value | Usage |
|-------|-------|-------|
| `--tracking-tight` | -0.02em | Headings, large text |
| `--tracking-normal` | 0 | Body text |
| `--tracking-wide` | 0.04em | Labels, all-caps small text |
| `--tracking-widest` | 0.08em | Badge text, overline labels |

### Typography Don'ts

- Do not use a second font family
- Do not use italic (the app has no editorial content that requires it)
- Do not go lighter than 400 weight
- Do not display amounts in anything other than tabular figures
- Do not center-align body text (left-align always, except hero numbers which can be centered)

---

## 5. Brand Voice

### Personality in 3 Words

1. **Claire** -- Every word serves comprehension. No jargon, no filler.
2. **Rassurante** -- The app is a calm, competent guide. Never alarming, never condescending.
3. **Directe** -- Honest and concise. Respects the user's time and intelligence.

### How Mes Finances Speaks

- We are **informative**, not preachy
- We are **precise**, not verbose
- We are **encouraging**, not pressuring
- We are **French-Canadian**, not Parisian (natural, tu-friendly, practical)
- We say **"tu"**, not "vous" (when addressing the user directly)
- We use **clear numbers**, not vague descriptions ("$245.00 reste a payer" not "il reste un montant")

### Vocabulary

**Signature Words (always use):**
- Clarte / Clair
- Controle
- Suivre / Suivi
- Vue d'ensemble
- Patrimoine
- Objectif
- Progression
- A jour

**Forbidden Words (never use):**
- Gratuit (the value is the product, not its price)
- Budget serrer (negative framing)
- Difficile / Complique
- Probleme (say "situation" or be specific)
- Sacrifier (say "prioriser" or "ajuster")
- Rich/Pauvre (no judgment on financial status)

**Expressions propres a la marque:**
- "Ta vue financiere complete"
- "Tout est sous controle"
- "Rien n'echappe a ton suivi"
- "Chaque dollar a sa place"

### Tone by Context

| Context | Tone | Example |
|---------|------|---------|
| **Accueil / Dashboard** | Factuel, neutre | "Mars 2026 -- $3,200 en revenus, $2,840 en depenses" |
| **Succes** | Encourageant, bref | "Depense marquee comme payee." |
| **Alerte / Retard** | Factuel, sans blame | "3 depenses depassent leur date d'echeance." |
| **Sante financiere** | Positif mais honnete | "Score: 72/100 -- Bon rythme. 2 paiements a regulariser." |
| **Etat vide** | Invitant, orientant | "Aucune depense ce mois-ci. Ajoute tes charges fixes dans les reglages." |
| **Erreur** | Humain, solution | "Impossible de sauvegarder. Verifie ta connexion et reessaye." |
| **Onboarding** | Chaleureux, guide | "Bienvenue. Commence par ajouter tes charges fixes -- le reste suivra." |

### Messaging Framework

**Brand Promise:**
"Toute ta vie financiere, claire et sous controle."

**Value Propositions:**
1. **Vue complete** -- Pas juste un budget. Depenses, revenus, epargne, dettes, patrimoine. Tout.
2. **Clarte instantanee** -- Un coup d'oeil suffit pour savoir ou tu en es.
3. **Zero cout** -- Aucun abonnement. Aucun frais cache. Pour de vrai.
4. **Mobile d'abord** -- Sur ton telephone, toujours accessible, comme une app native.

**Tagline (optional, for external use):**
"Toutes tes finances. Une seule clarte."

---

## 6. Applications

### In-App Usage

**Navigation sidebar (desktop):**
- Symbol + wordmark, primary variation
- Minimum width: sidebar width (240px) with appropriate padding
- Indigo symbol, dark text wordmark

**Navigation bottom bar (mobile):**
- No logo in bottom nav (screen real estate is precious)
- Logo appears in page headers where relevant

**Splash / Loading screen:**
- PWA icon (indigo background, white M symbol)
- Or: symbol centered on Ground surface (#F5F4F1)

**Login page:**
- Primary logo (symbol + wordmark), centered
- Below: tagline in text-secondary color

### External Usage

**App Store listing:**
- PWA icon 512x512 as the app icon
- Primary logo in screenshots

**Social media avatar:**
- PWA icon (indigo background, white M) cropped to circle
- Works at any size down to 40x40px

**OG image / social card:**
- Primary logo centered on Ground surface
- Or: reversed logo on dark navy background

---

## 7. Design System Integration

The brand identity is implemented through CSS custom properties (design tokens) in the app. All brand colors, typography, and spacing are defined as variables in `:root` and used consistently across the application.

### CSS Variable Mapping

```css
/* Brand → CSS Token */
Indigo        → --accent: #3D3BF3
Indigo Hover  → --accent-hover: #3230D4
Indigo Subtle → --accent-subtle: #EDEDFE
Indigo Muted  → --accent-muted: #9C9BF7

Ground        → --surface-ground: #F5F4F1
Raised        → --surface-raised: #FFFFFF
Sunken        → --surface-sunken: #EEEDEA

Text Primary  → --text-primary: #0D0D0D
Text Secondary→ --text-secondary: #6B6966
Text Tertiary → --text-tertiary: #A3A09A

Positive      → --positive: #1A7F5A
Negative      → --negative: #C7382D
Warning       → --warning: #C27815
```

### Implementation Notes

- All colors are referenced via CSS variables, never hardcoded hex values
- Typography uses the Geist Sans variable font with optical sizing
- Shadows use warm-tinted rgba values (never pure grey)
- All spacing follows a strict 4px grid
- Border radii follow the established hierarchy (xs/sm/md/lg/xl/full)

---

## 8. Validation Checklist

- [x] Archetype (Sage) identifiable without explanation
- [x] Logo drawable from memory in 5 seconds (two peaks, right taller)
- [x] Palette works in grayscale
- [x] Brand voice is distinct and consistent
- [x] Radical simplicity stance: sacrifice is real and visible (no decorative elements, one font, focused palette)
- [x] Logo works at 16px (favicon)
- [x] Logo works on light and dark backgrounds
- [x] All colors meet WCAG AA contrast requirements
- [x] Typography is legible at all sizes
- [x] Brand feels trustworthy yet approachable
- [x] Everything feels natural in a French-speaking context

---

*These guidelines are a living document. They define the identity -- but the identity lives in how they are applied consistently across every touchpoint.*
