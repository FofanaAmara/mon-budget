---
product: mes-finances
direction: 4
name: Le Compas
validated: true
validated_date: 2026-03-01
---

# Brand Config — Mes Finances

## Identity
- **Product name**: Mes Finances
- **Tagline**: Tes finances. En clair.
- **Archetype**: Protecteur (primary) + Sage (secondary)
- **Stance**: Radical Simplicity
- **Personality**: Le grand frere bienveillant qui est bon avec l'argent. Clair, calme, rassurant.
- **Voice**: Tutoiement quebecois. Direct, bienveillant, jamais condescendant.

### Mission
Donner a chaque francophone les outils pour comprendre ou va son argent — sans stress, sans jargon, sans jugement.

### Vision
Un monde ou la clarte financiere n'est pas un privilege, mais un reflexe quotidien.

### Values
1. **Clarte** — Une idee par phrase, un chiffre par ecran. Si c'est pas clair, c'est pas fini.
2. **Bienveillance** — L'argent stresse deja assez. On est la pour rassurer, pas pour juger.
3. **Simplicite radicale** — Chaque fonctionnalite qu'on n'ajoute pas est une victoire.

## Logo
- **Name**: Le Compas
- **Concept**: Courbe de croissance dans un conteneur protecteur. Point ambre = objectif atteint.
- **Files**: cs-brand/final/logo-full-color.svg (+ reversed, mono-black, mono-white)
- **Symbol files**: cs-brand/final/symbol-color.svg (+ reversed, mono-black, mono-white)
- **Wordmark files**: cs-brand/final/wordmark-color.svg (+ reversed)
- **SVG mark spec**:
  - Container: `<rect x="-36" y="-36" width="72" height="72" rx="18" fill="#0F766E"/>`
  - Curve: `<path d="M-18 22 C-10 18, -4 8, 0 0 S10 -8, 14 -4 S22 -14, 24 -22" stroke="#FAFBFC" stroke-width="4" stroke-linecap="round" fill="none"/>`
  - Dot: `<circle cx="24" cy="-22" r="3.5" fill="#F59E0B"/>`
