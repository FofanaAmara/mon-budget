# Architecture — Mes Finances

## Stack

| Composant | Technologie | Version |
|-----------|-------------|---------|
| Framework | Next.js (App Router) | 16.1.6 |
| Frontend | React + Tailwind CSS v4 | React 19.2.3 |
| Base de donnees | Neon PostgreSQL (serverless) | @neondatabase/serverless 1.x |
| Authentification | Neon Auth (@neondatabase/auth) | 0.2.0-beta |
| Hebergement | Vercel (plan gratuit) | — |
| PWA | Service Worker custom + manifest.json | — |
| Notifications | Web Push (web-push) | 3.6.x |
| Tests E2E | Playwright | 1.58.x |

## Contrainte budgetaire

0$ — l'ensemble de l'infrastructure fonctionne sur les plans gratuits de Vercel et Neon.

## Structure du projet

```
app/                          # Next.js App Router
├── page.tsx                  # Accueil (dashboard)
├── layout.tsx                # Layout principal + providers
├── providers.tsx             # Context providers
├── landing/page.tsx          # Landing page publique
├── auth/[path]/page.tsx      # Auth (login/signup) via Neon Auth
├── account/[path]/page.tsx   # Account management
├── depenses/                 # Suivi des depenses
│   ├── page.tsx
│   └── [id]/edit/page.tsx
├── revenus/page.tsx          # Suivi des revenus
├── projets/page.tsx          # Patrimoine (epargne + dettes)
├── cartes/                   # Cartes bancaires
│   ├── page.tsx
│   └── [id]/page.tsx
├── sections/page.tsx         # Gestion des sections
├── parametres/               # Reglages
│   ├── page.tsx              # Hub parametres
│   ├── charges/page.tsx      # Templates charges fixes
│   ├── revenus/page.tsx      # Templates revenus
│   ├── allocation/page.tsx   # Allocation des revenus
│   ├── devise/page.tsx       # Devise
│   ├── rappels/page.tsx      # Rappels
│   └── notifications/page.tsx
└── api/
    ├── auth/[...path]/route.ts  # Neon Auth proxy
    └── push/
        ├── subscribe/route.ts   # Web Push subscription
        └── send/route.ts        # Web Push send

components/                   # Composants React
├── AccueilClient.tsx         # Dashboard client
├── DepensesTrackingClient.tsx # Suivi depenses
├── RevenusTrackingClient.tsx  # Suivi revenus
├── ExpenseModal.tsx          # Modal creation/edition charge
├── IncomeModal.tsx           # Modal creation/edition revenu
├── LayoutShell.tsx           # Shell avec sidebar/bottom nav
├── BottomNav.tsx             # Navigation mobile
├── MonthNavigator.tsx        # Navigation par mois
├── Onboarding.tsx            # Onboarding wizard
├── accueil/                  # Onglets dashboard
│   ├── TabTableauDeBord.tsx
│   ├── TabTimeline.tsx
│   └── TabSanteFinanciere.tsx
├── parametres/               # Clients parametres
│   ├── DeviseClient.tsx
│   ├── RappelsClient.tsx
│   └── NotificationsClient.tsx
└── landing/
    └── ScrollReveal.tsx

lib/                          # Logique metier
├── db.ts                     # Connexion Neon
├── types.ts                  # Types TypeScript
├── constants.ts              # Constantes
├── utils.ts                  # Utilitaires
├── month-utils.ts            # Helpers dates/mois
├── auth/
│   ├── server.ts             # Auth cote serveur
│   ├── client.ts             # Auth cote client
│   └── helpers.ts            # Helpers auth
└── actions/                  # Server Actions
    ├── expenses.ts           # CRUD charges + summaries
    ├── monthly-expenses.ts   # Generation + suivi mensuel
    ├── incomes.ts            # CRUD revenus + summaries
    ├── monthly-incomes.ts    # Generation + suivi mensuel
    ├── sections.ts           # CRUD sections
    ├── cards.ts              # CRUD cartes
    ├── settings.ts           # CRUD settings
    ├── allocations.ts        # Allocations revenus
    ├── debts.ts              # CRUD dettes
    ├── debt-transactions.ts  # Transactions dettes
    ├── onboarding.ts         # Onboarding wizard
    ├── claim.ts              # Migration donnees anonymes
    └── demo-data.ts          # Seed demo

scripts/                      # Migrations manuelles
├── migrate.mjs               # Schema initial
├── migrate-phase1-complement.js
├── migrate-phase2.mjs
├── migrate-auth.mjs
├── migrate-allocations.mjs
├── migrate-debts.mjs
├── migrate-debt-transactions.mjs
└── ... (15 scripts au total)
```

## Patterns architecturaux

### Server Actions (pas d'API REST)
Toute la logique metier passe par des **Server Actions** Next.js dans `lib/actions/`. Pas de routes API REST pour le CRUD — seules les routes `/api/push/*` et `/api/auth/*` utilisent des Route Handlers (pour les contraintes techniques de Web Push et Neon Auth).

### Template vs Transaction
Le coeur du systeme repose sur la separation :
- **Template** (`expenses`, `incomes`) : definition recurrente
- **Transaction** (`monthly_expenses`, `monthly_incomes`) : instance mensuelle generee automatiquement

### Design System
CSS variables custom (pas de librairie UI tierce). Composants styles directement avec Tailwind v4 + variables CSS pour la coherence.

### Navigation
- Desktop : sidebar fixe (240px)
- Mobile : bottom navigation (56px) avec 5 onglets

### Multi-utilisateur
Chaque table a un `user_id` filtre par l'auth Neon. Pas de RLS Postgres (le filtrage se fait cote serveur action).
