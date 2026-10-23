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


## Contribution du créateur avant adhésion — 2026-10-23T21:07UTC
Utilisateur autorise poursuite ; IAB6 montre motdepasse toujoursvide, aucuneinscriptionsoumise. Avancée indépendante : création via vraieUI d’une dépenseponctuellefictive12.34, statutUPCOMING, dans le seul espace dédié. Reload réel conserve ligne/montant ; sélecteur vers personnel puispageDépenses montre0ligne, retourcouple/pageDépenses retrouvecontribution. LectureSQLread-only confirme une seuleligneamount12.34 dansbonspace et1membre. Preuvesprivéescreator-contribution-proof.json etcapturescreator-contribution-reloaded.png/personal-space-no-contribution.png réellementvues, sansdéfautvisuelobservé. CettepreuveneprouvepascontributiondeB ouaccèsaprèsadhésion. Handoffcredential/conditions toujoursnécessaire ; pasderequêteAuthparAPIpourcontourner. Pasdenouvelenvoi/DBsource/push.


## Revenu récurrent et paramètres séparés — 2026-10-23T21:10UTC

Validation indépendante pendant le handoff : un modèle de salaire fictif mensuel de 2 345,67 créé via la vraie UI dans le seul espace Resend. Sa première consultation génère une ligne mensuelle attendue. Réception explicite de 2 300,12 via la modale, puis recharge, aller-retour personnel/couple et nouvelle recharge : statut Reçu et montant conservés. Lecture SQL en transaction READ ONLY : un modèle, une seule ligne mensuelle, expected_amount2345.67 et actual_amount2300.12, même espace. La preuve porte sur cette génération/réception, pas sur tous les automatismes du produit.

Rappels du couple : ajout du14j à1/3/7 via Réglages, sauvegarde puis recharge. Le personnel conserve1/3/7 et ne contient pas le salaire récurrent ; son ancienne prime ponctuelle reste125.25. Ces données personnelles n’ont pas été écrites pendant le test. SQL confirme les deux listes distinctes. Guide couple2/4, personnel0/4 observés ; cela ne remplace pas la recette exhaustive du guide.

Preuves privées : recurring-settings-proof.json et quatre captures recurring-income-received-reloaded.png, shared-reminders-reloaded.png, personal-income-no-shared-salary.png, personal-reminders-unchanged.png. Captures effectivement vues sur viewportChrome1512px ; montant lisible, aucune collision/troncature du contenu financier observée. Ellipse du nom dans le sélecteur étroit prévue par son style, option complète disponible. Aucun PlaywrightMCP/mobile375 revendiqué. Le formulaire destinataire est encore sans mot de passe, aucune soumission ou adhésion.
