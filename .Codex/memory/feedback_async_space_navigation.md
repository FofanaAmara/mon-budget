# Réponses asynchrones après changement d'espace

What happened : le remount des formulaires protégeait les états, mais une ancienne continuation pouvait encore router.push(A) après basculeB. Le sélecteur pouvait aussi naviguer après son propre démontage.
Why it happened : on confondait démontage React et annulation des promesses ; une fermeture garde son ancien routeur. Un simple key ne suffit pas.
How to prevent : invalider un lifetime dès l'intention de bascule, garder les effets de navigation/refresh par contexte et montage. Garder aussi la réponse du sélecteur par montage/identifiant de demande. Éviter les hardnavigations post-await qui contournent le routeur gardé.
Tester une vraie sauvegarde retardée ET une préférence retardée, avec départ avant résolution. Le banc isolé ne remplace pas E2E Next/RSC réel.
Suivre les champs par boutons comme les inputs : un écouteur DOM sur les inputs ne détecte pas un changement de fréquence ou de couleur.
