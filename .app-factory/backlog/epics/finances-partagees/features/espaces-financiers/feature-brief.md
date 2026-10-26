# Feature Brief — Espaces financiers personnels et partagés

> Statut : IN_PROGRESS — DESIGN APPROUVÉ ; implémentation locale réalisée, recette complète et livraison non démontrées.
> Priorité : prochaine priorité produit, avant les autres fonctionnalités, instruction humaine du 2026-10-22.
> Source : `.Codex/inputs/espaces-financiers/input.md` (sidebar incluse).

État courant et limites : [readiness](readiness.md). Les propositions de préparation conservées plus bas sont historiques ; décisions techniques exécutées et preuves sont référencées dans cet état. Aucun critère d’acceptation n’est réduit.

## Intention et décisions acquises

Permettre à une personne de gérer séparément ses finances personnelles et celles de son couple avec la même application. Un espace solo devient partagé à l’acceptation d’un autre membre. Aucun rôle différencié ni privilège du créateur. Nom du premier espace et question de partage demandés pendant l’onboarding ; Non saute la page invitation, Oui la propose avec envoi facultatif. Les autres espaces sont créés depuis les réglages. Les comptes existants conservent leurs données. La section espace de la sidebar ne contient que la liste déroulante, même avec une option unique sans bascule. Réglages > Espaces et membres contient la liste des espaces accessibles et leur création ; chaque ligne ouvre une fiche de gestion sans changer implicitement l’espace actif.

Hypothèse : un contexte complet commun permettra au couple de contribuer sans exposer les finances personnelles. Recette : les deux conjoints réalisent le parcours complet, retrouvent leurs modifications communes et n’accèdent jamais aux autres espaces de l’autre.

## Critères de recette de la feature

1. Nommer le premier espace et répondre à la question de partage : Non crée sans page invitation ; Oui propose l’invitation facultative.
2. Lister/créer les espaces dans les réglages, consulter une fiche pour renommer, voir les membres et inviter ; basculer uniquement via le sélecteur de la sidebar. Toutes les pages et opérations reflètent le contexte actif.
3. Avant authentification, voir une page explicite d’invitation avec Se connecter / Créer un compte vers les pages existantes ; retrouver l’invitation après auth et accepter distinctement, sans accès préalable.
4. Les membres utilisent les mêmes fonctions et droits ; leurs autres espaces restent privés.
5. Retrouver les finances existantes sans perte, duplication ou changement des montants et relations.

## Ordre des stories et dépendances

| Ordre | Story | Capacité | Dépendances |
|-------|-------|----------|-------------|
| 1 | [ESP-001](stories/ESP-001.md) | Nommer et utiliser mon premier espace | aucune nouvelle story |
| 2 | [ESP-002](stories/ESP-002.md) | Retrouver mes finances existantes dans mon espace | ESP-001 |
| 3 | [ESP-003](stories/ESP-003.md) | Créer un autre espace et choisir mes finances dans la sidebar | ESP-001, ESP-002 |
| 4 | [ESP-004](stories/ESP-004.md) | Inviter et rejoindre avec un compte existant | ESP-003 |
| 5 | [ESP-005](stories/ESP-005.md) | Créer mon compte pour rejoindre l’espace invité | ESP-004 |
| 6 | [ESP-006](stories/ESP-006.md) | Inviter mon conjoint pendant la création de mon premier espace | ESP-004, ESP-005 |

Chemin critique : 001 → 002 → 003 → 004 → 005 → 006. Chaque story traverse les couches nécessaires à son parcours ; aucune story « migration », « API » ou « UI » séparée. Les entités sont introduites à leur premier usage. Le premier incrément est ESP-001 : un nouveau compte nomme son espace et y utilise l’application en solo. Ce n’est pas encore la promesse de partage livrée.

## Invariants communs à toutes les stories

- Seuls les membres accèdent aux données ; masquer un élément ne constitue pas une preuve d’isolation.
- Fonctions concernées : dashboard et synthèses, dépenses et transactions progressives, revenus, allocations, épargne/projets/contributions, dettes/paiements, catégories, cartes, configuration financière, génération mensuelle et traitements automatiques. Aucun retour implicite aux finances du compte lorsqu’un espace est choisi.
- L’authentification et le compte restent individuels. Les préférences ambiguës sont à classifier avant la livraison multiespace.
- Aucun rafraîchissement temps réel n’a été demandé. Proposition PM pour la version initiale : rendre les changements visibles à la prochaine consultation/recharge, à confirmer lors de la conception.
- Aucun échec de création, de bascule ou d’acceptation ne doit annoncer une réussite ni donner un accès partiel non autorisé.
- Tests d’isolation avec deux comptes membres, un troisième non-membre et au moins deux espaces aux données volontairement distinctes ; essais de références d’objets croisées.
- Vérifications visuelles desktop/mobile, clavier, nom très court et très long ; inspection de la page entière. Playwright MCP reste requis par le protocole humain, pas remplacé par l’inspection du code.

## Complément humain validé — 2026-10-22

Approbation « ok ça me va » des quatre propositions présentées :

1. Invitations par courriel, également visibles après connexion.
2. Un nouvel invité peut rejoindre directement l’espace commun sans créer obligatoirement un espace personnel supplémentaire.
3. Reprise du dernier espace utilisé à la connexion.
4. Premier espace des comptes existants nommé « Mes finances », modifiable ensuite.

