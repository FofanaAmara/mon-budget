# Sessions Auth en rendu serveur

What happened : après mise à niveau Neon, un getSession en RSC a essayé d’écrire des cookies ; un contexte dit read-only a aussi révélé un second GET implicite sans les flags de lecture.
Why it happened : la méthode serveur du SDK renouvelle un cache local et mint une session après Set-Cookie. Les options du premier GET ne couvrent pas toutes ses opérations internes.
How to prevent : tester le véritable adaptateur installé avec une réponse Set-Cookie et cookies.set interdit en RSC. Réserver le SDK mutable aux actions/handlers ; lecteur RSC autoritatif borné, sans cache ni refresh ni mutation. Tester le nombre de requêtes, le préfixe URL, les cookies filtrés et les erreurs, pas uniquement la valeur renvoyée. Rechercher tous les appels directs et tous les comportements par défaut, y compris les lectures annexes d’onboarding : corriger uniquement les invitations laisse le défaut sur les autres pages. Les décisions de destinataire demandent une session fraîche avec le type d’option attendu par le SDK.

What happened : la centralisation de trois boutons de déconnexion laissait le quatrième chemin /auth/sign-out du SDK, dont finally naviguait même en échec.
Why it happened : l’inventaire regardait les boutons financiers sans suivre les routes publiques de changement de compte.
How to prevent : rechercher tous les signOut et tous les AuthView/chemins d’auth ; tester les erreurs et le retour d’invitation, invalider les vues avant await et garder la navigation tardive par montage. Les comportements de SDK ne sont pas supposés sûrs par leur seul nom.

What happened : une garde du layout financier laissait onboarding/choix/invitations hors protection ; une saisie de A pouvait créer pour B après changement de session.
Why it happened : la revue suivait les routes financières mais pas les entrées privées sans spaceId ; authentifier l’action ne liait pas son brouillon à l’acteur de départ.
How to prevent : inventorier toutes les pages privées, y compris onboarding et confirmations. Garder chaque entrée et imposer un acteur attendu comparé à Auth avant création/envoi ; arrêter les étapes suivantes après démontage. Keyer la sous-arborescence privée par acteur pour effacer les états lors d’une actualisation sous un autre compte. Tests PG sans écriture en cas de divergence, puis recette réelle multi-onglets distincte.
