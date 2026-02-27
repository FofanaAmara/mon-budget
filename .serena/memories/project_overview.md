# Mon Budget — Project Overview

## Purpose
Personal budget tracking PWA (Progressive Web App). Single-user, no authentication. Tracks monthly expenses, incomes, planned projects/savings, and provides financial health overview.

## Tech Stack
- **Framework**: Next.js 16 (App Router) with React 19
- **Database**: Neon PostgreSQL (serverless, @neondatabase/serverless)
- **Hosting**: Vercel
- **Styling**: Inline styles + CSS variables (NOT Tailwind classes despite Tailwind being in devDeps)
- **Language**: TypeScript
- **PWA**: Service worker with web-push notifications

## Key Architecture
- `app/` — Next.js App Router pages (Server Components by default)
- `components/` — Client Components (interactive UI, marked 'use client')
- `lib/actions/` — Server Actions ('use server') for DB operations
- `lib/types.ts` — All TypeScript types
- `lib/utils.ts` — Utility functions (formatCAD, daysUntil, etc.)
- `lib/db.ts` — Database connection (Neon SQL tagged template)

## Data Model (Two-tier)
- **Templates**: `expenses` table (recurring defs), `incomes` table (income sources)
- **Monthly Instances**: `monthly_expenses` table, `monthly_incomes` table
- Templates generate monthly instances via `generateMonthlyExpenses(month)` / `generateMonthlyIncomes(month)`
- Expense types: RECURRING, ONE_TIME, PLANNED
- Monthly expense statuses: UPCOMING, PAID, OVERDUE, DEFERRED
- Monthly income statuses: EXPECTED, RECEIVED, PARTIAL, MISSED

## Current Routes (pre-restructure)
/, /depenses, /mon-mois, /revenus, /cash-flow, /projets, /parametres, /cartes, /sections

## Active Restructure
Major UX restructure in progress — see `plan-restructuration-ux.md` and `ralph-restructuration-ux.md`
