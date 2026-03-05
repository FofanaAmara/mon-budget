# AUDIT-012 — Extract duplicated code (DEFAULT_SECTIONS, fadeInUp, icon/status helpers)

## Type
REFACTOR

## Severity
HAUTE

## Feature
audit-remediation

## Description
Plusieurs morceaux de code sont dupliques a travers la codebase :
1. `DEFAULT_SECTIONS` est defini identiquement dans `claim.ts` et `demo-data.ts`
2. `@keyframes fadeInUp` est copie dans 4 fichiers components via des `<style>` tags inline
3. `getIconVariant`, `iconStyles`, `getStatusBadge`, `getAmountColor` sont dupliques entre `TabTimeline.tsx` et `ExpenseTrackingRow.tsx` (les commentaires dans le code disent "same as TabTimeline.tsx")
4. Les memes SVG icons (close, plus, edit, trash, check, chevron) sont copie-colles dans 10+ fichiers

## Acceptance Criteria
Given `DEFAULT_SECTIONS` est defini dans 2 fichiers
When il est extrait dans `lib/constants.ts`
Then les deux fichiers importent depuis la source unique

Given `@keyframes fadeInUp` est copie dans 4 composants via `<style>` tags
When il est defini une seule fois dans `globals.css`
Then les 4 `<style>` tags inline sont supprimes et l'animation fonctionne partout

Given `getStatusBadge`, `getAmountColor`, `getIconVariant` sont dupliques
When ils sont extraits dans un module partage (ex: `lib/expense-display-utils.ts`)
Then les deux fichiers importent depuis la source unique

Given les memes SVG icons sont copie-colles dans 10+ fichiers
When les icons les plus utilisees sont extraites (close/X, plus, edit/pencil, trash, check, chevron)
Then un module d'icons existe (ex: `components/icons.tsx`) et les composants importent depuis la

Given le build passait avant cette story
When tous les changements sont appliques
Then le build passe et le rendu visuel est identique (memes animations, memes icones, memes badges)

## Technical Notes
- Fichiers a modifier :
  - `lib/constants.ts` : ajouter `DEFAULT_SECTIONS`
  - `lib/actions/claim.ts` et `lib/actions/demo-data.ts` : importer depuis constants
  - `app/globals.css` : ajouter `@keyframes fadeInUp`
  - `components/AccueilClient.tsx`, `components/accueil/TabTimeline.tsx`, `components/accueil/TabSanteFinanciere.tsx`, `components/accueil/TabTableauDeBord.tsx` : supprimer les `<style>` inline
  - Creer `lib/expense-display-utils.ts` : y deplacer getStatusBadge, getAmountColor, getIconVariant, iconStyles
  - `components/accueil/TabTimeline.tsx` et `components/ExpenseTrackingRow.tsx` : importer depuis le module partage
  - Creer `components/icons.tsx` : au minimum IconClose, IconPlus, IconEdit, IconTrash, IconCheck, IconChevron
- Aussi extraire : `revalidateExpensePages()`, `revalidateIncomePages()` dans `lib/revalidation.ts` pour les 137 `revalidatePath` dupliques (Clean Code M-05)
- Audit findings addressed : Clean Code H-04, M-05, M-09, Frontend-H3, H4, Frontend-M11, Architecture-M-6
- Dependencies : Aucune
- Non-regression : le rendu visuel doit etre pixel-perfect identique. Les animations doivent fonctionner. Les icones doivent avoir les memes tailles et couleurs.

## Size
S
