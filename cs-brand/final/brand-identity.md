# Brand Identity — Mes Finances
## Direction 4: "Le Compas"

---

## Identity

### Name
**Mes Finances**

### Tagline
**"Tes finances. En clair."**

### Stance
**Radical Simplicity** — We believe financial clarity should be effortless, not earned through complexity. Every screen, every word, every interaction strips away the unnecessary until only understanding remains.

### Archetype
- **Primary: Protecteur (Caregiver)** — The brand exists to shield people from financial anxiety. It watches over your money so you can live your life. Safety, stability, warmth.
- **Secondary: Sage (Sage)** — The brand brings clarity through knowledge. It doesn't just show data — it translates it into understanding. Wisdom without condescension.
- **Personality:** Le grand frere bienveillant qui est bon avec l'argent. Clair, calme, rassurant. Pas condescendant, pas anxiogene.

### Mission
Donner a chaque francophone les outils pour comprendre ou va son argent — sans stress, sans jargon, sans jugement.

### Vision
Un monde ou la clarte financiere n'est pas un privilege, mais un reflexe quotidien.

### Values
1. **Clarte** — Une idee par phrase, un chiffre par ecran. Si c'est pas clair, c'est pas fini.
2. **Bienveillance** — L'argent stresse deja assez. On est la pour rassurer, pas pour juger.
3. **Simplicite radicale** — Chaque fonctionnalite qu'on n'ajoute pas est une victoire.

---

## Logo: Le Compas

