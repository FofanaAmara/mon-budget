# Design Handoff -- Coherence Design

## Feature
coherence-design (stabilisation epic)

## Experience Overview
Harmonisation de 6 patterns visuels divergents identifies lors de l'audit design du 7 mars 2026. Aucune nouvelle fonctionnalite -- uniquement du frontend (composants, styles). Le but : un utilisateur qui navigue entre les pages doit sentir la meme famille visuelle partout.

## Stance
Typography Monument (inchange -- coherence = meme stance partout)

## Mockup
`cs-design/mes-finances/features/coherence-design/mockups/index.html`
Pattern reference sheet avec AVANT/APRES pour chaque story.

---

## DESIGN-001 -- Boutons d'ajout + FAB mobile

### Composant : SectionHeader (bouton d'ajout)

**Desktop (>= 768px) :**
- Bouton `+ Label` dans le header de section, aligne a droite
- Style : filled teal (`bg: #0F766E`, `color: white`, `border-radius: 8px`, `padding: 8px 16px`, `font-size: 13px`, `font-weight: 600`)
- Jamais de bouton outlined pour l'ajout

**Mobile (< 768px) :**
- Bouton masque dans le header
- FAB rond en bas a droite

### Composant : FAB

**Specs :**
- Taille : 52px x 52px
- Border-radius : 50%
- Background : `#0F766E`
- Color : white
- Box-shadow : `0 4px 14px rgba(15, 118, 110, 0.35)`
- Position : fixed, bottom 20px, right 20px, z-index 40
- Icone : `+` (ou svg plus icon), 24px
- Touch target >= 44px (depasse car 52px)

**Etats :**
| Etat | Comportement |
|------|-------------|
| Default | Visible, shadow standard |
| Pressed | scale(0.92), shadow reduit |
| Avec guide actif | Verifier que le z-index ne chevauche pas la barre du guide |

