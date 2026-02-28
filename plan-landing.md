# Plan : Landing Page — Mes Finances

## Contexte

L'app n'a aucune landing page. Les visiteurs non-connectes accedent directement au dashboard (qui echoue sans session). Il faut une page de conversion orientee inscription, avec des screenshots reels de l'app.

## Architecture

### Routing & Middleware

**Nouveau fichier : `middleware.ts`** (racine du projet)
- Utilise `auth.middleware({ loginUrl: '/landing' })` de `lib/auth/server.ts`
- Les visiteurs non-connectes sont rediriges de `/` (et toutes les routes protegees) vers `/landing`
- `/landing`, `/auth/*`, `/api/auth/*` restent accessibles sans auth

**Modifier : `components/LayoutShell.tsx`** (ligne 8)
- Ajouter `|| pathname === '/landing'` a la condition `isAuthPage`
- La landing page s'affiche sans BottomNav ni sidebar

### Fichiers crees/modifies

| Fichier | Action |
|---------|--------|
| `middleware.ts` | Creer — middleware auth Neon avec redirect vers `/landing` |
| `components/LayoutShell.tsx` | Modifier — ajouter `/landing` aux pages sans nav |
| `app/landing/page.tsx` | Creer — landing page (Server Component) |
| `components/landing/ScrollReveal.tsx` | Creer — mini composant client pour animations au scroll |
| `app/globals.css` | Modifier — CSS phone mockup + landing overrides |
| `public/landing/*.png` | Creer — 4 screenshots capturees via Playwright |

---

## Sections de la Landing Page

### 1. Header sticky (56px)
- Frosted glass (meme style que la nav mobile existante)
- Gauche : logo M + "Mes Finances"
- Droite : "Connexion" (ghost) + "Commencer gratuitement" (btn accent capsule)
- Mobile : seulement logo + CTA

### 2. Hero (~90vh)
- **H1** : "Toute ta vie financiere, claire et sous controle."
- **Sous-titre** : "Depenses, revenus, patrimoine, score de sante — tout dans une app gratuite, simple et privee."
- **CTA** : "Creer mon compte gratuit" (accent, shadow-accent, capsule)
- **Sous CTA** : "Gratuit pour toujours. Aucune carte requise."
- **Visuel** : Phone mockup CSS-only avec screenshot du dashboard
- Desktop : 2 colonnes (texte | mockup). Mobile : empile.
- Animation : fade-in-up stagger (headline 0ms, sous-titre 80ms, CTA 160ms)

### 3. Features (4 cartes, grille 2x2 desktop)
- Fond : `var(--surface-raised)` pour contraste
- Overline : "FONCTIONNALITES" (accent, uppercase, tracking-widest)
- Titre : "Tout ce dont tu as besoin"
- Cartes :
  1. **Suivi des depenses** — "Toutes tes depenses, toujours a jour" + screenshot `/depenses`
  2. **Revenus et solde** — "Revenus attendus vs recus" + screenshot revenus
  3. **Patrimoine net** — "Epargne, dettes, valeur nette" + screenshot `/projets`
  4. **Sante financiere** — "Un score pour ta sante financiere" + screenshot onglet Sante
- Icones : reutiliser les SVG existants de BottomNav.tsx
- Animation : ScrollReveal avec delay stagger par carte

### 4. Comment ca marche (3 etapes)
- Fond : `var(--surface-ground)`
- Overline : "COMMENT CA MARCHE" | Titre : "Simple comme 1, 2, 3"
- Etape 1 : "Cree ton compte" — "Gratuit, en 30 secondes. Email et mot de passe, c'est tout."
- Etape 2 : "Configure tes charges" — "Ajoute tes depenses recurrentes, revenus et objectifs d'epargne."
- Etape 3 : "Reste en controle" — "Chaque mois, tout se genere automatiquement. Tu n'as qu'a suivre."
- Badges numerotes : 48px cercle accent avec chiffre blanc

### 5. Confiance (3 colonnes)
- Fond : `var(--surface-raised)`
- 100% Gratuit (accent-subtle) | Vie privee (positive-subtle) | PWA installable (warning-subtle)

### 6. CTA final
- Fond : gradient indigo (`linear-gradient(145deg, #3D3BF3, #3230D4, #2826B0)`)
- **Titre** : "Prends le controle de tes finances des aujourd'hui."
- **CTA** : bouton blanc avec texte accent
- **Sous CTA** : "Gratuit pour toujours. Sans carte bancaire."

### 7. Footer minimal
- Logo + "© 2026 Mes Finances" + liens Connexion/Inscription

---

## Screenshots a capturer

| Route | Viewport | Fichier | Utilisation |
|-------|----------|---------|-------------|
| `/` (dashboard) | 375x812 | `landing-dashboard.png` | Hero mockup |
| `/depenses` | 375x812 | `landing-depenses.png` | Feature 1 |
| `/projets` | 375x812 | `landing-patrimoine.png` | Feature 3 |
| `/` onglet Sante | 375x812 | `landing-sante.png` | Feature 4 |

Stockage : `/public/landing/`

---

## Approche technique

- **`app/landing/page.tsx`** : Server Component (SEO + perf), pas de data fetching
- **`ScrollReveal.tsx`** : seul composant client (~15 lignes, IntersectionObserver)
- **Phone mockup** : CSS-only (border-radius 36px, bordure noire, Dynamic Island)
- **Images** : Next.js `<Image>` avec `quality={85}`, `priority` pour hero, `lazy` pour le reste
- **Animations** : CSS uniquement (reutilise `fade-in-up` existant + transitions inline)
- **Padding body** : la landing utilise un container pleine page qui gere son propre padding

---

## Verification

1. `npm run build` — zero erreur
2. Playwright : visiter `http://localhost:3000/` non-connecte → redirige vers `/landing`
3. Playwright mobile (375x812) : landing page complete, responsive
4. Playwright desktop (1280x800) : layout 2 colonnes hero, grille features
5. Clic "Creer mon compte gratuit" → arrive sur `/auth/sign-up`
6. Se connecter → redirige vers `/` (dashboard)
7. Deployer Vercel
