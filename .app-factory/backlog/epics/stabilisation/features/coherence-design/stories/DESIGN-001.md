# DESIGN-001 — Uniformiser les boutons d'ajout et le FAB mobile sur toutes les pages

## Type
FIX

## Severity
HAUTE

## Feature
coherence-design

## Description
L'audit design a identifie 3 patterns differents pour les boutons d'ajout selon les pages : boutons `outlined` (Patrimoine desktop), pills fixes pleine largeur (Sections/Cartes mobile), et FAB rond visible sur desktop (Revenus). Le pattern attendu est : **desktop = bouton `+ Label` filled teal dans le header**, **mobile = FAB rond teal en bas a droite**.

Cette story regroupe les ecarts E1 (boutons d'ajout) et E4 (FAB mobile) car ils adressent le meme pattern d'interaction.

## Pages impactees
- Patrimoine (desktop : outlined -> filled)
- Sections (mobile : pill fixe -> FAB rond)
- Cartes (mobile : pill fixe -> FAB rond)
- Revenus (desktop : cacher le FAB rond, garder seulement en mobile)

## Acceptance Criteria

### AC1 — Boutons Patrimoine desktop
Given je suis sur la page Patrimoine en viewport desktop (>= 768px)
When je regarde la section Epargne et la section Dettes
Then les boutons `+ Nouveau projet` et `+ Nouvelle dette` sont en style **filled** (fond teal, texte blanc) et non plus en style outlined (bordure verte, fond blanc)

### AC2 — FAB Sections mobile
Given je suis sur la page Sections en viewport mobile (< 768px)
When je regarde le bas de l'ecran
Then je vois un FAB rond teal en bas a droite (icone `+`) et non plus un bouton pill pleine largeur fixe en bas

### AC3 — FAB Cartes mobile
Given je suis sur la page Cartes en viewport mobile (< 768px)
When je regarde le bas de l'ecran
Then je vois un FAB rond teal en bas a droite (icone `+`) et non plus un bouton pill pleine largeur fixe en bas

### AC4 — FAB Revenus desktop masque
Given je suis sur la page Revenus (transactionnel) en viewport desktop (>= 768px)
When je regarde la page
Then le FAB rond n'est pas visible (il ne doit apparaitre qu'en mobile)
And le bouton d'ajout est dans le header de section en style filled teal

### AC5 — Comportement fonctionnel preserve
Given je suis sur n'importe laquelle des pages modifiees (Patrimoine, Sections, Cartes, Revenus)
When je clique sur le bouton d'ajout (desktop) ou le FAB (mobile)
Then le meme formulaire/sheet/modal qu'avant s'ouvre correctement

### AC6 — Non-regression
Given le build passait avant cette story
When tous les changements sont appliques
Then le build passe avec zero erreurs et les autres pages ne sont pas affectees

## Edge Cases
- Patrimoine avec 0 projets et 0 dettes : les boutons d'ajout doivent rester visibles dans un etat vide
- Sections mobile avec le guide de configuration actif : le FAB ne doit pas chevaucher la barre du guide
- Viewport entre 768px et 800px (breakpoint edge) : verifier que le basculement desktop/mobile est propre

## E2E Scenarios (business language)
1. Ouvrir Patrimoine desktop -> les 2 boutons sont filled teal -> cliquer -> le formulaire s'ouvre
2. Ouvrir Sections mobile -> FAB rond en bas a droite -> cliquer -> le sheet de creation s'ouvre
3. Ouvrir Cartes mobile -> FAB rond en bas a droite -> cliquer -> le sheet de creation s'ouvre
4. Ouvrir Revenus desktop -> pas de FAB visible -> bouton dans le header -> cliquer -> sheet s'ouvre
5. Ouvrir Revenus mobile -> FAB rond present en bas a droite

## Size
M
