# ONBOARD-003 — Design technique

> **Story:** Ajout de l'etape categories au guide de configuration
> **Level:** 2 (CRUD + regles legeres)
> **Scope:** frontend, backend, data
> **Date:** 2026-03-06

## 1. Resume

Ajouter une 5e etape "Creer tes categories de depenses" au guide de configuration, positionnee en etape 2 (entre revenu et charge fixe). La detection de completion est basee sur la presence de sections dans la base de donnees. Aucune migration de donnees requise, aucune nouvelle table.

## 2. Decision cle : sections par defaut vs sections personnalisees

### Probleme

L'app appelle `ensureDefaultSections()` dans `app/page.tsx` pour chaque nouvel utilisateur. Ce qui signifie que des la premiere visite sur le dashboard, l'utilisateur a deja des sections par defaut. Si la detection est `EXISTS(SELECT 1 FROM sections WHERE user_id = ...)`, l'etape serait cochee des le debut sans action de l'utilisateur.

### Options

| Option | Avantage | Inconvenient |
|--------|----------|-------------|
| A. `EXISTS` simple (toute section) | Simple, pas de schema change | Cochee automatiquement par les sections par defaut |
| B. Ajouter colonne `is_default` a `sections` | Distinction precise | Migration DB, modification de `ensureDefaultSections`, complexite ajoutee |
| C. Comparer le nombre actuel au nombre de sections par defaut (4) | Pas de schema change | Fragile si le nombre de sections par defaut change |

### Decision : Option A — `EXISTS` simple

**Justification :** L'etape "Creer tes categories" vise a s'assurer que l'utilisateur a des categories pour organiser ses depenses. Les sections par defaut remplissent ce besoin. Un utilisateur qui a deja des sections (meme par defaut) est effectivement pret a ajouter des charges fixes classees par categorie.

Le guide ne teste pas "as-tu fait l'action de creer", il teste "es-tu pret pour l'etape suivante". Les autres etapes suivent la meme logique : si un utilisateur avait importe des revenus via un autre mecanisme, l'etape revenu serait cochee aussi.

**Consequence :** Pour un nouvel utilisateur qui arrive sur le dashboard AVANT de commencer le guide, `ensureDefaultSections()` s'execute, et l'etape 2 sera deja cochee. C'est acceptable : l'utilisateur peut passer directement a l'etape 3 (ajouter une charge fixe) car il a deja des categories.

**Alternative rejetee :** Option B ajouterait de la complexite (migration, modification `ensureDefaultSections`, modification `createSection` pour marquer `is_default = false`) pour une distinction que l'utilisateur ne percoit pas comme significative a ce stade (alpha, usage personnel).

## 3. Modifications SQL — `getOrInitSetupGuideData()`

### Requete actuelle

4 clauses EXISTS : `has_income`, `has_expense`, `has_generated`, `has_paid`.

### Modification

Ajouter une 5e clause EXISTS :

```sql
EXISTS(
  SELECT 1 FROM sections
  WHERE user_id = ${userId}
) AS has_sections,
```

