# Feature Brief — Onboarding (Refonte)

> Status: READY
> Epic: onboarding-auth
> Priority: P1
> Date: 2026-03-06
> Replaces: ancien onboarding (overlay 3 etapes revenu/categories/objectif)

---

## Section A — Fonctionnel

### Titre

Onboarding educatif pour nouveaux utilisateurs

### Objectif utilisateur (Job-to-be-done)

En tant que nouvel utilisateur, je veux comprendre ce que l'app peut faire pour moi avant de commencer a l'utiliser, afin d'arriver sur le tableau de bord avec une vision claire de l'outil et un guide pour me lancer.

### Probleme

L'onboarding actuel (overlay plein ecran en 3 etapes) souffre de plusieurs problemes :
1. **Saisie prematuree** — L'utilisateur doit entrer des donnees (revenu, categories, objectif) avant de comprendre l'app. Le guide de configuration fait deja ce travail.
2. **Detection fragile** — Basee sur localStorage + absence de donnees. Pas de persistence DB.
3. **Objectif inutile** — L'etape "choisir un objectif" n'a jamais ete fonctionnellement exploitee.
4. **Duplication avec le guide** — L'onboarding fait de la configuration, le guide fait de la configuration. Roles confus.

### Proposition de valeur

Un carousel educatif (ZERO saisie de donnees) qui presente les capacites de l'app en 4 slides. L'utilisateur comprend ce qu'il peut faire, puis arrive sur le tableau de bord ou le guide de configuration prend le relais pour l'accompagner dans la configuration reelle.

**Separation claire des roles :**
- Onboarding = COMPRENDRE (educatif, lecture seule)
- Guide de configuration = FAIRE (actions concretes, saisie de donnees)

### Description

**Carousel educatif en 4 slides :**

| # | Slide | Contenu |
|---|-------|---------|
| 1 | Bienvenue | "Prends le controle de tes finances." Message d'accueil, ton chaleureux. |
| 2 | Suivi des depenses | Revenus (sources avec frequence), charges recurrentes (mensuelles, trimestrielles, annuelles), generation automatique des depenses du mois, ajout de depenses imprevues. |
| 3 | Patrimoine | Projets d'epargne (objectif + progression), epargne libre, suivi des dettes avec paiements automatiques. |
| 4 | C'est parti ! | CTA principal vers le tableau de bord. Le guide de configuration prend le relais. |

**Detection par DB** — L'etat "onboarding vu" est persiste en base de donnees (pas localStorage). Cela garantit la coherence multi-appareils.

**Aucune saisie de donnees** — Le carousel est purement educatif. Pas de formulaire, pas de creation de donnees. Le CTA final redirige vers le dashboard ou le guide de configuration accompagne l'utilisateur.

### Flows cles

1. **Premiere connexion** : L'utilisateur se connecte pour la premiere fois. Le carousel s'affiche en plein ecran. Il swipe ou clique pour naviguer entre les 4 slides. Au slide 4, il clique "C'est parti !" et arrive sur le dashboard avec le guide de configuration actif.
2. **Navigation libre** : L'utilisateur peut passer le carousel a tout moment (bouton "Passer" visible sur chaque slide). Il arrive directement sur le dashboard.
3. **Pas de retour** : Le carousel ne se reaffiche plus apres completion ou skip. Il n'y a pas d'option "revoir l'onboarding" (le contenu est statique et educatif, pas utile a revoir).

### Criteres d'acceptation (niveau feature)

**AC-F1 : Carousel educatif sans saisie**
- Given un nouvel utilisateur qui n'a jamais vu l'onboarding
- When il se connecte pour la premiere fois
- Then un carousel plein ecran s'affiche avec 4 slides educatives
- And aucun formulaire ou champ de saisie n'est present

**AC-F2 : Detection par DB**
- Given l'onboarding a ete complete ou skip
- When l'utilisateur se reconnecte (meme appareil ou autre)
- Then l'onboarding ne reapparait plus
- And la detection ne depend pas de localStorage

