# Commandes Next et configurations générées

What happened : next typegen a réécrit un import next-env préexistant, alors que les builds avaient déjà une restauration explicite.
Why it happened : la protection ne couvrait que build/dev ; typegen produit aussi des fichiers et peut actualiser la configuration.
How to prevent : snapshot octet avant toute commande Next génératrice, restaurer en finally, conserver le diff humain. Après déplacement de routes, régénérer les validateurs obsolètes par la commande officielle, sans affaiblir tsconfig ou supprimer des vérifications.
