# Actions fixes et colonnes de montants

What happened : le FAB des depenses cachait1450surmobile ; le total du groupe et les lignes avaient des bords droits differents.
Why it happened : le guide rehaussait le FAB au-dessus de lignes intermediaires ; chevron et bouton de paiement reservaient des largeurs/gaps differents, et certaines lignes n'ont pas d'action.
How to prevent : une marge en fin de page ne protege pas les lignes intermediaires d'un bouton fixed. Preferer une action dans le flux lorsque les chiffres doivent rester lisibles. Pour les listes financieres, partager le rail de controle entre en-tete et toutes variantes de lignes, y compris sans action. Reproduire avec petits/grands montants et guide visible ; garder les captures avant/apres et comparer visuellement. Un viewport capture pendant l'animation du guide ne prouve pas l'etat final.


What happened : une page de refus sans navigation héritait du padding inférieur global68px et montrait une bande pâle/scroll artificiel. La première capture après réglage viewport ne correspondait pas encore aux dimensions demandées.
Why it happened : le reset onboarding retirait seulement le padding supérieur ; le nom du fichier avait repris la taille demandée sans vérifier les pixels effectifs.
How to prevent : sur les écrans sans chrome financier, vérifier tous les espaces réservés à ce chrome. Après changement de viewport, laisser appliquer/recharger, vérifier les dimensions effectives et scanner le nouveau screenshot. Un nom375 ne certifie pas375pixels ; conserver les anciennes captures avec leur limite et faire valider l'image finale.

Récurrence23octobre : FAB allocation couvre aussi reste libre2070.17 ; appliquer la même action dans le flux aux écrans financiers restants. Une capture nomméeafter avant rechargement peut encore contenir ancienHMR ; comparer le rendu effectif et exclure explicitement cette capture des preuves finales.
