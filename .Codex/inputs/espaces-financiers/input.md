# Input AWM — Espaces financiers personnels et partagés

## Métadonnées de cadrage

- Date : 2026-10-22.
- Projet : Mes Finances ; dépôt : /Users/amarafofana/Projects/Perso Workspace/Mon Budget.
- Mandat : introduire des espaces financiers indépendants dans toute l'application, personnels ou partagés entre membres aux droits égaux ; premier usage concret : un couple.
- Statut : cadrage humain capturé pour préparation AWM. Aucune implémentation ni préparation de cycle lancée par ce document.
- Profondeur pressentie : lourde, appréciation du rédacteur à confirmer en préparation, car données, contexte global, onboarding et invitations interagissent.
- Livraison : .Codex/inputs/espaces-financiers/input.md. Les chemins des futurs livrables restent à déterminer.
- Gouvernance : les faits techniques aident au démarrage mais restent réfutables par le code. Si le substrat les contredit, le signaler et réviser le travail qu'ils justifiaient. Les décisions produit sont ancrées dans les échanges humains cités ci-dessous.

## Contexte pour lecteur froid

Mes Finances est une PWA de finances personnelles en français canadien. Elle permet de configurer des dépenses et revenus récurrents, suivre leurs instances mensuelles, répartir le revenu en enveloppes, gérer l'épargne, les projets, les dettes, les catégories et les cartes. Le compte authentifié sert actuellement de périmètre aux données financières.

Une personne doit désormais pouvoir participer à plusieurs espaces financiers : ses finances personnelles dans un espace, celles de son couple dans un autre. L'espace sélectionné devient le contexte de toute l'application, avec les mêmes fonctionnalités et ses propres données.

Le premier cas concret est un couple : l'un crée un espace et invite son conjoint ; le conjoint accepte avec son compte existant ou après inscription. Famille et autres groupes ont également été cités comme usages, sans règles spécifiques définies.

## Problème / motivation (le pourquoi global)

Le périmètre actuel par utilisateur ne représente pas un ensemble de finances commun à plusieurs comptes. Partager seulement une enveloppe ou un écran budget ne suffit pas : le besoin porte sur toute l'application.

Ancres humaines : « toute l'app reflete cette instance donc vraiment avoir deux espaces séparés » ; « cet espace sera exactement le meme que l'app existante mais chargé avec les donnees du couple ».

Le bénéfice recherché est de gérer ensemble les finances communes tout en conservant des finances personnelles séparées. Aucun gain chiffré de temps ou d'argent n'a été fourni.

## Décisions autoritaires + le pourquoi de chacune

### Le concept est l'espace financier

Confirmation humaine : « oui exact espace financier c'est le bon ». Un espace contient le contexte financier complet, pas uniquement un budget. Pourquoi : le besoin englobe les fonctions existantes.

### Plusieurs espaces indépendants pour une même personne

L'humain décrit un choix à la connexion entre finances personnelles, de couple ou de famille, et confirme que toute l'application reflète l'espace choisi. La bascule entre espaces doit aussi être possible dans l'application. Pourquoi : une personne participe à plusieurs ensembles de finances sans les mélanger. La reprise automatique éventuelle reste ouverte ; l'emplacement du sélecteur est décidé ci-dessous.

### Sélecteur d'espace dans la sidebar

Décision humaine complémentaire : « le switch entre les espaces doit se faire dans le sidebar » ; « si on a un seul espace la dropwnlist en contient un seul et on peut pas changer ». Le sélecteur est une liste déroulante dans la sidebar, contenant les espaces accessibles. Avec une seule appartenance, il reste présent avec cette unique option et aucune bascule n'est possible. Pourquoi : conserver un point d'accès stable au contexte financier, même avant la création d'un deuxième espace. La déclinaison pour la navigation mobile, qui utilise actuellement une barre basse, reste à concevoir.

### Même application et mêmes fonctions dans l'espace partagé

