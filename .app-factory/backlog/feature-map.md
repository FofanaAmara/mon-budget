# Feature Map — Mes Finances

> Generated: 2026-03-04
> Source: App Discovery (codebase reverse-engineering)
> Status: All features EXISTING (implemented in current codebase)

---

## Summary

- **18 features** identified from **21 routes** (18 pages + 3 API endpoints)
- **6 epics** (user goal groupings)
- **164 stories** (skeleton level, to be refined by PM)
- **0 tests** — no automated test coverage

---

## Dependency Graph

```
Authentification (foundation)
  |
  +---> Onboarding ---> Tableau de bord
  |                       |
  +---> Data Claim        +---> Suivi depenses <--- Charges fixes
  |                       |                          |
  |                       +---> Suivi revenus <--- Revenus recurrents
  |                       |       |
  |                       |       +---> Allocation revenus ---> Gestion sections
  |                       |
  |                       +---> Sante financiere
  |                       |
  |                       +---> Epargne projets
  |                       |
  |                       +---> Gestion dettes ---> Suivi depenses (debt payments)
  |
  +---> Gestion cartes ---> Charges fixes (auto-debit card)
  |
  +---> Gestion sections ---> Charges fixes, Allocation revenus
  |
  +---> Parametres (hub)
  |
  +---> Push notifications <--- PWA (Service Worker)
                                 |
Landing page (standalone)        +--- Charges fixes (reminder_offsets)
```

### Dependency Legend

| Feature | Depends on | Used by |
|---------|-----------|---------|
| Authentification | - | Toutes les features |
| Landing page | - | Authentification (CTA -> sign-up) |
| Onboarding | Authentification, Gestion sections | Tableau de bord |
| Data Claim | Authentification | - |
| Gestion sections | Authentification | Charges fixes, Allocation revenus, Onboarding |
| Gestion cartes | Authentification | Charges fixes (auto-debit card) |
| Charges fixes | Authentification, Gestion sections, Gestion cartes | Suivi depenses, Push notifications |
| Revenus recurrents | Authentification | Suivi revenus |
| Suivi depenses | Authentification, Charges fixes | Tableau de bord, Sante financiere |
| Suivi revenus | Authentification, Revenus recurrents | Tableau de bord, Allocation revenus, Sante financiere |
| Allocation revenus | Authentification, Suivi revenus, Gestion sections | Tableau de bord |
| Epargne projets | Authentification | Tableau de bord, Sante financiere |
| Gestion dettes | Authentification | Suivi depenses (debt payments), Tableau de bord, Sante financiere |
| Sante financiere | Suivi depenses, Suivi revenus, Epargne projets, Gestion dettes | Tableau de bord |
| Tableau de bord | Suivi depenses, Suivi revenus, Epargne projets, Gestion dettes, Sante financiere | - |
| Parametres | Authentification | - |
| Push notifications | PWA (SW), Charges fixes (reminder_offsets) | - |
| PWA | - | Push notifications |

---

## Execution Order (suggested implementation tiers)

### Tier 0 — Fondation (no dependencies)
| # | Feature | Epic | Reason |
|---|---------|------|--------|
| 1 | Authentification | onboarding-auth | Foundation for all features |
| 2 | PWA | pwa | Service Worker needed by notifications |
| 3 | Landing page | onboarding-auth | Standalone marketing page |

### Tier 1 — Configuration (depends on Tier 0)
| # | Feature | Epic | Reason |
|---|---------|------|--------|
| 4 | Gestion sections | configuration | Structural: categories used everywhere |
| 5 | Gestion cartes | configuration | Payment cards, used by charges |
| 6 | Parametres | configuration | Settings hub, low coupling |

### Tier 2 — Templates (depends on Tier 1)
| # | Feature | Epic | Reason |
|---|---------|------|--------|
| 7 | Charges fixes | configuration | Expense templates, feeds monthly tracking |
| 8 | Revenus recurrents | configuration | Income templates, feeds monthly tracking |
| 9 | Onboarding | onboarding-auth | Creates sections + income, needs Tier 1 |
| 10 | Data Claim | onboarding-auth | Migration helper, needs auth |

### Tier 3 — Core Tracking (depends on Tier 2)
| # | Feature | Epic | Reason |
|---|---------|------|--------|
| 11 | Suivi depenses | core-financier | Monthly expense tracking |
| 12 | Suivi revenus | core-financier | Monthly income tracking |
| 13 | Gestion dettes | patrimoine | Debt tracking, feeds expenses |
| 14 | Epargne projets | patrimoine | Savings tracking |

