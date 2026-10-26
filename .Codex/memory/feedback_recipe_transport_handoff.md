# Transport email actif au transfert de recette

What happened : après un test réel Resend, l’app restait lancée avec--resend ; l’humain utilisait une adresse fictive en attendant Mailpit.
Why : la configuration par défaut du code était correcte, mais le processus laissé actif utilisait encore le mode exceptionnel.
How to prevent : vérifier le mode effectif du processus au transfert de recette. Revenir au défautMailpit après preuve externe, annoncer explicitement tout maintienResend. Ne pas assimiler fournisseuraccepted et réception. Pour récupération locale, distinguer copieMailpit et nouvelle livraisonapp ; ne pasmodifierdurabilité/idempotence ni renvoyerexterneaveuglément.

Managed Auth emails are a separate channel from application SMTP: Mailpit mode captured invitations, while Neon OTP still used hosted delivery. Before calling a recipe fully local, map each email origin/transport. Do not add a verification-code UX as an assumed requirement; the user explicitly removed it and DEC005 now uses the original invitation link as proof.