Verbatim humain : « exactement le meme que l'app existante mais chargé avec les donnees du couple ». Dépenses, revenus, allocations, épargne, dettes et configuration financière relèvent de l'espace actif. Pourquoi : gérer l'ensemble des finances communes, pas une fonctionnalité partagée isolée.

### Tous les membres ont les mêmes droits

Verbatim humain : « tous les membres ont tous les droits . Une fois que tu es membre de l,espace , tu peux tout faire ». La reformulation sans privilège du créateur a ensuite été confirmée par « ok parfait ».

Tout membre peut gérer les données, modifier l'espace et inviter d'autres personnes. Aucun propriétaire, administrateur, éditeur ou lecteur aux droits différenciés à inventer. Pourquoi : l'utilisateur écarte explicitement la complexité de gestion des permissions. Les modalités de suppression, départ et exclusion restent à définir sans remettre en cause cette égalité.

### Invitation avec ou sans compte existant

Décision humaine : le conjoint ayant un compte se connecte, voit l'invitation et rejoint ; sinon il crée son compte, est connecté puis accepte l'invitation. Pourquoi : inviter doit fonctionner avant l'inscription du destinataire. L'émission d'une invitation ne vaut pas acceptation ni appartenance.

### Premier espace obligatoire, nommé à l'onboarding

Verbatim humain : « lors de l'onboarding , on doit demander le nom de notre espace » ; « par defaut on a forcement un espace qui doit etre crée ». Pourquoi : toute utilisation financière a désormais lieu dans un espace, même en solo.

### Démarrage personnel ou partagé et invitation dès l'onboarding

L'humain veut commencer personnellement puis ajouter un espace de couple, ou « directement ajouter un espace partagé » et « lancer l'invitation direct depuis l'onboarding ». L'invitation est donc optionnelle pour démarrer. Pourquoi : permettre les deux usages sans imposer un détour par un espace personnel utilisé artificiellement.

### Création d'espaces supplémentaires après l'onboarding

Verbatim humain : « Apres on doit pouvoir ajouter un autre espace si on veut ». Pourquoi : les besoins de gestion commune peuvent arriver après l'inscription.

### Conservation des finances des comptes existants

La proposition de créer pour les comptes existants un premier espace contenant toutes leurs données actuelles a été approuvée par le « exact » humain précédant la demande d'input. Pourquoi : préserver les finances déjà saisies et le fonctionnement actuel sans ressaisie.

## Faits vérifiés avec ancres

- Stack déclarée : Next.js 16.1.6, React 19.2.3, Neon serverless, Neon Auth et Zod ; ancre : package.json. Produit PWA fr-CA : README.md.
- requireAuth() retourne l'identifiant de l'utilisateur authentifié ; ancre : lib/auth/helpers.ts. Exemple d'actions filtrées par cet identifiant : addExpenseTransaction() et getExpenseTransactions(), lib/actions/expense-transactions.ts.
- Les types Section, Card, Expense, Settings et Debt portent user_id ; ancre : lib/types.ts. C'est l'état actuel, pas un schéma cible imposé.
- L'accueil génère des instances mensuelles, met automatiquement à jour des statuts puis charge les synthèses ; ancre : AccueilPage(), app/page.tsx. Une consultation peut donc aussi déclencher des écritures à contextualiser.
- Les sections par défaut sont actuellement initialisées par compte ; ancre : ensureDefaultSections(), lib/actions/claim.ts.
- Le carrousel d'onboarding utilise user_onboarding par utilisateur ; ancre : lib/actions/onboarding-carousel.ts. Un guide de configuration distinct existe : lib/actions/setup-guide.ts. Leur articulation doit être étudiée.
- Aucune feature dédiée au partage trouvée dans le backlog lors des recherches rg du 2026-10-22. L'intention apparaît dans .app-factory/docs/vision.md : « Phase 2 — Famille & amis » et priorité 3 « Partage familial (multi-foyer, budget partage) ».
- État de tests observé le 2026-10-22 : npx vitest run, 176 succès et 1 échec sur 177 tests. Écart des couleurs du badge IN_PROGRESS entre __tests__/unit/progressive-expenses.test.ts et getStatusBadge(), lib/expense-display-utils.ts. État daté à recontrôler, pas certification actuelle.
- Exploration visuelle locale : dashboard et ses trois onglets, dépenses et formulaire non soumis, revenus et allocations, patrimoine, réglages et charges ; vues mobile et desktop échantillonnées. Navigateur intégré utilisé ; aucune validation Playwright MCP réalisée. Cela ne certifie pas tous les parcours.
- La documentation .app-factory/docs/product/current-state.md et certaines mémoires .serena/memories/ sont partiellement périmées : elles annoncent notamment l'absence de tests ou de validation Zod, contredite par __tests__/unit/ et lib/schemas/. Le code doit être consulté avant de reprendre ces constats.

