# Audit de Coherence — Resume

> Date: 2026-03-04
> Scope: 18 features, 97 acceptance criteria
> Methode: AC vs source code comparison

---

## Resultats Globaux

| Metrique | Valeur |
|----------|--------|
| Features auditees | 18 |
| COMPLETE | 12 |
| INCOMPLETE | 4 |
| INCOHERENT | 2 |
| Total BLOQUANT | 5 |
| Total MINEUR | 11 |

---

## Verdict par Feature

| Feature | Epic | Verdict | Bloquant | Mineur |
|---------|------|---------|:--------:|:------:|
| Suivi depenses | core-financier | INCOMPLETE | 3 | 1 |
| Tableau de bord | core-financier | INCOHERENT | 2 | 2 |
| Suivi revenus | core-financier | COMPLETE | 0 | 2 |
| Allocation revenus | core-financier | COMPLETE | 0 | 0 |
| Epargne projets | patrimoine | COMPLETE | 0 | 0 |
| Gestion dettes | patrimoine | COMPLETE | 0 | 0 |
| Sante financiere | patrimoine | INCOHERENT | 1 | 1 |
| Charges fixes | configuration | INCOMPLETE | 2 | 0 |
| Revenus recurrents | configuration | COMPLETE | 0 | 1 |
| Gestion cartes | configuration | COMPLETE | 0 | 0 |
| Gestion sections | configuration | COMPLETE | 0 | 1 |
| Parametres | configuration | COMPLETE | 0 | 0 |
| Authentification | onboarding-auth | COMPLETE | 0 | 0 |
| Onboarding | onboarding-auth | COMPLETE | 0 | 2 |
| Landing page | onboarding-auth | COMPLETE | 0 | 0 |
| Data claim | onboarding-auth | COMPLETE | 0 | 0 |
| Push notifications | notifications | INCOMPLETE | 0 | 1 |
| PWA | pwa | COMPLETE | 0 | 1 |

---

## Issues BLOQUANT — Liste de corrections prioritaires

### 1. recurrence_day default a 1 dans ExpenseModal (BLOQUANT)
- **Fichier** : `components/ExpenseModal.tsx:32`
- **Probleme** : `useState(expense?.recurrence_day?.toString() ?? '1')` — toute charge creee sans modifier le jour se retrouve avec due_date = 1er du mois
- **Impact** : Toutes les charges sont marquees "en retard" des le 2e du mois
- **Fix** : Changer le default a `''` (vide), rendre le jour optionnel, et modifier `autoMarkOverdue()` pour ignorer les expenses sans due_date
- **Features impactees** : Suivi depenses (AC-11), Charges fixes (AC-7), Tableau de bord (AC-5 via score), Sante financiere (AC-1)

### 2. Charges YEARLY/QUARTERLY generees chaque mois (BLOQUANT)
- **Fichier** : `lib/actions/monthly-expenses.ts:37-41` (`calcDueDateForMonth`)
- **Probleme** : YEARLY et QUARTERLY traitees comme MONTHLY — instance creee dans CHAQUE mois avec montant mensualise
- **Impact** : Montants et nombre d'instances errones. Ex: taxe annuelle de $3,642 → 12 instances de $303.50 au lieu de 1 instance de $3,642
- **Fix** : Ajouter champ `spread_monthly` au schema DB ; si false, ne generer l'instance que dans le mois de next_due_date
- **Features impactees** : Charges fixes (AC-6), Suivi depenses (montants)

### 3. Dashboard balance utilise actualTotal au lieu d'expectedTotal (BLOQUANT)
- **Fichier** : `components/AccueilClient.tsx:50`
- **Probleme** : `availableAmount = incomeSummary.actualTotal - summary.paid_total` — si aucun revenu n'est marque RECEIVED, balance = -paid_total
- **Impact** : "Budget depasse" affiche en permanence en debut de mois
- **Fix** : Utiliser `expectedTotal` pour le calcul de la balance disponible, ou un blend (expected pour les non-recus + actual pour les recus)
- **Features impactees** : Tableau de bord (AC-1), Sante financiere (AC-1 via score)

