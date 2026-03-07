# Design Handoff -- Carousel Educatif Onboarding

## 1. Experience Overview

**Feature** : Carousel educatif pour nouveaux utilisateurs (4 slides, zero saisie)
**Stance** : Typography Monument
**Date** : 2026-03-06
**Designer** : @designer

### User Flow

1. **Entree** -- Premiere connexion apres signup. L'onboarding est plein ecran, le dashboard n'est pas visible derriere.
2. **Slide 1: Bienvenue** -- L'utilisateur voit la tagline "Prends le controle de tes finances." en typographie monumentale sur fond teal. Les mots apparaissent en stagger. Le ton est chaleureux et direct.
3. **Slide 2: Depenses** -- Fond blanc. Titre "Suis chaque dollar, sans effort." a gauche (desktop) ou en haut (mobile). 4 blocs feature en stack avec bordures horizontales. Les blocs font leur entree en stagger.
4. **Slide 3: Patrimoine** -- Fond teal-50 (variation de rythme visuel). Meme structure que slide 2 mais 3 blocs. Titre "Construis, rembourse, progresse."
5. **Slide 4: C'est parti** -- Fond teal. Chiffre "4" monumental en arriere-plan a opacite tres faible. CTA amber "C'est parti !" avec animation spring. Sous-texte mentionne le guide de configuration.
6. **Completion** -- Clic sur "C'est parti !" ou "Passer" = navigation vers le dashboard. L'onboarding ne se reaffiche plus.

### Pourquoi cette experience

- **Carousel plein ecran vs modal/tooltip** : L'onboarding est un moment fondateur. Il merite 100% du viewport. Pas de distraction. L'utilisateur ne peut pas "rater" l'introduction.
- **4 slides exactement** : Au-dela de 5, le taux de drop augmente significativement. 4 = assez pour couvrir les features, pas assez pour ennuyer. La progression dots donne un sentiment de controle.
- **Typography Monument sans illustration** : Coherent avec le design system existant. Les mots portent le sens. Chaque slide est un poster typographique qui communique par le poids et l'echelle, pas par des icones generiques.
- **Alternance fond teal / blanc / teal-50 / teal** : Cree un rythme visuel qui maintient l'interet sans illustration. Le changement de background est le "rebond" visuel entre slides.
- **"Passer" visible partout** : Respect de l'autonomie de l'utilisateur. Pas de pattern manipulatif qui cache le skip.
- **CTA amber sur slide 4** : Suit la regle amber = "milestone moment". L'arrivee au tableau de bord apres l'onboarding est un milestone.

---

## 2. Composants et interactions

### OnboardingCarousel (composant racine)

**Role** : Container plein ecran, gere l'etat du slide actif et la navigation.
**Pattern** : Full-screen carousel overlay (position: fixed, inset: 0, z-index: 9999).

**Etats** :
| Etat | Comportement | Notes |
|------|-------------|-------|
| Default | Affiche slide 1, nav bar en bas | Premiere connexion |
| Slide N active | Track translate a N*100%, dots mis a jour | Transition 580ms ease-out |
| Dragging | Track suit le doigt, pas de transition | Touch events |
| Completed/Skipped | Composant unmount, navigation vers dashboard | Ne se reaffiche plus |

**Interactions** :
- Swipe gauche : slide suivante (seuil 20% viewport width)
- Swipe droite : slide precedente
- Clic "Passer" : skip vers dashboard
- Clic dot : navigation directe au slide
- Clic next (chevron) : slide suivante (cache sur slide 4)
- Clic "C'est parti !" : complete l'onboarding
- Clavier : fleche droite/gauche

### CarouselSlide (x4)

**Role** : Conteneur de contenu pour chaque slide.
**Pattern** : Flex column (mobile) ou flex row (desktop sur slides 2-3).

**Slides specifiques** :

| Slide | Background | Layout mobile | Layout desktop |
|-------|-----------|---------------|----------------|
| 1 Bienvenue | teal-700 | flex-col, justify-end | flex-col, justify-center |
| 2 Depenses | white | flex-col, stack | flex-row, 2 colonnes |
| 3 Patrimoine | teal-50 | flex-col, stack | flex-row, 2 colonnes |
| 4 C'est parti | teal-700 | flex-col, center | flex-col, center |

### CarouselNav (barre de navigation)