## Vocabulaire

- Compte / utilisateur : identité authentifiée d'une personne, distincte des espaces.
- Espace financier : ensemble isolé de données et de configuration financière, exploitable avec les fonctions existantes.
- Espace actif : espace choisi qui détermine le contexte de l'application.
- Espace personnel : espace à un seul membre, privé tant qu'aucune autre personne ne le rejoint. Aucun type technique immuable n'a été imposé.
- Espace partagé : espace comprenant plusieurs membres ; premier usage : le couple.
- Membre : personne ayant accès à l'espace ; tous les membres ont les mêmes droits.
- Invitation : proposition de rejoindre un espace, nécessitant acceptation.
- Créateur : personne à l'origine de l'espace, sans privilèges supplémentaires.
- Budget / enveloppe : objet financier interne à l'espace, pas synonyme d'espace.

## Contraintes imposées

- Conserver les fonctionnalités existantes dans chaque espace ; contextualiser aussi la configuration financière.
- Couvrir l'invitation d'un utilisateur existant et l'inscription d'une personne déjà invitée.
- Demander le nom du premier espace, permettre l'invitation pendant l'onboarding et la création d'autres espaces ensuite.
- Préserver l'interface française et les conventions produit ; ancres : README.md, app/globals.css, cs-brand/brand-config.md. Aucune refonte de marque demandée.
- Appliquer les règles de travail humaines : plan dans .Codex/plans/ et validation avant implémentation non triviale, traçabilité, commit automatique après travail réussi et aucun push sans demande.
- Pour les travaux visuels aval, suivre le protocole projet : Playwright MCP, inspection de la page entière, avant/après des correctifs visuels et cas extrêmes pertinents. Un autre navigateur ne doit pas être présenté comme une validation Playwright MCP ; signaler les blocages réels.
- N/A — aucun délai, plafond de membres ou limite du nombre d'espaces n'a été fixé par l'humain.

## Specs de forme des livrables (verbatim)

N/A — aucune maquette, aucun template d'interface ni liste de livrables techniques n'a été imposé pour la feature. Cet input suit le template du skill work-input-authoring ; les livrables aval seront déterminés par la préparation.

## Hors-scope + options rejetées + frontière de débordement

- Rejet explicite : matrice de permissions différenciées ; tous les membres peuvent tout faire.
- Cadrage trop étroit écarté : simple budget partagé, insuffisant pour le contexte commun de toute l'application.
- Mandat actuel : rédiger l'input. Ne pas lancer implicitement un cycle AWM, implémenter, migrer, déployer ou envoyer des invitations réelles.
- Aucun partage de frais, calcul de créances, remboursement entre conjoints, synchronisation bancaire ou paiement réel n'a été demandé. Ne pas l'inférer du mot couple.
- Famille et autres groupes sont des usages cités, sans logique particulière définie ; le couple est le premier usage concret.
- Les anomalies de reconnaissance ne sont pas une autorisation de refonte. Tracer les petits correctifs nécessaires ; cataloguer et remonter les changements importants ou risqués avant d'étendre le mandat. Aucun problème ni contournement ne doit disparaître silencieusement.

