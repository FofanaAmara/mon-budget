# ONBOARD-003 — Ajout de l'etape categories au guide de configuration

> Status: READY
> Priority: P1
> Tags: [frontend, backend, data]
> Dependencies: ONBOARD-001 (le carousel doit presenter les categories comme concept avant que le guide les demande)
> Estimation: 3 pts

## User Story

En tant que nouvel utilisateur, je veux que le guide de configuration m'invite a creer mes categories de depenses, afin d'organiser mes charges fixes avant de generer mon premier mois.

## Contexte

Le guide de configuration actuel a 4 etapes :
1. Ajouter un revenu recurrent
2. Ajouter une charge fixe
3. Generer le mois courant
4. Marquer une depense payee

Cette story ajoute une nouvelle etape 2 ("Creer tes categories de depenses") et decale les etapes suivantes :
1. Ajouter un revenu recurrent
2. **Creer tes categories de depenses** (NOUVEAU)
3. Ajouter une charge fixe
4. Generer le mois courant
5. Marquer une depense payee

La logique est que les categories (sections) organisent les charges fixes — il est plus naturel de creer les categories AVANT d'ajouter des charges fixes.

## Criteres d'acceptation

### AC-1 : Nouvelle etape "Creer tes categories" dans le guide

- Given le guide de configuration est affiche (barre ou bottom sheet)
- When l'utilisateur voit la liste des etapes
- Then l'etape 2 est "Creer tes categories de depenses" (ou formulation equivalente)
- And la description mentionne l'organisation des depenses par categorie
- And l'etape redirige vers la page de gestion des sections (/sections)

### AC-2 : Detection automatique de la completion

- Given l'etape "Creer tes categories" n'est pas cochee
- When l'utilisateur cree au moins une section (categorie) personnalisee
- Then l'etape se coche automatiquement
- And la barre du guide met a jour "Etape suivante" vers l'etape 3

### AC-3 : Ordre des 5 etapes

- Given le guide de configuration est affiche
- When l'utilisateur voit toutes les etapes
- Then l'ordre est : (1) Revenu, (2) Categories, (3) Charge fixe, (4) Generer le mois, (5) Marquer payee
- And la numerotation et la progression visuelle refletent les 5 etapes

### AC-4 : Progression et celebration avec 5 etapes

- Given le guide a maintenant 5 etapes au lieu de 4
- When l'utilisateur complete les 5 etapes
- Then la celebration se declenche (comme avant, mais apres 5 etapes au lieu de 4)
- And la barre de progression (anneau ou barre) reflete la progression sur 5

### AC-5 : Retrocompatibilite pour les utilisateurs en cours de guide

- Given un utilisateur a deja complete 2 etapes sur l'ancien guide a 4 etapes (revenu + charge fixe)
- When le nouveau guide a 5 etapes est deploye
- Then ses etapes deja completees restent cochees
- And la nouvelle etape "Categories" est evaluee dynamiquement (cochee si l'utilisateur a deja des sections)
- And le guide ne se reinitialise pas

## Edge cases

- **Sections par defaut** : L'app cree des sections par defaut pour les nouveaux utilisateurs (via ensureDefaultSections). Est-ce que la presence de sections par defaut doit cocher l'etape ? NON — l'etape vise les sections CREEES PAR L'UTILISATEUR. La detection doit distinguer les sections par defaut des sections personnalisees, OU considerer que toute section presente suffit. Decision a prendre par le Builder en design.
- **Utilisateur qui supprime toutes ses sections** : L'etape se decoche (la detection est basee sur l'etat reel des donnees, coherent avec le comportement des autres etapes du guide).
- **Guide deja complete (5/4 etapes)** : Si un utilisateur avait complete les 4 anciennes etapes et que le guide etait ferme, il ne doit PAS reapparaitre pour la 5e etape. Le guide est "complete" = ferme definitivement. La nouvelle etape ne concerne que les utilisateurs qui n'ont pas encore complete le guide.

## Scenarios e2e

### Scenario 1 — Nouveau parcours complet avec 5 etapes

1. Un nouvel utilisateur termine le carousel (ONBOARD-001)
2. Le guide s'affiche avec "Etape suivante : Ajouter un revenu recurrent"
3. Il ajoute un revenu — etape 1 cochee, guide affiche "Etape suivante : Creer tes categories"
4. Il va sur /sections et cree une categorie "Logement" — etape 2 cochee
5. Il ajoute une charge fixe "Loyer" dans la categorie "Logement" — etape 3 cochee
6. Il genere le mois — etape 4 cochee
7. Il marque le loyer comme paye — etape 5 cochee
8. Celebration, guide disparait

### Scenario 2 — Utilisateur en cours de guide (migration 4 -> 5 etapes)

1. Un utilisateur avait complete les etapes 1 et 2 (revenu + charge fixe) de l'ancien guide
2. Le deploiement met en place le guide a 5 etapes
3. L'utilisateur voit le guide avec : etape 1 cochee (revenu), etape 2 non cochee (categories — a evaluer), etape 3 cochee (charge fixe), etape 4 non cochee (generer), etape 5 non cochee (payer)
4. Si l'utilisateur a deja des sections, l'etape 2 est cochee automatiquement

## Notes pour le Builder

- Cette story modifie le code du guide de configuration EXISTANT (feature guide-configuration) mais vit dans le scope de la refonte onboarding car c'est une consequence directe de la nouvelle vision
- Fichiers principaux a modifier :
  - `lib/actions/setup-guide.ts` — ajouter la detection de sections dans la query SQL (EXISTS sur la table sections)
  - `components/setup-guide/SetupGuide.tsx` — ajouter l'entree dans STEPS_CONFIG, modifier GuideStepCompletion
  - Le type `GuideStepCompletion` passe de 4 a 5 booleens
- La detection "a des sections" doit etre ajoutee dans la requete SQL de `getOrInitSetupGuideData()` (un EXISTS supplementaire)
- La question des "sections par defaut" vs "sections personnalisees" est un choix d'implementation — le PM accepte les deux approches tant que le comportement est coherent et documente
