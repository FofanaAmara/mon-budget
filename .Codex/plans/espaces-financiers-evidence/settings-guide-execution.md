# Réglages et guide — 2026-10-23

Plan : .Codex/plans/espaces-financiers-implementation.md. Sans AWM.

## Résultat serveur
Le membre cible explicitement l'espace pour la devise, les rappels et le guide. Les contacts et consentements sont toujours déterminés par la session individuelle, sans userId fourni par le client. Les patchs stricts refusent tout champ de l'autre domaine. Les mises à jour partielles concurrentes préservent les valeurs non fournies, y compris false, null et tableau vide.

Les réglages d'espace autorisent les trois devises de l'interface actuelle : CAD/USD/EUR. La revue a révélé que l'ancien schéma acceptait 123, A ou $ ; enum et cas négatifs ajoutés, constat fermé. Rappels : contrat existant d'entiers positifs conservé. L'email de contact reste distinct de l'identité authentifiée utilisée pour les invitations.

Les étapes du guide examinent les finances de tous les membres dans le seul espace cible. Fermeture et complétion sont idempotentes et ne rafraîchissent pas les dates historiques. Un ancien espace complet sans guide reste sans guide et masqué ; une réinitialisation explicite peut en créer un. Un espace incomplet sans guide n'est initialisé qu'une fois sous lectures concurrentes. Réinitialiser le guide A ne touche pas B.

## Preuves
Services70/70 sur PostgreSQL isolé, dont10 nouveaux tests ; Auth/cache simulés, aucune preuve de session réelle ou d'invitation. Unitaires181/181, types0, lint0erreur17avertissements préexistants. Revue indépendante statique des frontières, écritures et tests : constats fermés après correction.

Le registre indique76/78 exports financiers avec implémentation explicite et les deux modules de réglages. Leurs appelants restent à raccorder ; aucun nouveau parcours UI livré. Aucune migration ajoutée dans cette tranche, source/baseline/work non modifiés. Aucun email, push ou déploiement.

## Décision autonome sur ancien versement
L'humain absent demande de prendre les décisions sans nouvelles questions. Si le delta ancien est invérifiable, conserver les montants et refuser explicitement l'annulation automatique plutôt que créditer une somme inventée. Aucune réconciliation d'ancien montant n'est tentée. Le message devra être visible lors du raccordement. Ceci ne remplace pas les autres critères de recette.

## Suite
Démo/reset/claim et defaults historiques, routes canoniques et appelants, maquettes, invitations/Auth/email reçu, caches/offline, CI et Playwright MCP restent à terminer. Gate ready fermé sur work17 ; les anciennes actions doivent être supprimées avant activation.

Build Next final : sortie0, sortie isolée .next-spaces-build, tsconfig et next-env restaurés aux octets initiaux.