Ces décisions restent acquises. La conception a été corrigée puis approuvée par l’humain ; cette approbation ne valide ni le plan technique ni les propositions restantes ci-dessous.

## Design approuvé après test humain — 2026-10-22

L’humain confirme « ok c’est parfait ça me va » après les corrections des maquettes React du commit `7aaec6d`. Référence normative : [prototype React et liens directs](../../../../../../cs-design/mes-finances/features/espaces-financiers-essai-02/README.md), dossier `cs-design/mes-finances/features/espaces-financiers-essai-02/`. Les anciennes maquettes HTML ne sont pas la référence validée. Aucun Storybook ni bibliothèque de composants demandé.

Décisions désormais fermes : question de partage et invitation conditionnelle ; page publique explicite avec deux chemins vers les pages auth existantes ; sidebar limitée au sélecteur sur desktop/mobile ; liste/création dans les réglages, puis détail par espace pour renommer, membres et invitation. Tous les membres conservent les mêmes droits.

Cette validation porte sur l’expérience. Le prototype utilise des données et services simulés : elle ne prouve ni auth réelle, ni transport de courriel, ni isolation ou migration de production.

## Propositions PM à valider — ne sont pas des décisions humaines

| Sujet | Proposition recommandée | Pourquoi / dépendance |
|-------|-------------------------|-----------------------|
| Identité / lien invitation | Session du destinataire et lien secret reçu par courriel ; aucun code supplémentaire | Décision humaine26octobre : suppressionOTP. Le jeton du lien + sessionmêmeemail autorisent une réponse explicite sansforcerAuth.emailVerified ; listeprivée sansjeton reste réservéeauxadressesvérifiées. |
| Cycle d’invitation | Validité 7 jours ; renvoi et annulation possibles à tout membre ; refus possible au destinataire ; doublon en attente signalé sans multiplier les invitations | Éviter accès durable non désiré et confusion. Proposition à valider avant critères détaillés d’expiration/renvoi/annulation/refus ; pas ajoutée silencieusement aux stories. |
| Nom des nouveaux espaces | Saisie obligatoire non vide, espaces seuls refusés ; préremplir « Mes finances » pour les nouveaux | Réduit la friction ; validation exacte à concevoir. Pour les comptes existants, le nom « Mes finances », modifiable ensuite, est désormais décidé. |
| Onglets / repli du contexte | Changement limité à l’onglet courant, les autres gardent leur contexte affiché ; repli explicite si le dernier espace est inaccessible | La reprise du dernier espace à la connexion est décidée. L’indépendance des onglets et le repli restent des propositions pour éviter les bascules surprises ; stockage non prescrit. |
| Formulaire ouvert | Demander de terminer ou abandonner une saisie avant de basculer ; ne jamais la déplacer vers l’autre espace | Empêche les erreurs d’affectation. Interaction précise à concevoir dans ESP-003. |
| Préférences et guide | Compte, sécurité, appareil et consentement push individuels ; configuration financière et progression du guide propres à l’espace ; un nouvel arrivant ne réinitialise pas le guide d’un espace déjà configuré | Évite qu’une préférence individuelle modifie les finances communes. À confirmer avant ESP-003/005. |
| Cycle de vie destructeur | Ne pas ajouter départ, exclusion ou suppression d’espace dans cette première livraison ; les définir ensuite avec droits strictement égaux | Ces parcours n’ont pas été demandés et impliquent données/invitations/dernier membre. Périmètre recommandé à valider ; aucun rôle propriétaire caché. |

Attribution visible des écritures, historique utilisateur, édition en temps réel et résolution sophistiquée des conflits : non demandés. L’intégrité face aux écritures simultanées reste obligatoire.

## Risques et préparation technique attendue

Le PM ne prescrit ni schéma, ni mécanisme de contexte, ni transport technique. La conception doit inventorier les chemins financiers, traitements automatiques, caches et relations ; examiner DISC-PROG-002-001 et DISC-003 sans supposer leur état actuel ; démontrer conservation et isolation sur base réelle. Le Builder classifie l’assurance (tenancy/finances appellent les preuves Reinforced AF), chaque changement de schéma et la stratégie de reprise. Tout plan UNSAFE doit être accepté avant exécution. L’échec de test préexistant décrit dans l’input doit être recontrôlé et traité explicitement.

Plan technique dans `.Codex/plans/`, validation humaine avant implémentation. Cette préparation backlog ne lance aucun cycle AWM, ne migre aucune donnée, n’envoie aucune invitation réelle et ne vaut pas preuve de fonctionnement.

## Readiness

Voir [examen de readiness](readiness.md) et [exigences](requirements.md). Les 6 stories sont rédigées avec 5 AC chacune. Aucune estimation de l’équipe n’a été obtenue : le PM n’invente ni points ni dates. ESP-002 et surtout ESP-003 présentent un risque de taille ; conception et estimation doivent confirmer une session ou conduire à un redécoupage par capacités utilisateur avant build.

## Guide initial — décision humaine du26octobre

Le membre qui rejoint un espace existant n’a pas l’assistant de création (revenu/dépense/génération/paiement). Le guide reste pour le créateur de chaque espace, avec progression calculée sur les données communes. Si une personne invitée crée ensuite un autre espace, son guide y reste disponible. Aucun droit financier différent entre membres ; le bouton Revoir de Réglages suit cette règle d’affichage.
