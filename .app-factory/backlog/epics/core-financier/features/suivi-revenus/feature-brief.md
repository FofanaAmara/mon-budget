# Feature Brief — Suivi des revenus

## Section A — Fonctionnel

### Titre
Suivi mensuel des revenus et allocations

### Objectif utilisateur (Job-to-be-done)
En tant qu'utilisateur, je veux suivre mes revenus recus et attendus chaque mois, marquer les montants recus, voir comment mon revenu est alloue par enveloppe, et comparer les depenses reelles aux allocations.

### Description
Page `/revenus` avec deux onglets : "Revenus" (suivi des instances de revenus du mois) et "Allocation" (enveloppes mensuelles). Monument central recu/attendu. Pour les revenus fixes : marquer comme recu avec le montant reel. Pour les revenus variables : saisir manuellement le montant recu. Onglet allocation : voir la repartition du revenu par enveloppe, comparer prevision vs reel par section.

### Flows cles

1. **Voir ses revenus du mois** : Monument recu/attendu, liste des sources avec statut (Attendu/Recu).
2. **Marquer un revenu fixe comme recu** : Clic sur l'instance -> saisir montant reel -> marque RECEIVED.
3. **Saisir un revenu variable** : Clic sur la source variable -> saisir montant -> cree/met a jour l'instance du mois.
4. **Ajouter un revenu ponctuel** : FAB -> modal AdhocIncomeModal.
5. **Consulter les allocations** : Onglet "Allocation" -> voir les enveloppes avec montant alloue vs depense reel par section.
6. **Modifier une allocation mensuelle** : Clic sur une enveloppe -> modifier le montant pour ce mois uniquement.
7. **Ajouter une allocation ponctuelle** : FAB -> modal AdhocAllocationModal.

### Criteres d'acceptation (niveau feature)
- AC-1 : Le monument affiche recu/attendu avec barre de progression
- AC-2 : Les revenus fixes affichent le montant attendu et permettent de marquer comme recu
- AC-3 : Les revenus variables affichent "A saisir" et permettent la saisie manuelle
- AC-4 : L'onglet allocation affiche les enveloppes avec prevision, depenses reelles par section, et ecart
- AC-5 : Les allocations mensuelles sont modifiables pour le mois courant
- AC-6 : Le FAB permet d'ajouter un revenu ponctuel ou une allocation ponctuelle selon l'onglet actif

### Stories (squelette)
1. Monument revenus recu/attendu
2. Liste des revenus fixes avec marquage
3. Saisie des revenus variables
4. Ajout revenu ponctuel
5. Onglet allocations avec comparaison prevision/reel
6. Modification allocation mensuelle
7. Ajout allocation ponctuelle

### Dependances
- Depends on : Revenus recurrents (templates), Allocation du revenu (templates), Gestion sections
- Used by : Tableau de bord (consomme les donnees)

---

## Section B — Technique

### Routes
- `/revenus` (page.tsx) — Server component

### Source files
- `app/revenus/page.tsx` — Server component
- `components/RevenusTrackingClient.tsx` — Client principal (~600+ lignes)
- `components/IncomeTrackingRow.tsx` — Lignes individuelles
- `components/AdhocIncomeModal.tsx` — Modal revenu ponctuel
- `components/AdhocAllocationModal.tsx` — Modal allocation ponctuelle

### Server actions
- `lib/actions/monthly-incomes.ts` : markIncomeReceived, markIncomeAsExpected, markVariableIncomeReceived, deleteMonthlyIncome, updateMonthlyIncomeAmount
- `lib/actions/allocations.ts` : updateMonthlyAllocation, createAdhocMonthlyAllocation, getMonthlyAllocations, generateMonthlyAllocations

### Tables DB
- monthly_incomes, incomes, monthly_allocations, income_allocations, allocation_sections, sections, expenses (pour projets epargne)

### Notes techniques
- L'onglet initial peut etre specifie via `initialTab` prop (ou query param `?tab=allocation`).
- Les allocations sont groupees par type : Charges (section_ids), Epargne (project_id), Autre (libre).
- Les depenses reelles par section sont calculees depuis monthly_expenses du mois courant.
