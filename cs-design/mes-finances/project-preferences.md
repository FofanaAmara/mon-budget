---
product: mes-finances
direction: 3
stance: typography_monument
validated: true
validated_date: 2026-03-01
---

# Project Preferences -- Mes Finances

## Stance & Philosophy

### Stance: Typography Monument

**Core principle:** Typography IS the architecture. Numbers and words are sculpted monuments that command the viewport. No images compete with the word. The interface communicates through the weight, scale, and rhythm of its typography.

**Why Typography Monument was chosen over the alternatives:**

- **vs Radical Simplicity (Direction 1):** Radical Simplicity sacrifices visual personality for bare-minimum UI. While noble, it made the budget app feel like a spreadsheet. Typography Monument keeps the same clarity but makes the numbers themselves *feel* significant. When you see 847$ at 6rem/800 weight, it has gravity. It means something. Radical Simplicity would show that number at 24px in a card, and you would scroll past it.
- **vs Invisible Interface (Direction 2):** Invisible Interface hides every seam and makes the UI disappear. Great for power tools, wrong for a personal finance app where the user needs emotional connection to their numbers. Typography Monument turns the available balance into a moment of truth -- you open the app and the number confronts you. That is the design.

**The sacrifice:** Typography Monument sacrifices illustration, iconography, and decorative elements. There are no hero images, no illustrations, no decorative charts. The numbers and the typographic hierarchy *are* the visual interest. This means every page must earn its attention through weight contrast, scale contrast, and rhythmic spacing -- never through decoration.

---

## Identity (Fixed Across All Pages)

These elements NEVER change between pages. The stance modifies spacing, emphasis, and composition. The identity stays locked.

### Color Tokens

```css
:root {
  /* === PRIMARY === */
  --teal-700: #0F766E;        /* Deep Teal / Serenite -- 60% brand color */
  --teal-800: #115E59;        /* Hover states, darker surfaces */
  --teal-600: #0D9488;        /* Lighter teal accent (used sparingly) */
  --teal-50: #F0FDFA;         /* Light teal backgrounds, selected states */

  /* === ACCENT === */
  --amber-500: #F59E0B;       /* Amber / Progres -- 10% CTAs, achievements */
  --amber-600: #D97706;       /* Amber hover */
  --amber-400: #FBBF24;       /* Lighter amber (landing decorations) */
  --amber-100: #FEF3C7;       /* Amber background tints */

  /* === NEUTRALS === */
  --slate-900: #0F172A;       /* Primary text (Encre) */
  --slate-700: #334155;       /* Secondary text, labels */
  --slate-500: #64748B;       /* Tertiary text, descriptions */
  --slate-400: #94A3B8;       /* Muted labels, section titles */
  --slate-300: #CBD5E1;       /* Placeholder text, subtle borders */
  --slate-200: #E2E8F0;       /* Borders, dividers */
  --slate-100: #F1F5F9;       /* Subtle backgrounds, progress bar track */
  --slate-50: #FAFBFC;        /* Page background (Snow) */
  --white: #FFFFFF;            /* Card backgrounds, surfaces */

  /* === FUNCTIONAL === */
  --success: #059669;          /* Emerald 600 -- positive states, savings */
  --success-light: #ECFDF5;   /* Success background */
  --warning: #F59E0B;          /* Amber 500 -- approaching limits */
  --warning-light: #FEF3C7;   /* Warning background */
  --error: #DC2626;            /* Red 600 -- overspending, errors */
  --error-light: #FEF2F2;     /* Error background */

  /* === TYPOGRAPHY === */
  --font: 'Plus Jakarta Sans', system-ui, sans-serif;

  /* === SHADOWS (teal-tinted) === */
  --shadow-sm: 0 1px 2px rgba(15, 118, 110, 0.05);
  --shadow-md: 0 4px 12px rgba(15, 118, 110, 0.08);
  --shadow-lg: 0 8px 24px rgba(15, 118, 110, 0.12);
  --shadow-xl: 0 16px 48px rgba(15, 23, 42, 0.12);

  /* === RADIUS === */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 18px;
}
```

### Color Ratio: 60 / 30 / 10

| Ratio | Color | Where |
|-------|-------|-------|
| **60% Teal** | `--teal-700` | Sidebar on dark-bg pages, nav bar CTA, brand panel on auth pages, primary buttons, focus rings, active nav states, section labels, currency symbols, feature icons |
| **30% Neutrals** | `--slate-*` | Page backgrounds (`--slate-50`), card backgrounds (`--white`), text hierarchy (`--slate-900` through `--slate-400`), borders (`--slate-200`), dividers |
| **10% Amber** | `--amber-500` | Conversion CTAs (signup button, onboarding finish), achievement highlights (savings stats, progress tips), goal indicator dots, quotation marks, star ratings, active sidebar border indicator |

### Amber Usage Rules (Critical for Implementation Consistency)

**USE amber (`--amber-500`) for:**
- Primary conversion CTAs on marketing pages (landing hero "Commencer gratuitement", final CTA "Creer mon budget")
- Signup page submit button (`btn-amber-full`) -- this is THE conversion moment
- Onboarding finish button (last step "Acceder a mon tableau de bord")
- Achievement/savings stats that celebrate progress (+14%, +50$ vs previous month)
- Savings goal progress indicator dot (amber circle at tip of progress bar)
- Sidebar active page indicator (3px left border)
- Social proof stars (star rating fill color)
- Opening quotation marks in testimonials
- Step number accent dots in "how it works"
- Hero badge dot (tiny 6px circle)

**DO NOT use amber for:**
- Standard form submit buttons (login uses teal `btn-primary-full`)
- Navigation CTAs in header ("Commencer" nav button is teal)
- In-app action buttons (add expense, save, cancel -- all teal)
- Warning states (even though `--warning` is the same hex as `--amber-500`, the semantic usage is different: warning is system feedback, amber is brand accent)
- Regular links or text emphasis

**The rule of thumb:** Amber = "this is a milestone moment" (signing up, completing setup, hitting a goal). Teal = "this is a standard action" (logging in, adding a transaction, navigating).

### Typography Scale

**Font family:** Plus Jakarta Sans
**Google Fonts URL:** `https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap`
**Weights loaded:** 300, 400, 500, 600, 700, 800

