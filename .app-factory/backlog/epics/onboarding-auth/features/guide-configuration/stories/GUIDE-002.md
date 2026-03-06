# GUIDE-002 — Les etapes se cochent automatiquement quand je configure mon budget

## Metadata

| Champ | Valeur |
|-------|--------|
| ID | GUIDE-002 |
| Type | FEATURE |
| Feature parent | guide-configuration |
| Size | S |
| Dependencies | GUIDE-001 |

## Description

En tant que nouvel utilisateur, je veux que les etapes du guide se cochent automatiquement quand je fais les actions correspondantes, afin de suivre ma progression sans effort et sans action manuelle.

Cette story couvre : le branchement de la detection automatique sur les 4 server actions existantes (revenus, charges, generation du mois, paiement), la mise a jour reactive de la barre et du bottom sheet, et la gestion du cas ou l'utilisateur supprime ses donnees.

## Criteres d'acceptation

**AC-1 : Detection automatique — Revenu recurrent**
- Given l'etape "Ajouter un revenu recurrent" n'est pas cochee
- When l'utilisateur cree un revenu recurrent sur /parametres/revenus
- Then l'etape se coche automatiquement sans action manuelle
- And la barre met a jour "Etape suivante" vers l'etape suivante non completee

**AC-2 : Detection automatique — Charge fixe**
- Given l'etape "Ajouter une charge fixe" n'est pas cochee
- When l'utilisateur cree une charge fixe sur /parametres/depenses
- Then l'etape se coche automatiquement
- And la barre met a jour "Etape suivante"

**AC-3 : Detection automatique — Generation du mois**
- Given l'etape "Generer le mois courant" n'est pas cochee
- When l'utilisateur genere le mois courant sur /depenses
- Then l'etape se coche automatiquement
- And la barre met a jour "Etape suivante"

**AC-4 : Detection automatique — Marquer une depense payee**
- Given l'etape "Marquer une depense payee" n'est pas cochee
- When l'utilisateur marque au moins une depense comme payee
- Then l'etape se coche automatiquement

**AC-5 : Decochage si donnees supprimees**
- Given l'etape "Ajouter un revenu recurrent" est cochee (1 revenu existe)
- When l'utilisateur supprime son seul revenu recurrent
- Then l'etape se decoche (la detection est basee sur l'etat reel des donnees)
- And la barre affiche a nouveau cette etape comme "Etape suivante" si c'est la premiere non completee

## Edge cases

- **Ordre non sequentiel** : l'utilisateur peut completer les etapes dans n'importe quel ordre (ex: generer le mois avant d'ajouter un revenu). La barre affiche toujours la premiere etape non completee dans l'ordre defini (1, 2, 3, 4).
- **Actions multiples rapides** : si l'utilisateur cree un revenu puis une charge dans la meme session, les deux etapes se cochent au prochain rafraichissement sans conflit.
- **Completions partielles** : si l'utilisateur a 2 revenus et en supprime un, l'etape reste cochee (condition >= 1). Si il supprime les deux, l'etape se decoche.

## Scenarios e2e

1. Un nouvel utilisateur voit le guide avec les 4 etapes non cochees. Il va sur /parametres/revenus et cree un revenu de 3000$ mensuel. Il revient sur la page d'accueil. La barre affiche "Etape suivante : Ajouter une charge fixe". Il ouvre le bottom sheet : l'etape 1 est cochee en vert, les etapes 2-4 sont a faire.

2. Un utilisateur a complete les etapes 1 et 2. Il supprime sa seule charge fixe. La barre revient a "Etape suivante : Ajouter une charge fixe".

## Technical Notes

- **Mecanisme de rafraichissement** : apres chaque server action qui touche les tables concernees (incomes, expenses, monthly_expenses), appeler `revalidatePath` ou `revalidateTag` pour que le composant guide se re-rende avec l'etat a jour.
- **Pas de WebSocket** : la detection se fait au chargement de page ou apres une server action. Pas de push temps reel (exclusion explicite du brief).
- **Server actions a modifier** : les actions existantes de creation/suppression de revenus, charges, generation mensuelle, et toggle paiement doivent declencher la revalidation du guide.
- **Performance** : la requete de detection (4 EXISTS) est deja implementee dans GUIDE-001. Ici, on branche le rafraichissement apres les actions.
