# Matrice de recette — 17 exigences et 30 critères

État courant au 2026-10-26 ; preuves historiques conservées et complétées par deux parcours réels de destinataire. **Le goal n’est pas atteint.**

Sources : requirements.md et six stories dans `.app-factory/backlog/epics/finances-partagees/features/espaces-financiers/`. Maquettes approuvées : `cs-design/mes-finances/features/espaces-financiers-essai-02/`, commit 7aaec6d.

VÉRIFIÉ signifie exigence ou critère observé dans la recette réelle indiquée ; cela ne clôture ni une story ni les gates globaux. PARTIEL signifie code et preuves bornées présents, mais preuve de bout en bout insuffisante. À PROUVER signifie trajet demandé non exécuté. Aucun statut ne transforme un mock en preuve Auth ou email réel.

## Références des preuves

- **MIG** : migration-execution.md ; conservation stricte du nouveau clone avant UI dans invitations-management-execution.md. 703 lignes, 18 tables, 175 colonnes inchangées. Ancien certificat invalide conservé, jamais réécrit en succès.
- **PG** : suites `__tests__/integration/*.db.ts`, six familles, 97 tests réels sur PostgreSQL ; Auth et transport simulés. Désormais les mêmes suites passent aussi sur 42 lignes entièrement fictives.
- **SQL** : `__tests__/integration/financial-spaces-migration.test.mjs`, 21 tests ; restauration/rejeu/gel/relations et refus d’ambiguïtés. Cinq tests supplémentaires protègent le certificat synthétique contre CHECK/index/default/enum altérés.
- **NAV** : ui-context-execution.md et six scénarios du banc `__tests__/browser/space-navigation-fixture/` ; vrais composants, services et routeur simulés.
- **UI** : invitations-management-execution.md ; parcours CUA dans la vraie app avant mise à niveau des dépendances. Création solo/couple, réglages ciblés, Mailpit et mauvais compte observés ; captures privées. Cela ne constitue pas une validation Playwright MCP ni une recette actuelle complète.
- **UI-CURRENT** : mailpit-current-execution.md ; vraie app au c704c80, invitation depuis fiche, reception SMTP Mailpit observee, lien ouvert/mauvais compte refuse, recharge et seconde soumission sans doublon. CUA avec locators Playwright, distinct de PlaywrightMCP ; aucune acceptation/nouveau compte reelle prouvee.
- **UI-VERIFY** : invitation-verification-execution.md etDEC-004 ; API OTP dédiée, gardes acteur/adresse/invitation et confirmation Auth fraîche,246unit/99PG, banc7cas, qualité et revue verts. Rendu/saisie CUA375/1280sans envoi ni validation OTP réels ; fournisseur simulé dans les tests, pas de preuve d’adhésion hébergée.
- **UI-ACCESS** : private-access-current-execution.md ; création nom80, question Oui/Non, recharge, option unique désactivée ; deux sessions Auth réellement distinctes mais toutes deux non vérifiées. Mailpit reçu dans les deux sens, aucune adhésion. Refus étranger réparé en404générique, contrôle desktop/mobile375 et retour autorisé ;233unit/97PG/build/types/lint/7gardes/auditprod verts. CUA distinct deMCP.
- **UI-ISOLATION** : isolation-current-execution.md ; revenus125.25personnel/987.65couple persistants en vraie UI et SQLread-only, deux espaces avec un seul membre chacun. Réservation navigation corrigée et captures réelles ChromeDevToolsMCP avant/après connexion375/1280 ; session anonyme, pas de PlaywrightMCP ni recette financière mobile finale. Lien interne Auth perdant redirectTo découvert puis corrigé (DISC-ESP-009), voir AUTH-RETURN.
- **UI-RESP** : responsive-current-execution.md ; fiches375/1280, deuxdepenses reellesfictives, reload/bascule/dernierespace et guide separes. Defauts FAB/alignement reproduits/corriges et revuecaptures. CUA+locatorsPlaywright, pasMCP ni deuxmembres.
- **AUTH-RETURN** : auth-invitation-return-execution.md ; test RED sur vrai rendu serveur AuthPage/AuthProviders/AuthView puis14nouveaux tests,260unit/qualité verts. Liens signup→signin et forgot conservent invitation après clic/recharge DevTools ; retour externe non propagé. Aucun formulaire Auth soumis, pas de preuve d’inscription/adhésion.
- **AUTH-LOCAL** : `.Codex/adhoc/sessions/2026-10-23-safari-auth.md` ; cookie Secure rejeté HTTPWebKit/accepté HTTPS, vraie page login via redirection ; dix lectures RSC deviennent une, identités/requêtes/pannes isolées dans vrai Next de production et bouton reprise vérifié.265unit/99PG/9delivery/build/types/lint verts. Pas de login hébergé Safari ni de réception externe prouvés.
- **AUTH** : dependency-repair-execution.md ; sept tests de contrat du véritable adaptateur, transport simulé. Lecture serveur sans mutation, fraîcheur explicite des décisions d’invitation. UI-ACCESS prouve deux sessions hébergées distinctes préexistantes ; aucune adhésion ni nouvel utilisateur vérifié prouvés.
- **MAIL** (historique avant recette externe) : DEC-001, tests invitation/mail, réception Mailpit observée. Lecture Resend du 2026-10-23 : domaine expéditeur vérifié, sending enabled, receiving disabled ; origine publique et boîte de recette explicite absentes. Aucun email externe envoyé/reçu.
- **SESSION** : session-delivery-execution.md et DEC-003 ; garde du vrai layout avec identité serveur, signout contrôlé (y compris retour invitation), invalidation/expiration/historique/offline ; douze tests sans navigateur. Extension private-entry-session-execution.md : vraies entrées privées gardées et refus serveur de changement d’acteur (quatre tests de rendu, deux tests PG). Runbook de réconciliation et trois tests PG de sa mutation minimale, aucune preuve fournisseur ou réception réelle ajoutée.
- **CI** : workflow local `.github/workflows/financial-spaces.yml` ; gardes RED puis vert, résultat final testé contre échec/annulation/skip/absence. Aucun run GitHub sur ce SHA ni protection distante prouvés.

