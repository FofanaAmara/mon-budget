# Plan : Integration Neon Auth (Multi-User) — Mon Budget

## Contexte

L'app Mon Budget est actuellement mono-utilisateur sans aucune authentification. Le proprietaire (Amara) veut :
1. Proteger l'acces a l'app avec un login
2. Partager l'app avec sa femme — chacun voit **ses propres donnees**
3. Envoyer le lien a 2-3 amis pour tester — chacun avec son propre compte isole

**Neon Auth** (base sur Better Auth) est le service choisi. Il est manage par Neon et stocke les users/sessions dans le schema `neon_auth` de la base Neon existante.

**Decisions prises :**
- Methode : Email + mot de passe uniquement (pas d'OAuth pour l'instant)
- UI : Composants pre-built Neon Auth (customisable plus tard)
- Isolation : Vrai multi-user — `user_id` sur toutes les tables, chaque requete filtree

---

## Architecture Cible

```
Utilisateur → middleware.ts (session check)
  ├─ Non authentifie → /auth/sign-in (Neon AuthView)
  └─ Authentifie → app normale
       ├─ Server Actions → requireAuth() → user_id
       │   └─ SQL: WHERE user_id = ${userId}
       └─ Client Components → authClient.useSession()
```

**Neon Auth stocke :** users, sessions, tokens dans `neon_auth.*`
**Notre app stocke :** `user_id TEXT NOT NULL` dans toutes les 10 tables applicatives

---

## Phase 1 : Infrastructure Auth

### Objectif
Installer Neon Auth, configurer server/client, middleware, pages auth. Apres cette phase : login/signup fonctionnel, routes protegees, app existante inchangee.

### 1.1 — Installer le package
```bash
npm install @neondatabase/auth@latest
```

### 1.2 — Variables d'environnement

`.env.local` — ajouter :
```
NEON_AUTH_BASE_URL=https://ep-delicate-recipe-aig1ysm0.neonauth.c-4.us-east-1.aws.neon.tech/neondb/auth
NEON_AUTH_COOKIE_SECRET=<generer avec: openssl rand -base64 32>
```

Vercel : ajouter les memes variables dans les settings du projet.

### 1.3 — Fichiers a creer

