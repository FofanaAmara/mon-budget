# GUIDE-005 : Améliorer le timing de complétion du guide

## Description

Le guide de configuration manque de feedback visuel lors de la complétion des dernières étapes. L'étape 3 ne se coche pas à l'arrivée sur /depenses, et la celebration apparaît instantanément après l'étape 4 sans laisser le temps de voir la progression.

## Critères d'acceptation

### AC-1 : L'étape 3 se coche automatiquement en visitant /depenses
- Given l'utilisateur a des dépenses récurrentes configurées (step 2 fait)
- When il clique sur l'étape "Consulter les dépenses du mois" et arrive sur /depenses
- Then l'étape 3 est cochée dans le guide (les monthly_expenses existent déjà)
- And la barre du guide reflète la progression mise à jour

### AC-2 : Délai entre step 4 et celebration
- Given l'utilisateur marque une dépense comme payée (step 4)
- When le guide détecte que toutes les étapes sont complètes
- Then le guide affiche d'abord l'étape 4 cochée pendant 15 secondes
- And ENSUITE la vue celebration apparaît avec une transition
- So que l'utilisateur a le temps de réaliser qu'il vient de compléter la dernière étape

## Scope technique

- `components/setup-guide/SetupGuide.tsx` : délai avant celebration (useEffect isCelebration)
- `lib/actions/setup-guide.ts` : vérifier que revalidatePath couvre /depenses après markAsPaid
- Potentiellement `lib/actions/monthly-expenses.ts` : revalidatePath après markAsPaid

## Priorité

P1 — Polish UX important pour le first-run

## Dépendances

- GUIDE-004 (les bugs de base doivent être fixés d'abord)
