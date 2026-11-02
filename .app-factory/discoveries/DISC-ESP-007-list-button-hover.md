# DISC-ESP-007 — Boutons primaires illisibles dans une liste

2026-10-23. Statut : corrigé, validé visuellement et revu indépendamment. Travail direct adhoc.

La règle .space-list button:hover éclaircissait tous les boutons des listes, y compris le primaire vert à texte blanc ; le formulaire OTP rendait ce défaut visible lors du déplacement du contenu sous le pointeur. La règle est limitée aux .space-settings-row. Le survol primaire exclut les boutons désactivés ; ces derniers ont un fond gris et un texte sombre lisible, sans opacité globale.
Captures réelles avant/après mobile375etdesktop1280, états vide/prêt. Pas de défaut restant constaté par revue. Aucune modification d’action ou de calcul financier. Preuve : invitation-verification-execution.md.
