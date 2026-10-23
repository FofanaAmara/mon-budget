# Sessions privées et envois incertains

Plan parent approuvé : espaces-financiers-implementation.md, P3.4/P4.2/P7.1. Méthode directe sans AWM, décisions autonomes pendant absence.

## État et écart

Commit1c9bef8 : services et migrations testés, matrice17/30 partielle. Runtime3002 confirmé vivant. L’AuthProvider rafraîchit après ses parcours Auth, mais aucun garde ne masque explicitement les finances déjà rendues si la session devient nulle/change de compte, ni en offline ou restauration BFCache. BottomNav lit la session pour le nom seulement. Les contrôles serveur restent actifs : l’écart concerne l’affichage conservé dans les onglets.

L’envoi uncertain après23h reste volontairement sans retry ; il faut une procédure opérationnelle de vérification, sans prétendre qu’un ack fournisseur prouve la réception humaine.

## Séquence

1. Garde client autour du layout financier, attaché à l’identité validée côté serveur. Aucune finance tant que la session client est en attente/erreur/absente ou différente. Invalidation avant déconnexion, entre onglets après changement de session, au passage offline et au pagehide/BFCache. Les anciennes continuations sont démontées avec le contexte.
2. Centraliser la déconnexion et diffuser seulement un signal sans identité/finance dans localStorage. Conserver intégralement les retours Auth d’invitation ; aucun nouveau rôle ou service.
3. Tests du contrôleur d’invalidation (événements, erreurs stockage, BFCache, démontage) et rendu SSR des vraies branches du garde, plus les contrôles types/lint/build appropriés. Pas de prétendue validation visuelle ou E2E : navigateur refusé, ne pas contourner.
4. Formaliser le runbook d’envoi incertain : preuves fournisseur exactes, tentative identifiée, livraison vs réception, absence de preuve reste incertitude ; pas de mutation de production ou renvoi aveugle.
5. Revue indépendante autorisée, mise à jour matrice/preuves/état et commit local automatique sans push.

## Validation et limites

Les tests sans navigateur prouvent les états et le masquage rendu, pas un événement multi-onglets réel ou l’absence de flash à l’écran. Ce gate reste ouvert jusqu’à l’accès autorisé et PlaywrightMCP. La page de revalidation réutilise le style existant, aucun design system/Storybook. Toute interruption de brouillon liée à une invalidation de session est explicitement affichée ; la confidentialité prime en l’absence de session vérifiée.

Estimation :10–20kjetons, coût monétaire indisponible ; réévaluer après le garde. Aucun email/service payant/push/DBsource.

## Extension issue de la revue globale — 2026-10-23

État vérifié au commit de4115e : seul le layout financier contient le garde. Onboarding, choix des espaces et invitations privées gardent leur contenu après changement de compte ; la création vérifie la session courante mais pas l’acteur de la saisie. Écart P1 confirmé par revue indépendante.

Cible : appliquer le même garde aux trois entrées privées, y compris la confirmation ; refuser une création ou invitation de formulaire quand l’acteur attendu diffère de la session serveur, avant toute écriture/envoi. Le jeton public reste public. L’acteur attendu est un témoin de contexte, jamais une autorité remplaçant la session ou l’appartenance.

Séquence : (1) reproduire le refus manquant avec tests PG ; (2) étendre le contrat création/invitation et arrêter les continuations de formulaire démonté avant toute nouvelle requête ; (3) gardes privés et tests de rendu des vraies pages ; (4) types, unités, services PG, lint/build en copie isolée, revue et commit.

Pré-mortem : une option acteur facultative laisserait les anciens appelants exposés → champ obligatoire ; une création résolue après démontage pourrait lancer son email → vérifier le montage après chaque await. Mise à jour des appelants et fixtures sans changer les finances ou le schéma. Revenir par revert du commit isolé si nécessaire, aucune migration. Hypothèse : garde existant réutilisable hors layout, validée par tests de rendu. Preuve réelle multi-onglets/MCP toujours ouverte, aucun contournement du refus navigateur. Estimation6–10kjetons, coût indisponible. Autorisation d’exécution : plan parent accepté et consigne humaine de décider sans questions.

