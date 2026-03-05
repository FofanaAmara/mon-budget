# CLAUDE.md — Mes Finances

## Workflow

- **Validation obligatoire avec Playwright MCP** : Avant de declarer un travail termine ou valide, toujours tester le resultat en production (ou en local) via Playwright MCP (browser_navigate, browser_snapshot, browser_click, etc.). Ne jamais dire "c'est fini" sans avoir verifie visuellement que tout fonctionne.

- **Delegation UI obligatoire a design-integrator** : Toute implementation d'un nouveau feature qui touche l'interface utilisateur doit suivre ce workflow en deux phases :
  1. **Phase UI** — Deleguer **entierement** la portion visuelle a l'agent `creative-studio-3:design-integrator`. Cet agent est le seul autorise a creer ou modifier des composants, pages et styles UI. Ne jamais ecrire de JSX/CSS/Tailwind directement pour un nouveau feature.
  2. **Phase logique** — Une fois l'UI produite par l'agent, completer la fonctionnalite : brancher les server actions, connecter les donnees, ajouter la logique metier, les appels API, etc.
  Cette separation garantit la coherence visuelle du design system. La regle s'applique aux nouveaux features ; les corrections de bugs mineurs sur du code UI existant n'exigent pas de delegation.

## Test Credentials (Dev Local)

- **Email**: amara.test@monbudget.dev
- **Password**: MonBudget2026!
- **URL**: http://localhost:3000

## Projet

**Mes Finances** — PWA de gestion financiere personnelle (fr-CA).

Stack : Next.js 16 (App Router) + React 19 + Tailwind v4 + Neon PostgreSQL + Neon Auth + Vercel
Architecture : Server Actions (pas d'API REST pour le CRUD), Template vs Transaction pattern

## Conventions (chargees automatiquement via @imports)

@skills/af-conventions/SKILL.md
@skills/af-clean-code/SKILL.md
@skills/af-clean-architecture/SKILL.md

## App Factory — Routing

Voir @skills/af-guide/reference-cards.md pour le mapping complet "je veux X → Y".
Voir @skills/af-guide/reference-catalog.md pour le catalogue agents/skills/commandes.

### SDLC Flow

PM → Builder/Design → Reviewer/Review-design → Builder/Build
→ Reviewer/Review → DevOps/Deploy → PM/Validate → DevOps/Promote

DONE = PM/Validate ACCEPTED + promu en main

### Fast track par niveau

- Niveau 1 (CRUD simple) → Build → Review → Deploy → Validate → Promote
- Niveau 2 (logique metier) → SDLC complet
- Niveau 3 (critique) → SDLC complet + gate migration + security review

## Creative Studio

Voir @skills/cs-guide/reference-cards.md pour les commandes creatives.

- cs-brand/mes-finances/ — Brand identity
- cs-design/mes-finances/ — Design system, mockups

## Structure

| Dossier | Contenu | Git |
|---------|---------|-----|
| `.claude/plans/` | Plans d'implementation, PRDs, specs | ignore |
| `.claude/ralph/` | Prompts Ralph Loop | ignore |
| `.tmp/` | Screenshots, brouillons, fichiers temporaires | ignore |
| `.app-factory/docs/` | Architecture, ADRs, runbooks | track |
| `.app-factory/log/` | Logs par feature/story | track |
| `.app-factory/backlog/` | Epics, features, stories | track |
| `.app-factory/discoveries/` | Discoveries pendant le build | track |
| `.app-factory/state/` | State files pour les commandes implement-* | ignore |
| `cs-brand/mes-finances/` | Brand identity | track |
| `cs-design/mes-finances/` | Design system, mockups | track |

**Regle** : Ne jamais laisser de plans, prompts ralph, screenshots ou fichiers temporaires a la racine. Les ranger dans le dossier appropriate.
