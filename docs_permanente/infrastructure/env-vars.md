# Variables d'environnement — Mes Finances

## Requises

| Variable | Description | Exemple |
|----------|-------------|---------|
| `POSTGRES_URL` | URL de connexion Neon (pooled) | `postgresql://user:pass@host/neondb?sslmode=require` |
| `POSTGRES_URL_NON_POOLING` | URL Neon (direct, pour migrations) | `postgresql://user:pass@host/neondb?sslmode=require` |
| `VAPID_PUBLIC_KEY` | Cle publique VAPID pour Web Push | Genere avec `npx web-push generate-vapid-keys` |
| `VAPID_PRIVATE_KEY` | Cle privee VAPID | — |
| `VAPID_EMAIL` | Email associe aux notifications VAPID | `your@email.com` |

## Optionnelles (Neon)

| Variable | Description |
|----------|-------------|
| `POSTGRES_DATABASE` | Nom de la DB (default: neondb) |
| `POSTGRES_HOST` | Host Neon |
| `POSTGRES_USER` | User Neon |
| `POSTGRES_PASSWORD` | Password Neon |

## Environnements

- **Local** : `.env.local` (git-ignored)
- **Vercel** : Configurees via Vercel dashboard (auto-injectees par l'integration Neon)
- **Fichier exemple** : `.env.example`
