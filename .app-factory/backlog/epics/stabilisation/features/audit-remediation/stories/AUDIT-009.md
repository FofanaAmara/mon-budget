# AUDIT-009 — Add middleware.ts + security headers

## Type
REFACTOR

## Severity
HAUTE

## Feature
audit-remediation

## Description
L'application n'a pas de `middleware.ts`. L'authentification n'est verifiee qu'au niveau des server actions via `requireAuth()`. Si un utilisateur non authentifie accede a une route protegee, il voit une erreur brute au lieu d'etre redirige vers `/auth/sign-in`. De plus, aucun header de securite n'est configure (pas de X-Frame-Options, X-Content-Type-Options, HSTS, Referrer-Policy, Permissions-Policy, ni CSP).

Egalement, `hasOrphanedData()` est la seule server action qui n'appelle pas `requireAuth()`.

## Acceptance Criteria
Given un utilisateur non authentifie accede a `/depenses`
When la requete arrive au middleware
Then il est redirige vers `/auth/sign-in` (pas d'erreur brute)

Given un utilisateur non authentifie accede a `/landing`
When la requete arrive au middleware
Then il accede normalement a la page (route publique)

Given un utilisateur non authentifie accede a `/api/cron/push`
When la requete arrive au middleware
Then la route est accessible (authentification par Bearer token, pas par session)

Given les security headers sont configures dans `next.config.ts`
When une page est servie
Then les headers suivants sont presents : X-Frame-Options (DENY), X-Content-Type-Options (nosniff), Strict-Transport-Security, Referrer-Policy (strict-origin-when-cross-origin), Permissions-Policy

Given `hasOrphanedData()` n'appelle pas `requireAuth()`
When elle est corrigee
Then elle appelle `requireAuth()` en debut de fonction

Given le build passait avant cette story
When tous les changements sont appliques
Then le build passe, les utilisateurs authentifies accedent a toutes les pages normalement, et les routes publiques restent accessibles

## Technical Notes
- Creer `middleware.ts` a la racine du projet
- Routes publiques a whitelister : `/auth`, `/landing`, `/api/cron`, `/manifest.json`, `/sw.js`, `/icons`, `/_next/static`, `/_next/image`, `/favicon.ico`
- Verifier le nom du cookie de session Neon Auth (probablement `__session` ou via l'API Neon Auth)
- Ajouter les security headers dans `next.config.ts` via `async headers()`
- CSP basique : `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' https://*.neon.tech`
- Corriger `hasOrphanedData()` dans `lib/actions/claim.ts`
- Audit findings addressed : Security-H3, H4, M3, M6, Architecture-M-4
- Dependencies : Aucune
- Non-regression : les utilisateurs authentifies doivent acceder a toutes les pages sans changement. Le flow de login doit fonctionner. Les API routes (push, cron) doivent fonctionner.

## Size
S
