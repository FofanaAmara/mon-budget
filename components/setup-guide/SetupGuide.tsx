"use client";

/**
 * SetupGuide — Orchestrator component for the onboarding setup checklist.
 *
 * This component manages the collapsed/expanded state and renders the
 * appropriate sub-components. It is designed to be added once to the
 * authenticated layout so it appears on ALL pages.
 *
 * ── MOCKED DATA ──────────────────────────────────────────────────────────────
 * Currently, all data is hardcoded (MOCK_STEPS, MOCK_GUIDE_STATE).
 * The guide always appears and shows step 1 as "current", others as "upcoming".
 *
 * ── WHAT THE DEVELOPER NEEDS TO DO ───────────────────────────────────────────
 * 1. Replace MOCK_STEPS with real data from the server (4 COUNT queries or
 *    a single SQL with 4 EXISTS). Each step's `completed` boolean comes from DB.
 *
 * 2. Replace MOCK_GUIDE_STATE.isVisible with a server check:
 *    - The guide should NOT appear if ALL 4 conditions are already met on first
 *      login (existing user with data). See feature-brief.md § "Utilisateur existant".
 *    - The guide should NOT appear if it was previously dismissed (setup_guide.dismissed_at IS NOT NULL).
 *
 * 3. Replace the `onCelebrationCTA` handler to:
 *    a. Call a server action: dismissSetupGuide() — sets dismissed_at in DB
 *    b. Then navigate to '/' (dashboard)
 *
 * 4. Replace the `handleStepClick` handler to use Next.js router:
 *    import { useRouter } from 'next/navigation'; router.push(href)
 *
 * 5. Add revalidation: after any server action that touches incomes, expenses,
 *    or monthly_expenses, call revalidatePath('/') so the guide re-checks step states.
 *
 * ── DATA INTERFACE ────────────────────────────────────────────────────────────
 * The component expects this shape from the server (replace MOCK_STEPS with this):
 *
 * type GuideStepRaw = {
 *   id: 'income' | 'expense' | 'generate' | 'pay';
 *   completed: boolean; // from DB COUNT query
 * };
 *
 * type GuideState = {
 *   isVisible: boolean; // guide not dismissed + user is "new enough" to see it
 *   isCompleted: boolean; // all 4 steps done (triggers celebration)
 * };
 *
 * Pass them as props: <SetupGuide steps={guideSteps} guideState={guideState} />
 *
 * ── KEYBOARD SHORTCUTS ───────────────────────────────────────────────────────
 * - Escape key collapses the open sheet/widget
 *
 * ── Z-INDEX STACK ────────────────────────────────────────────────────────────
 * Backdrop (mobile): 90
 * Bottom sheet / Guide bar: 100
 * Desktop widget: 200
 * Bottom nav (app): 50
 * → The guide floats above nav but doesn't interfere with desktop sidebar.
 */

import { useState, useEffect, useCallback } from "react";
import SetupGuideBar from "./SetupGuideBar";
import SetupGuideSheet from "./SetupGuideSheet";
import type { SetupGuideStepData } from "./SetupGuideStep";

// ── Mocked data — replace with server props ──────────────────────────────────

/**
 * MOCK: Static step definitions.
 * TODO for developer: derive `completed` from server data.
 * The `state` field is computed below in `buildStepData()`.
 */
const MOCK_STEPS_RAW = [
  {
    id: "income" as const,
    title: "Ajouter un revenu récurrent",
    description: "Ton salaire ou toute entrée d'argent régulière.",
    href: "/revenus",
    completed: false, // TODO: replace with: count(incomes) >= 1
  },
  {
    id: "expense" as const,
    title: "Ajouter une charge fixe",
    description: "Loyer, abonnements, assurances...",
    href: "/parametres",
    completed: false, // TODO: replace with: count(expense_templates) >= 1
  },
  {
    id: "generate" as const,
    title: "Générer le mois courant",
    description: "Crée les dépenses à partir de tes modèles.",
    href: "/depenses",
    completed: false, // TODO: replace with: count(monthly_expenses for current month) >= 1
  },
  {
    id: "pay" as const,
    title: "Marquer une dépense payée",
    description: "Confirme un paiement pour voir ton budget bouger.",
    href: "/depenses",
    completed: false, // TODO: replace with: count(monthly_expenses where is_paid=true, current month) >= 1
  },
];

/**
 * MOCK: Guide visibility state.
 * TODO for developer: replace with server-side check:
 *   - isVisible: guide NOT dismissed (setup_guide.dismissed_at IS NULL) AND user is "new"
 *   - isCompleted: all 4 step conditions return true
 */
const MOCK_GUIDE_STATE = {
  isVisible: true,
  isCompleted: false,
};

// ── Step state computation ────────────────────────────────────────────────────

/**
 * Converts raw step data (completed: boolean) into display state
 * (upcoming | current | completed) based on sequential progression.
 *
 * Logic: the first uncompleted step is 'current', all before it are 'completed',
 * all after are 'upcoming'.
 */
function buildStepData(
  rawSteps: typeof MOCK_STEPS_RAW,
  completedCount: number,
): SetupGuideStepData[] {
  return rawSteps.map((step, i) => {
    let state: "upcoming" | "current" | "completed";
    if (step.completed) {
      state = "completed";
    } else if (i === completedCount) {
      // First uncompleted step = current
      state = "current";
    } else {
      state = "upcoming";
    }
    return {
      id: step.id,
      title: step.title,
      description: step.description,
      href: step.href,
      state,
      index: i + 1,
    };
  });
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function SetupGuide() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // TODO for developer: replace these with props from server
  const rawSteps = MOCK_STEPS_RAW;
  const guideState = MOCK_GUIDE_STATE;

  // Compute derived values
  const completedCount = rawSteps.filter((s) => s.completed).length;
  const isCelebration = guideState.isCompleted || completedCount === 4;
  const steps = buildStepData(rawSteps, completedCount);

  // First uncompleted step title (for the bar label)
  const nextStep = steps.find((s) => s.state !== "completed");
  const nextStepTitle = nextStep?.title ?? "Terminer la configuration";

  // Collapse on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isExpanded) {
        setIsExpanded(false);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isExpanded]);

  /**
   * Handles CTA in celebration view.
   * TODO for developer:
   *   1. Call server action: dismissSetupGuide()
   *   2. Then: router.push('/')
   */
  const handleCelebrationCTA = useCallback(() => {
    setIsDismissed(true);
    setIsExpanded(false);
    // TODO: router.push('/');
    // TODO: dismissSetupGuide() server action
  }, []);

  /**
   * Handles step tap — navigates to the step's target page.
   * TODO for developer: use router.push(href) instead of window.location.href
   */
  const handleStepClick = useCallback((href: string) => {
    setIsExpanded(false);
    // TODO: router.push(href)
    window.location.href = href;
  }, []);

  // Don't render if guide is not visible or was dismissed
  if (!guideState.isVisible || isDismissed) return null;

  return (
    <>
      {/* Collapsed bar (shown when sheet is closed) */}
      {!isExpanded && (
        <SetupGuideBar
          nextStepTitle={nextStepTitle}
          completedCount={completedCount}
          isExpanded={false}
          onClick={() => setIsExpanded(true)}
        />
      )}

      {/* Expanded sheet / widget (shown when isExpanded) */}
      <SetupGuideSheet
        steps={steps}
        completedCount={completedCount}
        isOpen={isExpanded}
        onClose={() => setIsExpanded(false)}
        onStepClick={handleStepClick}
        isCelebration={isCelebration}
        onCelebrationCTA={handleCelebrationCTA}
      />
    </>
  );
}
