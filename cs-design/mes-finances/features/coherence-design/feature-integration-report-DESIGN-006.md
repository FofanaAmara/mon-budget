# Feature Integration Report — DESIGN-006: Uniformiser les badges de statut

**Date**: 2026-03-07
**Story**: DESIGN-006
**Feature**: coherence-design
**Integrator**: design-integrator

---

## 1. Fichiers crees/modifies

| Fichier | Action | Description |
|---------|--------|-------------|
| `components/StatusBadge.tsx` | Cree | Composant reutilisable pill badge |
| `lib/expense-display-utils.ts` | Modifie | Palette semantique mise a jour (BADGE_STYLES + getStatusBadge) |
| `components/ExpenseTrackingRow.tsx` | Modifie | Badges Paye/Prevu via StatusBadge |
| `components/accueil/TabTimeline.tsx` | Modifie | Badges Recu/Paye/Attendu/Prevu via StatusBadge |
| `components/IncomeTrackingRow.tsx` | Modifie | Badges Recu/Attendu/Variable/Auto via StatusBadge |
| `components/ExpenseTemplateManager.tsx` | Modifie | Badges Mensuel/Auto/Ponctuel via StatusBadge |
| `components/IncomeTemplateManager.tsx` | Modifie | Badges Emploi/Business/Depot auto/Variable via StatusBadge |
| `components/projets/SavingsProjectCard.tsx` | Modifie | Badges Permanent/Projet/Pot libre via StatusBadge |
| `components/projets/DebtCard.tsx` | Modifie | Badge Dette via StatusBadge (danger) |

---

## 2. Architecture du composant StatusBadge

### Props
```tsx
type StatusBadgeVariant = 'success' | 'neutral' | 'warning' | 'danger';

type Props = {
  label: string;
  variant: StatusBadgeVariant;
  icon?: React.ReactNode;  // optionnel — leading element
};
```

### Palette semantique
| Variant | Background | Text | Exemples |
|---------|-----------|------|----------|
| `success` | `#ECFDF5` | `#059669` | Paye, Recu, Permanent, Auto, Emploi, Business, Depot auto |
| `neutral` | `#F1F5F9` | `#64748B` | Prevu, Attendu, Mensuel, Projet, Pot libre |
| `warning` | `#FEF3C7` | `#92400E` | Ponctuel, Variable |
| `danger` | `#FEF2F2` | `#DC2626` | Dette |

### Specs visuelles
- `border-radius: 100px` (pill)
- `padding: 3px 10px`
- `font-size: 11px`
- `font-weight: 600`
- `letter-spacing: 0.01em`
- `white-space: nowrap`
- Capitalisation : premiere lettre majuscule, reste en minuscules

---

## 3. Mapping avant/apres

| Badge | Avant | Apres | Variant |
|-------|-------|-------|---------|
| Depenses status | PREVU, PAYE (uppercase, borderRadius:4px, padding:2px 8px) | Prevu, Paye (pill) | neutral, success |
| Timeline status | PREVU, PAYE, RECU, ATTENDU (uppercase, borderRadius:4px) | Prevu, Paye, Recu, Attendu (pill) | neutral, success |
| Revenus status | Recu, Attendu (padding:1px 6px, borderRadius:999px) | Recu, Attendu (pill spec conforme) | success, neutral |
| Auto (income tracking) | `AUTO` texte uppercase sans badge | `Auto` pill | success |
| Variable (IncomeTrackingRow) | padding:1px 6px, surface-sunken | pill warning | warning |
| Mensuel/Hebdo/etc. (charges) | surface-sunken, borderRadius:100px (OK) | StatusBadge neutral | neutral |
| auto (charges) | positive-subtle, `auto` lowercase | `Auto` pill success | success |
| Ponctuel (charges) | amber-subtle, borderRadius:100px (OK) | StatusBadge warning | warning |
| Depot auto (revenus recurrents) | teal-50, border | StatusBadge success | success |
| Variable (revenus recurrents) | warning-light, border | StatusBadge warning | warning |
| Emploi/Business (revenus recurrents) | uppercase text slate-400, pas de badge | StatusBadge success | success |
| Permanent (patrimoine) | uppercase, teal-50, padding:2px 7px | StatusBadge success (pill spec) | success |
| Projet/Pot libre (patrimoine) | uppercase text slate-400 | StatusBadge neutral | neutral |
| Dette (DebtCard sans section) | uppercase text slate-400 | StatusBadge danger | danger |

---

## 4. Decisions d'integration

| Decision | Choix | Raison |
|----------|-------|--------|
| Composant reutilisable vs inline | StatusBadge cree | 9 endroits avec badges, le composant elimine la duplication et garantit la coherence |
| Source type (Emploi/Business) comme badge | StatusBadge success | Le handoff liste ces labels dans la palette success — ce sont des labels de type de revenu actif |
| "Projet"/"Pot libre" comme badge | StatusBadge neutral | Le handoff inclut "Projet" dans le tableau des badges |
| lib/expense-display-utils BADGE_STYLES | Couleurs hardcodees (#ECFDF5, #F1F5F9) | Les CSS vars existantes (--positive-subtle, --surface-sunken) ne correspondent pas exactement aux specs du handoff |
| "Imprévu" badge (ExpenseTrackingRow) | StatusBadge warning | Badge existant non dans le handoff mais semantiquement warning (ponctuel/imprévu) |

---

## 5. Ecarts mockup -> code

| Ecart | Explication |
|-------|-------------|
| Labels "Recu"/"Prevu" conserves en francais avec accents | Le handoff semble omettre les accents (casse Unicode) — les vrais labels dans l'app ont des accents et restent corrects |
| Badge "En retard" non specifie dans le handoff | Conserve avec `danger` variant (cohérent avec rouge) |
| Badge "Reporté"/"En cours" non specifie | Conserve avec `warning` / `success` respectivement |

---

## 6. Known gaps (pour le developpeur)

Rien a connecter. Ce changement est purement visuel — aucune logique metier n'a ete touchee. Les statuts DB (PAID, UPCOMING, RECEIVED, etc.) restent inchanges. Seul l'affichage est modifie.

---

## 7. Screenshots apres integration

- `.tmp/screenshots/design-006/after/depenses-mobile.png`
- `.tmp/screenshots/design-006/after/revenus-mobile.png`
- `.tmp/screenshots/design-006/after/patrimoine-v2-mobile.png`
- `.tmp/screenshots/design-006/after/params-charges-mobile.png`
- `.tmp/screenshots/design-006/after/params-revenus-mobile.png`
