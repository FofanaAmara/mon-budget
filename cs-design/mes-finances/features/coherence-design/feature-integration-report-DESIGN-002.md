# Feature Integration Report — DESIGN-002
## Harmoniser le style des cards de la page Patrimoine

**Date :** 2026-03-07
**Story :** DESIGN-002 dans la feature coherence-design
**Integrator :** @design-integrator

---

## 1. Ce qui a ete fait

### Fichiers modifies

| Fichier | Changement |
|---------|-----------|
| `components/projets/SavingsProjectCard.tsx` | Suppression `borderLeft: 4px solid teal`. Ajout icone 36x36 bg `#F0FDFA` stroke `#0F766E`. Prop `isFirst` pour border-top conditionnel. Hover state via onMouseEnter/Leave. |
| `components/projets/DebtCard.tsx` | Suppression `borderLeft: 4px solid error`. Ajout icone 36x36 bg `#FEF2F2` stroke `#DC2626`. Prop `isFirst`. Hover state. |
| `components/projets/EpargneSection.tsx` | Remplacement `gap: 12px` (cards separees) par GroupedContainer (white, border #E2E8F0, border-radius 18px, shadow teal 5%, overflow hidden). FreeSavings est toujours `isFirst={true}`. Projets passent `isFirst={false}`. |
| `components/projets/DettesSection.tsx` | Meme transformation. Empty state : container standalone separe (pas un GroupedContainer vide). |

### Architecture apres

```
EpargneSection
└── div.GroupedContainer (white, border-radius 18px, overflow hidden)
    ├── SavingsProjectCard (freeSavings, isFirst=true)  ← pas de border-top
    ├── SavingsProjectCard (projet 1, isFirst=false)    ← border-top 1px #E2E8F0
    ├── SavingsProjectCard (projet 2, isFirst=false)
    └── ... ou empty state row si projets.length === 0

DettesSection
├── div.GroupedContainer (si debts.length > 0)
│   ├── DebtCard (index 0, isFirst=true)
│   ├── DebtCard (index 1, isFirst=false)
│   └── ...
└── div.EmptyContainer (si debts.length === 0)
```

### Props nouvelles

**SavingsProjectCard :**
- `isFirst?: boolean` — controle si la row a un `borderTop` ou non. Premier item = pas de border. Tous les suivants = `1px solid #E2E8F0`.

**DebtCard :**
- `isFirst?: boolean` — meme logique.

---

## 2. Comportement visuel

### GroupedContainer specs (conformes au handoff)

| Propriete | Valeur |
|-----------|--------|
| Background | `white` |
| Border | `1px solid #E2E8F0` (slate-200) |
| Border-radius | `18px` |
| Box-shadow | `0 1px 2px rgba(15, 118, 110, 0.05)` |
| Overflow | `hidden` |

### GroupedRow specs (conformes au handoff)

| Propriete | Valeur |
|-----------|--------|
| Padding | `14px 16px` |
| Border-top | `1px solid #E2E8F0` (sauf premiere row) |
| Layout | `flex`, `align-items: flex-start`, `gap: 12px` |
| Hover | `background: #F8FAFC` (slate-50), `transition: 150ms` |

### Icones semantiques

| Type | Background container | Stroke icone | Icone |
|------|---------------------|--------------|-------|
| Epargne | `#F0FDFA` (teal-50) | `#0F766E` | Clock (cercle + aiguilles) — semantique progression/temps |
| Dette | `#FEF2F2` (error-light) | `#DC2626` | Dollar sign — semantique finances/paiement |

### Contenu preserve

Tout le contenu existant est inchange :
- Nom du projet / de la dette
- Badges StatusBadge (Permanent, Pot libre, Projet, Dette)
- Date cible (format "Cible : DD MMM YYYY")
- Montant colore (teal-700 epargne, error dettes)
- Boutons action (+ add, transfer, history, delete pour epargne ; $ pay, card charge, edit, delete pour dettes)
- Barre de progression (gradient teal, dot amber)
- Pourcentage de progression
- Chip "X,XX $/mois suggere"
- Mensualite + frequence (dettes)
- "Prelevement auto" label (dettes)

---

## 3. Ce qui reste a faire pour le developpeur

Rien. DESIGN-002 est purement visuel :
- Aucune logique metier modifiee
- Aucune action serveur touchee
- Aucune prop de donnees modifiee
- Les callbacks (onAddSavings, onTransfer, etc.) sont inchanges

---

## 4. Ecarts mockup → code

| Ecart | Description | Raison |
|-------|-------------|--------|
| Icone specifique | Handoff ne precise pas quelle icone utiliser (juste les couleurs du container). Clock pour epargne, dollar pour dette. | Choix semantique de l'integrateur, conforme a l'esprit du handoff. |
| Active/tap scale(0.99) | Non implemente sur la row entiere | Le tap cible les boutons action internes (icon-btn). Scale sur la row ecraserait leur comportement. L'effet scale est deja present sur les icon-btn via CSS global. |

---

## 5. Screenshots

### Avant

- `screenshots/before/patrimoine-desktop-DESIGN-002.png` — Cards individuelles avec bordure gauche teal/rouge
- `screenshots/before/patrimoine-mobile-DESIGN-002.png` — Meme vue mobile

### Apres

- `screenshots/after/patrimoine-desktop.png` — GroupedContainer avec separateurs et icones colorees
- `screenshots/after/patrimoine-mobile.png` — Meme vue mobile

---

## 6. Verification build

`npx next build` : succes. Aucune erreur TypeScript liee a ces changements.
Erreur pre-existante dans `__tests__/unit/utils.test.ts` (TS2783) — non liee, non introduite.
