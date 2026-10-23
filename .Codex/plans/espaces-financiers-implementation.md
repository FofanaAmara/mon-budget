# Plan d’implémentation — Espaces financiers personnels et partagés

Date : 2026-10-22. Version : 1.1 (configuration mail actualisée, sans exécution). **Statut : proposé à validation humaine ; aucune implémentation commencée.**
Skill : `agent-work-methodology:planning-methodology`. Mandat : plan du chantier complet, six stories ESP-001 à ESP-006. Assurance proposée : renforcée, risque critique sur isolation et conservation des finances.

## 1. Résumé exécutif

Faire de l’espace financier le périmètre de toutes les données financières, en conservant l’authentification individuelle. Chaque membre a les mêmes droits. Livrer l’expérience React approuvée : question de partage pendant l’onboarding, invitation conditionnelle, page explicite avant connexion, sidebar limitée au sélecteur, gestion des espaces dans Réglages avec liste puis détail.

Approche proposée :

- Introduire espaces et appartenances, rattacher les données existantes à un espace « Mes finances » par compte et conserver les identifiants/montants/relations.
- Porter explicitement l’espace dans la navigation et chaque appel serveur ; vérifier l’appartenance puis filtrer les objets et leurs relations sur cet espace. Un utilisateur n’est plus le propriétaire exclusif d’une donnée partagée.
- Séparer configuration financière commune et préférences individuelles, fermer les chemins de génération/caches/réinitialisation qui contournent le contexte.
- Développer les six parcours verticaux du backlog ; n’exposer le multiespace qu’une fois toutes les fonctions contextualisées. Ajouter les invitations après ce socle, avec acceptation atomique distincte de l’authentification.
- Migrer avec expansion, backfill contrôlé, validation et bascule ; garder les colonnes historiques pendant la période de sûreté. Après premières écritures partagées, retour arrière vers une version compatible espaces, jamais vers l’ancien modèle utilisateur.

**Impact :** ensemble des actions financières, pages et formulaires, navigation, auth de retour d’invitation, schéma, scripts de migration, service worker et tests. Aucun redesign supplémentaire, aucune bibliothèque de composants ni Storybook. Les décisions ci-dessous sont des propositions techniques de ce plan ; les choix produit déjà approuvés restent acquis.

## 2. État actuel

### Sources vérifiées

- [Backlog et décisions](../../.app-factory/backlog/epics/finances-partagees/features/espaces-financiers/feature-brief.md), [17 exigences](../../.app-factory/backlog/epics/finances-partagees/features/espaces-financiers/requirements.md), six stories / 30 AC, priorité immédiate. [Input](../inputs/espaces-financiers/input.md).
- [Maquettes React approuvées](../../cs-design/mes-finances/features/espaces-financiers-essai-02/README.md), version `7aaec6d`. Les anciennes maquettes HTML sont écartées. Le prototype simule les données, les comptes et les invitations.
- Next 16.1.6 / React 19.2.3, SQL Neon via `lib/db.ts`, Neon Auth. Pas d’ORM ni commande `db:generate` dans `package.json` ; migrations actuelles par scripts SQL manuels dans `scripts/`.
- `requireAuth()` renvoie seulement `session.user.id`. Les 16 modules `lib/actions/` exposent 86 fonctions async ; les requêtes financières filtrent principalement `user_id`. Aucun modèle d’espace dans le code métier inspecté.
- Lecture réelle des métadonnées PostgreSQL en transaction **readOnly** : 18 tables, 175 colonnes, 49 index, 50 contraintes. [Schéma observé](espaces-financiers-evidence/schema-live.json). Aucune ligne financière lue ou modifiée. Le snapshot `supabase/schema-current.sql` omet notamment `expense_transactions`, `setup_guide` et `user_onboarding` ; il n’est pas une source suffisante de migration.
- 12 tables financières portent `user_id` : `sections`, `cards`, `expenses`, `monthly_expenses`, `incomes`, `monthly_incomes`, `debts`, `debt_transactions`, `income_allocations`, `monthly_allocations`, `savings_contributions`, `expense_transactions`. La jonction `allocation_sections` ne possède pas `user_id` : ses deux parents doivent appartenir au même espace.
- `settings` mélange devise/rappels et email/téléphone/consentements ; unicité par utilisateur via index. `setup_guide` est par utilisateur, alors que ses étapes dépendent des finances ; `user_onboarding` suit le carrousel individuel. `push_subscriptions` appartient à l’utilisateur/appareil ; `notification_log` relie destinataire et éventuelle dépense.
- Les GET de pages ont des effets : génération de mois et changements de statut dans `/` et `/revenus`, catégories par défaut depuis `claim.ts`, épargne libre depuis `/projets`. Le layout racine initialise aussi le guide avant de connaître un espace.
- `allocations.ts` manipule la jonction par IDs ; `addSavingsContribution` et la destination de `transferSavings` ne vérifient pas aujourd’hui tous les parents avant écriture. `expense-transactions.ts` a déjà un précontrôle : la [discovery historique](../../.app-factory/discoveries/DISC-PROG-002-001.md) est donc partiellement dépassée. [DISC-003](../../.app-factory/discoveries/DISC-003-non-financial-multi-write-transactions.md) reste une liste à requalifier, pas une preuve d’état courant.
- `clearAllUserData()` supprime aussi préférences, onboarding et abonnements push. Le multiespace impose de borner cette action à l’espace choisi. `claimOrphanedData()` reprend globalement les lignes `unclaimed` : incompatible avec une attribution automatique sûre à plusieurs membres.
- `public/sw.js` précharge des pages authentifiées et peut les restituer depuis CacheStorage en échec réseau ; le clic notification ouvre `/` sans contexte. `proxy.ts` ne rend pas publique une future route d’invitation. Le shell n’exclut aujourd’hui que auth/account/landing.
- `AuthProviders` redirige actuellement vers `/`. Les pages auth existantes sont à réutiliser avec un retour d’invitation contrôlé. Le SDK installé expose des champs `emailVerified` et des paramètres de retour ; leur comportement réel reste à éprouver.
- Au contrôle initial, aucun transport d’email applicatif ni clé n’avait été trouvé. Depuis, l’humain confirme Resend et ajoute RESEND_API_KEY, EMAIL_FROM/EMAIL_TO et SMTP_HOST/SMTP_PORT pour Mailpit dans .env.local ; présence vérifiée sans afficher les valeurs, port SMTP local joignable. Le code de livraison, la validité de la clé, le domaine autorisé et la réception externe restent à prouver. La configuration hébergée n’a pas été vérifiée (jeton Vercel CLI invalide). Le cron existant envoie un rappel push générique quotidien ; il ne livre pas de courriels d’invitation.
- Vitest exécuté : **176 réussites / 177, un échec préexistant**. `progressive-expenses.test.ts:146` attend `var(--teal-50)` alors que `expense-display-utils.ts` renvoie `#ECFDF5` pour IN_PROGRESS. Contrat de palette désaligné ; ne pas masquer ce test. [Baseline détaillée](espaces-financiers-evidence/baseline.md).
- Aucun workflow `.github` ni configuration E2E versionnée trouvés ; Playwright est installé. Aucun outil Playwright MCP dédié exposé dans cette session. Pas de build/lint complet exécuté pour ce travail de planification.

