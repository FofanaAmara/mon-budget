# DESIGN-005 — Ajouter les breadcrumbs manquants sur Sections et Cartes

## Type
FIX

## Severity
MOYENNE

## Feature
coherence-design

## Description
Les sous-pages de Reglages (Parametres/revenus et Parametres/charges) ont un breadcrumb `Reglages > Mes revenus recurrents` / `Reglages > Mes depenses recurrentes` pour la navigation retour. Les pages Sections et Cartes, qui sont aussi des sous-pages de Reglages, n'ont pas de breadcrumb. Cette story ajoute les breadcrumbs manquants pour la coherence de navigation.

## Pages impactees
- Sections (ajouter breadcrumb)
- Cartes (ajouter breadcrumb)

## Acceptance Criteria

### AC1 — Breadcrumb Sections
Given je suis sur la page Sections (sous-page de Reglages)
When je regarde le haut de la page
Then je vois un breadcrumb `Reglages > Mes sections` au meme emplacement et dans le meme style que les breadcrumbs de Parametres/revenus et Parametres/charges

### AC2 — Breadcrumb Cartes
Given je suis sur la page Cartes (sous-page de Reglages)
When je regarde le haut de la page
Then je vois un breadcrumb `Reglages > Mes cartes` au meme emplacement et dans le meme style que les breadcrumbs de Parametres/revenus et Parametres/charges

### AC3 — Navigation breadcrumb fonctionnelle
Given je suis sur la page Sections ou Cartes
When je clique sur `Reglages` dans le breadcrumb
Then je suis redirige vers la page Reglages principale

### AC4 — Coherence visuelle avec les breadcrumbs existants
Given je compare les breadcrumbs de Sections et Cartes avec ceux de Parametres/revenus
When je regarde la taille, la couleur, l'espacement et la position
Then ils sont visuellement identiques

### AC5 — Non-regression
Given le build passait avant cette story
When tous les changements sont appliques
Then le build passe avec zero erreurs et la navigation existante n'est pas affectee

## Edge Cases
- Mobile : le breadcrumb doit etre visible sans casser le layout mobile
- Desktop sidebar ouverte : le breadcrumb ne doit pas chevaucher la sidebar

## E2E Scenarios (business language)
1. Aller dans Reglages -> cliquer sur Sections -> breadcrumb `Reglages > Mes sections` visible
2. Cliquer sur `Reglages` dans le breadcrumb -> retour a la page Reglages
3. Aller dans Reglages -> cliquer sur Cartes -> breadcrumb `Reglages > Mes cartes` visible
4. Comparer visuellement le breadcrumb de Sections avec celui de Parametres/revenus -> identiques

## Size
XS
