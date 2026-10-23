# Actions fixes et colonnes de montants

What happened : le FAB des depenses cachait1450surmobile ; le total du groupe et les lignes avaient des bords droits differents.
Why it happened : le guide rehaussait le FAB au-dessus de lignes intermediaires ; chevron et bouton de paiement reservaient des largeurs/gaps differents, et certaines lignes n'ont pas d'action.
How to prevent : une marge en fin de page ne protege pas les lignes intermediaires d'un bouton fixed. Preferer une action dans le flux lorsque les chiffres doivent rester lisibles. Pour les listes financieres, partager le rail de controle entre en-tete et toutes variantes de lignes, y compris sans action. Reproduire avec petits/grands montants et guide visible ; garder les captures avant/apres et comparer visuellement. Un viewport capture pendant l'animation du guide ne prouve pas l'etat final.
