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

**AC-1 : Monument recu/attendu**
- Given des revenus existent pour le mois
- When l'utilisateur consulte /revenus
- Then le monument affiche recu/attendu avec barre de progression
- And si recu >= attendu → badge vert "Complet"
- And si surplus → montant du surplus affiche

**AC-2 : Revenus fixes — marquer comme recu**
- Given un revenu fixe est en statut EXPECTED
- When l'utilisateur le marque comme recu avec un montant reel
- Then le statut passe a RECEIVED, actual_amount = montant saisi, received_at = today
- And le monument et les totaux se mettent a jour

**AC-3 : Revenus variables — saisie manuelle**
- Given un revenu de type VARIABLE n'a pas encore d'instance monthly_income ce mois
- When l'utilisateur saisit le montant recu
- Then une instance monthly_income est creee avec status=RECEIVED
- And expected_amount = actual_amount = montant saisi

**AC-4 : Onglet allocation — comparaison prevision/reel**
- Given des allocations et des depenses existent pour le mois
- When l'onglet "Allocation" est actif
- Then chaque enveloppe affiche : label, montant alloue, depenses reelles par section liee, ecart
- And le sommaire affiche : revenu attendu, total alloue, disponible (attendu - alloue)
- And si surallocation (disponible < 0) → alerte visuelle

**AC-5 : Modification allocation mensuelle**
- Given une allocation mensuelle existe
- When l'utilisateur modifie le montant
- Then seule l'instance monthly_allocation est modifiee (template inchange)

**AC-6 : FAB contextuel**
- Given le mois est le mois courant
- When l'onglet "Revenus" est actif et l'utilisateur clique le FAB
- Then la modale AdhocIncomeModal s'ouvre
- When l'onglet "Allocation" est actif et l'utilisateur clique le FAB
- Then la modale AdhocAllocationModal s'ouvre

**AC-7 : Generation automatique des revenus**
- Given des sources de revenus fixes existent
- When le mois est visite pour la premiere fois
- Then des instances monthly_income sont generees pour chaque source active
- And les montants BIWEEKLY tiennent compte du nombre de paies dans le mois (2 ou 3)
- And les sources VARIABLE ne sont PAS auto-generees

**AC-8 : Auto-mark received (auto-deposit)**
- Given des revenus sont marques auto_deposit
- When la page se charge pour le mois courant
- Then ces revenus sont automatiquement marques RECEIVED avec actual_amount = expected_amount

**AC-9 : Etat vide**
- Given aucun revenu n'existe pour le mois
- When l'utilisateur consulte la page
- Then le monument affiche 0/0 et un message d'encouragement

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
