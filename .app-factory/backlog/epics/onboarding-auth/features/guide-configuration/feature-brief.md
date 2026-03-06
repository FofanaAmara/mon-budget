# Feature Brief — Guide de configuration

> Status: DRAFT
> Epic: onboarding-auth
> Priority: P1
> Date: 2026-03-06

---

## Section A — Fonctionnel

### Titre

Guide de configuration pour nouveaux utilisateurs

### Objectif utilisateur (Job-to-be-done)

En tant que nouvel utilisateur, je veux savoir quelles actions effectuer pour que mon budget soit fonctionnel, afin de ne pas me retrouver devant une app vide sans savoir par ou commencer.

### Probleme

Apres l'inscription (et l'onboarding actuel, qui est minimal), l'utilisateur arrive sur un tableau de bord vide. Il ne sait pas quelles etapes effectuer pour que l'app commence a lui etre utile. Resultat : abandon ou configuration incomplete.

### Proposition de valeur

Un guide persistant style "checklist Stripe" qui accompagne l'utilisateur a travers les 4 actions necessaires pour avoir un budget fonctionnel. Le guide detecte automatiquement quand chaque etape est accomplie — pas de bouton manuel. Une fois toutes les etapes completees, le guide disparait avec une celebration.

### Description

Le guide se presente sous forme de checklist persistante visible sur toutes les pages de l'app.

