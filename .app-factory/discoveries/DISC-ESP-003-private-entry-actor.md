# DISC-ESP-003 — Acteur des saisies hors layout financier

2026-10-23. Statut : corrigé, preuve navigateur ouverte. Source : revue indépendante P1 au HEADde4115e.

L’onboarding, le choix des espaces et les invitations privées étaient hors garde de session. Un ancien formulaire pouvait créer pour le nouveau compte connecté car son acteur n’était pas comparé à Auth. Correction : garde des entrées privées, acteur attendu obligatoire en création/invitation, arrêt des continuations démontées. Aucun changement de droits entre membres.

Preuve : .Codex/plans/espaces-financiers-evidence/private-entry-session-execution.md ;226unit/97PG et revue lecture seule. Recette réelle interonglets/MCP encore requise. Suivi direct adhoc, aucune commande AF active.
