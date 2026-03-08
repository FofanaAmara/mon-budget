# GUIDE-004 : Corriger les bugs et labels du guide de configuration

## Description

Plusieurs bugs et incohérences de labels empêchent le guide de configuration de fonctionner correctement pour un nouvel utilisateur.

## Critères d'acceptation

### AC-1 : L'étape 1 envoie vers la bonne page
- Given le guide est ouvert
- When l'utilisateur clique sur l'étape "Ajouter un revenu récurrent"
- Then il est redirigé vers `/parametres/revenus` (et non `/revenus`)

### AC-2 : Le FAB reste visible au-dessus du guide (mobile + desktop)
- Given le guide est affiché (barre collapsed) sur /revenus ou /depenses
- When l'utilisateur regarde la page
- Then le bouton FAB "+" est entièrement visible et cliquable au-dessus de la barre du guide
- And sur desktop, le FAB ne chevauche pas le widget du guide

### AC-3 : Labels cohérents sur /parametres/revenus
- Given l'utilisateur est sur /parametres/revenus
- When il voit le bouton d'ajout et le titre de la modale
- Then le label affiche "Ajouter un revenu récurrent" (et non "Ajouter une source")

### AC-4 : Labels cohérents sur /parametres/charges
- Given l'utilisateur est sur /parametres/charges
- When il voit le bouton d'ajout et le titre de la modale
- Then le label affiche "Ajouter une dépense récurrente" (et non "Ajouter une charge")

### AC-5 : Le label "Gabarit" est remplacé
- Given l'utilisateur est sur une page qui affiche "Gabarit"
- When il lit le label
- Then il voit "Modèle récurrent" ou un label plus explicite

### AC-6 : Le guide se dismiss automatiquement après complétion
- Given toutes les étapes sont complétées et la celebration a été affichée
- When l'utilisateur navigue vers une autre page (sans cliquer le CTA)
- Then le guide ne s'affiche plus (auto-dismiss après completeSetupGuide)

## Scope technique

- `components/setup-guide/SetupGuide.tsx` : href étape 1, logique auto-dismiss
- `components/IncomeTemplateManager.tsx` : labels "source" -> "revenu récurrent"
- `components/ExpenseTemplateManager.tsx` : labels "charge" -> "dépense récurrente"
- `components/revenus/IncomeTrackingTab.tsx` : label "gabarit"
- `components/revenus/AllocationTrackingTab.tsx` : label "gabarit"
- `components/depenses/ExpenseActionSheet.tsx` : label "gabarit"
- `lib/actions/setup-guide.ts` : logique auto-dismiss (completeSetupGuide met aussi dismissed_at)

## Priorité

P0 — Bloque l'expérience de premier usage

## Dépendances

Aucune