| Level | Size | Weight | Letter-spacing | Line-height | Usage |
|-------|------|--------|----------------|-------------|-------|
| **Monument** | `clamp(3.5rem, 15vw, 6rem)` | 800 | -0.04em | 1 | Available balance on dashboard -- THE number |
| **Display** | `clamp(3.2rem, 10vw, 9rem)` | 800 | -0.04em to -0.05em | 0.95 | Landing hero headline, final CTA headline |
| **Hero Figure** | `clamp(4rem, 14vw, 10rem)` | 800 | -0.05em | 1 | Landing hero amount (847$) |
| **Section Title** | `clamp(2rem, 5vw, 3.5rem)` | 800 | -0.03em | 1.05 | Section headings ("Les chiffres qui comptent") |
| **Value Number** | `clamp(3rem, 8vw, 5rem)` | 800 | -0.04em | 1 | Value prop numbers (2 min, 200$, 0$) |
| **Card Stat** | `clamp(2rem, 5vw, 2.5rem)` | 800 | -0.03em | 1 | Feature card stats (847$, 12, +14%) |
| **Savings Amount** | `clamp(2rem, 7vw, 3rem)` | 800 | -0.04em | 1 | Savings goal amount |
| **H2** | 26-28px | 700 | -0.02em | -- | Form titles ("Connexion", "Creer ton compte") |
| **Step Title / H3** | 20px | 700 | -0.02em | -- | Step titles, feature card h3 |
| **Subhead** | `clamp(1.1rem, 2.5vw, 1.5rem)` | 400 | -0.01em | 1.5 | Hero subtitle, page descriptions |
| **Body** | 15-16px | 400-500 | -0.01em | 1.6 | Descriptions, feature card body text |
| **Small** | 14px | 500-600 | -0.01em | -- | Transaction names, form labels, links |
| **Label** | 11-13px | 600-700 | 0.06em-0.1em (uppercase) | -- | Section titles ("BUDGET", "RECENTES"), category labels, flow bar labels |
| **Micro** | 10-11px | 600 | 0.02em | -- | Bottom nav labels, tiny metadata |

**The "Monument" Pattern:**
Every page has ONE monumental typographic element that dominates the viewport:
- Landing: The tagline "Tes finances. En clair." at `clamp(3.2rem, 10vw, 9rem)` / 800
- Dashboard: Available balance "847$" at `clamp(3.5rem, 15vw, 6rem)` / 800
- Depenses: Total spent amount at `clamp(2.5rem, 12vw, 5rem)` / 800
- Login/Signup: Brand tagline on teal panel at `clamp(2.5rem, 4vw, 4rem)` / 800
- Onboarding: Step title at `clamp(1.5rem, 4vw, 2.2rem)` / 700

**Currency symbol pattern:** Always rendered as a child `<span>` with `font-size: 0.4-0.5em`, `font-weight: 600`, `color: var(--teal-700)`, `vertical-align: super`.

**Label pattern (uppercase architectural):**
```css
font-size: 11-13px;
font-weight: 600-700;
letter-spacing: 0.06em-0.1em;
text-transform: uppercase;
color: var(--slate-400) or var(--teal-700);
```

### Shadows

All shadows are **teal-tinted**, never gray. This is a core identity choice.

```css
--shadow-sm: 0 1px 2px rgba(15, 118, 110, 0.05);   /* Cards at rest */
--shadow-md: 0 4px 12px rgba(15, 118, 110, 0.08);   /* Cards on hover, buttons on hover */
--shadow-lg: 0 8px 24px rgba(15, 118, 110, 0.12);   /* FAB, elevated elements */
--shadow-xl: 0 16px 48px rgba(15, 23, 42, 0.12);    /* Modals (slate-tinted for drama) */
```

The modal has a **composite shadow** for maximum elevation:
```css
box-shadow: 0 24px 48px rgba(15, 23, 42, 0.18), 0 8px 16px rgba(15, 118, 110, 0.06);
```

### Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | 8px | Inputs, small buttons, icon containers, chips |
| `--radius-md` | 12px | Buttons, small cards, stat cards, dropdowns |
| `--radius-lg` | 18px | Main cards, modals, savings card, feature cards |
| `100px` (pill) | 100px | Badges, status pills, avatars |

### Selection Color

```css
::selection {
  background: rgba(15, 118, 110, 0.15);
  color: var(--slate-900);
}
```

---

## Layout Patterns

### Desktop Layout (>= 1024px)

```
+------------------+----------------------------------------+
|                  |                                        |
|     SIDEBAR      |            MAIN CONTENT                |
|   260px fixed    |        margin-left: 260px              |
|   position:fixed |        max-width: 900px (grid)         |
|   height: 100vh  |                                        |
|                  |                                        |
|  Logo (top)      |    Monument (full-width centered)      |
|  Nav (middle)    |    Flow bar (full-width)               |
|  User (bottom)   |    2-column grid below                 |
|                  |                                        |
+------------------+----------------------------------------+
```

- Sidebar: 260px wide, `position: fixed`, `height: 100vh`, white background, `border-right: 1px solid var(--slate-200)`
- Sidebar internal: 3 zones -- logo (top, `padding: 0 24px`), nav (middle, `padding: 0 12px`), user (bottom, `border-top: 1px solid var(--slate-100)`)
- Main content: `margin-left: 260px`, desktop grid `max-width: 900px`, `padding: 0 40px`
- Desktop grid: `grid-template-columns: 1fr 1fr`, `gap: 24px`
- Full-width elements within grid: `grid-column: 1 / -1` (flow bar, insight card)

### Mobile Layout (< 1024px)

```
+------------------------------------------+
| STICKY HEADER (logo + avatar)            |
+------------------------------------------+
|                                          |
|          MAIN CONTENT                    |
|       padding: 0 20px                    |
|                                          |
|  Monument (centered)                     |
|  Flow bar                                |
|  Sections stacked vertically             |
|                                          |
+------------------------------------------+
| BOTTOM NAV (4 items, fixed)              |
+------------------------------------------+
```

- Mobile header: `position: sticky`, `top: 0`, white background, `border-bottom: 1px solid var(--slate-200)`, `padding: 12px 20px`
- Bottom navigation: `position: fixed`, `bottom: 0`, white background, `border-top: 1px solid var(--slate-200)`, `padding: 8px 0`, `padding-bottom: max(8px, env(safe-area-inset-bottom))`
- Content padding: `0 20px`, with `padding-bottom: 100px` to clear bottom nav
- On tablet (>= 768px, < 1024px): content sections get `max-width: 560px; margin: 0 auto`

### Responsive Breakpoints

| Breakpoint | What changes |
|------------|-------------|
| **640px** | Landing: value grid 3-col, feature cards 2-col, CTA group horizontal |
| **768px** | Dashboard: content areas center with max-width 560px |
| **1024px** | Sidebar visible, mobile header/bottom nav hidden, FAB hidden, 2-col grid. Auth pages: side-by-side split layout |
| **1280px** | Monument amount grows to 6rem, landing headline gets max-width 900px |

