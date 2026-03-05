# Etat actuel -- Mes Finances

**Derniere mise a jour** : 2026-03-05
**Maturite** : Alpha (usage personnel)
**URL production** : https://www.mesfinances.app

## Features live

| Feature | Statut | Notes |
|---------|--------|-------|
| Charges fixes (templates) | Stable | CRUD complet, frequences multiples (mensuel, bimensuel, hebdomadaire, etc.) |
| Suivi mensuel des depenses | Stable | Generation automatique, marquer paye/reporter, depenses imprevues |
| Revenus (templates) | Stable | CRUD complet |
| Suivi mensuel des revenus | Stable | Generation automatique, marquer recu |
| Sections (categories) | Stable | CRUD avec protection cascade |
| Cartes bancaires | Stable | CRUD, association aux depenses |
| Parametres utilisateur | Stable | Devise, rappels |
| Allocation des revenus | Stable | Repartition par section |
| Patrimoine (epargne + dettes) | Stable | Suivi avec transactions |
| Authentification | Stable | Neon Auth (email/password) |
| Onboarding | Stable | Wizard premiere configuration |
| Landing page | Stable | Page publique |
| Notifications push | Stable | Rappel quotidien via cron Vercel (13h UTC) |
| PWA | Partiel | Installable, service worker avec precache, pas de sync offline |

## Problemes connus

- Pas de validation Zod sur les Server Actions (donnees non validees cote serveur)
- Pas de middleware.ts (pas de security headers)
- Pas de tests unitaires sur les calculs financiers
- Pas de transactions DB pour les operations financieres multi-requetes
- Composants monolithiques (god components) dans certaines pages
- Pas d'indexes sur les cles etrangeres

## Limitations techniques

- Plan gratuit Vercel : limites sur les serverless functions et la bande passante
- Plan gratuit Neon : limites sur le compute et le stockage
- Pas de RLS PostgreSQL : le filtrage par utilisateur est fait dans les Server Actions
- Pas d'ORM : requetes SQL directes via @neondatabase/serverless