Les références *.md ci-dessus sont dans ce même dossier de preuves, sauf DEC-001 dans `.Codex/adhoc/decisions/`. Les journaux privés restent sous `.local/financial-spaces/` ; aucun jeton, contenu de boîte ou adresse réelle dans cette matrice.

- **MAIL-REAL** : resend-real-execution.md ; invitation soumise depuis la fiche dans un espace vide dédié, réception externe Gmail observée (indésirables), lien réellement reçu ouvert en session anonyme et inscription avec retour conservé. DB locale en lecture seule :1invitationpending/1tentativesent/1membre avant acceptation ; GETResend200/last_eventdelivered. Mauvais compte refusé et accès anonyme aux finances renvoyé verslanding. Inscription non soumise : mot de passe/conditions demandent handoff humain. Aucune preuve d’adhésion ni contribution à deux ajoutée.

- **FIN-REAL** : suite de resend-real-execution.md ; vraie UI créateur : revenu récurrent fictif2345.67, génération unique malgré recharges et bascules, réception2300.12 persistante ; rappels partagés1/3/7/14, personnel1/3/7 et absence du modèle. Lecture SQLREADONLY et captures privées vérifient montants/espace/absence de doublon. Une identité seulement, pas de preuve de contributionB ou de tous les automatismes.

- **REF-REAL** : suite de resend-real-execution.md ; catégorie/carte fictives et abonnement39.99 créés dans le couple viaUI, génération automatique uniquePAID avec références conservées, recharges et absence personnelle en UI/SQLREADONLY. Double fermeture Carte/Catégorie reproduite/corrigée et capturée ; autres trois modales de même cause corrigées côté source, visualisation réelle encore ouverte.265unit et build/types/lint/9delivery verts. Cette preuve ne ferme ni toutes les familles ni les gates MCP/revue indépendante.

- **PATRIMOINE-REAL** : suite de resend-real-execution.md ; objectif/contribution123.45, dette500+25.50+5−75.25=455.25 persistants, journaux SQLREADONLY dans bon espace, absence personnelle et retourcouple. Trois modales restantes de DISC013 vues ; sélection obsolète DISC014 reproduite puis corrigée, banc React/Chromium REDancien/GREEN3cas, champs conservés et cible disparue masquée. Ce banc simule props/services et ne ferme ni Auth ni MCP ni revue indépendante.

- **TRANSFER-GUIDE-REAL** : suite de resend-real-execution.md ; transfert23.45 conserve total123.45/reload et personnel0, deux écritures opposées SQL ; dépassementUI bloqué. Guide4/4 corrigé en texte, faux1/4 du pot technique reproduit puis corrigé ; REDPG puis100services verts, UIpersonnel0/4/couple4/4 et qualité finale. Pas de nouvelle identité réelle ni CI/MCP/revue globale.

