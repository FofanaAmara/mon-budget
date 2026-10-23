# Exécution directe — Espaces financiers

Plan : .Codex/plans/espaces-financiers-implementation.md. Méthode directe imposée par l’humain ; aucun AWM.

| Étape | Dépend de | État | Preuve requise |
|---|---|---|---|
| P0 Baseline, registre et DB isolée/restauration | Objectif lu | COMPLETED | Unitaires/types/lint/build verts, registre86exports, copie et restore sans écrireDBsource |
| ESP-001 Premier espace | P0 | IN_PROGRESS | Création/unique option/reprise |
| ESP-002 Conservation | ESP-001 | IN_PROGRESS | Avant/après/rejeu/reprise |
| ESP-003 Multiespace complet | ESP-002 | TODO | Tous chemins, contraintes, concurrence, caches, réglages |
| ESP-004 Invitation compte existant | ESP-003 | TODO | Resend réellement reçu et acceptation, droits égaux |
| ESP-005 Inscription invitée | ESP-004 | TODO | Retour auth/verify sans espacepersonnelforcé |
| ESP-006 Onboarding partagé | ESP-005 | TODO | Oui/non, erreurenvoi/retry |
| Recette globale et revue | Toutes | TODO | 17exigences/30AC, visuelMCP, CI et URLtestable |

Ne pas déclarer fini sur la base d’une tranche verte. Le goal reste actif jusqu’à preuve de tous ses critères. Aucun push ni déploiement production automatique.

P1.1 : COMPLETED — SQL, préflight, dry-run, application/reprise locale et conservation18tables703lignes prouvés. P1.2/P1.3 et parcoursproduitESP001/002 restentàréaliser.

P1.2 : COMPLETED — services serveur et adaptateur de recette ; 15 tests PostgreSQL, 177 unitaires, types/lint/build verts, revue indépendante des corrections fermée. P1.3/navigation et conversion financière restent à réaliser.

P1.3 : IN_PROGRESS — conversion des familles financières vers actions à spaceId explicite, tests persistants multi-membres et concurrence ; raccordement puis suppression des entrées legacy avant activation.

P1.3 progression : 38/78 exports financiers convertis et testés dans six familles ; raccordement UI et suppression legacy non faits. Services40, migrations19, unitaires181. Copie work utilisée : une date de guide diffère après activité navigateur, problème corrigé et preuve strictement invalidée ; source/baseline intactes.