**AC-F3 : Transition vers le guide**
- Given l'utilisateur termine le carousel (CTA "C'est parti !")
- When il arrive sur le dashboard
- Then le guide de configuration est visible et l'accompagne pour les prochaines etapes

**AC-F4 : Nettoyage de l'ancien code**
- Given la refonte est deployee
- When on inspecte le code
- Then l'ancien composant Onboarding.tsx et ses actions sont supprimes
- And la detection localStorage est supprimee
- And aucune regression n'est introduite sur les fonctionnalites existantes

### Exclusions explicites

| Exclu | Raison |
|-------|--------|
| Saisie de donnees dans l'onboarding | Le guide de configuration couvre ce besoin. Pas de duplication. |
| "Explorer avec donnees de test" dans l'onboarding | Reste accessible dans /parametres pour usage dev. Pas dans le flow utilisateur. |
| Etape "Choisir un objectif" | Jamais exploitee fonctionnellement. Supprimee. |
| Video educative | Notee pour la landing page future. Pas dans l'onboarding in-app. |
| Option "Revoir l'onboarding" | Contenu statique educatif, pas utile a revoir. Le guide est rejouable, pas l'onboarding. |
| Modification du guide de configuration existant (4 etapes) | Traitee dans ONBOARD-003 comme story specifique pour l'ajout de l'etape categories. |

### Dependances

- **Depend de** : Authentification (utilisateur connecte), Guide de configuration (doit exister pour le relais)
- **Utilise par** : Tableau de bord (affichage conditionnel), Guide de configuration (prend le relais apres)

### Stories

| ID | Titre | Tags | Dep. |
|----|-------|------|------|
| ONBOARD-001 | Carousel educatif pour les nouveaux utilisateurs | [frontend, backend, data] | - |
| ONBOARD-002 | Detection DB et nettoyage de l'ancien onboarding | [backend, data, frontend] | ONBOARD-001 |
| ONBOARD-003 | Ajout de l'etape categories au guide de configuration | [frontend, backend, data] | ONBOARD-001 |

---

## Section B — Technique (considerations, pas prescriptions)

### Fichiers a creer

- Nouveau composant carousel (slides educatives, navigation, CTA)
- Migration DB pour la table/colonne de tracking "onboarding vu"

### Fichiers a modifier

- `app/layout.tsx` ou logique de routing — condition d'affichage du carousel
- `lib/actions/setup-guide.ts` — ajout de la detection de l'etape "categories" (ONBOARD-003)
- `components/setup-guide/SetupGuide.tsx` — ajout de l'etape "categories" dans STEPS_CONFIG (ONBOARD-003)

### Fichiers a supprimer (ONBOARD-002)

- `components/Onboarding.tsx` — ancien composant overlay 3 etapes
- `lib/actions/onboarding.ts` — ancienne action completeOnboarding
- `lib/actions/demo-data.ts` — si exclusivement liee a l'onboarding (a verifier)
- References localStorage `mes-finances-onboarding-done`

### Changements DB

- **Table ou colonne** pour tracker "onboarding vu" par utilisateur (timestamp nullable)
- **Modification de la query setup-guide** pour detecter l'existence de sections/categories (ONBOARD-003)
- Operations : ADD COLUMN ou CREATE TABLE (SAFE), pas de migration destructive

### Risques identifies

| Risque | Impact | Mitigation |
|--------|--------|------------|
| Ancien code onboarding reference ailleurs | Moyen | ONBOARD-002 inclut un nettoyage exhaustif de toutes les references |
| Guide de configuration deja en place avec 4 etapes | Faible | ONBOARD-003 ajoute l'etape 2 et decale les suivantes, verification de non-regression |
| localStorage residuel chez les utilisateurs existants | Faible | Le nettoyage de localStorage peut etre fait cote client au premier chargement |