**Mobile (experience principale, l'app est mobile-first PWA) :**
- Barre fixe en bas de l'ecran, au-dessus de la navigation
- Mode reduit par defaut : affiche "Etape suivante : [action]" + bouton fleche pour expand
- Mode expand : overlay/bottom sheet montrant toutes les etapes avec leur statut (fait/a faire)

**Desktop :**
- Widget similaire ou section integree (a definir en design)

**Etapes de la checklist (dans l'ordre) :**

| # | Etape | Detection automatique | Ou l'utilisateur fait l'action |
|---|-------|-----------------------|-------------------------------|
| 1 | Ajouter au moins un revenu recurrent | >= 1 ligne dans la table `incomes` pour l'utilisateur | /parametres/revenus |
| 2 | Ajouter au moins une charge fixe | >= 1 ligne dans la table `expenses` (template) pour l'utilisateur | /parametres/depenses |
| 3 | Generer le mois courant | >= 1 ligne dans `monthly_expenses` pour le mois courant | /depenses (bouton "Generer") |
| 4 | Marquer au moins une depense payee | >= 1 `monthly_expenses` avec `is_paid = true` pour le mois courant | /depenses (toggle paye) |

**Persistance :** L'etat du guide (etapes completees, guide masque) est stocke en DB — pas en localStorage. Cela permet a l'utilisateur de retrouver son etat sur n'importe quel appareil.

**Cycle de vie :**
- Le guide s'affiche apres l'onboarding actuel (ou des la premiere connexion si l'onboarding est skip)
- Chaque etape se coche automatiquement quand la condition de detection est remplie
- Quand toutes les 4 etapes sont completees : celebration (confetti ou message de felicitation) + le guide disparait
- L'utilisateur peut revoir/relancer le guide depuis les parametres

### Flows cles

1. **Premiere connexion** : L'utilisateur se connecte pour la premiere fois (ou apres l'onboarding). Le guide apparait en barre fixe en bas. La barre affiche "Etape suivante : Ajouter un revenu recurrent" avec un bouton fleche.
2. **Navigation guidee** : L'utilisateur tape sur la barre. Le bottom sheet s'ouvre et montre les 4 etapes. L'etape 1 est mise en avant. L'utilisateur peut taper sur une etape pour etre redirige vers la page correspondante.
3. **Completion d'etape** : L'utilisateur ajoute un revenu recurrent sur /parametres/revenus. Quand il revient ou quand la page se rafraichit, l'etape 1 se coche automatiquement. La barre affiche maintenant "Etape suivante : Ajouter une charge fixe".
4. **Completion totale** : L'utilisateur complete la 4e etape. Animation de celebration (confetti ou message). Le guide disparait apres quelques secondes.
5. **Rejouabilite** : L'utilisateur va dans /parametres. Il voit une option "Revoir le guide de configuration". Clic → le guide reapparait avec l'etat actuel des etapes.

### Criteres d'acceptation (niveau feature)

**AC-1 : Affichage initial du guide**
- Given un utilisateur connecte qui n'a pas complete le guide
- When il arrive sur n'importe quelle page de l'app
- Then la barre du guide est visible en bas de l'ecran (mobile) ou en widget (desktop)
- And elle affiche "Etape suivante : [premiere etape non completee]"

**AC-2 : Expansion de la checklist**
- Given la barre du guide est affichee en mode reduit
- When l'utilisateur tape sur la barre ou le bouton fleche
- Then un bottom sheet (mobile) ou un panneau (desktop) s'ouvre
- And il montre les 4 etapes avec leur statut (coche ou non)
- And l'etape suivante est mise en evidence

**AC-3 : Detection automatique — Revenu recurrent**
- Given l'etape "Ajouter un revenu recurrent" n'est pas cochee
- When l'utilisateur cree un revenu recurrent (sur /parametres/revenus)
- Then l'etape se coche automatiquement sans action manuelle
- And la barre met a jour "Etape suivante" vers l'etape 2

**AC-4 : Detection automatique — Charge fixe**
- Given l'etape "Ajouter une charge fixe" n'est pas cochee
- When l'utilisateur cree une charge fixe (sur /parametres/depenses)
- Then l'etape se coche automatiquement

**AC-5 : Detection automatique — Generation du mois**
- Given l'etape "Generer le mois courant" n'est pas cochee
- When l'utilisateur genere le mois courant (sur /depenses)
- Then l'etape se coche automatiquement

**AC-6 : Detection automatique — Marquer une depense payee**
- Given l'etape "Marquer une depense payee" n'est pas cochee
- When l'utilisateur marque au moins une depense comme payee
- Then l'etape se coche automatiquement

**AC-7 : Celebration et disparition**
- Given les 4 etapes sont completees
- When la derniere etape vient d'etre cochee
- Then une animation de celebration s'affiche (confetti ou message)
- And le guide disparait apres l'animation
- And le guide ne reapparait plus en navigation normale

**AC-8 : Persistance multi-appareil**
- Given l'utilisateur a complete 2 etapes sur son telephone
- When il se connecte sur un autre appareil
- Then le guide affiche le meme etat (2 etapes cochees)

**AC-9 : Rejouabilite depuis les parametres**
- Given l'utilisateur a complete le guide (ou veut le revoir)
- When il va dans /parametres et clique "Revoir le guide"
- Then le guide reapparait avec l'etat actuel des etapes
- And les etapes deja remplies (donnees existantes) sont cochees

**AC-10 : Relation avec l'onboarding existant**
- Given l'utilisateur vient de terminer l'onboarding (ou l'a skip)
- When il arrive sur la page d'accueil
- Then le guide s'affiche (pas l'onboarding une seconde fois)
- And si l'onboarding a cree un revenu, l'etape 1 est deja cochee

### Edge cases

- **Utilisateur qui supprime ses donnees** : Si l'utilisateur supprime son seul revenu recurrent apres l'avoir ajoute, l'etape 1 devrait se decocher (la detection est basee sur l'etat reel des donnees, pas sur un flag historique).
- **Onboarding a deja cree des donnees** : Si l'onboarding a cree un revenu et des sections, les etapes correspondantes sont deja cochees au premier affichage du guide.
- **Utilisateur existant avec donnees** : Si un utilisateur existant (avant le guide) se connecte, le guide ne devrait PAS s'afficher — il a deja configure son budget. La detection doit verifier si l'utilisateur est "nouveau" (aucune des 4 conditions remplie + guide jamais complete).
- **Navigation pendant le guide** : Le guide reste visible sur toutes les pages. Il ne bloque pas la navigation. L'utilisateur peut l'ignorer et faire ce qu'il veut.
- **Pas de connexion internet au moment de la detection** : La detection se fait cote serveur (requete DB). Si l'app est offline, le guide n'est pas affiche (pas de cache local de l'etat du guide).

### Exclusions explicites

| Exclu | Raison |
|-------|--------|
| Refonte de l'onboarding existant | Feature separee (voir ONBOARD-REFONTE). Le guide se greffe SUR l'onboarding actuel, ne le remplace pas. |
| Tour guide de l'app (tooltips, slideshow) | Feature future. Le guide de configuration couvre le "quoi faire", pas le "comment naviguer". |
| Tutoriels video ou aide contextuelle | Hors scope MVP. Le guide est une checklist, pas un tutoriel. |
| Detection en temps reel (WebSocket) | La detection se fait au chargement de page ou apres une server action. Pas de push temps reel. |
| Personnalisation des etapes | Les 4 etapes sont fixes pour tous les utilisateurs. Pas de configuration par role ou preference. |

### Dependances

- **Depend de** : Authentification (utilisateur connecte), Onboarding (doit se montrer apres)
- **Utilise par** : Tableau de bord (le guide est visible par-dessus), Parametres (option "Revoir le guide")
- **Interagit avec** : Revenus recurrents (etape 1), Charges fixes (etape 2), Suivi depenses (etapes 3 et 4)

---

## Section B — Technique (considerations, pas prescriptions)

### Approche DB envisagee

Une table `setup_guide` (ou similaire) par utilisateur pour stocker l'etat du guide :
- `user_id` (PK ou FK)
- `completed_at` (nullable — null = guide actif, timestamp = guide complete)
- `dismissed_at` (nullable — si on veut permettre de masquer sans completer)
- `reset_at` (nullable — dernier reset depuis les parametres)

**Alternative consideree et ecartee** : Stocker chaque etape en DB (step_1_completed, step_2_completed...). Ecarte parce que la detection est basee sur l'etat reel des donnees (count de incomes, expenses, etc.), pas sur des flags. La table guide stocke seulement l'etat du guide lui-meme (complete oui/non, masque oui/non), pas l'etat des etapes.

### Composants envisages

- Composant barre fixe en bas (mobile) — au-dessus de la bottom nav
- Composant bottom sheet / overlay pour la vue expanded
- Server action ou query pour calculer l'etat des 4 etapes (4 COUNT queries)
- Hook ou context pour partager l'etat du guide entre les pages

### Patterns a considerer

- Le calcul de l'etat des etapes peut etre fait en une seule requete SQL (4 EXISTS en un seul appel) pour eviter le N+1
- Le refresh de l'etat peut se faire apres chaque server action qui touche les tables concernees (revalidatePath ou revalidateTag)
- L'animation confetti peut etre une librairie legere (canvas-confetti ~3KB) ou un composant CSS pur

### Risques identifies

| Risque | Impact | Mitigation |
|--------|--------|------------|
| Performance — 4 queries a chaque page load | Moyen | Une seule requete SQL avec 4 EXISTS. Cache avec revalidation ciblee. |
| Z-index conflicts avec la bottom nav existante | Faible | Le design devra gerer le stacking avec la nav. |
| Confusion guide vs onboarding | Moyen | Le guide ne se montre QU'APRES l'onboarding. Jamais en meme temps. |
