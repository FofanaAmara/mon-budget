# DISC-ESP-017 — Revalidation de l’onboarding et reprise d’invitation

**État :** correction vérifiée localement, 26 octobre 2026. **Story :** ESP-006/AC-4.

Recette réelle MCP sur copie locale possédée, transport Mailpit/SMTP loopback volontairement indisponible. Le premier espace est créé et l’invitation est enregistrée `failed`, mais l’utilisateur arrive dans `/espaces` sans erreur ni choix de reprise. Capture privée `mcp-first-shared-smtp-failure-redirect-before.png` inspectée ; SQL READ ONLY confirme un seul espace et une invitation pending/failed.

Cause : le garde serveur `/onboarding` réévalue la présence d’un espace lors des revalidations des actions ; la redirection d’entrée démonte le formulaire pendant son propre parcours. Le même mécanisme avait empêché de conclure le test de perte de réponse après envoi réellement réussi.

Correction : conserver la destination d’entrée initiale dans un garde React monté sous la frontière d’identité. Une vraie nouvelle visite garde ses redirections espaces/invitations ; une mise à jour RSC du parcours en cours conserve le formulaire, son espace durable et ses choix de reprise. Aucun droit ni état financier modifié. Test de rendu des vraies pages, puis RED/GREEN dans l’app via MCP sur la même panne, qualité et revue distincte nécessaires avant clôture.

Vérifié : vrai GREEN MCP sur même panne, erreur/choix présents375/1200, continuer seul conserve une dépense7.89 ; nouvelle visite redirige correctement. SMTP rétabli puis retry reçu dans Mailpit, SQL un espace/uneinvitation et deux tentativesfailed/sent.266unit/20fichiers, build/types/lint/11delivery verts, revue distincte favorable du diff. Preuve SMTP-RECOVERY-MCP et limites dans resend-real-execution.md. Pas de confiance TLS durable, CI distante ou release déduites.
