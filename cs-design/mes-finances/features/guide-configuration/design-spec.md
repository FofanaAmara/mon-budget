# Design Spec -- Guide de configuration

> Integration documentation for the setup checklist feature.
> All values extracted from validated mockups. Do NOT approximate.

---

## 1. Overview

**Feature:** Persistent setup checklist guiding new users through 4 configuration steps.

**Platforms:**
- Mobile (375px): collapsed bar + bottom sheet
- Desktop (>=1024px): floating widget (collapsed pill + expanded card)

**4 Steps:**
1. Ajouter un revenu recurrent
2. Ajouter une charge fixe
3. Generer le mois courant
4. Marquer une depense payee

**Lifecycle:** Appears on first login (all steps incomplete). Persists across all pages until all 4 steps are completed. After completion celebration, the guide disappears permanently.

**Mockup files:**
| File | Description |
|------|-------------|
| `mockups/01-initial-collapsed.html` | Mobile: guide bar collapsed over dashboard (0/4) |
| `mockups/02-expanded-checklist.html` | Mobile: bottom sheet with full checklist (0/4) |
| `mockups/03-in-progress.html` | Mobile: bottom sheet at 2/4, completed + current steps |
| `mockups/04-celebration.html` | Mobile: celebration state (4/4), confetti, amber ring |
| `mockups/05-desktop.html` | Desktop: floating widget collapsed + expanded (2/4) |

---

## 2. Component Inventory

### 2.1 Guide Collapsed Bar (Mobile)

A horizontal bar floating above the bottom nav. Shows progress ring, next step text, and expand chevron.

**Positioning:**
```css
position: fixed;
bottom: 72px;              /* above bottom nav */
left: 50%;
transform: translateX(-50%);
width: 375px;              /* matches viewport */
padding: 0 12px;           /* horizontal inset for the inner card */
z-index: 100;
```

**Inner container (`.guide-bar-inner`):**
```css
background: var(--white);              /* #FFFFFF */
border: 1px solid var(--slate-200);    /* #E2E8F0 */
border-radius: var(--radius-md);       /* 12px */
box-shadow: var(--shadow-lg);          /* 0 8px 24px rgba(15, 118, 110, 0.12) */
padding: 14px 16px;
display: flex;
align-items: center;
gap: 12px;
cursor: pointer;
transition: all 0.2s ease;
```

**Hover:**
```css
border-color: rgba(15, 118, 110, 0.2);
```

**Children layout:** `[Progress Ring 36px] [Text block flex:1] [Chevron 28px]`

---

### 2.2 Guide Bottom Sheet (Mobile)

Full checklist in a bottom sheet pattern, triggered by tapping the collapsed bar.

**Backdrop:**
```css
position: absolute;
inset: 0;
background: rgba(15, 23, 42, 0.2);    /* slate-900 at 20% */
z-index: 90;
```
When the sheet is open, the page content behind gets `opacity: 0.4; pointer-events: none;`.

**Bottom sheet container:**
```css
position: absolute;
bottom: 72px;              /* above bottom nav */
left: 0;
right: 0;
background: var(--white);
border-radius: 18px 18px 0 0;         /* radius-lg top corners only */
box-shadow: 0 -8px 32px rgba(15, 23, 42, 0.12),
            0 -2px 8px rgba(15, 118, 110, 0.06);
z-index: 100;
padding: 0 0 20px;
max-height: 520px;
overflow-y: auto;
```

**Drag handle:**
```css
/* Container */
padding: 12px 0 4px;
display: flex;
justify-content: center;

/* Pseudo-element (::after) */
width: 36px;
height: 4px;
background: var(--slate-300);          /* #CBD5E1 */
border-radius: 2px;
```

**Sheet header:**
```css
padding: 12px 24px 20px;
display: flex;
align-items: center;
gap: 14px;
```

**Sheet header title:**
```css
/* h2 */
font-size: 18px;
font-weight: 800;
color: var(--slate-900);               /* #0F172A */
letter-spacing: -0.02em;
margin-bottom: 2px;

/* Subtitle (default) */
font-size: 13px;
font-weight: 500;
color: var(--slate-500);               /* #64748B */
letter-spacing: -0.01em;

/* Subtitle (in-progress variant, e.g., "Deja a mi-chemin !") */
font-size: 13px;
font-weight: 600;
color: var(--teal-700);                /* #0F766E */
```

