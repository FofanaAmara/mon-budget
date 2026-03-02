# Rapport de comparaison — Local vs Production
**Date** : 2026-03-02
**Local** : http://localhost:3000
**Prod** : https://mon-budget-seven.vercel.app

---

## TL;DR

**La version production (Vercel) est plus proche du design redesigné que la version locale (dev mode).**
La version locale est incomplète visuellement — certains styles CSS ne s'appliquent pas correctement en mode développement Next.js.

---

## Différences page par page

### 1. `/` — Accueil (Dashboard)

| Élément | LOCAL | PROD | Correct ? |
|---------|-------|------|-----------|
| Couleur du héros (montant "4 133$") | **Noir/slate-900** | **Teal vert (#0F766E)** | ✅ PROD |
| Onglet actif "Tableau de bord" | Underline teal visible | Underline teal visible | = |
| Sidebar profil | "?" + bouton "Se déconnecter" | Avatar "AT" + nom + email complet | ✅ PROD |
| MonthNavigator flèches | Petites flèches `<` `>` texte | Flèches dans **boîtes bordées carrées** | ✅ PROD |

**Verdict** : Prod correct. Local : le héros est noir alors qu'il devrait être teal (CSS variable `--teal-700` non résolue en dev mode).

---

### 2. `/depenses` — Dépenses

| Élément | LOCAL | PROD | Correct ? |
|---------|-------|------|-----------|
| Accent bar gauche "En retard" | ❌ Absent | ✅ Barre rouge 3px visible | ✅ PROD |
| Icône header "En retard" | Icône générique | Triangle rouge ⚠️ | ✅ PROD |
| Filtre actif "Tout" (pills type/imprévus) | Texte plat, pas de fond | **Pill dark remplie** (fond noir, texte blanc) | ✅ PROD |
| Filtre section actif "Tout" (chips) | Pas de fond visible | Chip dark filled | ✅ PROD |
| Bouton toggle payée (cercle) | ❌ Invisible/absent | ✅ Cercle gris avec checkmark visible | ✅ PROD |
| Chevron (`>`) sur items | ❌ Absent | ✅ Visible (gris droit) | ✅ PROD |
| Barre de progression | Fine, quasi invisible | Visible, teal fill | ✅ PROD |

**Verdict** : Prod est le design correct. Local : 6 traitements visuels manquants.

---

### 3. `/revenus` — Revenus

| Élément | LOCAL | PROD | Correct ? |
|---------|-------|------|-----------|
| Position MonthNavigator | ✅ En premier (avant hero) | ✅ En premier | = |
| Label de section "REVENUS ATTENDUS" | ✅ Teal uppercase 11px | ✅ Teal uppercase 11px | = |
| Icônes items (taille) | ✅ 38px | ✅ 38px | = |
| Séparateur lignes | ✅ borderBottom | ✅ borderBottom | = |
| Badge "Reçu" | Teal text | Pill avec fond | ~ PROD légèrement différent |
| Montant "$4 200" | Bold, teal `$` | Bold, teal `$` | = |

**Verdict** : Les deux versions sont quasi identiques — le fix de consistance a bien été appliqué. Légères nuances de badge "Reçu" (pill vs texte seul).

---

### 4. `/projets` — Patrimoine

| Élément | LOCAL | PROD | Correct ? |
|---------|-------|------|-----------|
| Couleur héros "-$850" (négatif) | **Noir/slate-900** | **Rouge #DC2626** | ✅ PROD |
| Barre de progression épargne | Fine, peu visible | Teal fill visible avec dot indicateur | ✅ PROD |
| Bordure gauche cartes épargne | ❌ Absente | ✅ Bordure teal 3px à gauche | ✅ PROD |
| React error #418 | ❌ Pas présent | ⚠️ Hydratation mismatch | 🐛 BUG PROD |

**Verdict** : Prod correct visuellement mais a une erreur React #418 (hydration mismatch). À corriger.

---

### 5. `/parametres` — Réglages hub

| Élément | LOCAL | PROD | Correct ? |
|---------|-------|------|-----------|
| Aspect général | Identique | Identique | = |

**Verdict** : Aucune différence notable.

---

### 6. `/parametres/charges` — Charges fixes

| Élément | LOCAL | PROD | Correct ? |
|---------|-------|------|-----------|
| Hero monument "2,4k$" | ✅ Correct | ✅ Correct | = |
| React error #418 | ❌ Pas présent | ⚠️ Hydratation mismatch | 🐛 BUG PROD |

**Verdict** : Visuellement identique mais bug React #418 en prod.

---

### 7. `/parametres/revenus` — Revenus récurrents

| Élément | LOCAL | PROD | Correct ? |
|---------|-------|------|-----------|
| Badge "Sources actives" | Dot gris + texte | **Dot teal filled** | ✅ PROD |
| Badge "Variable" | Texte noir plat | **Pill amber** (fond jaune/orange) | ✅ PROD |
| Badge "Depot auto" | Texte + checkmark plat | **Pill teal bordée** avec checkmark | ✅ PROD |
| Heading "MES SOURCES" | Gris/slate | Teal uppercase | ✅ PROD |
| React error #418 | ❌ Pas présent | ⚠️ Hydratation mismatch | 🐛 BUG PROD |

**Verdict** : Prod correct visuellement. Local manque plusieurs traitements de badge.

---

### 8. `/sections` — Mes sections

| Élément | LOCAL | PROD | Correct ? |
|---------|-------|------|-----------|
| Aspect général | Quasi identique | Quasi identique | = |
| React error #418 | ❌ Pas présent | ⚠️ Hydratation mismatch | 🐛 BUG PROD |

---

## Synthèse des différences

### Question 1 : Quelle version est correcte ?
**La version PRODUCTION est plus correcte** — elle reflète fidèlement le design du redesign (Typography Monument stance, accent bars, filled pills, couleurs sémantiques).

### Question 2 : Pourquoi ces différences ?

**Cause principale — CSS custom properties en dev mode** :
Next.js avec Tailwind CSS v4 compile le CSS différemment en développement vs production. En dev mode (HMR/Turbopack), certaines CSS custom properties (`--teal-700`, `--negative`, `--accent`) ajoutées dans `globals.css` ne se propagent pas correctement à tous les composants qui les utilisent en inline styles. En production (build Next.js complet via Vercel), le CSS est intégralement compilé et toutes les variables sont résolues.

**Symptômes** :
- `color: 'var(--teal-700)'` → noir en dev, teal en prod
- `color: 'var(--negative)'` → noir en dev, rouge en prod
- `borderLeft: '3px solid var(--accent)'` → invisible en dev, rouge/teal en prod

**Cause secondaire — Bug hydration React #418 en PROD** :
Plusieurs pages en prod (`/projets`, `/parametres/charges`, `/parametres/revenus`, `/sections`) retournent une erreur React #418 (Minified React error = hydration mismatch). Le HTML serveur ne correspond pas au HTML client. Cela n'affecte pas l'affichage final (React récupère) mais c'est un bug à corriger.

### Question 3 : Comment corriger ?

**Correction A — CSS variables en local** :
Faire un build de production en local (`npm run build && npm start`) pour valider que le code local produit le même résultat que Vercel. Le dev mode ne reflète pas fidèlement le rendu final.

**Correction B — Styles manquants en local** :
Pour certains composants, remplacer les références à `var(--teal-700)` etc. par des valeurs hexadécimales explicites en fallback, ou s'assurer que les variables CSS sont déclarées au niveau `:root` avant que les composants soient chargés.

**Correction C — Hydration mismatch** :
Identifier le code qui génère un rendu différent côté serveur vs côté client (souvent des conditions basées sur `typeof window`, `Date.now()`, ou des props non-serialisables).

---

## Fichiers à investiguer

- `app/globals.css` — vérifier que `--teal-700`, `--negative`, `--accent`, `--positive` sont bien au niveau `:root`
- `components/AccueilClient.tsx` — couleur héros
- `components/DepensesTrackingClient.tsx` — accent bar, filter pills, toggle visibility
- `components/ProjetsEpargneClient.tsx` — couleur héros negative, left border cards
- `components/IncomeTemplateManager.tsx` — badges Variable/Sources actives (hydration)
- `components/SectionsClient.tsx` — hydration mismatch

---

## Mockups de référence

Le design correct est documenté dans :
- `cs-design/mes-finances/features/expense-tracking/mockups/depenses-main.html`
- `cs-design/mes-finances/features/income-tracking/mockups/revenus-tab.html`
- `cs-design/mes-finances/features/patrimoine/mockups/patrimoine-main.html`
- `cs-design/mes-finances/features/dashboard/mockups/dashboard-main.html`
- `cs-design/mes-finances/project-preferences.md`