**Inconnues encore non mesurées :** volumétrie, données `unclaimed`, relations historiquement incohérentes, doublons de singletons, restauration disponible et coût/quotas des services. À mesurer au préflight, sans déduire leur absence de la seule présence des FK.

## 3. État cible

### 3.1 Modèle proposé

| Entité | Contenu et invariants |
|---|---|
| `financial_spaces` | UUID, nom, dates, métadonnées de création et provisionnement. Aucun rôle propriétaire. |
| `space_memberships` | `(space_id, user_id)` unique, date d’adhésion. Toutes les appartenances donnent les mêmes capacités. Référence à l’ID auth opaque ; ne pas recopier les comptes/mots de passe. |
| `user_display_profiles` | Cache minimal de présentation (ID auth, nom et email affichables, date), alimenté depuis la session serveur lors de création/acceptation et actualisé à la reconnexion. Aucun secret ni statut de vérification utilisé pour autoriser ; lecture limitée aux membres d’un même espace. Profil historique absent : libellé neutre jusqu’à la prochaine session, sans attribution à une autre personne. |
| `legacy_user_space_map` | Une correspondance unique utilisateur historique → espace initial ; migration reprenable sans créer plusieurs espaces. Conserver pour audit de migration. |
| `user_space_preferences` | Dernier espace utilisé par utilisateur, uniquement aide de navigation ; appartenance revalidée à chaque reprise. |
| `space_settings` | Une ligne par espace : devise par défaut et rappels financiers. Copie des réglages existants sans conversion monétaire. |
| `space_setup_guide` | Une progression de configuration par espace, dérivée de ses données ; les états historiques de masquage/fin sont migrés pour l’espace initial. Rejoindre ne réinitialise pas le guide. |
| Données financières | `space_id` non nullable sur les 12 tables précitées et la jonction `allocation_sections`. Les anciens `user_id` restent temporairement comme provenance/compatibilité, jamais comme filtre d’autorisation après bascule. |
| `notification_log` | Destinataire individuel conservé ; `space_id` quand lié à une dépense. Les événements génériques sans objet financier restent sans espace. |
| `space_invitations` — ESP-004 | Espace, email normalisé, invitant, empreinte du jeton, état, dates ; un seul pending par espace/email. L’envoi n’accorde aucune appartenance. |
| Livraison — ESP-004 | Enregistrement durable d’envoi/reprise, clé d’idempotence et erreur contrôlée, séparé de l’état d’acceptation. Pas de succès « courriel envoyé » avant confirmation du transport. |

Le cache de présentation des membres ne crée pas un compte local parallèle : Neon Auth reste la seule autorité d’identité et de vérification. Ne pas demander un accès administrateur à l’annuaire pour afficher les membres si les données de session suffisent. La page publique ne révèle jamais les profils des membres.

Après bascule, les anciens `user_id` existants restent inchangés ; pour les nouvelles écritures, ils représentent l’acteur authentifié par compatibilité temporaire des colonnes, sans accorder de privilège à cet acteur. La lecture commune dépend exclusivement de l’espace et de l’appartenance.

Préserver les FK et unicités mensuelles existantes ; ajouter `UNIQUE(space_id,id)` aux parents pour les FK composites. Chaque relation enfant/parent inclut `space_id`, notamment dépenses↔catégorie/carte, instance↔template/dette, transaction↔instance/projet/dette, allocation↔catégorie/projet et jonction↔deux parents.

Pour les relations optionnelles actuellement `ON DELETE SET NULL`, ne jamais remettre `space_id` à NULL. Préserver le comportement par dissociation explicite de la seule référence dans la même transaction puis suppression contrôlée du parent, ou une variante SQL équivalente vérifiée. Pour les relations obligatoires, cascade bornée au même espace. Les inserts/suppressions et les liens multiples réussissent ensemble ou échouent sans effet partiel.

Créer les singletons par espace de façon atomique : settings, guide et épargne libre. Le pot libre doit avoir un discriminateur technique stable et une contrainte unique adaptée, pas une unicité fondée seulement sur son nom renommable. Les éventuels doublons historiques sont signalés avant migration, jamais fusionnés silencieusement.

### 3.2 Contexte et navigation proposés

- Routes financières canoniques `/espaces/[spaceId]/…` : accueil, dépenses et édition, revenus/allocations, patrimoine, cartes, catégories et réglages financiers. Un layout sous ce segment reçoit l’ID et charge uniquement après authentification/appartenance. Le layout racine garde les providers, styles et métadonnées, sans initialisation financière.
- Les URLs historiques (`/`, `/depenses`, etc.) deviennent des entrées de redirection avant toute génération : espace explicite autorisé, sinon dernier espace autorisé ; une seule appartenance sert de repli. Si plusieurs restent et le dernier est invalide, demander le choix ; sans appartenance, onboarding ou invitation en attente.
- Liste et fiches de gestion conformément aux mocks : `/parametres/espace` puis `/parametres/espace/[targetSpaceId]`. Conserver le contexte de navigation de l’onglet via un paramètre validé quand nécessaire ; consulter une fiche ne bascule pas vers la cible. Les mutations de gestion reçoivent explicitement la cible et contrôlent son appartenance.
- Le sélecteur change l’URL de l’onglet et mémorise le dernier choix au serveur. Les autres onglets gardent leur espace affiché. Une préférence, un cookie ou localStorage ne décide jamais à lui seul de l’espace d’une écriture.
- Chaque page transmet le même `spaceId` aux lectures, générateurs et formulaires. Chaque action reçoit cet ID, appelle un garde commun `requireSpaceMember(spaceId)` puis borne ses SQL. Ne jamais faire confiance au nom affiché ni à un ID envoyé par le client.
- Les formulaires capturent leur espace d’origine. Un changement pendant une saisie propose de l’abandonner ; une requête déjà envoyée reste dans son espace et son résultat tardif n’écrase pas l’écran d’un autre. Remonter les erreurs de garde sans les convertir en contexte par défaut.
- Navigation centralisée pour préfixer les liens et conserver `month`/`tab`. Shell/états locaux remontés avec une clé d’espace ; pas de réemploi d’un brouillon ou résultat d’une autre session.

