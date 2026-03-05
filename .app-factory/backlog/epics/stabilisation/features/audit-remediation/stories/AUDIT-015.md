# AUDIT-015 — Remove force-dynamic from /landing + add missing revalidatePath helpers + misc quick fixes

## Type
REFACTOR

## Severity
MOYENNE

## Feature
audit-remediation

## Description
Quick fixes groupes provenant de plusieurs domaines d'audit :
1. `/landing` est une page statique mais exporte `force-dynamic` — elle devrait etre statique
2. `hasOrphanedData()` ne respecte pas le pattern d'authentification
3. Les env vars sont accedees avec `!` (non-null assertion) sans verification runtime
4. `as any` dans `providers.tsx` supprime la type safety
5. La comparaison de `CRON_SECRET` n'utilise pas `timingSafeEqual`

## Acceptance Criteria
Given `/landing` exporte `force-dynamic`
When l'export est supprime
Then la page est servie en statique (ou ISR) au lieu de dynamic

Given les env vars `VAPID_PRIVATE_KEY`, `VAPID_PUBLIC_KEY` sont accedees avec `!`
When des verifications runtime sont ajoutees
Then une erreur claire est levee au demarrage si une variable n'est pas definie (comme `lib/db.ts` fait pour `POSTGRES_URL`)

Given `CRON_SECRET` est compare avec `!==`
When la comparaison utilise `crypto.timingSafeEqual`
Then la comparaison est timing-safe

Given `authClient as any` dans `providers.tsx`
When le cast est remplace par un type plus specifique ou un commentaire explicatif
Then la type safety est amelioree (ou au minimum le `as any` est documente avec la raison)

Given le build passait avant cette story
When tous les changements sont appliques
Then le build passe et toutes les pages fonctionnent identiquement

## Technical Notes
- `app/landing/page.tsx` : supprimer `export const dynamic = 'force-dynamic'`
- `app/api/cron/push/route.ts` : ajouter `timingSafeEqual` pour la comparaison CRON_SECRET
- `app/api/push/send/route.ts` et `app/api/cron/push/route.ts` : ajouter checks runtime pour VAPID keys
- `app/providers.tsx` : investiguer le mismatch de type et remplacer `as any` par un cast specifique ou documenter
- Audit findings addressed : Performance-H5 (partiel, /landing uniquement), Security-L1, L3, Clean Code L-04, Frontend-M5
- Dependencies : Aucune
- Non-regression : la page landing doit s'afficher identiquement. L'authentification cron doit fonctionner. Le provider auth doit fonctionner.

## Size
XS