- **MULTITAB-REAL** : multitab-current-execution.md ; deux onglets Chrome, même identité, personnel0dépense/couple4, bascule du second et retourSPA, recharge du premier et retourdocumentaire revalidé sans mélange. Captures privées et SQLREADONLY confirment4/1achat contre0/0 ; brouillon non enregistré. Dialogueconfirm déclenché mais annulationUI non vérifiée après panne du pilote. Ni BFCache ni offline ni seconde identité prouvés.

- **NEW-ACCOUNT-REAL** : resend-real-execution.md,26octobre ; inscription réelleMCP, OTPNeon reçuGmail, vérification, consentementdistinct, refus404avantacceptation,2membres etaucunpersonnelimposé. B23.45 ajoutée/rechargée viaMCP, A12.34 etB vues dans les deuxsessions, SQLREADONLY confirmeauteursdistincts/isolation. B renomme puisrestaure, A voit le changement ; personnelArefuséB etlienaccepténonrejouable. CapturesMCPdesktop/mobileinspectées. Parcourscompteexistant etgatesglobauxrestentouverts.

## Exigences

Référence **EXISTING-ACCOUNT-REAL** : resend-real-execution.md,26octobre ; Resend reçuInbox, landing/listeprivée,404avantconsentement, acceptationMCP compteconnecté ; deuxappartenancespréservées. B45.67danssecond etAvoit, premierB23.45isolé ; vrai dialoguebrouilloncancel/accept ; signin reprenddernierespace etSQLREADONLYconcordant. TLSdurable/gatesglobauxouverts.

| ID | État | Preuves disponibles | Preuve restante pour clôture |
|---|---|---|---|
| FR-001 | VÉRIFIÉ | FIRST-ONBOARDING-REAL : deux nouveaux comptes, nom, questionOui/Non, solo sans invitation ; usage et SQL réel | Gates globaux ouverts |
| FR-002 | VÉRIFIÉ | MIG/SQL conservation exacte et LEGACY-HISTORY-REAL : compte réellement mappé, synthèses et historique ancien consultés | Gates globaux ouverts, distincts du critère littéral |
| FR-003 | VÉRIFIÉ | PG toutes familles ; EXISTING-ACCOUNT-REAL deux espaces réels, bascule, recharge et reconnexion | Gates globaux ouverts, distincts du critère littéral |
| FR-004 | VÉRIFIÉ | FIRST-ONBOARDING-REAL optionunique désactivée desktop/mobile ; EXISTING-ACCOUNT-REAL signin reprend dernierespace ; SESSION-MCP-REAL sélecteur seul | Gates globaux ouverts |
| FR-005 | VÉRIFIÉ | PG toutes familles/configurations/générations ; FIN/REF/PATRIMOINE/TRANSFER/ALLOCATION-REAL et lectures B réelles | Gates globaux ouverts, distincts du critère littéral |
| FR-006 | VÉRIFIÉ | EXISTING-ACCOUNT-REAL listeprivée/acceptation ; FIRST-ONBOARDING-REAL email→landing→signin→retour→acceptation distincte | Reprises fournisseur et gates globaux traités séparément |
| FR-007 | VÉRIFIÉ | NEW-ACCOUNT-REAL : page explicite, signup/OTP réels, retour et acceptationdistincte, pas de personnelimposé | Gate global visuel/revue/CI reste ouvert |
| FR-008 | VÉRIFIÉ | FIRST-ONBOARDING-REAL : premierSoloNon sansemail, premierPartagéOui propose email facultatif ; UIreport etPGcomplètent | Échec fournisseur réel reste ouvert dansESP006/AC4 |
| FR-009 | VÉRIFIÉ | NEW-ACCOUNT-REAL et NONCREATOR-DOUBLE-ACCEPT-REAL : B contribue, renomme et invite sans rôle créateur | Gates globaux ouverts, distincts du critère littéral |
| FR-010 | VÉRIFIÉ | ACCOUNT-CHANGE-DETAIL-REAL : liste/fiche/membres ; fiche inactive conserve le contexte financier actif | Gates globaux ouverts, distincts du critère littéral |
| NFR-001 | VÉRIFIÉ | PG/SQL tiers et IDs croisés ; vrais refus directs préacceptation, mauvais compte et espace étranger | Gates globaux ouverts, distincts du critère littéral |
| NFR-002 | VÉRIFIÉ | MIG/SQL conservation ; PG concurrence ; contributions persistantes à deux, double acceptation UI et reprise SMTP | Gates globaux ouverts, distincts du critère littéral |
| NFR-003 | VÉRIFIÉ | NAV/PG et SESSION-MCP-REAL : brouillon, panne/reprise, RSC retardée, masquage hors ligne et déconnexion | Gates globaux ouverts, distincts du critère littéral |
| UXR-001 | VÉRIFIÉ | SESSION-MCP-REAL tiroir375Tab/ShiftTab/Escape/focus/bascule, desktop sélecteur seul ; FIRST-ONBOARDING-REAL optionunique désactivée | Gates globaux ouverts |
| UXR-002 | VÉRIFIÉ | Captures actuelles MCP desktop/mobile inspectées ; montants et noms longs UI-RESP ; captures sans CSS exclues | Gates globaux ouverts, distincts du critère littéral |
| TR-001 | VÉRIFIÉ | Stack/services existants conservés ; recette réelle Resend autorisée et coûts/quotas tracés sans nouveau service payant | Gates globaux ouverts, distincts du critère littéral |
| TR-002 | VÉRIFIÉ | Plan approuvé, PG/MIG/MCP réels, test préexistant réparé, revue indépendante favorable ; DoD globale distincte | Gates globaux ouverts, distincts du critère littéral |

