# Montants exacts et état financier courant

What happened : la revue a trouvé une création de centime par transfert de 0.005 et une réception automatique figeant un ancien montant après édition du template.
Why it happened : validation nombre générique puis arrondis SQL séparés ; génération puis réception considérées séparément sans protéger leur frontière.
How to prevent : valider des centimes avant SQL, consommer la valeur parsée et tester les limites de précision. Tolérer uniquement le bruit binaire, pas arrondir une fraction de cent entrée.
Calculer et recevoir depuis les templates courants sous les mêmes verrous, dans une instruction atomique ; conserver les overrides et montants déjà reçus.
Tester les vraies actions avec édition entre génération et réception, pas une fixture mettant aussi à jour l’instance à leur place.
Pour observer un writer bloqué depuis une transaction, rafraîchir pg_stat_clear_snapshot() avant pg_stat_activity : les statistiques peuvent rester figées dans la transaction de l’observateur.

Pour les preuvesSQL, qualifier ORDER BY avec la colonne numérique d’origine quand la projection utilise amount::text. L’aliastexte peut sinon imposer un tri lexical et faire échouer le vérificateur malgré des montants corrects ; ne jamais corriger les données pour compenser ce défaut du test.
