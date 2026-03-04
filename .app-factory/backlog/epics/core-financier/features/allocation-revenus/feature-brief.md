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
- AC-1 : Le sommaire affiche revenu mensuel, total alloue, disponible (et alerte si surallocation)
- AC-2 : Les enveloppes sont groupees : Charges (liees a sections), Epargne (liees a projet), Autre (libre)
- AC-3 : Chaque enveloppe peut etre liee a 0-N sections via junction table
- AC-4 : Chaque enveloppe peut etre liee a un projet d'epargne (progress bar affichee)
- AC-5 : Les enveloppes temporelles (end_month) expirent automatiquement
- AC-6 : La generation mensuelle skip les allocations expirees et les projets ayant atteint leur objectif

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