**Pourquoi ce choix :** les routes portent un contexte visible et stable par onglet ; les layouts serveur peuvent lire leurs params. Une sélection uniquement globale/cookie déplacerait potentiellement une action en cours dans un autre espace. Les IDs d’URL restent non fiables et toujours contrôlés au serveur.

### 3.3 Frontière compte / espace proposée

| Reste individuel | Devient commun à l’espace |
|---|---|
| Auth, email/téléphone personnels, préférences et consentements de notification, abonnements push, carrousel pédagogique, dernier espace utilisé | Finances, catégories/cartes, devise et rappels financiers, progression du guide de configuration |

Les flags de rappel portés par une dépense décrivent une règle commune ; la livraison à une personne respecte son consentement individuel et son appartenance actuelle. Le cron push générique reste générique, sans fuite du nom/montants d’un espace. Ne pas introduire de notification de chaque écriture entre membres.

Le choix de devise ne convertit jamais les montants existants. Appliquer le réglage d’affichage de l’espace aux chemins déjà concernés ; inventorier les usages `formatCAD` et éviter une extension implicite à de la conversion multidevise.

### 3.4 Invitation et onboarding

1. Nouveau compte sans espace : nom et question explicite du partage. Non crée directement ; Oui propose le courriel facultatif. Créer espace, appartenance et réglages par défaut atomiquement, avec clé d’idempotence de création.
2. Lien public `/invitation/[token]` : annonce l’invitation et l’espace comme dans la maquette, sans données financières ni liste des membres. Route publique isolée du shell/guide/générateurs, jeton non journalisé, réponse non mise en cache.
3. Deux choix vers `/auth/sign-in` ou `/auth/sign-up` existants. Conserver une référence d’invitation dans un retour interne borné, idéalement opaque côté serveur, sans accepter une URL externe arbitraire. L’auth ne crée pas automatiquement d’espace personnel si une invitation est en cours.
4. Après authentification, contrôler l’identité destinataire avec les données de session serveur ; ne pas utiliser un email librement saisi comme preuve. Présenter l’acceptation explicite. Une personne déjà connectée retrouve aussi ses invitations.
5. Acceptation dans une transaction : verrou/condition sur l’invitation pending, contrôle destinataire/validité, insertion unique membership et état accepted. Deux clics ou deux requêtes ne créent qu’une appartenance. Échec = zéro accès et zéro modification partielle.
6. Confirmation puis « Ouvrir cet espace » met à jour le contexte ; accepter ne remplace pas silencieusement l’espace déjà ouvert. Le nouvel invité peut n’avoir que l’espace commun.
7. Un échec d’email ne détruit pas l’espace créé ; afficher l’état réel et permettre une reprise sans recréer espace/invitation. Ne pas annoncer un envoi simulé comme livré.

### 3.5 Décisions à approuver avec ce plan

| Réf. | Proposition | Condition de clôture |
|---|---|---|
| D1 | Routes explicites par espace, onglets indépendants, dernier espace au serveur ; frontière compte/espace du tableau | Accord sur ce plan, puis tests des routes et préférences en phase 0/3. L’UX du sélecteur est déjà approuvée. |
| D2 | Réserver l’acceptation à l’email de session normalisé et vérifié ; jeton aléatoire fort stocké seulement sous empreinte ; validité proposée de 7 jours | Confirmer politique et comportement de vérification Neon sur environnement de test avant ESP-004. Aucun compte invité non vérifié ne reçoit les finances par défaut. |
| D3 | Ne pas ajouter dans cette livraison départ, exclusion ou suppression d’espace ; conserver la remise à zéro financière existante, mais limitée à l’espace et nommée dans sa confirmation | Accord de périmètre ; aucune exception de droits pour le créateur. Refus d’invitation présent dans le mock : définir l’état terminal sans adhésion avant exposition du bouton ; renvoi/annulation restent à préciser sans ajouter des écrans non demandés. |
| D4 | Resend pour les invitations externes, Mailpit SMTP pour les essais locaux ; adaptateur serveur, envoi initial après commit et reprise durable | Vérifier clé Resend/domaine expéditeur, quotas/coût, secrets par environnement, idempotence et fréquence de reprise. Sélectionner explicitement le transport ; EMAIL_TO ne remplace pas les destinataires réels. Mailpit seul ne prouve pas la livraison externe. Aucune dépendance/service payant engagé par ce plan. Bloque les invitations réelles, pas le travail solo/conservation. |

Ne pas redemander les décisions produit acquises : égalité des droits, espace initial, maquettes et placements de navigation, invitation conditionnelle, deux chemins auth, reprise du dernier espace et nom « Mes finances ».

## 4. Analyse des écarts

