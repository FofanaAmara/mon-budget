# Phase 1 — Scan technique

Date: 2026-03-04

## Stack detecte

| Composant | Technologie | Version |
|-----------|-------------|---------|
| Framework | Next.js (App Router) | 16.1.6 |
| Frontend | React + Tailwind CSS v4 | React 19.2.3 |
| DB | Neon PostgreSQL (serverless) | @neondatabase/serverless 1.x |
| Auth | Neon Auth | @neondatabase/auth 0.2.0-beta |
| Hosting | Vercel (free) | — |
| PWA | Service Worker + manifest.json | — |
| Push | web-push | 3.6.x |
| E2E | Playwright (installed, 0 tests) | 1.58.x |

## Routes identifiees (13)

| Route | Type | Composant client |
|-------|------|-----------------|
| `/` | Page | AccueilClient (3 onglets: Dashboard, Timeline, Sante) |
| `/landing` | Page | Landing publique |
| `/auth/[path]` | Page | Login/Signup (Neon Auth) |
| `/account/[path]` | Page | Account management |
| `/depenses` | Page | DepensesTrackingClient |
| `/depenses/[id]/edit` | Page | EditExpenseClient |
| `/revenus` | Page | RevenusTrackingClient |
| `/projets` | Page | ProjetsEpargneClient (Actifs + Passifs) |
| `/cartes` | Page | CartesClient |
| `/cartes/[id]` | Page | CarteDetailClient |
| `/sections` | Page | SectionsClient |
| `/parametres` | Page | ParametresClient (hub) |
| `/parametres/charges` | Page | ExpenseTemplateManager |
| `/parametres/revenus` | Page | IncomeTemplateManager |
| `/parametres/allocation` | Page | AllocationsManager |
| `/parametres/devise` | Page | DeviseClient |
| `/parametres/rappels` | Page | RappelsClient |
| `/parametres/notifications` | Page | NotificationsClient |

## API Endpoints (3)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/[...path]` | ALL | Proxy Neon Auth |
| `/api/push/subscribe` | POST | Web Push subscription |
| `/api/push/send` | POST | Send push notification |

## Server Actions (12 fichiers)

| Fichier | Actions principales |
|---------|-------------------|
| expenses.ts | CRUD charges + summaries |
| monthly-expenses.ts | Generation mensuelle + suivi |
| incomes.ts | CRUD revenus + summaries |
| monthly-incomes.ts | Generation mensuelle + suivi |
| sections.ts | CRUD sections |
| cards.ts | CRUD cartes |
| settings.ts | CRUD settings |
| allocations.ts | Allocations revenus |
| debts.ts | CRUD dettes |
| debt-transactions.ts | Transactions dettes |
| onboarding.ts | Wizard setup |
| claim.ts | Migration donnees anonymes |
| demo-data.ts | Seed demo |

## Composants (42)

42 composants dans `components/` dont:
- 3 onglets dashboard (TabTableauDeBord, TabTimeline, TabSanteFinanciere)
- 8 modals (Expense, Income, Adhoc*, Project, Savings, Debt, Allocation, Transfer)
- 5 clients de pages (Depenses, Revenus, Projets, Cartes, Parametres)
- Navigation (LayoutShell, BottomNav, MonthNavigator, Breadcrumb)
- Auth (SignOutButton, ClaimBanner, Onboarding)
- PWA (ServiceWorkerInit, NotificationPermission)

## Schema DB (10+ entites)

| Table | Description |
|-------|-------------|
| sections | Categories de depenses |
| cards | Cartes bancaires |
| expenses | Templates charges |
| monthly_expenses | Instances mensuelles depenses |
| incomes | Templates revenus |
| monthly_incomes | Instances mensuelles revenus |
| debts | Dettes/prets |
| debt_transactions | Paiements/charges dettes |
| income_allocations | Allocation revenus |
| monthly_allocations | Instances mensuelles allocations |
| savings_contributions | Contributions epargne |
| settings | Preferences utilisateur |
| push_subscriptions | Abonnements push |
| notification_log | Log notifications |

## Migrations (15 scripts)

Scripts manuels dans `scripts/migrate-*.mjs`. Pas d'outil de migration.

## Tests

0 tests. Playwright installe mais aucun fichier de test.

## CI/CD

Aucun. Pas de `.github/workflows/`. Deploy par push direct sur main.

## Gaps identifies

1. Schema DB desynchronise (supabase/schema.sql = MVP initial seulement)
2. 0 tests automatises
3. 0 CI/CD
4. Pas de validation d'input cote serveur (server actions)
5. Pas de gestion d'erreurs structuree
