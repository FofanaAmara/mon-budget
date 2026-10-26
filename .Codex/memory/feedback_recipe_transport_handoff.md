# Transport email actif au transfert de recette

What happened : après un test réel Resend, l’app restait lancée avec--resend ; l’humain utilisait une adresse fictive en attendant Mailpit.
Why : la configuration par défaut du code était correcte, mais le processus laissé actif utilisait encore le mode exceptionnel.
How to prevent : vérifier le mode effectif du processus au transfert de recette. Revenir au défautMailpit après preuve externe, annoncer explicitement tout maintienResend. Ne pas assimiler fournisseuraccepted et réception. Pour récupération locale, distinguer copieMailpit et nouvelle livraisonapp ; ne pasmodifierdurabilité/idempotence ni renvoyerexterneaveuglément.
