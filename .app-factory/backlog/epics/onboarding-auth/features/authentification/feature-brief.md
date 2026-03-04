# Feature Brief — Authentification

## Section A — Fonctionnel

### Titre
Authentification utilisateur

### Objectif utilisateur (Job-to-be-done)
En tant qu'utilisateur, je veux pouvoir creer un compte, me connecter et me deconnecter de maniere securisee.

### Description
Authentification via Neon Auth (Better Auth). Pages `/auth/sign-in` et `/auth/sign-up` (catch-all via `[path]`). Proxy API sur `/api/auth/[...path]`. Gestion de session, protection des routes.

### Flows cles

1. **Inscription** : `/auth/sign-up` -> formulaire -> creation compte -> redirect vers /.
2. **Connexion** : `/auth/sign-in` -> formulaire -> session -> redirect vers /.
3. **Deconnexion** : Parametres -> Se deconnecter -> session invalidee -> redirect /auth/sign-in.
4. **Protection des routes** : requireAuth() dans chaque server action verifie la session.

### Criteres d'acceptation (niveau feature)
- AC-1 : Inscription fonctionnelle avec email/mot de passe
- AC-2 : Connexion fonctionnelle
- AC-3 : Deconnexion efface la session et redirige
- AC-4 : Les pages protegees redirigent vers /auth/sign-in si pas authentifie

### Stories (squelette)
1. Inscription
2. Connexion
3. Deconnexion
4. Protection des routes

### Dependances
- Depends on : Aucune (fondation)
- Used by : Toutes les autres features

---

## Section B — Technique

### Routes
- `/auth/[path]` (page.tsx) — Catch-all Neon Auth UI
- `/api/auth/[...path]` (route.ts) — Proxy API Better Auth
- `/account/[path]` (page.tsx) — Page settings compte

### Source files
- `app/auth/[path]/page.tsx`
- `app/api/auth/[...path]/route.ts`
- `app/account/[path]/page.tsx`
- `lib/auth/client.ts` — authClient
- `lib/auth/helpers.ts` — requireAuth()
- `lib/auth/server.ts` — Auth server config

### Tables DB
- Gerees par Neon Auth (users, sessions, etc.)
