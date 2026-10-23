# Raccordement des vues financières — 2026-10-23

Plan : .Codex/plans/espaces-financiers-implementation.md. Exécution directe sans AWM.

## État réel
Toutes les pages financières sont déplacées sous /espaces/[spaceId]. Les78actions et leurs appelants prennent l'espace explicite ; imports statiques et dynamiques convertis. Les15anciens modules financiers ainsi que ClaimBanner sont supprimés. La récupération de données unclaimed ne peut plus être déclenchée par un visiteur ; attribution réservée à la migration vérifiée. Registre action-conversion.json conserve les anciens appelants et recalcule les nouveaux.

Layout financier : appartenance contrôlée, liste des espaces/réglages/guide chargés après résolution du contexte. Racine : redirection vers dernier espace valide ; absence de préférence ambiguë dirige vers /espaces, zéro espace vers /onboarding. Les anciens chemins financiers passent par un redirect contrôlé, sans réinterpréter les IDs dans un autre espace. Ces deux pages d'entrée /espaces et /onboarding restent à implémenter, comme la liste/création/détail dans Réglages. Ce commit n'est donc pas une feature produit livrée et la copie work reste non activée.

## Navigation et formulaires
Liens et routeurs préservent l'espace d'origine, y compris paramètres de mois, fils d'Ariane et IDs. Cible déjà explicite versB inchangée depuisA. Le provider est remonté au changement d'espace. Le sélecteur seul est intégré à la sidebar, désactivé avec une seule option ; drawer mobile limité au même sélecteur. Styles repris des maquettes React approuvées, sans Storybook ni bibliothèque.

La devise de l'espace sert au formatage des vues financières, les contacts/consentements restent individuels. Correction d'une incohérence découverte sur le résumé charges : BIMONTHLY utilisait *2 alors que calcMonthlyCost et les tests unitaires établissent /2.

La revue a trouvé une continuation async A pouvant renaviguer versA après basculeB. Désormais lifetime par provider invalidé dès intention de bascule, gardes de montage et de requête sur le sélecteur et gardes sur les routeurs financiers ; les anciennes navigations window.location post-mutation dans Réglages sont remplacées. Les brouillons natifs et les états de champs par boutons sont suivis ; annuler l'abandon conserve saisie/préférence. Les coordonnées/rappels/devise ont aussi un suivi explicite.

markAsUpcoming renvoie une erreur métier sérialisable pour un ancien delta de dette invérifiable, afin que Next ne masque pas l'explication en production. Les deux appelants affichent un rolealert, conservent ligne/feuille et ne modifient aucun montant. Décision conservatrice autorisée par l'autonomie demandée durant absence.

## Cache
SWv3 ne cache que trois icônes publiques. Navigation privée, RSC, auth et API utilisent le réseau sans fallbackHTML. Activation purge les anciens caches de l'app en conservant ceux d'autres apps. Tests VM couvrent cette frontière, sans constituer une preuve offline du navigateur réel.

## Preuves exécutées
- PostgreSQL services81/81, Auth/invalidation Next simulées, dont annulation historique refusée avec dette/instance/journal strictement inchangés.
- Unitaires188/188, dont navigation explicite et frontière SW.
- TypeScript sortie0, lint0erreur15avertissements existants restants, buildNext0, diffcheck0.
- npm run test:spaces:navigation : vrai Chrome, vrais provider/sélecteur/routeur gardé ; serveur Next et action de préférence simulés. Cinq cas verts : ancienne sauvegarde sans navigation/refreshB, abandon refusé conserveA/saisie/préférence, abandon accepté ouvreB/formvide, champs par boutons protégés, réponse de préférence tardive après départ versCompte ignorée.0pageerror. Test versionné et reproductible, port éphémère, Chrome local ou ChromiumPlaywright, artefacts privés .local/financial-spaces/ui-harness.
- Revue indépendante : constats P1réponses tardives et P2brouillons corrigés et fermés ; retour métier historique relu. Le reviewer n'a pas réexécuté les tests.
- Maquettes : buildVite0 après adaptateurs isolés pour les nouveaux imports/contexte ; scénarios et identité simulés conservés. Pas de nouvelle preuve visuelle mobile/desktop.

Ce banc Chrome/PlaywrightCLI ne prouve ni E2E complet Next/Auth/DB ni PlaywrightMCP. Aucun outil PlaywrightMCP détecté dans les outils disponibles ; le gate final reste à satisfaire. Il faudra aussi tester la réponse RSC automatique d'une vraie action retardée dans l'app réelle.

Aucune activation003+004+005 sur work17. Source/baseline intactes ; certificat strictwork restefalse pour une ancienne datedeguide connue. Runtime3002 arrêté. Le serveur privé temporaire4302 est arrêté après vérification de son PID ; le test versionné ferme lui-même son serveur éphémère et Chrome. Aucun email/push/déploiement.

## Suite immédiate
Implémenter /espaces (choix explicite), /onboarding (premier espace), liste/création/détail et renommage/membres dansRéglages ; invitationspersistantes/ResendMailpit/auth de retour puis conditionalité complète onboarding. Quand tous les chemins produit sont raccordés, cutover contrôlé de la copie, recette vraieapp/2sessions/onglets, cacheoffline/CI/PlaywrightMCP et matrice17exigences/30AC. Ne jamais revendiquer livraison sur ces seules preuves ciblées.
