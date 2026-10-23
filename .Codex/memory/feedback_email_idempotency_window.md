# Fenêtre de déduplication des courriels

What happened : la reprise durable d’une invitation valable7jours utilisait une clé Resend stable sans borner ses tentatives ; la revue a relevé un risque de doublon après24h et un payload changeant avec EMAIL_FROM/template.
Why it happened : on confondait durée de vie métier, durabilité locale et contrat de déduplication temporaire du fournisseur.
How to prevent : vérifier la fenêtre fournisseur, ancrer les retries à la première tentative, figer tous les champs du payload et versionner le renderer. Vérifier le hash d’un jeton régénéré. Après fenêtre sûre, expliciter l’incertitude et réconcilier avant tout nouvel envoi. Tester un accusé perdu puis reprise au-delà de la fenêtre ; ne pas promettre exactly-once sur une durée que le fournisseur ne couvre pas.
