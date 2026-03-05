# Mes Finances

PWA de gestion financiere personnelle en francais (fr-CA). Suivi des depenses, revenus, epargne et dettes avec un budget mensuel automatise.

**Production** : [mesfinances.app](https://www.mesfinances.app)
**Maturite** : Alpha (usage personnel)

## Stack

- Next.js 16 (App Router) + React 19
- Tailwind CSS v4
- Neon PostgreSQL (serverless) + Neon Auth
- Vercel (plan gratuit)
- Web Push notifications
- PWA (Service Worker)

## Prerequisites

- Node.js 20+
- npm
- Un compte [Neon](https://neon.tech) (plan gratuit)
- Un compte [Vercel](https://vercel.com) (plan gratuit)

## Setup

```bash
git clone <repo-url>
cd mon-budget

# Copier le fichier d'environnement et remplir les valeurs
cp .env.example .env.local

# Installer les dependances
npm install

# Lancer le serveur de developpement
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

## Variables d'environnement

Voir `.env.example` pour la liste complete. Documentation detaillee dans [.app-factory/docs/infrastructure/env-vars.md](.app-factory/docs/infrastructure/env-vars.md).

## Documentation

La documentation detaillee du projet se trouve dans `.app-factory/docs/` :

- [Overview](.app-factory/docs/overview.md) -- Vue d'ensemble du projet
- [Architecture](.app-factory/docs/architecture.md) -- Stack, structure, patterns
- [Data Model](.app-factory/docs/data-model.md) -- Schema de la base de donnees
- [API Reference](.app-factory/docs/api-reference.md) -- Endpoints et Server Actions
- [Vision](.app-factory/docs/vision.md) -- Roadmap et direction produit
