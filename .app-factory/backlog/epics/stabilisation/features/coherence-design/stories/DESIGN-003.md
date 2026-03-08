# DESIGN-003 — Uniformiser les headers de section sur toutes les pages

## Type
FIX

## Severity
MOYENNE

## Feature
coherence-design

## Description
L'audit design a identifie des variations dans les headers de section : couleur du label (tantot vert, tantot gris), presence ou absence du compteur entre parentheses, et style de bouton (outlined vs filled). Cette story definit et applique un pattern unique pour tous les headers de section de l'app.

**Pattern cible :** label vert uppercase + compteur entre parentheses (quand pertinent) + bouton filled teal aligne a droite (sur desktop).

## Pages impactees
- Depenses (label gris -> vert, compteur OK)
- Revenus (label vert OK, compteur OK)
- Patrimoine (label vert OK, bouton outlined -> filled, compteur absent -> ajouter)
- Parametres/revenus (label vert OK, compteur absent -> ajouter)
- Parametres/charges (label vert OK, compteur absent -> ajouter)
- Sections (label gris -> vert, compteur absent -> ajouter)
- Cartes (label gris -> vert, compteur absent -> ajouter)

## Acceptance Criteria

### AC1 — Couleur uniforme des labels
Given je suis sur n'importe quelle page de l'app ayant un header de section
When je regarde le label de la section
Then il est en **vert uppercase** (meme teinte que les pages Revenus et Patrimoine actuellement)

### AC2 — Compteur entre parentheses
Given je suis sur une page avec des items listables (Depenses, Revenus, Patrimoine, Parametres/revenus, Parametres/charges, Sections, Cartes)
When je regarde le header de section
Then le compteur du nombre d'items est affiche entre parentheses apres le label (ex: `EPARGNE (3)`, `MES CARTES (2)`)

### AC3 — Compteur dynamique
Given je suis sur une page avec un compteur dans le header
When j'ajoute ou je supprime un item
Then le compteur se met a jour automatiquement

### AC4 — Boutons header uniformes
Given je suis sur n'importe quelle page avec un bouton d'ajout dans le header de section (desktop)
When je regarde le bouton
Then il est en style **filled teal** (fond teal, texte blanc) et jamais en style outlined

### AC5 — Non-regression
Given le build passait avant cette story
When tous les changements sont appliques
Then le build passe avec zero erreurs et les pages fonctionnent identiquement

## Edge Cases
- Section avec 0 items : le compteur affiche `(0)` et non pas un format vide
- Section avec 100+ items : le compteur ne casse pas le layout du header
- Depenses avec sous-sections (A VENIR, PAYEES) : chaque sous-section a son propre compteur

## E2E Scenarios (business language)
1. Ouvrir chaque page en desktop -> tous les labels de section sont vert uppercase
2. Ouvrir Patrimoine -> `EPARGNE (N)` et `DETTES (N)` avec les bons compteurs
3. Ouvrir Sections -> `LISTE (N)` en vert avec compteur
4. Ajouter une carte -> le compteur dans le header augmente de 1
5. Ouvrir Depenses -> les sous-sections montrent `A VENIR (N)` et `PAYEES (N)` en vert

## Size
S
