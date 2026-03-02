# Analyse critique de cohérence design — Mes Finances
**Date** : 2026-03-02
**Analyste** : Claude (post-session, basé sur screenshots prod + mockups designer)
**Verdict court** : L'utilisateur a raison sur l'essentiel. Il y a des incohérences réelles. Certaines sont justifiées par le contexte, d'autres ne le sont pas.

---

## Matériaux consultés

| Type | Fichier |
|------|---------|
| Mockup designer — Timeline | `mockups/mockup-timeline.png` |
| Mockup designer — Dépenses | `mockups/mockup-depenses.png` |
| Mockup designer — Revenus | `mockups/mockup-revenus.png` + `mockup-revenus-tab-desktop.png` |
| Mockup designer — Patrimoine actifs | `mockups/mockup-patrimoine-actifs.png` |
| Mockup designer — Patrimoine dettes | `mockups/mockup-patrimoine-passifs.png` |
| Mockup designer — Patrimoine intégré | `mockups/mockup-patrimoine-desktop.png` |
| App production — toutes pages | `screenshots/compare-prod-*.png` |
| project-preferences.md | Stance + patterns documentés |

---

## TL;DR — Verdict par cas

| Cas | Incohérence réelle ? | Intentionnelle ? | Justifiée ? |
|-----|---------------------|-----------------|-------------|
| Timeline vs. Dépenses | ✅ Oui | ✅ Oui | ✅ Oui — purposes différents |
| Dépenses vs. Revenus | ✅ Oui | ❌ Non | ❌ Non — même concept, designs divergents |
| Patrimoine vs. listes transactions | ✅ Oui | ✅ Oui | ✅ Oui — contenu fondamentalement différent |
| Section headers (3 patterns) | ✅ Oui | ❌ Non | ❌ Non — symptôme du design feature-by-feature |
| Actions sur items (3 patterns) | ✅ Oui | ❌ Non | ❌ Non — toggle vs. kebab vs. inline icons |

---

## Analyse page par page

---

### 1. Timeline (Accueil) — Registre "invisible interface"

**Ce que le designer a produit :**
La timeline est un log chronologique — un relevé de compte stylisé. Le mockup montre :
- Des icônes très petites (28–32px circles), presque des "dots"
- Structure ultra-plate : nom + meta + status pill + montant/heure à droite
- Zéro action possible (lecture seule)
- Séparateurs de date comme simples labels de section gris ("Aujourd'hui — 2 mars")
- Registre visuel : "invisible interface" — le contenu flotte, l'UI disparaît

**Ce que l'implémentation a produit :**
Très proche du mockup. Les icônes ont légèrement grossi (32px avec fonds colorés), mais l'esprit est préservé. C'est une réussite fidèle.

**Verdict sur le constat utilisateur :**
L'utilisateur perçoit correctement que la timeline est "épurée" — c'est INTENTIONNEL. Le designer a choisi le registre "invisible interface" pour la timeline dans une page à stance "Typography Monument". La timeline est une vue de lecture, pas d'action. Cette différence est justifiée.

---

### 2. Dépenses — Registre "task management"

