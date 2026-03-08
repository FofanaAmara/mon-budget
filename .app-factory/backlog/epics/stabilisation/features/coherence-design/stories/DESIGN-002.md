# DESIGN-002 — Harmoniser le style des cards de la page Patrimoine

## Type
REFACTOR

## Severity
HAUTE

## Feature
coherence-design

## Description
La page Patrimoine utilise un style de cards unique dans l'app : bordure laterale coloree (teal pour l'epargne, rouge pour les dettes) avec fond blanc. Toutes les autres pages utilisent soit des cards groupees dans un conteneur avec separateurs (Depenses, Revenus), soit des cards individuelles avec bordure grise complete (Parametres/revenus). La page Patrimoine parait visuellement deconnectee du reste de l'application.

Cette story aligne le style des cards Patrimoine sur le pattern dominant de l'app (cards groupees dans un conteneur avec separateurs), tout en maintenant la distinction visuelle epargne/dettes via un badge ou une icone coloree plutot que la bordure laterale.

## Pages impactees
- Patrimoine (epargne et dettes)

## Acceptance Criteria

### AC1 — Cards epargne : nouveau style
Given je suis sur la page Patrimoine
When je regarde la section Epargne
Then les projets d'epargne sont presentes dans un conteneur groupe avec separateurs entre les items (meme pattern que la page Depenses ou Revenus)
And il n'y a plus de bordure laterale teal sur chaque card

### AC2 — Cards dettes : nouveau style
Given je suis sur la page Patrimoine
When je regarde la section Dettes
Then les dettes sont presentees dans un conteneur groupe avec separateurs entre les items
And il n'y a plus de bordure laterale rouge sur chaque card

### AC3 — Distinction visuelle epargne/dettes preservee
Given je suis sur la page Patrimoine avec des projets d'epargne ET des dettes
When je regarde les deux sections
Then je peux visuellement distinguer les deux types d'items (via badge colore, icone, ou autre indicateur) sans la bordure laterale

### AC4 — Informations preservees
Given je suis sur la page Patrimoine
When je compare le nouveau design avec l'ancien
Then toutes les informations affichees sont identiques (nom, montant, progression, actions)
And les actions (ajouter, synchroniser, historique, supprimer) restent accessibles

### AC5 — Responsive desktop et mobile
Given je suis sur la page Patrimoine
When je bascule entre desktop et mobile
Then le nouveau style de cards est coherent sur les deux viewports

### AC6 — Non-regression
Given le build passait avant cette story
When tous les changements sont appliques
Then le build passe avec zero erreurs et les fonctionnalites de la page Patrimoine sont identiques

## Edge Cases
- Projet d'epargne a 100% de progression : la barre de progression doit rester lisible dans le nouveau layout
- Projet avec un nom tres long : pas de debordement ni troncature excessive
- Page avec 0 projets et 0 dettes : le message vide doit s'afficher correctement

## E2E Scenarios (business language)
1. Ouvrir Patrimoine desktop -> les cards epargne sont groupees dans un conteneur -> pas de bordure laterale teal
2. Ouvrir Patrimoine desktop -> les cards dettes sont groupees dans un conteneur -> pas de bordure laterale rouge
3. Ouvrir Patrimoine mobile -> meme style de cards, responsive correct
4. Cliquer sur les actions d'un projet d'epargne -> toutes les actions fonctionnent comme avant
5. Comparer visuellement Patrimoine avec Depenses -> meme famille visuelle

## Size
S
