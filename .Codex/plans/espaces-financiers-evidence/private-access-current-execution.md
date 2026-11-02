# Recette actuelle — accès privés et comptes invités

2026-10-23. Goal global **non atteint**. Travail direct selon le plan accepté, sans AWM.

## Observations dans la vraie application
- Création d'un espace personnel avec nom de80caractères. Oui affiche l'invitation optionnelle ; retour puis Non crée directement l'espace vide. Recharge persistante et sélecteur avec nom long contrôlés sur mobile.
- Deux sessions Auth préexistantes et distinctes sont disponibles, dans IAB et Chrome. Le sélecteur à un seul espace était désactivé avant création du second espace de recette.
- Invitation A vers B puis B vers A dans deux espaces de recette : réception SMTP Mailpit et ouverture des liens dans les bonnes sessions. Dans les deux sens, Auth indique une adresse non vérifiée ; aucune adhésion n'est donc acceptée. Aucune écriture du bit emailVerified ou de l'identité, aucun mail externe, aucune inscription hébergée.
- En ouvrant l'espace privé de A depuis B, refus serveur correct mais HTTP500/overlayNext. Correction : session absente vers connexion existante ; cible interdite/invalide vers404générique sans nom/identifiant/donnée ; les pannes Auth/DB/rollout restent des erreurs.
- Un script du thème inclus dans le wrapper UI Neon produisait aussi un avertissement sur le repli. Utilisation du fournisseur public de base, mêmes callbacks et désactivations, Sonner explicite et palette claire déjà utilisée par l'app. Le client React Auth et les contrôles d'appartenance sont conservés.
- Après correction, refus générique dans les deux sens et retour de B vers sa liste puis son espace autorisé. Aucun nouveau badge d'erreur ; l'ancien log de script à12:19:38UTC reste historique. La revue a ensuite repéré une bande pâle sur la première capture mobile. Cause confirmée : padding inférieur global de68px réservé à une navigation absente. Suppression de ce padding sur body:has(.space-onboarding), puis rechargement au viewport demandé. Nouvelle capture exacte375x812, main/body/viewport375x812 et paddingBottom0 ; bandes disparues, scan visuel confirmé par reviewer. Desktop1280x900 également contrôlé après correction, viewport restauré. Aucun défaut de texte/chevauchement restant observé sur ces pages.

## Preuves privées
`.local/financial-spaces/session-current/` : captures de création/nom long, invitation non vérifiée et Mailpit ; foreign-space-before.png, foreign-space-after.png, foreign-space-mobile-375-after.png (ancienne capture338x732 conservée, non certifiante), foreign-space-mobile-no-nav-padding.png (375x812 vérifiée) et foreign-space-desktop-no-nav-padding.png (1280x900). Les emails, noms personnels et liens porteurs d'invitation restent exclus de Git.
Le contrôle navigateur utilise CUA avec ses locators Playwright ; il ne remplace pas le critère Playwright MCP.

## Vérifications
- Six tests nouveaux sur les vrais helpers et le layout : RED avant correction, puis GREEN ; aucune lecture financière après refus, distinction des pannes et absence de sélection implicite d'un autre espace.
- Un test SSR du vrai contexte Auth UI : enfant et notifications conservés, aucun script inline ; callbacks de navigation et invalidation conservés.
-233tests unitaires et97tests services PostgreSQL verts. L'assertion PG vérifie le nouveau sous-type et sa compatibilité avec SpaceAccessError.
- Installation propre, buildWebpack, types, lint sans warning,7contrôles du workflow et audit production0vulnérabilité : tous verts, dans une copie isolée sans secrets. Une erreur de typage twoFactor détectée par le premier build a été corrigée par absence de cette option désactivée. Les233unitaires ont été rejoués après ce dernier changement. Les29tests natifs de migration/reprise antérieurs ne sont pas rejoués : aucune migration ou reprise modifiée.
- Revue indépendante source du delta : aucun finding actionnable ; elle ne revendique pas l'hydratation ni la livraison globale.

## Restant
Parcours email vérifié et acceptation effective, contribution à deux, nouveau compte, réception Resend externe, tests de session inter-onglets/offline et ensemble des pages/automatismes, Playwright MCP et CI distante. La configuration de vérification NeonAuth est distincte du SMTP d'invitations ; le parcours actuel manque d'une action permettant de renvoyer la vérification. Aucun changement silencieux du fournisseur hébergé pour contourner ce manque.
