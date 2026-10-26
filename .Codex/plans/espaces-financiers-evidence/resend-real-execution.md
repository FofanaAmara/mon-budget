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


## Catégorie, carte et dépense récurrente — 2026-10-23T21:15UTC

Une catégorie dédiée et une carte de suivi entièrement fictive (0000, banque fictive) créées via UI, puis utilisées par un abonnement mensuel fictif39.99, jour1, option automatique activée. Il s’agit de suivi local, sans compte bancaire créé ni prélèvement réel. Consultation du mois puis recharge et aller-retour personnel/couple : ligne39.99 Payé conservée, contributionA12.34 distincte. SQLREADONLY confirme un seul modèle et une seule occurrence mensuelle, statutPAID/is_auto_chargedtrue et mêmes section_id/card_id/espace sur modèle et occurrence. Personnel : aucune dépense, aucune carte, catégorie dédiée absente, contrôlés via UI. Preuve privée recurring-expense-references-proof.json.

La recette a reproduit une double croix dans Carte/Catégorie (DISC-ESP-013). Correction source dans cinq composants en retirant le helper redondant et son import, bouton original conservé. Captures avant/après réelles des deux écrans, unicité DOM en complément, clic de fermeture carte et création fonctionnelle de carte/catégorie. ViewportCSS375x812 confirmé ; exports mobiles JPEG372x806, malgré noms.png, métadonnées documentées dans modal-image-dimensions.json. Desktop1512x862 et1509x860. Première image « après » encore ancienne faute de HMR : conservée sous card-modal-stale-before-reload.png, pas comptée en succès. Rechargement réel puis image corrigée inspectée.

Quality20493 exit0 : buildWebpack, types, lint,9delivery dans copie isolée ; unités33834 exit0 :265/20fichiers. Revue React selon vercel:react-best-practices : diff limité à suppression des duplications, aucun hook, état, fetch ou contrat serveur modifié ; header et nom accessible de fermeture maintenus. Aucune dépendance ajoutée. Pas de test miroir pour dix lignes supprimées. Les trois autres modales corrigées dans le même motif source restent à exercer visuellement en vraie UI ; aucune validation globale indépendante ou PlaywrightMCP déduite de cette relecture.

Captures dépense : recurring-expense-auto-reloaded.png prise pendant animation du guide ; ne prouve pas layout stable. recurring-expense-auto-steady.png après disparition du guide réellement scannée : pas de chiffre masqué ni collision. Le texte transitoire4/4 « mi-chemin » est consigné comme observation à reprendre avant clôture. Objectif incomplet ; aucune inscriptionB/adhésion encore prouvée.


## Patrimoine et actualisation d’une sélection — 2026-10-23T21:21UTC

Objectif fictif1000, contribution123.45, historique d’une contribution inspecté après recharge. Dette fictive500, deux charges25.50 et5, versement75.25 ; solde455.25 après recharge. SQLREADONLY : une contribution et trois transactions exactes, toutes reliées aux entités du même espace. Autres espaces non écrits ; personnel ne contient ni objectif ni dette dédiés, et retourcouple conserve les données. Preuve privée patrimoine-proof.json.

Les trois autres modales de DISC013 ont été réellement ouvertes et capturées sur desktop/mobile : savings-history-*, debt-charge-*, debt-payment-mobile.jpg ; une seule fermeture, contenu lisible, aucune superposition interne observée. Les captures exportées sont redimensionnées, ne pas confondre pixelsimage et viewportCSS375x812. Fermeture historique via bouton, charge/versement soumis ; aucun véritable produit ou paiement financier. La distinction visuelle régulier/supplémentaire n’est pas recertifiée par cette opération : journal serveur vérifié de sourceEXTRA_PAYMENT.

DISC014 : écart réel525.50danspage/500dansmodale reproduit, causeobjet sélectionné figé dans étatReact. CorrectionProjetsEpargneClient : sixIDs et recherche des entités dans les collections fraîches ; champs de brouillon séparés, cible disparue masquée. Vraie course rejouée après correction : pageetmodale530.50, puis versement75.25/reload455.25. Screenshots dette avant/après effectivement vus.

