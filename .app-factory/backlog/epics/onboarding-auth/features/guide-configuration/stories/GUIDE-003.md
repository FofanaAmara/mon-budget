# GUIDE-003 — Je celebre la completion du guide et peux le relancer

## Metadata

| Champ | Valeur |
|-------|--------|
| ID | GUIDE-003 |
| Type | FEATURE |
| Feature parent | guide-configuration |
| Size | S |
| Dependencies | GUIDE-002 |

## Description

En tant qu'utilisateur, je veux voir une celebration quand je complete toutes les etapes du guide, et pouvoir relancer le guide depuis les parametres si je veux le revoir, afin de sentir que j'ai accompli quelque chose et de pouvoir me re-orienter si besoin.

Cette story couvre : l'animation de celebration (confetti ou message), la disparition automatique du guide, la persistence de l'etat "complete" en DB, et l'option de relance depuis les parametres.

## Criteres d'acceptation

**AC-1 : Celebration a la completion**
- Given les 3 premieres etapes sont completees
- When l'utilisateur complete la 4e etape (marquer une depense payee)
- Then une animation de celebration s'affiche (confetti ou message de felicitation)
- And l'animation est visible pendant 3-5 secondes

**AC-2 : Disparition du guide**
- Given la celebration vient de s'afficher
- When l'animation se termine
- Then le guide (barre + bottom sheet) disparait
- And le guide ne reapparait plus en navigation normale
- And la table setup_guide est mise a jour avec completed_at = NOW()

**AC-3 : Guide absent apres completion**
- Given l'utilisateur a complete le guide (completed_at non null)
- When il navigue sur n'importe quelle page de l'app
- Then la barre du guide n'est PAS affichee
- And aucun espace n'est reserve pour elle (pas de gap vide en bas)

**AC-4 : Relance depuis les parametres**
- Given l'utilisateur a complete le guide (ou veut le revoir)
- When il va dans /parametres
- Then il voit une option "Revoir le guide de configuration"
- When il clique dessus
- Then le guide reapparait avec l'etat actuel des etapes (les etapes dont les conditions sont remplies sont cochees)
- And la table setup_guide est mise a jour (reset_at = NOW(), completed_at = NULL)

**AC-5 : Relance avec donnees existantes**
- Given l'utilisateur a complete le guide puis supprime ses revenus
- When il relance le guide depuis les parametres
- Then l'etape 1 (revenu) est decochee (donnees absentes)
- And les autres etapes refletent l'etat reel des donnees

## Edge cases

- **Completion non sequentielle** : si l'utilisateur complete l'etape 4 en dernier mais n'a pas fait les etapes dans l'ordre 1-2-3-4, la celebration se declenche quand la DERNIERE etape restante est completee (quelle qu'elle soit).
- **Relance alors que tout est deja fait** : si l'utilisateur relance le guide et que les 4 conditions sont remplies, le guide s'affiche avec les 4 etapes cochees. La celebration se re-declenche immediatement (ou apres un court delai).
- **Multiple relances** : l'utilisateur peut relancer le guide autant de fois qu'il veut. Chaque relance remet le guide a l'etat "actif".

## Scenarios e2e

1. Un utilisateur a complete les etapes 1, 2 et 3. Il va sur /depenses et marque une charge comme payee. L'etape 4 se coche. Des confettis apparaissent sur l'ecran. Apres quelques secondes, la barre du guide disparait. Il continue a naviguer normalement, la barre n'est plus la.

2. Un mois plus tard, l'utilisateur va dans /parametres. Il voit "Revoir le guide de configuration". Il clique. La barre du guide reapparait en bas avec l'etat actuel. Les 4 etapes sont cochees (ses donnees existent toujours). Il peut refermer le guide.

## Technical Notes

- **Animation confetti** : utiliser `canvas-confetti` (~3KB) ou un composant CSS pur. Le choix sera fait par le Builder.
- **Mise a jour DB** : a la completion, mettre a jour `setup_guide.completed_at = NOW()`. A la relance, mettre a jour `setup_guide.reset_at = NOW()` et `setup_guide.completed_at = NULL`.
- **Option parametres** : ajouter un lien/bouton dans la page /parametres existante. Pas de nouvelle page.
- **Server action** : creer une action `resetSetupGuide()` pour la relance depuis les parametres.
