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
- AC-1 : Les cartes s'affichent avec un design visuel (gradient, chip, derniers chiffres)
- AC-2 : L'apercu live dans la modale reflete les modifications en temps reel
- AC-3 : 8 couleurs disponibles pour le gradient
- AC-4 : La page detail affiche : total mensuel, nombre de prelevements auto, depenses liees
- AC-5 : Les depenses liees sont separees : auto-prelevements vs autres

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
