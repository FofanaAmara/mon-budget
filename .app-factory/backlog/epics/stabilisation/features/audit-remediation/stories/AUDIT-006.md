# AUDIT-006 — Fix critical accessibility (htmlFor, userScalable, keyboard, ARIA)

## Type
FIX

## Severity
CRITIQUE

## Feature
audit-remediation

## Description
L'application est largement inaccessible : 79 labels sur 80 n'ont pas de `htmlFor`, le zoom est bloque par `userScalable: false`, 15+ divs interactifs (backdrops de sheets) n'ont pas de support clavier, et aucun modal/sheet n'a `role="dialog"` ou `aria-modal`. L'app est inutilisable pour les personnes utilisant un lecteur d'ecran ou navigant au clavier.

## Acceptance Criteria
Given 79 labels n'ont pas d'attribut `htmlFor`
When tous les labels sont corriges
Then chaque `<label>` a un `htmlFor` correspondant a un `id` sur son `<input>`, `<select>` ou `<textarea>`

Given `app/layout.tsx` definit `userScalable: false` et `maximumScale: 1`
When le viewport meta est corrige
Then `userScalable` est supprime (ou mis a `true`) et `maximumScale` est au minimum `5`

Given les backdrops de sheets utilisent `<div onClick>`
When ils sont corriges
Then ils ont `role="presentation"` (dismiss secondaire) OU sont des `<button>` stylises

Given aucun modal/sheet n'a `role="dialog"`
When ils sont corriges
Then chaque sheet/modal a `role="dialog"`, `aria-modal="true"`, et `aria-labelledby` pointant vers le titre

Given aucun sheet ne gere la touche Escape
When un sheet est ouvert et l'utilisateur appuie sur Escape
Then le sheet se ferme

Given le build passait avant cette story
When tous les changements sont appliques
Then le build passe et tous les formulaires/modals fonctionnent identiquement

## Technical Notes
- Labels `htmlFor` : tous les composants de formulaire dans `components/` (ExpenseModal, IncomeModal, AllocationModal, DebtModal, AdhocExpenseModal, AdhocIncomeModal, AdhocAllocationModal, ProjectModal, SectionsClient, CartesClient, TransferSavingsModal, AddSavingsModal, RevenusTrackingClient, ProjetsEpargneClient)
- Viewport : `app/layout.tsx:35`
- Backdrops : ~15 instances dans DepensesTrackingClient, AllocationModal, AdhocAllocationModal, ProjetsEpargneClient, RevenusTrackingClient, SavingsHistoryModal, AdhocIncomeModal
- ARIA : tous les sheets/modals custom
- Escape handler : ajouter `onKeyDown` sur le container du sheet, `tabIndex={-1}`, auto-focus a l'ouverture
- Audit findings addressed : Frontend-C1, C2, C3, Frontend-M9, M10
- Dependencies : Aucune
- Non-regression : tous les formulaires doivent fonctionner identiquement. Les sheets doivent s'ouvrir et se fermer normalement.

## Size
S
