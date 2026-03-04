# Feature Brief — Gestion des cartes

## Section A — Fonctionnel

### Titre
Gestion des cartes de paiement

### Objectif utilisateur (Job-to-be-done)
En tant qu'utilisateur, je veux enregistrer mes cartes bancaires pour les associer a mes depenses et voir combien chaque carte me coute par mois.

### Description
Page `/cartes` : liste de cartes bancaires visuelles (style carte de credit avec gradient, nom, derniers 4 chiffres, banque). Page detail `/cartes/[id]` : carte visuelle + stats + liste des depenses liees (auto-prelevements et autres). CRUD carte via bottom sheet.

### Flows cles

1. **Voir ses cartes** : Liste de cartes visuelles avec gradient de couleur.
2. **Creer une carte** : FAB/bouton -> sheet -> nom, 4 derniers chiffres, banque, couleur -> apercu live.
3. **Modifier une carte** : Bouton edit sur la carte -> sheet pre-rempli.
4. **Supprimer une carte** : Bouton delete -> confirmation inline (Oui/Non).
5. **Voir le detail** : Clic sur la carte -> `/cartes/[id]` -> stats + depenses liees.

### Criteres d'acceptation (niveau feature)

**AC-1 : Design visuel des cartes**
- Given des cartes existent
- When l'utilisateur consulte /cartes
- Then chaque carte s'affiche avec un design visuel (gradient de couleur, chip, 4 derniers chiffres, banque)

**AC-2 : Apercu live dans la modale**
- Given l'utilisateur cree/modifie une carte
- When il change les champs (nom, couleur, chiffres)
- Then l'apercu de la carte se met a jour en temps reel

**AC-3 : 8 couleurs de gradient**
- Given l'utilisateur cree/modifie une carte
- When il choisit une couleur
- Then 8 couleurs predefinies sont disponibles

**AC-4 : Page detail carte**
- Given l'utilisateur clique sur une carte
- When la page /cartes/[id] se charge
- Then elle affiche : total mensuel, nombre de prelevements auto, liste des depenses liees

**AC-5 : Separation prelevements auto vs autres**
- Given des depenses sont liees a la carte
- When la page detail est affichee
- Then les depenses sont separees : auto-prelevements vs autres charges

**AC-6 : CRUD complet**
- Given l'utilisateur veut gerer ses cartes
- When il cree/modifie/supprime via bottom sheet
- Then la page se rafraichit

### Stories (squelette)
1. Liste des cartes visuelles
2. Creation carte avec apercu live
3. Modification/suppression carte
4. Page detail carte avec depenses liees

### Dependances
- Depends on : Aucune
- Used by : Charges fixes, Suivi depenses, Gestion dettes (card_id)

---

## Section B — Technique

### Routes
- `/cartes` (page.tsx)
- `/cartes/[id]` (page.tsx)

### Source files
- `app/cartes/page.tsx`, `app/cartes/[id]/page.tsx`
- `components/CartesClient.tsx`
- `components/CarteDetailClient.tsx`

### Server actions
- `lib/actions/cards.ts` : createCard, updateCard, deleteCard, getCards

### Tables DB
- cards, expenses (card_id join)