Nouveau banc `npm run test:spaces:selection` : vrai parent et vraies feuilles, données/serveurs simulés, aucun accèsAuth/DB. Ancien composantdc01350 rejoué dans copie isolée : exit1, timeout sur525.50 attendu dans modale ; source corrigée restaurée parfinally. Trois cas verts en racine97930 et copie88052 : refreshpréservebrouillon75.25 et metsolde525.50/prévision450.25, historique actualisé200, disparitiondeladette ferme cible. Ce n’est pas le gatePlaywrightMCP ou la recette à deux membres. Le scénario navigateur CUA réel ci-dessus fournit la preuve complémentaire sur l’app.

Qualité finale55948 : buildWebpack/types/lint/9delivery exit0 dans copie isolée incluant nouveau banc et workflow.265unit77992 exit0 ; bancnavigation14497 exit0, six cas sans erreurpage. RevueReact locale du diff : aucun nouveau fetch/effect, étatminimalID et brouillons non écrasés, pas de logique financière serveur changée. La revue indépendante globale reste ouverte. Commande ciblée ajoutée à la CI et garde requis, aucun push/run distant.

Diagnostic du mail reçu : Gmail SPF/DKIM/DMARC tousPASS, capture du résumé et JSON anonymisé conservésprivés ; ne pas attribuer le spam à un échecDNS non observé. Nouveau compte toujours non soumis, handoff maintenu et aucun secondemailenvoyé. Texteguide4/4 restant déjà tracé ; objectif intégral nonatteint.


## Transfert entre pots et guide — 2026-10-23T21:31UTC

Transfert réel dans la copie locale, viaUI et sans virement bancaire :23.45 du projet vers l’épargnelibre. Au préalable,200 dépasse123.45disponibles et le bouton est désactivé ; aucune soumission de ce montant. Après transfert/reload : projet100.00, libre23.45, total123.45 conservé et dette455.25 inchangée. SQLREADONLY confirme contributions123.45/−23.45/+23.45 dans le même espace. Personnel garde0.00 et aucun objectif dédié aprèsbascule. transfer-proof.json checked21:29:12Z ; captures preview/reload inspectées.

Premier vérificateurSQL a échoué sur l’ordre des trois montants, car ORDER BYamount utilisait l’alias amount::text et triait lexicalement. Aucun écart des données : correction du seul vérificateur en ORDER BYs.amount numérique, preuve rerunverte ; aucune mutation compensatrice. Pattern ajouté à la mémoiremontants.

Guide4/4 : reproduit via boutonRevoir qui ne touche qu’au suivi de guide. Branchetextuelle complète manquante corrigée, capturesguide-complete-before/afterdesktop/mobile effectivement vues ; « Tout est prêt ! » au lieu de « Déjà à mi-chemin ! ». Pas de nouveau test miroir pour une phrase. Ne pas confondre le délai de célébration15s avec une attente du goal.

DISC015 : guide personnel1/4 alors que seul potlibre0. EXISTSexpenses active comptaitPLANNED/FREE_SAVINGS. Filtrage aux typesRECURRING/ONE_TIME actifs, préservant ponctuelleshistoriques. REDPG39076 confirme falseattendu/trueobtenu ; GREEN81042 :100tests sur6fichiers, clones synthétiques. Aucun reset ou nouvelle migration sur recette/source. VraieUI personnelle aprèsreload0/4 ; première capture après prise pendant animation conservée, image stable guide-free-pot-after-steady.jpg retenue. SQLguide-progress-proof.json21:31:17Z : couple4vrais, personnel4faux et épargne personnelle0.00. Retourcouple conserve données ; aucun effetd’une réinitialisation de guide partagé sur personnel.

