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

P1.3 progression : 72/78 exports financiers convertis ; services60/60, migrations20/20 et unitaires181/181. Appelants et UI toujours non raccordés. Traitement des anciennes annulations non approuvé, garde non raccordé ; voir expenses-allocations-execution.md.

P1.3 progression : 76/78 exports financiers et partition des réglages communs/individuels ;70services/181unit, types/lint verts. Appelants encore pending ; autonomie explicitement demandée pendant absence, décisions documentées sans question.

P1.3 progression : 78/78exports financiers implémentés ; maintenance transactionnelle ciblée et116exemples conservés. 80services/181unit/types/lint/buildverts. Raccordement des appelants, suppression legacy et parcoursproduit restent à faire.

P1.3 raccordement : 78/78exports et appelants explicites,15anciensmodules supprimés ; routes canoniques, sélecteur/sidebar/drawer, devise/guide et caches raccordés.81services/188unit/types/lint/buildverts,5casChromeisolésverts. ESP-003 IN_PROGRESS ; vraieactivation/UIcréation/gestion/invitations/auth/E2E/visuelMCP encoreàfaire.

Création/gestion/invitations : IN_PROGRESS global. UI réelle et services006 implémentés ;95PG/193unit/21migrations/6bancChrome. ESP001/003/004/005/006 restent IN_PROGRESS tant que leurs AC réels ne sont pas prouvés. Recette3002 active sur nouveau clone, ancienwork archivé. Mailpit reçu, pasResendexterne ; Auth2sessions/nouveau/CI/PlaywrightMCP/revueglobale et réparation sécurité restent ouverts. Voir invitations-management-execution.md.

Réparation sécurité : COMPLETED pour la tranche bornée DEC-002 (206 unitaires, installation propre, graphe sans problème, audit production zéro, types/lint/build verts, revue fermée). Les cinq alertes lint sans patch restent suivies dans DISC-ESP-002. La recette globale reste IN_PROGRESS ; navigateur refusé, aucun nouveau verdict UI/Auth externe.
