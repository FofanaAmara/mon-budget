# Feature Integration Report — Carousel Educatif Onboarding

**Date:** 2026-03-06
**Agent:** @design-integrator
**Feature:** carousel-educatif-onboarding
**Story:** ONBOARD-001
**Status:** Integration complete — visual shell ready for developer wiring

---

## 1. Files Created / Modified

### Created

| File | Role |
|------|------|
| `components/onboarding/OnboardingCarousel.tsx` | Main carousel component — full visual shell |
| `app/globals.css` (append) | CSS animations + layout classes with `onboarding-` prefix |

### Not modified

- `app/layout.tsx` — Developer handles rendering condition
- `app/page.tsx` — Developer handles DB detection and routing
- Any server actions — Developer wires `completeOnboarding()` and `skipOnboarding()`

---

## 2. Component Architecture

### `OnboardingCarousel` (default export)

**Location:** `components/onboarding/OnboardingCarousel.tsx`
**Directive:** `"use client"` — requires state for slide tracking and touch events

```tsx
// Props
type Props = {
  onComplete: () => void;  // Called when user clicks "C'est parti !" — mark onboarding complete
  onSkip: () => void;      // Called when user clicks "Passer" — mark onboarding skipped
};

// Usage
<OnboardingCarousel onComplete={handleComplete} onSkip={handleSkip} />
```

**Internal state:**
- `currentSlide: number` — index 0-3 of the active slide
- `activatedSlides: Set<number>` — tracks which slides have been visited (for entrance animations — once a slide is activated, it never re-animates)
- `isDragging: boolean` — disables CSS transition during swipe
- `dragOffset: number` — pixel offset during drag (converted to %)

**Interactions implemented:**
- ArrowRight / ArrowLeft keyboard navigation
- Touch swipe (touchstart / touchmove / touchend) with 20% viewport threshold
- Dot navigation (click any dot)
- Next button (hidden on last slide)
- Skip button (calls `onSkip`)
- CTA button on slide 4 (calls `onComplete`)

### Sub-components (defined in same file)

| Component | Slide | Notes |
|-----------|-------|-------|
| `SlideWelcome` | Slide 1 | `isActive` drives stagger word animations |
| `SlideDepenses` | Slide 2 | `isActive` drives feature block stagger |
| `SlidePatrimoine` | Slide 3 | `isActive` drives patrimoine block stagger |
| `SlideGo` | Slide 4 | `isActive` drives subtitle + CTA animations. Receives `onComplete` |

All sub-components receive `isActive: boolean`, `slideIndex: number`, `currentSlide: number` for ARIA visibility.

---

## 3. CSS Architecture

All styles are in `app/globals.css` under the `ONBOARDING CAROUSEL` section comment (appended after the `SETUP GUIDE` section).

**Naming convention:** `onboarding-` prefix on all classes (consistent with `setupGuide` prefix pattern already in use).

**Keyframes defined:**
| Keyframe | Used by | Effect |
|----------|---------|--------|
| `onboardingWordReveal` | Slide 1 headline words | translateY(20px→0) + fade |
| `onboardingFadeIn` | Slide 1 subtitle, Slide 4 subtitle | opacity 0→1 |
| `onboardingSlideUpFade` | Slides 2-3 feature blocks | translateY(12px→0) + fade |
| `onboardingScaleIn` | Slide 4 CTA button | scale(0.9→1) + fade, spring easing |

**Animation trigger mechanism:** CSS classes toggled by React state.
- `onboarding-word--visible` — added when `isActive` becomes true. The word stays animated (no re-trigger on back-navigation). `animation-delay` set per-word via CSS: `onboarding-word--1` through `--5`.
- Same pattern for feature blocks (`onboarding-feature-block--visible`), patrimoine blocks, subtitle, and CTA button.

**Responsive breakpoints:**
- Default: mobile-first (375px reference, 320px fallback via `max-width: 374px` query)
- `@media (min-width: 768px)`: slides 2-3 switch to `flex-row` two-column layout
- `@media (min-width: 1200px)`: wider padding (`12vw`), larger type on slide 1

---

## 4. Static Data (To Remain Static)

The following content is hardcoded in the component. It should NOT be pulled from a DB or CMS — this is educational copy that changes with the product, not with the user:

**Slide 2 — Feature blocks (4 items):**
- Revenus recurrents
- Charges fixes
- Generation automatique
- Depenses imprevues

**Slide 3 — Patrimoine blocks (3 items):**
- Projets d'epargne
- Epargne libre
- Suivi des dettes

All copy matches the design handoff and ONBOARD-001 AC exactly.

---

## 5. Known Gaps — Developer TODOs

These are intentionally outside the visual shell. The developer must implement:

### Priority 1 — Required for AC compliance

| # | Gap | Location | Notes |
|---|-----|----------|-------|
| 1 | **Server action `completeOnboarding()`** | To create in `lib/actions/onboarding.ts` (or extend existing) | Sets `onboarding_completed = true` on the user record. Must be idempotent. |
| 2 | **Server action `skipOnboarding()`** | Same file | Same flag — skip = complete for DB purposes |
| 3 | **DB column** | User table migration | Add `onboarding_carousel_seen: boolean DEFAULT false` (or reuse existing onboarding flag if applicable — coordinate with ONBOARD-002) |
| 4 | **Rendering condition in layout** | `app/layout.tsx` or `app/page.tsx` | After auth, check `user.onboarding_carousel_seen`. If false → render `<OnboardingCarousel>`. If true → render normal dashboard. |
| 5 | **Post-action navigation** | In the callbacks passed to the component | After `onComplete` or `onSkip` succeeds: navigate to `/` (or wherever the dashboard lives). Use `router.push` or `window.location.href`. |

