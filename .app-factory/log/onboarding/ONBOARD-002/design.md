# ONBOARD-002 -- Design technique : Detection DB et nettoyage ancien onboarding

> Story: ONBOARD-002
> Level: 2 (CRUD + regles legeres)
> Scope: data, backend, frontend
> Dependency: ONBOARD-001 (DONE -- carousel DB-based en place)
> Date: 2026-03-06

---

## 1. Objectif

Supprimer tout l'ancien systeme d'onboarding (composant multi-etapes, localStorage, server action completeOnboarding) et garantir que la detection repose exclusivement sur la table `user_onboarding` creee par ONBOARD-001. Migrer les utilisateurs existants pour qu'ils ne revoient jamais le carousel.

---

## 2. Fichiers a SUPPRIMER

### 2a. `components/Onboarding.tsx`

**Raison :** Ancien composant d'onboarding multi-etapes (revenu, categories, objectif). Remplace par le carousel educatif (`components/onboarding/OnboardingCarousel.tsx` + `OnboardingCarouselWrapper.tsx`).

**Dependances a nettoyer :** `AccueilClient.tsx` l'importe et le rend conditionnellement.

### 2b. `lib/actions/onboarding.ts`

**Raison :** Contient `completeOnboarding()` qui creait des sections et un revenu via le wizard. Ce flow n'existe plus -- les sections sont creees manuellement ou via le guide de configuration. Le revenu est cree via /revenus.

**Dependances a nettoyer :** Importe par `components/Onboarding.tsx` uniquement (qui est supprime).

### 2c. `lib/schemas/onboarding.ts`

**Raison :** Schema Zod `CompleteOnboardingSchema` utilise exclusivement par `lib/actions/onboarding.ts`. Plus aucun consommateur apres suppression du fichier action.

**Dependances a nettoyer :** Importe par `lib/actions/onboarding.ts` et `__tests__/unit/schemas.test.ts`.

---

## 3. Fichiers a MODIFIER

### 3a. `components/AccueilClient.tsx`

**Changements :**
1. Supprimer `import Onboarding from "@/components/Onboarding"`
2. Supprimer le state `showOnboarding` et le `useEffect` qui lit `localStorage('mes-finances-onboarding-done')`
3. Supprimer le rendu conditionnel `{showOnboarding && <Onboarding ... />}`
4. Supprimer la prop `isNewUser` (plus utilisee -- la detection se fait en amont dans `app/page.tsx` via `hasSeenOnboarding()`)
5. Supprimer le type `isNewUser?: boolean` de `Props`

**Justification :** L'onboarding gate est maintenant dans `app/page.tsx` (server-side, avant le rendu du dashboard). Le client n'a plus besoin de cette logique.

### 3b. `app/page.tsx`

**Changements :**
1. Supprimer `import { hasUserData } from "@/lib/actions/demo-data"` (ligne 24)
2. Supprimer `const isNewUser = !(await hasUserData())` (ligne 53)
3. Supprimer la prop `isNewUser={isNewUser}` passee a `AccueilClient`

**Justification :** `isNewUser` servait a conditionner l'affichage de l'ancien onboarding via localStorage. Le nouveau carousel est gate en amont via `hasSeenOnboarding()`.

### 3c. `components/ParametresClient.tsx`

**Changements :**
1. Supprimer la ligne `localStorage.removeItem("mes-finances-onboarding-done")` dans `handleClearAll()`
2. Ajouter un appel pour reset le `user_onboarding` : soit via une nouvelle server action `resetOnboardingStatus()` importee de `lib/actions/onboarding-carousel.ts`, soit integrer le DELETE dans `clearAllUserData()` dans `lib/actions/demo-data.ts` (option preferee, voir 3d)

**Justification :** Quand l'utilisateur vide toutes ses donnees, il faut reinitialiser le flag d'onboarding en DB (pas en localStorage). La reference localStorage est du code mort.

### 3d. `lib/actions/demo-data.ts` -- `clearAllUserData()`