### Tier 4 — Derived / Aggregation (depends on Tier 3)
| # | Feature | Epic | Reason |
|---|---------|------|--------|
| 15 | Allocation revenus | core-financier | Envelope budgeting, needs income data |
| 16 | Sante financiere | patrimoine | Aggregates all financial data |
| 17 | Tableau de bord | core-financier | Dashboard, aggregates everything |
| 18 | Push notifications | notifications | Needs SW + expense templates |

---

## Feature Inventory

### Epic: core-financier (4 features, 52 stories)

| Feature | Pages | Stories | Status | Brief |
|---------|-------|---------|--------|-------|
| Tableau de bord | `/` (3 tabs) | 12 | existing | `epics/core-financier/features/tableau-de-bord/` |
| Suivi depenses | `/depenses` | 15 | existing | `epics/core-financier/features/suivi-depenses/` |
| Suivi revenus | `/revenus` (2 tabs) | 14 | existing | `epics/core-financier/features/suivi-revenus/` |
| Allocation revenus | `/revenus` (tab 2) | 11 | existing | `epics/core-financier/features/allocation-revenus/` |

### Epic: patrimoine (3 features, 28 stories)

| Feature | Pages | Stories | Status | Brief |
|---------|-------|---------|--------|-------|
| Epargne projets | `/projets` (tab 1) | 12 | existing | `epics/patrimoine/features/epargne-projets/` |
| Gestion dettes | `/projets` (tab 2) | 10 | existing | `epics/patrimoine/features/gestion-dettes/` |
| Sante financiere | `/` (tab 3) | 6 | existing | `epics/patrimoine/features/sante-financiere/` |

### Epic: configuration (5 features, 39 stories)

| Feature | Pages | Stories | Status | Brief |
|---------|-------|---------|--------|-------|
| Charges fixes | `/parametres/depenses` | 9 | existing | `epics/configuration/features/charges-fixes/` |
| Revenus recurrents | `/parametres/revenus` | 8 | existing | `epics/configuration/features/revenus-recurrents/` |
| Gestion cartes | `/parametres/cartes`, `/parametres/cartes/[id]` | 9 | existing | `epics/configuration/features/gestion-cartes/` |
| Gestion sections | `/parametres/sections` | 5 | existing | `epics/configuration/features/gestion-sections/` |
| Parametres | `/parametres` | 8 | existing | `epics/configuration/features/parametres/` |

### Epic: onboarding-auth (4 features, 32 stories)

| Feature | Pages | Stories | Status | Brief |
|---------|-------|---------|--------|-------|
| Landing page | `/landing` | 7 | existing | `epics/onboarding-auth/features/landing-page/` |
| Authentification | `/auth/*`, `/account/*`, `/api/auth/*` | 8 | existing | `epics/onboarding-auth/features/authentification/` |
| Onboarding | `/` (overlay) | 12 | existing | `epics/onboarding-auth/features/onboarding/` |
| Data Claim | `/` (banner) | 5 | existing | `epics/onboarding-auth/features/data-claim/` |

### Epic: notifications (1 feature, 7 stories)

| Feature | Pages | Stories | Status | Brief |
|---------|-------|---------|--------|-------|
| Push notifications | `/api/push/*` | 7 | existing | `epics/notifications/features/push-notifications/` |

### Epic: pwa (1 feature, 6 stories)

| Feature | Pages | Stories | Status | Brief |
|---------|-------|---------|--------|-------|
| PWA | - (manifest, SW) | 6 | existing | `epics/pwa/features/pwa-install/` |

---

## Notes

### Screenshots
No screenshots captured during this discovery. Playwright was not used for visual capture. Screenshots should be added during audit phase.

### Confidence Level
**HIGH** — Discovery performed from full codebase access. All routes, components, server actions, and DB schemas were read directly.

### Known Gaps (to investigate during audit)
1. **No tests** — 0 test files found across the entire codebase.
2. **No CI/CD** — No GitHub Actions or deployment pipeline config found.
3. **Offline support** — SW registered but no cache strategy for pages.
4. **Biweekly calculation** — Multiplier 2.17 used in onboarding vs 26/12=2.1667 in monthly generation. Potential inconsistency.
5. **Section management** — No delete cascade protection visible (what happens to expenses if section deleted?).
6. **Error handling** — Server actions use try/catch but error UX not audited.
