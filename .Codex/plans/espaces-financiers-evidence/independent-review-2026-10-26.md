# Revue indépendante — espaces financiers — 26 octobre 2026

**Reviewer :** instance distincte `/root/financial_spaces_review` ; revue directe, sans AWM.
**Snapshot inspecté :** `e7b1cd603cd6bb3bf30eb18ba6e891e112210595`.
**Avis :** favorable sur le code et le modèle inspectés, aucun nouveau défaut P0/P1/P2 confirmé. **Ce n’est pas un feu vert de livraison : les gates de preuve encore ouverts restent applicables.**

## Périmètre et méthode

Sources lues : plan d’implémentation, matrice17exigences/30AC, story ESP004 et critères transverses, audit courant historique, MEMORY.md et feedbacks isolation/concurrence/argent/Auth/email/backfill. Lecture du code présent, sans reprendre le verdict d’un producteur comme preuve de justesse. Comparaison ciblée avec le générateur préfeature pour vérifier la conservation du calendrier ; aucune nouvelle politique de fréquence inventée.

Le checkout contient aussi les modifications préexistantes `.serena/project.yml`, `next-env.d.ts` et des anciens assets CreativeStudio non suivis ; ils ne sont pas attribués à cette feature ni inclus dans cet avis. Le parent poursuit des essais et des mises à jour documentaires en parallèle, sans nouveau code produit annoncé. Un nouveau diff produit doit être revu avant d’étendre cet avis.

## Contrôles de code et conception

| Risque | Éléments réellement inspectés | Conclusion bornée |
|---|---|---|
| Autorisation et confusion d’espace | `lib/spaces/context.ts:36`, helpers page/parents, actions financières dépenses/revenus/mensuels/allocations/cartes/catégories/dettes/épargne/réglages/démo | Appartenance revalidée serveur, cible explicite ; lectures/écritures et jointures inspectées bornées par espace. Les IDs d’objets ne remplacent pas le contexte. Pas de filtre d’autorisation par ancien auteur repéré. |
| Égalité des membres et provisionnement | `lib/actions/spaces.ts`, SQL001/006, formulaires et fiche | Pas de rôle propriétaire. Création atomique et clé durable, nom validé, provisioning gagnant unique, acteur attendu sur création/envoi ; préférence liée à une appartenance. |
| Acceptation et identité | `lib/actions/invitations.ts:282`, vérification OTP, landing et layouts privés | Session fraîche et email vérifié imposés, verrou pending et insertion unique ; aucune adhésion à l’émission ni personnel imposé à l’acceptation. Retour Auth et réponse distincte cohérents. |
| Livraison et reprises | `lib/actions/invitations.ts:176`, `lib/invitations/{security,mail}.ts`, SQL006 | Payload figé, token régénéré/hash contrôlé, lease et limites bornées, fenêtre de retry23h puis état uncertain. Aucun EMAIL_TO substitué au destinataire ; aucune réussite transport annoncée avant accusé. Pas de promesse exactly-once hors fenêtre fournisseur. |
| Conservation et relations | SQL001–006, runner de fixture, rapport de migration et tests associés | Expand/backfill/cutover séparés ; dernière passe sous verrou, refus d’ambiguïtés, FK composites et dissociation optionnelle préservant space_id. Valeurs historiques non réécrites pour inventer les deltas de paiement. Le runner refuse la production : ce n’est pas un outil de release déjà validé. |
| Intégrité des montants et concurrence | Schémas monétaires, transferts, contributions, dette/paiement/reversal, génération des mois | Validation au centime, changements et journaux atomiques, verrous ordonnés sur les chemins inspectés, bornes solde et historique inconnu explicite. Mise à jour des revenus calculée sous verrou depuis les templates courants. |
| Sessions, anciennes réponses et caches | Auth serveur, FinancialSessionBoundary, visibilité, SpaceContext/navigation/selector, `public/sw.js` | Lecture RSC autoritative sans cookie mutation, cache par rendu ; navigation et continuations gardées par montage/lifetime. Cache SW limité aux icônes, pas de fallback HTML/RSC privé. Brouillons et tiroir ont des protections explicites. La lecture ne prouve pas tous les événements réels du navigateur. |
| Remise à zéro et automatismes | Actions maintenance/générateurs/guide, cron push, workflow | Reset/démo bornés à l’espace, consentements et subscriptions individuels conservés. Cron existant générique sans données financières, pas transformé en rappel ciblé fictif. Gate CI required refuse les résultats autres que success. |

## Preuves exécutées par ce reviewer

`npx vitest run` exécuté sur le snapshot ci-dessus : **265 tests /20fichiers, zéro échec et zéro skip, exit0**, durée1.15s, lancement13:29:22locale. Configuration unitaire `.test.ts/tsx` inspectée ; suites services `.db.ts` exclues. Aucun accès DB, Auth, envoi email, navigateur ou build racine effectué par ce reviewer. Aucun secret lu ni imprimé.

Les preuves PostgreSQL/conservation/restauration précédentes ont été examinées dans les rapports et les tests ; **elles n’ont pas été rejouées par cette instance**. Les parcours NEW-ACCOUNT-REAL et EXISTING-ACCOUNT-REAL sont documentés dans resend-real-execution.md ; le reviewer n’a pas piloté le navigateur du parent et ne prétend pas les avoir réexécutés.

Le parent a communiqué des essais MCP supplémentaires après le snapshot : finances et configuration lues parB, tiroir mobile/clavier, offline/reprise, masquage de l’autre onglet après signout, échec réseau de bascule puis retry, réponse RSC ancienne livrée après intention de bascule sans retour à l’ancien contexte. Ces observations doivent être enregistrées avec leurs captures/limites dans le suivi parent ; elles ne sont pas une exécution de cette instance.

## Réserves de livraison, distinctes d’un défaut de code confirmé

- CI distante verte sur le SHA à livrer : absente, aucun push autorisé. Suites locales et workflow préparé ne la remplacent pas.
- TLS local durable : non acquis, autorisation d’installation annulée côté macOS. Exception navigateur et reload CSS ne corrigent pas ce point ; ne pas annoncer Safari/serviceworker validés par cette revue.
- Matrice17/30 : des trajets restent partiels, notamment premier onboarding réel complet, intégralité des variantes financières/configurations/automatismes àdeux, reprises d’échec d’envoi dans la vraie app et contrôles caches/historique complets. Ne pas promouvoir les30AC à DONE par le nombre de tests.
- Le regard indépendant de code/migration est réalisé ici ; validation visuelle MCP intégrale et verdict de livraison restent à établir par les preuves et l’humain. Cette revue n’autorise ni push, ni migration de source, ni déploiement.

Aucune optimisation facultative proposée comme obstacle. Aucun changement produit, environnement, DB ou configuration fait par ce reviewer ; seul ce rapport est ajouté, sans commit autonome.