### 4. Score sante fausse par bugs amont (BLOQUANT)
- **Fichier** : `components/accueil/TabSanteFinanciere.tsx:227-237`
- **Probleme** : Le score depend de `actualTotal` (souvent 0) et de `overdueBonus` (0 car tout est "en retard")
- **Impact** : Score ≈ 0 en permanence → "Situation critique" meme si tout va bien
- **Fix** : Se resout en fixant les bugs #1 et #3 ci-dessus
- **Features impactees** : Sante financiere (AC-1), Tableau de bord (onglet sante)

### 5. Taux d'epargne utilise totalEpargne / actualTotal (BLOQUANT — reclassifie)
- **Fichier** : `components/accueil/TabSanteFinanciere.tsx:233-234`
- **Probleme** : Le "taux d'epargne" utilise l'epargne TOTALE (all-time) divisee par les revenus RECUS du mois. Ce n'est pas un taux d'epargne mais un ratio sans signification financiere
- **Impact** : La metrique et le score de sante sont fausses. Si totalEpargne = $50,000 et actualTotal = $6,500, le "taux" = 769% (cap a 100). 100 * 0.2 = 20 points dans le score, ce qui fausse le score dans l'autre sens (trop haut)
- **Fix** : Utiliser `contributions_epargne_ce_mois / revenus_recus_ce_mois * 100`

---

## Issues MINEUR — Liste complete

| # | Issue | Fichier | Impact |
|---|-------|---------|--------|
| 1 | Report cree instance sans expense_id | monthly-expenses.ts:302 | Depense reportee traitee comme imprevu |
| 2 | BIWEEKLY sans anchor: montant * 2 | monthly-incomes.ts:30 | Approximation au lieu du vrai calcul |
| 3 | Generation revenus ecrase modifications | monthly-incomes.ts:38-42 | Modification manuelle perdue si status = EXPECTED |
| 4 | Multiplicateur BIWEEKLY incoherent | Plusieurs fichiers | 2.17 vs 26/12 vs reel — 3 valeurs differentes |
| 5 | Pas de cascade protection sections | sections.ts | FK orphelines possibles |
| 6 | Onboarding cree revenu MONTHLY meme si biweekly | onboarding.ts:35-41 | Metadata frequence perdue |
| 7 | Multiplicateur onboarding 2.17 | Onboarding.tsx:61 | Incoherent avec le reste |
| 8 | Pas de cron pour push notifications | api/push/send | Fonctionnalite non automatisee |
| 9 | Cache favicon PWA | sw.js, manifest.json | Ancien favicon affiche |
| 10 | Dashboard couverture utilise actualTotal | TabSanteFinanciere.tsx:228 | Couverture 0% en debut de mois |
| 11 | Dashboard savings rate conceptuellement incorrect | TabSanteFinanciere.tsx:233 | Pas un vrai taux d'epargne |

---

## Chaine de Causalite des Bugs

```
ExpenseModal recurrence_day default '1'
  |
  +--> Toutes les charges ont due_date = 1er du mois
        |
        +--> autoMarkOverdue les marque OVERDUE des le 2e
              |
              +--> Dashboard: alertes "en retard" partout
              +--> Score sante: overdueBonus = 0
              +--> Suivi depenses: tout en OVERDUE

AccueilClient utilise actualTotal (souvent 0)
  |
  +--> Balance = 0 - paid = -X → "Budget depasse"
  +--> Score sante: coverage = 0
  +--> Alertes: "Situation critique"

calcDueDateForMonth ne filtre pas YEARLY/QUARTERLY
  |
  +--> 12 instances au lieu de 1 pour les charges annuelles
  +--> Montants totaux du mois gonfles
```

## Ordre de Correction Recommande

1. **Fix recurrence_day default** (debloque: overdue, score, alertes)
2. **Fix balance actualTotal → expectedTotal** (debloque: dashboard, score)
3. **Fix generation YEARLY/QUARTERLY** (debloque: montants corrects)
4. **Fix taux d'epargne** (corrige: score, metrique)
5. Mineurs par lot (multiplicateur BIWEEKLY, cache PWA, etc.)

---

## Notes

- L'architecture est solide : Server Actions + Template/Transaction pattern est bien implemente
- Les bugs sont concentres dans 3 fichiers : `ExpenseModal.tsx`, `monthly-expenses.ts`, `AccueilClient.tsx`
- Les fixes #1-#3 resolvent 80% des problemes visibles
- Aucun test automatise — recommandation forte d'ajouter des tests pour les calculs financiers