| # | Actuel | Cible | Fermeture / story |
|---|---|---|---|
| G1 | Session utilisateur sans espace | Espace nommé et appartenance atomiques | ESP-001 : création, garde, contexte initial, onboarding solo |
| G2 | Données historiques user_id, schema SQL incomplet | Données conservées et reliées à un espace initial | ESP-002 : source réelle, map de migration, contrôles avant/après et reprise |
| G3 | 86 actions, générations GET et jonction par IDs | Tous les chemins financiers bornés à l’espace | ESP-003 : inventaire fermé, précontrôles, FK composites, transactions et tests d’intrusion |
| G4 | Settings/guide et réinitialisation par compte | Financier partagé / compte individuel séparés | ESP-001/002/003 selon premier besoin ; aucun effacement d’autres espaces ou abonnements |
| G5 | Liens non contextualisés et cache SW de pages privées | Navigation par espace, onglets stables, caches privés sans collision | ESP-003 : routes, shell, formulaires, revalidation et SW |
| G6 | Pas de transport ou modèle d’invitation | Courriel réel et membership après acceptation | ESP-004 : modèle, livraison, page publique, auth existante, acceptation |
| G7 | Signup redirige à /, provisioning implicite | Retour à l’invitation sans espace personnel forcé | ESP-005 : continuité session/retour et tests de reprise |
| G8 | Prototype onboarding simulé | Oui/Non connecté à la création et au même service d’invitation | ESP-006 : branche conditionnelle et échec d’envoi récupérable |
| G9 | Un test connu rouge, pas de pipeline/E2E versionnés repérés | Baseline verte et preuve réelle des invariants | Phase 0 puis toutes stories : réconcilier le contrat du badge, tests utiles, CI minimale si absente |

## 5. Analyse d’impact

| Fichiers / systèmes | Modification prévue | Raison |
|---|---|---|
| `lib/spaces/{context,authorization,navigation}.ts` (nouveaux), `lib/actions/spaces.ts`, `lib/types.ts`, `lib/schemas/*` | Types, validation, garde et opérations d’espace | Une seule règle d’appartenance et cibles explicites |
| `app/(finance)/espaces/[spaceId]/layout.tsx` et pages financières relocalisées ; anciennes pages d’entrée | Contexte serveur, routes canoniques, redirections | Aucune lecture/génération avant résolution autorisée |
| `app/layout.tsx`, `LayoutShell`, `BottomNav`, clients/pages/modales financières | Passer et afficher le contexte, préserver apparence ; nouveaux composants ciblés | Continuité avec la vraie app et maquettes validées |
| 11 modules d’actions financières + `settings`, `claim`, `demo-data`, `setup-guide`, `onboarding-carousel` | Requalifier les 86 exports : financier, individuel ou legacy ; corriger SQL, parents, transactions | Aucun chemin oublié, y compris historique/édition/tri/génération |
| `app/parametres/espace/*`, nouveaux clients espaces/membres | Liste, création, fiche ciblée, renommage et invitation | FR-010 et égalité des membres |
| `app/invitation/[token]`, `proxy.ts`, providers/auth existants | Route publique et retour auth maîtrisé | Aucun espace personnel créé avant acceptation d’un invité |
| `lib/invitations/*`, `lib/mail/*`, route de reprise interne selon transport retenu | Jetons, états, livraison et reprise | Courriel réel avec erreur observable, aucun accès implicite |
| `scripts/migrations/espaces-financiers/*.sql` et runner `.mjs` proposés | SQL explicites versionnés, dry-run, backfill, validate, rapport | Pas de push direct de schéma ; fichiers SQL exigés avant application |
| `settings`, nouvelles tables et 13 tables financières + log | Expand, backfill, contraintes/index | Identité et configuration distinctes ; isolation des relations |
| `public/sw.js`, `ServiceWorkerInit`, liens notifications | Purger ancien cache, retirer pages/RSC authentifiés du fallback | Pas d’ancien espace ou compte affiché hors ligne |
| `lib/revalidation.ts`, requêtes/caches éventuels | Invalidation et clés comprenant espace/utilisateur selon contenu | Pas de cache commun entre membres ou espaces non autorisés |
| `__tests__/`, configuration E2E et éventuelle CI minimale | Unitaires, SQL réels, deux sessions navigateur et contrôles de migration | DoD et preuve de bout en bout |

**Dépendances à vérifier :** comportements réels Neon Auth/session/vérification, rôle de connexion DB et éventuel contournement RLS, verrous/contraintes du PostgreSQL cible, branche/base isolée et restauration, service email et plan d’hébergement pour reprise. Garder auth et SQL existants ; aucun nouveau framework de tenancy.

**Choix d’isolation proposé :** gardes serveur centralisées et SQL explicitement bornés, renforcés par FK composites. Pas de RLS improvisée sans contexte transactionnel sûr sur connexion poolée ; si l’audit du rôle ou une autre surface d’accès DB démontre sa nécessité, réviser le plan avec une stratégie complète. Une FK de même espace ne remplace pas le contrôle de membre.

**Rayon d’impact : CRITICAL.** Une omission peut exposer ou modifier les finances d’un autre espace. Pas de release multiespace partielle et pas de duplication de l’app par couple.

## 6. Délimitation du périmètre

### Inclus

- Les 17 exigences et les six parcours verticaux, avec la même app pour solo et couple.
- Conservation des comptes existants ; espace nommé et invitation conditionnelle à l’onboarding.
- Toutes les opérations financières actuelles, leurs générations automatiques, relations, synthèses, données de démonstration et remise à zéro **dans l’espace explicitement visé**.
- Configuration financière partagée, préférences et consentements individuels ; cache/SW et reprises compatibles avec séparation des contextes.
- Invitations avec/sans compte, livraison réelle, erreurs/reprises et acceptation idempotente ; preuve à deux membres plus un tiers.
- Correction des anomalies découvertes qui empêchent ces invariants, notamment validation des parents, concurrence de génération/singletons et écritures composées touchées. Les défauts indépendants restent tracés ; pas de contournement silencieux.

### Exclus

- Rôles/admin/propriétaire, restrictions selon créateur : incompatibles avec la décision d’égalité.
- Partage de frais/remboursements, connexion bancaire et conversion de devises : aucun besoin validé.
- Temps réel, historique utilisateur détaillé et édition collaborative avancée : prochaine consultation/recharge pour visibilité ; intégrité des écritures concurrentes incluse.
- Départ, exclusion et suppression d’espace : règles du dernier membre/données non définies ; recommandation D3 à valider. Cela n’exclut pas l’adaptation de la remise à zéro existante.
- Storybook, extraction d’une bibliothèque ou nouveau design : refusés par l’humain.
- Changement de fournisseur DB/Auth, déploiement production ou push : pas autorisés par la seule validation du plan.

**Arrêt et révision explicite du plan** si attribution historique ambiguë, besoin de fusionner/supprimer des données, coût nouveau imposé, propriété/permissions supplémentaires, identité non vérifiable ou rollback impossible. Présenter la cause, les options et leurs conséquences ; ne pas attribuer au premier connecté les lignes sans propriétaire vérifié.

