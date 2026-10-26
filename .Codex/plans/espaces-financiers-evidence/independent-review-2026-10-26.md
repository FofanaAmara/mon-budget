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

## Complément indépendant — DISC-ESP-017, reprise d’invitation à l’onboarding

**Snapshot :** diff de travail au-dessus de `e7b1cd603cd6bb3bf30eb18ba6e891e112210595`, avant commit final. Empreintes SHA256 vérifiées le26octobre :

| Fichier | SHA256 |
|---|---|
| `app/onboarding/page.tsx` | `c240817436566b10f40b58f0cdef2be762504392377ed488b8930b9444f05459` |
| `components/spaces/OnboardingEntry.tsx` | `c16623becb27e73a285dbdf94b03ec075b52d46a968cfea6fa1d43e2df430d2e` |
| `__tests__/private-entry-session.test.tsx` | `9ab0b60b322e4104ffdb0fd71b9e78b15f21fbc276ba034cd05832ea3447b230` |

**Avis : favorable sur ce correctif, aucun nouveau défaut confirmé.** La destination d’entrée n’est plus une redirection serveur recalculée qui emporte le formulaire dès que l’espace est créé. OnboardingEntry garde la destination du montage ; une actualisation RSC du même acteur conserve les champs et la reprise d’envoi. Une nouvelle entrée monte un nouvel état et suit la destination calculée côté serveur. Le composant ne transporte ni identité client inventée ni nouveau privilège.

Points relus : `OnboardingEntry.tsx:15`, `app/onboarding/page.tsx:9`, FinancialSessionBoundary et son sous-arbre `key={userId}`, FirstSpace/SpaceForm, actions createSpace/inviteToSpace avec expectedActorId. La frontière de session reste à l’extérieur du formulaire ; identité client absente/différente ou erreur => pas de formulaire privé rendu. Un acteur nouvellement autorisé remonte son propre sous-arbre. Le fait de figer une décision de navigation ne fige donc pas une autorisation serveur. Les destinations sont une union fermée de deux routes internes, sans redirection externe fournie par l’utilisateur.

**Exécuté par ce reviewer :** `npx vitest run __tests__/private-entry-session.test.tsx`, cinq tests réussis, zéro échec/skip, exit0,14:00:50locale. Les cas couvrent l’occultation des entrées privées sous autre session/absence/panne, ainsi que les destinations d’une nouvelle visite avec espace existant ou invitation. Ce rendu serveur avec Auth/actions/navigation doublés n’exerce pas lui-même la persistance d’un montage React lors d’un vrai retour d’action Next.

**Preuve navigateur distincte communiquée par le parent :** panne SMTP loopback reproduite avant correction (espace/invitation durables mais erreur/reprise perdus par redirection) ; après correction, vrai MCP sur nouveau compte reste sur /onboarding et affiche espace créé, erreur et boutons Réessayer/Continuer. Le parent poursuit les contrôles de reprise après rétablissement SMTP et sa qualité isolée. Ces étapes ne sont pas déclarées exécutées par le reviewer ni terminées par anticipation.

L’avis sera rattaché au SHA final après comparaison de ces trois empreintes. La CI distante et le TLS local durable ne sont pas résolus par ce complément ; aucune donnée de recette, configuration ou source produit modifiée par cette instance.

### Rattachement final vérifié

Les trois blobs extraits directement de **`3b71827ee0ab1fabee3330ad4b2f4127a02da47f`** ont été hachés par ce reviewer : leurs SHA256 sont exactement ceux du tableau ci-dessus. Les trois fichiers du checkout ne présentent aucun diff non commité. L’avis favorable DISC-ESP-017 est donc rattaché à ce SHA exact ; aucune nouvelle revue ni suite inchangée n’a été rejouée pour produire artificiellement une preuve supplémentaire.

Le parent rapporte la recette réelle achevée : panne SMTP et erreur/reprise visibles375/1200, Continuer permet saisie7.89 et recharge, nouvelle visite onboarding redirige vers espaces ; SMTP rétabli puis retry depuis fiche, réception réellement lue dans Mailpit ; SQL constate un espace, un réglage, six catégories, une invitation, tentatives failed puis sent,7.89 conservés. Qualité isolée58790 build/types/lint/11delivery exit0 et266unit/20fichiers24555 exit0, fichiers identiques à la copie qualité. Ces résultats sont ceux du parent, non des exécutions additionnelles du reviewer ; consulter ses preuves pour les détails et captures. Mailpit prouve ce retry local, pas une nouvelle réception externeResend.

**Conclusion indépendante : correctif approuvé sur `3b71827ee0ab1fabee3330ad4b2f4127a02da47f`, aucun finding nouveau. CI distante/TLS durable et critères globaux restants non clôturés ; pas de feu vert release.** Ce rattachement n’autorise aucun push/déploiement et n’a modifié que le rapport.

## Audit de couverture complémentaire — 26 octobre

Instance distincte financial_spaces_review : revue des critères littéraux et preuves composées, sans nouvelle mutation de code ni test revendiqué. Avis initial28/30AC, puis confirmation29/30 après LEGACY-HISTORY-REAL : consultation Chrome A/CUA du compte réellement mappé, historique et compteurs SQL cohérents complètent ESP002/AC2 avec PG/MIG. ESP002/AC1 reste partiel : une session revalidée ne remplace pas une nouvelle connexion. Aucun autre test financier nécessaire pour cette tranche, aucun défaut de code supplémentaire identifié.17exigences littérales vérifiables ; DoD/CI/SW/BFCache restent des gates distincts et ouverts. Cet avis de couverture ne constitue pas une approbation de release.

## Complément Safari HTTP — instance distincte financial_spaces_review

Gatewaylocal : aucunfindingbloquant, portéeimportsrunnertestsuniquement, bindloopback/Hostborné/upstreamlocal/ancienscookiesHTTPSfiltrés, valeurs/HttpOnly/SameSite/expiration/chunkspréservés.3testsciblésréellementverts aprèsreprisehôte de listenEPERM sandbox ; aucunfichiermodifiéparreviewer.

Provider : avisfavorable sansnouveaufinding, SDKuseOnSuccessTransitionrevurefetchSession→awaitonSessionChange→navigate. Suppressionrefreshretirecourse ;retourinvitationvalidé/linksSSRinchangés, nouveauxdocuments etmasquageancienscontenusconservés, storageinvalidationautresongletsmaintenue. OnSessionChangepasunrefreshgénéralprofilperdu ;multiSessionfalse.15testsprovider/retourréellementverts. WebKitGREENetqualitéglobaleconstatésparparent, pasrevendiquéscommeexécutésparreviewer.

Empreintes des sources revues et testées :

- scripts/financial-spaces/dev.mjs : d800be59b71791900383492a4e7ad86724e0fa406d1f8e2ed8852e4426b83ea4
- scripts/financial-spaces/local-http-auth.mjs : ea53b3f51b97475091f52dd7dfe7da913e96ae0a6e8de9e93c17f67d368d6d43
- __tests__/delivery/local-http-auth.test.mjs : 756dfa53afb2a8190903818d08a004ee401e6c84b133ed6269cd242c7f363928
- app/providers.tsx : c41909a536d0c2aec342ff6096fd4001b247b40eec5d86c375894772d3f01400
- __tests__/auth-provider-render.test.tsx : 8daa92cd59ce56801063b30fb206459bbb21b18c9b26ed162ffbe708b6943063
