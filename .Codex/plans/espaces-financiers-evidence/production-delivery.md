# Livraison production — preuves en cours

26 octobre2026. État courant : main protégé, PR brouillon #1 publiée ; CI complète verte sur a89406c (run40410232726), CI documentaire suivante en cours. Vercel reste au login GitHub ; aucune bascule production. Les observations datées ci-dessous gardent leur contexte historique. Contrat `.Codex/goals/espaces-financiers-production.md`, inchangé. **IN_PROGRESS : aucune migration ni publication production exécutée.**

## Préparation vérifiée

- Référence distante observée par `git ls-remote` puis fetch : `d0980ec8a3e0dc2a255bb2a651adf7455c85a286`. Dernier déploiement GitHub Production4012396706 par vercel[bot], statut success, URL `https://mon-budget-5tnj18xy1-amara-fofanas-projects.vercel.app`. Cette observation historique n’établit pas la santé actuelle ni le domaine public principal.
- API GitHub : dépôt accessible, droits admin/push présents ; main non protégé (404 sur le contrôle réel). Activation de la protection refusée par revue automatique faute d’accord sur la configuration exacte ; question précise ouverte. Aucun contournement ni mutation de protection réalisée à ce stade.
- Vercel CLI sans credentials. Connexion navigateur via GitHub explicitement autorisée après rejet initial ; arrivée sur formulaire GitHub sans session ouverte, onglet conservé. Pas de métadonnées Vercel/Neon inventées.
- Candidate Neon de `.env.local` : transaction readonly, PostgreSQL17.11,18tables public, aucun financial_space_rollout. Cela ne prouve pas encore l’association à la production Vercel.
- Récupération Git non destructive :58commits au-dessus de origin/main conservés ; worktree `worktrees/financial-spaces-production` et branche `feature/financial-spaces-production`, même baseb193d48. Les fichiers de reprise transférés ont été comparés par SHA256 ; originaux et recette humaine primaire préservés. Profil durable et checkout primaire retenu explicitement. Le runner local HTTP/Mailpit n’a pas changé.

## Exécuteur et contrôles locaux

Runner de production distinct de migrate.mjs fixture-only : cible directe Neon/base/rôle et TLS vérifiés, profil lié aux projets/branche/SHA, code exécuté comparé aux sources commitées. Dry-run readonly ; apply exige archive restaurée/certifiée, fraîcheur de toutes les colonnes/tables publiques et schéma, pas seulement l’inventaire de conservation historique. Inventaire initial175colonnes exact ; drift refusé.

Advisory lock sans attente indéfinie, verrous avant empreinte, timeouts et transaction atomique001–006.002 une seule fois par transaction. Ledger/phase stricts ; copies exposées et données historiques contrôlées avant premierready. COMMIT_UNKNOWN et échec de rapport après commit imposent réconciliation readonly, jamais restauration aveugle. La sauvegarde réelle et la TOC/extension de sa restauration restent **non exécutées** ; tests synthétiques et lecture de code ne les remplacent pas.

Qualité contre Zod4.6.7 corrigé :19delivery,256unitaires/19fichiers,102servicesPG/6familles,45testsDB (dont11runner et5restauration), typegen/types/lint/build et audit production0vulnérabilité. Bancs locaux AuthRSC, navigation6, sélection3, invitation7 verts. Logs privés sous `.local/production-release/quality/`. Ces bancs ne sont ni la recette MCP production ni la CI distante.

Audit initial RED : Zod4.5.4, advisory [GHSA-mrhx-c7xc-m3w5](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5), correctif officiel≥4.6.6. Mise à jour ciblée4.6.7 avec override des consommateurs Auth ; aucun npm audit --force ni suppression de gate. Installation propre dans le worktree, dépendances du runtime humain inchangées.

Défauts de préparation reproduits/corrigés : entrée CLI sous chemin lié, refus de symlink cassé, double instance React du banc partagé, phase régressée aprèscutover, couverture de fraîcheur incomplète. RED/GREEN et revue distincte dans le journal, sans changement du périmètre produit.

## État P1–P10

| Critère | État réel |
|---|---|
| P1 cible et ordre | En cours : accès Vercel et identité provider à établir ; règles de bascule préparées, pas exécutées. |
| P2 source/gates | Gates locaux ci-dessus ; revue indépendante de préparation, PR/CI distante encore à obtenir. |
| P3 backup/répétition | Répétition réelle de la candidate réussie au638f3bd : archive, restauration, conservation, six migrations et rejeu vérifiés. Association à la production et sauvegarde finale après arrêt des writers encore requises. |
| P4 configuration | Présence locale connue, présence/portée réelle de production non vérifiées. |
| P5 migration | Non exécutée en production. |
| P6 révision servie | Ancien déploiement observé seulement ; aucun nouveau SHA livré. |
| P7 recette produit | Preuves locales antérieures réutilisables ; vraie recette production non commencée. |
| P8 email | Recettes locales Resend historiques ; email issu de la vraie production encore à recevoir. |
| P9 isolement/cache | Complément production/SW/BFCache et WebKit encore requis. |
| P10 remise | Récupération réelle, santé finale, matrice/backlog et rapport de livraison à terminer. |