**Sheet divider:**
```css
height: 1px;
background: var(--slate-100);          /* #F1F5F9 */
margin: 0 24px;
```

**Checklist container:**
```css
padding: 8px 0;
```

---

### 2.3 Floating Widget Collapsed (Desktop)

A pill-shaped bar in the bottom-right corner of the viewport.

**Positioning:**
```css
position: fixed;
bottom: 24px;
right: 24px;
z-index: 200;
width: 340px;
```

**Styling:**
```css
background: var(--white);
border: 1px solid var(--slate-200);
border-radius: var(--radius-lg);       /* 18px */
box-shadow: var(--shadow-lg);          /* 0 8px 24px rgba(15, 118, 110, 0.12) */
padding: 14px 18px;
display: flex;
align-items: center;
gap: 14px;
cursor: pointer;
transition: all 0.2s ease;
```

**Hover:**
```css
border-color: rgba(15, 118, 110, 0.2);
box-shadow: var(--shadow-lg), 0 0 0 1px rgba(15, 118, 110, 0.05);
transform: translateY(-1px);
```

**Children layout:** `[Progress Ring 36px] [Text block flex:1] [Chevron 28px]`

Text block:
```css
/* Label */
font-size: 10px;
font-weight: 700;
letter-spacing: 0.08em;
text-transform: uppercase;
color: var(--teal-700);
margin-bottom: 1px;

/* Action text */
font-size: 14px;
font-weight: 600;
color: var(--slate-900);
letter-spacing: -0.01em;
white-space: nowrap;
overflow: hidden;
text-overflow: ellipsis;
```

Chevron circle:
```css
width: 28px;
height: 28px;
border-radius: 50%;
background: var(--teal-50);            /* #F0FDFA */
display: flex;
align-items: center;
justify-content: center;
```
Chevron icon: 14x14px, `color: var(--teal-700)`.

---

### 2.4 Floating Widget Expanded (Desktop)

A floating card that replaces the collapsed pill.

**Positioning:**
```css
position: fixed;
bottom: 24px;
right: 24px;
z-index: 200;
width: 360px;
max-height: 500px;
```

**Styling:**
```css
background: var(--white);
border: 1px solid var(--slate-200);
border-radius: var(--radius-lg);       /* 18px */
box-shadow: 0 16px 48px rgba(15, 23, 42, 0.14),
            0 4px 16px rgba(15, 118, 110, 0.08);
display: flex;
flex-direction: column;
overflow: hidden;
```

**NO backdrop on desktop.** The widget floats independently without dimming the page.

**Widget header:**
```css
padding: 20px 20px 16px;
border-bottom: 1px solid var(--slate-100);
display: flex;
align-items: center;
gap: 14px;
flex-shrink: 0;
```

Title:
```css
/* h2 */
font-size: 16px;
font-weight: 800;
color: var(--slate-900);
letter-spacing: -0.02em;
margin-bottom: 1px;

/* Subtitle */
font-size: 13px;
font-weight: 600;
color: var(--teal-700);
```

**Collapse button:**
```css
width: 28px;
height: 28px;
border-radius: 50%;
background: var(--slate-100);          /* #F1F5F9 */
border: none;
cursor: pointer;
display: flex;
align-items: center;
justify-content: center;
transition: background 0.15s ease;
```
Hover: `background: var(--slate-200);`
Icon: 14x14px chevron-down, `color: var(--slate-500)`.

**Widget steps container:**
```css
flex: 1;
overflow-y: auto;
padding: 8px 0;
```

**Widget footer:**
```css
padding: 12px 20px;
border-top: 1px solid var(--slate-100);
flex-shrink: 0;

/* Text */
font-size: 12px;
font-weight: 500;
color: var(--slate-400);
text-align: center;
```
Footer text: "Visible sur toutes les pages jusqu'a la completion"

---

### 2.5 Step Item

Each step in the checklist. Three visual states: **upcoming**, **current**, **completed**.

#### Mobile step (bottom sheet)

**Container:**
```css
display: flex;
align-items: flex-start;
gap: 14px;
padding: 16px 24px;
cursor: pointer;
transition: background 0.15s ease;
position: relative;
```
Hover: `background: var(--slate-50);`

