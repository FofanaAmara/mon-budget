# Feature Brief — Allocation du revenu

## Section A — Fonctionnel

### Titre
Allocation du revenu (enveloppes budgetaires)

### Objectif utilisateur (Job-to-be-done)
En tant qu'utilisateur, je veux repartir mon revenu mensuel en enveloppes (charges, epargne, libre) pour savoir exactement combien allouer a chaque poste de depense.

### Description
Page `/parametres/allocation` pour gerer les enveloppes de repartition du revenu. Chaque enveloppe a un label, un montant, une couleur, et peut etre liee a des sections (pour comparer aux depenses reelles) ou a un projet d'epargne (pour suivre la progression). Sommaire : revenu mensuel / total alloue / disponible. Groupement par type (Charges, Epargne, Autre). Reordonnancement par fleches.

### Flows cles

1. **Voir ses enveloppes** : Page affiche le sommaire + liste groupee des enveloppes.
2. **Creer une enveloppe** : Bouton "Ajouter" -> modal AllocationModal -> label, montant, sections liees ou projet, couleur.
3. **Modifier une enveloppe** : Clic edit -> modal pre-rempli -> modifier.
4. **Supprimer une enveloppe** : Clic delete -> confirmation -> soft delete (is_active=false).
5. **Reordonner** : Fleches haut/bas pour changer la position.

### Criteres d'acceptation (niveau feature)

**AC-1 : Sommaire revenu/alloue/disponible**
- Given des allocations existent
- When l'utilisateur consulte /parametres/allocation
- Then le sommaire affiche : revenu mensuel attendu, total alloue, disponible (revenu - alloue)
- And si surallocation (disponible < 0) → alerte visuelle

**AC-2 : Groupement par type**
- Given des allocations de differents types existent
- When la liste est affichee
- Then les enveloppes sont groupees : Charges (liees a sections), Epargne (liees a projet), Autre (libre)

**AC-3 : Liaison sections (junction table)**
- Given une enveloppe est liee a des sections
- When elle est creee/modifiee
- Then la table allocation_sections est mise a jour
- And 0 a N sections peuvent etre liees

**AC-4 : Liaison projet epargne**
- Given une enveloppe est liee a un projet d'epargne
- When elle est affichee
- Then une barre de progression saved_amount/target_amount est affichee

**AC-5 : Allocations temporelles**
- Given une allocation a un end_month
- When le mois courant depasse end_month
- Then l'allocation n'est plus generee dans les mois futurs

**AC-6 : Generation mensuelle intelligente**
- Given generateMonthlyAllocations est appele
- When des allocations existent
- Then une instance monthly_allocation est creee par allocation active
- And les allocations expirees (month > end_month) sont skipees
- And les allocations liees a un projet ayant atteint l'objectif sont skipees
- And la generation est idempotente (ON CONFLICT DO NOTHING)

**AC-7 : CRUD complet**
- Given l'utilisateur veut gerer ses enveloppes
- When il cree/modifie/supprime via AllocationModal
- Then la page se rafraichit
- And la suppression est un soft-delete (is_active=false)
- And le reordonnancement par fleches met a jour les positions

### Stories (squelette)
1. Sommaire revenu/alloue/disponible
2. CRUD enveloppes
3. Liaison sections (junction table)
4. Liaison projet epargne (progress)
5. Reordonnancement
6. Allocations temporelles

### Dependances
- Depends on : Revenus recurrents (pour le revenu mensuel attendu), Gestion sections, Epargne/Projets
- Used by : Suivi revenus (onglet allocation)

---

## Section B — Technique

### Routes
- `/parametres/allocation` (page.tsx) — Server component

### Source files
- `app/parametres/allocation/page.tsx`
- `components/AllocationsManager.tsx`
- `components/AllocationModal.tsx`

### Server actions
- `lib/actions/allocations.ts` : getAllocations, createAllocation, updateAllocation, deleteAllocation, reorderAllocations, generateMonthlyAllocations, getMonthlyAllocations

### Tables DB
- income_allocations (templates), allocation_sections (junction), monthly_allocations (instances mensuelles), expenses (projets epargne)

### Algorithmes cles
- **Generation mensuelle** : idempotente, skip si end_month < month ou si projet atteint objectif.
- **Junction table** : allocation_sections lie N allocations a M sections.
