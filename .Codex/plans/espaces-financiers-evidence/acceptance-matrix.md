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

## Exigences

| ID | État | Preuves disponibles | Preuve restante pour clôture |
|---|---|---|---|
| FR-001 | PARTIEL | PG création atomique/idempotente ; UI création nommée solo/couple | Nouveau compte réel, suite de configuration et finances desktop/mobile après mise à niveau |
| FR-002 | PARTIEL | MIG/SQL conservation exacte, backfill Mes finances et map stable | Reconnexion navigateur du compte existant avec toutes pages ; release cible autorisée |
| FR-003 | PARTIEL | PG espaces distincts ; UI personnel puis couple vide | Deux espaces sur toutes les pages avec recharge, vrai compte |
| FR-004 | PARTIEL | NAV sélecteur seul et préférence ; PG dernier espace | UI-ACCESS prouve option unique désactivée et création mobile ; connexion/reconnexion reste ouverte |
| FR-005 | PARTIEL | 78 actions contextualisées, PG toutes familles ; FIN-REAL revenu/rappels et REF-REAL références/abonnement et PATRIMOINE-REAL épargne/dette et TRANSFER-GUIDE-REAL transfert/guide isolés en vraie UI | Tour E2E de toutes fonctions et automatismes sur deux contextes |
| FR-006 | PARTIEL | MAIL local, MAIL-REAL réception externe et lien, PG acceptation ; UI landing explicite et mauvais compte | UI-VERIFY parcours de vérification raccordé ; réception OTP/externe, acceptation et contribution à deux sessions restent à prouver |
| FR-007 | À PROUVER | Routes publiques/auth/confirmation implémentées ; AUTH et PG bornés | Inscription réelle, réception/confirmation OTP, retour et acceptation sans espace imposé ; UI-VERIFY ne couvre que le raccordement et les tests bornés |
| FR-008 | PARTIEL | UI Non saute et Oui propose invitation ; même service | Nouveau compte réel, report d’envoi et reprise mobile/desktop |
| FR-009 | PARTIEL | PG membre B modifie/renomme/invite sans rôle créateur | Deux sessions réelles contribuent et gèrent après recharge |
| FR-010 | PARTIEL | UI liste/création/détail ; renommer B sous A actif | Rejouer interface actuelle, liste des membres et sélecteur actualisé |
| NFR-001 | PARTIEL | PG tiers/IDs croisés ; SQL FK composites et space_id obligatoire | UI-ACCESS prouve refus de pages étrangères dans deux sessions réelles ; compléter endpoints et autres familles |
| NFR-002 | PARTIEL | MIG/SQL exacts ; PG génération et acceptation concurrentes | Recharge navigateur/multisession et reprise réelle sans mélange |
| NFR-003 | PARTIEL | NAV requêtes tardives et brouillons ; PG concurrence ; SESSION masquage et invalidation | Vraie app multi-onglets, réponses RSC tardives, échec de bascule et offline |
| UXR-001 | PARTIEL | NAV et UI sélecteur/sidebar/drawer | UI-RESP fiches/depenses375et1280 acquis ; UI-ACCESS optionunique acquis ; MCP et claviercomplet restent ouverts |
| UXR-002 | PARTIEL | Maquettes React intégrées à la vraie app ; UI avant mise à niveau | UI-RESP montants3.99/1450etnomlong acquis surdepenses ; MCP et autrespagesentieres restent ouverts |
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
| ESP-002/AC-4 | PARTIEL | SQL backfill rejouable ; PG générations concurrentes ; FIN-REAL une ligne revenu après plusieurs recharges | Compléter autres familles et reprise globale |
| ESP-002/AC-5 | PARTIEL | SQL interruption/rollback/checksum/gel ; garde rollout | Erreur visible sur vraie page et reprise valide |
| ESP-003/AC-1 | PARTIEL | UI liste puis création couple sans copie ; PG | Rejouer liste actuelle, données des deux espaces après recharge |
| ESP-003/AC-2 | PARTIEL | NAV préférence/contexte ; PG configurations séparées | UI-RESP depenses/reload/racine acquis ; autres pages et prochaine connexion reelles |
| ESP-003/AC-3 | PARTIEL | UI renommage B sous A ; PG membre sans privilège | Sélecteur actualisé et données conservées sur sessions réelles |
| ESP-003/AC-4 | PARTIEL | NAV brouillon, confirmation refusée et réponse tardive ; SESSION verrouille le document | Multi-onglets/late-RSC sur vraie app et échec réseau |
| ESP-003/AC-5 | PARTIEL | PG refus tiers/objets croisés et SQL FK | Tests directs HTTP/UI puis accès valide |
| ESP-004/AC-1 | PARTIEL | UI-CURRENT Mailpit et MAIL-REAL réception externe/lien fonctionnel/mauvais compte refusé ; aucun accès avant acceptation PG | Courriel externe reçu ; liste privée chez destinataire après authentification reste à prouver |
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
| ESP-006/AC-4 | PARTIEL | PG panne/retry meme invitation/token ; UI-CURRENT seconde soumission sans doublon de mail ; intent durable | Panne SMTP/Resend injectée dans vraie app, correction/recharge sans doublon |
| ESP-006/AC-5 | À PROUVER | PG guide/config communs ; acceptation ne provisionne rien | Conjoint existant et nouveau rejoignent l’espace déjà configuré |

