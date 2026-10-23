# DISC-ESP-005 — Refus métier affiché en erreur serveur

2026-10-23. Statut : corrigé et vérifié, revue indépendante sans finding actionnable. Travail direct adhoc, aucune commande AF active.

La recette avec un second compte a révélé qu'un accès à un espace étranger est correctement refusé par requireSpace mais remonte comme500. Distinguer l'absence de session par un sous-type compatible, traduire uniquement dans les pages vers connexion/404générique, laisser remonter les pannes du fournisseur/DB/rollout.
Le repli a aussi exposé le script de thème du wrapper Neon. Le fournisseur UI public de base préserve les formulaires et notifications dans la palette claire existante, sans script inutile.
Preuve : private-access-current-execution.md ; tests des vrais helpers/layout, SSR du vrai provider et recette CUA desktop/mobile. Pas de changement de permissions ni de base source.

La revue visuelle a aussi révélé une marge inférieure de68px réservée à une nav inexistante ; padding supprimé pour.space-onboarding. Nouvelle capture exacte375x812 sans bande ni scroll artificiel, finding clôturé par reviewer. La capture338x732 antérieure reste conservée sans être présentée comme375x812.