**Role** : Navigation entre slides, option skip, indicateur de position.
**Pattern** : Fixed bottom bar (pas le bottom nav de l'app -- c'est l'onboarding propre).

**Children** : [Btn Skip] [Dots] [Btn Next]

**Variante dark** : Sur slides a fond teal (1 et 4), la nav passe en fond teal-800 avec texte/dots blancs.

### FeatureBlock / PatrimoineBlock

**Role** : Bloc feature avec nom + description.
**Pattern** : Stack vertical avec bordure horizontale (top + bottom sur dernier).

**Animation entree** : slideUpFade en stagger, 80-100ms entre chaque bloc, trigger = slide devient active.

---

## 3. Responsive

| Breakpoint | Adaptation | Notes |
|-----------|------------|-------|
| Mobile (320-374px) | Padding reduit (20px), font-sizes reduites | Tout reste lisible |
| Mobile (375px) | Design primaire, padding 28-32px | Reference |
| Tablet/Desktop (768px+) | Slides 2-3 passent en 2 colonnes. Titre a gauche, blocs a droite. Nav padding 48px. | Structure change |
| Large Desktop (1200px+) | Padding 12vw, feature blocs plus grands (18px/15px), headline slide 1 jusqu'a 8rem | Respire davantage |

Changements structurels :
- Slides 2-3 : stack vertical (mobile) -> flex-row 2 colonnes (desktop >= 768px)
- Slide 1 : justify-end avec padding-bottom (mobile) -> justify-center (desktop)
- Slide 1 decorative period : plus grande sur desktop (32rem vs 24rem)
- Nav dots : 10px au lieu de 8px, active width 36px au lieu de 28px (desktop)
- Next button : 48px au lieu de 44px (desktop)

---

## 4. Animations et transitions

| Element | Type | Duree | Easing | Declencheur |
|---------|------|-------|--------|-------------|
| Carousel track | slide-horizontal | 580ms | cubic-bezier(0.22, 1, 0.36, 1) | Swipe / click |
| Slide 1 words | stagger word-reveal (translateY + fade) | 500ms/word | cubic-bezier(0.22, 1, 0.36, 1) | On mount, delay 200-680ms |
| Slide 1 subtitle | fade-in | 600ms | ease | On mount, delay 900ms |
| Slide 2-3 feature blocks | stagger slide-up-fade | 400ms/block | cubic-bezier(0.22, 1, 0.36, 1) | Slide becomes active, delay 150-450ms |
| Slide 4 subtitle | fade-in | 500ms | ease | Slide becomes active, delay 300ms |
| Slide 4 CTA button | scale-in (0.9->1.0, spring) | 500ms | cubic-bezier(0.34, 1.56, 0.64, 1) | Slide becomes active, delay 500ms |
| Dot indicator | width + background | 350ms | cubic-bezier(0.22, 1, 0.36, 1) | Slide change |
| Nav background | background-color | 580ms | cubic-bezier(0.22, 1, 0.36, 1) | Slide change (dark/light) |
| CTA hover | translateY(-2px) + shadow | 200ms | ease | Hover |
| Next button hover | scale(1.05) | 200ms | ease | Hover |

---

## 5. Instructions d'integration

### Priorite d'implementation

1. **Structure** -- Composant OnboardingCarousel full-screen, routing conditionnel (premiere connexion seulement)
2. **Slides** -- 4 slides avec contenu reel (pas de lorem ipsum -- tout le microcopy est fourni)
3. **Navigation** -- Swipe + boutons + dots + keyboard
4. **Responsive** -- Mobile-first (deja dans le mockup), puis breakpoints
5. **Animations** -- Entrance animations par slide, transitions de track

### Mapping mockup -> code

| Element mockup | Composant suggere | Props/State cles |
|---------------|-------------------|-----------------|
| `.onboarding` | `<OnboardingCarousel />` | `onComplete: () => void`, `onSkip: () => void` |
| `.slide` | `<CarouselSlide />` (ou inline) | `isActive: boolean`, `variant: 'welcome' \| 'depenses' \| 'patrimoine' \| 'go'` |
| `.carousel-nav` | Inline dans le carousel | `currentSlide: number`, `isDark: boolean` |
| `.btn-go` | `<button>` avec style amber | onClick = `onComplete` |
| `.btn-skip` | `<button>` style ghost | onClick = `onSkip` |

### Points d'attention

- **Persistence** : L'onboarding doit etre marque comme "complete" ou "skipped" cote serveur. Ne plus jamais le reafficher apres.
- **Detection premiere connexion** : Verifier un flag serveur (ex: `user.onboarding_completed`), pas un flag localStorage.
- **Touch events** : Le swipe doit etre fluide. Le track suit le doigt en temps reel (pas de transition pendant le drag). Threshold = 20% de la largeur du viewport.
- **Safe area** : Sur iOS, le padding-bottom de la nav doit respecter `env(safe-area-inset-bottom)`.
- **Performance** : Les 4 slides sont rendues dans le DOM en meme temps (pas de lazy loading). C'est 4 slides de texte -- pas de ressources lourdes.
- **Transition nav dark/light** : Le fond de la nav bar change avec la meme duree que la transition du track (580ms) pour un effet coordonne.

### Ce qui n'est PAS dans le mockup

- [ ] Server action `completeOnboarding()` pour marquer le flag
- [ ] Condition de rendu dans le layout (afficher le carousel OU le dashboard)
- [ ] Liaison avec le guide de configuration (qui prend le relais apres)
- [ ] Analytics (track quel slide l'utilisateur a vu avant de skip)

---

## 6. Tokens et patterns utilises

**Tokens** :
- Couleurs : `--teal-700`, `--teal-800`, `--teal-50`, `--amber-500`, `--amber-600`, `--slate-900`, `--slate-500`, `--slate-400`, `--slate-200`, `--slate-100`, `--white`
- Shadows : `--shadow-lg` (implicite sur CTA amber)
- Radius : `--radius-md` (12px pour CTA)
- Typography : Plus Jakarta Sans 300-800

**Patterns reutilises** :
- Amber CTA pattern (projet-preferences: amber = milestone moment) -- applique au "C'est parti !"
- Eyebrow label pattern (11px / 700 / uppercase / 0.1em letter-spacing / teal-700)
- Teal-tinted shadows
- Dark nav variant (meme principe que le teal panel des pages auth)

**Nouveaux patterns crees** :
- **Carousel navigation pattern** : dots elongated (8px -> 28px on active) + skip button + next circle button. A reutiliser si d'autres carousels apparaissent.
- **Alternating slide backgrounds** : Sequence teal -> white -> teal-50 -> teal pour creer un rythme visuel sans illustration. Specifique a l'onboarding.
- **Stagger word reveal** : Chaque mot de la headline arrive individuellement avec un delai. Reserve aux moments "hero" (pas pour les pages standard).