## Critères des stories

| ID | État | Preuves disponibles | Observation restante |
|---|---|---|---|
| ESP-001/AC-1 | VÉRIFIÉ | FIRST-ONBOARDING-REAL deux premiers espaces réels, configuration/usage, SQL unicité et même contexte | Gates globaux ouverts |
| ESP-001/AC-2 | VÉRIFIÉ | FIRST-ONBOARDING-REAL solo Non ; ACCOUNT-CHANGE-DETAIL-REAL formulaire d’invitation ultérieur accessible | Gates globaux ouverts, distincts du critère littéral |
| ESP-001/AC-3 | VÉRIFIÉ | FIRST-ONBOARDING-REAL seul espace réel, optionunique désactivée desktop/mobile, fermeture clavier ; gestion absente | Gates globaux ouverts |
| ESP-001/AC-4 | VÉRIFIÉ | PG noms invalides ; FIRST-ONBOARDING-REAL réponsecréation perdue, erreur visible et retry fonctionnel sans accès indu | Gates globaux ouverts |
| ESP-001/AC-5 | VÉRIFIÉ | FIRST-ONBOARDING-REAL réponse200perdue puisretry sansdoublon ; SMTP-RECOVERY-MCP nouvellevisite/recharge retrouve même espace et7.89, SQLunicité | Gates globaux ouverts |
| ESP-002/AC-1 | PARTIEL | MIG/SQL et LEGACY-HISTORY-REAL : données et historique retrouvés après revalidation de la session réelle | Déconnexion puis nouvelle connexion du compte historique non exécutées ; ne pas assimiler un reload à ce trajet |
| ESP-002/AC-2 | VÉRIFIÉ | PG/MIG toutes familles et générations ; LEGACY-HISTORY-REAL synthèses, dépenses et revenus anciens du compte mappé | Gates globaux ouverts, distincts du critère littéral |
| ESP-002/AC-3 | VÉRIFIÉ | MIG ambiguïtés/FK/attribution ; PG tiers ; vrais refus de routes et séparation de comptes | Gates globaux ouverts, distincts du critère littéral |
| ESP-002/AC-4 | VÉRIFIÉ | MIG rejouable et PG générations concurrentes ; recharges réelles sans doublon et historique conservé | Gates globaux ouverts, distincts du critère littéral |
| ESP-002/AC-5 | VÉRIFIÉ | SQL interruption/rollback/checksum/gel et refus explicites des gardes ; originales conservées, reprise certifiée | Gates globaux ouverts, distincts du critère littéral |
| ESP-003/AC-1 | VÉRIFIÉ | Création supplémentaire réelle sans copie ; liste actuelle et deux contextes persistants vérifiés | Gates globaux ouverts, distincts du critère littéral |
| ESP-003/AC-2 | VÉRIFIÉ | EXISTING-ACCOUNT-REAL recharge/reconnexion/dernier espace ; PG toutes familles et configurations isolées | Gates globaux ouverts, distincts du critère littéral |
| ESP-003/AC-3 | VÉRIFIÉ | NEW-ACCOUNT-REAL : B renomme, fiche/sélecteur changent, Avoitaprèsreload, nomrestauré etfinancesconservées | Gatesglobauxouverts |
| ESP-003/AC-4 | VÉRIFIÉ | SESSION-MCP-REAL vraie RSC retardée, panne/reprise et hors ligne ; dialogue MCP annuler/conserver puis accepter/abandonner | Gates globaux ouverts, distincts du critère littéral |
| ESP-003/AC-5 | VÉRIFIÉ | PG tiers/IDs croisés ; vrais refus HTTP/UI puis accès autorisé après consentement | Gates globaux ouverts, distincts du critère littéral |
| ESP-004/AC-1 | VÉRIFIÉ | EXISTING-ACCOUNT-REAL : réceptionexterne, landing/listeprivée identifientespace, accèspréalable404 | Gatesglobauxouverts |
| ESP-004/AC-2 | VÉRIFIÉ | EXISTING-ACCOUNT-REAL : alternativecompteconnecté, consentementdistinct,2membres,autreespacepréservé,sélecteur/reconnexion | Gatesglobauxouverts |
| ESP-004/AC-3 | VÉRIFIÉ | Deux sessions réelles, contributions rechargées, renommage et invitation par B non créateur | Gates globaux ouverts, distincts du critère littéral |
| ESP-004/AC-4 | VÉRIFIÉ | PG plus vrais refus mauvais compte, tiers et préacceptation ; accès seulement après adhésion | Gates globaux ouverts, distincts du critère littéral |
| ESP-004/AC-5 | VÉRIFIÉ | PG concurrence/rollback ; NONCREATOR-DOUBLE-ACCEPT-REAL deux POST UI concurrents, deux confirmations, une appartenance | Gates globaux ouverts, distincts du critère littéral |
| ESP-005/AC-1 | VÉRIFIÉ | NEW-ACCOUNT-REAL : page publique explicite et signup réelMCP, retourconservé, pas d’adhésionautomatique | Pas de réserve propre au scénario exécuté ; gatesglobaux ouverts |
| ESP-005/AC-2 | VÉRIFIÉ | NEW-ACCOUNT-REAL : OTPGmailNeon, acceptationdistincte,2membres,1seuleappartenanceB,0personnelimposé | Pas de réserve propre au scénario exécuté ; gatesglobaux ouverts |
| ESP-005/AC-3 | VÉRIFIÉ | ACCOUNT-CHANGE-DETAIL-REAL mauvais compte inscrit refusé, changement de compte et retour conservé jusqu’à la bonne acceptation | Gates globaux ouverts, distincts du critère littéral |
| ESP-005/AC-4 | VÉRIFIÉ | NEW-ACCOUNT-REAL : après signup/vérification, poursuivre versfinances reste404avantacceptation ; retourinvitationchoixconservé | Pas de course réseau tardive prétendue ; gatecacheglobal ouvert |
| ESP-005/AC-5 | VÉRIFIÉ | NEW-ACCOUNT-REAL : B23.45 créée/rechargée, A voitB dans autre session ; SQLauteursdistincts etespacepersonnelAisolé | Pas de réserve propre au scénario exécuté ; gatesglobaux ouverts |
| ESP-006/AC-1 | VÉRIFIÉ | FIRST-ONBOARDING-REAL nouveaucompte, Oui→email facultatif, Resend reçu Inbox depuis premier parcours ; reportUI/PG | Gates globaux ouverts |
| ESP-006/AC-2 | VÉRIFIÉ | FIRST-ONBOARDING-REAL D configure32.10/reload et guide1/4 avant adhésion, SQL invitationpending | Gates globaux ouverts |
| ESP-006/AC-3 | VÉRIFIÉ | FIRST-ONBOARDING-REAL Non saute invitation ; ACCOUNT-CHANGE-DETAIL-REAL fiche solo et formulaire ultérieur accessibles | Gates globaux ouverts, distincts du critère littéral |
| ESP-006/AC-4 | VÉRIFIÉ | SMTP-RECOVERY-MCP vraiSMTPindisponible, erreur/continuer visible aprèsfix017 ;7.89 conservés, SMTP rétabli/retry Mailpit reçu ; uneinvitation/espacedurable | CI/TLS/release restent ouverts |
| ESP-006/AC-5 | VÉRIFIÉ | FIRST-ONBOARDING-REAL compteexistant retrouve32.10/guide1/4, contribue4.56vueparcréateur ; NEW-ACCOUNT-REAL nouveau retrouve financesconfigurées et contribue23.45 ; SQL pasdedoublons | Gates globaux ouverts |

