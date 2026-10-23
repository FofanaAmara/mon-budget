# Exécution directe — Espaces financiers

Plan : .Codex/plans/espaces-financiers-implementation.md. Méthode directe imposée par l’humain ; aucun AWM.

| Étape | Dépend de | État | Preuve requise |
|---|---|---|---|
| P0 Baseline, registre et DB isolée/restauration | Objectif lu | COMPLETED | Unitaires/types/lint/build verts, registre86exports, copie et restore sans écrireDBsource |
| ESP-001 Premier espace | P0 | TODO | Création/unique option/reprise |
| ESP-002 Conservation | ESP-001 | TODO | Avant/après/rejeu/reprise |
| ESP-003 Multiespace complet | ESP-002 | TODO | Tous chemins, contraintes, concurrence, caches, réglages |
| ESP-004 Invitation compte existant | ESP-003 | TODO | Resend réellement reçu et acceptation, droits égaux |
| ESP-005 Inscription invitée | ESP-004 | TODO | Retour auth/verify sans espacepersonnelforcé |
| ESP-006 Onboarding partagé | ESP-005 | TODO | Oui/non, erreurenvoi/retry |
| Recette globale et revue | Toutes | TODO | 17exigences/30AC, visuelMCP, CI et URLtestable |

Ne pas déclarer fini sur la base d’une tranche verte. Le goal reste actif jusqu’à preuve de tous ses critères. Aucun push ni déploiement production automatique.
