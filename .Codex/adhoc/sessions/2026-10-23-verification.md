# Session — 2026-10-23 — Recette reproductible

**Plan :** `.Codex/plans/espaces-financiers-verification.md`

## Objectif

Rendre les preuves PostgreSQL reproductibles sans sauvegarde privée et préparer le gate CI du feature, sans AWM ni question pendant absence.

## Journal

### Fixture portable

Export du seul schéma historique de la copie locale vérifiée ; 42 lignes fictives couvrant les 18 tables. Base distincte spaces_ci_baseline17 ; aucun reset des copies existantes. Choix strict de template, CI refuse private. Les mêmes 95 tests de services et 21 migrations passent.

### Certificat et revue

Après finding indépendant, ajout d’une empreinte du schéma réel. Cinq tests PG prouvent le refus des contraintes/defaults/enum/index altérés sans réparation. Ancien seed conservé sous archive, nouveau certificat rejoué ; 26 tests migration/certificat verts. Baseline privée703 lignes recontrôlée identique.

### Workflow et répétition propre

Gardes RED observés avant création du workflow puis sept tests verts, dont agrégation de 36 combinaisons et couverture exacte 17 exigences/30 AC. Workflow sans déploiement/secrets, cancel PR seulement, check final always/success. Installation et qualité réexécutées dans une copie durable sans env/backup : 210 unitaires, types/lint/build Webpack verts, audit production zéro. Profil et documentation DevOps publiés et vérifiés. Aucun run GitHub prétendu vert.

### Préparation Resend

GET de métadonnées uniquement : expéditeur vérifié, envoi activé, réception désactivée. Origine publique et boîte de recette explicite absentes. Aucun mail envoyé, aucune valeur de clé ou DNS exposée.

## Résumé

Tranche de préparation vérifiée ; feature globale non livrée. Matrice honnête des lacunes et preuves ajoutée. Restent Auth réel, réception externe, vraie app caches/onglets/offline, Playwright MCP, CI distante, revue globale et réconciliation d’envoi incertain.

## Fichiers modifiés

Workflow GitHub ; schéma/seed/certificat/préparation synthétiques ; choix de template et sept suites PG ; gardes de workflow/matrice et test profil ; scripts package/lock ; README ; profil et documents DevOps générés ; plan, matrice, preuve, mémoire et suivi. Changements humains préexistants exclus du commit.
