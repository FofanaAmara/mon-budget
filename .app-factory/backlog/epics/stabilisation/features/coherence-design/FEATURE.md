# Feature — Coherence Design

## Epic
stabilisation

## Description
Feature transversale regroupant les corrections d'incoherences visuelles inter-pages identifiees lors de l'audit design du 2026-03-07 (18 screenshots, 9 pages x 2 viewports). L'app a un socle visuel coherent (hero header, couleur teal/emerald, cards arrondies) mais plusieurs ecarts de patterns se sont accumules au fil des features.

Les ecarts sont regroupes en **6 stories par pattern visuel** a uniformiser. Chaque story produit un resultat visible et testable par l'utilisateur : "toutes les pages se ressemblent davantage".

**Contrainte #1 : Zero regression fonctionnelle.** Chaque story ne touche que le frontend (composants, styles). Le build doit passer. Les fonctionnalites existantes doivent continuer de fonctionner.

**Contrainte #2 : Scope frontend uniquement.** Aucune story ne touche la DB, les server actions ou la logique metier.

## Contexte
- Audit design realise le 2026-03-07 via Playwright (9 pages x desktop + mobile)
- 10 ecarts identifies (E1 a E10), regroupes en 6 stories
- La feature fiabilite-calculs est DONE, audit-remediation est A FAIRE
- Le projet est en alpha, usage personnel — pragmatisme > perfection
- Rapport complet : `.tmp/audit-design/AUDIT-REPORT.md`

## Stories

### Bloc 1 — Haute priorite (incoherences flagrantes)

| ID | Titre | Taille | Type | Deps | Ecarts adresses |
|----|-------|--------|------|------|-----------------|
| DESIGN-001 | Uniformiser les boutons d'ajout et le FAB mobile sur toutes les pages | M | FIX | Aucune | E1, E4 |
| DESIGN-002 | Harmoniser le style des cards de la page Patrimoine | S | REFACTOR | Aucune | E2 |

### Bloc 2 — Moyenne priorite (incoherences notables)

| ID | Titre | Taille | Type | Deps | Ecarts adresses |
|----|-------|--------|------|------|-----------------|
| DESIGN-003 | Uniformiser les headers de section sur toutes les pages | S | FIX | Aucune | E3 |
| DESIGN-004 | Standardiser le format des montants dans toute l'app | S | REFACTOR | Aucune | E6 |
| DESIGN-005 | Ajouter les breadcrumbs manquants sur Sections et Cartes | XS | FIX | Aucune | E8 |

### Bloc 3 — Basse priorite (polish)

| ID | Titre | Taille | Type | Deps | Ecarts adresses |
|----|-------|--------|------|------|-----------------|
| DESIGN-006 | Uniformiser les badges de statut sur toutes les pages | S | REFACTOR | Aucune | E7 |

## Taille totale
- 1 XS
- 3 S
- 1 M
- **6 stories total**

## Dependances critiques
Aucune dependance entre stories. Toutes peuvent etre implementees en parallele.

Dependances externes : aucune. Toutes les stories sont purement frontend.

## Criteres de succes (feature level)
1. Le build passe apres chaque story
2. Sur desktop : chaque page utilise un bouton `+ Label` filled teal pour l'ajout (plus de boutons outlined ni de FAB desktop)
3. Sur mobile : chaque page avec action d'ajout utilise le FAB rond teal (plus de pills fixes)
4. La page Patrimoine utilise le meme style de cards que le reste de l'app
5. Les headers de section suivent un pattern uniforme (couleur, format, compteur)
6. Les montants suivent une seule convention de formatage dans toute l'app
7. Les sous-pages de Reglages ont toutes un breadcrumb
8. Les badges de statut ont un systeme visuel unifie

## Exclusions
- E5 (icones d'action) — necessite des decisions UX sur le pattern d'interaction (menu contextuel vs icones en ligne vs tap). A traiter comme une feature UX distincte, pas un fix de coherence.
- E9 (hero header) — deja coherent, pas d'action requise.
- E10 (spacing/padding) — ecarts mineurs, a corriger opportunistement dans les stories touchant les pages concernees.
