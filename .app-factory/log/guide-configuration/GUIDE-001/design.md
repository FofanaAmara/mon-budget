# GUIDE-001 — Design technique

> Story: Je vois le guide de configuration et les etapes a completer
> Level: 2 (CRUD + business rules)
> Scope: data, backend, frontend
> Date: 2026-03-06

---

## 1. Vue d'ensemble

Le guide de configuration est un composant persistant visible sur toutes les pages authentifiees. Il montre 4 etapes a completer pour rendre le budget fonctionnel. L'UI shell existe deja (6 composants dans `components/setup-guide/`). Cette story connecte les mocks a des donnees reelles.

**Flux principal:**
1. L'utilisateur se connecte
2. Le layout serveur (`app/layout.tsx`) interroge la DB pour l'etat du guide
3. Les donnees sont passees en props au composant client `SetupGuide`
4. Le composant affiche la barre/sheet avec l'etat reel des etapes

---

## 2. Schema DB

### Table `setup_guide`

```sql
CREATE TABLE IF NOT EXISTS setup_guide (
  user_id TEXT PRIMARY KEY,
  completed_at TIMESTAMPTZ,
  dismissed_at TIMESTAMPTZ,
  reset_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Decisions:**
- `user_id TEXT PRIMARY KEY` : pas de UUID auto-genere, le user_id Neon Auth est la PK. Un seul enregistrement par utilisateur. Coherent avec le pattern `settings` (UNIQUE index sur user_id).
- Pas de FK vers une table users (Neon Auth gere les users, on n'a pas de table users locale).
- `completed_at` : timestamp quand les 4 etapes sont toutes completees. NULL = guide actif.
- `dismissed_at` : timestamp quand l'utilisateur ferme la celebration. NULL = pas encore dismiss.
- `reset_at` : timestamp du dernier reset (depuis parametres, story GUIDE-003). NULL = jamais reset.
- `created_at` : pour tracking, pas de logique metier.
- Pas de colonnes `step_X_completed` : la completion est calculee dynamiquement depuis les donnees reelles (incomes, expenses, monthly_expenses).

### Migration : `scripts/migrate-setup-guide.mjs`

Operations (toutes SAFE) :
- `CREATE TABLE IF NOT EXISTS setup_guide` (nouvelle table, zero impact)
- Pas de backfill necessaire : les utilisateurs existants qui ont deja tout configure n'auront pas de ligne dans la table, et la logique de visibilite le prend en compte.

---

## 3. Requete serveur — Etat du guide

### Requete SQL unique (4 EXISTS + guide state)

```sql
SELECT
  -- Step 1: au moins 1 revenu recurrent actif
  EXISTS(
    SELECT 1 FROM incomes
    WHERE user_id = $1 AND is_active = true
  ) AS has_income,

  -- Step 2: au moins 1 charge fixe active (template)
  EXISTS(
    SELECT 1 FROM expenses
    WHERE user_id = $1 AND is_active = true
  ) AS has_expense,

  -- Step 3: au moins 1 depense mensuelle generee pour le mois courant
  EXISTS(
    SELECT 1 FROM monthly_expenses
    WHERE user_id = $1 AND month = $2
  ) AS has_generated,

  -- Step 4: au moins 1 depense payee pour le mois courant
  EXISTS(
    SELECT 1 FROM monthly_expenses
    WHERE user_id = $1 AND month = $2 AND is_paid = true
  ) AS has_paid,

  -- Guide state
  (SELECT dismissed_at FROM setup_guide WHERE user_id = $1) AS dismissed_at,
  (SELECT completed_at FROM setup_guide WHERE user_id = $1) AS completed_at
```

**Parametre `$2`** : mois courant au format `YYYY-MM` (via `currentMonth()` de `lib/utils.ts`).

**Performance** : une seule requete SQL, 4 EXISTS (arretent au premier match, pas de count), 2 scalar sub-queries. Tres rapide meme sur des tables larges.

### Logique de visibilite

```
isVisible =
  dismissed_at IS NULL                    // pas encore dismiss
  AND NOT (has_income AND has_expense     // pas un utilisateur existant
           AND has_generated AND has_paid  // qui a deja tout fait
           AND guide row does NOT exist)   // sans jamais avoir eu le guide