## Correction visuelle issue de la recette375px - 2026-10-23

Planparent P7/S11, autorisation de corriger les defauts observes. Deux depensesfictives3.99/1450 creees via vraieUI. Capture responsive-current/expenses-mobile-375.png : FAB fixe recouvre montant1450etboutonpayer. Cause : bouton viewportfixed sans place dans le flux, sureleve par le guide actif ; ajouter un padding en fin de liste ne protege pas les lignes intermediaires.

Correction locale : utiliser pour mobile le bouton Nouvelledepense deja dans l'entete desktop, supprimer le FAB des seules depenses. Meme action/modal/style, aucune finance modifiee. Ne pas deplacer un autre overlay ou reformater les montants pour masquer le probleme. Verification : captures avant/apres375/1280, longlibelle et3.99/1450, ouverture/fermeture modal mobile, persistancereload/bascule ; puisunit/types/lint/build en copie et revue. Revert du commit isole possible, aucune migration. Autres FAB hors ecrans observes non modifies speculativement.

Extension de la meme comparaison : total du groupe decale des lignes d'environ16px car chevron16+gap8 alors que toggle28+gap12 ; lignes progressives/historiques n'ont pas de toggle. Correction structurelle : rail commun28px reserve sur toutes les lignes et en-tetes, gap12 identique. Aucun montant ou format modifie. Capturesavant/apres3.99/1450etgroupe1453.99, revue puis checks finaux apres cette extension. Les variantes progressive/historique restent a exercer dans la vraie app si non disponibles dans cette recette.

## Refus d'acces RSC observe en vrai - 2026-10-23

CompteChromeBauthentifie, espacepriveA8777847c : requireSpace refuse correctement, mais FinancialLayout et pageSpace laissent SpaceAccessError devenir500 et overlayNext. Capture session-current/foreign-space-before.png et logs98404. Cible : refus invisible/invalide identique en404generique, sessionabsente versconnexion ; panneprovider/rollout resteerreur et ne doitpasetreconvertieen404.

Introduire un sous-type distinct de SpaceAccessError pour sessionabsente (catchdesmutationscompatible), traducteurs reserveauxpages pageIdentity/pageSpaceContext et pageSpace, rootnot-found sansidentifiant/finance. Appliquerlayout et entreesprivees/rootredirect. Tests du vraihelper/layout et nonlecturefinanceapresrefus, puis vraievisite B de l'espaceA pourpreuve404 ; validowner garde acces. Aucun changedepermission ni de controle des actions. Revertcommitlocal,aucunemigration.

Deuxcomptesexistants AetBessayescomme destinataires viaMailpitdanslesdeuxsens : tousdeuxnonverifies parAuthreel, acceptationcorrectement bloquee. Ne pas fabriqueremailVerified ou utiliserprofilDBcommeautorite. Verification gereeparNeonAuth, configurationSMTPinvitationsapp distincte. ProviderVerificationmethodlink/otp a lire dansNeonavantderaccorderleresendcorrect ; CLInoninstalle etNEON_API_KEYabsente verifie, pas de configuration source modifiee. La verificationhebergeereste ouverte ; aucun mailAuthexterne envoye ni nouveaucompte.


