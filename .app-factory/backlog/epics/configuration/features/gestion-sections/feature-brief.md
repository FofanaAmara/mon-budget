# Feature Brief — Gestion des sections

## Section A — Fonctionnel

### Titre
Gestion des sections (categories de depenses)

### Objectif utilisateur (Job-to-be-done)
En tant qu'utilisateur, je veux organiser mes depenses en categories personnalisees (Logement, Epicerie, Transport...) pour voir ou va mon argent.

### Description
Page `/sections`. CRUD de sections avec nom, emoji/icone, couleur, position. Les sections sont utilisees comme categories pour les depenses, les allocations, et le filtrage.

### Flows cles

1. **Voir ses sections** : Liste des sections avec icone, nom, couleur.
2. **Creer/modifier/supprimer** : CRUD standard.
3. **Reordonner** : Changer la position (si implemente).

### Criteres d'acceptation (niveau feature)

**AC-1 : CRUD fonctionnel**
- Given l'utilisateur veut gerer ses categories
- When il cree/modifie/supprime une section
- Then la page se rafraichit
- **Edge case** : supprimer une section utilisee par des charges/allocations — pas de cascade protection visible

**AC-2 : Proprietes de section**
- Given une section est creee
- Then elle a un nom, une icone (emoji), une couleur
- And elle est referencee par position pour l'ordre d'affichage

**AC-3 : Sections par defaut**
- Given un nouvel utilisateur arrive
- When ensureDefaultSections est appele
- Then des sections par defaut sont creees si l'utilisateur n'en a aucune

### Stories (squelette)
1. Liste des sections
2. CRUD section

### Dependances
- Depends on : Aucune
- Used by : Charges fixes, Suivi depenses (filtre), Allocation revenus, Epargne/Projets, Gestion dettes

---

## Section B — Technique

### Routes
- `/sections` (page.tsx)

### Source files
- `app/sections/page.tsx`
- `components/SectionsClient.tsx` (ou equivalent)

### Server actions
- `lib/actions/sections.ts` : getSections, createSection, updateSection, deleteSection
- `lib/actions/claim.ts` : ensureDefaultSections

### Tables DB
- sections