```

**Regle pour les utilisateurs existants (AC-6)** : Si les 4 conditions sont remplies ET qu'il n'y a pas de ligne dans `setup_guide`, l'utilisateur existait avant le guide. Le guide ne s'affiche pas. Si les 4 conditions sont remplies ET qu'il y a une ligne dans `setup_guide` avec `completed_at IS NULL`, c'est un utilisateur qui a progresse avec le guide -- on montre la celebration.

```typescript
function computeVisibility(data: GuideQueryResult): boolean {
  const allCompleted = data.has_income && data.has_expense
    && data.has_generated && data.has_paid;

  // Already dismissed
  if (data.dismissed_at) return false;

  // Existing user (all done, never had the guide)
  if (allCompleted && !data.guide_row_exists) return false;

  return true;
}
```

---

## 4. Data flow — Du serveur au client

### Probleme architectural

- `app/layout.tsx` est un **server component** (peut faire des requetes DB)
- `LayoutShell.tsx` est `"use client"` (ne peut PAS faire de requetes DB)
- `SetupGuide.tsx` est `"use client"` (ne peut PAS faire de requetes DB)
- Le guide doit etre visible sur TOUTES les pages authentifiees

### Solution : server component wrapper

Creer un composant serveur `SetupGuideServer.tsx` qui :
1. Appelle `requireAuth()` pour obtenir le `userId` (avec try/catch : si non connecte, ne rend rien)
2. Execute la requete SQL unique
3. Calcule `isVisible`, `isCompleted`, et les `stepsCompletion`
4. Passe les donnees en props a `SetupGuide`

```
app/layout.tsx (server)
  └── AuthProviders (client)
        └── LayoutShell (client)
              ├── BottomNav (client)
              ├── SetupGuideServer (server) <-- NOUVEAU
              │     └── SetupGuide (client, recoit les props)
              └── {children}
```

**PROBLEME** : `LayoutShell` est `"use client"`. On ne peut pas rendre un server component (`SetupGuideServer`) comme enfant d'un client component directement.

### Solution revisee : remonter le fetch dans layout.tsx

`app/layout.tsx` est un server component. On peut y faire le fetch et passer les donnees via `LayoutShell` comme props serialisables.

```
app/layout.tsx (server) — fetch guide data ici
  └── AuthProviders (client)
        └── LayoutShell (client, recoit guideData en props)
              ├── BottomNav
              ├── SetupGuide (recoit les props via LayoutShell)
              └── {children}
```

**Probleme** : `app/layout.tsx` est le root layout. `requireAuth()` throw si non connecte. On ne veut pas que le layout entier crash pour les pages publiques.

### Solution finale : fetch conditionnel dans layout.tsx avec fallback

```typescript
// app/layout.tsx
import { getSetupGuideData } from "@/lib/actions/setup-guide";

export default async function RootLayout({ children }) {
  // Safe fetch — returns null if not authenticated or on error
  const guideData = await getSetupGuideData().catch(() => null);

  return (
    <html>
      <body>
        <AuthProviders>
          <LayoutShell guideData={guideData}>
            {children}
          </LayoutShell>
        </AuthProviders>
      </body>
    </html>
  );
}
```

**`getSetupGuideData()`** n'est PAS une server action (`"use server"`) mais une fonction serveur normale (importee depuis un fichier sans `"use server"` directive). Elle est appelee pendant le rendu serveur, pas depuis le client.

Contrairement aux server actions (declenchees par le client), cette fonction est un simple appel serveur au moment du SSR. On la met dans `lib/queries/setup-guide.ts` (pas dans `lib/actions/`).

### Structure fichiers

```
lib/queries/setup-guide.ts     <-- query serveur (pas "use server")
  export async function getSetupGuideData(): Promise<GuideData | null>

lib/actions/setup-guide.ts     <-- server actions (mutations)
  "use server"
  export async function dismissSetupGuide(): Promise<void>

lib/types/setup-guide.ts       <-- types partages
  export type GuideStepCompletion
  export type GuideData
```

**Decision**: separer queries (lecture au rendu) et actions (mutations declenchees par le client). Les queries ne portent pas la directive `"use server"` car elles sont appelees durant le SSR, pas depuis le client.

---

## 5. Modifications SetupGuide.tsx

### Props a ajouter

```typescript
type GuideStepCompletion = {
  income: boolean;
  expense: boolean;
  generate: boolean;
  pay: boolean;
};

type GuideData = {
  stepsCompletion: GuideStepCompletion;
  isVisible: boolean;
  isCompleted: boolean;
};

