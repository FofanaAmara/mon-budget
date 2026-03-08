# DESIGN-004 — Standardiser le format des montants dans toute l'app

## Type
REFACTOR

## Severity
MOYENNE

## Feature
coherence-design

## Description
L'audit design a identifie 3 conventions de placement du `$` (avant, apres, avec espace) et 2 conventions de decimales (toujours affichees vs seulement si non-rond). En tant qu'app fr-CA, la convention correcte est : `1 450,00 $` (espace insecable pour les milliers, virgule decimale, dollar apres avec espace).

Cette story centralise le formatage des montants dans un helper unique et l'applique partout pour garantir une presentation uniforme.

**Convention cible (fr-CA) :** `1 450,00 $` — espace milliers, virgule decimale, toujours 2 decimales, dollar apres avec espace insecable.

## Pages impactees
- Depenses (deja proche du format correct)
- Revenus transactionnel (`$800` -> `800,00 $`)
- Patrimoine (`$1 500` -> `1 500,00 $`)
- Parametres/charges (`$1 200,00` -> `1 200,00 $`)
- Parametres/revenus (`4 200$/mois` -> `4 200,00 $/mois`)
- Accueil (montants du tableau de bord)

## Acceptance Criteria

### AC1 — Format uniforme sur Revenus
Given je suis sur la page Revenus (transactionnel)
When je regarde les montants des items
Then ils sont tous au format `N NNN,NN $` (ex: `800,00 $`, `4 200,00 $`)

### AC2 — Format uniforme sur Patrimoine
Given je suis sur la page Patrimoine
When je regarde les montants des projets et dettes
Then ils sont tous au format `N NNN,NN $` (ex: `1 500,00 $`, `6 500,00 $`)

### AC3 — Format uniforme sur Parametres/charges
Given je suis sur la page Parametres/charges
When je regarde les montants des depenses recurrentes
Then ils sont tous au format `N NNN,NN $` (ex: `1 200,00 $`, `3,99 $`)

### AC4 — Format uniforme sur Parametres/revenus
Given je suis sur la page Parametres/revenus
When je regarde les montants des revenus recurrents
Then ils sont au format `N NNN,NN $/mois` (ex: `4 200,00 $/mois`)
And les montants variables utilisent le meme format avec le prefixe `~` (ex: `~800,00 $/mois`)

### AC5 — Helper centralise
Given le code source de l'application
When je cherche les endroits ou un montant est formate pour l'affichage
Then tous passent par un helper centralise (pas de formatage inline ou de `toFixed` eparpille)

### AC6 — Hero headers
Given je suis sur n'importe quelle page avec un montant principal dans le hero header
When je regarde le montant
Then il suit la meme convention `N NNN,NN $`

### AC7 — Non-regression
Given le build passait avant cette story
When tous les changements sont appliques
Then le build passe avec zero erreurs et les calculs financiers ne sont pas affectes (seul l'affichage change)

## Edge Cases
- Montant a 0 : affiche `0,00 $` (pas `$0` ni vide)
- Montant negatif : affiche `-125,00 $` (signe devant)
- Montant tres grand : `125 000,00 $` (deux espaces milliers)
- Montant tres petit : `0,50 $` (pas de troncature)

## E2E Scenarios (business language)
1. Ouvrir chaque page de l'app -> tous les montants suivent le meme format `N NNN,NN $`
2. Verifier que `3,99 $` et `4 200,00 $` coexistent correctement sur la meme page
3. Ouvrir l'accueil -> le montant principal du hero suit le format standard
4. Creer une depense de 1500 -> elle s'affiche `1 500,00 $` partout

## Technical Notes
- Un helper `formatCAD()` ou `formatMoney()` existe peut-etre deja dans `@/lib/utils` — le verifier et l'etendre si besoin
- Utiliser `Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' })` comme base
- Attention aux espaces insecables (`\u00A0`) pour eviter les retours a la ligne entre le montant et le `$`

## Size
S
