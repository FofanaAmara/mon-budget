# Matrice de recette — 17 exigences et 30 critères

État au 2026-10-23, après e990b5d, 1c9bef8, de4115e et extension des entrées privées. **Le goal n’est pas atteint.**

Sources : requirements.md et six stories dans `.app-factory/backlog/epics/finances-partagees/features/espaces-financiers/`. Maquettes approuvées : `cs-design/mes-finances/features/espaces-financiers-essai-02/`, commit 7aaec6d.

PARTIEL signifie code et preuves bornées présents, mais preuve de bout en bout insuffisante. À PROUVER signifie trajet demandé non exécuté. Aucun statut ne transforme un mock en preuve Auth ou email réel.

## Références des preuves

- **MIG** : migration-execution.md ; conservation stricte du nouveau clone avant UI dans invitations-management-execution.md. 703 lignes, 18 tables, 175 colonnes inchangées. Ancien certificat invalide conservé, jamais réécrit en succès.
- **PG** : suites `__tests__/integration/*.db.ts`, six familles, 97 tests réels sur PostgreSQL ; Auth et transport simulés. Désormais les mêmes suites passent aussi sur 42 lignes entièrement fictives.
- **SQL** : `__tests__/integration/financial-spaces-migration.test.mjs`, 21 tests ; restauration/rejeu/gel/relations et refus d’ambiguïtés. Cinq tests supplémentaires protègent le certificat synthétique contre CHECK/index/default/enum altérés.
- **NAV** : ui-context-execution.md et six scénarios du banc `__tests__/browser/space-navigation-fixture/` ; vrais composants, services et routeur simulés.
- **UI** : invitations-management-execution.md ; parcours CUA dans la vraie app avant mise à niveau des dépendances. Création solo/couple, réglages ciblés, Mailpit et mauvais compte observés ; captures privées. Cela ne constitue pas une validation Playwright MCP ni une recette actuelle complète.
- **AUTH** : dependency-repair-execution.md ; sept tests de contrat du véritable adaptateur, transport simulé. Lecture serveur sans mutation, fraîcheur explicite des décisions d’invitation. Aucune preuve de nouvel utilisateur ou de deux sessions hébergées.
- **MAIL** : DEC-001, tests invitation/mail, réception Mailpit observée. Lecture Resend du 2026-10-23 : domaine expéditeur vérifié, sending enabled, receiving disabled ; origine publique et boîte de recette explicite absentes. Aucun email externe envoyé/reçu.
- **SESSION** : session-delivery-execution.md et DEC-003 ; garde du vrai layout avec identité serveur, signout contrôlé (y compris retour invitation), invalidation/expiration/historique/offline ; douze tests sans navigateur. Extension private-entry-session-execution.md : vraies entrées privées gardées et refus serveur de changement d’acteur (quatre tests de rendu, deux tests PG). Runbook de réconciliation et trois tests PG de sa mutation minimale, aucune preuve fournisseur ou réception réelle ajoutée.
- **CI** : workflow local `.github/workflows/financial-spaces.yml` ; gardes RED puis vert, résultat final testé contre échec/annulation/skip/absence. Aucun run GitHub sur ce SHA ni protection distante prouvés.

Les références *.md ci-dessus sont dans ce même dossier de preuves, sauf DEC-001 dans `.Codex/adhoc/decisions/`. Les journaux privés restent sous `.local/financial-spaces/` ; aucun jeton, contenu de boîte ou adresse réelle dans cette matrice.

## Exigences

