# ONBOARD-002 — Detection DB et nettoyage de l'ancien onboarding

> Status: READY
> Priority: P1
> Tags: [backend, data, frontend]
> Dependencies: ONBOARD-001 (le nouveau carousel doit exister avant de supprimer l'ancien)
> Estimation: 3 pts

## User Story

En tant qu'utilisateur, je veux que la detection de l'onboarding soit fiable et coherente sur tous mes appareils, afin de ne jamais revoir l'onboarding quand je l'ai deja complete, et de ne pas etre bloque par un mecanisme fragile base sur localStorage.

## Criteres d'acceptation

### AC-1 : Suppression de l'ancien composant onboarding

- Given le nouveau carousel educatif (ONBOARD-001) est en place
- When on inspecte le code
- Then `components/Onboarding.tsx` est supprime
- And `lib/actions/onboarding.ts` (completeOnboarding) est supprime
- And toutes les references a ces fichiers sont nettoyees (imports, usages dans les pages)

### AC-2 : Suppression de la detection localStorage

- Given l'ancien mecanisme utilisait `localStorage('mes-finances-onboarding-done')`
- When on inspecte le code
- Then aucune reference a cette cle localStorage n'existe dans le codebase
- And la detection repose exclusivement sur la DB

### AC-3 : Migration des utilisateurs existants

- Given des utilisateurs existants ont deja utilise l'app (avec ou sans l'ancien localStorage flag)
- When la migration s'execute
- Then ces utilisateurs sont marques comme "onboarding vu" en DB
- And ils ne voient jamais le nouveau carousel (ils connaissent deja l'app)

### AC-4 : Aucune regression sur les fonctionnalites existantes

- Given l'ancien onboarding creait des sections et des revenus via completeOnboarding
- When l'ancien code est supprime
- Then la creation de sections et revenus fonctionne toujours normalement via les pages dediees (/revenus, /sections)
- And le guide de configuration fonctionne toujours correctement
- And loadDemoData reste accessible depuis /parametres (si elle y est referencee)

### AC-5 : Nettoyage exhaustif des references

- Given l'ancien onboarding etait reference dans plusieurs fichiers
- When le nettoyage est termine
- Then le build Next.js passe sans erreur
- And aucun import mort ou reference a l'ancien onboarding n'existe
- And les tests existants passent (ou sont adaptes si necessaire)

## Edge cases

- **loadDemoData** : Verifier si `lib/actions/demo-data.ts` est utilisee ailleurs que dans l'ancien onboarding. Si oui, la garder. Si non, la supprimer ou la deplacer dans le scope de /parametres.
- **Utilisateur qui avait le localStorage flag mais pas de donnees** : La migration DB doit couvrir ce cas — marquer comme "onboarding vu" pour TOUS les utilisateurs existants, pas seulement ceux avec des donnees.
- **Double source de verite pendant le deploiement** : Entre le deploiement du nouveau code et la migration des donnees, les deux systemes coexistent brievement. Le nouveau carousel ne doit PAS s'afficher pour les utilisateurs existants meme avant la migration (la logique de detection doit etre defensive).

## Scenarios e2e

### Scenario 1 — Utilisateur existant apres migration

1. Un utilisateur existant (avant la refonte) se connecte
2. La migration a marque son compte comme "onboarding vu"
3. Le carousel ne s'affiche pas
4. Le dashboard s'affiche normalement
5. Le guide de configuration fonctionne normalement

### Scenario 2 — Build propre

1. Le developpeur fait un build (`next build`)
2. Aucune erreur de compilation
3. Aucun warning lie a des imports manquants ou du code mort
4. Les tests passent

## Notes pour le Builder

- Cette story est principalement du nettoyage et de la migration — la valeur utilisateur est la FIABILITE de la detection (plus de localStorage fragile)
- La migration des utilisateurs existants est une operation SAFE (INSERT avec ON CONFLICT ou UPDATE conditionnelle)
- Verifier toutes les references via grep avant de supprimer les fichiers
- L'ancien code Onboarding.tsx creait des sections via `completeOnboarding` — verifier que ce flow n'est pas casse (les sections sont maintenant creees manuellement par l'utilisateur ou via l'onboarding actuel, mais l'onboarding ne cree plus de donnees)