### Auth Pages Layout (Login / Signup)

- **Mobile:** Stacked -- teal brand panel on top (compact: logo + tagline), form below
- **Desktop (>= 1024px):** Side-by-side split -- brand panel left (50%, max-width 640px, `position: sticky`, `height: 100vh`), form panel right (flex: 1, centered)
- Brand panel: `background: var(--teal-700)`, with subtle radial glow and grid texture pseudo-elements
- Desktop-only content revealed: hero headline, feature list, testimonial (hidden on mobile via `display: none`)

### Onboarding Layout

- Full-screen centered card on teal-tinted background
- Background: `var(--slate-50)` with pseudo-element teal grid texture
- Card: `max-width: 560px`, centered, `background: var(--white)`, `border-radius: var(--radius-lg)`, `padding: 40px 28px` (mobile) / `48px 40px` (desktop)
- 3-step wizard with animated step transitions

---

## Component Patterns

### Cards

```css
/* Standard card */
background: var(--white);
border: 1px solid var(--slate-200);
border-radius: var(--radius-lg);  /* 18px */
padding: 24px;
transition: all 0.25s ease;

/* Hover state (on landing feature cards) */
border-color: rgba(15, 118, 110, 0.2);
box-shadow: var(--shadow-md);
transform: translateY(-2px);
```

**Stat cards** (depenses page): `padding: 20px 16px`, `border-radius: var(--radius-md)` (12px), no hover state.

**Insight card** (dashboard): `background: var(--teal-50)`, `border: 1px solid rgba(15, 118, 110, 0.08)` -- teal-tinted background variant.

### Buttons

| Type | Background | Text | Border | Radius | Usage |
|------|-----------|------|--------|--------|-------|
| **Primary (teal)** | `var(--teal-700)` | white | none | `--radius-md` | Login submit, nav CTA, onboarding "next", add expense submit |
| **Conversion (amber)** | `var(--amber-500)` | `var(--slate-900)` | none | `--radius-md` | Signup submit, landing hero CTA, onboarding finish, landing final CTA |
| **Secondary (outline)** | transparent | `var(--teal-700)` | 1.5px solid `var(--teal-700)` | `--radius-md` | Landing "Se connecter", onboarding "Retour" |
| **Cancel** | `var(--white)` | `var(--slate-700)` | 1px solid `var(--slate-200)` | `--radius-md` | Modal cancel |
| **Google** | `var(--white)` | `var(--slate-700)` | 1px solid `var(--slate-200)` | `--radius-md` | OAuth buttons |

**Hover patterns:**
- Primary/conversion: `background` darkens, `transform: translateY(-1px)` or `(-2px)`, `box-shadow` appears
- Amber buttons get amber-tinted shadow: `0 4px 12px rgba(245, 158, 11, 0.3)`
- Active: `transform: translateY(0)` (press effect)
- Disabled: `opacity: 0.5`, `cursor: not-allowed`, no transform/shadow

**Button sizing:**
- Full-width form buttons: `padding: 14px 24px`, `font-size: 15px`, `font-weight: 700`
- Inline CTA: `padding: 16px 32px`, `font-size: 16px`
- Large CTA (final): `padding: 18px 40px`, `font-size: 17px`
- Nav CTA: `padding: 10px 20px`, `font-size: 14px`

### Inputs

```css
/* Default state */
width: 100%;
padding: 12px 14px;
border: 1px solid var(--slate-200);
border-radius: var(--radius-sm);  /* 8px */
font-family: var(--font);
font-size: 15px;
font-weight: 500;
color: var(--slate-900);
background: var(--white);
transition: border-color 0.2s, box-shadow 0.2s;
-webkit-appearance: none;

/* Focus state */
border-color: var(--teal-700);
box-shadow: 0 0 0 3px rgba(15, 118, 110, 0.08);

/* Placeholder */
color: var(--slate-300);
font-weight: 400;

/* Error state */
border-color: var(--error);
box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.06);
```

**Label style:**
```css
font-size: 13px;
font-weight: 600;
color: var(--slate-700);
margin-bottom: 6px;
letter-spacing: -0.01em;
```

**Note:** Form labels in auth pages use 13px/600 with sentence case. Form labels in modals use 11px/700 uppercase (the architectural label pattern).

**Amount input (modal):**
```css
font-size: 24px;
font-weight: 800;
letter-spacing: -0.03em;
font-variant-numeric: tabular-nums;
```

**Select (dropdown):**
```css
/* Same as input, plus custom chevron */
background: var(--white) url("data:image/svg+xml,...") right 14px center no-repeat;
-webkit-appearance: none;
```

### Navigation -- Sidebar (Desktop)

```css
.sidebar-link {
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  font-size: 14px;
  font-weight: 500;
  color: var(--slate-500);
}

.sidebar-link:hover {
  background: var(--slate-100);
  color: var(--slate-900);
}

.sidebar-link.active {
  background: var(--teal-50);
  color: var(--teal-700);
  font-weight: 600;
}

/* THE amber left border -- active indicator */
.sidebar-link.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 8px;
  bottom: 8px;
  width: 3px;
  background: var(--amber-500);
  border-radius: 0 2px 2px 0;
}
```

### Navigation -- Bottom Bar (Mobile)

- 4 items: Accueil, Depenses, Revenus, Reglages
- Icons: 22px, `color: var(--slate-400)` (inactive) / `var(--teal-700)` (active)
- Labels: 10px, `font-weight: 600`
- Touch target: full item is tappable (adequate sizing for 44px minimum)
- `padding-bottom: max(8px, env(safe-area-inset-bottom))` for safe area

### Budget Progress Bars

```css
/* Track */
height: 6px;
background: var(--slate-100);
border-radius: 3px;

/* Fill */
border-radius: 3px;
transition: width 0.8s ease;

/* Color coding */
.ok   { background: var(--teal-700); }   /* Under 80% of budget */
.warn { background: var(--warning); }     /* 80-100% of budget */
.over { background: var(--error); }       /* Over 100% of budget */
```

**Savings goal bar** is thicker: `height: 8px`, `border-radius: 4px`, with gradient fill `linear-gradient(90deg, var(--teal-700), var(--teal-800))` and an amber dot indicator at the tip (`::after` pseudo-element, 12px circle, `var(--amber-500)`, white 2px border).

### Category Chips (Onboarding)

```css
.category-chip {
  padding: 14px;
  background: var(--white);
  border: 1.5px solid var(--slate-200);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s ease;
}

.category-chip.selected {
  border-color: var(--teal-700);
  background: var(--teal-50);
}
```