| ID | État | Preuves disponibles | Preuve restante pour clôture |
|---|---|---|---|
| FR-001 | PARTIEL | PG création atomique/idempotente ; UI création nommée solo/couple | Nouveau compte réel, suite de configuration et finances desktop/mobile après mise à niveau |
| FR-002 | PARTIEL | MIG/SQL conservation exacte, backfill Mes finances et map stable | Reconnexion navigateur du compte existant avec toutes pages ; release cible autorisée |
| FR-003 | PARTIEL | PG espaces distincts ; UI personnel puis couple vide | Deux espaces sur toutes les pages avec recharge, vrai compte |
| FR-004 | PARTIEL | NAV sélecteur seul et préférence ; PG dernier espace | Connexion/reconnexion réelle, unique option et mobile actuels |
| FR-005 | PARTIEL | 78 actions contextualisées, PG toutes familles ; configurations communes | Tour E2E de toutes fonctions et automatismes sur deux contextes |
| FR-006 | PARTIEL | MAIL local, PG acceptation ; UI landing explicite et mauvais compte | Réception externe, connexion existante, acceptation et contribution à deux sessions |
| FR-007 | À PROUVER | Routes publiques/auth/confirmation implémentées ; AUTH et PG bornés | Inscription réelle, vérification email, retour et acceptation sans espace imposé |
| FR-008 | PARTIEL | UI Non saute et Oui propose invitation ; même service | Nouveau compte réel, report d’envoi et reprise mobile/desktop |
| FR-009 | PARTIEL | PG membre B modifie/renomme/invite sans rôle créateur | Deux sessions réelles contribuent et gèrent après recharge |
| FR-010 | PARTIEL | UI liste/création/détail ; renommer B sous A actif | Rejouer interface actuelle, liste des membres et sélecteur actualisé |
| NFR-001 | PARTIEL | PG tiers/IDs croisés ; SQL FK composites et space_id obligatoire | Intrusions via vrais endpoints/pages dans sessions isolées |
| NFR-002 | PARTIEL | MIG/SQL exacts ; PG génération et acceptation concurrentes | Recharge navigateur/multisession et reprise réelle sans mélange |
| NFR-003 | PARTIEL | NAV requêtes tardives et brouillons ; PG concurrence ; SESSION masquage et invalidation | Vraie app multi-onglets, réponses RSC tardives, échec de bascule et offline |
| UXR-001 | PARTIEL | NAV et UI sélecteur/sidebar/drawer | Playwright MCP mobile/desktop, clavier, noms longs, option unique |
| UXR-002 | PARTIEL | Maquettes React intégrées à la vraie app ; UI avant mise à niveau | Playwright MCP pages entières, montants extrêmes, noms longs, overflow |
| TR-001 | PARTIEL | Stack conservée ; coûts non engagés ; Resend existant vérifié en lecture | Quota/coût applicable à la recette externe et origine publique autorisée |
| TR-002 | PARTIEL | Plan accepté, tests PG/MIG, test préexistant corrigé, revue de tranches | CI distante, revue globale et Playwright MCP ; validation complète |

## Critères des stories

