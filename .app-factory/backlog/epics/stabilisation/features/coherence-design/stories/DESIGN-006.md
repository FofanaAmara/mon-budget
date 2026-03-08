# DESIGN-006 — Uniformiser les badges de statut sur toutes les pages

## Type
REFACTOR

## Severity
BASSE

## Feature
coherence-design

## Description
L'audit design a identifie l'absence d'un systeme de badges unifie : tailles, couleurs, formes et casse varient d'une page a l'autre (`PREVU` gris vs `Attendu` gris arrondi, `PAYE` vert vs `Recu` vert, `Ponctuel` orange vs `PERMANENT` vert, etc.). Cette story definit et applique un systeme de badges coherent.

**Systeme cible :** badges arrondis (pill shape), taille uniforme, palette de couleurs semantique (vert = actif/recu/paye, gris = en attente/prevu, orange = ponctuel/temporaire, rouge = dette/alerte), texte en minuscules avec premiere lettre en majuscule.

## Pages impactees
- Depenses (`PREVU`, `PAYE`)
- Revenus (`Attendu`, `Recu`)
- Patrimoine (`PERMANENT`, `PROJET`, `DETTE`)
- Parametres/charges (`Ponctuel`, `Mensuel`, `auto`)
- Parametres/revenus (`EMPLOI`, `BUSINESS`, `Depot auto`, `Variable`)

## Acceptance Criteria

### AC1 — Forme et taille uniformes
Given je suis sur n'importe quelle page de l'app contenant des badges
When je regarde les badges
Then ils ont tous la meme forme (pill arrondi), la meme hauteur et le meme padding interne

### AC2 — Palette de couleurs semantique
Given je suis sur n'importe quelle page de l'app contenant des badges
When je regarde les couleurs des badges
Then les badges suivent une palette semantique coherente :
- **Vert** pour les statuts positifs/completes (Paye, Recu, Permanent, auto)
- **Gris** pour les statuts en attente (Prevu, Attendu, Mensuel)
- **Orange** pour les statuts temporaires/ponctuels (Ponctuel)
- **Rouge** pour les alertes/dettes (Dette)

### AC3 — Casse uniforme
Given je suis sur n'importe quelle page de l'app contenant des badges
When je regarde le texte des badges
Then tous les badges utilisent la meme convention de casse (premiere lettre majuscule, reste en minuscule : `Prevu`, `Paye`, pas `PREVU` ni `paye`)

### AC4 — Badges Depenses
Given je suis sur la page Depenses
When je regarde les badges des items
Then `Prevu` est en gris arrondi et `Paye` est en vert arrondi, meme style que les badges des autres pages

### AC5 — Badges Parametres/revenus
Given je suis sur la page Parametres/revenus
When je regarde les badges des revenus
Then les badges de type (`Emploi`, `Business`) et de mode (`Depot auto`, `Variable`) sont dans le systeme unifie

### AC6 — Non-regression
Given le build passait avant cette story
When tous les changements sont appliques
Then le build passe avec zero erreurs et la semantique des badges est preservee (memes informations, nouveau style)

## Edge Cases
- Badge avec texte long (ex: `Depot automatique`) : le badge ne doit pas deborder ni casser le layout de la ligne
- Plusieurs badges sur un meme item : ils doivent s'aligner proprement
- Mobile : les badges doivent rester lisibles sans etre trop grands

## E2E Scenarios (business language)
1. Ouvrir Depenses -> badges `Prevu` gris et `Paye` vert, forme pill arrondie
2. Ouvrir Revenus -> badges `Attendu` gris et `Recu` vert, meme forme et taille que Depenses
3. Ouvrir Patrimoine -> badges `Permanent` vert, `Projet` gris, `Dette` rouge, meme systeme
4. Ouvrir Parametres/charges -> badges `Ponctuel` orange, `Mensuel` gris, meme systeme
5. Comparer visuellement les badges de 3 pages differentes -> meme famille visuelle

## Size
S
