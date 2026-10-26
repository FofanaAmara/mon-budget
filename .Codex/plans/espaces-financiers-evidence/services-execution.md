# Services d’espaces et runtime local — 2026-10-23

Plan : .Codex/plans/espaces-financiers-implementation.md. Exécution directe, sans AWM.

## Résultat vérifié

Les services serveur créent un espace avec appartenance, réglages, guide et six catégories dans une seule instruction atomique. La clé de création empêche les doublons concurrents et refuse une réutilisation avec un autre contenu. Rejouer une ancienne demande conserve le nom courant et ne déplace pas la sélection plus récente.

Chaque lecture ou mutation exige une identité serveur et une appartenance à la cible explicite. Tous les membres ont les mêmes droits. Renommer un espace consulté dans les réglages ne change pas l’espace actif. Une préférence valide est reprise ; un espace unique sert de repli ; plusieurs espaces sans préférence imposent un choix. Un compte sans appartenance ne reçoit aucun espace automatiquement.

## Preuves exécutées

- Services : 15/15 tests PostgreSQL réels sur un clone jetable de la baseline, session serveur et invalidation Next simulées explicitement. Provisionnement, concurrence, isolation, profils, droits, préférence et rollback couverts.
- Unitaires : 177/177.
- TypeScript : code de sortie 0.
- ESLint : 0 erreur, 17 avertissements préexistants.
- Build Next 16.1.6 : code de sortie 0, sortie séparée dans .next-spaces-build ; fichiers de configuration restaurés à leurs octets antérieurs.
- Revue indépendante : les trois constats sur URL PostgreSQL effective, préférence au rejeu et choix ambigu sont corrigés et fermés. Revue statique ; les tests ont été exécutés par l’agent principal.
- Runtime Next local démarré sur localhost:3002 avec la copie de travail ; page existante observée via CUA avec session Auth existante. Observation complémentaire seulement, aucun verdict Playwright MCP ni validation des nouveaux parcours.

Les journaux restent privés dans .local/financial-spaces/services-{tests,unit,types,lint,build}.log.

## Garde de la recette

L’adaptateur local refuse le mode production, toute autorité autre que la fixture fixe, les paramètres et fragments d’URL. Le pool utilise des composants validés et vérifie l’identifiant du cluster avant toute requête applicative. Le lanceur vérifie aussi la propriété du conteneur, conserve .env.local, remplace les destinations SQL héritées et utilise Mailpit pour les futures livraisons de recette. Le pilote Neon HTTP reste le défaut.

## Limites et suite

P1.2 est vérifiée comme fondation serveur. ESP-001/002 restent en cours : pas encore de parcours utilisateur multiespace. La copie de travail reste backfilled, sans 003 ; activation après conversion complète des actions financières et de la navigation. Aucun email envoyé, aucune invitation acceptée, aucune preuve E2E/CI/Playwright MCP nouvelle. Source et baseline non modifiées. Aucun push.
