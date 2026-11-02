# Migration sur copie — 2026-10-23

Plan : .Codex/plans/espaces-financiers-implementation.md. Exécution directe, sans AWM.

## État vérifié

001-expand.sql et 002-backfill.sql ont été appliquées puis rejouées dans spaces_work17 uniquement, après un préflight sans anomalie. La source et spaces_baseline17 restent intactes. 003-isolation.sql a été testée sur des clones jetables ; elle reste non appliquée à work17, dont le rollout est backfilled. Aucune nouvelle surface n’est exposée aux données réelles.

Comparaison PostgreSQL en lecture seule entre baseline17 et work17 : les 703 lignes des 18 tables, avec leurs 175 colonnes historiques, sont identiques. Les 13 espaces « Mes finances » correspondent aux propriétaires historiques. Aucune ligne financière ne reste sans espace ; les attributions, jonctions et appartenances sont cohérentes, sans membre supplémentaire. Réglages, dates, états du guide et absence historique du guide sont conservés. Les réglages absents reçoivent les valeurs par défaut prévues.

Preuve privée : .local/financial-spaces/conservation-report.json. Aucun contenu financier ni identifiant de compte n’est versionné.

## Preuves exécutées

- Dry-run : zéro mutation ; le test constate que le catalogue et le ledger ne sont pas créés.
- 18 tests PostgreSQL réussis, zéro échec/skip, environ 2,2 secondes ; journal privé migration-tests.tap. Chaque lancement clone la baseline dans une base unique, ajoute ses fixtures fictives, puis supprime uniquement cette base de test.
- Interruptions injectées avant commit des phases 001, 002 et 003 : rollback sans état partiel présenté comme prêt.
- Deux runners simultanés : sérialisation, map et appartenances sans doublon.
- Instances mensuelles explicitement sans template : conservation et rattachement via leur propre propriétaire.
- Propriétaires ambigus, relations croisées et doublons d’épargne libre : refus, sans transfert ni fusion implicite.
- Réglages/guide modifiés ou apparus après la première passe : reprise jusqu’à la transaction finale, dates et valeurs nulles incluses.
- Écriture concurrente : le second writer est réellement observé en attente dans pg_locks pendant le verrou final, puis rejeté par NOT NULL après le commit. Une saisie legacy arrivée avant la bascule est rattrapée.
- Chacune des 18 relations croisées échoue avec le code 23503 et le nom de FK attendu. Des mois distincts évitent qu’une unicité mensuelle masque la preuve.
- Suppression d’une référence optionnelle : seul l’ID du parent est mis à NULL ; space_id reste intact. Cascades vérifiées sur les enfants concernés.
- NOT NULL sur les 13 tables financières ; unicité de l’épargne libre indépendante du nom affiché.
- Rejeu après contribution partagée : aucune réattribution à l’auteur.
- Client non vérifié refusé avant toute requête grâce au WeakMap ; checksum appliqué modifié refusé avant mutation.
- 177 tests unitaires réussis, TypeScript sans erreur, lint sans erreur et 17 avertissements préexistants. Le build applicatif du commit de préparation 86c5394 reste la dernière preuve de build ; aucun TS applicatif n’a changé dans cette tranche.

## Revue et correction

Le reviewer indépendant spaces_risk_review a trouvé un P1 : les copies des réglages/guide restaient figées entre passes. Correction : upsert contrôlé tant que le rollout n’est pas ready, reprise des valeurs nulles/dates et préservation de l’absence historique du guide. Le test de dernière passe couvre ces changements. La garde intrinsèque du client et la vraie preuve de writer concurrent ont aussi été ajoutées.

Relecture des deltas : P1 fermé, aucun nouveau blocage identifié. Le verdict reste limité aux migrations et au runner de fixture. La vérification de conservation a ensuite été renforcée pour contrôler chaque attribution et les appartenances.

L’ancien brouillon 002 déjà essayé sur work17 a été refusé par checksum après correction : résultat attendu. Cette copie est conservée dans spaces_work17_draft_20261023a. work17 a été recréée depuis la baseline intacte ; le SQL corrigé a été appliqué puis rejoué. Aucun ledger n’a été modifié pour contourner ce contrôle. Le test de checksum altéré modifie uniquement son propre clone jetable pour établir le refus.

## Restant

P1.1, la fondation SQL, est réalisée. ESP-001 et ESP-002 ne sont pas terminées au sens produit : garde, services, création nommée, routes et interface restent à raccorder. L’application filtre encore les finances par utilisateur. Il n’existe pas encore de nouvel espace testable par l’humain, d’invitation ni de réception email prouvée.

La conversion des 86 actions, les caches, les préférences, l’authentification et les parcours E2E, la CI et la validation Playwright MCP restent nécessaires. Aucun push, déploiement ou SQL mutateur sur la source.