**Pages impactees :**
| Page | Desktop | Mobile |
|------|---------|--------|
| Patrimoine | Bouton outlined -> **filled** | OK (pas de FAB car pas d'ajout rapide) |
| Sections | Bouton filled header (deja OK) | Pill fixe -> **FAB rond** |
| Cartes | Bouton filled header (deja OK) | Pill fixe -> **FAB rond** |
| Revenus | FAB visible -> **bouton filled header** | OK (FAB deja present) |

### Responsive
- Breakpoint : 768px (`lg` dans Tailwind v4 ou `@media (min-width: 768px)`)
- Desktop : bouton header visible, FAB masque (`display: none` ou `hidden`)
- Mobile : bouton header masque, FAB visible

---

## DESIGN-002 -- Cards Patrimoine

### Composant : GroupedContainer + GroupedRow

Remplacer les cards individuelles avec bordure laterale par le pattern conteneur groupe.

**GroupedContainer :**
- Background : white
- Border : 1px solid `#E2E8F0` (slate-200)
- Border-radius : 18px (radius-lg)
- Box-shadow : `0 1px 2px rgba(15, 118, 110, 0.05)` (shadow-sm)
- Overflow : hidden

**GroupedRow :**
- Padding : 14px 16px
- Separator : `border-top: 1px solid #E2E8F0` (sauf premiere row)
- Layout : flex, align-items center, gap 12px

**Distinction epargne/dettes :**
- Plus de bordure laterale coloree
- Icone dans un conteneur 36x36px, border-radius 10px
  - Epargne : bg `#F0FDFA` (teal-50), icone stroke `#0F766E`
  - Dettes : bg `#FEF2F2` (error-light), icone stroke `#DC2626`
- Le montant reste colore : teal-700 pour epargne, error pour dettes

**Etats :**
| Etat | Comportement |
|------|-------------|
| Default | Comme decrit ci-dessus |
| Hover (desktop) | Background row -> slate-50, transition 150ms |
| Active/Tap | scale(0.99), 100ms |
| 0 items | Message vide dans le conteneur, pas de conteneur vide |
| Progression 100% | Barre pleine, couleur amber-500 (objectif atteint) |

### Responsive
- Desktop : identique
- Mobile : identique (pas de changement de layout, le pattern est deja mobile-first)

---

## DESIGN-003 -- Headers de section

### Composant : SectionLabel

**Specs uniformes :**
- Font-size : 11px
- Font-weight : 700
- Letter-spacing : 0.08em
- Text-transform : uppercase
- Color : `#0F766E` (teal-700) -- **toujours vert, jamais gris**
- Format : `LABEL (N)` -- compteur toujours present entre parentheses

**Compteur :**
- Dynamique (mis a jour apres ajout/suppression)
- Affiche `(0)` si aucun item
- Exemples : `EPARGNE (2)`, `DETTES (1)`, `A VENIR (5)`, `LISTE (6)`, `MES REVENUS (3)`

**Layout :**
- Flexbox : `display: flex; align-items: center; justify-content: space-between;`
- Le bouton d'ajout (desktop only) est a droite dans le meme flex container

**Pages impactees :**
| Page | Changement |
|------|-----------|
| Depenses | Label gris -> **vert** |
| Patrimoine | Ajouter compteur `(N)`, bouton outlined -> filled |
| Sections | Label gris -> **vert**, ajouter compteur `(N)` |
| Cartes | Label gris -> **vert**, ajouter compteur `(N)` |
| Params/revenus | Ajouter compteur `(N)` |
| Params/charges | Ajouter compteur `(N)` |

---

## DESIGN-004 -- Format des montants

### Helper : formatCAD(amount)

**Convention fr-CA :**
```
N NNN,NN $
```

- Espace (insecable `\u00A0`) pour les milliers
- Virgule pour les decimales
- Toujours 2 decimales
- Dollar apres avec espace insecable
- Signe negatif devant le nombre : `-125,00 $`
- Zero : `0,00 $`

**Implementation suggeree :**
```typescript
export function formatCAD(amount: number): string {
  return new Intl.NumberFormat('fr-CA', {
    style: 'currency',
    currency: 'CAD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
```

**Variantes :**
- Avec suffixe : `formatCAD(4200) + '/mois'` -> `4 200,00 $/mois`
- Variable : `'~' + formatCAD(800)` -> `~800,00 $`
- Hero header : meme format, le monument est dans la taille de police, pas dans le format

**Pages impactees :** Toutes (Depenses, Revenus, Patrimoine, Params/charges, Params/revenus, Accueil)

---

## DESIGN-005 -- Breadcrumbs

### Composant : Breadcrumb

**Specs :**
- Font-size : 13px
- Layout : flex, align-items center, gap 6px
- Lien parent : `color: #0F766E`, `font-weight: 600`, `text-decoration: none`
- Separateur : `>`, `color: #CBD5E1` (slate-300)
- Page courante : `color: #64748B` (slate-500), `font-weight: 500`
- Position : au-dessus du hero header, `padding: 16px 20px` (mobile), interieur du content area (desktop)

**Pages a ajouter :**
| Page | Breadcrumb |
|------|-----------|
| Sections | `Reglages > Mes sections` |
| Cartes | `Reglages > Mes cartes` |

**Navigation :** Le lien `Reglages` redirige vers `/settings`.

### Responsive
- Desktop : visible dans le content area, a gauche
- Mobile : visible au-dessus du hero, pleine largeur, padding 16px 20px

---

## DESIGN-006 -- Badges de statut

### Composant : StatusBadge

**Specs communes :**
- Forme : pill (`border-radius: 100px`)
- Padding : `3px 10px`
- Font-size : `11px`
- Font-weight : `600`
- Letter-spacing : `0.01em`
- Capitalisation : premiere lettre majuscule, reste en minuscules

**Palette semantique :**
| Couleur | Background | Text | Semantique | Exemples |
|---------|-----------|------|-----------|----------|
| Vert | `#ECFDF5` | `#059669` | Actif, complete, permanent | Paye, Recu, Permanent, Auto, Emploi, Business |
| Gris | `#F1F5F9` | `#64748B` | En attente, planifie | Prevu, Attendu, Mensuel, Projet |
| Orange | `#FEF3C7` | `#92400E` | Temporaire, variable | Ponctuel, Variable |
| Rouge | `#FEF2F2` | `#DC2626` | Alerte, dette | Dette |

**Labels standardises :**
| Avant | Apres |
|-------|-------|
| `PREVU` | `Prevu` |
| `PAYE` | `Paye` |
| `Attendu` | `Attendu` (deja OK) |
| `Recu` | `Recu` (deja OK) |
| `PERMANENT` | `Permanent` |
| `PROJET` | `Projet` |
| `DETTE` | `Dette` |
| `auto` | `Auto` |
| `Ponctuel` | `Ponctuel` (deja OK) |
| `Mensuel` | `Mensuel` (deja OK) |
| `Depot auto` | `Depot auto` (deja OK) |
| `Variable` | `Variable` (deja OK) |
| `EMPLOI` | `Emploi` |
| `BUSINESS` | `Business` |

**Etats :**
| Etat | Comportement |
|------|-------------|
| Default | Comme decrit |
| Texte long | Le badge s'etend horizontalement, `white-space: nowrap` |
| Multiples badges | `display: inline-flex`, `gap: 6px` entre badges |
| Mobile | Meme specs, pas de changement |

---

## Integration Instructions

### Ordre recommande
1. **DESIGN-004** (formatCAD) -- helper centralise, zero risque visuel, debloque la coherence des montants
2. **DESIGN-003** (section headers) -- petit changement CSS/composant, gros impact visuel
3. **DESIGN-006** (badges) -- composant StatusBadge reutilisable, applique partout
4. **DESIGN-001** (boutons/FAB) -- changement de layout, tester le responsive
5. **DESIGN-005** (breadcrumbs) -- XS, composant simple
6. **DESIGN-002** (cards Patrimoine) -- changement le plus structurel, tester la regression

### Composants reutilisables a creer/modifier
- `SectionHeader` -- label vert + compteur + bouton filled (si action)
- `StatusBadge` -- badge pill semantique
- `Breadcrumb` -- navigation hierarchique
- `GroupedContainer` / `GroupedRow` -- conteneur avec separateurs (si pas deja existant)
- `formatCAD()` -- helper de formatage monetaire

### Points de vigilance
- Le FAB ne doit jamais apparaitre sur desktop (>= 768px)
- Le FAB ne doit pas chevaucher la barre du guide de configuration
- Les montants dans les hero headers gardent le meme format que le reste
- Les compteurs dans les section headers sont dynamiques
- Le breadcrumb `Reglages` doit etre un vrai lien vers `/settings`