## État courant et gates globaux — 26 octobre

**17 exigences littérales vérifiées ; 29/30 AC vérifiés.** ESP-002/AC-1 reste partiel pour la nouvelle connexion du compte historique. Ces statuts composent les preuves pertinentes ; ils ne signifient pas que les 6 stories ou le goal sont DONE.

Références complémentaires dans resend-real-execution.md : **FIRST-ONBOARDING-REAL**, **SMTP-RECOVERY-MCP**, **SESSION-MCP-REAL**, **ACCOUNT-CHANGE-DETAIL-REAL**, **HISTORY-ACCOUNT-REAL**, **NONCREATOR-DOUBLE-ACCEPT-REAL**, **LEGACY-HISTORY-REAL**. Elles remplacent les limites historiques des références antérieures pour les trajets effectivement rejoués. LEGACY-HISTORY-REAL est du vrai Chrome/CUA, distinct du MCP Playwright qui couvre les parcours destinataire/onboarding/mobile/session.

Gates encore ouverts :

1. Nouvelle connexion explicite du compte historique pour ESP-002/AC-1. La session A existante revalidée et l’historique consulté ne sont pas présentés comme une nouvelle saisie Auth.
2. HTTP-PRIVACY-MCP (`http-cache-current-execution.md`) : serveur HTTP, cookies loopback et navigation Auth documentaire validés ; activation/purge du script SW réel exercées dans un profil QA, déclenchement explicite par query de version aux bytes identiques. Rollout naturel production encore dû. WebKit26 acquis, Safari natif utilisateur distinct.
3. HTTP-PRIVACY-MCP : vrai navigateur MCP isolé/sandbox actif/BFCache activé, aller-retour effectué ; persistedfalse et exclusions CDP no-store/WebSocketdev/browsinginstance, retour après logout public et requête privée anonyme307 sans données. Aucune restauration persistedtrue prétendue ; preuve production encore due.
4. CI distante verte sur le SHA livré. Publication et protection main explicitement autorisées, PRdraft1 ouverte. Premier run40409204080 qualitéSUCCESS/PGFAILreadiness/requiredFAIL ; correctif TCP a89406c et nouvelle CI réelle40410232726 en cours. Les variables/callbacks et l’ordre de publication de production restent à vérifier avant merge/bascule.