**Changements :**
1. Ajouter `await sql\`DELETE FROM user_onboarding WHERE user_id = \${userId}\`` dans la cascade de nettoyage (apres les autres DELETE, avant le re-create des sections par defaut)

**Justification :** Quand on vide toutes les donnees, l'utilisateur doit revoir le carousel au prochain login (comportement coherent). La table `user_onboarding` n'est pas dans la cascade actuelle.

### 3e. `__tests__/unit/schemas.test.ts`

**Changements :**
1. Supprimer `import { CompleteOnboardingSchema } from "@/lib/schemas/onboarding"` (ligne 34)
2. Supprimer le bloc `describe("Onboarding schemas", ...)` (lignes 641-673)

**Justification :** Le schema teste n'existe plus. Les tests du nouveau carousel (ONBOARD-001) n'avaient pas de schema Zod a tester (le carousel n'envoie pas de donnees structurees -- il appelle juste `markOnboardingSeen()`).

### 3f. `app/preview-onboarding/page.tsx` -- CONSERVER tel quel

**Raison :** Cette page preview importe `OnboardingCarousel` (le NOUVEAU composant, pas l'ancien). Elle reste utile pour le dev/preview du carousel educatif. Aucun changement necessaire.

---

## 4. Strategie de migration

### 4a. Migration DB pour les utilisateurs existants

**Deja fait par ONBOARD-001.** La migration `scripts/migrate-onboarding-carousel.mjs` a deja :
1. Cree la table `user_onboarding`
2. Backfill TOUS les utilisateurs existants (via UNION sur incomes/expenses/sections/setup_guide) avec `has_seen_onboarding = true`

**Conclusion :** Pas de migration supplementaire necessaire pour ONBOARD-002. Le AC-3 est deja couvert par ONBOARD-001.

### 4b. Edge case: utilisateur avec localStorage mais pas de donnees

Couvert par le backfill ONBOARD-001 : tout utilisateur present dans n'importe quelle table core est marque comme "deja vu". Un utilisateur qui avait le localStorage flag mais PAS de donnees est un cas theorique improbable (l'ancien onboarding creait toujours des sections). Si ce cas existait, il verrait le carousel -- ce qui est le comportement acceptable (le carousel est educatif, pas intrusif).

### 4c. Edge case: double source de verite pendant le deploiement

**Non applicable.** ONBOARD-001 a deja deploye la gate server-side (`app/page.tsx` retourne le carousel si `hasSeenOnboarding()` est false). L'ancien code dans `AccueilClient` est du code mort -- il ne s'execute plus car le server gate bloque avant le rendu du dashboard. La suppression est donc safe meme sans deploiement simultane.

---

## 5. Analyse de regression

| Risque | Probabilite | Impact | Mitigation |
|--------|------------|--------|------------|
| Sections non creees pour nouveaux utilisateurs | Faible | Moyen | `ensureDefaultSections()` dans `app/page.tsx` gere deja ce cas (appele apres le carousel gate) |
| Revenus non crees a l'onboarding | Nulle | Nul | Le revenu est cree via /revenus ou le guide de configuration -- l'ancien onboarding etait le seul a le faire automatiquement |
| `loadDemoData` inaccessible | Nulle | Nul | `loadDemoData` reste dans `lib/actions/demo-data.ts`, accessible depuis `/parametres` -- pas impactee |
| Tests cassent | Certaine | Faible | Les tests de `CompleteOnboardingSchema` seront supprimes (pas de regression, le schema disparait) |
| Build casse | Faible | Haut | Verification systematique via `next build` apres nettoyage |
| Guide de configuration casse | Nulle | Nul | Le guide (`setup_guide` table + `lib/actions/setup-guide.ts`) est independant de l'ancien onboarding |

---

## 6. Ordre de nettoyage (dependances)

L'ordre est important pour eviter les erreurs de compilation a chaque etape.

```
1. Modifier AccueilClient.tsx
   - Supprimer import Onboarding, state showOnboarding, useEffect localStorage, rendu conditionnel
   - Supprimer prop isNewUser du type et de la destructuration

2. Modifier app/page.tsx
   - Supprimer import hasUserData, variable isNewUser, prop isNewUser

3. Modifier ParametresClient.tsx
   - Supprimer la ligne localStorage.removeItem("mes-finances-onboarding-done")

4. Modifier lib/actions/demo-data.ts (clearAllUserData)
   - Ajouter DELETE FROM user_onboarding dans la cascade

5. Supprimer components/Onboarding.tsx
   - Plus aucun import ne le reference (etape 1 l'a nettoye)

6. Supprimer lib/actions/onboarding.ts
   - Plus aucun import ne le reference (etape 5 a supprime le seul consommateur)

7. Supprimer lib/schemas/onboarding.ts
   - Plus aucun import ne le reference (etape 6 a supprime le seul consommateur runtime)

8. Modifier __tests__/unit/schemas.test.ts
   - Supprimer import et tests de CompleteOnboardingSchema

9. Verification finale
   - next build (zero erreur, zero warning)
   - npm test (tous les tests passent)
```

---

## 7. Edge case : loadDemoData -- CONSERVER

**Decision :** `lib/actions/demo-data.ts` est **conserve integralement**.

**Raison :**
- `loadDemoData()` est utilisee dans `ParametresClient.tsx` (bouton "Charger les donnees de demo")
- `hasUserData()` est utilisee dans `app/page.tsx` (detection nouveau utilisateur -- SUPPRIMEE ici) et dans `app/parametres/page.tsx` (prop `hasData`)
- `clearAllUserData()` est utilisee dans `ParametresClient.tsx`
- L'ancien onboarding appelait `loadDemoData` en alternative au wizard -- mais la fonction elle-meme n'a rien de specifique a l'onboarding
- La reference dans `Onboarding.tsx` disparait avec la suppression du fichier

**Note :** `hasUserData()` sera toujours importee par `app/page.tsx` si elle est utilisee ailleurs. Verification necessaire au build : si l'import est mort, le supprimer.

Verification supplementaire : `hasUserData` est-elle encore utilisee dans `app/page.tsx` apres la suppression de `isNewUser` ?

**Resultat :** Apres suppression de `const isNewUser = !(await hasUserData())`, l'import `hasUserData` dans `app/page.tsx` devient mort. Il doit etre supprime (inclus dans l'etape 2).