Qualité finale56136 : buildWebpack/types/lint/9delivery tous0 en copie isolée incluant les deux correctionsguide et le testPG.265unit du commit précédent gardent leur portée ; pas de nouveau run unitaire revendiqué après cette phrase/prédicat. RéceptionResend déjàacquise mais créationcompte/adhésionB toujoursabsentes, markHandoffIAB6maintenu. Pasdegoalcomplete/MCP/CI distante ni push.


## ALLOCATION-PROGRESSIVE-REAL — 2026-10-23

Recette CUA authentifiée dans le seul espace fictif Resend. Modèle d’allocation250.00, surcharge mensuelle275.50 et note persistées après recharge ; revenu attendu2345.67, disponible2070.17. Dépense récurrente progressive200.00, un achat3.99, historique unique et consommé3.99. Avec abonnement39.99, totalconsommé43.98, attendu289.99, restant246.01, imprévu12.34 séparé. Aucun mouvement bancaire réel.

SQLREADONLY sur copie possédée spaces_work17, garde identitéDocker : modèle250.00 distinct de surcharge275.50 octobre2026 ;1transaction3.99 et paid_amount3.99, références mêmeespace. Personnel0allocation/0transaction/0dépense, confirmé dans vraieUI après sélecteur. Preuve privée allocation-progressive-proof.json à21:38:43UTC, captures allocation-template-reloaded.jpg, allocation-monthly-override.jpg, progressive-after-consumption.jpg etprogressive-history.jpg.

Défaut mobile reproduit : FAB masque2070.17 (allocation-progressive-mobile.jpg). Remplacé par bouton dans le flux, mêmecondition mois courant/callback ; recharge requise carHMR n’avait pas appliqué le changement. allocation-action-mobile-after.jpg est encore l’ancien rendu, explicitement NONretenue comme preuveaprès. Captures finales allocation-action-mobile-fixed.jpg(pageentière), allocation-action-mobile-bottom.jpg(viewportaprèsEnd) etallocation-action-desktop-fixed.jpg inspectées : montant et bouton lisibles ; ouverturemodale et fermeture vérifiées sans nouvelle saisie. DISC-ESP-016.

Qualité isolée26788 : build/types/lint/9delivery tous0. Pas de tests miroirCSS ; dernières suites265unit/100PG d’autres tranches ne sont pas prétendues rejouées ici. Ni CI distante, ni PlaywrightMCP, ni revueglobale ajoutés. Inscription destinataire encore motdepassevide, pas d’acceptation ni secondmembre. Aucune nouvelle invitation/env/sourceDB/push.


## MCP-INVITATION-ENTRY — 23 octobre, après intervention humaine

L’humain a lui-même passé l’avertissement du navigateurPlaywright puis confirmé «c’est bon». Le vrai MCPPlaywright lit ensuite landing, puis ouvre le lien de la même invitationResend déjà reçue. Page explicite «Tu as été invité dans un espace», espaceRecetteResendCouple, auteur et deux liens connexion/inscription constatés dans snapshotMCP. Capture privée mcp-invitation-landing-desktop.png,1200x762, inspectée visuellement sur tout le viewport : contenu lisible, aucun chevauchement ou élément coupé.

Clic réelMCP surCréeruncompte : AuthView existant, redirectTo d’invitation conservé dans l’URL et lienConnexion. Nom/adresse de recette préremplis viaMCP ; motdepasse laissé vide, aucune soumission/acceptation de conditions. Capture privée mcp-signup-handoff.png inspectée, mêmeviewport ; formulaire lisible. Handoff demandé à l’humain dans cette même fenêtrePlaywright. Aucun envoi supplémentaire, membre ajouté, secret saisi ou session fabriquée.

Cette preuve lève l’absence d’accès général au MCP ; elle ne clôt pas le gate visuel complet ni mobile ni Auth/adhésion/contributions. L’exception a été donnée manuellement par l’humain : aucune preuve de confianceTLSinstallée ou de serviceworker/offline fonctionnel, et aucun ignoreHTTPSErrors utilisé par l’agent. Runtime27656, app3443, copie locale intacte. PréparationHTTPS dffe7aa inchangée.


