# AUDIT-009 — Design technique : middleware.ts + security headers

**Story :** AUDIT-009 — Add middleware.ts + security headers
**Niveau :** 2 (CRUD + logique metier legere)
**Scope :** backend, infra
**Date :** 2026-03-05
**Agent :** Builder/Design

---

## 1. Analyse du contexte

### Etat actuel

- Aucun `middleware.ts` n'existe. L'authentification est verifiee uniquement dans les server actions via `requireAuth()`.
- Un utilisateur non authentifie qui accede a `/depenses` voit une erreur brute (`Error: Non authentifie`) au lieu d'une redirection propre vers `/auth/sign-in`.
- Aucun security header n'est configure (pas de CSP, HSTS, X-Frame-Options, etc.).
- `hasOrphanedData()` dans `lib/actions/claim.ts` est la seule server action sans appel a `requireAuth()`.
- Neon Auth (`@neondatabase/auth 0.2.0-beta`) fournit un middleware integre via `auth.middleware()`.

### Decouverte cle : middleware integre Neon Auth

L'investigation du code source de `@neondatabase/auth/next/server` revele que `auth.middleware()` est deja fourni. Il gere :
- Validation de session + refresh automatique
- Traitement des callbacks OAuth
- Redirection vers la page de login pour les routes non authentifiees
- Skip automatique des routes d'auth internes (`/api/auth`, `/auth/sign-in`, `/auth/sign-up`, etc.)

**Decision : utiliser `auth.middleware()` plutot qu'ecrire un middleware custom de detection de cookie.**

Raison : le middleware integre gere correctement la validation cryptographique de la session (signature cookie), le refresh automatique, et les edge cases OAuth. Un middleware custom base sur la simple presence du cookie `__Secure-neon-auth.session_token` serait fragile (cookie present mais expire, cookie non signe, etc.).

---

## 2. Architecture du middleware

### 2.1 Structure du fichier `middleware.ts`

Le middleware a deux responsabilites :
1. **Route protection** via `auth.middleware()` pour les routes protegees
2. **Bypass** des routes publiques et statiques via le `config.matcher` et une liste de prefixes publics

### 2.2 Classification des routes

| Categorie | Routes | Traitement middleware |
|-----------|--------|----------------------|
| **Auth (Neon skip auto)** | `/api/auth/*`, `/auth/sign-in`, `/auth/sign-up`, `/auth/forgot-password` | Bypass automatique par Neon Auth |
| **Public pages** | `/landing` | Bypass explicite dans le middleware |
| **API cron** | `/api/cron/*` | Bypass explicite (auth par Bearer token, pas par session) |
| **API push** | `/api/push/*` | Protege par `auth.middleware()` (necessite session) |
| **Static assets** | `/_next/static`, `/_next/image`, `/favicon.ico`, `/sw.js`, `/manifest.json`, `/icons/*` | Exclu par `config.matcher` |
| **Protected pages** | `/`, `/depenses`, `/revenus`, `/projets`, `/cartes`, `/sections`, `/parametres/*`, `/account/*` | Protege par `auth.middleware()` |

### 2.3 Logique du middleware

```
Request arrive
  |
  v
config.matcher filtre les static assets (/_next/static, /_next/image, favicon.ico, sw.js, manifest.json, icons/*)
  |
  v
middleware() s'execute
  |
  v
pathname commence par /landing ou /api/cron ?
  |-- OUI --> NextResponse.next() (bypass)
  |-- NON --> auth.middleware() s'execute
               |
               v
           Neon Auth verifie session, gere OAuth callbacks, redirect si non authentifie
```

### 2.4 Code propose pour `middleware.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/server';

const PUBLIC_PREFIXES = ['/landing', '/api/cron'];

