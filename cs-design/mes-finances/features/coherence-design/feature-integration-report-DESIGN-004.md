# Feature Integration Report — DESIGN-004 : Format des montants

**Date :** 2026-03-07
**Story :** DESIGN-004 — Standardiser le format des montants
**Feature :** coherence-design
**Build :** OK (npm run build passe sans erreur)

---

## Ce qui a ete fait

Tous les montants monetaires de l'application affichent maintenant le format fr-CA standard :

```
N NNN,NN $
```

- Espace insecable `\u00A0` pour les milliers (gere par `Intl.NumberFormat`)
- Virgule pour les decimales
- Toujours 2 decimales
- Dollar apres le nombre avec espace insecable
- Negatifs : `-125,00 $`
- Zero : `0,00 $`
- Variante approximation : `~800,00 $`

### Helper centralise

`lib/utils.ts` — `formatCAD(amount: number): string` existait deja et est conforme. Aucune modification necessaire.

```typescript
export function formatCAD(amount: number, currency = "CAD"): string {
  return new Intl.NumberFormat("fr-CA", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  })
    .format(amount)
    .replace(/\u202f/g, "\u00a0"); // normalize narrow no-break space to regular no-break space
}
```

---

## Fichiers modifies

| Fichier | Changements |
|---------|-------------|
| `components/depenses/ExpenseSummaryStats.tsx` | Import formatCAD. Remplacement `toLocaleString` par `{amount.toLocaleString(..., 2 dec)}`. Fix detail string `sur ${...}` -> `sur ${formatCAD(...)}`. |
| `components/depenses/StatusGroupSection.tsx` | Import formatCAD. Remplacement `$\n{groupTotal.toLocaleString(...)}` par `{formatCAD(groupTotal)}`. |
| `components/depenses/ExpenseMonument.tsx` | Import formatCAD. Hero : 2 decimales, $ deplace apres le nombre. Badges : formatCAD pour over/restant/imprevus. |
| `components/depenses/ExpenseActionSheet.tsx` | Remplacement de 4 occurrences de `toLocaleString` + prefixe `$` par `formatCAD(...)`. |
| `components/revenus/RevenusMonument.tsx` | Hero : 2 decimales pour actualTotal et expectedTotal. $ deplace apres le nombre. |
| `components/accueil/TabTableauDeBord.tsx` | CardAmount revenus, depenses, epargne : 2 decimales. CardAmount dettes : 2 decimales + utilisation de `<Dollar>` component existant. Valeur nette : 2 decimales. Suppression `Math.round()` (les centimes exacts sont maintenant affiches). |
| `components/projets/PatrimoineMonument.tsx` | Hero : $ deplace apres le nombre, 2 decimales. Totals bar epargne/dettes : meme traitement. |
| `components/projets/DebtCard.tsx` | $ deplace apres le nombre. 2 decimales pour `remaining`. |
| `components/projets/SavingsProjectCard.tsx` | $ deplace apres le nombre. 2 decimales pour `saved`. |
| `components/AccueilClient.tsx` | 2 decimales pour `amountFormatted`. Suppression `verticalAlign: super` sur le span $. |
| `components/IncomeTemplateManager.tsx` | Import formatCAD. `formatMonthlyDisplay()` delegue maintenant a `formatCAD()`. Suppression du span `$` superflu (formatCAD inclut deja le $). |
| `components/ExpenseTemplateManager.tsx` | `formatSectionTotal()` delegue a `formatCAD()`. Suppression des 2 spans `$` prefixes orphelins. Fix format annuel/mensuel : `formatCAD(amount)/an`. |
| `components/IncomeTrackingRow.tsx` | `IncomeInstanceRow` : formatCAD pour actual_amount et expected_amount, suppression spans `$` et `~$`. `VariableIncomeRow` : meme traitement pour estimated_amount. |
| `components/ProjectModal.tsx` | Import formatCAD. `monthlySuggested` : `formatCAD(Math.ceil(...))`. Suppression du ` $` manuel. |
| `components/DebtModal.tsx` | Import formatCAD. `totalInterest` : `formatCAD(Math.round(...))`. Suppression du ` $` manuel. |
| `components/revenus/AllocationTrackingTab.tsx` | Hero `disponibleAttendu` : 2 decimales. Suppression `verticalAlign: super`. |
| `app/parametres/charges/page.tsx` | Import formatCAD. `displayAmount` sous 1000 : 2 decimales. `monthlyLabel` : formatCAD. Suppression du ` $` dans le sub-label. |
| `app/parametres/revenus/page.tsx` | Import formatCAD. `displayAmount` : 2 decimales. `monthlyLabel` : formatCAD. Suppression `&nbsp;$&nbsp;` dans le sub-label. |
| `app/parametres/allocation/page.tsx` | Import formatCAD. `displayAmount` sous 1000 : 2 decimales. `monthlyLabel` : formatCAD. Suppression du ` $` dans le sub-label. |

---

## Cas particuliers

### Heroes monument avec `k` shorthand

Les pages `parametres/charges` et `parametres/allocation` affichent le montant total avec un raccourci `2,4k` pour les grands nombres (>= 1000). Ce raccourci est conserve dans le hero visuel monument (c'est une decision de lisibilite a grande echelle). La sub-label en dessous utilise toujours le format complet `2 403,97 $`.

### Suppression de Math.round() dans TabTableauDeBord

Les cards du tableau de bord utilisaient `Math.round()` avant d'afficher. Avec l'affichage a 2 decimales, `Math.round()` aurait arrondi a l'entier (`4 200 $`) ce qui contredit la convention. Supprime pour que les centimes apparaissent correctement.

### Structure JSX heroes conservee

Les heroes monument ont une structure JSX ou le `$` est un `<span>` stylise (superscript visuel). Cette structure est conservee — seul le contenu change : le `$` est maintenant apres le nombre (fr-CA correct), et `verticalAlign: super` est supprime pour un rendu inline propre.

---

## Screenshots de validation

| Page | Screenshot |
|------|------------|
| Accueil | `.tmp/screenshots/DESIGN-004/accueil.png` |
| Depenses | `.tmp/screenshots/DESIGN-004/depenses.png` |
| Revenus | `.tmp/screenshots/DESIGN-004/revenus.png` |
| Projets/Patrimoine | `.tmp/screenshots/DESIGN-004/projets.png` |
| Parametres/charges | `.tmp/screenshots/DESIGN-004/charges.png` |
| Parametres/revenus | `.tmp/screenshots/DESIGN-004/revenus-params.png` |

---

## Known gaps

Aucun. DESIGN-004 est purement display formatting. Aucune logique metier touchee, aucun data binding a faire par le developpeur.

---

## Verification build

```
npm run build → succes
Toutes les routes (ƒ) compilees sans erreur TypeScript.
```
