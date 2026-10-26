# Commandes Next et configurations générées

What happened : next typegen a réécrit un import next-env préexistant, alors que les builds avaient déjà une restauration explicite.
Why it happened : la protection ne couvrait que build/dev ; typegen produit aussi des fichiers et peut actualiser la configuration.
How to prevent : snapshot octet avant toute commande Next génératrice, restaurer en finally, conserver le diff humain. Après déplacement de routes, régénérer les validateurs obsolètes par la commande officielle, sans affaiblir tsconfig ou supprimer des vérifications.

Next 16.4 peut encore écrire après Ready, y compris root-params.d.ts : une restauration ponctuelle est insuffisante. Surveiller les fichiers durant dev, n’accepter que les globs exacts générés et préserver les changements humains, y compris leur formatage. agentRules:false évite de générer des instructions AGENTS.md sans gestion explicite du dépôt.

Ne pas lancer build/typegen pendant dev : les dossiers de sortie distincts ne séparent pas tsconfig/next-env. Le garde arrête à raison le runtime sur une écriture de build non reconnue ; terminer la commande génératrice, restaurer puis redémarrer dev.