### Fournisseur UI et page de refus
Le refus générique a révélé un second défaut : le ThemeProvider interne à NeonAuthUIProvider injecte un script React lors du rendu de repli. Reproduit dans la vraie session Chrome ; le garde réseau reste correct. L'application conserve une palette claire fixe. Utiliser l'export public AuthUIProvider avec le client React existant, les callbacks et options désactivées équivalentes, la classe neon-auth-ui et Sonner light explicite. Sonner2.0.8 était déjà transitif ; le déclarer directement sans changer sa version. Pas de patch SDK ni de masquage console. Test SSR avec le véritable contexte, puis contrôle navigateur du refus et du retour autorisé. L'option twoFactor du fournisseur de base est un tableau facultatif : son absence conserve sa désactivation, le false interne au wrapper ne fait pas partie de son contrat typé.
Tranche estimée 10–20k jetons ; coût monétaire indisponible, aucun service payant. Préserver les deux sessions non vérifiées pour la suite, aucun changement de sécurité chez Neon. Les layouts espaces expérimentaux n'avaient pas corrigé le script ; ils sont retirés.

La revue visuelle finale ajoute la correction du padding inférieur global68px sur les seuls écrans.space-onboarding, qui n’ont pas de nav. Preuves avant/après mobile exact375x812 et desktop1280x900, puis build/types/lint rejoués ; aucun test miroir CSS ajouté.


## Vérification du destinataire depuis l'invitation — 2026-10-23

État : deux comptes existants non vérifiés, page sans renvoi du message ; la console Neon n'a pas de session connectée et aucune clé de gestion n'est configurée. Aucun changement hébergé à tenter. Source officielle lue : https://neon.com/docs/auth/guides/plugins/email-otp ; les API dédiées emailOtp.sendVerificationOtp(type=email-verification) et verifyEmail sont supportées sans installation de plugin. Ce parcours explicite ne dépend pas du mode par défaut (lien/code) à l'inscription.

Cible : page d'invitation propose de recevoir un code, de le saisir et de revérifier son adresse. Aucun envoi automatique au montage, aucun email saisi arbitrairement, aucune adhésion après la seule vérification. Actions serveur : session fraîche + acteur de départ + invitation encore valide et destinataire correspondant ; adresse dérivée de la session, jamais du client. Envoi/vérification délégués à Neon ; aucune mutation directe emailVerified ni appartenance. Après succès, nouvelle session autoritative puis recharge de la même invitation, cache Auth invalide et autres onglets prévenus. Erreurs explicites sans payload fournisseur ni code dans les logs ; reprise/réenvoi sous limites fournisseur, temporisation UI.

Séquence : tests RED des actions et du transport SDK, implémentation des actions gardées, UI React dans les styles existants avec code conservé seulement en mémoire de composant et arrêt des continuations démontées ; unités/PG/types/lint/build et revue indépendante ; navigateur pour le rendu sans émission externe non autorisée. Vérification/reception/adhésion réelles restent ouvertes tant qu'elles ne sont pas exécutées. Pas de DBsource, AWM, push, nouvelle dépendance ou changement de configuration Neon. Revert du commit isolé possible, aucune migration.

Pré-mortem : session change pendant la saisie → acteur attendu obligatoire côté serveur et key par acteur ; code valide pour un autre email → adresse serveur et invitation avant endpoint ; succès du provider mais session toujours non vérifiée → pas de faux succès, demander reprise ; erreur réseau après envoi → pas de réessai automatique, message de réception potentielle et délai ; code invalide → message accessible et aucune adhésion. Estimation12–20kjetons, coût indisponible, aucun service payant sans accord. Autorisé par plan parent et consigne de décider sans questions.


## Réservation de navigation desktop — 2026-10-23

Défaut constaté sur revenus authentifiés1280x720 : body788px avec68px réservés à la navigation mobile absente. Reproduit aussi sur connexion réelle via Chrome DevTools MCP, même mesure et capture avant dans la trace. Cible : padding-bottom0 par défaut, réservation nav+safe-bottom uniquement dans max-width767px ; conserver override onboarding et landing. Aucun calcul, Auth ou donnée modifié. Séquence : capture avant ; modification CSS ; captures après desktop/mobile et contrôle du seuil767/768 ; build/types/lint/delivery en copie isolée ; rapport, discovery et commitlocal. Régression financière mobile authentifiée non prouvée si session indisponible, à garder ouverte. Pas de test miroir CSS. Estimation6–10kjetons, coût indisponible, aucun service payant. Autorisé par correction des défauts du plan parent et décisions autonomes humaines.