## 7. Hypothèses

| Hypothèse | Risque si fausse | Validation / moment |
|---|---|---|
| Les données avec user_id réel peuvent être reliées sans ambiguïté à un compte historique | Mauvaise attribution ou fuite | Préflight des propriétaires et relations sur copie isolée ; bloquer `unclaimed`/NULL/relations contradictoires et obtenir une correspondance explicite |
| Les comptes auth ne sont pas une table utilisateur locale à migrer | Dépendance cachée ou doublon d’identité | Vérifier contrat auth, types et règles d’ID en phase 0 ; ne pas modifier le schéma géré par Neon Auth |
| Une copie isolée et une restauration sont disponibles | Test ou rollback sur les seules données réelles | Vérifier environnement cible et faire une restauration d’essai ; l’existence de POSTGRES_URL ne le prouve pas |
| Volume compatible avec transactions bornées et courte fenêtre de bascule | Verrous prolongés ou timeout | Mesurer volumes/index/durée sur copie ; choisir backfill par lots reprenables si besoin, dernière passe sous gel |
| L’identité destinataire peut être établie par session et email vérifié | Acceptation usurpée ou invitation bloquée | Test réel auth vérifiée/non vérifiée, changement de compte et reprise email ; D2 à fermer avant ESP-004 |
| Transport mail et reprise compatibles avec budget/hébergement | Aucun courriel livré ou coût non accepté | Test de configuration et d’envoi vers boîtes de test autorisées, quotas/domaine/erreur ; D4 avant invitations réelles |
| Les automatismes connus sont ceux du dépôt et du cron inspectés | Un ancien job écrit encore des lignes sans espace | Inventaire effectif des tâches déployées + appels SQL hors actions avant bascule |
| Les tests visuels exigés seront disponibles | Impossible de satisfaire la DoD définie | Vérifier Playwright MCP avant gate visuel ; si indisponible, déclarer BLOCKED pour ce critère, sans le rebaptiser CUA/CLI |

## 8. Pre-Mortem

| Échec anticipé | Probabilité | Impact | Prévention / preuve |
|---|---|---|---|
| Dashboard en A génère un mois dans B par contexte global | Haute | Données financières fausses | ID capturé à l’entrée et transmis à toutes les générations ; test interleaving A/B et onglets |
| Conjoint voit les dépenses mais pas allocations/historiques, restés filtrés par auteur | Haute | Espace commun incomplet | Matrice exhaustive des 86 exports, joints/agrégats et lecture par l’autre membre |
| Référence d’une carte/catégorie/projet de A insérée en B | Haute | Fuite et corruption | Précontrôles et FK composites, tests négatifs via appels directs et SQL sur base isolée |
| Deux membres déclenchent la même génération/pot libre | Haute | Doublons ou soldes faussés | Contraintes uniques, création atomique, deux sessions concurrentes et nouvelle lecture |
| Vider les données du couple supprime le compte/push ou le personnel | Moyenne | Perte étendue | Suppression financière transactionnelle par space_id, confirmation du nom, tests de non-effet sur compte/autres espaces |
| SW rend le personnel après bascule ou déconnexion | Haute | Divulgation locale | Purge de mes-finances-v2 et pages privées hors cache ; test offline/bascule/logout/autre session |
| Backfill oublie jonction, guide ou lignes créées pendant migration | Haute | Orphelins et faux succès | Inventaire 18 tables, lots journalisés, gel des écritures y compris GET mutateurs, validation finale avant NOT NULL |
| Lien d’invitation perdu au signup ou accepté par mauvais compte | Moyenne | Détour utilisateur ou accès indu | Retour interne borné, identité serveur, pas d’acceptation dans GET, tests comptes croisés/verify/double clic |
| L’espace est créé mais l’envoi échoue et le retry le recrée | Moyenne | Doublons, confusion | Idempotence de création, états delivery séparés, outbox/reprise et réponse honnête |
| Retour à v1 après partage sépare les écritures par auteur | Haute | Finances mélangées/incomplètes | Interdiction du rollback v1 après ouverture multiespace ; version connue compatible et reprise contrôlée |

## 9. Stratégie de rollback

### Migration et seuils de retour

1. **Avant mutation de schéma :** créer une sauvegarde/copie durable selon capacité vérifiée, tester sa restauration et consigner l’ID de sauvegarde dans le rapport privé. Pas de dump contenant finances ou secrets dans Git, ni `/tmp`. Les schémas et rapports agrégés sans identifiants peuvent être versionnés.
2. **Expand :** ajout des tables/colonnes/index sans suppression/renommage historique. Sur échec, arrêter au journal de phase, rollback de la transaction concernée ; ne pas nettoyer à l’aveugle un état partiellement appliqué. Rejouer après vérification de version/checksum et préconditions.
3. **Backfill :** correspondance unique et checkpoint par utilisateur/lot. Lot atomique ; reprise ne recrée ni IDs ni membres. Ne pas recopier les montants : rattacher les mêmes lignes. Geler les écritures réelles et les GET générateurs pour la dernière passe et la bascule ; attendre les requêtes de l’ancien déploiement.
4. **Avant accès multiespace et invitations :** valider contraintes, couverture des lignes, égalité des montants/relations et version compatible ; conserver les colonnes legacy. Un retour v1 n’est envisageable que si preuve qu’aucun compte n’a plusieurs espaces ni écriture partagée et que toutes les nouvelles écritures restent projetables sans ambiguïté. Sinon le retour est v2.
5. **Après premières écritures multiespace :** ne jamais redéployer l’ancien code filtrant user_id. Revenir à un commit compatible espaces vérifié, maintenir les données et désactiver les opérations affectées. Si la confidentialité n’est plus assurée, fermer temporairement les routes financières au lieu de servir le mauvais périmètre ; correction puis réouverture après tests.
6. **Contract :** suppression des colonnes/chemins legacy différée, hors première activation, après recette et période de stabilité validée. Pas de migration inverse destructive automatique.

