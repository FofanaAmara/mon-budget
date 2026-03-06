# ONBOARD-REFONTE — Refonte de l'onboarding nouvel utilisateur

> Status: PLACEHOLDER — a raffiner avant implementation
> Priority: P2 (apres le guide de configuration)
> Date: 2026-03-06

## Type

IMPROVEMENT

## Contexte

L'onboarding actuel (overlay plein ecran en 3 etapes sur `/`) a ete construit a partir d'une maquette sans reflexion produit approfondie. Il presente plusieurs problemes :

1. **UX non travaillee** — Le flow (revenu -> categories -> objectif) n'a pas ete pense du point de vue utilisateur. Les etapes ne correspondent pas forcement a ce dont l'utilisateur a besoin en premier.
2. **Incoherences techniques** — Multiplicateur biweekly 2.17 au lieu de 26/12 (voir FIX-MIN-007), frequence forcee a MONTHLY (voir FIX-MIN-006).
3. **Detection fragile** — Basee sur localStorage + absence de donnees. Pas de persistence DB.
4. **Relation floue avec le guide de configuration** — Le guide de configuration (feature guide-configuration) prend en charge l'accompagnement post-inscription. L'onboarding doit etre repense pour completer le guide, pas le dupliquer.

## Ce qui doit etre retravaille

- Revoir les etapes : sont-elles les bonnes ? Dans le bon ordre ? Avec la bonne granularite ?
- Revoir le format : overlay plein ecran vs flow dedie (/onboarding) vs autre
- Aligner avec le guide de configuration : l'onboarding configure, le guide accompagne
- Persister l'etat en DB (pas localStorage)
- Corriger les bugs connus (FIX-MIN-006, FIX-MIN-007 — possiblement deja corriges d'ici la)

## Ce que ceci N'EST PAS

- Ce n'est PAS une story prete a implementer — c'est un placeholder pour une future feature/epic de refonte
- La decomposition en stories se fera quand cette refonte sera priorisee
- Les fixes FIX-MIN-006 et FIX-MIN-007 sont des corrections independantes qui n'attendent pas cette refonte

## Dependances

- **A faire APRES** : Guide de configuration (pour savoir comment les deux features s'articulent)
- **Bugs lies** : FIX-MIN-006, FIX-MIN-007 (corrections ponctuelles, pas la refonte)

## Decision

Cree le 2026-03-06 lors de la planification du guide de configuration. L'humain a explicitement demande de ne PAS inclure la refonte de l'onboarding dans le scope du guide — c'est une feature separee a planifier plus tard.
