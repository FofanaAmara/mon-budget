# Feature Integration Report — DESIGN-003 : Uniformiser les headers de section

**Date :** 2026-03-07
**Story :** DESIGN-003 (coherence-design epic)
**Integrator :** @design-integrator
**Build :** OK (next build + tsc --noEmit — 0 erreur dans les fichiers touches)

---

## 1. Ce qui a été fait

### Composant cible : SectionLabel

Spec appliquee sur 7 fichiers :
- `font-size: 11px`
- `font-weight: 700`
- `letter-spacing: 0.08em`
- `text-transform: uppercase`
- `color: var(--teal-700)` (`#0F766E`)
- Format `LABEL (N)` avec N = longueur dynamique de la liste

---

## 2. Fichiers modifies

| Fichier | Changement | Compteur |
|---------|-----------|---------|
| `components/depenses/StatusGroupSection.tsx` | `slate-400` → `teal-700` ; 12px → 11px | `items.length` (deja present) |
| `components/SectionsClient.tsx` | `text-tertiary` → `teal-700` ; 12px → 11px ; 0.1em → 0.08em ; ajout `(N)` | `sections.length` |
| `components/CartesClient.tsx` | `text-tertiary` → `teal-700` ; 12px → 11px ; 0.1em → 0.08em ; ajout `(N)` | `initial.length` |
| `components/IncomeTemplateManager.tsx` | `slate-400` → `teal-700` ; 12px → 11px ; 0.1em → 0.08em ; label uppercase ; ajout `(N)` | `incomes.length` |
| `components/ExpenseTemplateManager.tsx` | `text-tertiary` → `teal-700` ; 12px → 11px ; 0.1em → 0.08em ; label uppercase ; ajout `(N)` | `templateExpenses.length` |
| `components/projets/EpargneSection.tsx` | Couleur deja teal-700 ; 13px → 11px ; ajout `(N)` | `1 + projets.length` |
| `components/projets/DettesSection.tsx` | `error` → `teal-700` ; 13px → 11px ; ajout `(N)` | `debts.length` |

---

## 3. Compteurs dynamiques

Tous les compteurs sont derives directement de la prop/variable de la liste affichee.
Ils se mettent a jour naturellement apres toute operation (ajout/suppression) qui declenche un `router.refresh()`.

| Page | Expression du compteur | Cas zero |
|------|----------------------|----------|
| Depenses (A VENIR, PAYE) | `items.length` par groupe | Affiche `(0)` |
| Sections | `sections.length` | Affiche `(0)` |
| Cartes | `initial.length` | Affiche `(0)` |
| Params/revenus | `incomes.length` | Affiche `(0)` |
| Params/charges | `templateExpenses.length` | Affiche `(0)` |
| Patrimoine — Epargne | `1 + projets.length` | `(1)` minimum (epargne libre est permanente) |
| Patrimoine — Dettes | `debts.length` | Affiche `(0)` |

---

## 4. Decision notable : DettesSection

Le label "Dettes" etait en `var(--error)` (rouge). La spec DESIGN-003 dit "toujours vert, jamais gris" pour le SectionLabel.

**Choix :** Changement effectue vers `teal-700`.

**Raisonnement :** La semantique "dette = danger" est portee par :
- Les montants en rouge dans les `DebtCard`
- Le badge "Dette" (rouge, DESIGN-006)
- Le total "Dettes" en rouge dans `PatrimoineMonument`

Le label de section n'a pas a porter cette semantique — il categorise, pas il alerte. L'uniformite visuelle des SectionLabel est plus importante que la couleur semantique du label.

---

## 5. Hors scope (remis a d'autres stories)

- Style des boutons dans les section headers (outlined → filled) : **DESIGN-001**
- `DettesSection` bouton reste outlined red : **DESIGN-001**
- `EpargneSection` bouton reste outlined teal : **DESIGN-001**

---

## 6. Screenshots

Tous les screenshots post-integration dans `.tmp/screenshots/after-design-003/` :
- `depenses-desktop.png` — A VENIR (9) et PAYE (6) en teal
- `sections-desktop.png` — LISTE (6) en teal
- `cartes-desktop.png` — MES CARTES (2) en teal
- `projets-desktop.png` — EPARGNE (4) et DETTES (2) en teal
- `params-revenus-desktop.png` — MES REVENUS RECURRENTS (2) en teal
- `params-charges-desktop.png` — MODELES RECURRENTS (14) en teal

---

## 7. Known gaps pour le developpeur

Aucun. DESIGN-003 est uniquement display (couleur CSS + texte dynamique). Aucune logique metier, aucune API, aucun state a connecter.