Prochaine unité : vérifications CLI de la préparation committée, cible/protections/Vercel, PR et CI, puis sauvegarde finale répétée et bascule. Aucun feu vert d’apply issu de ce seul rapport.

Publication de la PR : preview automatique de cette seule branche désactivée par git.deploymentEnabled (doc officielle Vercel vérifiée), test RED/GREEN ; main et cron inchangés. Cela ne règle pas la coordination de la publication de main. Scan des58patches locaux avant push :0token fournisseur,0URLNeonavecsecret,0cléprivée. Revue du diff demeure requise, ce scan ciblé ne prouve pas une absence universelle de secret.

Revue distincte financial_spaces_review : favorable au commit local, inspection de sources uniquement, aucun feu vert apply. Empreintes vérifiées : production-migration1c5e3de9, release-backupcf28ce00, testPG791e9f91, vercel4cc50552. Voir journal pour contrôles et limites ; aucun besoin P1–P10 n’est déclaré livré par cette préparation.


## Répétition réelle de la candidate —638f3bd

La première archive candidate a été restaurée sans perte de données, puis refusée par un hash brut de catalogue :8CHECK ont des casts normalisés par PostgreSQL. Les sept autres groupes de catalogue sont identiques. Le correctif638f3bd conserve le hash source brut et compare tout le catalogue en reparsant uniquement les définitions CHECK sur des TEMP de la copie locale certifiée. Noms, états de validation et autres objets ne sont pas normalisés ni ignorés.

La nouvelle exécution réelle a terminé0 : sauvegarde cohérente en lecture seule avec pg_dump17/TLSverify-full, restauration dans une nouvelle base appartenant au projet, comparaison canonique10CHECK, migration001–006 atomique et rejeu sans doublon. Audit readonly supplémentaire : archive SHA256 identique,18tables historiques conservées, attributions/copies exposées vérifiées, ledger6,phaseready. La première archive et sa copie de diagnostic sont préservées, ainsi que la nouvelle copie migrée.

Preuves privées ignorées : `.local/production-release/candidate-638f3bd-public.dump`, son manifeste et `candidate-638f3bd-proof.json`. Revue distincte des artefacts et liens cryptographiques favorable, sans nouvelle exécution par le reviewer ; source SHA638f3bd5cccfe935ec28941cc97c6ec5e069ce5d, trois fichiers revus identiques.

**Borne maintenue :** les identifiants Vercel/projetNeon/brancheNeon sontnull, volontairement non inventés. Ce certificat candidate est inéligible à l’apply production. Il prouve la répétition technique sur les données configurées ; il ne prouve pas encore l’identité du service publié, le gel des writers, la sauvegarde finale de bascule ou la disponibilité de la vraie production. Aucune écriture SQL hébergée, aucun push ni déploiement n’a été exécuté.

## Identité production et répétition réelle — 26 octobre, SHA013a21b

Accès Vercel humain rétabli : projetmon-budget/prj_nDXmq3vVVNRK4ryS2im8Z5R63UdK, dépôtFofanaAmara/mon-budget, main d0980ec Ready, autodeploymain confirmé par l’UI. Domaine canonique `https://www.mesfinances.app` (HEADapex307verswww, www307verslanding). Neon SSO : wispy-breeze-86800451/br-bold-union-aivpl4jf, main explicitementproduction ; endpoint/base/rôle correspondent aux credentials directs existants. Aucun secret affiché ou publié.

Nouvelle archive production-013a21b-preparation.dump, manifeste, préflight et proof privés sous.local/production-release. Runnerdryrun0readonly : phaselegacy,18tables/703lignes,0problèmeattribution. Vraie sauvegarde restaurée dans nouvellecopie58f5aa0e ;6migrations/ready/replay/conservationvérifiés. SHAarchive et liensidentité/SHA concordants, sourcehashbrut gardé. Revue indépendantefinancial_spaces_review favorable,sansfindingnécessaire ; lectureartefacts, pasrerunSQLrevendiqué.

Limite : writersStopped=false, donc préparation de P3 ; sauvegarde finale après gel toujours due. Aucun SQL hébergé muté. ConfigurationVercel Resend/EMAIL_FROM/APP_ORIGIN/transport préparée en fichier privé ; premieruploadrefusé, accordhumainobtenu ensuite mais accèsfichierextensionmanquant. Instructionhumaine suivante : utiliserCLI, pasactiverextension. LoginCLI15264 attendjeton ; whoami sanssession, aucuncontournement. CircuitdéploiementGitHubconservé ; pasdenouveauCLIdeploy.
