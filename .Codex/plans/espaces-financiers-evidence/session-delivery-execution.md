# Sessions privées et livraison incertaine — preuve de tranche

2026-10-23. Plan : `.Codex/plans/espaces-financiers-session-and-delivery.md`. Décision : DEC-003. Goal global toujours en cours, aucun AWM.

## Comportement ajouté

Le layout financier transmet son userId serveur au garde. Les finances ne sont rendues qu’avec une session client correspondante, confirmée et sans erreur. Invalidation de document à la déconnexion, après signal Auth d’un autre onglet, offline, historique restauré ou expiration sans focus. Les enfants sont retirés, donc les anciens lifetimes quittés. Un signal de retour réseau n’autorise pas la réapparition d’un vieux document. La zone privée reçoit display:none!important avant pagehide. Signal interonglet = génération aléatoire uniquement ; aucun cookie, compte ou montant stocké.

Déconnexion commune aux trois boutons financiers et au quatrième parcours Changer de compte de l’invitation. Celui-ci utilisait le SDK SignOut.finally(onSuccess), relevé par la revue. Il utilise maintenant SignOutFlow contrôlé, erreur visible/retry, promesse unique sous StrictMode et retour d’invitation conservé. Le helper refuse toute navigation externe/query/hash/caractère blanc, y compris les sauts de ligne que l’ancre $ JavaScript peut accepter. Retour tardif bloqué après démontage. Les autres vues Auth restent le SDK existant. Conditions d’inscription affichées seulement pour sign-up.

Le garde utilise les classes existantes (page onboarding, boutons et liste avec espacement) ; aucune maquette ou bibliothèque supplémentaire. Aucun verdict visuel acquis sur cet écran.

## Réconciliation opérationnelle

Runbook `.app-factory/docs/runbooks/invitation-delivery.md` et statement `scripts/financial-spaces/reconcile-confirmed-delivery.sql`. Aucun accès fournisseur ou envoi automatique. Un opérateur autorisé doit d’abord corréler une preuve exacte Resend au payload/token-hash/destinataire/expéditeur/temps de cette invitation et consigner une preuve privée sans bearer public.

Le SQL testé exige ID/espace/timestamps exacts, pending/non-expiré/uncertain et lease inactif. Il ne change que delivery_status/lease/erreur ; invalide le vieux lease, ne réécrit pas les tentatives, ne crée ni mail ni appartenance/espace. Une correspondance insuffisante reste uncertain, sans reset de la fenêtre d’idempotence. Aucun SQL de production exécuté. Les événements fournisseur restent distincts de la réception humaine requise par le goal.

## Vérifications exécutées

- 222/222 unitaires : douze nouveaux tests de rendu réel du garde et de la vraie route Auth, contrôleur EventTarget, storage indisponible, attente/résultat erreur de signout, retour borné, démontage, expiration et longues durées. Le transport Auth est simulé, les effets React/BFCache réels ne sont pas exercés.
- 95/95 services PostgreSQL sur template synthétique après extraction du validateur partagé ; Auth et mail simulés.
- 29/29 tests natifs : 21 migrations + cinq certificats + trois réconciliations. RED du nouveau contrat observé avant création du SQL. Preuve de refus des IDs/snapshots croisés, lease actif, expiration, réponse terminale et mauvais état ; finances/tentatives/membres/token inchangés, ancien writer refusé.
- Types0, lint0erreur/15warnings existants, gardes CI/matrice7/7, profil DevOps et documentation générée --check PASS.
- Copie durable sans .env/secrets/backup : unitaires222, typegen/types/lint et build Next16.4.2 Webpack sortie0. Build dans la copie pour ne pas altérer les fichiers générés du runtime actif. Aucun nouveau vert Turbopack revendiqué.
- Revue indépendante en lecture seule : P2 quatrième chemin signout corrigé puis fermé, pas de nouveau finding concret sur expiration/SQL. Pas de tests réexécutés personnellement par le reviewer.

Logs privés : session-{unit,types,lint,services,migrations,delivery}.log ; session-clean-{unit,typegen,types,lint,build}.log ; reconciliation-red.log sous `.local/financial-spaces/`.

## Limites et suite

Aucun navigateur ouvert ou remplacé après le refus de politique : aucun screenshot ou verdict Playwright MCP nouveau. Les horloges simulées ne prouvent pas le réveil d’un vrai onglet suspendu, et le rendu SSR ne prouve pas l’absence de flash en BFCache. Interonglets réels, saisies/RSC tardifs, offline réel, desktop/mobile et nouvelle vue d’erreur restent à valider.

Aucun mail externe reçu, nouvel utilisateur hébergé ou parcours à deux comptes prouvé. Aucune intervention de réconciliation sur la recette ni production, pas de nouvelle lecture de boîte Resend. Le runbook est prêt ; il ne remplace pas les preuves fournisseur/humaines ou une autorisation d’intervention. Pas de push/CI distante/déploiement.

Effort initial10–20kjetons ; la tranche a été étendue par le quatrième chemin Auth et les tests de réconciliation (aucun budget plafond fixé). Coût monétaire indisponible, aucun service payant engagé. La source, baseline privée703lignes et work de recette ne sont pas mutés par ces tests.