## Ce qui reste génuinement ouvert

- Déclinaison mobile du sélecteur de la sidebar, détails visuels et interaction quand il n'a qu'une option (ouverture ou contrôle désactivé), choix systématique à la connexion ou reprise du dernier espace, comportement sur plusieurs appareils et onglets. L'emplacement dans la sidebar et l'option unique sans bascule sont déjà décidés.
- Canal et destinataire de l'invitation, lien éventuel, notification dans l'application, expiration, renvoi, annulation et refus. Visibilité après connexion et acceptation après inscription sont décidées, transport non tranché.
- Articulation entre inscription via invitation, création obligatoire du premier espace et accès à l'espace invité. Ne pas en déduire une obligation de créer d'abord un espace personnel supplémentaire non désiré.
- Nom proposé, règles de nommage et nom attribué au premier espace des utilisateurs existants.
- Départ, exclusion, suppression d'espace, dernier membre, sort des invitations et données ; confirmations et récupération éventuelle. Ne pas inventer de privilège du créateur pour résoudre ces questions.
- Séparation entre préférences individuelles et configuration de l'espace : devise, rappels, notifications, suivi d'onboarding et guide. Authentification et compte restent individuels ; leur articulation avec les espaces est à concevoir.
- Guide de configuration d'un espace supplémentaire et accueil d'un membre rejoignant un espace déjà configuré.
- Attribution visible des saisies, historique et éditions concurrentes ; aucune fonction d'audit utilisateur ou de temps réel n'a été demandée.
- Architecture et schéma cible, stockage du contexte actif, stratégie de migration et traitements automatiques.
- La préparation peut proposer des hypothèses marquées ; ne pas les présenter comme des décisions humaines déjà prises.

## Garde-fous et vétos qualité (expliqués)

- Aucune fuite entre espaces ni accès d'un non-membre : l'isolation est la raison d'être de la feature. Elle concerne les actions serveur, les relations entre objets, les caches et les traitements automatiques ; le filtrage visuel seul ne la prouve pas.
- Invitation en attente sans accès aux finances ; acceptation par le bon destinataire. Sinon le mécanisme d'invitation devient un accès non autorisé.
- Conservation des données, montants et relations existants. Perte, duplication, mauvaise attribution ou double génération mensuelle fausseraient les finances.
- Une bascule ne doit pas enregistrer des saisies dans le mauvais espace : considérer formulaires ouverts, traitements différés et concurrence pour éviter des écritures silencieusement mal affectées.
- Ne pas annoncer une validation sur inspection du code seule. Prouver isolation et appartenance entre comptes et espaces, observer les parcours visuels et traiter explicitement l'échec de test préexistant au lieu de le masquer.

## Critères de succès vérifiables + position dans l'ensemble + coût

Au niveau de l'intention, le résultat doit permettre de constater :

- Une personne nomme et crée son premier espace pendant l'onboarding, peut y lancer une invitation, puis créer un autre espace et basculer depuis la liste déroulante de la sidebar entre des finances distinctes dans toute l'application ; avec un seul espace, cette liste ne contient que lui et ne permet aucune bascule.
- Deux personnes, dont l'une peut s'inscrire après invitation, rejoignent le même espace après acceptation et y utilisent les fonctions existantes avec des droits égaux ; un compte non-membre n'y accède pas.
- Les finances existantes sont conservées dans un premier espace après migration, sans perte ni mélange, avec les fonctions existantes vérifiées.

Position : concrétisation du « Partage familial » de .app-factory/docs/vision.md. Cet input précède requirements, conception et plan ; aucun travail aval n'est réputé réalisé.

Coût : N/A — aucune cible propre à cette feature donnée par l'humain. .app-factory/docs/architecture.md indique une infrastructure sur plans gratuits ; vérifier cette contrainte et l'impact du transport des invitations avant de proposer un service payant, sans la faire passer pour une décision nouvellement prise.
