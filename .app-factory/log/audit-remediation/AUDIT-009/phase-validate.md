# AUDIT-009 — PM Validation

**Story:** AUDIT-009 — Add middleware.ts + security headers
**Validator:** af-pm/validate
**Date:** 2026-03-05
**Environment:** localhost:3000 (dev server)
**Level:** 2 | Scope: backend, infra

---

## Verdict: ACCEPTED

Tous les criteres d'acceptation sont satisfaits. L'implementation est conforme a l'intention de la story malgre une deviation documentee (proxy.ts au lieu de middleware.ts) et une imprecision dans l'AC1 (URL de login).

---

## Acceptance Criteria — Resultats

### AC1 — Redirect unauthenticated user on /depenses

**Critere:** Given un utilisateur non authentifie accede a `/depenses`, Then il est redirige vers `/auth/sign-in` (pas d'erreur brute)

**Resultat:** PASS (avec note)

L'utilisateur non authentifie est redirige avec un 307 vers `/landing`. L'AC mentionne `/auth/sign-in` mais cette page n'existe pas dans l'application -- `/landing` EST la page de login. L'intention du critere est pleinement satisfaite : l'utilisateur voit la page de login, pas une erreur brute.

La deviation est documentee par le Builder (phase-build.md) et confirmee par le Reviewer (phase-review.md, ligne 49).

### AC2 — Public access to /landing

**Critere:** Given un utilisateur non authentifie accede a `/landing`, Then il accede normalement a la page

**Resultat:** PASS

`/landing` est exclue du matcher regex du proxy (`landing` dans la liste d'exclusion). Les utilisateurs non authentifies accedent a la page sans interference. Verifie dans le code du proxy (proxy.ts:27) et confirme par le Builder (200 OK).

### AC3 — /api/cron/push accessible sans session

**Critere:** Given un utilisateur non authentifie accede a `/api/cron/push`, Then la route est accessible (auth par Bearer token, pas par session)

**Resultat:** PASS

`api/cron` est exclue du matcher regex du proxy. La route est accessible sans session. L'authentification est geree par le handler via Bearer token (retourne 401 si token invalide). Verifie dans le code (proxy.ts:27) et confirme par le Builder (phase-build.md: 401 handler auth, not proxy).

### AC4 — Security headers presents

**Critere:** Les headers suivants sont presents : X-Frame-Options (DENY), X-Content-Type-Options (nosniff), Strict-Transport-Security, Referrer-Policy, Permissions-Policy

**Resultat:** PASS

Tous les headers sont configures dans `next.config.ts` avec les valeurs correctes :

| Header | Valeur | Conforme |
|--------|--------|----------|
| X-Frame-Options | DENY | OUI |
| X-Content-Type-Options | nosniff | OUI |
| Strict-Transport-Security | max-age=63072000; includeSubDomains | OUI |
| Referrer-Policy | strict-origin-when-cross-origin | OUI |
| Permissions-Policy | camera=(), microphone=(), geolocation=(), payment=() | OUI |
| Content-Security-Policy-Report-Only | (CSP complet, sans unsafe-eval) | BONUS |

Le CSP est deploye en mode report-only -- choix prudent et appropriate pour une phase alpha.

### AC5 — hasOrphanedData() appelle requireAuth()

**Critere:** `hasOrphanedData()` appelle `requireAuth()` en debut de fonction

**Resultat:** PASS

Verifie par lecture directe du code (`lib/actions/claim.ts`, ligne 9) : `await requireAuth()` est appele avant toute requete DB.

### AC6 — Non-regression

**Critere:** Build passe, utilisateurs authentifies accedent a toutes les pages, routes publiques restent accessibles

**Resultat:** PASS

- Build : 0 erreurs
- Tests : 74/74 passent
- Routes protegees : Builder a verifie `/depenses`, `/` (redirect correct pour non-auth)
- Routes publiques : `/landing` (200 OK), `/api/cron/push` (bypass proxy, 401 handler)
- Pas de changement UI (story backend/infra uniquement)

---

## Verification beyond criteria

### Design deviation — proxy.ts au lieu de middleware.ts

Next.js 16 utilise `proxy.ts` au lieu de `middleware.ts` (ils ne peuvent pas coexister). Le Builder a adapte correctement. La deviation est bien documentee et approuvee par le Reviewer.

### Quote reformatting (M1/L1 du review)

Le Reviewer a note un reformatage de quotes (single -> double) dans le commit, qui bruite le diff. C'est un probleme de process (commits mixtes), pas un probleme produit. Pas d'impact utilisateur.

### CSP connect-src (M2 du review)

Le Reviewer a note que le CSP `connect-src` pourrait necessiter des domaines Vercel supplementaires lors de l'enforcement. Pas d'impact maintenant (report-only). A traiter quand le CSP sera promu en enforced.

---

## Discoveries

Aucune discovery identifiee pendant la validation.

---

## Note sur l'imprecision AC1

L'AC1 reference `/auth/sign-in` comme destination de redirection. Cette page n'existe pas dans l'application -- la page de login est `/landing`. Le proxy redirige correctement vers `/landing`. L'intention du critere (rediriger vers le login, pas afficher une erreur) est satisfaite.

**Recommendation:** Mettre a jour la story pour refleter la realite (`/landing` au lieu de `/auth/sign-in`) pour la tracabilite. Ceci est une imprecision de la story, pas un defaut d'implementation.
