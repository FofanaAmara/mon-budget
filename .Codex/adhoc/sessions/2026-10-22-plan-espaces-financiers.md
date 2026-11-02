# Session — 2026-10-22 — Plan du chantier espaces financiers

**Plan :** .Codex/plans/espaces-financiers-implementation.md

## Objectif
Préparer le plan complet demandé avec planning-methodology, depuis design approuvé/backlog jusqu’à conservation/isolation et recette. Pas d’implémentation avant validation humaine du plan.

## Journal

### Contexte factuel
Lecture code, auth,16modules actions/86exports, pages génératrices, guide/settings, SW, scripts et découvertes. Métadonnées réelles PostgreSQL en readOnly :18tables/175colonnes/49index/50contraintes ; aucun accès aux lignes financières. Premier essai réseau sandbox échoué ; lecture autorisée réussie. Pas de clés ni URL DB divulguées. Tests Vitest exécutés :176réussites/177, échec préexistant palette badgeIN_PROGRESS. Constat documenté, pas de correction métier pendant ce mandat de plan.

### Plan et choix proposés
12sections du skill, modèles espaces/appartenances et profils de présentation, contexte URL explicite + contrôle serveur, configuration commune séparée des préférences et consentements, migration expand/backfill/validate/cutover. Rollback distingué avant/après premières écritures partagées ; v1 interdit après ce seuil. Risques spécifiques de générations GET, jonctions, remise à zéro et cache SW pris en compte. Phases0à7 suivent les6stories verticales ; gates conditionnels et17exigences reliées à12critères de succès.

### Relecture
Huit questions planning-methodology satisfaites ; contrôle mécanique des12sections,17exigences dans matrice,12critères,8verdicts et liens locaux. Inventaire corrigé à16modules (18 correspond au nombre de tables, pas de modules). D1–D4 restent des propositions du plan : contexte/préférences, identité/validité, périmètre destructeur/refus et choix de transport. Design déjà approuvé jamais remis en question.

## Résumé
Plan complet prêt pour validation humaine. Pas de migration, développement, service email, push ou déploiement. Aucun test d’isolation réelle revendiqué ; seuls métadonnées et baseline unitaire ont été exécutés. Build/lint globaux non exécutés pour cette planification, prévus en phase0.

## Fichiers créés/modifiés
- .Codex/plans/espaces-financiers-implementation.md
- .Codex/plans/espaces-financiers-evidence/schema-live.json
- .Codex/plans/espaces-financiers-evidence/baseline.md
- .Codex/adhoc/state.md
- Ce journal
