# Portée des styles de boutons dans les listes

What happened : le bouton primaire OTP devenait illisible au survol ; une ancienne règle .space-list button:hover remplaçait son fond vert par un fond pâle, sans changer le texte blanc.
Why it happened : un sélecteur visant un élément HTML sous un conteneur de mise en page s’appliquait à tous les nouveaux boutons ajoutés dans ce conteneur. Une opacité générale rendait aussi le disabled trop faible.
How to prevent : cibler le composant visé (.space-settings-row), garder les variantes primaire/secondaire/désactivée cohérentes et vérifier les états hover/focus/disabled. Lorsqu’un contenu change sous le pointeur, scanner le screenshot immédiatement : un défaut de survol peut apparaître sans mouvement du curseur. Captures avant/après avec vrai formulaire et revue, pas de test miroir CSS.
