# AUDIT-009 — Review-Design : middleware.ts + security headers

**Story :** AUDIT-009
**Reviewer :** af-reviewer/review-design
**Date :** 2026-03-05
**Design reviewed :** `.app-factory/log/audit-remediation/AUDIT-009/design.md`

---

## Verdict : APPROVED WITH NOTES

Zero CRITICAL. 1 HIGH (non-bloquant car CSP en report-only). 3 MEDIUM. 2 LOW.

---

## HIGH — 1 finding

### H1 — `'unsafe-eval'` inclus dans la CSP sans justification verifiee

**Fichier :** design.md, section 3.2 (ligne 157)
**Regle :** `af-security` § Content Security Policy, defense in depth
**Probleme :** La directive CSP propose `script-src 'self' 'unsafe-inline' 'unsafe-eval'`. Le design indique "peut etre requis par certaines librairies. A retirer si les tests passent sans." Inclure `'unsafe-eval'` dans une CSP — meme en report-only — pose un mauvais precedent. `unsafe-eval` autorise `eval()`, `Function()`, et `setTimeout(string)`, qui sont les vecteurs d'attaque principaux que la CSP est censee bloquer.
**Impact :** Quand la CSP sera promue de report-only a enforced, `'unsafe-eval'` annulerait la majorite de la protection XSS fournie par la CSP. Poser cette baseline est dangereux.
**Fix :** Le Builder ne doit PAS inclure `'unsafe-eval'` par defaut. Tester sans. L'ajouter uniquement avec une justification documentee nommant la dependance specifique qui le requiert.

**Note :** Non-bloquant pour l'approbation du design car la CSP est en report-only (zero impact securitaire en runtime). Le Builder doit appliquer le fix pendant le build.

---

## MEDIUM — 3 findings

### M1 — Ambiguite sur le comportement du root path `/`

**Fichier :** design.md, section 2.2 (classification des routes)
**Regle :** `af-security` § route classification
**Probleme :** `/` est classe comme "Protected page" mais le plan de test (section 8) ne couvre pas explicitement le comportement du root path pour un utilisateur non authentifie.
**Impact :** Risque de boucle de redirection ou de comportement inattendu si `/` est la cible par defaut apres login.
**Fix :** Ajouter un test explicite : utilisateur non authentifie → `/` → redirect vers `/auth/sign-in` → login → retour a `/` sans boucle.

### M2 — `connect-src` CSP potentiellement incomplet

**Fichier :** design.md, section 3.2 (CSP)
**Regle :** `af-security` § Content Security Policy completeness
**Probleme :** `connect-src` est `'self' https://*.neon.tech`. Si l'app fait des appels client-side vers des domaines Vercel (analytics, speed insights, preview URLs), ceux-ci seront reportes comme violations.
**Impact :** Bruit en console en mode report-only. Blocage de connexions legitimes quand la CSP sera enforced.
**Fix :** Le Builder doit monitorer la console navigateur apres le premier deploiement pour les violations `connect-src` et ajuster la CSP avant de promouvoir en enforced.

### M3 — Header `X-DNS-Prefetch-Control` omis

**Fichier :** design.md, section 3.1 (headers)
**Regle :** `af-security` § security headers completeness
**Probleme :** La liste des headers omet `X-DNS-Prefetch-Control: off`, recommande pour prevenir le DNS prefetch non desire.
**Impact :** Gap de securite mineur. Non exploitable dans la plupart des scenarios.
**Fix :** Considerer l'ajout de `X-DNS-Prefetch-Control: off`. Priorite basse.

---

## LOW — 2 findings

### L1 — Pas de reference au code source Neon Auth pour les SKIP_ROUTES

**Fichier :** design.md, section 6 (R1)
**Regle :** `af-documentation` § traceability
**Probleme :** Le design affirme que Neon Auth skippe automatiquement les routes auth sans citer la source.
**Fix :** Ajouter une note : "Verifie dans `@neondatabase/auth/dist/next/server/index.mjs` : `SKIP_ROUTES = ['/api/auth', '/auth/callback', '/auth/sign-in', '/auth/sign-up', '/auth/magic-link', '/auth/email-otp', '/auth/forgot-password']`."

### L2 — `preload` dans HSTS premature pour une app alpha

**Fichier :** design.md, section 3.1
**Regle :** `af-security` § HSTS configuration
**Probleme :** La directive HSTS inclut `preload` mais la soumission a hstspreload.org est une action manuelle separee, permanente et difficile a annuler. Premature pour une app alpha.
**Fix :** Retirer `preload` de la valeur HSTS. Utiliser `max-age=63072000; includeSubDomains` sans `preload`.

---

## Verifications architecturales

| Aspect | Evaluation |
|--------|------------|
| Middleware + Next.js 16 App Router + Neon Auth | SOUND — utilise `auth.middleware()` de `createNeonAuth`, pattern documente officiellement |
| Classification des routes | SOUND — toutes les routes de `app/` sont comptabilisees |
| Edge Runtime compatibilite | SOUND — `createNeonAuth()` n'appelle pas `cookies()` a la construction. Fallback prevu |
| Defense in depth `/api/push/*` | SOUND — protege par middleware ET par `requireAuth()` dans les handlers |
| Fix `hasOrphanedData()` | SOUND — `requireAuth()` en debut de fonction, defense in depth correcte |
| CSP report-only | ACCEPTABLE — approche phasee. Les autres headers sont enforced immediatement |

## Mitigations des risques

| Risque | Mitigation | Evaluation |
|--------|------------|------------|
| R1 — Boucle redirect login | SKIP_ROUTES interne Neon Auth | ADEQUATE — verifie dans le source |
| R2 — Assets statiques bloques | `config.matcher` exclusion | ADEQUATE — regex correcte |
| R3 — CSP casse OAuth | Mode report-only | ADEQUATE — approche phasee |
| R4 — Route cron bloquee | PUBLIC_PREFIXES bypass | ADEQUATE — bypass explicite |
| R5 — Edge Runtime compat | Fallback documente | ADEQUATE — verifie pas de cookies() a l'init |

## Migration safety

**N/A** — Aucun changement de schema DB.

---

## Action items pour le Builder (phase build)

1. **H1 (obligatoire)** : NE PAS inclure `'unsafe-eval'` dans la CSP. Tester sans. Ajouter uniquement avec justification documentee.
2. **M1** : Ajouter test explicite du root path `/` (redirect → login → retour sans boucle).
3. **M2** : Monitorer la console navigateur apres deploiement pour violations `connect-src`.
4. **L2** : Retirer `preload` de HSTS pour la phase alpha.
