# Baseline d’exécution — 2026-10-23

Plan : .Codex/plans/espaces-financiers-implementation.md. Travail direct, aucun AWM.

## Vérifications exécutées

- Vitest : 5 fichiers, 177 tests réussis. Échec historique du badge IN_PROGRESS corrigé d’après la palette sémantique déjà appliquée.
- TypeScript noEmit : code 0 ; doublon amount dans le stub supprimé.
- ESLint : 0 erreur, 17 avertissements préexistants. Exclusion des productions générées et maquettes ; code applicatif toujours analysé.
- Build Next : code 0, sortie isolée .next-spaces-build. tsconfig.json et next-env.d.ts sauvegardés en mémoire/restaurés exactement après génération. Journal privé .tmp/espaces-financiers-build.log.
- Scripts : node --check et git diff --check réussis.
- Contrôle visuel complémentaire CUA : quatre diapositives du carrousel réel sur localhost:3001/preview-onboarding, transitions et viewport entier observés sans défaut identifié. Ce contrôle ne remplace PAS la validation Playwright MCP exigée pour la livraison.

## Copie et restauration réelles

Source lue par pg_dump natif 17.11 ; métadonnées extensions lues dans une transaction READ ONLY. Aucune mutation de la source exécutée. Aucun identifiant de connexion transmis à Docker.

- Archive SHA256 : 948c9e307ec9a38ed055d9c3b5f0fdc9c7a21c06b1ecabfce8629333faf474d5.
- Deux bases locales distinctes : spaces_baseline17 / spaces_work17.
- 18 tables, 175 colonnes, 49 index, 50 contraintes ; 703 lignes dont les empreintes complètes correspondent entre les restaurations.
- verify puis restore rejoués : succès ; bases peuplées conservées.
- La vérification sans sauvegarde/manifeste a échoué explicitement ; comparaison vide/vide interdite.
- Propriétés du conteneur et identifiant système PostgreSQL vérifiés avant écritures locales.
- Préflight local agrégé : aucune ligne avec user_id NULL, vide, unclaimed ou default dans les 17 tables ayant cette colonne. Relations entre propriétaires à vérifier dans la migration.
- Archives, détails de lignes/empreintes et diagnostics privés sous .local, ignorés par Git.

Le conflit Homebrew global a été laissé intact. Après choix humain, client officiel extrait/relocalisé uniquement dans le projet, SHA vérifié. L’extension uuid-ossp 1.1 a été reproduite ; PostgreSQL normalise certaines représentations CHECK à la restauration. Leur équivalence est comparée après reparsage des règles attendues sur des tables TEMP, pas par suppression de contraintes ou relâchement de leur contenu.

## Inventaire et regard indépendant

Inventaire AST action-inventory.json : 16 modules / 86 exports — 78 financiers, 2 individuels, 4 mixtes, 2 legacy. Quatre accès SQL hors actions concernent push_subscriptions : restent individuels/génériques ; les liens de rappel devront résoudre un espace autorisé. Limite explicite : appels et références statiques, chaînes de helpers à revoir pendant conversion ; cet inventaire ne prouve pas l’isolation implémentée.

Reviewer indépendant spaces_risk_review : fausse preuve vide/vide, identité serveur insuffisante et reprise interrompue trouvées, corrigées puis relues sans nouveau blocage. Correctif StrictMode du timer du guide relu. Suggestion de nettoyer les variables PG* héritées également appliquée.

## Restant

Feature non livrée. Modèle/migration, garde d’appartenance, conversion des actions/routes/caches, écrans validés, transport/invitations/retour auth, E2E à plusieurs sessions, réception Resend, CI et Playwright MCP restent à réaliser. Aucun push, aucune migration de la source, aucun email envoyé. .serena/project.yml et next-env.d.ts préexistants exclus du commit.