**Ce que le designer a produit :**
Le mockup dépenses (voir `mockup-depenses.png`) montre :
- Items groupés dans des cartes avec `border` extérieur (tous les items "En retard" dans 1 carte, les "À venir" dans 1 autre)
- Icônes emoji 44px avec fond coloré (8px radius)
- Headers de groupe : dot coloré + uppercase label + count (simple, pas d'accordion)
- **PAS de bouton toggle** (cercle de validation) sur les items
- Chevron `>` pour ouvrir le détail
- Montant + date de prélèvement

**Ce que l'implémentation a produit :**
- Items avec `borderBottom` entre eux (plus de carte contenante)
- Icons 38px avec fond coloré (proche)
- Headers de groupe : icon + label + count + **total montant** + **chevron collapse** (accordéon) + **3px borderLeft accent**
- **Toggle button circle** ajouté (payée/à venir) — absent du design
- Chevron `>` de navigation conservé
- Filtres par type (Charges/Imprévus) et par section (chips) ajoutés

**Delta designer → implémentation :**
L'implémentation est fonctionnellement plus riche (toggle, total dans le header, accordéon), mais a **divergé du design original**. Le designer ne prévoyait pas de toggle cercle en ligne — l'action de marquer payée devait probablement passer par le bottom sheet. Ce delta est significatif et non documenté.

---

### 3. Revenus (tab Revenus) — Le vrai problème

**Ce que le designer a produit :**
Le mockup revenus (voir `mockup-revenus.png` et `mockup-revenus-tab-desktop.png`) montre :
- Items dans un card container avec border (même pattern que dépenses)
- Icônes avec fond coloré
- Status as labels ("REÇU", "ATTENDU") à côté du nom
- Chevron `>` pour le détail
- Section headers : teal uppercase plain ("REVENUS ATTENDUS (3)")

**Ce que l'implémentation a produit :**
- Items dans un card container (`border: 1px solid var(--slate-100)`) — correct
- Icônes 38px avec fond coloré — correct
- Badge "Reçu" en pill teal filled — léger delta
- **Menu kebab `⋮`** à droite (pas de chevron `>`) — différent de dépenses
- Section header : teal uppercase plain — correct

**Delta Dépenses vs. Revenus dans l'app :**
C'est ici que l'incohérence est la plus visible et la moins justifiable :

| Dimension | Dépenses | Revenus |
|-----------|----------|---------|
| Container items | Rows avec `borderBottom` | Card avec border extérieur |
| Action principale | Toggle circle (paid/unpaid) | Kebab menu `⋮` |
| Navigation item | Chevron `>` visible | Chevron `>` visible (ok) |
| Group header | Accordion icon+count+total+chevron | Label uppercase simple |
| Accent bar groupe | 3px borderLeft coloré | Aucun |

Ces deux pages représentent la **même interaction fondamentale** : "J'ai une liste d'items récurrents que je dois valider chaque mois." Elles auraient dû être conçues avec le même pattern de liste.

**Ce qui a causé cet écart :**
Le `/cs-redesign-experience` traite les features séquentiellement, feature-by-feature. La feature `expense-tracking` a été designée et intégrée avant `income-tracking`. Les patterns créés pour dépenses n'ont pas été systématiquement portés sur revenus. C'est le risque classique du redesign séquentiel sans "cross-feature design review".

---

### 4. Patrimoine — Registre "goal tracker"

**Ce que le designer a produit :**
Le mockup patrimoine (voir `mockup-patrimoine-actifs.png`, `mockup-patrimoine-passifs.png`) montre :
- Items dans des cartes riches (plus de contenu vertical)
- Chaque projet : nom + amount + barre de progression + % + date objectif + suggestion mensuelle
- Chaque dette : nom + amount + taux + remboursé % + barre + mensualité
- **PAS de left border accent** dans le mockup original
- FAB `+` flottant pour les actions
- Onglets "Actifs / Passifs" (tab navigation)

**Ce que l'implémentation a produit :**
- Cards avec **left border teal 3px** (ajouté par l'intégrateur, absent du design)
- Barre de progression teal avec dot indicator
- Actions inline (+, transfer, history, delete) comme icônes dans la card
- La navigation en tabs a été remplacée par des sections stackées (ÉPARGNE / DETTES)

**Sur l'incohérence perçue par l'utilisateur :**
Patrimoine N'EST PAS une liste de transactions. C'est un tableau de bord de projets en cours. Les items ont beaucoup plus de contenu (barre, date, suggestion, actions multiples). Un format "row avec borderBottom" serait trop compressé pour ce contenu. La différence de format est **justifiée**.

Le borderLeft 3px ajouté par l'intégrateur est une addition positive non prévue — elle donne une identité visuelle aux "pots" d'épargne.

---

## Problèmes transversaux (au-delà de ce que l'utilisateur a mentionné)

### Problème A — 3 patterns de section headers

L'app utilise actuellement **3 patterns distincts** pour les mêmes "titres de groupe" :

| Page | Pattern header |
|------|---------------|
| Dépenses | `⚠️ En retard (3)` · `$1 944` · chevron collapse · **3px borderLeft rouge** |
| Revenus | `REVENUS ATTENDUS (2)` — teal uppercase simple |
| Patrimoine | `ÉPARGNE` + bouton `+ Nouveau projet` à droite |

Un pattern cohérent serait souhaitable pour "section label + count + action optionnelle".

### Problème B — 3 patterns d'actions sur items

| Page | Pattern action |
|------|---------------|
| Dépenses | Toggle circle `○/✓` + chevron `>` |
| Revenus | Kebab menu `⋮` |
| Patrimoine | Icônes inline `+ ↺ 🕐 🗑` |

Patrimoine a des actions fondamentalement différentes (volumétriques, irréversibles) donc ses icônes inline sont justifiées. Mais Dépenses / Revenus devraient converger.

### Problème C — Le toggle circle de Dépenses n'est pas dans le design

Le toggle circle (marquer payée/à venir inline) est une addition fonctionnelle de l'intégrateur, absente du mockup. C'est une bonne décision UX — mais elle n'a pas été ajoutée à Revenus (où le même pattern "marquer reçu" existe). Résultat : une feature UX existe dans Dépenses, est absente de Revenus.

### Problème D — Format des montants dans les items : 2 patterns

| Page | Format montant |
|------|---------------|
| Dépenses | `$400` (compact, slate-900 / teal $) |
| Revenus | `$4 200` (compact, teal pour les reçus) |
| Patrimoine | `$1 500` (large, slate-900, pas de $ teal) |

Relativement mineur mais observable.

---

## Analyse de la cause racine

### Pourquoi ces incohérences existent ?

1. **Design feature-by-feature sans cross-review**
   Chaque feature a été designée isolément dans `/cs-redesign-experience`. Le designer produit une solution "localement optimale" sans nécessairement consulter les features déjà designées. Sans revue de cohérence transversale à la fin, les patterns divergent.

2. **project-preferences.md documenté trop tard**
   Le fichier `project-preferences.md` documente les patterns *après* qu'ils ont été créés, pas avant. La section "Liste d'items unifiée" a été ajoutée lors d'un fix de consistance (session précédente), mais ne couvre que revenus/dépenses — pas les variants de section headers.

3. **L'intégrateur a parfois amélioré le design**
   Le toggle circle sur dépenses, le borderLeft sur patrimoine — ce sont des additions de l'intégrateur au-delà du mockup. Elles sont bonnes individuellement, mais non coordonnées avec les autres features.

4. **La stance Typography Monument ne prescrit pas le pattern des listes**
   Le `project-preferences.md` définit très précisément : typographie, couleurs, boutons, hero monument. Mais il ne définit pas un pattern canonique de "liste d'items actionnables". Cette lacune a laissé la porte ouverte aux divergences.

---

## Ce qui est cohérent et bien fait

- ✅ Hero monument (teal, 800w, clamp) — identique sur toutes les pages
- ✅ MonthNavigator — identique sur Accueil, Dépenses, Revenus
- ✅ Sidebar / navigation — identique partout
- ✅ Palette de couleurs — teal, slate, amber respectés
- ✅ Typographie — Plus Jakarta Sans, hiérarchie respectée
- ✅ Label uppercase architecturaux — utilisés correctement
- ✅ Modal/bottom sheet pattern — cohérent
- ✅ FAB (floating action button) — teal, cohérent sur les pages qui l'utilisent

---

## Ce qui devrait être corrigé (dans une prochaine session)

### Priorité 1 — Aligner Revenus sur le pattern Dépenses (ou vice versa)

Choisir UN pattern pour les listes d'items actionnables :
- Container des items (rows borderBottom vs card borderExtérieur)
- Action principale (toggle circle vs kebab)
- Section header pattern

### Priorité 2 — Unifier les section headers

Définir 1 seul composant `SectionGroupHeader` :
```
[icône optionnelle] LABEL (count)   [total montant optionnel]   [CTA optionnel]
```

### Priorité 3 — Documenter le pattern dans project-preferences.md

Avant de corriger quoi que ce soit, définir le pattern cible dans le doc. L'implémentation suit.

---

## Structure du dossier d'analyse

```
cs-design/mes-finances/analysis/
├── design-coherence-analysis.md    ← ce fichier
├── mockups/                         ← screenshots des mockups designer
│   ├── mockup-timeline.png
│   ├── mockup-depenses.png
│   ├── mockup-revenus.png
│   ├── mockup-revenus-tab-desktop.png
│   ├── mockup-patrimoine-actifs.png
│   ├── mockup-patrimoine-passifs.png
│   ├── mockup-patrimoine-desktop.png
│   ├── mockup-dashboard.png
│   ├── mockup-dashboard-mobile.png
│   ├── mockup-reglages.png
│   └── mockup-components.png
└── screenshots/                     ← screenshots de la production actuelle
    ├── compare-prod-accueil.png
    ├── compare-prod-depenses.png
    ├── compare-prod-revenus.png
    ├── compare-prod-projets.png
    ├── compare-prod-parametres.png
    ├── compare-prod-charges.png
    ├── compare-prod-param-revenus.png
    └── compare-prod-sections.png
```
