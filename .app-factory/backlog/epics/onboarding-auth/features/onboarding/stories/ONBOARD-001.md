# ONBOARD-001 — Carousel educatif pour les nouveaux utilisateurs

> Status: READY
> Priority: P1
> Tags: [frontend, backend, data]
> Dependencies: aucune
> Estimation: 5 pts

## User Story

En tant que nouvel utilisateur, je veux voir un carousel qui m'explique ce que l'app peut faire pour moi, afin de comprendre les fonctionnalites avant de commencer a configurer mon budget.

## Criteres d'acceptation

### AC-1 : Affichage du carousel pour un nouvel utilisateur

- Given un utilisateur connecte qui n'a jamais complete ni skip l'onboarding
- When il arrive sur la page d'accueil
- Then un carousel plein ecran s'affiche avec 4 slides
- And le dashboard n'est pas visible derriere le carousel

### AC-2 : Contenu des slides

- Given le carousel est affiche
- When l'utilisateur navigue entre les slides
- Then le slide 1 affiche un message de bienvenue ("Prends le controle de tes finances" ou equivalent)
- And le slide 2 presente le suivi des depenses (revenus, charges recurrentes avec frequences, generation automatique du mois, depenses imprevues)
- And le slide 3 presente le patrimoine (projets d'epargne avec objectif/progression, epargne libre, dettes avec paiements automatiques)
- And le slide 4 affiche un CTA "C'est parti !" qui mene au dashboard

### AC-3 : Navigation entre les slides

- Given le carousel est affiche
- When l'utilisateur swipe horizontalement (mobile) ou clique sur les fleches/boutons de navigation
- Then il navigue entre les slides dans l'ordre
- And un indicateur visuel montre la position courante (dots, barre de progression, ou equivalent)
- And il peut revenir en arriere sur les slides precedents

### AC-4 : Passer le carousel

- Given le carousel est affiche sur n'importe quel slide
- When l'utilisateur clique sur "Passer"
- Then le carousel se ferme
- And l'utilisateur arrive sur le dashboard
- And l'onboarding est marque comme vu en DB (il ne reapparaitra plus)

### AC-5 : Completion du carousel via CTA

- Given l'utilisateur est sur le slide 4
- When il clique sur "C'est parti !"
- Then le carousel se ferme
- And l'utilisateur arrive sur le dashboard
- And l'onboarding est marque comme vu en DB

### AC-6 : Persistance DB de l'etat

- Given l'utilisateur a complete ou skip le carousel
- When il se reconnecte (meme appareil ou autre appareil)
- Then le carousel ne s'affiche plus
- And la detection est basee sur la DB, pas sur localStorage

### AC-7 : Aucune saisie de donnees

- Given le carousel est affiche
- When l'utilisateur parcourt tous les slides
- Then aucun formulaire, champ de saisie, ou selection de donnees n'est present
- And aucune donnee n'est creee en DB (hormis le flag "onboarding vu")

## Edge cases

- **Utilisateur existant (avant la refonte)** : Un utilisateur qui a deja des donnees et/ou l'ancien flag localStorage ne doit PAS voir le carousel. La migration doit considerer les utilisateurs existants comme "onboarding deja vu".
- **Utilisateur qui ferme l'onglet pendant le carousel** : Au retour, le carousel reapparait (pas encore marque comme vu en DB). C'est le comportement attendu — seul "Passer" ou "C'est parti !" marquent comme vu.
- **Ecran tres petit (mobile 320px)** : Le contenu des slides doit etre lisible et les boutons accessibles sans scroll horizontal.
- **Pas de connexion internet apres le premier chargement** : Si le carousel est affiche et que l'utilisateur clique "C'est parti !" sans reseau, l'action de marquage en DB echoue. L'utilisateur arrive sur le dashboard mais le carousel pourrait reapparaitre a la prochaine connexion. Acceptable pour MVP.

## Scenarios e2e

### Scenario 1 — Parcours complet du carousel

1. L'utilisateur s'inscrit et se connecte pour la premiere fois
2. Le carousel s'affiche en plein ecran
3. Il lit le slide 1 (bienvenue), swipe vers le slide 2 (depenses)
4. Il swipe vers le slide 3 (patrimoine), puis vers le slide 4 (CTA)
5. Il clique "C'est parti !"
6. Le carousel disparait, le dashboard s'affiche
7. Il se deconnecte et se reconnecte — le carousel ne reapparait pas

### Scenario 2 — Skip immediat

1. L'utilisateur se connecte pour la premiere fois
2. Le carousel s'affiche, slide 1 visible
3. Il clique "Passer" immediatement
4. Le dashboard s'affiche
5. Le carousel ne reapparait jamais

## Notes pour le Builder

- La table/colonne DB pour tracker "onboarding vu" est creee dans cette story (R1 — entites on-demand)
- Le contenu des slides est statique (pas de donnees dynamiques) — texte + illustrations/icones
- Le composant carousel est nouveau — pas de modification de l'ancien Onboarding.tsx (ca c'est ONBOARD-002)
- L'ancien onboarding reste en place pendant cette story (coexistence temporaire)