Acquis globaux : deux parcours de destinataire depuis de vrais emails Resend reçus ; inscription/OTP/acceptation et contributions à deux ; visuel MCP desktop/mobile inspecté ; 266 tests unitaires, build/types/lint et 11 gardes de livraison locaux verts au code3b71827 ; revue indépendante favorable, hashes exacts rattachés. PG/MIG gardent leurs périmètres documentés, pas prétendus réexécutés pour le dernier changement d’entrée onboarding.

Réconciliation d’envoi incertain : runbook et statement sur clone synthétique acquis ; aucune intervention réelle nécessaire en l’absence d’incident. Après23h, ne pas renvoyer aveuglément ; vérifier fournisseur/réception et autorisation.

URL locale actuelle : http://localhost:3002 directement, sans redirection HTTPS. Runtime de recette Mailpit HTTP, copie spaces_work17. Branche de livraison publiée et PRdraft1 ; aucune migration ni publication production. Ancien audit delivery-current-audit.md reste un relevé historique au5101fa5 ; l’état courant est cette matrice et resend-real-execution.md.

DécisionhumaineactuelleINVITATION-LINK-NO-OTP-REAL/DEC005 : aucunOTPdansl’acceptation ; lespreuvesOTPplushautrestenthistoriques. NouveaucontratvérifiéPG/MCP : sessiondestinataire+jetonoriginal pournonverified, acceptationdistincte, Authflagnonfabriqué. Les17exigences/30ACproduitrestentlesmêmes ; cette suppression d’uneétape technique additionnelle ne vaut pas clôture de la DoD/CI. Qualitéactuelle256unit/100PG/14delivery/build/types/lint0 ; preuvesréellesetchangementdécisionconsignésdansresend-real-execution.md.
