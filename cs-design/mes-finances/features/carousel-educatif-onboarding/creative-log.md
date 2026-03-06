# Creative Log -- Carousel Educatif Onboarding

---

## @designer -- 2026-03-06

### Mode
Experience Design (design from scratch, Section A only)

### Stance
Typography Monument -- coherent avec project-preferences. L'onboarding ne deroge pas au stance global.

### Decisions creatives

| Decision | Choix | Raison | Alternative rejetee |
|----------|-------|--------|---------------------|
| Structure | 4 slides plein ecran, carousel horizontal | Brief demande un carousel educatif. Plein ecran = immersion totale, pas de distraction du dashboard | Wizard vertical, modal multi-step |
| Slide backgrounds | teal-700 / white / teal-50 / teal-700 | Sans illustrations, l'alternance de fond EST le rythme visuel. Le pattern ABCA cree une boucle narrative (depart teal = accueil, retour teal = lancement) | Tout blanc (monotone), tout teal (fatiguant) |
| Slide 1 headline | Mots en stagger reveal, taille monumentale (clamp 2.8rem-5.5rem mobile, jusqu'a 8rem desktop) | Typography Monument : le texte est l'architecture. L'animation word-by-word donne du poids a chaque mot. "Prends le controle de tes finances." se lit comme un manifeste | Headline statique (manque d'impact), headline avec typing effect (trop tech-bro) |
| Point decoratif (slide 1) | Character "." en arriere-plan a 4% opacite, taille massive | Seul element decoratif autorise par le stance : un caractere typographique. Le point final evoque la ponctuation du tagline | Aucune decoration (trop austere pour un accueil), gradient (hors stance) |
| Slides 2-3 structure | Eyebrow + titre monumental + feature blocks en stack | Coherent avec le pattern de la app : labels uppercase en teal + titre fort + contenu structure | Cards (hors stance, trop decoratif), liste a puces (trop light) |
| Feature blocks | Bordures horizontales fines (pas de cards) | Cards = decoration. Les lignes horizontales structurent sans decorer. Plus editorial, plus Typography Monument | Cards avec shadow (viole le sacrifice du stance) |
| Slide 4 big number | "4" en arriere-plan a 6% opacite | Marqueur typographique. Rappelle qu'on est au dernier slide. Cree de la profondeur sans illustration | Aucun element background (trop plat) |
| CTA "C'est parti !" | Amber, 18px, 700 weight, spring animation | Amber = milestone (regle project-preferences). Le spring donne une energie de celebration coherente avec le ton "c'est parti" | Teal button (pas un milestone), text link (pas assez d'impact pour la conversion) |
| Nav bar dark/light | Background suit le slide actif (teal-800 sur slides 1+4, blanc sur slides 2+3) | Coherence visuelle : la nav ne "casse" pas l'immersion du slide. Sur un fond teal, une nav blanche serait une rupture | Nav toujours blanche (rupture sur slides teal), nav transparente (problemes de lisibilite) |
| Dots indicator | Pill elongee pour actif (8px -> 28px), ronds pour inactifs | Pattern classique mais efficace. La largeur donne une indication de progression plus forte qu'un simple changement de couleur | Barre de progression (trop lineaire, empeche la navigation libre), numeros (trop informatif) |
| Skip "Passer" | Visible sur tous les slides, texte discret (slate-400) | Respect de l'autonomie. Pas de pattern manipulatif. Discret mais accessible | Visible seulement apres slide 2 (manipulatif), absence (hostile) |

### Patterns cross-feature

- **Amber CTA pattern** : reutilise du guide-configuration (celebration CTA) et project-preferences. Meme box-shadow amber, meme radius 12px.
- **Eyebrow label** : meme pattern que dans les pages existantes (11px/700/uppercase/0.1em/teal-700).
- **Teal-800 dark variant** : coherent avec le teal panel des pages auth (login/signup).
- **Animation easing** : cubic-bezier(0.22, 1, 0.36, 1) = meme easing que les transitions du guide-configuration.

### Livrables

| Fichier | Description |
|---------|-------------|
| `mockups/index.html` | Carousel complet, 4 slides, interactif, responsive (320px-1200px+) |
| `design-handoff.md` | Flow, composants, etats, responsive, animations, instructions integration |
| `creative-log.md` | Ce fichier |

---

## @design-integrator -- 2026-03-06

### Mode
Feature Integration (new component — visual shell from scratch)

### Fichiers modifies/crees

| Fichier | Action |
|---------|--------|
| `components/onboarding/OnboardingCarousel.tsx` | Cree — composant principal + 4 sub-composants inline |
| `app/globals.css` | Modifie — section ONBOARDING CAROUSEL appendee (apres SETUP GUIDE) |

### Decisions d'integration

| Decision | Choix | Raison |
|----------|-------|--------|
| Sub-composants inline vs fichiers separes | Inline dans le meme fichier | 4 slides, logique etroitement couplee. Pas de raison de fragmenter en 4 fichiers distincts. Pattern coherent avec les autres composants simples du projet. |
| Trigger animation: classes CSS vs inline styles | Classes CSS (`onboarding-word--visible` etc.) | Permet au CSS de gerer les keyframes et delays. L'etat React toggle la classe, le CSS fait le reste. Pattern propre, separtion des responsabilites. |
| `activatedSlides` Set vs simple `currentSlide` | Set pour tracker tous les slides vus | Une fois un slide active, son animation ne doit pas se re-jouer si l'utilisateur revient en arriere. Le Set preserve l'etat "vu" indifferemment de la navigation. |
| Placement animations dans `globals.css` | Section appendee avec commentaire bloc | Coherent avec le pattern `setupGuide` existant. Prefix `onboarding-` sur tous les keyframes et classes pour isolation. |
| Test page temporaire | Cree puis supprime | Necessaire pour les screenshots. Supprimee apres validation. La page etait protegee par auth donc login Playwright requis. |

### Ecarts mockup -> code

| Element | Mockup | Code | Raison |
|---------|--------|------|--------|
| `.word` via `::before`/`::after` | Non applicable (HTML pur) | Classes React (`onboarding-word--1` etc.) | React ne peut pas appliquer `:nth-child` sur des elements dynamiques comme le HTML pur. Classes numerotees a la place. |
| `slide.classList.add('active')` | JavaScript imperatif | State React (`activatedSlides` Set) | Pattern React idiomatique. Meme comportement final. |
| `nav.classList.add('dark')` | JavaScript imperatif | `isDark` derive de `DARK_NAV_SLIDES.has(currentSlide)` | Meme logique, approche declarative React. |

### Known gaps documentees

Voir `feature-integration-report.md` — section 5. Resumé:
1. Server action `markCarouselSeen()` à créer
2. DB column `onboarding_carousel_seen` à migrer
3. Condition de rendu dans le layout (server component)
4. Navigation post-action (router.push vers dashboard)
5. Coexistence avec ONBOARD-002 (guide de configuration)

### Cross-reference
Rapport complet: `feature-integration-report.md`
Screenshots: `.tmp/screenshots/onboarding/` (mobile + desktop, 4 slides chacun)