| Incident | Action concrète |
|---|---|
| Échec avant commit d’une tranche | Préserver le diff, revenir uniquement sur les fichiers de cette tranche après examen ; ne pas effacer les modifications préexistantes |
| Régression de code après commit | Identifier le commit fautif, `git revert <commit>` sur une version compatible avec le schéma en place ; tests ciblés et build avant redéploiement autorisé |
| Envoi mail en panne | Suspendre l’envoi/reprise, garder espaces et invitations en attente ; état visible, reprise avec même clé, pas d’adhésion automatique |
| Mauvaise migration ou perte prouvée | Stop écritures, conserver l’état pour analyse et choisir restauration + réconciliation des écritures postérieures avec l’humain ; jamais restaurer une vieille copie en supprimant silencieusement les nouvelles contributions |
| Anomalie d’isolation | Fermer le chemin affecté, bloquer tout fallback legacy, corriger garde/SQL/relations, rejouer matrice d’intrusion avant réouverture |

Aucune commande de migration, restauration, déploiement ou suppression n’est exécutée pendant cette planification.

## 10. Plan d’implémentation

Chaque tranche livre un comportement utilisateur avec schéma, serveur, interface et preuves nécessaires. Les tables apparaissent à leur premier usage ; pas de stories « DB », « API », « UI » autonomes. Les phases 1 à 3 peuvent être testées successivement sur environnement isolé, mais **pas de mise en service partielle du multiespace**.

### Phase 0 — Préparation et baseline ; dépendance de toutes les stories

| ID | Travail | Dépendance | Contrôle avant suite |
|---|---|---|---|
| P0.1 | Valider plan/D1–D3, inventorier les 86 actions et autres SQL avec classement compte/espace/legacy ; vérifier états courants des discoveries | Plan proposé | Registre exhaustif sans export ni route non classé, décisions documentées |
| P0.2 | Préparer DB isolée, comptes fictifs et restauration ; mesurer volumes, propriétaires, anomalies et index réels | P0.1 | Rapport préflight, identité de cible isolée prouvée, restauration d’essai réussie ; aucun test destructeur sur la DB locale réelle |
| P0.3 | Réconcilier palette badge/test contre le visuel approuvé ; exécuter unitaires, lint, types et build de référence | P0.1 | 177 tests actuels passent, erreurs baseline traitées explicitement ; pas de skip/réduction de couverture |
| P0.4 | Éprouver session/retour/vérification email ; fermer D4 avant phase4 et vérifier disponibilité Playwright MCP avant recette visuelle | P0.1 | Rapport SDK/transport, contraintes et blocages identifiés ; aucune fausse promesse de livraison |

**Gate 0 :** plan humain validé et environnement isolé/restore acquis ; baseline qualité verte et inventaire fini. Le transport peut rester ouvert pour ESP-001/002/003, pas pour ESP-004.

### Phase 1 — ESP-001 : premier espace nommé et utilisation solo

| ID | Travail | Dépendance | Contrôle |
|---|---|---|---|
| P1.1 | Générer les fichiers SQL d’expansion et runner dry-run ; espaces/membres/profils de présentation/map/paramètres/guide/préférence au premier usage, colonnes financières initialement compatibles | Gate0 | SQL versionné existe, dry-run sans écritures et application isolée rejouable |
| P1.2 | Créer le contexte initial en transaction avec clé idempotente, sans rôle propriétaire ; garde et chemins sans espace | P1.1 | Doubles clics/recharge = un espace et une appartenance ; absence auth/espace refusée avant finances |
| P1.3 | Réutiliser le shell et composants réels pour nommer/démarrer solo ; sélecteur unique ; organiser routes serveur et carrousel individuel | P1.2 | ESP-001 AC1–5 observés en staging isolé ; aucun contrôle partagé inopérant exposé avant phase6 |

**Gate 1 :** parcours solo prouvé, sans régression de l’app existante. Point de contrôle interne ; pas de deuxième espace ou membre accessible à ce stade. La branche finale conditionnelle sera raccordée en phase6.

### Phase 2 — ESP-002 : retrouver les finances existantes

| ID | Travail | Dépendance | Contrôle |
|---|---|---|---|
| P2.1 | Préflight et backfill par map stable, toutes tables/relations/settings/guide/log ; traiter explicitement les propriétaires ambigus | Gate1 | Rapport d’anomalies, aucun transfert automatique des lignes unclaimed ; zéro lot silencieusement ignoré |
| P2.2 | Écrire vérifications avant/après et reprise sur interruption ; préserver IDs, montants, dates, références, statuts et état guide | P2.1 | Empreintes/projections des colonnes métier identiques, comptes et agrégats exacts par propriétaire/table/mois ; deuxième exécution sans doublon |
| P2.3 | Préparer la dernière passe sous gel et garde de version ; conserver la compatibilité avant bascule globale | P2.2 | Scénario d’écriture concurrente à la migration puis reprise couvert ; aucun reliquat financier sans espace accepté avant gate3 |

**Gate 2 :** ESP-002 AC satisfaits sur copie isolée, rapport de conservation exact et restauration/reprise prouvées. Aucun renommage des données réelles ni script appliqué au milieu de la session de planification.

### Phase 3 — ESP-003 : plusieurs espaces, même app et réglages

| ID | Travail | Dépendance | Contrôle |
|---|---|---|---|
| P3.1 | Convertir tous les chemins financiers : CRUD, historiques, générations, automatismes, agrégats, allocations/jonction, épargne et dettes | Gate2 | Chaque entrée du registre a un test d’accès membre et de refus hors espace ; aucun filtre d’auteur restant pour autoriser des finances |
| P3.2 | Valider FK composites, transactions multiécritures, unicités mensuelles/singletons et opérations concurrentes | P3.1 | Les cas croisés échouent, rollback sans effets partiels, deux générations ne doublent pas les montants ; transferts vérifient les deux cibles et le solde dans l’opération atomique |
| P3.3 | Intégrer liste/création/détail dans réglages et sélecteur seul dans sidebar ; restaurer dernier contexte, liens/onglets/formulaires et cache | P3.1 | Renommer B depuis fiche alors que A reste actif ; bascule complète, noms longs, unique option ; A/B simultanés sans déplacement de saisie |
| P3.4 | Reborner données de démonstration, remise à zéro et legacy claim ; séparer réglages/guide/compte ; retirer cache SW de pages privées et purger l’ancien cache | P3.2/P3.3 | Remise à zéro A conserve B, comptes et push ; déconnexion/offline ne montre aucune ancienne finance ; historique de guide conservé |

