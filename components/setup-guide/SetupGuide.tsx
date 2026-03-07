"use client";

/**
 * SetupGuide — Orchestrator component for the onboarding setup checklist.
 *
 * Renders on ALL authenticated pages (mobile bar + desktop widget).
 * Receives real data from the server via props (fetched in app/layout.tsx).
 *
 * Keyboard: Escape collapses the open sheet/widget.
 *
 * Z-index stack:
 *   Backdrop (mobile): 90
 *   Bottom sheet / Guide bar: 100
 *   Desktop widget: 200
 *   Bottom nav (app): 50
 */

import { useState, useEffect, useCallback, useTransition, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import SetupGuideBar from "./SetupGuideBar";
import SetupGuideSheet from "./SetupGuideSheet";
import type { SetupGuideStepData } from "./SetupGuideStep";
import {
  dismissSetupGuide,
  completeSetupGuide,
} from "@/lib/actions/setup-guide";
import type { GuideData, GuideStepCompletion } from "@/lib/actions/setup-guide";

// ── Static step definitions ──────────────────────────────────────────────────

const STEPS_CONFIG = [
  {
    id: "income" as const,
    title: "Ajouter un revenu r\u00e9current",
    description:
      "Ton salaire ou toute entr\u00e9e d\u2019argent r\u00e9guli\u00e8re.",
    href: "/revenus",
  },
  {
    id: "expense" as const,
    title: "Ajouter une d\u00e9pense r\u00e9currente",
    description: "Loyer, abonnements, assurances...",
    href: "/parametres/charges",
  },
  {
    id: "generate" as const,
    title: "Consulter les d\u00e9penses du mois",
    description:
      "Tes d\u00e9penses r\u00e9currentes apparaissent automatiquement.",
    href: "/depenses",
  },
  {
    id: "pay" as const,
    title: "Marquer une d\u00e9pense pay\u00e9e",
    description: "Confirme un paiement pour voir ton budget bouger.",
    href: "/depenses",
  },
] as const;

/** Total number of steps in the guide. Derived from STEPS_CONFIG. */
export const TOTAL_STEPS = STEPS_CONFIG.length;

// ── Step state computation ──────────────────────────────────────────────────

/**
 * Converts step completion booleans into display state
 * (upcoming | current | completed).
 *
 * The first uncompleted step is 'current', all completed steps are 'completed',
 * all remaining uncompleted steps are 'upcoming'.
 *
 * This handles non-sequential completions (e.g. migration from 4→5 steps
 * where step 1 and 3 may be done but step 2 is not).
 */
function buildStepData(completion: GuideStepCompletion): SetupGuideStepData[] {
  const completionMap: Record<string, boolean> = completion;
  let foundFirstUncompleted = false;
  return STEPS_CONFIG.map((step, i) => {
    const isCompleted = completionMap[step.id];
    let state: "upcoming" | "current" | "completed";
    if (isCompleted) {
      state = "completed";
    } else if (!foundFirstUncompleted) {
      state = "current";
      foundFirstUncompleted = true;
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

// ── Props ────────────────────────────────────────────────────────────────────

type SetupGuideProps = {
  guideData: GuideData | null;
};

// ── Component ────────────────────────────────────────────────────────────────

export default function SetupGuide({ guideData }: SetupGuideProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const shouldAutoOpen = searchParams.get("guide") === "open";
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [, startTransition] = useTransition();
  const hasTriggeredCompletion = useRef(false);

  // Compute derived values from server data
  const completion = guideData?.stepsCompletion;
  const completedCount = completion
    ? Object.values(completion).filter(Boolean).length
    : 0;
  const isCelebration = guideData?.isCompleted ?? false;
  const steps = completion ? buildStepData(completion) : [];

  // First uncompleted step title (for the bar label)
  const nextStep = steps.find((s) => s.state !== "completed");
  const nextStepTitle = nextStep?.title ?? "Terminer la configuration";

  // Auto-expand when arriving from onboarding carousel (?guide=open)
  useEffect(() => {
    if (shouldAutoOpen) {
      setIsExpanded(true);
      window.history.replaceState({}, "", "/");
    }
  }, [shouldAutoOpen]);

  // Auto-expand and persist completion when all steps are done
  useEffect(() => {
    if (isCelebration && !hasTriggeredCompletion.current) {
      hasTriggeredCompletion.current = true;
      setIsExpanded(true);
      startTransition(async () => {
        await completeSetupGuide();
      });
    }
  }, [isCelebration, startTransition]);

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
   * Persists dismissal via server action, then navigates to dashboard.
   */
  const handleCelebrationCTA = useCallback(() => {
    setIsDismissed(true);
    setIsExpanded(false);
    startTransition(async () => {
      await dismissSetupGuide();
      router.push("/");
    });
  }, [router, startTransition]);

  /**
   * Handles step tap — navigates to the step's target page via Next.js router.
   */
  const handleStepClick = useCallback(
    (href: string) => {
      setIsExpanded(false);
      router.push(href);
    },
    [router],
  );

  // Don't render if no data, guide not visible, or dismissed locally
  if (!guideData || !guideData.isVisible || isDismissed) return null;

  const showBar = !isExpanded;

  return (
    <>
      {/* Push FABs up when collapsed guide bar is visible */}
      {showBar && (
        <style>{`
          .fab { bottom: max(137px, calc(121px + var(--safe-bottom))) !important; }
          @media (min-width: 1024px) {
            .fab { bottom: max(72px, calc(56px + var(--safe-bottom))) !important; }
          }
        `}</style>
      )}

      {/* Collapsed bar (shown when sheet is closed) */}
      {showBar && (
        <SetupGuideBar
          nextStepTitle={nextStepTitle}
          completedCount={completedCount}
          totalSteps={TOTAL_STEPS}
          isExpanded={false}
          onClick={() => setIsExpanded(true)}
        />
      )}

      {/* Expanded sheet / widget (shown when isExpanded) */}
      <SetupGuideSheet
        steps={steps}
        completedCount={completedCount}
        totalSteps={TOTAL_STEPS}
        isOpen={isExpanded}
        onClose={() => setIsExpanded(false)}
        onStepClick={handleStepClick}
        isCelebration={isCelebration}
        onCelebrationCTA={handleCelebrationCTA}
      />
    </>
  );
}