**Timeline connector (between steps):**
```css
/* Applied via ::after pseudo-element on all steps except last */
content: '';
position: absolute;
left: 41px;                /* center of the 28px circle at padding-left 24px: 24 + 14 + 3 */
top: 48px;
bottom: -16px;
width: 1.5px;
background: var(--slate-200);          /* #E2E8F0 */
```
For completed steps: `background: var(--success); opacity: 0.3;` (green connector).

**Step circle (all states):**
```css
width: 28px;
height: 28px;
border-radius: 50%;
flex-shrink: 0;
display: flex;
align-items: center;
justify-content: center;
margin-top: 1px;
transition: all 0.3s ease;
```

| State | border | background | number color | number display | check display |
|-------|--------|------------|-------------|----------------|---------------|
| **Upcoming** | `2px solid var(--slate-300)` | none | `var(--slate-400)` | visible | hidden |
| **Current** | `2px solid var(--teal-700)` | `var(--teal-50)` | `var(--teal-700)` | visible | hidden |
| **Completed** | `2px solid var(--success)` | `var(--success)` | hidden | hidden | visible (white check 14x14) |

Step number: `font-size: 12px; font-weight: 700;`

Check icon (inside circle): `width: 14px; height: 14px; color: var(--white);` -- SVG polyline `points="20 6 9 17 4 12"`, `stroke-width: 3`.

**Step title:**
```css
font-size: 15px;
font-weight: 600;
letter-spacing: -0.01em;
margin-bottom: 3px;
```

| State | color | decoration |
|-------|-------|------------|
| **Upcoming** | `var(--slate-900)` | none |
| **Current** | `var(--teal-700)` | none |
| **Completed** | `var(--slate-400)` | `line-through`, `text-decoration-color: var(--slate-300)` |

**Step description:**
```css
font-size: 13px;
font-weight: 400;
line-height: 1.4;
```

| State | color |
|-------|-------|
| **Upcoming** | `var(--slate-500)` |
| **Current** | `var(--slate-500)` |
| **Completed** | `var(--slate-300)` |

**Step arrow (chevron-right):**
```css
width: 20px;
height: 20px;
flex-shrink: 0;
margin-top: 3px;
transition: all 0.15s ease;
```

| State | color | display |
|-------|-------|---------|
| **Upcoming** | `var(--slate-300)` | visible |
| **Current** | `var(--teal-700)` | visible |
| **Completed** | -- | `display: none` |

Hover effect on arrow: `transform: translateX(3px);`

#### Desktop step (widget)

Same structure, slightly smaller:

```css
/* Container */
display: flex;
align-items: flex-start;
gap: 12px;
padding: 14px 20px;
cursor: pointer;
transition: background 0.12s ease;
position: relative;
```

**Timeline connector:**
```css
left: 33px;
top: 44px;
bottom: -14px;
width: 1.5px;
```

**Step circle:** `width: 26px; height: 26px;`
Number: `font-size: 11px;`
Check icon: `width: 13px; height: 13px;`