## Gates globaux ouverts

1. Réception externe Resend et lien local prouvés par MAIL-REAL ; classement Gmailspam à examiner. Origine publique/callback production restent à vérifier avant release. Destinataire explicitement autorisé par l’humain, jamais déduit de EMAIL_TO.
2. Deux sessions Auth réelles : compte existant, nouveau compte/vérification, retour conservé, acceptation distincte et contribution persistante. Aucune session simulée ne clôt ce gate.
3. Vraie app : onglets, réponses tardives, caches RSC et navigation offline/déconnexion. Le refus de navigateur antérieur n’est pas contourné.
4. Playwright MCP : outil requis absent ; acces HTTP navigateur maintenant autorise et recette UI-CURRENT reussie. Captures CUA/locators Playwright et banc CLI gardent leur nom et leur portee.
5. CI distante verte sur le SHA exact et revue globale ; aucun push/déploiement autorisé. Workflow local préparé ne prouve pas les réglages de branche ni un run distant.
6. Réconciliation opérationnelle d’un envoi incertain : après 23 h, aucune reprise aveugle ; vérifier l’événement fournisseur et la réception, puis intervention autorisée. Runbook et statement testés sur clone synthétique ; aucune intervention réelle requise sans incident et autorisation ; réception externe du goal toujours non acquise.

URL de recette locale : http://localhost:3002. Source et baseline privée ne sont pas migrées en production. Les stories restent en cours, sans changement artificiel de leurs critères.

Audit courant : [delivery-current-audit.md](delivery-current-audit.md), code5101fa5. CI distante SHAcomplet :0run ;260unit/build/types/lint0warning/7gardes locaux verts. Ancien delivery-audit.md conservé comme historique. Aucune preuve de réception externe, adhésion ou PlaywrightMCP ajoutée.

Recette locale actuelle du23octobre : voir UI-CURRENT. Le refus de l’ancien onglet data: ne constitue plus un blocage general du navigateur ; nouvel onglet HTTP utilise avec autorisation humaine.

RecetteUI-RESP : deux depenses ponctuelles fictives creees/rechargees dans le couple seulement, personnel vide, guide et dernierespace controles. Captures375/1280 et deux corrections visuelles ; aucune cloture globale ou preuve multisession ajoutee.


Recette externe du23octobre21:03UTC : MAIL-REAL lève l’ancien manque de boîte/réception. Le runner68803 sert HTTPS3443 avec option explicite `--resend`, Mailpit reste le défaut hors option. Session destinataire IAB préparée, mot de passe vide, aucune inscription/acceptation automatique. Les gates de contribution réelle, nouveau compte, CI et PlaywrightMCP restent ouverts. Cette preuve CUA n’est pas renommée PlaywrightMCP.