Grid: `grid-template-columns: repeat(2, 1fr)`, `gap: 10px`.
Each chip: emoji icon + text label + checkbox indicator.
Checkbox when selected: `background: var(--teal-700)`, white checkmark icon.

### Category Filter Chips (Depenses)

```css
.filter-chip {
  padding: 8px 16px;
  background: var(--white);
  border: 1px solid var(--slate-200);
  border-radius: 100px;  /* pill shape */
  font-size: 13px;
  font-weight: 600;
}

.filter-chip.active {
  background: var(--teal-700);
  color: var(--white);
  border-color: var(--teal-700);
}
```

Scrollable horizontal container: `overflow-x: auto`, `gap: 8px`, `-webkit-overflow-scrolling: touch`, hidden scrollbar.

### Modal

```css
/* Backdrop */
background: rgba(15, 23, 42, 0.5);
backdrop-filter: blur(4px);

/* Modal container */
width: calc(100% - 32px);
max-width: 460px;
max-height: calc(100dvh - 48px);
overflow-y: auto;
background: var(--white);
border-radius: var(--radius-lg);
box-shadow: 0 24px 48px rgba(15, 23, 42, 0.18), 0 8px 16px rgba(15, 118, 110, 0.06);

/* Animation */
transform: translate(-50%, -50%) scale(0.95) -> scale(1);
opacity: 0 -> 1;
transition: opacity 0.3s ease, transform 0.3s ease;
```

- Header: title with icon + close button (`36px`, `background: var(--slate-100)`, `border-radius: var(--radius-sm)`)
- Body: `padding: 24px`
- Actions: flex row, cancel (flex: 1) + submit (flex: 1.4)

### Transaction List Items

```css
.tx-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12-14px 0;
  border-bottom: 1px solid var(--slate-100);
}
```

- Left: icon (40px, colored background per category) + name/category
- Right: amount (15px, 800 weight, tabular-nums) + optional status indicator
- Category label: `11px, 700 weight, uppercase, 0.06em letter-spacing, var(--slate-400)`

### Transaction Icon Backgrounds

| Category | Background |
|----------|-----------|
| Groceries | `#ECFDF5` |
| Restaurant | `#FEF3C7` |
| Transport | `#EFF6FF` |
| Housing | `#F0FDFA` |
| Entertainment | `#FDF2F8` |
| Health | `#F0F9FF` |
| Personal | `#F5F3FF` |
| Bills | `#FFF7ED` |

### Floating Action Button (Mobile)

```css
position: fixed;
bottom: max(72px, calc(56px + env(safe-area-inset-bottom)));
right: 20px;
width: 56px;
height: 56px;
border-radius: 50%;
background: var(--teal-700);
color: var(--white);
box-shadow: var(--shadow-lg);

/* Hover */
background: var(--teal-800);
transform: scale(1.05);
```

Hidden on desktop (>= 1024px). The FAB is for adding expenses.

### Password Strength Indicator (Signup)

4-segment bar with color coding:
- Weak (1 segment): `var(--error)` red
- Medium (2 segments): `var(--amber-500)` amber
- Strong (4 segments): `var(--teal-700)` teal

Segments: `height: 4px`, `border-radius: 2px`, `gap: 4px`.

### Objective Cards (Onboarding Step 3)

```css
.objective-card {
  padding: 16px;
  background: var(--white);
  border: 1.5px solid var(--slate-200);
  border-radius: var(--radius-md);
}

.objective-card.selected {
  border-color: var(--teal-700);
  background: var(--teal-50);
  box-shadow: 0 0 0 3px rgba(15, 118, 110, 0.06);
}
```

Radio indicator: 22px circle, `border: 2px solid var(--slate-300)`, inner dot 8px white circle when selected on teal background.

### Tab Bar (Dashboard)

```css
.tabs {
  display: flex;
  border-bottom: 2px solid var(--slate-100);
  margin: 24px 20px 0;
}

.tab {
  flex: 1;
  padding: 12px 4px;
  text-align: center;
  font-size: 13px;
  font-weight: 600;
  color: var(--slate-400);
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
}

.tab.active {
  color: var(--teal-700);
  border-bottom-color: var(--teal-700);
  font-weight: 700;
}
```

### Month Navigator

```css
.month-nav {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
}

.month-nav-btn {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--slate-200);
  background: var(--white);
}

.month-nav-btn:hover {
  border-color: var(--teal-700);
  color: var(--teal-700);
  background: var(--teal-50);
}

.month-nav-label {
  font-size: 15px;
  font-weight: 700;
  min-width: 120px;
}
```

### Health Score Ring (Sante financiere)

SVG circular progress: 180px (mobile) / 200px (desktop), `stroke-width: 10`, `stroke-linecap: round`.
Score number centered via absolute positioning: `clamp(2.5rem, 8vw, 3.5rem)` / 800 weight.
Color coding: green (success) >80, amber 50-80, red (error) <50.
Animation: `stroke-dashoffset` transition 1.2s ease with 0.4s delay, score number scales in with 0.5s cubic-bezier.

### Alert Cards (Sante financiere)

```css
.alert-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 16px;
  border-radius: var(--radius-md);
  background: var(--white);
  border: 1px solid var(--slate-200);
}

/* Severity variants */
.alert-item.critical { border-color: rgba(220, 38, 38, 0.15); background: var(--error-light); }
.alert-item.warning  { border-color: rgba(245, 158, 11, 0.15); background: var(--warning-light); }
.alert-item.good     { border-color: rgba(5, 150, 105, 0.1);  background: var(--success-light); }

/* Severity badge */
.alert-severity { font-size: 10px; font-weight: 700; uppercase; padding: 2px 8px; border-radius: 4px; color: white; }
.alert-severity.critical { background: var(--error); }
.alert-severity.warning  { background: var(--amber-500); }
.alert-severity.good     { background: var(--success); }
```

### Summary Cards (Dashboard 2x2 grid)

```css
.summary-card {
  background: var(--white);
  border: 1px solid var(--slate-200);
  border-radius: var(--radius-lg);
  padding: 20px 16px;
  cursor: pointer;
  transition: all 0.25s ease;
}

.summary-card:hover {
  border-color: rgba(15, 118, 110, 0.2);
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}
```

Card icon: 40px, radius-sm, colored bg per type. Card amount: `clamp(1.5rem, 5vw, 2rem)` / 800 / tabular-nums. Arrow indicator top-right transitions on hover.

---

## Page Inventory

### 1. Landing (`landing.html`)