const neonMiddleware = auth.middleware({ loginUrl: '/auth/sign-in' });

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes: skip auth
  if (PUBLIC_PREFIXES.some(prefix => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  // Protected routes: delegate to Neon Auth middleware
  return neonMiddleware(request);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|sw\\.js|manifest\\.json|icons/).*)',
  ],
};
```

### 2.5 Decision : `/api/push/*` protege ou bypass ?

Les routes `/api/push/subscribe` et `/api/push/send` appellent deja `requireAuth()` dans leur handler. Laisser le middleware Neon Auth les proteger ajoute une couche de defense en profondeur (defense in depth). Pas de raison de les bypasser.

---

## 3. Security headers dans `next.config.ts`

### 3.1 Headers a ajouter

Le fichier `next.config.ts` a deja une fonction `async headers()` avec des regles pour `/sw.js` et `/manifest.json`. Ajouter une regle globale `source: '/(.*)'` avec les security headers.

| Header | Valeur | Raison |
|--------|--------|--------|
| `X-Frame-Options` | `DENY` | Empecher le clickjacking |
| `X-Content-Type-Options` | `nosniff` | Empecher le MIME sniffing |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` | Forcer HTTPS (2 ans) |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Limiter les infos de referer |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), payment=()` | Desactiver les APIs sensibles non utilisees |
| `Content-Security-Policy` | Voir ci-dessous | Protection XSS |

### 3.2 Content-Security-Policy

La CSP doit etre compatible avec :
- Next.js 16 (inline scripts pour hydratation) -- necessite `'unsafe-inline'` pour scripts OU nonces (mais les nonces sont complexes avec App Router)
- Neon Auth (appels API vers `*.neon.tech`)
- Vercel (deploiement, analytics potentiel)
- Service Worker (`sw.js`)
- Web Push API

**Decision : CSP en mode `Content-Security-Policy-Report-Only` dans un premier temps.**

Raison : une CSP trop restrictive peut casser silencieusement des fonctionnalites (OAuth popup, inline styles de Neon Auth UI, etc.). Deployer en report-only d'abord, observer en production, puis promouvoir en enforced.

**Alternative rejetee :** CSP enforced directement. Risque trop eleve de casser le flow OAuth ou les composants Neon Auth UI qui utilisent des inline styles.

**CSP proposee (report-only) :**

```
default-src 'self';
script-src 'self' 'unsafe-inline' 'unsafe-eval';
style-src 'self' 'unsafe-inline';
img-src 'self' data: blob:;
font-src 'self';
connect-src 'self' https://*.neon.tech;
worker-src 'self';
frame-src 'none';
object-src 'none';
base-uri 'self';
form-action 'self';
```

Notes sur les directives :
- `'unsafe-inline'` pour `script-src` : necessaire pour les inline scripts de Next.js (hydratation). Alternative avec nonces trop complexe pour le moment.
- `'unsafe-eval'` pour `script-src` : peut etre requis par certaines librairies. A retirer si les tests passent sans.
- `'unsafe-inline'` pour `style-src` : necessaire pour les inline styles de Neon Auth UI et les composants existants.
- `connect-src` inclut `https://*.neon.tech` pour les appels API auth.
- `worker-src 'self'` : pour le service worker.
- `frame-src 'none'` : coherent avec `X-Frame-Options: DENY`.

### 3.3 Modification de `next.config.ts`

Ajouter une entree `source: '/(.*)'` au debut du tableau retourne par `async headers()`. Les entrees existantes (`/sw.js`, `/manifest.json`) restent inchangees -- elles ajoutent des headers specifiques a ces routes.

---

## 4. Fix de `hasOrphanedData()`

### 4.1 Probleme

`hasOrphanedData()` dans `lib/actions/claim.ts` est une server action marquee `'use server'` qui execute une requete SQL sans verifier l'authentification. Meme si elle ne retourne pas de donnees sensibles (juste un boolean), c'est une violation du principe de defense en profondeur.

### 4.2 Solution

Ajouter `await requireAuth()` en debut de fonction. Le resultat (userId) n'est pas utilise par la requete (elle cherche `user_id = 'unclaimed'`), mais l'appel garantit que seul un utilisateur authentifie peut invoquer cette action.

```typescript
export async function hasOrphanedData(): Promise<boolean> {
  await requireAuth();
  const rows = await sql`SELECT COUNT(*) as count FROM sections WHERE user_id = 'unclaimed'`;
  return Number(rows[0].count) > 0;
}
```

---

## 5. Fichiers a creer/modifier

| Fichier | Action | Description |
|---------|--------|-------------|
| `middleware.ts` | CREER | Middleware Next.js avec auth Neon + bypass routes publiques |
| `next.config.ts` | MODIFIER | Ajouter security headers globaux |
| `lib/actions/claim.ts` | MODIFIER | Ajouter `requireAuth()` dans `hasOrphanedData()` |

Aucun fichier frontend modifie. Aucune migration DB.

---

## 6. Risques et mitigations

### R1 — Casser le flow de login (HAUT)

**Risque :** Le middleware pourrait rediriger en boucle si `/auth/*` n'est pas correctement bypasse.
**Mitigation :** Neon Auth middleware skippe deja automatiquement `/api/auth`, `/auth/sign-in`, `/auth/sign-up`, `/auth/forgot-password`, `/auth/magic-link`, `/auth/email-otp`. Le `config.matcher` exclut les static assets. Test e2e du flow login obligatoire.

### R2 — Bloquer les assets statiques (MOYEN)

**Risque :** Le middleware intercepte `/sw.js`, `/manifest.json`, `/icons/*` et demande une auth.
**Mitigation :** Le `config.matcher` les exclut avec le pattern `/((?!_next/static|_next/image|favicon\\.ico|sw\\.js|manifest\\.json|icons/).*)`. Test specifique : verifier que `sw.js` est accessible sans auth.

### R3 — CSP trop restrictive (MOYEN)

**Risque :** La CSP bloque des fonctionnalites Neon Auth (OAuth popup, inline styles).
**Mitigation :** Deployer en `Content-Security-Policy-Report-Only`. Observer les violations en console avant de passer en enforced.

### R4 — Bloquer `/api/cron/push` (HAUT)

**Risque :** Le cron Vercel n'a pas de session cookie, le middleware le bloque.
**Mitigation :** `/api/cron` est dans la liste `PUBLIC_PREFIXES` et sera bypasse avant d'atteindre `auth.middleware()`. Test specifique obligatoire.

### R5 — Middleware incompatible avec `auth.middleware()` (MOYEN)

**Risque :** L'import de `auth` depuis `lib/auth/server.ts` pourrait echouer dans le contexte Edge Runtime du middleware (utilisation de `cookies()` de next/headers a l'init).
**Mitigation :** `createNeonAuth()` ne fait que creer l'instance -- les appels a `cookies()` ne se font qu'au moment de l'execution des methodes server, pas a l'import. Le middleware Neon Auth utilise les headers de la request directement, pas `cookies()`. Cependant, si le probleme survient, fallback : creer un fichier `lib/auth/middleware.ts` dedie qui instancie `createNeonAuth` separement. A tester lors du build.

---

## 7. Migration safety

**N/A** -- Aucun changement de schema DB. Pas de migration necessaire.

---

## 8. Plan de test

| AC | Test | Type |
|----|------|------|
| AC1 (redirect non-auth) | Acceder a `/depenses` sans session -> redirect vers `/auth/sign-in` | E2E / Manuel |
| AC2 (routes publiques) | Acceder a `/landing` sans session -> page accessible | E2E / Manuel |
| AC3 (API cron) | Appeler `/api/cron/push` avec Bearer token -> accessible | Manuel (curl) |
| AC4 (security headers) | Verifier headers sur une page servie | Manuel (curl / DevTools) |
| AC5 (hasOrphanedData fix) | Verifier que `requireAuth()` est appele | Code review |
| AC6 (non-regression) | Build passe, utilisateurs auth accedent a toutes les pages | Build + E2E |
