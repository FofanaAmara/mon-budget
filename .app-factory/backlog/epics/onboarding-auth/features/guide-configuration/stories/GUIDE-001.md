# GUIDE-001 — Je vois le guide de configuration et les etapes a completer

## Metadata

| Champ | Valeur |
|-------|--------|
| ID | GUIDE-001 |
| Type | FEATURE |
| Feature parent | guide-configuration |
| Size | M |
| Dependencies | Aucune |

## Description

En tant que nouvel utilisateur, je veux voir un guide de configuration persistant qui m'indique les etapes a accomplir pour que mon budget soit fonctionnel, afin de ne pas etre perdu devant une app vide.

Cette story couvre : la table DB pour l'etat du guide, la requete serveur qui calcule l'etat des 4 etapes, la barre fixe en bas de l'ecran (mobile), le bottom sheet expandable avec la checklist complete, et la navigation vers la page de l'etape selectionnee.

## Criteres d'acceptation

**AC-1 : Affichage initial du guide**
- Given un utilisateur connecte qui n'a pas complete le guide ET qui est "nouveau" (guide jamais complete + au moins une des 4 conditions non remplie)
- When il arrive sur n'importe quelle page de l'app
- Then la barre du guide est visible en bas de l'ecran, au-dessus de la navigation mobile
- And elle affiche "Etape suivante : [premiere etape non completee]" avec un bouton fleche

**AC-2 : Expansion de la checklist**
- Given la barre du guide est affichee en mode reduit
- When l'utilisateur tape sur la barre ou le bouton fleche
- Then un bottom sheet s'ouvre
- And il montre les 4 etapes avec leur statut (coche verte ou a faire)
- And l'etape suivante (premiere non completee) est mise en evidence

**AC-3 : Navigation vers l'etape**
- Given le bottom sheet est ouvert
- When l'utilisateur tape sur une etape (completee ou non)
- Then il est redirige vers la page correspondante (etape 1 : /parametres/revenus, etape 2 : /parametres/depenses, etape 3 : /depenses, etape 4 : /depenses)
- And le bottom sheet se ferme

**AC-4 : Persistance multi-appareil**
- Given l'utilisateur a complete 2 etapes sur son telephone
- When il se connecte sur un autre appareil
- Then le guide affiche le meme etat (2 etapes cochees)
- And cet etat est calcule a partir des donnees reelles (requete DB), pas d'un cache local

**AC-5 : Relation avec l'onboarding existant**
- Given l'utilisateur vient de terminer l'onboarding (ou l'a skip)
- When il arrive sur la page d'accueil
- Then le guide s'affiche (pas l'onboarding une seconde fois)
- And si l'onboarding a cree un revenu, l'etape 1 est deja cochee

**AC-6 : Guide non affiche pour les utilisateurs existants**
- Given un utilisateur existant (avant le guide) qui a deja configure son budget (les 4 conditions remplies)
- When il se connecte
- Then le guide ne s'affiche PAS
- And il n'a pas de ligne dans la table setup_guide (ou equivalent)

## Edge cases

- **Barre et navigation mobile** : la barre du guide ne doit pas chevaucher la bottom navigation existante. Elle se positionne AU-DESSUS de la nav.
- **Page sans bottom nav** : si une page n'a pas de bottom nav, la barre reste en bas du viewport.
- **Chargement** : pendant le calcul de l'etat des etapes, la barre affiche un etat de chargement (skeleton ou shimmer), jamais un flash de contenu incorrect.

## Scenarios e2e

1. Un nouvel utilisateur se connecte pour la premiere fois. La barre du guide apparait en bas avec "Etape suivante : Ajouter un revenu recurrent". Il tape dessus. Le bottom sheet s'ouvre et montre les 4 etapes, toutes non cochees. Il tape sur l'etape 1. Il est redirige vers /parametres/revenus.

2. Un utilisateur existant avec revenu, charges, mois genere et depenses payees se connecte. Le guide ne s'affiche pas.

## Technical Notes

- **Migration DB** : creer une table `setup_guide` (ou similaire) avec `user_id`, `completed_at` (nullable), `dismissed_at` (nullable), `reset_at` (nullable). Script dans `scripts/migrate-setup-guide.mjs`.
- **Server query** : une seule requete SQL avec 4 sous-requetes EXISTS pour calculer l'etat des 4 etapes. Retourne aussi l'etat du guide (complete ou non) depuis la table setup_guide.
- **Composants UI** : barre fixe bottom (au-dessus de la nav), bottom sheet overlay. Design a deleguer au design-integrator.
- **Layout** : le composant guide doit etre dans le layout principal (app/(app)/layout.tsx ou equivalent) pour etre visible sur toutes les pages.
- **Pattern** : utiliser un context ou un hook pour partager l'etat du guide entre la barre et le bottom sheet.
