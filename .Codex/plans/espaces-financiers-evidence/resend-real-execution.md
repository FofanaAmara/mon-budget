# Réception Resend réelle — 2026-10-23

## Autorisation et périmètre
L’humain a fourni l’adresse contrôlée et sa session GmailChrome, autorisé envoi/lecture du message de recette et inscription depuis le lien. Adresse, token, identifiants fournisseur et contenu de boîte ne sont pas versionnés. Plan parent : espaces-financiers-session-and-delivery.md, extension recette externe. Aucune publication/DBsource.

## Exécution et preuves
- Runner local explicitement lancé avec `npm run dev:spaces -- --resend`, session68803 vivante après validation de l’identité Docker/PostgreSQL. Le lancement sandbox initial a échoué sur la socketDocker ; même commande autorisée horssandbox réussie, sans modification des gardes. `.env.local` préservé, Mailpit reste le défaut sans option.
- Compte existant réel resté connecté dansChrome. Création d’un espace partagé vide dédié depuis Réglages/liste/création, sans email facultatif ; accès fiche puis envoi explicite.
- Courriel réellement reçu dansGmail à21:01UTC, classéspam. Objet/espace/texte et bouton d’invitation concordent. Aucun clic « notspam » ni modification de boîte, aucun message non lié ouvert.
- Lecture seule à21:03:10UTC surla copie locale : une invitationpending, deliverysent, une tentative et un membre. Accusé conservé, GETResend200 et last_eventdelivered, destinataire correspondant. Pas de renvoi pour créer artificiellement une preuve.
- Lien reçu ouvert dansIAB anonyme : page explicite « Tu as été invité dans un espace. », nom correct, liensconnexion/inscription existants. Passageinscription conserve exactement le retour. Nom/email préremplis ; nouveau motdepasse vide et boutoncréer non soumis.
- Mauvais compteChrome surla même invitation : message de divergence et seulement changer de compte, aucuneacceptation. IABanonyme accédant directement auxdépenses de l’espace : redirectionlanding sansfinances.

## Preuves privées et examen visuel
`.local/resend-recipe/` : gmail-invitation.png, received-link-landing.png, signup-handoff.png, wrong-recipient.png etdelivery-proof.json ; images réellement vues, pageentière sanschevauchement/troncature observée. GmailetrefusChrome1512x862/806 ; IABétroit453x755/745. Pas de largeur375 ou PlaywrightMCP revendiqués. Aucune preuve de réception anonymisée ne contient dejeton dansGit : rapportanonyme +capturesprivéesinspectées.

## Contrôles
9testsdelivery verts, syntaxeNode du runner valide, trois refusCLI avantconnexion(unknown/duplicateoption/arbitraryDBURL). ESLint par défaut ignore scripts/** ; relance explicite `eslint --no-ignore --max-warnings=0 scripts/financial-spaces/dev.mjs` réussie, zéro avertissement. Aucun TS/TSX ou logiqueapp modifié ; pas de nouveau buildapp nécessaire pour cette seule option de lancement. Les265unit/99PG/build/types/lint antérieurs conservent leurdateetportée.

## Restant
Handoff utilisateur pour saisie du nouveau motdepasse et soumission acceptant lesconditions ; la politique de l’outil impose cette étape humaine. Ne pas utiliser untransportAPI pourla contourner. Ensuite verificationmail/auth, acceptationdistincte, contributionsdeuxsessions/recharge/isolation. Classementspam : DISC-ESP-012 ; certificatnonfiable bloqueSW, offline nonrecetté. Liensconditions/confidentialité de l’inscription pointent actuellement sur# ; documentés comme limitationobservée, pas de texte légal inventé. Goal intégral nonatteint ; CI/revueglobale/MCP et autresfamilles restentouverts.
