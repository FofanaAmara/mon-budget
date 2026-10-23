# Avancement et sens métier des lignes

What happened : le guide comptait le pot technique d’épargne comme une dépense configurée et montrait1/4 sur un espace sans dépenses.
Why it happened : projets, épargne libre et dépenses partagent expenses ; EXISTS sur la table physique ne respecte pas cette distinction métier.
How to prevent : définir le prédicat métier de chaque étape et exclure les catégories techniques. Préserver les variantes historiquement admises, iciRECURRING etONE_TIME actifs. Tester le pot technique, l’objectif et la ligne inactive avant le cas positif, sur PostgreSQL réel. Un count/EXISTS non vide ne prouve pas que l’action utilisateur attendue a été effectuée.