### Priority 2 — Edge cases from ONBOARD-001

| # | Gap | Notes |
|---|-----|-------|
| 6 | **Existing users migration** | Users who already have data (pre-refonte) must be marked as `carousel_seen = true` in the migration script. They must NOT see the new carousel. |
| 7 | **Error handling** | If the server action fails (network error), the user should still reach the dashboard. Add a try/catch in the layout callback — best effort marking, always proceed to dashboard. |
| 8 | **Analytics** | Track which slide the user was on when they skipped (from ONBOARD-001 edge cases). Pass `currentSlide` value to the skip action if analytics are added later. |

### Priority 3 — Integration with ONBOARD-002

| # | Gap | Notes |
|---|-----|-------|
| 9 | **Guide de configuration** | Slide 4 subtitle references "Le guide de configuration va t'accompagner pas a pas." The guide must activate after the carousel completes. Coordinate with ONBOARD-002 spec. |

---

## 6. How to Integrate (Step-by-Step for the Developer)

1. **Create/migrate DB column:** Add `onboarding_carousel_seen` boolean to the user table. Set to `true` for all existing users.

2. **Create server actions:**
```ts
// lib/actions/onboarding.ts (new function or extend existing)
export async function markCarouselSeen(): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: 'Unauthenticated' };
  await db.update(users).set({ onboardingCarouselSeen: true }).where(eq(users.id, user.id));
  return { success: true };
}
```

3. **Wire into the layout:**
```tsx
// In app/layout.tsx (server component) or app/page.tsx
const user = await getCurrentUser();
if (!user.onboardingCarouselSeen) {
  return <OnboardingCarouselPage />;
}
// ... normal render
```

4. **Create the carousel page client component:**
```tsx
// app/(some-wrapper)/OnboardingCarouselPage.tsx
"use client";
import { useRouter } from 'next/navigation';
import OnboardingCarousel from '@/components/onboarding/OnboardingCarousel';
import { markCarouselSeen } from '@/lib/actions/onboarding';

export default function OnboardingCarouselPage() {
  const router = useRouter();

  async function handleComplete() {
    await markCarouselSeen();
    router.push('/');
  }

  async function handleSkip() {
    await markCarouselSeen();
    router.push('/');
  }

  return <OnboardingCarousel onComplete={handleComplete} onSkip={handleSkip} />;
}
```

---

## 7. Mockup Fidelity

| Aspect | Status | Notes |
|--------|--------|-------|
| Slide 1 — teal background, monumental type | Pixel-perfect | Headline stagger matches exactly |
| Slide 1 — decorative `.` character | Pixel-perfect | 4% opacity, massive size, top-right |
| Slide 2 — white bg, 2-col desktop | Pixel-perfect | Two-column activates at 768px |
| Slide 2 — feature blocks with top/bottom borders | Pixel-perfect | `border-top` on each + `border-bottom` on last |
| Slide 3 — teal-50 bg, patrimoine blocks | Pixel-perfect | Teal-tinted borders |
| Slide 4 — teal bg, faint "4", amber CTA | Pixel-perfect | Spring animation on CTA |
| Nav — dark on slides 1+4, light on slides 2+3 | Pixel-perfect | 580ms transition coordinated with track |
| Dots — pill shape on active, round on inactive | Pixel-perfect | 8px→28px (mobile), 10px→36px (desktop) |
| Swipe threshold | Exact | 20% viewport width |
| All easing curves | Exact | cubic-bezier(0.22, 1, 0.36, 1) for transitions, (0.34, 1.56, 0.64, 1) for CTA spring |
| Responsive (mobile/tablet/desktop/large) | Pixel-perfect | All 4 breakpoints implemented |

**Only deviation from mockup:** The `N` user avatar from the app shell appears over the carousel in the test environment. This is a test artifact (preview page inside authenticated app layout). In production, the carousel will be rendered before the app layout shows, so the avatar will not be present.

---

## 8. Before / After Screenshots

**Location:** `.tmp/screenshots/onboarding/`

| File | Content |
|------|---------|
| `mobile-slide1.png` | Slide 1 — Bienvenue, 375px |
| `mobile-slide2.png` | Slide 2 — Depenses, 375px |
| `mobile-slide3.png` | Slide 3 — Patrimoine, 375px |
| `mobile-slide4.png` | Slide 4 — C'est parti, 375px |
| `desktop-slide1.png` | Slide 1 — Bienvenue, 1280px |
| `desktop-slide2.png` | Slide 2 — Depenses, 1280px (2-col layout) |
| `desktop-slide3.png` | Slide 3 — Patrimoine, 1280px (2-col layout) |
| `desktop-slide4.png` | Slide 4 — C'est parti, 1280px |

No "before" screenshots — this is a new component with no prior state.