Current step circle background: `rgba(15, 118, 110, 0.06)` (slightly different from mobile's `var(--teal-50)`).

**Step title:** `font-size: 14px;`
**Step description:** `font-size: 12px;`
**Step arrow:** `width: 16px; height: 16px; margin-top: 2px;`

---

### 2.6 Progress Ring (SVG)

Circular progress indicator. Three size variants.

#### Small ring (collapsed bar, 36px)

```html
<svg width="36" height="36" viewBox="0 0 36 36" style="transform: rotate(-90deg)">
  <circle class="track" cx="18" cy="18" r="14" />
  <circle class="fill"  cx="18" cy="18" r="14" />
</svg>
```

Track: `fill: none; stroke: var(--slate-100); stroke-width: 3;`

Fill: `fill: none; stroke: var(--teal-700); stroke-width: 3; stroke-linecap: round;`

**Circumference:** `2 * PI * 14 = 87.96 ~= 88`

| Progress | stroke-dasharray | stroke-dashoffset |
|----------|-----------------|-------------------|
| 0/4 (0%) | 88 | 88 |
| 1/4 (25%) | 88 | 66 |
| 2/4 (50%) | 88 | 44 |
| 3/4 (75%) | 88 | 22 |
| 4/4 (100%) | 88 | 0 |

Count label (centered over ring):
```css
position: absolute;
inset: 0;
display: flex;
align-items: center;
justify-content: center;
font-size: 11px;
font-weight: 800;
color: var(--teal-700);
letter-spacing: -0.02em;
```

#### Medium ring (bottom sheet header, 48px)

```html
<svg width="48" height="48" viewBox="0 0 48 48">
  <circle class="track" cx="24" cy="24" r="19" />
  <circle class="fill"  cx="24" cy="24" r="19" />
</svg>
```

Track: `stroke-width: 3.5;`
Fill: `stroke-width: 3.5;`

**Circumference:** `2 * PI * 19 = 119.38 ~= 119.4`

| Progress | stroke-dasharray | stroke-dashoffset |
|----------|-----------------|-------------------|
| 0/4 (0%) | 119.4 | 119.4 |
| 1/4 (25%) | 119.4 | 89.55 |
| 2/4 (50%) | 119.4 | 59.7 |
| 3/4 (75%) | 119.4 | 29.85 |
| 4/4 (100%) | 119.4 | 0 |

Count label: `font-size: 14px; font-weight: 800;`

#### Desktop widget ring (44px)

```html
<svg width="44" height="44" viewBox="0 0 44 44">
  <circle class="track" cx="22" cy="22" r="17" />
  <circle class="fill"  cx="22" cy="22" r="17" />
</svg>
```

Track: `stroke-width: 3.5;`
Fill: `stroke-width: 3.5;`

**Circumference:** `2 * PI * 17 = 106.81 ~= 107`

| Progress | stroke-dasharray | stroke-dashoffset |
|----------|-----------------|-------------------|
| 0/4 | 107 | 107 |
| 1/4 | 107 | 80.25 |
| 2/4 | 107 | 53.5 |
| 3/4 | 107 | 26.75 |
| 4/4 | 107 | 0 |

Count label: `font-size: 13px; font-weight: 800;`

#### Celebration ring (72px) -- see section 2.7

---

### 2.7 Celebration Screen

Replaces the checklist content inside the bottom sheet when all 4 steps are completed.

**Celebration container:**
```css
text-align: center;
padding: 20px 24px 8px;
position: relative;
```

**Celebration ring (72px, amber):**
```html
<svg width="72" height="72" viewBox="0 0 72 72">
  <circle class="track" cx="36" cy="36" r="28" />
  <circle class="fill"  cx="36" cy="36" r="28" />
</svg>
```

Track: `fill: none; stroke: var(--amber-100); stroke-width: 4;` (`#FEF3C7`)
Fill: `fill: none; stroke: var(--amber-500); stroke-width: 4; stroke-linecap: round; stroke-dasharray: 176; stroke-dashoffset: 0;` (100% filled)

**Circumference:** `2 * PI * 28 = 175.93 ~= 176`

Ring container: `width: 72px; height: 72px; margin: 0 auto 20px; position: relative; z-index: 1;`

Inner check icon (centered): `width: 28px; height: 28px; color: var(--amber-500);`

**Key color change:** The ring switches from teal (in-progress) to amber (completed). This is the visual reward moment per the brand's amber-for-milestones rule.

**Celebration title:**
```css
font-size: 24px;
font-weight: 800;
color: var(--slate-900);
letter-spacing: -0.03em;
margin-bottom: 8px;
position: relative;
z-index: 1;
```
Text: "Ton budget est pret !"

**Celebration subtitle:**
```css
font-size: 15px;
font-weight: 500;
color: var(--slate-500);
line-height: 1.5;
max-width: 280px;
margin: 0 auto 24px;
position: relative;
z-index: 1;
```
Text: "Tu as tout configure. Ton tableau de bord t'attend avec tes chiffres en temps reel."

**CTA button:**
```css
display: inline-flex;
align-items: center;
gap: 8px;
padding: 14px 28px;
background: var(--amber-500);          /* #F59E0B */
color: var(--slate-900);               /* #0F172A */
border: none;
border-radius: var(--radius-md);       /* 12px */
font-family: var(--font);
font-size: 15px;
font-weight: 700;
letter-spacing: -0.01em;
cursor: pointer;
transition: all 0.2s ease;
box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
position: relative;
z-index: 1;
```

Hover:
```css
background: var(--amber-600);          /* #D97706 */
transform: translateY(-1px);
box-shadow: 0 6px 16px rgba(245, 158, 11, 0.35);
```

CTA text: "Voir mon tableau de bord" + chevron-right icon (16x16px).

**Confetti (CSS-only):**

Container:
```css
position: absolute;
top: 0;
left: 0;
right: 0;
height: 200px;
overflow: hidden;
pointer-events: none;
```

16 confetti particles, each:
```css
position: absolute;
border-radius: 2px;                    /* some are 50% (circles) */
animation: confetti-fall 2s ease-out forwards;
```

Keyframes:
```css
@keyframes confetti-fall {
  0% {
    transform: translateY(-20px) rotate(0deg) scale(1);
    opacity: 1;
  }
  100% {
    transform: translateY(200px) rotate(720deg) scale(0.5);
    opacity: 0;
  }
}
```

Particle sizes: 4-10px width, 5-10px height (varied).
Colors used: `--amber-500`, `--amber-400`, `--teal-700`, `--teal-600`, `--slate-300`, `--slate-400`.
Animation delays: staggered from 0s to 0.22s.
Positions: distributed across 10%-85% left, 0%-20% top.

---

## 3. States & Transitions

### 3.1 First-load entrance (collapsed bar / widget)

| Platform | Animation | Duration | Easing | Delay |
|----------|-----------|----------|--------|-------|
| Mobile | Slide-up from bottom | 350ms | ease-out | 800ms after page load |
| Desktop | Slide-up + fade-in | 350ms | ease-out | 600ms after page load |

### 3.2 Collapsed <-> Expanded

#### Mobile (bar -> bottom sheet)

| Transition | Animation | Duration | Easing |
|------------|-----------|----------|--------|
| Expand (bar -> sheet) | Sheet slides up from bar position | 350ms | ease-out |
| Expand backdrop | Fade-in | 200ms | -- |
| Expand checklist items | Stagger slide-up-fade | 60ms delay between items | -- |
| Collapse (sheet -> bar) | Sheet slides down | 300ms | ease-in |
| Collapse backdrop | Fade-out | 200ms | -- |
| Chevron rotation | Rotate 180deg | 250ms | ease-in-out |

Swipe-down on drag handle also triggers collapse.

#### Desktop (pill -> card)

| Transition | Animation | Duration | Easing | Origin |
|------------|-----------|----------|--------|--------|
| Expand | Scale 0.95 -> 1.0 + fade-in | 250ms | ease-out | bottom right |
| Expand checklist items | Stagger slide-up-fade | 50ms delay between items | -- | -- |
| Collapse | Scale 1.0 -> 0.95 + fade-out | 200ms | ease-in | bottom right |

### 3.3 Step completion

| Animation | Duration | Easing | Details |
|-----------|----------|--------|---------|
| Circle scale (spring) | 400ms | spring | 1.0 -> 1.2 -> 1.0 |
| Checkmark draw | 300ms | ease-out | SVG stroke animation |
| Title color transition | 300ms | -- | slate-900 -> slate-400 |
| Current step highlight | 250ms | fade-in | Teal ring appears on next step |
| Progress ring fill | 800ms | ease | stroke-dashoffset transition |

### 3.4 Celebration sequence (orchestrated)

Triggered when step 4 completes:

| Order | Animation | Duration | Delay | Details |
|-------|-----------|----------|-------|---------|
| 1 | Final step check-draw | 300ms | 0ms | Same as normal step completion |
| 2 | Progress ring fills to 100% | 800ms | 0ms | stroke-dashoffset ease |
| 3 | Ring morph: teal -> amber, scale spring | 500ms | ~300ms | Ring color changes, scales 1.0 -> 1.3 -> 1.0 |
| 4 | Sheet content crossfade to celebration | 300ms | ~600ms | Checklist fades out, celebration fades in |
| 5 | Confetti burst | 1200ms (main), 2000ms (full fall) | ~600ms | 16 CSS particles, brand colors |
| 6 | Title "Ton budget est pret !" slide-up + fade-in | 400ms | ~1000ms (400ms after crossfade) | |
| 7 | Auto-dismiss (if no CTA tap) | -- | 5000ms | Sheet slides down, guide disappears |

### 3.5 Guide dismissal (after celebration)

| Trigger | Animation | Duration |
|---------|-----------|----------|
| CTA button tap | Sheet slides down + guide bar disappears | 400ms slide-down |
| Auto-dismiss timeout | Same | 400ms slide-down, after 5s |

After dismissal, the guide is gone permanently (persisted server-side).

### 3.6 Attention pulse (collapsed bar)

```
Subtle pulse on the "next step" text every 8 seconds to draw attention.
```

---

## 4. Typography Reference

All text uses `'Plus Jakarta Sans', system-ui, sans-serif`.

### Mobile collapsed bar

| Element | Size | Weight | Color | Other |
|---------|------|--------|-------|-------|
| Step label ("Etape suivante") | 10px | 700 | `--teal-700` | uppercase, letter-spacing: 0.08em |
| Step action text | 14px | 600 | `--slate-900` | letter-spacing: -0.01em, ellipsis overflow |
| Progress count ("0/4") | 11px | 800 | `--teal-700` | letter-spacing: -0.02em |

### Bottom sheet header

| Element | Size | Weight | Color | Other |
|---------|------|--------|-------|-------|
| Title "Configure ton budget" | 18px | 800 | `--slate-900` | letter-spacing: -0.02em |
| Subtitle (default) "4 etapes pour etre operationnel" | 13px | 500 | `--slate-500` | letter-spacing: -0.01em |
| Subtitle (in-progress) "Deja a mi-chemin !" | 13px | 600 | `--teal-700` | -- |
| Progress count ("2/4") | 14px | 800 | `--teal-700` | letter-spacing: -0.02em |

### Step items (mobile)

| Element | Size | Weight | Color | Other |
|---------|------|--------|-------|-------|
| Step number | 12px | 700 | varies by state | -- |
| Step title | 15px | 600 | varies by state | letter-spacing: -0.01em |
| Step description | 13px | 400 | varies by state | line-height: 1.4 |

### Step items (desktop widget)

| Element | Size | Weight | Color | Other |
|---------|------|--------|-------|-------|
| Step number | 11px | 700 | varies by state | -- |
| Step title | 14px | 600 | varies by state | letter-spacing: -0.01em |
| Step description | 12px | 400 | varies by state | line-height: 1.4 |

### Desktop widget header

| Element | Size | Weight | Color | Other |
|---------|------|--------|-------|-------|
| Title "Configure ton budget" | 16px | 800 | `--slate-900` | letter-spacing: -0.02em |
| Subtitle | 13px | 600 | `--teal-700` | -- |
| Progress count | 13px | 800 | `--teal-700` | -- |

### Celebration

| Element | Size | Weight | Color | Other |
|---------|------|--------|-------|-------|
| "Ton budget est pret !" | 24px | 800 | `--slate-900` | letter-spacing: -0.03em |
| Subtitle | 15px | 500 | `--slate-500` | line-height: 1.5, max-width: 280px |
| CTA button text | 15px | 700 | `--slate-900` | letter-spacing: -0.01em |

### Widget footer

| Element | Size | Weight | Color | Other |
|---------|------|--------|-------|-------|
| Footer text | 12px | 500 | `--slate-400` | text-align: center |

---

## 5. Color Map

| Element | Color Token | Hex |
|---------|------------|-----|
| Progress ring fill (in-progress) | `--teal-700` | `#0F766E` |
| Progress ring track | `--slate-100` | `#F1F5F9` |
| Progress ring fill (celebration) | `--amber-500` | `#F59E0B` |
| Celebration ring track | `--amber-100` | `#FEF3C7` |
| Celebration check icon | `--amber-500` | `#F59E0B` |
| CTA button background | `--amber-500` | `#F59E0B` |
| CTA button text | `--slate-900` | `#0F172A` |
| CTA button hover bg | `--amber-600` | `#D97706` |
| CTA button shadow | -- | `rgba(245, 158, 11, 0.3)` |
| Collapsed bar bg | `--white` | `#FFFFFF` |
| Collapsed bar border | `--slate-200` | `#E2E8F0` |
| Collapsed bar shadow | `--shadow-lg` | `0 8px 24px rgba(15, 118, 110, 0.12)` |
| Bottom sheet bg | `--white` | `#FFFFFF` |
| Bottom sheet shadow | -- | `0 -8px 32px rgba(15, 23, 42, 0.12), 0 -2px 8px rgba(15, 118, 110, 0.06)` |
| Backdrop | -- | `rgba(15, 23, 42, 0.2)` |
| Step label text | `--teal-700` | `#0F766E` |
| Chevron circle bg | `--teal-50` | `#F0FDFA` |
| Chevron icon | `--teal-700` | `#0F766E` |
| Drag handle | `--slate-300` | `#CBD5E1` |
| Sheet divider | `--slate-100` | `#F1F5F9` |
| Completed step circle bg | `--success` | `#059669` |
| Completed step circle border | `--success` | `#059669` |
| Completed check color | `--white` | `#FFFFFF` |
| Completed step connector | `--success` at 0.3 opacity | `#059669` |
| Current step circle border | `--teal-700` | `#0F766E` |
| Current step circle bg | `--teal-50` | `#F0FDFA` |
| Upcoming step circle border | `--slate-300` | `#CBD5E1` |
| Upcoming step connector | `--slate-200` | `#E2E8F0` |
| Desktop collapse btn bg | `--slate-100` | `#F1F5F9` |
| Desktop collapse btn hover | `--slate-200` | `#E2E8F0` |
| Desktop collapse btn icon | `--slate-500` | `#64748B` |
| Desktop widget shadow | -- | `0 16px 48px rgba(15, 23, 42, 0.14), 0 4px 16px rgba(15, 118, 110, 0.08)` |
| Confetti colors | `--amber-500`, `--amber-400`, `--teal-700`, `--teal-600`, `--slate-300`, `--slate-400` | mixed |

---

## 6. Spacing Reference

### Mobile collapsed bar
- Outer padding (left/right inset): 12px
- Inner padding: 14px 16px
- Gap between ring, text, chevron: 12px
- Bottom position: 72px (above 72px-tall bottom nav)

### Mobile bottom sheet
- Handle top padding: 12px
- Header padding: 12px 24px 20px
- Header gap: 14px
- Divider margin: 0 24px
- Step padding: 16px 24px
- Step gap: 14px
- Step title margin-bottom: 3px
- Sheet bottom padding: 20px (celebration: 24px)
- Max height: 520px

### Desktop widget collapsed
- Position: 24px from bottom, 24px from right
- Padding: 14px 18px
- Gap: 14px

### Desktop widget expanded
- Position: 24px from bottom, 24px from right
- Header padding: 20px 20px 16px
- Header gap: 14px
- Step padding: 14px 20px
- Step gap: 12px
- Footer padding: 12px 20px
- Max height: 500px

### Celebration
- Container padding: 20px 24px 8px
- Ring margin-bottom: 20px
- Title margin-bottom: 8px
- Subtitle margin-bottom: 24px
- CTA padding: 14px 28px
- CTA gap (text to icon): 8px

---

## 7. Interaction Behavior

### Collapsed bar / widget tap

| Action | Result |
|--------|--------|
| Tap collapsed bar (mobile) | Expand to bottom sheet with checklist |
| Tap collapsed widget (desktop) | Expand to floating card |

### Step tap

| Action | Result |
|--------|--------|
| Tap step 1 (upcoming/current) | Navigate to `/revenus` (income page) |
| Tap step 2 (upcoming/current) | Navigate to `/depenses` (expenses page, to add a fixed charge) |
| Tap step 3 (upcoming/current) | Navigate to `/` (dashboard, trigger month generation) |
| Tap step 4 (upcoming/current) | Navigate to `/depenses` (to mark an expense as paid) |
| Tap completed step | No navigation (arrow is hidden, but step is still tappable -- no-op or navigate to same page) |

### Collapse actions

| Action | Result |
|--------|--------|
| Tap backdrop (mobile) | Collapse bottom sheet |
| Swipe down on drag handle (mobile) | Collapse bottom sheet |
| Tap collapse button (desktop) | Collapse to pill |
| Click outside widget (desktop) | No effect (widget stays open, no backdrop) |

### Celebration CTA

| Action | Result |
|--------|--------|
| Tap "Voir mon tableau de bord" | Dismiss guide permanently, navigate to dashboard |
| No action for 5s | Auto-dismiss guide (slide down, disappear forever) |

---

## 8. Accessibility

### ARIA roles and labels

| Component | Role/Attribute | Value |
|-----------|---------------|-------|
| Collapsed bar | `role="button"`, `aria-expanded="false"` | "Guide de configuration, 2 sur 4 etapes completees. Etape suivante : [step name]" |
| Bottom sheet | `role="dialog"`, `aria-label` | "Guide de configuration" |
| Backdrop | `aria-hidden="true"` | -- |
| Drag handle | `role="button"`, `aria-label` | "Fermer le guide" |
| Each step (incomplete) | `role="link"` or `<a>` | Step title as accessible name |
| Each step (completed) | `aria-disabled="true"` | -- |
| Progress ring | `role="progressbar"`, `aria-valuenow`, `aria-valuemin="0"`, `aria-valuemax="4"` | Current count |
| Collapse button (desktop) | `aria-label` | "Reduire le guide" |
| Celebration CTA | `role="button"` | -- |

### Keyboard navigation

| Key | Action |
|-----|--------|
| Enter/Space on collapsed bar | Expand |
| Escape (when expanded) | Collapse |
| Tab | Move focus through steps |
| Enter/Space on step | Navigate to step target |
| Enter/Space on CTA | Dismiss + navigate |

### Focus management

- When sheet/widget expands: move focus to the first incomplete step
- When sheet/widget collapses: return focus to collapsed bar/widget
- Trap focus inside the bottom sheet while open (mobile only, since it has a backdrop)
- Desktop widget does NOT trap focus (no backdrop, no modal behavior)

### Screen reader announcements

- On step completion: announce "[Step name] completee. [N] sur 4 etapes completees."
- On celebration: announce "Toutes les etapes sont completees. Ton budget est pret."

---

## 9. Microcopy

### Guide labels

| Context | Text |
|---------|------|
| Collapsed bar label | "Etape suivante" |
| Sheet title | "Configure ton budget" |
| Sheet subtitle (0/4) | "4 etapes pour etre operationnel" |
| Sheet subtitle (1/4) | "Beau debut !" |
| Sheet subtitle (2/4) | "Deja a mi-chemin !" |
| Sheet subtitle (3/4) | "Plus qu'une etape !" |
| Celebration title | "Ton budget est pret !" |
| Celebration subtitle | "Tu as tout configure. Ton tableau de bord t'attend avec tes chiffres en temps reel." |
| Celebration CTA | "Voir mon tableau de bord" |
| Widget footer | "Visible sur toutes les pages jusqu'a la completion" |

### Step content

| Step | Title | Description |
|------|-------|-------------|
| 1 | Ajouter un revenu recurrent | Ton salaire ou toute entree d'argent reguliere. |
| 2 | Ajouter une charge fixe | Loyer, abonnements, assurances... |
| 3 | Generer le mois courant | Cree les depenses a partir de tes modeles. |
| 4 | Marquer une depense payee | Confirme un paiement pour voir ton budget bouger. |

---

## 10. Responsive Breakpoints

| Breakpoint | Guide component |
|------------|----------------|
| < 1024px | Mobile: collapsed bar (fixed, bottom: 72px) + bottom sheet |
| >= 1024px | Desktop: floating widget (fixed, bottom: 24px, right: 24px) |

On desktop, the widget does NOT overlap the sidebar (sidebar is `position: fixed; left: 0; width: 260px;` -- the widget is at `right: 24px`, well within the main content area).

---

## 11. Implementation Notes

### Persistence

- The guide state (which steps are completed) must be persisted server-side (database).
- The guide should appear on ALL pages of the app until all 4 steps are completed.
- Completion of each step is detected automatically when the user performs the action (not manually checked off).
- The `setup_completed` flag (or equivalent) should be set when step 4 is completed.
- Once dismissed after celebration, the guide never appears again.

### Step completion detection

| Step | Trigger |
|------|---------|
| 1 | At least one recurring income exists |
| 2 | At least one fixed expense template exists |
| 3 | Current month has been generated (monthly expenses exist) |
| 4 | At least one expense has been marked as paid |

### Rendering strategy

- The guide is a **global component** rendered in the root layout, not per-page.
- On mobile, it renders above the bottom navigation bar.
- On desktop, it renders as a floating element in the viewport corner.
- The collapsed/expanded state is local (client-side, not persisted). Default to collapsed.

### Z-index stack

| Element | z-index |
|---------|---------|
| Bottom nav | 50 |
| Backdrop (mobile) | 90 |
| Bottom sheet / Guide bar | 100 |
| Desktop widget | 200 |