**Purpose:** Marketing entry page for unauthenticated visitors.
**Stance application:** Display headline as architectural monument (up to 9rem). Hero figure (847$) as proof of concept.
**Sections:** Nav (fixed, glassmorphic) > Hero (full viewport, tagline + amount) > Proof banner > Value props (3-col numbers) > How it works (3 steps) > Feature cards (6, 3x2 grid) > Testimonial (teal background) > Final CTA > Footer
**Key decision:** The hero has no image, no illustration. The tagline at 9rem IS the visual. The 847$ figure below it IS the proof. Pure typography.
**CTA pattern:** Amber for primary conversion ("Commencer gratuitement"), teal outline for secondary ("Se connecter").

### 2. Dashboard (`dashboard.html`) -- REDESIGNED as Feature 7

**Purpose:** Monthly synthesis hub. The user sees their complete financial situation at a glance.
**Stance application:** Available balance as THE monument (`clamp(3.5rem, 14vw, 6rem)` / 800). This is the LARGEST monument in the entire app -- the daily entry point.

**Structure:** Monument (greeting + month navigator + balance + status) > 3 Tabs (Tableau de bord / Timeline / Sante financiere) > Tab content

**Tab 1 -- Tableau de bord** (`dashboard-main.html`):
- 4 clickable summary cards in 2x2 grid: Revenus (received/expected), Depenses (paid/planned), Epargne (total + progress bar), Dettes (balance + monthly payment, amount in red)
- Valeur nette card at bottom: teal-50 background, layers icon, "+12 430$" in teal-700
- Cards have hover state (translateY(-2px), teal border, shadow-md) and arrow indicator
- Card icon containers: 40px, radius-sm, colored per category (teal-50, orange-50, success-light, error-light)

**Tab 2 -- Timeline** (`dashboard-timeline.html`):
- Chronological event list grouped by date
- Date headers: 12px/700/uppercase/0.08em tracking, slate-400, bottom border
- Event icons: 40px, radius-sm, color-coded (success-light for received, teal-50 for paid, slate-100 for upcoming, error-light for late)
- Status badges: 10px/700/uppercase, pill shape (4px radius), colored backgrounds
- "En retard" group header in red
- Amounts: 15px/800/tabular-nums, signed with +/- prefix, color-coded (green positive, red late, slate-400 upcoming)

**Tab 3 -- Sante financiere** (`dashboard-sante.html`):
- Health score ring: SVG circular progress (180px mobile, 200px desktop), stroke-width 10, score number as secondary monument (clamp 2.5rem-3.5rem, 800 weight)
- Score color: green >80, amber 50-80, red <50
- Alert cards: colored backgrounds (error-light/warning-light/success-light), severity dot left, severity badge right (CRITIQUE/ATTENTION/BIEN)
- Secondary metrics: 2x2 grid + full-width valeur nette card, centered values (clamp 1.5rem-2rem, 800 weight), mini progress bars (4px)
- Desktop: alerts + metrics side by side in 2-column grid

**Key decisions:**
- READ-ONLY page -- no FAB, no direct actions
- Cards are clickable (navigate to corresponding feature)
- Month navigator in monument zone (36px buttons, radius-sm, border slate-200, hover teal)
- Tabs: underline style, 2px border-bottom, teal-700 active, slate-400 inactive
- Monument amount color: teal-700 for positive, error (red) for negative
- Stagger animation on cards: scaleIn with 0.05s incremental delays

### 3. Depenses (`depenses.html`)

**Purpose:** Expense tracking with category filtering and add-expense modal.
**Stance application:** Total spent amount as monument. Transaction amounts in 800 weight with tabular-nums.
**Sections:** Monument (total spent) > Category filter chips (horizontal scroll) > Transaction list (grouped by date) > Summary stats (2x2 grid) > Add-expense modal
**Key decision:** Category labels are uppercase architectural labels (11px, 700 weight, 0.06em tracking). Each transaction shows a status indicator (ok/warn/over) relative to its category budget.
**Date headers:** `font-size: 12px, font-weight: 700, uppercase, letter-spacing: 0.08em, color: var(--slate-400)` with bottom border.

### 4. Login (`login.html`)

**Purpose:** Authentication for returning users.
**Stance application:** Brand panel with tagline at 4rem on desktop. Mobile: compact teal header.
**Key decisions:** Login button is teal (standard action, not conversion). Error state shown on email field. Password toggle with show/hide icons. Google OAuth as alternative. "Mot de passe oublie?" link right-aligned below password field.

### 5. Signup (`signup.html`)

**Purpose:** Account creation (THE conversion page).
**Stance application:** Same split layout as login. Signup headline on brand panel: "Ton argent, ton rythme."
**Key decisions:** Submit button is AMBER (conversion moment). Password strength indicator (4-segment bar). Prenom field included (personalization). Terms of service linked below button. Active/focused input shows teal label color.

### 6. Onboarding (`onboarding.html`)

**Purpose:** 3-step initial setup wizard after signup.
**Stance application:** Step titles are bold and confident. Each step has a clear monumental element.
**Steps:**
1. Revenue mensuel -- salary input with frequency select, real-time preview of yearly/biweekly amount
2. Categories de depenses -- 2-column chip grid with toggleable categories (8 default options), counter showing selected count
3. Objectif financier -- 3 objective cards with radio selection (Controler, Economiser, Rembourser)
**Key decisions:** Finish button is amber. Progress indicator uses step dots (teal filled, slate empty). Skip option available. Completion state shows a celebratory animation (scale + pop). "Retour" button is secondary outline.

---

## Navigation Flow

```
                    LANDING
                   /       \
                LOGIN     SIGNUP
                  |          |
              DASHBOARD   ONBOARDING (3 steps)
                  |          |
              DEPENSES    DASHBOARD
```

- **New user:** Landing > Signup > Onboarding (3 steps) > Dashboard
- **Returning user:** Landing > Login > Dashboard
- **In-app navigation:** Dashboard <-> Depenses <-> Revenus <-> Reglages (via sidebar / bottom nav)
- **Auth pages link to each other:** Login footer links to Signup, Signup footer links to Login
- **Brand panel logo links back to Landing** on auth pages

---

## Animation Patterns

### Page Load

```css
@keyframes fadeSlideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Stagger: 0s, 0.1s, 0.2s, 0.35s, 0.45s delays */
```

Used on: Landing hero elements (staggered), auth form cards.

### Dashboard Stagger

```css
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}

.monument          { animation: fadeIn 0.6s ease both; }
.flow              { animation: fadeIn 0.6s ease 0.15s both; }
.budget-section    { animation: fadeIn 0.6s ease 0.25s both; }
.recent-section    { animation: fadeIn 0.6s ease 0.3s both; }
.savings-section   { animation: fadeIn 0.6s ease 0.35s both; }
.insight-section   { animation: fadeIn 0.6s ease 0.4s both; }
```