---

## 8. Risques

1. **Risque faible -- oubli d'une reference.** Mitigation : `grep -r` exhaustif sur `Onboarding`, `completeOnboarding`, `mes-finances-onboarding-done`, `onboarding.ts` avant de declarer done.

2. **Risque faible -- clearAllUserData ne reset pas user_onboarding.** Si on oublie d'ajouter le DELETE, l'utilisateur qui vide ses donnees ne reverra pas le carousel. Ce n'est pas un bug critique (le carousel est educatif) mais c'est une incoherence. Inclus dans le design.

3. **Risque nul -- regression du guide de configuration.** Le guide est 100% independant (`setup_guide` table, `resetSetupGuide` action, aucun lien avec l'ancien onboarding).

---

## 9. Ce qui ne change PAS

- `components/onboarding/OnboardingCarousel.tsx` -- nouveau composant carousel (ONBOARD-001)
- `components/onboarding/OnboardingCarouselWrapper.tsx` -- wrapper avec server action (ONBOARD-001)
- `lib/actions/onboarding-carousel.ts` -- `hasSeenOnboarding()` et `markOnboardingSeen()` (ONBOARD-001)
- `scripts/migrate-onboarding-carousel.mjs` -- migration deja executee (ONBOARD-001)
- `app/preview-onboarding/page.tsx` -- preview du nouveau carousel (reference OnboardingCarousel, pas Onboarding)
- `lib/actions/demo-data.ts` -- `loadDemoData()` et `hasUserData()` conservees (utilisees par /parametres)
