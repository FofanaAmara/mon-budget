# Feature Brief — Revenus recurrents

## Section A — Fonctionnel

### Titre
Gestion des sources de revenus recurrents

### Objectif utilisateur (Job-to-be-done)
En tant qu'utilisateur, je veux configurer mes sources de revenus (emploi, business, investissement) une seule fois, pour que mes revenus attendus apparaissent automatiquement chaque mois.

### Description
Page `/parametres/revenus`. Gestion des templates de revenus. Chaque source a : nom, type de source (Emploi/Business/Investissement/Autre), montant, frequence (Mensuel/Bi-hebdo/Annuel/Variable), date d'ancrage paie, auto-depot. Affichage en cartes avec montant mensualise, prochaine date de depot, badges (auto-depot, variable).

### Flows cles

1. **Voir ses sources de revenus** : Liste de cartes, chacune avec icone source, nom, frequence, montant mensualise, prochaine date.
2. **Ajouter une source** : Bouton/FAB -> IncomeModal -> nom, source, montant, frequence, date d'ancrage, auto-depot.
3. **Modifier une source** : Menu 3 points -> Modifier -> modal pre-rempli.
4. **Supprimer une source** : Menu 3 points -> Supprimer -> confirm() natif.

### Criteres d'acceptation (niveau feature)
- AC-1 : Les sources affichent le montant mensualise (BIWEEKLY * 2.17, YEARLY / 12)
- AC-2 : Les sources BIWEEKLY avec date d'ancrage calculent les prochaines dates de paie
- AC-3 : Les sources VARIABLE affichent un montant estime et le badge "Variable"
- AC-4 : Les sources avec auto_deposit affichent le badge "Depot auto"
- AC-5 : CRUD fonctionnel

### Stories (squelette)
1. Liste des sources avec metriques
2. Creation source (modale)
3. Modification source
4. Suppression source

### Dependances
- Depends on : Aucune
- Used by : Suivi revenus (generation mensuelle), Allocation revenus (revenu mensuel attendu), Tableau de bord

---

## Section B — Technique

### Routes
- `/parametres/revenus` (page.tsx)

### Source files
- `app/parametres/revenus/page.tsx`
- `components/IncomeTemplateManager.tsx`
- `components/IncomeModal.tsx`

### Server actions
- `lib/actions/incomes.ts` : createIncome, updateIncome, deleteIncome, getIncomes, getMonthlyIncomeTotal

### Tables DB
- incomes

### Algorithmes cles
- **Mensualisation** : calcMonthlyIncome() dans lib/utils.
- **Prochaine date biweekly** : getNextBiweeklyPayDate() — ajoute 14 jours depuis l'ancrage jusqu'a depasser today.
- **countBiweeklyPayDatesInMonth** : compte les dates de paie biweekly dans un mois donne (2 ou 3 selon le mois).
