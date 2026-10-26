# Livraison production — preuves en cours

26 octobre2026. Contrat `.Codex/goals/espaces-financiers-production.md`, inchangé. **IN_PROGRESS : aucune migration ni publication production exécutée.**

## Préparation vérifiée

- Référence distante observée par `git ls-remote` puis fetch : `d0980ec8a3e0dc2a255bb2a651adf7455c85a286`. Dernier déploiement GitHub Production4012396706 par vercel[bot], statut success, URL `https://mon-budget-5tnj18xy1-amara-fofanas-projects.vercel.app`. Cette observation historique n’établit pas la santé actuelle ni le domaine public principal.
- API GitHub : dépôt accessible, droits admin/push présents ; main non protégé (404 sur le contrôle réel). Activation de la protection refusée par revue automatique faute d’accord sur la configuration exacte ; question précise ouverte. Aucun contournement ni mutation de protection réalisée à ce stade.
- Vercel CLI sans credentials. Connexion navigateur via GitHub explicitement autorisée après rejet initial ; arrivée sur formulaire GitHub sans session ouverte, onglet conservé. Pas de métadonnées Vercel/Neon inventées.
- Candidate Neon de `.env.local` : transaction readonly, PostgreSQL17.11,18tables public, aucun financial_space_rollout. Cela ne prouve pas encore l’association à la production Vercel.
- Récupération Git non destructive :58commits au-dessus de origin/main conservés ; worktree `worktrees/financial-spaces-production` et branche `feature/financial-spaces-production`, même baseb193d48. Les fichiers de reprise transférés ont été comparés par SHA256 ; originaux et recette humaine primaire préservés. Profil durable et checkout primaire retenu explicitement. Le runner local HTTP/Mailpit n’a pas changé.

## Exécuteur et contrôles locaux

Runner de production distinct de migrate.mjs fixture-only : cible directe Neon/base/rôle et TLS vérifiés, profil lié aux projets/branche/SHA, code exécuté comparé aux sources commitées. Dry-run readonly ; apply exige archive restaurée/certifiée, fraîcheur de toutes les colonnes/tables publiques et schéma, pas seulement l’inventaire de conservation historique. Inventaire initial175colonnes exact ; drift refusé.

Advisory lock sans attente indéfinie, verrous avant empreinte, timeouts et transaction atomique001–006.002 une seule fois par transaction. Ledger/phase stricts ; copies exposées et données historiques contrôlées avant premierready. COMMIT_UNKNOWN et échec de rapport après commit imposent réconciliation readonly, jamais restauration aveugle. La sauvegarde réelle et la TOC/extension de sa restauration restent **non exécutées** ; tests synthétiques et lecture de code ne les remplacent pas.

Qualité contre Zod4.6.7 corrigé :19delivery,256unitaires/19fichiers,102servicesPG/6familles,40testsDB (dont11runner), typegen/types/lint/build et audit production0vulnérabilité. Bancs locaux AuthRSC, navigation6, sélection3, invitation7 verts. Logs privés sous `.local/production-release/quality/`. Ces bancs ne sont ni la recette MCP production ni la CI distante.

Audit initial RED : Zod4.5.4, advisory [GHSA-mrhx-c7xc-m3w5](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5), correctif officiel≥4.6.6. Mise à jour ciblée4.6.7 avec override des consommateurs Auth ; aucun npm audit --force ni suppression de gate. Installation propre dans le worktree, dépendances du runtime humain inchangées.

Défauts de préparation reproduits/corrigés : entrée CLI sous chemin lié, refus de symlink cassé, double instance React du banc partagé, phase régressée aprèscutover, couverture de fraîcheur incomplète. RED/GREEN et revue distincte dans le journal, sans changement du périmètre produit.

## État P1–P10

| Critère | État réel |
|---|---|
| P1 cible et ordre | En cours : accès Vercel et identité provider à établir ; règles de bascule préparées, pas exécutées. |
| P2 source/gates | Gates locaux ci-dessus ; revue indépendante de préparation, PR/CI distante encore à obtenir. |
| P3 backup/répétition | Outil préparé ; sauvegarde réelle restaurée et récupération sur copie à démontrer. |
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
