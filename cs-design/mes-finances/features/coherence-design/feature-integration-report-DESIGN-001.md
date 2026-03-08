# Feature Integration Report — DESIGN-001
## Uniformiser les boutons d'ajout et le FAB mobile

**Date :** 2026-03-07
**Story :** DESIGN-001 (coherence-design)
**Integrator :** @design-integrator
**Build status :** OK

---

## 1. Ce qui a ete fait

### Fichiers modifies

| Fichier | Changement |
|---------|-----------|
| `components/projets/EpargneSection.tsx` | Bouton "Nouveau projet" : outlined teal → filled teal |
| `components/projets/DettesSection.tsx` | Bouton "Nouvelle dette" : outlined rouge → filled teal |
| `components/SectionsClient.tsx` | FAB mobile : pill avec texte → FAB rond 52x52 |
| `components/CartesClient.tsx` | FAB mobile : pill avec texte → FAB rond 52x52 |
| `components/revenus/IncomeTrackingTab.tsx` | FAB : classe `fab` → `fab fab-mobile-only`. Bouton desktop : classe custom + `display:none` → `btn-desktop-only` |

### Changements par page

#### Patrimoine (/projets) — Desktop

**Avant :** Bouton "Nouveau projet" outlined (border teal, fond blanc). Bouton "Nouvelle dette" outlined (border rouge, fond blanc).

**Apres :** Les deux boutons sont `filled` : `background: #0F766E`, `color: white`, `border: none`, `padding: 8px 16px`, `border-radius: 8px`, `font-size: 13px`, `font-weight: 600`. La classe `btn-desktop-only` est conservee — les boutons restent invisibles sur mobile.

**Mobile :** Inchange (les boutons header sont masques par `btn-desktop-only`). Le ProjetsFab existant gere l'ajout mobile sur cette page.

#### Sections (/sections) — Mobile

**Avant :** FAB en forme de pill (`border-radius: 100px`, `height: 52px`, `padding: 0 20px`, texte "Nouvelle section" + icone).

**Apres :** FAB rond (`width: 52px`, `height: 52px`, `border-radius: 50%`, icone + seule). La classe `.fab` gere le fond, la couleur, la position, le z-index et le shadow. Le positionnement `bottom` provient du CSS `.fab` (`max(72px, calc(56px + var(--safe-bottom)))`) pour rester au-dessus du BottomNav.

**Desktop :** Inchange — la classe `fab-mobile-only` masque deja le FAB. Le bouton desktop "Nouvelle section" (deja filled) reste visible.

#### Cartes (/cartes) — Mobile

Meme transformation que Sections. FAB pill → FAB rond 52x52.

#### Revenus (/revenus) — Desktop et Mobile

**Avant (desktop) :** Le FAB etait visible sur desktop (class `fab` seule, sans `fab-mobile-only`). Le bouton desktop utilisait `display: none` en style inline + class `desktop-add-income-btn` sans logique CSS.

**Apres (desktop) :** FAB masque via `fab-mobile-only`. Bouton desktop visible via class standard `btn-desktop-only`.

**Apres (mobile) :** FAB toujours visible avec le round style standard. Comportement inchange — `isCurrentMonth` conditionne l'affichage.

---

## 2. Architecture des composants

Aucun nouveau composant cree. Les modifications sont toutes dans les composants existants. Le pattern utilise :

```
CSS globals.css
  .fab               — style, position, shadow (56x56 par defaut)
  .fab-mobile-only   — @media min-width 768px { display: none !important }
  .btn-desktop-only  — display:none / @media 768px { display: inline-flex }

Composants
  EpargneSection     — btn-desktop-only + style inline (filled teal)
  DettesSection      — btn-desktop-only + style inline (filled teal)
  SectionsClient     — fab + fab-mobile-only + style inline (52x52, border-radius 50%)
  CartesClient       — fab + fab-mobile-only + style inline (52x52, border-radius 50%)
  IncomeTrackingTab  — fab + fab-mobile-only / btn-desktop-only
```

---

## 3. Props et handlers preserves

Tous les `onClick` sont inchanges :
- `onCreateProject` (EpargneSection) — identique
- `onCreateDebt` (DettesSection) — identique
- `openCreate` (Sections, Cartes) — identique
- `() => setAdhocModal(true)` (Revenus) — identique

Aucune logique metier touchee.

---

## 4. Donnees statiques / a connecter

Aucune donnee statique introduite. Integration purement CSS/style.

---

## 5. Ecarts entre mockup et code

| Element | Spec handoff | Code | Raison |
|---------|-------------|------|--------|
| FAB size | 52x52 | 52x52 (style inline override CSS .fab 56x56) | Style inline prioritaire sur classe CSS |
| FAB box-shadow | `0 4px 14px rgba(15,118,110,0.35)` | `var(--shadow-fab)` via .fab | La variable CSS existante est equivalente. Pas de divergence visuelle. |
| Dettes button | Spec dit "bouton filled" (ne precise pas la couleur) | Teal (#0F766E) au lieu de rouge | Decision: uniformite CTA > semantique couleur dette. La semantique erreur est portee par badge "Dette" et montant rouge. |
| FAB bottom position | `bottom: 20px` | `max(72px, ...)` via CSS .fab | 20px est trop bas — passe sous le BottomNav. Le CSS existant gere correctement l'espacement. |

---

## 6. Known gaps — Ce que le developpeur doit connecter

Aucun. Ce changement est purement visuel. Aucune logique, API, ni etat a connecter.

---

## 7. Recommendations

- Si la taille du FAB doit etre uniformisee a 52px pour toute l'app (vs 56px actuel dans le CSS), modifier `.fab { width: 52px; height: 52px; }` dans globals.css et supprimer les overrides inline.
- Le bouton "Nouvelle dette" est maintenant teal (non rouge). Si le product owner souhaite le distinguer visuellement, une variante `.btn-danger-filled` pourrait etre ajoutee au design system.

---

## 8. Screenshots

| Page | Desktop | Mobile |
|------|---------|--------|
| Patrimoine | `screenshots/after/patrimoine-desktop.png` | `screenshots/after/patrimoine-mobile.png` |
| Sections | `screenshots/after/sections-desktop.png` | `screenshots/after/sections-mobile.png` |
| Cartes | `screenshots/after/cartes-desktop.png` | `screenshots/after/cartes-mobile.png` |
| Revenus | `screenshots/after/revenus-desktop.png` | `screenshots/after/revenus-mobile.png` |