| ID | État | Preuves disponibles | Observation restante |
|---|---|---|---|
| ESP-001/AC-1 | PARTIEL | PG création membre/defaults atomique ; UI nom et partage | Nouveau compte réel sans espace, configuration puis finances |
| ESP-001/AC-2 | PARTIEL | UI création personnelle Non sans invitation | Rejouer depuis vrai onboarding actuel, invitation ultérieure |
| ESP-001/AC-3 | PARTIEL | Sélecteur désactivé si unique ; NAV/UI bornés | Compte réel à un espace, mobile/desktop/clavier MCP |
| ESP-001/AC-4 | PARTIEL | PG noms invalides et rollback ; formulaire erreur | Erreur réseau et correction dans vraie interface |
| ESP-001/AC-5 | PARTIEL | PG même clé et concurrence ; intent durable client | Interruption/recharge réelle après confirmation perdue |
| ESP-002/AC-1 | PARTIEL | MIG 703 lignes et attribution Mes finances | Reconnexion réelle puis consultation de l’historique |
| ESP-002/AC-2 | PARTIEL | PG 78 actions/familles ; synthèses/contextes raccordés | Toutes pages et générations dans vraie app |
| ESP-002/AC-3 | PARTIEL | Préflight ambiguïtés et SQL croisés, gardes membres | Deux comptes existants réels et refus via routes |
| ESP-002/AC-4 | PARTIEL | SQL backfill rejouable ; PG générations concurrentes | Recharge réelle sur mois déjà généré |
| ESP-002/AC-5 | PARTIEL | SQL interruption/rollback/checksum/gel ; garde rollout | Erreur visible sur vraie page et reprise valide |
| ESP-003/AC-1 | PARTIEL | UI liste puis création couple sans copie ; PG | Rejouer liste actuelle, données des deux espaces après recharge |
| ESP-003/AC-2 | PARTIEL | NAV préférence/contexte ; PG configurations séparées | Bascule de chaque page et prochaine connexion réelles |
| ESP-003/AC-3 | PARTIEL | UI renommage B sous A ; PG membre sans privilège | Sélecteur actualisé et données conservées sur sessions réelles |
| ESP-003/AC-4 | PARTIEL | NAV brouillon, confirmation refusée et réponse tardive ; SESSION verrouille le document | Multi-onglets/late-RSC sur vraie app et échec réseau |
| ESP-003/AC-5 | PARTIEL | PG refus tiers/objets croisés et SQL FK | Tests directs HTTP/UI puis accès valide |
| ESP-004/AC-1 | PARTIEL | UI invitation Mailpit persistée ; aucun accès avant acceptation PG | Courriel externe réellement reçu et invitation visible chez destinataire |
| ESP-004/AC-2 | À PROUVER | Landing/auth/retour/confirmation implémentés ; PG | Connexion existante puis acceptation réelle et sélecteur |
| ESP-004/AC-3 | PARTIEL | PG contribution, renommage, invitation par B | Deux sessions membres réelles et persistance après recharge |
| ESP-004/AC-4 | PARTIEL | PG mauvais compte/non vérifié/préacceptation ; UI mauvais compte | Tiers et invité réel via routes/actions avant adhésion |
| ESP-004/AC-5 | PARTIEL | PG triple acceptation concurrente, rollback et confirmation privée | Reprise d’échec et double confirmation via vraie UI |
| ESP-005/AC-1 | À PROUVER | Landing explicite et AuthView existant raccordés | Inscription réelle conserve le lien et n’accepte pas automatiquement |
| ESP-005/AC-2 | À PROUVER | PG acceptation sans espace personnel ; identité fraîche | Compte créé/vérifié réel rejoint explicitement |
| ESP-005/AC-3 | PARTIEL | UI mauvais compte ; PG refus ; SESSION changement de compte conserve retour et refuse erreur signout | Mauvais compte après inscription puis bon compte réel |
| ESP-005/AC-4 | À PROUVER | Lien durable, liste invitations et choix sans espace implémentés | Interruption/reprise signup/auth sans adhésion automatique |
| ESP-005/AC-5 | À PROUVER | PG contributions communes et persistance | Nouvel inscrit ajoute puis recharge, autre session retrouve la dépense |
| ESP-006/AC-1 | PARTIEL | UI Oui propose email facultatif, création espace réutilisée | Véritable premier onboarding, report et émission externe |
| ESP-006/AC-2 | PARTIEL | Formulaire continue sans attendre ; espace durable PG | Utilisation réelle pendant invitation en attente |
| ESP-006/AC-3 | PARTIEL | UI Non saute invitation et espace personnel créé | Rejeu actuel depuis nouveau compte, réglages ultérieurs |
| ESP-006/AC-4 | PARTIEL | PG panne/retry même invitation/token ; intent durable ; UI message | Panne SMTP/Resend injectée dans vraie app, correction/recharge sans doublon |
| ESP-006/AC-5 | À PROUVER | PG guide/config communs ; acceptation ne provisionne rien | Conjoint existant et nouveau rejoignent l’espace déjà configuré |

## Gates globaux ouverts

1. Réception externe Resend et lien utilisable depuis la boîte contrôlée ; origine publique/callback autorisée, quota/coût connu. Ne pas déduire l’autorisation du destinataire de EMAIL_TO.
2. Deux sessions Auth réelles : compte existant, nouveau compte/vérification, retour conservé, acceptation distincte et contribution persistante. Aucune session simulée ne clôt ce gate.
3. Vraie app : onglets, réponses tardives, caches RSC et navigation offline/déconnexion. Le refus de navigateur antérieur n’est pas contourné.
4. Playwright MCP : outil requis absent/refus d’accès ; captures CUA et banc CLI gardent leur nom et leur portée.
5. CI distante verte sur le SHA exact et revue globale ; aucun push/déploiement autorisé. Workflow local préparé ne prouve pas les réglages de branche ni un run distant.
6. Réconciliation opérationnelle d’un envoi incertain : après 23 h, aucune reprise aveugle ; vérifier l’événement fournisseur et la réception, puis intervention autorisée. Runbook et statement testés sur clone synthétique ; intervention réelle et preuves fournisseur/réception encore non acquises.

URL de recette locale : http://localhost:3002. Source et baseline privée ne sont pas migrées en production. Les stories restent en cours, sans changement artificiel de leurs critères.