**Gate 3 :** couverture exhaustive, NOT NULL/contraintes validées après backfill, conservation et intrusion SQL/actions/pages passent. Pas d’activation multiespace tant qu’une seule famille de finances n’est pas convertie. Première version espace-compatible conservée comme point de rollback. Une mise en service exige encore les validations de release de phase7.

### Phase 4 — ESP-004 : invitation et compte existant

| ID | Travail | Dépendance | Contrôle |
|---|---|---|---|
| P4.1 | Fermer D2/D4 ; créer invitations et reprise durable au premier usage ; token/normalisation/pending unique et limites anti-abus serveur | Gate3 + D2/D4 | Secret non journalisé, pas d’énumération d’adresses, doublon/membre déjà présent gérés ; coût et transport acceptés |
| P4.2 | Livraison réelle après création persistée ; page publique et boutons vers auth existante, retour interne contrôlé | P4.1 | Courriel de test reçu ; panne transport = état honnête et retry sans nouvel espace ; route publique sans finances ni redirection externe |
| P4.3 | Liste d’invitations pour destinataire, acceptation atomique et ouverture explicite ; mêmes droits pour tous | P4.2 | B accepte deux fois = une adhésion ; C/mauvais compte/non vérifié/jeton invalide ou expiré n’obtient rien ; B peut gérer et inviter comme A |

**Gate 4 :** ESP-004 complet avec vrai transport et vrai contrôle de destinataire, pas une simulation. Pas de rollback vers le modèle utilisateur après accès partagé.

### Phase 5 — ESP-005 : nouvel invité sans compte

| ID | Travail | Dépendance | Contrôle |
|---|---|---|---|
| P5.1 | Préserver invitation au signup, à la vérification et aux changements de compte ; bypass du provisioning personnel implicite | Gate4 | Réouverture après auth retrouve l’invitation, zéro espace personnel imposé |
| P5.2 | Exercer reprise/abandon/erreurs et acceptation ; ouvrir le commun existant sans réinitialiser guide ni données | P5.1 | ESP-005 AC1–5, contribution visible à l’autre membre après recharge ; mauvais compte refusé |

**Gate 5 :** parcours sans compte réellement exercé sur environnement isolé, cookies/jetons/payloads privés exclus des preuves versionnées.

### Phase 6 — ESP-006 : commencer directement en couple

| ID | Travail | Dépendance | Contrôle |
|---|---|---|---|
| P6.1 | Brancher question Oui/Non et étape conditionnelle sur les services déjà livrés ; aucun second mécanisme d’invitation | Gate5 | Non n’affiche aucune page invitation ; Oui la propose avec envoi facultatif |
| P6.2 | Séparer succès de création et état mail, reprise d’erreur et réception par conjoint | P6.1 | Pas de double espace au retry ; l’initiateur continue sans attendre ; le conjoint retrouve la configuration avec droits égaux |

**Gate 6 :** six stories et 30 AC rejoués, variantes solo/couple et compte existant/nouveau, continuité visuelle avec la version approuvée.

### Phase 7 — Recette globale et mise en service contrôlée

| ID | Travail | Dépendance | Contrôle |
|---|---|---|---|
| P7.1 | Recette de bout en bout, tests SQL réels, unitaires, types/lint/build et pipeline minimal si CI absente | Gate6 | Tous checks verts ; chaque exigence a sa preuve, revue indépendante de code et migration |
| P7.2 | Validation visuelle via Playwright MCP : mobile375×812 puis desktop1280×900, vrais écarts de montants/noms, screenshots avant/après | P7.1 | Scan complet sans défaut connu ; si outil requis indisponible, critère BLOCKED déclaré et résolu avant livraison |
| P7.3 | Répéter runbook de migration/reprise/rollback, dernière sauvegarde vérifiée puis bascule autorisée dans environnement cible | P7.1/P7.2 | Conservation à nouveau prouvée, fermeture des anciens writers, observabilité sans secrets, canari solo et couple |
| P7.4 | Handoff utilisateur et clôture des stories selon DoD, suivi des propositions différées | P7.3 | Démonstration staging, approbation de release requise, aucune tâche cachée ni migration inverse destructive |

**Pas d’engagement de durée/points inventé.** Avant exécution, dimensionner ESP-002/003 depuis ce registre ; si trop larges, redécouper par parcours financier prouvable avec barrière de release globale, sans découpage par couche.

## 11. Critères de succès

| ID | Type | PASS attendu | Preuve / gate |
|---|---|---|---|
| S1 | deterministic | Aucun export financier, route, job ou cache non classé dans le registre | P0.1 puis gate3 |
| S2 | deterministic | SQL de migration présent avant exécution ; dry-run sans mutation ; rejeu sans doublon ; zéro ligne financière non rattachée/liaison croisée | Gates1–3, rapports SQL |
| S3 | deterministic | IDs/colonnes métier et sommes décimales/relations existantes identiques avant/après, sauf nouvelles métadonnées d’espace explicitement ajoutées | Gate2 puis P7.3 ; comparaison sur copie et cible autorisée |
| S4 | deterministic | A et B membres peuvent lire/modifier tout le commun ; C et utilisateur non membre ne lisent/modifient rien via pages, IDs ou actions directes | Gate3/4, matrice négative |
| S5 | deterministic | Toutes FK croisées refusées ; génération, épargne libre et acceptation simultanées ne doublent rien ; échecs composés ne laissent aucun solde partiel | Gates3–5, DB réelle isolée |
| S6 | deterministic | Changement d’espace/onglet pendant saisie ou requête garde l’action dans sa cible d’origine ; aucune réponse tardive dans l’autre contexte | Gate3, tests concurrence/navigation |
| S7 | factual-cross | Sidebar seulement sélecteur ; réglages liste/création puis fiche ciblée ; Non saute invitation et Oui la propose ; landing explicite vers auth existante | Gates3/6, maquettes7aaec6d et tests de routes |
| S8 | deterministic | Courriel réellement reçu, contexte conservé après auth, compte destinataire vérifié et acceptation explicite ; nouveau membre sans espace personnel forcé | Gates4–6, boîtes et comptes de test |
| S9 | deterministic | Pas de finances d’un autre espace/compte depuis SW/cache/offline ; remise à zéro d’A ne touche pas B ni comptes/consentements | Gate3/7, tests réels |
| S10 | deterministic | Unitaires, SQL/intégration, E2E, types, lint, build et tous les checks CI requis passent sans test ignoré pour le chantier | Gate7 |
| S11 | semantic-cross | Revue de page entière mobile/desktop : aucun chevauchement, découpe, overflow, chiffre désaligné ou écart UX non autorisé ; navigation clavier correcte | Grille AGENTS + screenshots avant/après via Playwright MCP, gate7 |
| S12 | factual | Sauvegarde restaurée en essai ; point de retour v2 identifié ; runbook bloque v1 après partage et documente réconciliation | Gate0/7 |