// SetupGuide accepte maintenant des props optionnelles
type SetupGuideProps = {
  guideData?: GuideData | null;
};
```

### Changements dans SetupGuide.tsx

1. **Supprimer `MOCK_STEPS_RAW`** : remplacer par les donnees statiques (titre, description, href) combinees avec `guideData.stepsCompletion` pour le champ `completed`.
2. **Supprimer `MOCK_GUIDE_STATE`** : remplacer par `guideData.isVisible` et `guideData.isCompleted`.
3. **`handleStepClick`** : remplacer `window.location.href` par `router.push(href)`.
4. **`handleCelebrationCTA`** : appeler `dismissSetupGuide()` server action + `router.push('/')`.
5. **Guard null** : si `guideData` est null ou `!isVisible`, retourner null.

### Changements dans LayoutShell.tsx

Ajouter la prop `guideData` et la passer a `SetupGuide`.

```typescript
type LayoutShellProps = {
  children: React.ReactNode;
  guideData?: GuideData | null;
};
```

---

## 6. Fichiers a creer / modifier

### Fichiers a creer

| Fichier | Responsabilite |
|---------|----------------|
| `scripts/migrate-setup-guide.mjs` | Migration : CREATE TABLE setup_guide |
| `lib/queries/setup-guide.ts` | Query serveur : getSetupGuideData() |
| `lib/actions/setup-guide.ts` | Server actions : dismissSetupGuide() |
| `lib/types/setup-guide.ts` | Types : GuideStepCompletion, GuideData |

### Fichiers a modifier

| Fichier | Changement |
|---------|------------|
| `app/layout.tsx` | Ajouter appel a getSetupGuideData(), passer en prop a LayoutShell |
| `components/LayoutShell.tsx` | Accepter prop guideData, passer a SetupGuide |
| `components/setup-guide/SetupGuide.tsx` | Accepter props, supprimer mocks, router.push, dismissSetupGuide |

---

## 7. Logique de visibilite detaillee

### Matrice de cas

| Cas | Ligne setup_guide | 4 etapes | dismissed_at | Guide visible? |
|-----|-------------------|----------|--------------|----------------|
| Nouvel utilisateur (premiere connexion) | NON | NON | N/A | OUI |
| Utilisateur en cours de config | NON | Partiellement | N/A | OUI |
| Utilisateur existant (avant feature guide) | NON | OUI | N/A | NON (AC-6) |
| Utilisateur qui a complete le guide | OUI | OUI | NULL | OUI (celebration) |
| Utilisateur qui a dismiss la celebration | OUI | OUI | SET | NON |
| Utilisateur qui a reset le guide | OUI | Variable | NULL (reset) | OUI |

**Quand creer la ligne setup_guide ?** : A la completion des 4 etapes (`completed_at = NOW()`). Cela distingue "n'a jamais eu le guide" de "a complete le guide".

WAIT -- si on ne cree la ligne qu'a la completion, on ne peut pas distinguer "utilisateur existant qui a tout fait avant le guide" de "nouvel utilisateur qui vient de tout faire sans passer par le guide". La solution :

**Decision revisee** : Creer la ligne `setup_guide` des que le guide est affiche pour la premiere fois (au moment du premier rendu ou la visibilite est `true` et la ligne n'existe pas). Cela se fait via un `INSERT ... ON CONFLICT DO NOTHING` dans `getSetupGuideData()`.

```
Visibilite:
  dismissed_at IS NOT NULL → NON
  Pas de ligne + 4 etapes completes → NON (utilisateur existant, AC-6)
  Pas de ligne + au moins 1 etape manquante → OUI (nouvel utilisateur, creer la ligne)
  Ligne existante → OUI (sauf si dismissed)
```

Ce `INSERT` est un write dans une query de lecture -- c'est un side-effect justifie par le besoin de distinguer les utilisateurs existants des nouveaux. Alternative : creer la ligne au signup (mais on n'a pas de hook post-signup avec Neon Auth). Le side-effect est idempotent (`ON CONFLICT DO NOTHING`) et ne se produit qu'une seule fois par utilisateur.

---

## 8. Server action : dismissSetupGuide()

```typescript
// lib/actions/setup-guide.ts
"use server";

import { revalidatePath } from "next/cache";
import { sql } from "@/lib/db";
import { requireAuth } from "@/lib/auth/helpers";

export async function dismissSetupGuide(): Promise<void> {
  const userId = await requireAuth();
  await sql`
    UPDATE setup_guide
    SET dismissed_at = NOW()
    WHERE user_id = ${userId}
  `;
  revalidatePath("/");
}
```

---

## 9. Risques

| Risque | Severite | Mitigation |
|--------|----------|------------|
| Side-effect INSERT dans getSetupGuideData() | Moyen | Idempotent (ON CONFLICT DO NOTHING), se produit 1 seule fois par user. Documente en commentaire. |
| Performance : requete SQL sur chaque page load | Faible | 4 EXISTS (arret au 1er match) + 2 scalar subqueries. < 10ms sur Neon. Next.js cache le layout SSR. |
| Race condition : guide cree entre le check et l'insert | Negligeable | ON CONFLICT DO NOTHING gere ce cas. |
| app/layout.tsx est le root — le fetch impacte toutes les pages | Faible | Le fetch est protege par try/catch, retourne null si non connecte. Les pages publiques ne sont pas impactees. |
| `requireAuth()` throw dans le layout | Moyen | Ne PAS utiliser requireAuth() dans le layout. Utiliser un try/catch autour de `auth.getSession()` directement pour eviter le throw. |

---

## 10. Migration safety assessment

Toutes les operations sont **SAFE** :

| Operation | Type | Risque |
|-----------|------|--------|
| CREATE TABLE setup_guide | Nouvelle table | SAFE — zero impact sur les tables existantes |
| Pas d'ALTER sur des tables existantes | N/A | SAFE |
| Pas de DROP | N/A | SAFE |
| Pas de backfill | N/A | SAFE |

Rollback : `DROP TABLE IF EXISTS setup_guide;` — aucune donnee critique perdue (le guide est un feature d'onboarding).

---

## 11. Hors scope (pour stories futures)

- GUIDE-002 : Detection automatique des etapes (revalidation apres server actions)
- GUIDE-003 : Celebration + relance (animation confetti, reset depuis parametres)
- Swipe-down gesture sur le drag handle (P2)
- Screen reader announcements sur completion d'etape (P2)
- Attention pulse sur le texte de la barre (P3)
