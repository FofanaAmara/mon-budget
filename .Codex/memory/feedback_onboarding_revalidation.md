# Revalidation d’un parcours de création

What happened : une vraie panne SMTP après création du premier espace était enregistrée, mais la revalidation RSC faisait sortir l’utilisateur du formulaire sans afficher son erreur ni sa reprise.

Why it happened : le garde d’entrée « possède déjà un espace » réévaluait pendant le parcours l’état que ce parcours venait lui-même de créer ; il démontait donc son interface de récupération.

How to prevent : distinguer orientation d’une nouvelle visite et état d’un parcours déjà monté. Conserver la première décision d’entrée dans ce dernier ; tester une mutation partiellement réussie, un vrai échec de transport et une vraie visite à froid. Garder le parcours sous la frontière d’identité : ne jamais figer Auth, appartenance ou autorisation dans ce snapshot. Les tests SSR des redirections ne prouvent pas le maintien d’état pendant RSC ; compléter par le vrai navigateur et une preuve persistante sans doublons.