Extension reproduite sur connexion mobile : réservation header48/nav68 alors que ces composants sont absents. Même cause structurante. Dans la media query existante, cibler body:has(.space-product-content), marqueur unique du vrai LayoutShell financier, au lieu de body global. Les écrans publics/Auth ne réservent rien, le chrome financier mobile conserve48/68. Contrôler absence de débordement à375px et seuils767/768 ; ne pas prétendre une recette financière authentifiée en nouvelle session anonyme.


## Retour invitation entre vues Auth — DISC-ESP-009

Source fournisseur installée auth-ui/index.mjs : le lien de pied dépend de isHydrated ? window.location.search : chaîne vide. Le rendu serveur perd donc le retour, et une navigation/clique précoce peut le perdre réellement. Ne pas patcher node_modules ni désactiver SSR. Cible : adaptateur Link public du provider, contexte local à la page Auth alimenté par returnPath déjà validé côté serveur. Ajouter uniquement redirectTo sur les chemins Auth internes connus, préserver query/hash, aucun enrichissement d’URL externe/arbitraire. Les navigations hors Auth et l’Auth ordinaire restent identiques ; scope React évite un état persistant d’une invitation précédente. Tester rendu SSR du vrai fournisseur/Link (pas seulement helper), retours malveillants refusés, liens connexion/inscription/forgot et rechargement réel ; unités/types/lint/build en copie, rapport et commitlocal. Aucune session fabriquée, inscription, email ou schéma modifié. Estimation8–12kjetons, coût indisponible ; autorisé par trajet FR006/007 existant et autonomie humaine.


## Recette externe autorisée — 2026-10-23

L’humain a fourni une boîte Gmail de recette connectée dans Chrome et autorisé son usage : invitation depuis un compte existant, lecture du seul message de recette, création du compte destinataire depuis le lien puis contribution à deux. Accès navigateur réel confirmé ; anciens blocages de session/boîte levés. Le goal complet reste inchangé. Pas de push/déploiement dans cette tranche.

Écart : le runner local force Mailpit. Ajouter une option CLI explicite `--resend`, sans modifier `.env.local`, les gardes DB ou le transport par défaut. Vérifier les gardes et la configuration sans secrets, redémarrer seulement le runner possédé. Créer via UI un espace vide dédié, inviter l’adresse explicitement fournie et constater la réception réelle dans Gmail. Suivre le lien, inscription/vérification puis acceptation distincte ; arrêter pour handoff si avertissement navigateur, saisie d’un nouveau mot de passe ou accord légal l’exige. Ne jamais contourner ces étapes, ni fabriquer une identité vérifiée.

Preuves : réception anonymisée et état durable fournisseur/DB ; aucun jeton/adresse/code dans Git. Captures privées dans `.local/resend-recipe/`. Deux contributions fictives, recharge et séparation des autres espaces ; tests négatifs possibles avant/après acceptation. Rejouer les checks appropriés au code modifié, actualiser matrice et journal, commit local automatique. Pas de purge, reset, données réelles modifiées ou nouvelle confiance système.

Pré-mortem : mélanger ancien payload Mailpit et envoi externe → créer une nouvelle invitation dans un espace dédié ; double tentative après timeout → lire état durable avant retry ; signer le second compte dans la même session que le premier → séparer navigateurs et garder le créateur connecté. Le certificat autosigné peut bloquer un nouveau navigateur et le SW : signaler précisément, aucune prétendue validation offline. Estimation15–30minutes,6–15kjetons, coût monétaire exact indisponible ; quelques emails sur le service existant autorisés, pas de forfait payant nouveau.