### Scroll Reveal (Landing)

Uses IntersectionObserver with `threshold: 0.15` and `rootMargin: '0px 0px -40px 0px'`.

```css
.reveal {
  opacity: 0;
  transform: translateY(24px);
  transition: opacity 0.7s ease, transform 0.7s ease;
}

.reveal.visible {
  opacity: 1;
  transform: translateY(0);
}
```

### Modal Animation

```css
/* Backdrop: opacity 0 -> 1, 0.25s ease */
/* Modal: scale(0.95) -> scale(1), opacity 0 -> 1, 0.3s ease */
```

### Onboarding Step Transitions

Step content slides left/right with `translateX(-20px)` and fades. Duration: 0.3s ease.

### Hover Micro-interactions

- Buttons: `translateY(-1px)` or `(-2px)`, shadow appears, 0.2s ease
- Cards: `translateY(-2px)`, border-color shifts to teal-tinted, shadow appears, 0.25s ease
- Links: `color` transition 0.15s
- FAB: `scale(1.05)`, 0.2s ease

### Completion Animation (Onboarding)

```css
@keyframes completionPop {
  from { opacity: 0; transform: scale(0.5); }
  to { opacity: 1; transform: scale(1); }
}
/* cubic-bezier(0.4, 0, 0.2, 1), 0.5s, 0.2s delay */
```

---

## Implementation Notes

