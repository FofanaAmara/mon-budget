# Feature Integration Report — Guide de configuration

> Produced by: @design-integrator
> Date: 2026-03-06
> Status: Shell complete — awaiting developer data wiring

---

## 1. What Was Done

### Files Created

| File | Purpose |
|------|---------|
| `components/setup-guide/SetupGuide.tsx` | Orchestrator component — manages state, renders bar + sheet |
| `components/setup-guide/SetupGuideBar.tsx` | Collapsed bar (mobile) + collapsed pill (desktop) |
| `components/setup-guide/SetupGuideSheet.tsx` | Bottom sheet (mobile) + floating card (desktop) |
| `components/setup-guide/SetupGuideStep.tsx` | Individual step row (both mobile/desktop variants) |
| `components/setup-guide/SetupGuideProgressRing.tsx` | SVG progress ring (sm/md/lg sizes) |
| `components/setup-guide/SetupGuideCelebration.tsx` | Celebration view (amber ring, confetti, CTA) |

### Files Modified

| File | Change |
|------|--------|
| `components/LayoutShell.tsx` | Added `<SetupGuide />` inside the authenticated shell |
| `app/globals.css` | Added 6 `@keyframes` animation rules for the guide |

---

## 2. Component Architecture

```
SetupGuide (orchestrator — client component)
│
├── state: isExpanded (boolean)
├── state: isDismissed (boolean)
├── derived: completedCount, steps[], nextStepTitle, isCelebration
│
├── [when !isExpanded]
│   └── SetupGuideBar
│       ├── [mobile < 1024px] Fixed bar above bottom nav (z-index: 100)
│       │   └── SetupGuideProgressRing (size="sm")
│       └── [desktop >= 1024px] Fixed pill bottom-right (z-index: 200)
│           └── SetupGuideProgressRing (size="sm")
│
└── [when isExpanded]
    └── SetupGuideSheet
        ├── [mobile < 1024px] Backdrop + bottom sheet
        │   ├── Drag handle
        │   ├── SetupGuideProgressRing (size="md")
        │   └── [!celebration] SetupGuideStep × 4 (variant="mobile")
        │       OR [celebration] SetupGuideCelebration
        └── [desktop >= 1024px] Floating card (z-index: 200)
            ├── SetupGuideProgressRing (size="lg")
            ├── Collapse button
            ├── SetupGuideStep × 4 (variant="desktop")
            │   OR SetupGuideCelebration
            └── Footer text
```

### Responsive strategy

The bar and sheet each render two variants — mobile and desktop — and use Tailwind's `lg:hidden` / `hidden lg:block` (and `lg:flex`) classes to show only the appropriate one. No JavaScript media query needed.

### Z-index stack (as designed)

| Element | z-index |
|---------|---------|
| Bottom nav | 50 |
| Backdrop (mobile) | 90 |
| Bottom sheet / Guide bar | 100 |
| Desktop widget | 200 |

---

## 3. Mocked Data — What to Replace

### 3.1 Step completion (`MOCK_STEPS_RAW` in `SetupGuide.tsx`)

Each step has a `completed: boolean` field. Currently all hardcoded to `false`.

**Replace with a server query.** Recommended: a single SQL with 4 `EXISTS` sub-queries to avoid N+1.

```typescript
// Server-side query (example structure)
type GuideStepCompletion = {
  income: boolean;    // EXISTS SELECT 1 FROM incomes WHERE user_id = $1
  expense: boolean;   // EXISTS SELECT 1 FROM expenses WHERE user_id = $1 AND is_template = true
  generate: boolean;  // EXISTS SELECT 1 FROM monthly_expenses WHERE user_id = $1 AND month = current_month()
  pay: boolean;       // EXISTS SELECT 1 FROM monthly_expenses WHERE user_id = $1 AND month = current_month() AND is_paid = true
};
```

Pass as props to `SetupGuide`:
```typescript
// Proposed props interface (when developer wires real data)
type SetupGuideProps = {
  stepsCompletion: GuideStepCompletion;
  isVisible: boolean;    // guide not dismissed + user is "new" enough
  isCompleted: boolean;  // all 4 conditions are true
};
```

### 3.2 Guide visibility (`MOCK_GUIDE_STATE` in `SetupGuide.tsx`)

Currently `{ isVisible: true, isCompleted: false }`.

**Replace with a server check.** The guide should NOT appear if:
- `setup_guide.dismissed_at IS NOT NULL` (user dismissed after celebration)
- All 4 step conditions are already met AND the user created their account before the guide feature existed (existing users should not see the guide)

Recommended: a `setup_guide` table per user with `dismissed_at` and `reset_at` columns (see feature-brief.md § Section B for the full DB schema proposal).

### 3.3 Navigation on step click (`handleStepClick` in `SetupGuide.tsx`)

Currently uses `window.location.href = href` (hard navigation). Replace with:

```typescript
import { useRouter } from 'next/navigation';
const router = useRouter();
// In handleStepClick:
router.push(href);
```

### 3.4 Celebration CTA (`handleCelebrationCTA` in `SetupGuide.tsx`)

Currently only sets local state and navigates via `window.location.href`. Replace with:

```typescript
// 1. Call server action to persist dismissal
await dismissSetupGuide(); // sets dismissed_at in setup_guide table
// 2. Navigate to dashboard
router.push('/');
```

---

## 4. Known Gaps — What the Developer Needs to Wire

| Gap | Priority | Notes |
|-----|----------|-------|
| Real step completion data from DB | P0 | 4 EXISTS queries, single roundtrip |
| Guide visibility check (dismissed_at, is_new_user) | P0 | Requires `setup_guide` table (see feature-brief) |
| `dismissSetupGuide()` server action | P0 | Sets `dismissed_at`, triggers revalidatePath |
| Next.js `router.push()` for step navigation | P1 | Replace `window.location.href` in SetupGuide.tsx |
| Auto-detect step completion on page load | P1 | After each relevant server action, call `revalidatePath('/')` so the guide refetches step states |
| Step completion animations (circle spring, checkmark draw) | P2 | Defined in design-spec.md §3.3 — CSS transition stubs are in place, needs JS orchestration |
| Swipe-down gesture on drag handle (mobile) | P2 | Currently tap-only. Add touch event handlers for swipe-down collapse. |
| Attention pulse on next step text (every 8s) | P3 | Subtle CSS animation on the bar text — see design-spec.md §3.6 |
| Relaunch from /parametres | P3 | A button in settings that calls `resetSetupGuide()` server action |
| Screen reader announcements on step completion | P2 | `aria-live` region to announce "Étape complétée. N sur 4." |

---

## 5. Integration Points in Existing App

### Where the guide appears

`LayoutShell.tsx` renders `<SetupGuide />` between `<BottomNav />` and the main content wrapper. This means it appears on every authenticated page automatically. Auth pages (`/auth/*`, `/account/*`, `/landing`) are already excluded via the `isAuthPage` check.

### Revalidation hooks

After any of these server actions, call `revalidatePath('/')` (or the relevant page path) to trigger a re-render of `SetupGuide` with fresh step states:
- `createIncome()` / `deleteIncome()` → step 1
- `createExpense()` / `deleteExpense()` (templates) → step 2
- `generateMonth()` → step 3
- `markAsPaid()` / `markAsUpcoming()` → step 4

### Existing server actions to hook into

| Action | File | Step |
|--------|------|------|
| `markAsPaid` | `lib/actions/monthly-expenses.ts` | Step 4 |
| `markAsUpcoming` | `lib/actions/monthly-expenses.ts` | Step 4 |
| Income creation | `lib/actions/incomes.ts` (TBD) | Step 1 |
| Expense template creation | `lib/actions/expenses.ts` (TBD) | Step 2 |
| Month generation | `lib/actions/monthly-expenses.ts` (TBD) | Step 3 |

---

## 6. Design Fidelity Notes

### What was implemented pixel-perfect
- All 6 component visual states (upcoming/current/completed, collapsed/expanded, mobile/desktop, celebration)
- Progress ring SVG with correct circumference, stroke-dasharray/dashoffset math for all 3 sizes
- All typography: sizes, weights, letter-spacing, line-height from design-spec.md §4
- All color tokens from design-spec.md §5 — using CSS variables from globals.css
- All spacing from design-spec.md §6
- Entrance animations for bar (350ms/800ms delay) and widget (350ms/600ms delay)
- Collapse/expand animations for sheet (350ms) and widget card (250ms)
- CSS-only confetti with 16 particles in brand colors (amber-500, amber-400, teal-700, teal-600, slate-300, slate-400)
- Keyboard navigation (Escape to close, Enter/Space to interact)
- ARIA roles, labels, aria-expanded, aria-modal, role="progressbar"

### Deliberate deviations from design spec

| Deviation | Reason |
|-----------|--------|
| Step navigation uses `window.location.href` instead of Next.js router | Integration boundary — needs developer to add router |
| Guide state is always `isVisible: true` | Mocked — no server check yet |
| All steps are `completed: false` | Mocked — no DB query yet |
| Step completion spring animation not orchestrated | Requires state transition tracking — marked as P2 gap |

---

## 7. Before / After Screenshots

| State | Screenshot |
|-------|-----------|
| Mobile collapsed (bar above bottom nav) | `.tmp/screenshots/after-mobile-collapsed.png` |
| Mobile expanded (bottom sheet) | `.tmp/screenshots/after-mobile-expanded.png` |
| Desktop collapsed (floating pill) | `.tmp/screenshots/after-desktop-collapsed.png` |
| Desktop expanded (floating card) | `.tmp/screenshots/after-desktop-expanded.png` |

---

## 8. CSS Animations Added to globals.css

```css
@keyframes setupGuideBarIn      /* mobile bar entrance: slide-up */
@keyframes setupGuideWidgetIn   /* desktop widget entrance: slide-up + fade */
@keyframes setupGuideSheetIn    /* mobile sheet entrance: slide-up */
@keyframes setupGuideBackdropIn /* mobile backdrop fade-in */
@keyframes setupGuideWidgetExpand /* desktop card expand: scale */
@keyframes setupGuideConfettiFall /* confetti particles fall */
```

All scoped with `setupGuide` prefix to avoid collision with existing animations.