### Concept
Le Compas est une courbe de croissance — une ligne confiante qui monte de bas-gauche vers haut-droite, representant la progression financiere. Reguliere, pas volatile. Encadree dans un conteneur protecteur aux coins arrondis (l'archetype Protecteur). Un point ambre au sommet marque l'objectif atteint — la chaleur de l'accomplissement.

### Symbolisme
- **Conteneur arrondi teal** = Protection, securite, cadre bienveillant
- **Courbe ascendante blanche** = Progression financiere, confiance, trajectoire positive
- **Point ambre** = Objectif atteint, accomplissement, chaleur

### Construction
```
Conteneur: rect rx="18", fill="#0F766E"
Courbe: bezier curve, stroke="#FAFBFC", width 4px
Point: circle r="3.5", fill="#F59E0B"
```

### Variantes
| Variante | Fichier | Usage |
|----------|---------|-------|
| Full color | `logo-full-color.svg` | Usage principal, fonds clairs |
| Reversed | `logo-reversed.svg` | Fonds sombres/teal |
| Mono noir | `logo-mono-black.svg` | Impressions N&B, gravure |
| Mono blanc | `logo-mono-white.svg` | Fonds tres sombres |
| Symbol color | `symbol-color.svg` | Favicon, app icon, avatars |
| Symbol reversed | `symbol-reversed.svg` | Icone sur fond sombre |
| Symbol mono noir | `symbol-mono-black.svg` | Watermark, embossage |
| Symbol mono blanc | `symbol-mono-white.svg` | Sur fonds sombres |
| Wordmark color | `wordmark-color.svg` | En-tete, signatures |
| Wordmark reversed | `wordmark-reversed.svg` | Sur fonds sombres |

### Zones de protection
Espace minimum autour du logo = 1x la hauteur du symbole de chaque cote.

### Taille minimum
- Logo complet: 120px de largeur minimum
- Symbole seul: 16px de largeur minimum (favicon)
- Wordmark: 80px de largeur minimum

---

## Color System

### Palette principale

| Token | Hex | Nom | Role |
|-------|-----|-----|------|
| `--teal-700` | `#0F766E` | Deep Teal / Serenite | Primaire — 60%. Le teal profond evoque la stabilite de l'ocean calme. Ni le bleu corporate froid, ni le vert argent cliche. Un entre-deux unique qui dit "je suis fiable ET vivant." |
| `--amber-500` | `#F59E0B` | Amber / Progres | Accent — 10%. L'ambre est la couleur de l'accomplissement. Chaude sans etre agressive. Elle celebre les victoires financieres sans crier. |
| `--teal-50` | `#F0FDFA` | Teal Light | Backgrounds clairs. Teinte subtile qui rappelle la marque sans dominer. |
| `--slate-50` | `#FAFBFC` | Snow | Surface principale. Presque blanc, juste assez chaud pour ne pas etre sterile. |
| `--slate-900` | `#0F172A` | Encre | Texte principal. Noir profond avec une touche de bleu, plus doux qu'un noir pur. |
| `--slate-500` | `#64748B` | Gris doux | Texte secondaire, labels, placeholders. |

### Ratio d'utilisation
**60% Teal** (surfaces de marque, headers, navigation) | **30% Neutrals** (texte, fonds, separateurs) | **10% Amber** (CTAs, succes, points forts)

### Couleurs fonctionnelles
| Etat | Couleur | Usage |
|------|---------|-------|
| Succes | `#059669` (Emerald 600) | Objectif atteint, economies |
| Attention | `#F59E0B` (Amber 500) | Budget proche de la limite |
| Erreur | `#DC2626` (Red 600) | Depassement, erreur |
| Info | `#0F766E` (Teal 700) | Notifications, info |

---

## Typography

### Famille unique: Plus Jakarta Sans
Choisie pour ses terminaisons arrondies qui font echo aux coins du logo. Geometrique mais chaleureuse. Moderne sans etre froide.

### Echelle typographique
| Niveau | Taille | Poids | Letter-spacing | Usage |
|--------|--------|-------|-----------------|-------|
| Display | 48-72px | 800 | -0.03em | Hero, page titles |
| H1 | 36-48px | 700 | -0.02em | Section headings |
| H2 | 24-30px | 700 | -0.02em | Subsection headings |
| H3 | 20-24px | 600 | -0.01em | Card headings |
| Body | 16-18px | 400/500 | 0 | Paragraphes |
| Small | 14px | 400 | 0 | Captions, metadata |
| Label | 12-13px | 600 | 0.08em, uppercase | Tags, badges, labels |

### Fallback
Inter comme font de fallback pour le corps de texte, puis system-ui.

---

## Voice

### Personnalite
Le grand frere bienveillant qui est bon avec l'argent. Il tutoie naturellement. Il explique sans condescendance. Il celebre tes victoires sans en faire trop. Il signale les problemes sans dramatiser.

### Attributs
| Attribut | Niveau (1-10) |
|----------|---------------|
| Expert | 6 |
| Trustworthy | 9 |
| Warm | 8 |
| Clear | 10 |
| Confident | 7 |
| Playful | 4 |

### Regles de voix
1. **Tutoiement** — toujours. "Tu", jamais "vous". Chaleureux, quebecois, jamais formel.
2. **Clair** — une idee par phrase, jamais de jargon financier.
3. **Bienveillant** — encourageant sans etre condescendant.
4. **Direct** — dit ce qui est important en premier.

### DO / DON'T

**DO**
- "Ton mois est sous controle. 847 $ disponibles."
- "Objectif atteint ! Tu as economise 200 $ ce mois-ci."
- "Il te reste 15 jours. Tu es dans les temps."
- "Depense inhabituelle detectee. Ca ressemble a quoi ?"

**DON'T**
- "Felicitations pour votre excellente gestion budgetaire !" (trop formel)
- "ALERTE : Vous avez depasse votre budget !" (anxiogene)
- "Optimisez vos flux de tresorerie" (jargon)
- "Votre solde est insuffisant pour couvrir vos engagements." (froid + jargon)

### Ton par contexte
| Contexte | Ton |
|----------|-----|
| Marketing / Landing | Confiant + chaleureux. "Tes finances. En clair." |
| Product UI | Direct + clair. "847 $ disponibles ce mois-ci." |
| Succes | Celebratoire mais sobre. "Objectif atteint !" |
| Alerte | Calme + informatif. "T'approches de ta limite pour Restos." |
| Erreur | Rassurant. "Quelque chose a bloque. On reessaie ?" |
| Onboarding | Accueillant. "Bienvenue ! On va configurer ton budget en 2 minutes." |

---

## Messaging

### Tagline principale
**"Tes finances. En clair."**

### Proposition de valeur
**"Sais exactement ou va ton argent."**

### Promesse emotionnelle
**"Pas de surprise. Pas de stress. Juste de la clarte."**

### Messages cles
1. **"Tes finances. En clair."** — tagline principale
2. **"Sais exactement ou va ton argent."** — proposition de valeur
3. **"Pas de surprise. Pas de stress. Juste de la clarte."** — promesse emotionnelle
4. **"Ton argent, ton rythme."** — autonomie + respect

---

## CSS Tokens

```css
:root {
  /* Couleurs primaires */
  --teal-700: #0F766E;
  --teal-800: #115E59;
  --teal-50: #F0FDFA;

  /* Accent */
  --amber-500: #F59E0B;

  /* Neutres */
  --slate-900: #0F172A;
  --slate-700: #334155;
  --slate-500: #64748B;
  --slate-200: #E2E8F0;
  --slate-50: #FAFBFC;

  /* Fonctionnelles */
  --success: #059669;
  --warning: #F59E0B;
  --error: #DC2626;

  /* Typographie */
  --font-display: 'Plus Jakarta Sans', system-ui, sans-serif;
  --font-body: 'Inter', system-ui, sans-serif;

  /* Ombres */
  --shadow-sm: 0 1px 2px rgba(15, 118, 110, 0.05);
  --shadow-md: 0 4px 12px rgba(15, 118, 110, 0.08);
  --shadow-lg: 0 8px 24px rgba(15, 118, 110, 0.12);

  /* Radius */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 18px;
}
```

---

## Application Guidelines

### Buttons
- **Primary**: bg teal-700, text white, hover teal-800, radius-md
- **Secondary**: border teal-700, text teal-700, hover bg teal-50, radius-md
- **Accent**: bg amber-500, text slate-900, hover amber-600, radius-md (CTAs importants)

### Cards
- Background: white
- Border: 1px slate-200
- Radius: radius-lg (18px)
- Shadow: shadow-sm, hover shadow-md
- Padding: 24px

### Navigation
- Background: teal-700
- Text: white
- Active indicator: amber-500 underline or dot

### Inputs
- Border: slate-200
- Focus border: teal-700
- Radius: radius-sm
- Label: uppercase, 600 weight, slate-500

---

*Direction 4 — Le Compas*
*Mes Finances Brand Identity*
