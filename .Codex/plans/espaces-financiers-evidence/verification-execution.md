# Recette reproductible — preuve de tranche

Date : 2026-10-23. Plan : `.Codex/plans/espaces-financiers-verification.md`, parent P7.1. Exécution directe, aucun AWM. Le goal global reste en cours.

## Résultat

Schéma historique complet sans aucune ligne utilisateur, owner ou GRANT : 18 tables et 175 colonnes vérifiées. Jeu entièrement fictif : 42 lignes, deux utilisateurs, relations financières, montants 3,99 et 1 450, dette payée ancienne, épargne libre, progressives, configuration, guide, push et onboarding. Les données originales ne sont pas copiées dans cette fixture.

`npm run test:spaces:prepare` ne charge ni `.env.local` ni sauvegarde. Il vérifie le conteneur propriétaire/port/mount/identité PostgreSQL et crée seulement spaces_ci_baseline17. Le certificat comprend checksum des inputs, empreinte des lignes et empreinte du schéma réel : tables, colonnes/types/defaults, contraintes, index, enums, extensions, fonctions et triggers. Le rejeu refuse toute dérive, sans reset ou réparation automatique.

Le choix de template est limité à private/synthetic ; CI exige synthetic. Les mêmes suites clonent ce template dans leurs bases jetables à noms aléatoires, puis suppriment seulement leurs clones. Les tests d’accès, montants, conservation, concurrence et adhésion restent inchangés.

Le workflow préparé valide PR et main, aucun autre push. Permissions contents:read, aucun secret ni déploiement. Deux jobs indépendants, qualité et PostgreSQL ; un résultat final inconditionnel exige explicitement success pour chacun. Pas de path filter : chemin inconnu = gate complet. Seules les PR périmées peuvent s’annuler ; chaque run main garde une identité distincte. Aucun hook ou réglage distant modifié. Profil explicite dans `.app-factory/docs/infra/financial-spaces-validation-profile.json`.

## Vérifications exécutées

| Preuve | Résultat et portée |
|---|---|
| Préparation et rejeu synthetic | 18 tables, 42 lignes ; deuxième exécution created:false |
| Services sur synthetic | 95/95, mêmes six suites de services réels ; Auth/transport simulés |
| Migrations et certificat sur synthetic | 26/26 : 21 migrations existantes, cinq refus de dérive/input |
| Baseline privée | Relecture de son empreinte : 18 tables / 703 lignes identiques à la restauration ; aucune écriture |
| Unitaires | 210/210, dont quatre contrats de sélection du template |
| Gardes CI/matrice | RED observé : quatre échecs ENOENT avant workflow ; final 7/7 verts, dont 36 combinaisons de résultat final |
| Installation indépendante | npm ci réussi dans une copie durable sans .env, session, node_modules initial ou backup |
| Qualité dans copie sans secrets | delivery 7/7, unitaires 210/210, next typegen, types, lint et build Webpack : sorties 0 ; audit production 0 alerte |
| Lint du worktree | Aucun abaissement de règle ; 15 avertissements existants restent suivis |
| Profil et documentation DevOps | check-runtime PASS ; publisher puis --check PASS, trois documents générés |
| Revue indépendante | P2 certificat de schéma corrigé puis fermé ; aucune autre anomalie concrète relevée sur le delta |

La copie de répétition est `.local/financial-spaces/ci-quality-rehearsal/`. Node local est 24.9 ; le workflow prévoit Node 22 sur Ubuntu, pas encore exercé à distance. La répétition locale n’a pas exécuté le banc navigateur : l’autorité du navigateur reste refusée. Ses six preuves antérieures gardent leur portée ; le workflow inclut sa commande et l’installation Chromium pour l’exécution distante future.

Logs privés : synthetic-{prepare,replay}-final.log, synthetic-services.log, synthetic-migrations-final.log ; delivery-{red,green}.log ; ci-quality-{install,delivery,unit,typegen,types,lint,build,audit}.log ; verification-{unit,types,lint}.log. Aucun contenu privé n’est publié par le workflow.

## Découvertes et corrections

Le helper initial de seed supposait created_at sur notification_log, qui utilise sent_at. L’essai a rollback ; sa base vide a été conservée sous spaces_ci_baseline17_failed_seed_20261023. Le seed a été corrigé puis exécuté sur toute la structure réelle.

La revue a révélé qu’une empreinte des lignes seule laisse passer une contrainte/index supprimé. Le premier seed de 42 lignes a été conservé sous spaces_ci_baseline17_before_schema_guard ; aucun ancien certificat n’a été converti silencieusement. La nouvelle fixture a été certifiée avec le schéma, puis rejouée. Les tests altèrent des clones dans une transaction et prouvent refus + absence d’auto-réparation, avant rollback de la seule fixture de test.

## Préparation email observée

Deux GET Resend autorisés et bornés : liste des domaines puis détail du seul domaine correspondant à l’expéditeur configuré. HTTP 200 ; domaine verified, sending enabled, receiving disabled ; DKIM et SPF vérifiés. Aucune clé, adresse, valeur DNS ou contenu de boîte affiché/commité. Rapport privé filtré : `.local/financial-spaces/resend-readiness.json`.

APP_ORIGIN publique et destinataire de recette explicite ne sont pas configurés. La réception désactivée n’offre pas de boîte contrôlée pour le test. EMAIL_TO n’est ni un destinataire autorisé déduit ni utilisé par le transport. Aucun email externe envoyé ; réception réelle, quota/coût et parcours Auth restent à établir.

## Matrice et suite

`acceptance-matrix.md` couvre exactement 17 exigences et 30 AC, correspondance vérifiée par test. Les statuts restent PARTIEL/À PROUVER ; le registre n’est pas une attestation de succès.

Toujours ouverts : Auth réel à deux sessions et nouvel inscrit vérifié, réception externe, caches/offline/multi-onglets de la vraie app, Playwright MCP, run CI du SHA exact, revue globale et réconciliation opérationnelle uncertain. Aucun push, déploiement, changement DNS/webhook, source DB ou nouvel accès navigateur.

Effort initial estimé : 15–25 k jetons ; étendu par le certificat de schéma et la répétition propre. Coût monétaire indisponible, aucun nouveau service payant engagé. Le runtime local3002 a été conservé, sans build concurrent dans le worktree.

Nettoyage final : le contrôle après staging a signalé un blanc de fin du SQL exporté. La séquence shell avait néanmoins poursuivi au commit ; défaut corrigé avant livraison et commit rectifié. Le checksum des inputs ayant changé, l’ancienne fixture certifiée a été vérifiée puis conservée sous spaces_ci_baseline17_before_format_cleanup ; nouvelle préparation/rejeu et26 tests réexécutés. Aucune réparation silencieuse de certificat.
