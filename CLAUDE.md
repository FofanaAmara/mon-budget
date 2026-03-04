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

## Projet

**Mes Finances** — PWA de gestion financiere personnelle (fr-CA).

Stack : Next.js 16 (App Router) + React 19 + Tailwind v4 + Neon PostgreSQL + Neon Auth + Vercel
Architecture : Server Actions (pas d'API REST pour le CRUD), Template vs Transaction pattern

## Plugins actifs

### App Factory (af-*) — Engineering & Product

**Agents :**

| Agent | Quand l'utiliser |
|-------|-----------------|
| `af-product-analyst` | Reverse-engineer l'app ou un site externe, produire un feature map, auditer la coherence |
| `af-pm` | Ecrire des stories, decomposer en epics/features, valider, trier les discoveries |
| `af-builder` | Designer l'architecture, implementer, refactorer |
| `af-reviewer` | Review code, review design, audit complet, debug |
| `af-devops` | Deploy, promote, rollback, setup CI, audit dependances |
| `af-guide` | Repondre aux questions, conseil strategique, onboarding |

**Commandes :**

| Commande | Quand |
|----------|-------|
| `/af-help` | Questions, conseil strategique, onboarding |
| `/af-bootstrap-backlog` | Construire un backlog depuis le code existant |
| `/af-implement-epic` | Implementer un epic complet |
| `/af-implement-feature` | Implementer une feature complete |
| `/af-implement-story` | Implementer une story |
| `/af-init` | Bootstrapper la structure documentaire |
| `/af-review` | Code review |
| `/af-audit` | Audit complet |
| `/af-deploy` | Deployer en staging |
| `/af-triage` | Trier les discoveries |

### Creative Studio (cs-*) — Design & Brand

**Agents :**

| Agent | Quand l'utiliser |
|-------|-----------------|
| `@brander` | Creer ou inspecter une identite de marque |
| `@designer` | Creer des mockups, design system, experience design |
| `@design-integrator` | Integrer les designs dans le code |
| `@product-analyst` | Reverse-engineer features (CS version) |
| `@creative-guide` | Questions sur le workflow creatif |

**Commandes :**

| Commande | Quand |
|----------|-------|
| `/cs-create-brand` | Creer l'identite de marque |
| `/cs-create-design` | Creer le design system |
| `/cs-design-experience` | Designer l'UX d'une feature |
| `/cs-integrate-design` | Integrer dans le code |
| `/cs-redesign-experience` | Redesign complet |
| `/cs-reverse-engineer` | Extraire brand + design + features |
| `/cs-help` | Guide interactif |

## Routing automatique

### Ecriture de code

Avant d'ecrire du code, charge les skills pertinents :
- Toujours : af-clean-code, af-clean-architecture, af-conventions
- Si API : af-api-design
- Si DB/schema : af-data-modeling
- Si frontend : af-frontend-clean-code, af-accessibility
- Si tests : af-testing-strategy
- Si security : af-security
- Si perf : af-performance

### Travail produit

- "Qu'est-ce qui existe ?" → /af-bootstrap-backlog ou af-product-analyst
- "Cree des stories" → af-pm mode Story
- "Decompose cet epic" → af-pm mode Decompose
- "Backlog pret ?" → af-pm mode Validate-Backlog
- "Trie les discoveries" → af-pm mode Triage

### Implementation

- "Implemente [story]" → /af-implement-story
- "Implemente [feature]" → /af-implement-feature
- "Review le code" → /af-review
- "Deploy" → /af-deploy

### Travail creatif

- "Cree le branding" → /cs-create-brand
- "Design l'UX de [feature]" → /cs-design-experience
- "Integre le design" → /cs-integrate-design

## SDLC Flow

PM → Builder/Design → Reviewer/Review-design → Builder/Build
→ Reviewer/Review → DevOps/Deploy → PM/Validate → DevOps/Promote

DONE = PM/Validate ACCEPTED + promu en main

### Fast track par niveau

- Niveau 1 (CRUD simple) → Build → Review → Deploy → Validate → Promote
- Niveau 2 (logique metier) → SDLC complet
- Niveau 3 (critique) → SDLC complet + gate migration + security review

## Conventions

### Zero Silent Workaround

Quand tu rencontres un probleme :
1. DIAGNOSTIQUE la cause racine
2. FIXE la cause racine
3. Si hors scope ou trop risque → DIS-MOI le vrai probleme, propose le fix ET le workaround, je decide

JAMAIS de workaround silencieux.

### Scope Creep Protocol

Demande hors scope → Acknowledge → Log discovery → Evaluer si blocker → Stay on track

### Resolution de conflits

Priorite : Securite > Integrite donnees > Architecture > Performance > Clean code

### Organisation des fichiers

| Dossier | Contenu | Git |
|---------|---------|-----|
| `.claude/plans/` | Plans d'implementation, PRDs, specs | ignore |
| `.claude/ralph/` | Prompts Ralph Loop | ignore |
| `.tmp/` | Screenshots, brouillons, fichiers temporaires | ignore |
| `docs_permanente/` | Architecture, ADRs, runbooks | track |
| `implementation_log/` | Logs par feature/story | track |
| `backlog/` | Epics, features, stories | track |
| `implementation_discoveries/` | Discoveries pendant le build | track |
| `.app-factory-state/` | State files pour les commandes implement-* | ignore |
| `cs-brand/mes-finances/` | Brand identity | track |
| `cs-design/mes-finances/` | Design system, mockups | track |

**Regle** : Ne jamais laisser de plans, prompts ralph, screenshots ou fichiers temporaires a la racine. Les ranger dans le dossier appropriate.