| Fichier | Role |
|---------|------|
| `lib/auth/server.ts` | Instance auth serveur (`createNeonAuth`) |
| `lib/auth/client.ts` | Instance auth client (`createAuthClient`) |
| `lib/auth/helpers.ts` | Helper `requireAuth()` → retourne `userId` ou throw |
| `app/api/auth/[...path]/route.ts` | Catch-all route pour API auth |
| `middleware.ts` | Protection des routes (redirect vers `/auth/sign-in`) |
| `app/providers.tsx` | `NeonAuthUIProvider` wrapper (client component) |
| `components/LayoutShell.tsx` | Affichage conditionnel du BottomNav (pas sur /auth/*) |
| `app/auth/[path]/page.tsx` | Page sign-in / sign-up / forgot-password (AuthView) |
| `app/account/[path]/page.tsx` | Page gestion du compte (AccountView) |

### 1.4 — Fichiers a modifier

| Fichier | Modification |
|---------|-------------|
| `app/layout.tsx` | Wrapper `<AuthProviders>` + `<LayoutShell>` + `suppressHydrationWarning` |
| `app/globals.css` | Ajouter `@import "@neondatabase/auth/ui/tailwind"` apres `@import "tailwindcss"` |
| `.env.example` | Ajouter les placeholders auth |

### 1.5 — Details cles

**`lib/auth/server.ts`** :
```typescript
import { createNeonAuth } from '@neondatabase/auth/next/server';
export const auth = createNeonAuth({
  baseUrl: process.env.NEON_AUTH_BASE_URL!,
  cookies: { secret: process.env.NEON_AUTH_COOKIE_SECRET! },
});
```

**`lib/auth/helpers.ts`** :
```typescript
import { auth } from './server';
export async function requireAuth(): Promise<string> {
  const { data: session } = await auth.getSession();
  if (!session?.user?.id) throw new Error('Non authentifie');
  return session.user.id;
}
```

**`middleware.ts`** — Matcher qui exclut :
- `_next/static`, `_next/image`, `favicon.ico`
- `manifest.json`, `sw.js`, `icons/` (PWA critique)
- `api/auth` (routes auth elles-memes)
- `auth/` (pages auth)

**`components/LayoutShell.tsx`** — Verifie `pathname.startsWith('/auth')` :
- Si auth page → pas de BottomNav, pas de layout max-w-lg
- Sinon → BottomNav + layout normal

**`app/layout.tsx`** modifie :
```tsx
<html lang="fr" className={geist.variable} suppressHydrationWarning>
  <body>
    <AuthProviders>
      <LayoutShell>{children}</LayoutShell>
    </AuthProviders>
    <ServiceWorkerInit />
  </body>
</html>
```

### 1.6 — Verification
- `npm run build` zero erreur
- L'app redirige vers `/auth/sign-in`
- Creer un compte email+password
- Apres login, redirect vers `/` avec l'app normale
- `manifest.json` et `sw.js` toujours accessibles (PWA ok)
- Pages auth : pas de BottomNav

---

## Phase 2 : Migration Base de Donnees

### Objectif
Ajouter `user_id TEXT NOT NULL` aux 10 tables applicatives. Les donnees existantes (celles d'Amara) recoivent la valeur `'unclaimed'` en attendant d'etre revendiquees.

### 2.1 — Tables a migrer

| Table | Particularite |
|-------|--------------|
| `sections` | Sections budget — 6 par defaut |
| `cards` | Cartes bancaires |
| `expenses` | Definitions depenses (RECURRING, ONE_TIME, PLANNED) |
| `incomes` | Definitions revenus |
| `settings` | Reglages — devient singleton **par user** |
| `monthly_expenses` | Suivi mensuel depenses |
| `monthly_incomes` | Suivi mensuel revenus |
| `savings_contributions` | Historique epargne |
| `push_subscriptions` | Abonnements push |
| `notification_log` | Log notifications |

### 2.2 — Script de migration

**Creer : `scripts/migrate-auth.mjs`**

Pour chaque table :
```sql
ALTER TABLE <table> ADD COLUMN IF NOT EXISTS user_id TEXT;
UPDATE <table> SET user_id = 'unclaimed' WHERE user_id IS NULL;
ALTER TABLE <table> ALTER COLUMN user_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_<table>_user_id ON <table>(user_id);
```

Pour `settings` : index UNIQUE au lieu de simple index (une seule row par user).

### 2.3 — Mettre a jour `supabase/schema.sql`
Ajouter `user_id TEXT NOT NULL` a tous les `CREATE TABLE` pour les futurs deployments from scratch.

### 2.4 — Mettre a jour `lib/types.ts`
Ajouter `user_id: string` a tous les types : `Section`, `Card`, `Expense`, `Income`, `Settings`, `MonthlyExpense`, `MonthlyIncome`, `SavingsContribution`.

### 2.5 — Verification
- Executer `node scripts/migrate-auth.mjs`
- Verifier : `SELECT user_id FROM sections LIMIT 1` → `'unclaimed'`
- L'app fonctionne encore (les actions ne filtrent pas encore par user_id)

---

## Phase 3 : Mise a jour des Server Actions (~46 fonctions)

### Objectif
Chaque action appelle `requireAuth()` et filtre par `user_id`. C'est la phase la plus volumineuse.

### 3.1 — Pattern a appliquer partout

```typescript
// En haut de chaque fonction
const userId = await requireAuth();

// SELECT : ajouter WHERE/AND user_id = ${userId}
// INSERT : ajouter user_id dans les colonnes avec ${userId}
// UPDATE/DELETE : ajouter AND user_id = ${userId}
```

### 3.2 — Fichiers et nombre de fonctions a modifier

| Fichier | Fonctions | Details |
|---------|-----------|---------|
| `lib/actions/sections.ts` | 5 | getSections, create, update, delete, reorder |
| `lib/actions/cards.ts` | 5 | getCards, getById, create, update, delete |
| `lib/actions/expenses.ts` | 14 | getExpenses, create, update, delete, getPlanned, getByCard, getMonthlySummaryBySection, updateSavedAmount, addSavingsContribution, getSavingsContributions, transferSavings, getOrCreateFreeSavings, createAdhocExpense, getExpenseById, getUpcomingExpenses |
| `lib/actions/incomes.ts` | 6 | getIncomes, getMonthlyTotal, create, update, delete, createAdhocIncome |
| `lib/actions/monthly-expenses.ts` | 8 | generate, get, getSummary, markAsPaid, markAsDeferred, markAsUpcoming, autoMarkOverdue, autoMarkPaidForAutoDebit |
| `lib/actions/monthly-incomes.ts` | 4 | generate, getSummary, markReceived, markVariableReceived |
| `lib/actions/settings.ts` | 2 | getSettings (auto-creation par user), updateSettings |
| `app/api/push/subscribe/route.ts` | 1 | Auth check + user_id |
| `app/api/push/send/route.ts` | 1 | Filtrer par user_id |

### 3.3 — Cas speciaux

**`getSettings()`** — Singleton par user avec auto-creation :
```typescript
const userId = await requireAuth();
const rows = await sql`SELECT * FROM settings WHERE user_id = ${userId} LIMIT 1`;
if (rows.length === 0) {
  // Creer settings par defaut pour ce nouvel utilisateur
  return (await sql`INSERT INTO settings (user_id, ...) VALUES (${userId}, ...) RETURNING *`)[0];
}
```

**`getOrCreateFreeSavings()`** — "Epargne libre" scope par user

**`getMonthlySummaryBySection()`** — JOIN sections + expenses, filtrer les deux par `user_id`

**`generateMonthlyExpenses()` / `generateMonthlyIncomes()`** — Appelees depuis page.tsx, appellent `requireAuth()` en interne

### 3.4 — Verification
- `npm run build` zero erreur
- Se connecter → les donnees NE s'affichent PAS (user_id = 'unclaimed' ≠ vrai user_id) — c'est normal, Phase 4 gere ca

---

## Phase 4 : Revendication des Donnees + Onboarding

### Objectif
Permettre a Amara de revendiquer ses donnees existantes. Creer les sections par defaut pour les nouveaux utilisateurs.

### 4.1 — Mecanisme de revendication

**Creer : `lib/actions/claim.ts`**
- `hasOrphanedData()` → verifie si des rows `user_id = 'unclaimed'` existent
- `claimOrphanedData()` → UPDATE les 10 tables, remplacer `'unclaimed'` par le vrai userId

### 4.2 — Banniere de revendication
Dans `app/page.tsx` : si `hasOrphanedData() === true`, afficher une banniere avec bouton "Recuperer mes donnees".

### 4.3 — Onboarding nouveaux utilisateurs
`ensureDefaultSections(userId)` : si le user n'a aucune section, creer les 6 par defaut (Maison, Perso, Famille, Transport, Business, Projets).
Appeler depuis `app/page.tsx`.

### 4.4 — UserButton dans les reglages
Section "Mon compte" en haut de `/parametres` avec `<UserButton>` de Neon Auth.

### 4.5 — Page compte
`app/account/[path]/page.tsx` avec `<AccountView>` — gestion mot de passe, sessions, profil.

### 4.6 — Verification
- Amara se connecte → banniere visible → clique "Recuperer" → donnees apparaissent
- Nouveau compte (femme) → 6 sections par defaut, zero depenses
- Isolation verifiee : les donnees d'un user sont invisibles pour l'autre
- UserButton dans /parametres avec deconnexion fonctionnelle

---

## Phase 5 : Verification Finale + Deploiement

### 5.1 — Build
```bash
npm run build  # zero erreur
```

### 5.2 — Tests manuels page par page avec 2 comptes

| Page | Verification |
|------|-------------|
| `/auth/sign-in` | Formulaire, pas de BottomNav |
| `/auth/sign-up` | Inscription ok, redirect `/` |
| `/` | Dashboard avec donnees du user connecte seulement |
| `/depenses` | Depenses mensuelles filtrees |
| `/revenus` | Revenus mensuels filtres |
| `/projets` | Projets + epargne du user |
| `/parametres` | UserButton + deconnexion |
| `/cartes/[id]` | Impossible d'acceder a la carte d'un autre user |

### 5.3 — Deploiement
```bash
vercel env add NEON_AUTH_BASE_URL
vercel env add NEON_AUTH_COOKIE_SECRET
vercel deploy --prod
```

---

## Resume des fichiers

### A creer (~11)
`lib/auth/server.ts`, `lib/auth/client.ts`, `lib/auth/helpers.ts`, `app/api/auth/[...path]/route.ts`, `middleware.ts`, `app/providers.tsx`, `components/LayoutShell.tsx`, `app/auth/[path]/page.tsx`, `app/account/[path]/page.tsx`, `scripts/migrate-auth.mjs`, `lib/actions/claim.ts`

### A modifier (~14)
`package.json`, `.env.local`, `.env.example`, `app/layout.tsx`, `app/globals.css`, `lib/types.ts`, `supabase/schema.sql`, `lib/actions/sections.ts`, `lib/actions/cards.ts`, `lib/actions/expenses.ts`, `lib/actions/incomes.ts`, `lib/actions/monthly-expenses.ts`, `lib/actions/monthly-incomes.ts`, `lib/actions/settings.ts`, `app/api/push/subscribe/route.ts`, `app/api/push/send/route.ts`, `components/ParametresClient.tsx`, `app/page.tsx`

---

## Pieges identifies

1. **Middleware matcher PWA** : `sw.js`, `manifest.json`, `icons/` DOIVENT etre exclus sinon le PWA casse
2. **`sql` template tag Neon** : ne supporte PAS les noms de table dynamiques — 10 queries explicites dans le claim
3. **CSS globals.css** : l'import Neon Auth doit venir APRES `@import "tailwindcss"` mais AVANT le `:root`
4. **`suppressHydrationWarning`** : requis sur `<html>` car NeonAuthUIProvider utilise next-themes
5. **`getOrCreateFreeSavings()`** : doit etre scope par user sinon pot d'epargne partage
6. **Revendication** : doit etre une action EXPLICITE (pas auto) pour eviter qu'un ami prenne les donnees d'Amara
7. **`generateMonthlyExpenses()` pour un user vide** : doit gerer zero expenses gracieusement