- **Wordmark spec**: "Mes" (800 weight, #0F172A) + "Finances" (600 weight, #0F766E), Plus Jakarta Sans, 26px, -0.02em

### Logo Sizes
- Full logo minimum: 120px width
- Symbol minimum: 16px width (favicon)
- Wordmark minimum: 80px width
- Clear space: 1x symbol height on all sides

## Colors
| Token | Hex | Name | Usage |
|-------|-----|------|-------|
| `--color-primary` | `#0F766E` | Deep Teal / Serenite | 60% — Primary brand color |
| `--color-primary-dark` | `#115E59` | Teal 800 | Hover states, darker surfaces |
| `--color-accent` | `#F59E0B` | Amber / Progres | 10% — Goals, achievements, CTAs |
| `--color-surface` | `#FAFBFC` | Snow | Main background |
| `--color-surface-teal` | `#F0FDFA` | Teal 50 | Light teal backgrounds |
| `--color-text` | `#0F172A` | Encre | Primary text |
| `--color-text-secondary` | `#64748B` | Gris doux | Secondary text, labels |
| `--color-text-muted` | `#334155` | Slate 700 | Tertiary text |
| `--color-border` | `#E2E8F0` | Slate 200 | Borders, dividers |
| `--color-success` | `#059669` | Emerald 600 | Positive states, savings |
| `--color-warning` | `#F59E0B` | Amber 500 | Warnings, approaching limits |
| `--color-error` | `#DC2626` | Red 600 | Error states, overspending |

### Color Ratio
**60% Teal** (brand surfaces, headers, navigation) | **30% Neutrals** (text, backgrounds, dividers) | **10% Amber** (CTAs, achievements, highlights)

## Typography
- **Primary font**: Plus Jakarta Sans
- **Fallback**: Inter, system-ui, sans-serif
- **Weights used**: 300, 400, 500, 600, 700, 800
- **Google Fonts URL**: `https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap`
- **Scale**:
  - Display: 48-72px / 800 / -0.03em
  - H1: 36-48px / 700 / -0.02em
  - H2: 24-30px / 700 / -0.02em
  - H3: 20-24px / 600 / -0.01em
  - Body: 16-18px / 400-500 / 1.7
  - Small: 14px / 400
  - Label: 12-13px / 600 / uppercase / 0.08em

## Voice & Tone
- **Pronoun**: Tu (tutoiement quebecois)
- **Attributes**: Clair (10), Trustworthy (9), Warm (8), Confident (7), Expert (6), Playful (4)
- **Personality**: Le grand frere bienveillant qui est bon avec l'argent. Il tutoie naturellement. Il explique sans condescendance. Il celebre tes victoires sans en faire trop. Il signale les problemes sans dramatiser.

### DO
- "Ton mois est sous controle. 847 $ disponibles."
- "Objectif atteint ! Tu as economise 200 $ ce mois-ci."
- "Il te reste 15 jours. Tu es dans les temps."
- "Depense inhabituelle detectee. Ca ressemble a quoi ?"

### DON'T
- Vouvoiement, jargon financier, ton anxiogene
- "Felicitations pour votre excellente gestion budgetaire !" (trop formel)
- "ALERTE : Vous avez depasse votre budget !" (anxiogene)
- "Optimisez vos flux de tresorerie" (jargon)

### Tone by Context
| Context | Adjustment |
|---------|-----------|
| Marketing / Landing | Confiant + chaleureux. "Tes finances. En clair." |
| Product UI | Direct + clair. "847 $ disponibles ce mois-ci." |
| Success | Celebratoire mais sobre. "Objectif atteint !" |
| Alert | Calme + informatif. "T'approches de ta limite pour Restos." |
| Error | Rassurant. "Quelque chose a bloque. On reessaie ?" |
| Onboarding | Accueillant. "Bienvenue ! On va configurer ton budget en 2 minutes." |

## Key Messages
1. **"Tes finances. En clair."** — tagline
2. **"Sais exactement ou va ton argent."** — value prop
3. **"Pas de surprise. Pas de stress. Juste de la clarte."** — emotional promise
4. **"Ton argent, ton rythme."** — autonomy

## CSS Tokens

```css
:root {
  /* Couleurs primaires */
  --teal-700: #0F766E;
  --teal-800: #115E59;
  --teal-50: #F0FDFA;

  /* Accent */
  --amber-500: #F59E0B;

  /* Neutres */
  --slate-900: #0F172A;
  --slate-700: #334155;
  --slate-500: #64748B;
  --slate-200: #E2E8F0;
  --slate-50: #FAFBFC;

  /* Fonctionnelles */
  --success: #059669;
  --warning: #F59E0B;
  --error: #DC2626;

  /* Typographie */
  --font-display: 'Plus Jakarta Sans', system-ui, sans-serif;
  --font-body: 'Inter', system-ui, sans-serif;

  /* Ombres */
  --shadow-sm: 0 1px 2px rgba(15, 118, 110, 0.05);
  --shadow-md: 0 4px 12px rgba(15, 118, 110, 0.08);
  --shadow-lg: 0 8px 24px rgba(15, 118, 110, 0.12);

  /* Radius */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 18px;
}
```

## UI Patterns

### Buttons
- **Primary**: bg teal-700, text white, hover teal-800, radius-md
- **Secondary**: border teal-700, text teal-700, hover bg teal-50, radius-md
- **Accent**: bg amber-500, text slate-900, hover amber-600, radius-md (CTAs importants)

### Cards
- Background: white, border 1px slate-200, radius-lg (18px), shadow-sm, hover shadow-md, padding 24px

### Navigation
- Background: teal-700, text white, active indicator: amber-500 underline or dot

### Inputs
- Border: slate-200, focus border: teal-700, radius-sm, label: uppercase 600 weight slate-500

## Files
- Brand guidelines: `cs-brand/final/brand-guidelines.html`
- Brand identity doc: `cs-brand/final/brand-identity.md`
- Logo (full color): `cs-brand/final/logo-full-color.svg`
- Logo (reversed): `cs-brand/final/logo-reversed.svg`
- Logo (mono black): `cs-brand/final/logo-mono-black.svg`
- Logo (mono white): `cs-brand/final/logo-mono-white.svg`
- Symbol (color): `cs-brand/final/symbol-color.svg`
- Symbol (reversed): `cs-brand/final/symbol-reversed.svg`
- Symbol (mono black): `cs-brand/final/symbol-mono-black.svg`
- Symbol (mono white): `cs-brand/final/symbol-mono-white.svg`
- Wordmark (color): `cs-brand/final/wordmark-color.svg`
- Wordmark (reversed): `cs-brand/final/wordmark-reversed.svg`
- All proposals (history): `cs-brand/proposals/`
