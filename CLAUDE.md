# CLAUDE.md — Mes Finances

## Workflow

- **Validation obligatoire avec Playwright MCP** : Avant de declarer un travail termine ou valide, toujours tester le resultat en production (ou en local) via Playwright MCP (browser_navigate, browser_snapshot, browser_click, etc.). Ne jamais dire "c'est fini" sans avoir verifie visuellement que tout fonctionne.

- **Delégation UI obligatoire à design-integrator** : Toute implémentation d'un nouveau feature qui touche l'interface utilisateur doit suivre ce workflow en deux phases :
  1. **Phase UI** — Déléguer **entièrement** la portion visuelle à l'agent `creative-studio-3:design-integrator`. Cet agent est le seul autorisé à créer ou modifier des composants, pages et styles UI. Ne jamais écrire de JSX/CSS/Tailwind directement pour un nouveau feature.
  2. **Phase logique** — Une fois l'UI produite par l'agent, compléter la fonctionnalité : brancher les server actions, connecter les données, ajouter la logique métier, les appels API, etc.
  Cette séparation garantit la cohérence visuelle du design system. La règle s'applique aux nouveaux features ; les corrections de bugs mineurs sur du code UI existant n'exigent pas de délégation.

## Test Credentials (Dev Local)

- **Email**: amara.test@monbudget.dev
- **Password**: MonBudget2026!
- **URL**: http://localhost:3000
