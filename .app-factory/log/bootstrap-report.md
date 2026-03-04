# Bootstrap Report — Mes Finances

Date: 2026-03-04
Mode: full (scan + discovery + vision + AC + audit + backlog + validate)

## Summary

| Metrique | Valeur |
|----------|--------|
| Features identifiees | 18 |
| Features planned (vision) | 0 |
| Stories FIX creees | 14 (BLOQUANT: 5, MINEUR: 9) |
| Stories NEW creees | 0 |
| Epics | 6 |
| Routes scannees | 18 pages + 3 API |
| Composants scannes | 42 |
| Server Actions scannes | 12 fichiers |
| Audit verdict | 12 COMPLETE, 4 INCOMPLETE, 2 INCOHERENT |
| Backlog verdict | READY |

## Feature Dashboard

| Feature | Epic | Audit | FIX BLQ | FIX MIN | Status |
|---------|------|-------|:-------:|:-------:|--------|
| Suivi depenses | core-financier | INCOMPLETE | 2 | 1 | a corriger |
| Tableau de bord | core-financier | INCOHERENT | 1 | 0 | a corriger |
| Suivi revenus | core-financier | COMPLETE | 0 | 3 | mineurs |
| Allocation revenus | core-financier | COMPLETE | 0 | 0 | ok |
| Epargne projets | patrimoine | COMPLETE | 0 | 0 | ok |
| Gestion dettes | patrimoine | COMPLETE | 0 | 0 | ok |
| Sante financiere | patrimoine | INCOHERENT | 2 | 0 | a corriger |
| Charges fixes | configuration | INCOMPLETE | 1 | 0 | a corriger |
| Revenus recurrents | configuration | COMPLETE | 0 | 0 | ok |
| Gestion cartes | configuration | COMPLETE | 0 | 0 | ok |
| Gestion sections | configuration | COMPLETE | 0 | 1 | mineur |
| Parametres | configuration | COMPLETE | 0 | 0 | ok |
| Authentification | onboarding-auth | COMPLETE | 0 | 0 | ok |
| Onboarding | onboarding-auth | COMPLETE | 0 | 2 | mineurs |
| Landing page | onboarding-auth | COMPLETE | 0 | 0 | ok |
| Data claim | onboarding-auth | COMPLETE | 0 | 0 | ok |
| Push notifications | notifications | INCOMPLETE | 0 | 1 | mineur |
| PWA | pwa | COMPLETE | 0 | 1 | mineur |

## Ordre de priorite

### Wave 1 — Fondation (fixes les plus impactants)
| Story | Titre | Size |
|-------|-------|------|
| FIX-MIN-004 | Biweekly multiplier inconsistent (2.17 vs 26/12) | S |
| FIX-BLQ-001 | Recurrence day defaults to '1' | S |
| FIX-BLQ-002 | Yearly/quarterly generated every month | M |
| FIX-BLQ-003 | Dashboard balance uses actualTotal | XS |

### Wave 2 — Dashboard & sante
| Story | Titre | Size |
|-------|-------|------|
| FIX-BLQ-004 | Health score corrupted | S |
| FIX-BLQ-005 | Savings rate formula wrong | S |

### Wave 3 — Mineurs independants
| Story | Titre | Size |
|-------|-------|------|
| FIX-MIN-001 | Deferred expense loses expense_id | XS |
| FIX-MIN-002 | Biweekly income uses amount*2 | XS |
| FIX-MIN-003 | Income generation overwrites manual changes | S |
| FIX-MIN-005 | No cascade protection on section delete | S |
| FIX-MIN-006 | Onboarding creates MONTHLY even if biweekly | XS |
| FIX-MIN-007 | Onboarding multiplier 2.17 | XS |

### Wave 4 — Infra
| Story | Titre | Size |
|-------|-------|------|
| FIX-MIN-008 | No cron for push notifications | S |
| FIX-MIN-009 | Favicon cache PWA | XS |

## Chaine de causalite

```
ExpenseModal recurrence_day='1' (BLQ-001)
  └─> Toutes charges → due_date=1er → OVERDUE des le 2e
       ├─> Dashboard: alertes "en retard" partout
       ├─> Score sante: overdueBonus=0 (BLQ-004)
       └─> Suivi depenses: tout en OVERDUE

AccueilClient actualTotal=0 (BLQ-003)
  ├─> Balance = 0-paid = negatif → "Budget depasse"
  ├─> Score sante: coverage=0% (BLQ-004)
  └─> Alertes: "Situation critique"

calcDueDateForMonth YEARLY/QUARTERLY (BLQ-002)
  └─> 12 instances au lieu de 1 → montants gonfles

TabSanteFinanciere savings rate (BLQ-005)
  └─> all-time savings / monthly income = ratio absurde
```

**Fixes #1-#3 resolvent ~80% des problemes visibles.**

## Effort estime

| Wave | Stories | Effort |
|------|---------|--------|
| Wave 1 | 4 | 6-12h |
| Wave 2 | 2 | 4-8h |
| Wave 3 | 6 | 6-12h |
| Wave 4 | 2 | 2-4h |
| **Total** | **14** | **18-36h** |

## Validation

Backlog valide READY :
- 14/14 stories passent INVEST
- 0 dependances circulaires
- 100% couverture audit (5 BLQ + 11 MIN → 14 stories avec 2 merges)
- Priorite coherente (BLQ avant MIN)

## Prochaines etapes

1. Implementer Wave 1 : `/af-implement-story FIX-BLQ-001`
2. Ou implementer par epic : `/af-implement-epic core-financier`
3. Trier les discoveries : `/af-triage`
