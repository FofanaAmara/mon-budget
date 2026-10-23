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

P7.1 préparation reproductible : IN_PROGRESS — template historique synthétique distinct de la copie privée, mêmes suites PostgreSQL puis workflow et matrice. Dépend du socle e990b5d vérifié ; CI distante, Auth réel et MCP toujours ouverts.

P7.1 préparation reproductible : COMPLETED pour la tranche bornée (fixture42lignes/18tables,95PG/26migration-certificat,210unit,7gardes, qualité sans secrets et profil/docs). Matrice17/30 complète mais aucun verdict global acquis. CI distante/PlaywrightMCP/Authréel/réception externe/caches restent IN_PROGRESS. Voir verification-execution.md.

P3.4 sessions et affichage privé : IN_PROGRESS — identité serveur au layout, invalidation de session/onglets/offline/BFCache et centralisation signout ; tests bornés puis vraie recette toujours à faire. Dépend du socleAuth e990b5d ; plan session-and-delivery.

P3.4 sessions / P4.2 uncertain : COMPLETED pour la tranche technique bornée DEC-003 et runbook (222unit/95PG/29natifs, types/lint/buildWebpacken copie verts, revuefermée). Validation réelle onglets/offline/historique, Auth2comptes/email/MCP/CI distante toujours IN_PROGRESS.

P3.4 extension revue globale : IN_PROGRESS — onboarding/choix/invitations privées sous garde ; acteur attendu création et invitation, tests/revue à venir.

P3.4 extension revue globale : COMPLETED pour le correctif technique ;226unit/97PG/7gardes,types0/lint0/14warnings/buildWebpack0,revueP1closed. Recette globale IN_PROGRESS.

P7.1 audit final : IN_PROGRESS - preuve CI distante du SHA, preconditions email et outils ; retrait des14bindings inutilises reperes par lint, sans modifier les contrats ou le rendu.

P7.1 audit/clean lint : COMPLETED pour la tranche locale ;226unit,types0,lint0warning,buildWebpack0,revue fermee. Goal global IN_PROGRESS : recette externe/Auth/MCP/CI manquante, voir delivery-audit.md.

Recette Mailpit actuelle : IN_PROGRESS - autorisation navigateur/Playwright explicite ; runtime3002 a relancer puis UI, reception et lien.

Recette Mailpit actuelle : COMPLETED pour le parcours borne - vraie fiche/envoi/reception/lien mauvaiscompte/recharge/seconde soumission sans doublon, SQLlecture1pending/sent/1membre. Acceptation2sessions/Resend/MCP/CI restent IN_PROGRESS.

Recette responsive et isolation des saisies : IN_PROGRESS - depend de Mailpit1353d11 et runtime98404 ;375x812/1280x900, fausses depenses extremes espacecouple, reload et personnel distinct.

Defaut visuel375px : IN_PROGRESS - FAB depenses recouvre montant1450, correction par action en flux dans entete puis preuve avant/apres, revue et checks.

Recette responsive/separation et corrections : COMPLETED pour cette tranche bornee - fiches375/1280,2saisies1453.99couple/personnel0,reload/racine/guide,2defauts corriges et revus.226unit/7gardes/types/lint0warning/buildverts. GoalglobalIN_PROGRESS ; autresvariantes/Auth2membres/Resend/MCP/CIouverts.

Recette nomlong/sessioninteronglets/landinganonyme : IN_PROGRESS - depend93f51f5/runtime98404 ; nouvelespacefictifmax80, choixNon, formulairenonenregistre et deconnexion de session de recette, verification masqueautresonglets et liensAuth.

Parcours2comptesexistants : IN_PROGRESS - deuxsessionspreexistantes distinctes disponibles ; Mailpit/acceptation/contribution/isolationprioritaires. Defaut500surspaceinterdit restea corriger avantcloture.

RefusRSC500 : IN_PROGRESS - sous-type sessionabsente et traductionpage404/authsansmasquerpannes ; deuxcomptesreels nonverifies, acceptationbloquee danslesdeuxsens, aucuncontournement.


Refus RSC500 et script de thème : COMPLETED pour cette tranche bornée — refus générique dans les deux sens, retour autorisé, scan desktop/mobile375,233unit/97PG/build/types/lint0warning/7gardes/auditprod0 et revue source indépendante. Commit local à effectuer. Goal global IN_PROGRESS ; deux comptes réels restent non vérifiés et aucune adhésion n'est prouvée (DISC-ESP-006).


DISC-ESP-006 vérification du destinataire : IN_PROGRESS — dépend du socle15ae38f ; API OTP dédiée documentée, session/acteur/invitation gardés, UI envoi/saisie/reprise puis acceptation distincte. Tests et transport simulés ne fermeront pas réception Auth réelle ou adhésion.


DISC-ESP-006 tranche technique : COMPLETED — actions OTP et UI,246unit/99PG, nouveau banc7cas et ancien6cas, build/types/lint0warning/7gardesworkflow verts, revue source/captures fermée. Réception/confirmation OTP réelle et adhésion toujours IN_PROGRESS. Défaut hover DISC-ESP-007 corrigé et revu.