### Google Fonts

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
```

### Font Smoothing

```css
html {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
```

### Logo SVG (Inline)

```html
<svg viewBox="-50 -50 100 100" fill="none">
  <rect x="-36" y="-36" width="72" height="72" rx="18" fill="#0F766E"/>
  <path d="M-18 22 C-10 18, -4 8, 0 0 S10 -8, 14 -4 S22 -14, 24 -22" stroke="#FAFBFC" stroke-width="4" stroke-linecap="round"/>
  <circle cx="24" cy="-22" r="3.5" fill="#F59E0B"/>
</svg>
```

Reversed variant (on teal backgrounds): rect fill is `rgba(255,255,255,0.12)` instead of `#0F766E`.

### Wordmark Pattern

```html
<span class="wordmark">
  <span style="font-weight: 800; color: var(--slate-900);">Mes</span>
  <span style="font-weight: 600; color: var(--teal-700);"> Finances</span>
</span>
```

Sizes: 16-18px in headers/sidebar, 20-22px on auth brand panels.

### JS Patterns Used

1. **IntersectionObserver** -- scroll reveal on landing page
2. **Password toggle** -- show/hide password input type switching with icon swap
3. **Password strength** -- 5-rule scoring (length >= 6, length >= 10, mixed case, digits, special chars) mapped to 3 levels (weak/medium/strong)
4. **Category chip toggle** -- click handler adds/removes `.selected` class, updates counter
5. **Objective radio select** -- click handler removes `.selected` from siblings, adds to target
6. **Onboarding step wizard** -- step switching with `display:none` / fade-in transitions, progress dot updates
7. **Modal open/close** -- adds/removes `.active` class on backdrop and modal, prevents body scroll
8. **Form validation** -- real-time email validation (checks for @ and .)
9. **Revenue preview** -- real-time calculation of yearly/biweekly amounts from salary input

### Responsive Breakpoints Summary

| Breakpoint | CSS Query |
|-----------|-----------|
| Small tablet | `@media (min-width: 640px)` |
| Tablet | `@media (min-width: 768px)` |
| Desktop | `@media (min-width: 1024px)` |
| Wide desktop | `@media (min-width: 1280px)` |

### Safe Area Handling (iOS)

```css
padding-bottom: max(8px, env(safe-area-inset-bottom));
```

Used on bottom navigation and FAB positioning.

### Tabular Numbers

```css
font-variant-numeric: tabular-nums;
```

Used on all financial amounts in the depenses page to ensure aligned columns.

---

## Patrimoine Page Patterns

### 7. Patrimoine (`patrimoine-main.html`)

**Purpose:** Net worth snapshot showing savings (epargne) and debts (passifs).
**Stance application:** Net worth as THE monument (`clamp(3rem, 12vw, 5rem)` / 800). Color-coded: `var(--accent)` teal if positive, `var(--negative)` red if negative.
**Sections:** Monument (net worth + sign + status) > Totals bar (epargne / dettes, 2-col) > Epargne section (libre + projects with progress bars) > Dettes section (list with solde, taux, mensualite)
**Key decisions:**
- Totals bar uses 2-column layout (not 3 like flow bar) since only 2 figures.
- Savings cards have `border-left: 4px solid var(--teal-700)`. Debt cards have `border-left: 4px solid var(--error)`.
- Progress bars on savings projects: 8px height, teal gradient fill with amber dot indicator at tip.
- "Monthly suggestion" chip on each project: `background: var(--teal-50)`, `border: 1px solid rgba(15, 118, 110, 0.1)`, pill shape, 11px font.
- Epargne libre has a "Permanent" badge (`pot-libre-badge`): non-deletable.
- FAB is expandable with 2 options on mobile (not single-action). Backdrop blur on expand.
- Desktop: "Nouveau projet" and "Nouvelle dette" buttons appear inline in section headers. FAB hidden.
- Debt "Nouvelle dette" desktop button uses outline style with red border/text.
- Desktop grid: epargne left column, dettes right column.

### Patrimoine Bottom Sheets / Modals

**5 action sheets:**

1. **Ajouter contribution** -- pot selector + amount input (monumental 24px/800) + summary (after balance, progression %)
2. **Transferer epargne** -- source pot + directional arrow + destination pot + amount + summary (both balances after)
3. **Payer dette** -- debt selector + radio group (Regulier/Supplementaire) + amount + summary (remaining balance, months)
4. **Nouveau projet** -- name input + objective amount + date picker + auto-calculated suggestion
5. **Nouvelle dette** -- name + balance + interest rate (% suffix) + monthly payment + auto-calculated duration and interest cost

**Sheet patterns:**
- Mobile: bottom sheet with handle bar, slides up from bottom
- Desktop (>= 768px): centered modal, scale(0.95) -> scale(1) animation
- Amount inputs: 24px / 800 weight / -0.03em / tabular-nums (monumental feel in inputs)
- Currency indicator ($) positioned absolute right, teal-700
- Percentage indicator (%) positioned absolute right, slate-400
- Radio groups: 2-column, teal border/background when selected
- Summary rows: teal-50 background, key-value pairs
- Submit buttons: teal for savings actions, red (`var(--error)`) for debt actions
- Transfer arrow: centered SVG divider between source and destination selects

### Expandable FAB Pattern

```css
/* FAB container with menu */
.fab-container { position: fixed; bottom: max(72px, calc(56px + env(safe-area-inset-bottom))); right: 20px; }

/* Menu slides up from FAB position */
.fab-menu { bottom: 64px; right: 0; flex-direction: column; gap: 10px; }

/* Menu items: white card with icon + label */
.fab-menu-item { padding: 10px 16px; border: 1px solid var(--slate-200); border-radius: var(--radius-md); }

/* Icon containers: teal-50 for savings, error-light for debt */
/* + icon rotates 45deg to become X when expanded */
/* Backdrop: rgba(15, 23, 42, 0.3) with blur(2px) */
```

### Navigation Update

Bottom nav now includes "Patrimoine" item (wallet icon) replacing one of the navigation slots:
- Accueil | Depenses | Patrimoine | Reglages
- Sidebar includes "Patrimoine" link with wallet icon between Revenus and Parametres

---

### 8. Income Tracking — Revenus Tab (`features/income-tracking/mockups/revenus-tab.html`)

**Purpose:** Confirm received incomes and track expected vs actual for the month.
**Stance application:** Monument is the received/expected scoreboard fraction: "5 000$ / 5 000$". The slash creates visual tension — two numbers confronting each other. The expected amount is lighter weight/color (600 weight, slate-400) creating hierarchy within the monument itself.

**Key design decisions:**
- **Scoreboard monument:** `received` (clamp 3rem-5rem, 800 weight, slate-900) + slash (300 weight, slate-300, lighter) + `expected` (clamp 1.8rem-3rem, 600 weight, slate-400). This fraction pattern is unique to the income page.
- **Progress bar below monument:** 6px, full-width (max 240px), teal fill when complete.
- **Status badge:** success-light background, success text, pill shape. Variants: partial (warning), over (success, surplus positive).
- **Month navigator:** Centered, left/right arrow buttons (36px, border slate-200, hover teal), month label (15px, 700 weight).
- **Tabs:** Underline style (not pill toggle). Active tab: teal-700 text + 2px bottom border teal-700. Inactive: slate-400. Border-bottom 2px slate-100 on container.
- **Income rows:** Status icon left (38px, border-radius-sm), colored background per status (success-light for received, slate-100 for expected, warning-light for partial, error-light for missed). Name + frequency + status badge. Amount right with sub-label "sur X $ attendu".
- **Status badges:** 10px uppercase, pill shape (4px radius), colored backgrounds matching status icons.
- **Adhoc incomes:** Separate section below expected incomes with own label "Revenus ponctuels".
- **FAB:** Standard teal 56px, label tooltip "Revenu ponctuel" appears on hover to the left.
- **Desktop:** FAB replaced by inline "Revenu ponctuel" button in section header.

### 9. Income Tracking — Allocation Tab (`features/income-tracking/mockups/allocation-tab.html`)

**Purpose:** Visualize how expected income is distributed across budget envelopes.
**Stance application:** Same monument as revenus tab (consistency across tabs). The allocation detail is subordinate to the monument.

**Key design decisions:**
- **Summary card:** 2-column grid with divider (same pattern as patrimoine totals). "Total alloue" (slate-900) | "Dispo. attendu" (success green or error red depending on over-allocation).
- **Surallocation alert:** error-light background, error border, triangle warning icon + "Surallocation de X $" text. Non-blocking (informational, not modal).
- **Envelope rows:** Color dot (10px circle) left + name + progress bar + amounts. Edit button (28px, slate-100 background, slate-400 icon, hover teal-50/teal-700).
- **Progress bars on envelopes:** 6px height. Color coding: ok (teal-700) under 80%, warn (amber-500) 80-100%, over (error) 100%+.
- **Savings envelope variant:** 8px bar, gradient teal fill, amber dot indicator at tip (same as dashboard savings goal pattern).
- **Inline badges:** "Depasse" (error-light/error) and "Epargne" (teal-50/teal-700) — 10px uppercase pill.
- **"Reste libre" card:** teal-50 background, teal border, teal icon container (40px, radius-sm), amount in teal-700 at clamp(1.5rem-2rem)/800 weight. This is THE anchor of the allocation view — what's left after all envelopes.
- **Over-allocated variant of "Reste libre":** error-light background, error icon, error amount.
- **Bottom sheet (adhoc allocation):** Standard bottom sheet pattern. Select dropdown for section/project + monumental amount input (24px/800) + description text input + cancel/confirm actions.
- **Desktop:** Sheet becomes centered modal (460px max-width, radius-lg all corners). Sheet handle hidden. FAB replaced by inline button.
- **FAB label changes per tab:** "Revenu ponctuel" on revenus tab, "Allocation ponctuelle" on allocation tab.

---

## Design Files

```
cs-design/mes-finances/
  final/
    landing.html        -- Marketing entry page
    dashboard.html      -- Main app dashboard
    depenses.html       -- Expense tracking + modal
    login.html          -- Authentication
    signup.html         -- Account creation
    onboarding.html     -- 3-step setup wizard
  features/
    dashboard/
      mockups/
        dashboard-main.html      -- Tab "Tableau de bord" (4 cards + valeur nette)
        dashboard-timeline.html  -- Tab "Timeline" (chronological events)
        dashboard-sante.html     -- Tab "Sante financiere" (score + alerts + metrics)
    patrimoine/
      mockups/
        patrimoine-main.html     -- Net worth + savings + debts snapshot
        patrimoine-actions.html  -- All bottom sheets for patrimoine interactions
    income-tracking/
      mockups/
        revenus-tab.html         -- Monthly income confirmation (tab Revenus)
        allocation-tab.html      -- Monthly allocation view (tab Allocation) + adhoc sheet
    income-templates/
      mockups/
        revenus-list.html        -- Recurring income sources
        revenu-modal.html        -- Add/edit income source modal
    expense-templates/
      mockups/
        charges-list.html        -- Recurring charges
        charge-modal.html        -- Add/edit charge modal
    reference-data/
      mockups/
        sections.html            -- Reference data sections
        cartes.html              -- Reference data cards
  project-preferences.md  -- This document
  proposals/
    direction-3/        -- Source proposal files
```

---

## Pattern unifie -- Liste d'items

**Statut:** Etabli le 2026-03-02. Reference pour toutes les pages existantes et futures.
**Contexte:** Pattern consolide apres audit de coherence entre /depenses, /revenus, /parametres/charges, /parametres/revenus, /patrimoine. La page /depenses (ExpenseTrackingRow) est la reference canonique.

### Page structure: MonthNavigator AVANT le monument

Sur toutes les pages avec navigation mensuelle (depenses, revenus), le `MonthNavigator` est le PREMIER element du return, avant le monument typographique.

```jsx
return (
  <div>
    {/* 1. MonthNavigator — TOUJOURS en premier */}
    <MonthNavigator month={month} basePath="/depenses" />

    {/* 2. Monument typographique */}
    <div style={{ padding: '20px 20px 0', textAlign: 'center' }}>
      <p style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.1em',
        textTransform: 'uppercase', color: 'var(--teal-700)', marginBottom: '10px' }}>
        Depenses
      </p>
      {/* ... monument numbers ... */}
    </div>

    {/* 3. Tabs (si applicable) */}
    {/* 4. Contenu */}
  </div>
);
```

### Section headings architecturaux

Utiliser `<p>` (jamais `<h2>`) avec le style label architectural. Couleur: `var(--teal-700)` (pas `--slate-400`).

```jsx
<p style={{
  fontSize: '11px',
  fontWeight: 700,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'var(--teal-700)',      // teal, pas slate-400
  marginBottom: '10px',
  paddingLeft: '4px',
}}>
  Revenus attendus (2)
</p>
```

### Card container de liste

```jsx
<div style={{
  background: 'white',
  border: '1px solid var(--slate-200)',
  borderRadius: 'var(--radius-lg)',   // 18px
  overflow: 'hidden',                  // coupe le borderBottom du dernier item
}}>
  {items.map(item => <ItemRow key={item.id} {...item} />)}
</div>
```

### Item row pattern (reference: ExpenseTrackingRow)

```jsx
<div style={{
  display: 'flex',
  alignItems: 'center',
  padding: '12px 16px 12px 18px',
  gap: '12px',
  borderBottom: '1px solid var(--slate-100)',    // pas de <div className="divider">
  transition: 'background 0.15s ease',
}}>
  {/* Icone categorie — 38x38px */}
  <div style={{
    width: '38px',
    height: '38px',
    borderRadius: 'var(--radius-sm)',              // 8px
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '18px',
    lineHeight: '1',
    flexShrink: 0,
    background: categoryBg,                        // couleur par categorie/source
  }}>
    {icon}
  </div>

  {/* Nom + meta ligne */}
  <div style={{ flex: 1, minWidth: 0 }}>
    <span style={{
      fontSize: '14px',
      fontWeight: 600,
      color: 'var(--slate-900)',
      letterSpacing: '-0.01em',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    }}>
      {name}
    </span>

    {/* Meta ligne: 11px, 600-700 weight, slate-400, separateur dot 3px */}
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      marginTop: '3px',
      fontSize: '11px',
      fontWeight: 600,
      color: 'var(--slate-400)',
      letterSpacing: '0.02em',
    }}>
      <span style={{ textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>
        {categoryLabel}
      </span>
      {/* Separateur entre meta items */}
      <span style={{
        width: '3px', height: '3px', borderRadius: '50%',
        background: 'var(--slate-300)', display: 'inline-block', flexShrink: 0,
      }} />
      <span>{additionalMeta}</span>
    </div>
  </div>

  {/* Montant — 15px, 800 weight, tabular-nums */}
  <span style={{
    fontSize: '15px',
    fontWeight: 800,
    letterSpacing: '-0.02em',
    color: 'var(--slate-900)',
    fontVariantNumeric: 'tabular-nums',
    whiteSpace: 'nowrap',
  }}>
    <span style={{ fontSize: '0.7em', fontWeight: 600, color: 'var(--teal-700)' }}>$</span>
    {amount}
  </span>

  {/* Action: toggle inline (depenses) ou three-dot (revenus) */}
  {actionButton}
</div>
```

### Status badges (pills)

```jsx
<span style={{
  display: 'inline-flex',
  padding: '1px 6px',
  borderRadius: '999px',
  fontSize: '10px',
  fontWeight: 700,
  letterSpacing: '0.02em',
  background: statusBg,
  color: statusColor,
}}>
  {statusLabel}
</span>
```

Palettes de status:
- Recu / Paye: `background: var(--positive-subtle)`, `color: var(--positive-text)`
- Attendu / A venir: `background: var(--surface-sunken)`, `color: var(--text-tertiary)`
- Partiel: `background: var(--warning-subtle)`, `color: var(--warning-text)`
- Manque / Retard: `background: var(--negative-subtle)`, `color: var(--negative-text)`
- Imprévu: `background: var(--amber-100)`, `color: var(--amber-600)` (amber, pas error)

### Regles a ne PAS violer

1. **Jamais `<div className="divider">`** pour separer les rows -- utiliser `borderBottom` sur la row elle-meme.
2. **Jamais `<h2>`** pour les section labels de liste -- utiliser `<p>` avec style architectural.
3. **MonthNavigator AVANT le monument** -- jamais apres.
4. **Icone: 38px** (pas 32px) avec `border-radius: var(--radius-sm)` (pas radius-md).
5. **Padding row: `12px 16px 12px 18px`** -- asymetrique (18px a gauche pour optique).
6. **La couleur des section headings de liste est `var(--teal-700)`** -- pas slate-400 ni slate-500.

### Variantes etablies par page

| Page | Composant | Type d'action | Icone size | Specifique |
|------|-----------|---------------|------------|------------|
| /depenses | ExpenseTrackingRow | Toggle inline (checkmark) + chevron | 38px | Section/carte en meta |
| /revenus | IncomeInstanceRow | Three-dot expandable | 38px | Status badge + separateurs dot |
| /revenus | VariableIncomeRow | Bouton "Saisir" | 38px | Badge "Variable" |
| /parametres/charges | ExpenseRow (charges) | Edit/delete buttons hover | sans icone | Badges frequence + auto |
| /parametres/revenus | SourceCard | Three-dot dropdown | 44px (card, pas row) | Card avec border-left |

---

## Quick Reference for Developers

**When building a new page, always:**
1. Use `var(--font)` for all text -- never add a second font family
2. Apply the teal-tinted shadow system -- never use gray `rgba(0,0,0,x)` shadows
3. Pick ONE monumental typographic element for the page (the "monument")
4. Use the uppercase architectural label pattern for section headers
5. Currency symbols: child span, 0.4-0.5em, weight 600, teal-700, vertical-align super
6. Amber only for milestones and conversion CTAs -- never for standard actions
7. Apply `border-radius: var(--radius-lg)` for main cards, `var(--radius-md)` for buttons and smaller cards
8. Check mobile layout first -- 375px is the primary design canvas
9. Bottom nav on mobile has 4 items max -- icons 22px, labels 10px
10. All hover effects include `transform: translateY(-Npx)` -- never just color change