### Couverture des 17 exigences du backlog

| Exigences | Phases / critères |
|---|---|
| FR-001 | P1/P6 — S2,S7 |
| FR-002 | P2 — S2,S3,S12 |
| FR-003,FR-004,FR-005 | P3 — S1,S4,S6,S9 |
| FR-006 | P4 — S4,S5,S8 |
| FR-007 | P4/P5 — S5,S8 |
| FR-008 | P6 — S7,S8 |
| FR-009 | P3/P4/P5/P6 — S4 |
| FR-010 | P3/P4 — S4,S7 |
| NFR-001 | P1/P2/P3/P4 — S2,S4,S5,S9 |
| NFR-002 | P2/P3/P4/P5 — S2,S3,S5 |
| NFR-003 | P3 — S5,S6 |
| UXR-001,UXR-002 | P1/P3/P4/P5/P6/P7 — S7,S11 |
| TR-001 | P0 puis tranches — source technique inchangée sauf décisions validées, D4 fermé avant coût/service |
| TR-002 | Gate0/P7 — S3,S10,S11,S12 et approbation du présent plan |

## 12. Stratégie de tests

| Niveau | Cas et données | Moyen | Moment |
|---|---|---|---|
| Baseline | Contrat du badge IN_PROGRESS et absence de régressions calculs/schémas | `npm test -- --run`, `npm run lint`, `npx tsc --noEmit`, `npm run build` après correction justifiée ; sortie0 exigée | Gate0, puis checks pertinents à chaque tranche |
| Unitaires | Validation espace/nom, normalisation email sans fusion d’alias, retours internes, partition préférences, branches onboarding, erreurs de contexte | Vitest ; assertions de comportements/invariants, pas de duplication d’implémentation | P1/P3/P4/P6 |
| Intégration DB | Contraintes et appartenance réelle, double génération/acceptation, liens croisés, panne au milieu d’une écriture, transferts concurrents, suppressions bornées | PostgreSQL isolé et fixtures A/B membres du couple, A personnel, B personnel, C tiers ; pas de mock SQL pour ces preuves | P2–P5 puis P7 |
| Migration | Données complètes : templates/instances, progressives, épargne, dettes, allocations/jonction, préférences/guide ; propriétaires inconnus et faux liens ajoutés seulement en fixture | Avant/après par IDs/projections/agrégats décimaux exacts, dry-run, arrêt/reprise/rejeu et restauration ; tests seulement sur copie | P2/P3/P7 |
| E2E navigateur | Deux sessions A/B et C ; connexion existante/nouveau compte, bon/mauvais destinataire, contextes différents, contributions vues après recharge | Playwright CLI automatisé, DB et auth de test ; assertions serveurs et navigateur corrélées | P3–P7 |
| Cache/onglets | A/B ouverts, action retardée, formulaire ouvert, historique retour, reload, logout puis autre compte, offline | Deux onglets + réseau contrôlé + CacheStorage/SW réel ; ne pas démontrer seulement par lecture du code | P3/P7 |
| Email | Livraison réellement reçue, vérification session, erreur transport/domaine/timeout, double demande, expiration selon D2 et refus selon décision | Adaptateur test contrôlé + au moins un trajet sur le transport réel vers destinataires de test autorisés ; aucune adresse réelle dans les preuves | P4/P5/P6 |
| Visuel | Pages approuvées complètes ;375×812 puis1280×900 ;3,99$ et1 450,00$, montants extrêmes, nom court et80 caractères, peu/beaucoup de membres/contenu, clavier | Playwright MCP et comparaison visuelle des screenshots avant/après ; DOM/mesures en complément. Aucun défaut visuel connu laissé « done » | P1/P3/P6/P7 |
| Revue et CI | Code, flux de confiance, schéma, migration et preuve de chaque AC ; tous checks verts | Revue indépendante au protocole d’implémentation retenu, workflow minimal si absent, recette staging | Avant chaque clôture/release |

Les tests avec mutations exigent une cible isolée vérifiée : pas de fixtures, scripts de nettoyage ou invitations sur les données personnelles de la session actuelle. Les artefacts privés restent dans un dossier durable du projet exclu de Git ; seuls rapports/schémas anonymes sont versionnés. Ni CUA ni CLI ne sont présentés comme « Playwright MCP » si ce dernier est requis et indisponible.

### Relecture finale obligatoire — planning-methodology

| Question | Verdict | Ancre |
|---|---|---|
| État actuel factuel et sources vérifiées ? | OUI | §2, schema-live.json et baseline exécutée ; inconnues séparées |
| Chaque succès vérifiable ou jugé par grille explicite ? | OUI | S1–S12, gates et grille visuelle AGENTS |
| Chaque écart a une approche concrète ? | OUI | G1–G9 reliés aux stories et phases |
| Hors-périmètre explicite et motivé ? | OUI | §6 ; règles différées isolées dans D2–D4 |
| Au moins deux scénarios d’échec spécifiques ? | OUI | §8, génération/caches/retour v1/identité et autres |
| Phases avec points de contrôle avant suite ? | OUI | Gates0–7, sorties et rapports requis |
| Rollback concret et compatible avec les données ? | OUI | §9, seuil après partage et interdiction v1, restauration/réconciliation |
| Hypothèses toutes validables ? | OUI | §7 avec moyen et phase ; aucune ressource déclarée absente sans vérification |

**Conclusion de préparation :** plan complet et relu, prêt à décision humaine ; pas READY pour exécution tant que validation du plan et préconditions de gate0 manquent. Une validation du plan ne constitue pas un feu vert automatique pour migrer la production, envoyer des invitations réelles à des tiers ou pousser le dépôt.