Position dans la requete : apres `has_income`, avant `has_expense` (pour refleter l'ordre logique des etapes).

### Impact sur `allCompleted`

```typescript
// Avant
const allCompleted = hasIncome && hasExpense && hasGenerated && hasPaid;

// Apres
const allCompleted = hasIncome && hasSections && hasExpense && hasGenerated && hasPaid;
```

## 4. Modifications du type `GuideStepCompletion`

```typescript
// Avant
export type GuideStepCompletion = {
  income: boolean;
  expense: boolean;
  generate: boolean;
  pay: boolean;
};

// Apres
export type GuideStepCompletion = {
  income: boolean;
  sections: boolean;  // NEW — etape 2
  expense: boolean;
  generate: boolean;
  pay: boolean;
};
```

L'objet `stepsCompletion` dans la fonction sera mis a jour en consequence :

```typescript
const stepsCompletion: GuideStepCompletion = {
  income: hasIncome,
  sections: hasSections,  // NEW
  expense: hasExpense,
  generate: hasGenerated,
  pay: hasPaid,
};
```

## 5. Modifications frontend — `SetupGuide.tsx`

### STEPS_CONFIG : insertion en position 2

```typescript
const STEPS_CONFIG = [
  {
    id: "income" as const,
    title: "Ajouter un revenu recurrent",
    description: "Ton salaire ou toute entree d'argent reguliere.",
    href: "/revenus",
  },
  {
    id: "sections" as const,  // NEW — position 2
    title: "Creer tes categories de depenses",
    description: "Organise tes charges fixes par categorie (logement, transport...).",
    href: "/sections",
  },
  {
    id: "expense" as const,
    title: "Ajouter une charge fixe",
    description: "Loyer, abonnements, assurances...",
    href: "/parametres/charges",
  },
  {
    id: "generate" as const,
    title: "Generer le mois courant",
    description: "Cree les depenses a partir de tes modeles.",
    href: "/depenses",
  },
  {
    id: "pay" as const,
    title: "Marquer une depense payee",
    description: "Confirme un paiement pour voir ton budget bouger.",
    href: "/depenses",
  },
] as const;
```

### `buildStepData()` : aucun changement de logique

La fonction itere sur `STEPS_CONFIG` et utilise `completionMap[step.id]` pour determiner l'etat. Comme le nouveau step a un `id: "sections"` qui correspond a la cle `sections` dans `GuideStepCompletion`, la logique fonctionne sans modification.

La detection du "current" step utilise `completedCount` (index du premier non-complete), ce qui reste correct car c'est calcule depuis `Object.values(completion).filter(Boolean).length`.

**Note importante :** `Object.values(completion)` depend de l'ordre d'insertion des proprietes dans l'objet. En JavaScript/TypeScript, les proprietes non-numeriques preservent l'ordre d'insertion. Comme on construit `stepsCompletion` dans le bon ordre (income, sections, expense, generate, pay), et que `STEPS_CONFIG` suit le meme ordre, le mapping par index implicite dans `buildStepData` reste coherent.

## 6. Modifications des hardcoded "4" → "5"

Les valeurs hardcodees `4` et `total={4}` doivent etre remplacees. La solution propre est de deriver le total depuis `STEPS_CONFIG.length`.

### Fichiers impactes

| Fichier | Ligne(s) | Modification |
|---------|----------|-------------|
| `SetupGuideBar.tsx` | L95, L221 | `total={4}` → `total={STEPS_CONFIG.length}` (ou passer via prop) |
| `SetupGuideBar.tsx` | L63, L183 | aria-label "sur 4" → utiliser une variable |
| `SetupGuideSheet.tsx` | L150, L248 | `total={4}` → prop ou constante |
| `SetupGuideSheet.tsx` | L44 | `getSubtitle()` : adapter les cas 0-4 pour 0-5 |
| `SetupGuideProgressRing.tsx` | L75 | `total = 4` → `total = 5` (default prop) |
| `SetupGuide.tsx` | commentaire L122 | "all 4 steps" → "all steps" |

### Strategie : exporter `TOTAL_STEPS` depuis `SetupGuide.tsx`

```typescript
export const TOTAL_STEPS = STEPS_CONFIG.length; // 5
```

Les sous-composants recevront `total` via props (deja le cas pour `SetupGuideProgressRing`). Pour `SetupGuideBar`, le `total` sera passe en prop. Le `aria-label` utilisera cette prop au lieu du hardcoded "4".

### `getSubtitle()` dans `SetupGuideSheet.tsx`

```typescript
function getSubtitle(completedCount: number, totalSteps: number): string {
  if (completedCount === 0) return `${totalSteps} etapes pour etre operationnel`;
  if (completedCount === totalSteps - 1) return "Plus qu'une etape !";
  if (completedCount >= Math.floor(totalSteps / 2)) return "Deja a mi-chemin !";
  return "Beau debut !";
}
```

Cette version est generique et ne casserait pas si on ajoute une 6e etape a l'avenir.

## 7. Retrocompatibilite — migration 4 → 5 etapes

### Scenario : utilisateur en cours de guide

Aucune migration de donnees necessaire. La detection est dynamique (EXISTS queries). Quand le code deploye, la prochaine requete inclura `has_sections` :

- Si l'utilisateur a deja des sections (par defaut ou creees) → `sections: true` → etape cochee
- Si l'utilisateur n'a pas de sections → `sections: false` → etape non cochee

Le `completedCount` change de base (de /4 a /5), mais les etapes individuelles restent fideles a l'etat reel. Le guide ne se reinitialise pas car il n'y a pas de reset mecanique — chaque etape est evaluee independamment.

### Scenario : guide deja complete

Le guide deja complete a `completed_at IS NOT NULL` dans la table `setup_guide`. La fonction `computeVisibility()` retourne `false` dans ce cas (L129-130 dans le code actuel). Le guide ne reapparait PAS.

Aucune modification de `computeVisibility()` n'est necessaire. La logique existante protege deja ce cas.

### Scenario : guide dismissed

Meme protection via `dismissed_at IS NOT NULL` → `computeVisibility()` retourne `false`.

### Scenario : utilisateur existant sans guide row + toutes etapes completes

Protege par la regle AC-6 (L134-135) : `allCompleted && !guideRowExists → false`. Le nouveau `allCompleted` inclut `hasSections`, ce qui ne change pas le comportement car un utilisateur existant avec tout complete a forcement aussi des sections.

## 8. Fichiers a creer / modifier

### Fichiers a modifier (6)

| Fichier | Nature du changement |
|---------|---------------------|
| `lib/actions/setup-guide.ts` | Ajouter EXISTS sections dans la query SQL, ajouter `sections` a `GuideStepCompletion`, mettre a jour `allCompleted` |
| `components/setup-guide/SetupGuide.tsx` | Ajouter step "sections" dans `STEPS_CONFIG`, exporter `TOTAL_STEPS`, mettre a jour commentaire |
| `components/setup-guide/SetupGuideBar.tsx` | Ajouter prop `totalSteps`, remplacer hardcoded "4" dans aria-labels et `total` |
| `components/setup-guide/SetupGuideSheet.tsx` | Ajouter prop `totalSteps`, adapter `getSubtitle()`, remplacer hardcoded `total={4}` |
| `components/setup-guide/SetupGuideProgressRing.tsx` | Changer default de `total` de 4 a 5 |
| `components/setup-guide/SetupGuideCelebration.tsx` | Mettre a jour le commentaire JSDoc ("4 steps" → "all steps") |

### Fichiers a creer (0)

Aucun nouveau fichier. Pas de migration SQL (pas de changement de schema).

## 9. Risques et mitigations

| Risque | Severite | Mitigation |
|--------|----------|------------|
| `Object.values()` retourne les booleans dans un ordre different de `STEPS_CONFIG` | MEDIUM | Verifier que `stepsCompletion` est construit dans le meme ordre que `STEPS_CONFIG`. Alternative : ne pas se fier a l'index dans `buildStepData`, mais utiliser `step.id` pour le lookup (deja le cas via `completionMap[step.id]`). Le seul endroit ou l'ordre compte est `completedCount` qui utilise `Object.values().filter(Boolean).length` — et le COUNT ne depend pas de l'ordre. Le "current" step utilise `i === completedCount` ce qui suppose que les steps completes sont tous avant les non-completes — ce qui peut ne pas etre vrai avec la migration (etape 1 complete, etape 2 non complete, etape 3 complete). |
| `buildStepData` "current" step logic incorrecte si etapes non-sequentielles | HIGH | La logique actuelle `i === completedCount` assume une progression lineaire. Avec la migration, on peut avoir `[true, false, true, false, false]` → `completedCount = 2` mais le step a index 2 (expense) est deja complete. Le "current" serait expense alors que le vrai "current" est sections (index 1). **FIX NECESSAIRE :** changer la logique pour que "current" = premier step non complete, pas `i === completedCount`. |
| Guide reapparait pour utilisateurs avec `completed_at` set | LOW | `computeVisibility()` protege deja ce cas. Pas de changement necessaire. Verifier dans les tests. |

### Fix critique pour `buildStepData`

La logique actuelle est fragile :

```typescript
// ACTUEL (problematique avec steps non-sequentiels)
if (isCompleted) {
  state = "completed";
} else if (i === completedCount) {
  state = "current";
} else {
  state = "upcoming";
}
```

Doit devenir :

```typescript
// CORRIGE (robuste)
let foundFirst = false;
return STEPS_CONFIG.map((step) => {
  const isCompleted = completionMap[step.id];
  let state: "upcoming" | "current" | "completed";
  if (isCompleted) {
    state = "completed";
  } else if (!foundFirst) {
    state = "current";
    foundFirst = true;
  } else {
    state = "upcoming";
  }
  // ...
});
```

Ce fix est necessaire MEME SANS cette story (la logique actuelle ne gererait pas un cas ou l'utilisateur a fait les etapes dans le desordre), mais il devient critique avec l'ajout de l'etape sections car la migration cree exactement ce scenario.

## 10. Plan d'implementation

1. **Backend** (`lib/actions/setup-guide.ts`)
   - Ajouter EXISTS clause pour sections
   - Ajouter `sections` a `GuideStepCompletion`
   - Mettre a jour `stepsCompletion` et `allCompleted`

2. **Frontend orchestrator** (`SetupGuide.tsx`)
   - Ajouter step "sections" dans `STEPS_CONFIG`
   - Exporter `TOTAL_STEPS`
   - Corriger `buildStepData` pour gerer les completions non-sequentielles
   - Passer `totalSteps` aux sous-composants

3. **Frontend sub-components**
   - `SetupGuideBar.tsx` : ajouter prop `totalSteps`, fixer aria-labels
   - `SetupGuideSheet.tsx` : ajouter prop `totalSteps`, adapter `getSubtitle()`
   - `SetupGuideProgressRing.tsx` : changer default total a 5
   - `SetupGuideCelebration.tsx` : mettre a jour commentaire

4. **Tests**
   - Tester la query avec un utilisateur qui a des sections
   - Tester la query avec un utilisateur sans sections
   - Tester `buildStepData` avec des completions non-sequentielles
   - Tester que le guide ne reapparait pas si `completed_at` est set
   - Tester l'ordre des 5 etapes
   - Tester `getSubtitle` avec 0-5 etapes completees

## 11. Migration safety assessment

**Aucune migration de schema necessaire.** Les modifications sont purement au niveau du code applicatif :
- La requete SQL ajoute un EXISTS sur une table existante (`sections`) avec un index existant (`idx_sections_user_id`)
- Pas de CREATE/ALTER/DROP TABLE
- Pas de nouvelle colonne
- Pas de changement de contrainte

**Assessment : SAFE** — deploiement sans risque de corruption de donnees.