## NEW-ACCOUNT-REAL — 26 octobre 2026

Recette effectuée dans la vraie app, copie PostgreSQL possédée, via MCPPlaywright pour le parcours destinataire. Inscription réelle du compte dédié puis retour conservé vers l’invitation initialeResend reçue le23octobre. Le fournisseurNeon envoie un vrai courrielOTP «Verify Your Email Address - mon-budget», reçu dans la boîte Gmail autorisée et lu via Chrome/CUA. Code reçu saisi dans l’UI MCP ; état vérifié, puis écran d’acceptation distinct. Aucun utilisateur, session ou indicateur verified fabriqué enbase. Credential de recette privé0600 sous.local/resend-recipe, jamais commité ni imprimé dans le rapport.

Avant consentement : ouverture directe couple/depenses dans un deuxième onglet du même compte →404générique sans finances. Retour à l’invitation puis clicAccepter : bienvenue/membre, ouverture du bon espace, sélecteur à une seule option désactivée. Présentation habituelle passée, aucun espacepersonnel créé obligatoirement. Les quatre dépenses et configurations précédentes sont retrouvées.

ContributionA12.34 existante vueparB ; contributionB23.45 ajoutée viaMCP dans catégorieRecetteResend, rechargecomplète puis5dépenses, imprévus35.79. SessionChrome du créateurA réellement distincte : fiche2membres, navigation/recharge puis contributionB visible. ContrôleSQLREADONLY du26octobre16:48:11UTC, gardeDocker/cluster : invitationaccepted,2membres, Buneappartenanceunique, aucunpersonnelimposé, deuxauteursdistincts avec montants12.34/23.45, espacepersonnelA0dépense. Preuve privée new-recipient-membership-proof.json.

B tente ensuite l’URLpersonnelle deA →404 ; revisite du lienutilisé → «Cette invitation a déjà été acceptée», aucun nouveau bouton d’acceptation. Cela prouve la reprise UI idempotente, pas une nouvelle coursePOSTconcurrente (preuvePG existante séparée). Le second membre renomme l’espace en«…Couple validé» viaMCP ; fiche/sélecteur changent, A retrouve ce nom aprèsreload, puis B rétablit le nom original viaUI. Finances conservées. Droits réels de contribution et renommage acquis, invitation parB et toutesfamilles ne sont pas déclarées couvertes par ce seul cas.

Captures privées inspectées : mcp-verified-before-accept.png ; mcp-before-membership-denied.png ; mcp-recipient-joined.png ; mcp-recipient-contributions-reloaded.png ; creator-sees-contribution-b.jpg ; mcp-recipient-contributions-mobile.png ; mcp-member-b-renamed-space.png ; mcp-two-members-mobile.png. DesktopMCP1200x762 etmobile375x812 ; fullpage financière mobile montre une barre fixe dans la capture longue, donc pas une preuve de lisibilité simultanée de toute la liste. Vue mobile de la fiche deuxmembres inspectée auviewport, aucune superposition nouvelle constatée. Revue des colonnes de montants complétée par mesuresDOM : même borddroit1004.5 pour les9zones observées ; aucunfixCSS supplémentaire nécessaire. Retourbureau1200x762.

Cette tranche prouve le parcours nouveaucompte/OTP/acceptation/contribution partagée. Elle ne clôture pas le goal : trajet invitation à compte déjàexistant, intégralité des fonctions et automatismes, autrescasclavier/mobile/caches/offline, revueindépendante etCIexactSHA encoreouverts. TLS est une exception manuelle antérieure, pas une confiance durable prouvée. Aucunpush, schéma/Authfabriqué, DBsource/env/trousseau ou paiement réel modifié. Seuls envois autorisés du test : invitationResend initiale et OTPNeon demandé aujourd’hui.
