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

import { useState, useEffect, useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import SetupGuideBar from "./SetupGuideBar";
import SetupGuideSheet from "./SetupGuideSheet";
import type { SetupGuideStepData } from "./SetupGuideStep";
import { dismissSetupGuide } from "@/lib/actions/setup-guide";
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
    title: "Ajouter une charge fixe",
    description: "Loyer, abonnements, assurances...",
    href: "/parametres/charges",
  },
  {
    id: "generate" as const,
    title: "G\u00e9n\u00e9rer le mois courant",
    description:
      "Cr\u00e9e les d\u00e9penses \u00e0 partir de tes mod\u00e8les.",
    href: "/depenses",
  },
  {
    id: "pay" as const,
    title: "Marquer une d\u00e9pense pay\u00e9e",
    description: "Confirme un paiement pour voir ton budget bouger.",
    href: "/depenses",
  },
] as const;

// ── Step state computation ──────────────────────────────────────────────────

/**
 * Converts step completion booleans into display state
 * (upcoming | current | completed) based on sequential progression.
 *
 * The first uncompleted step is 'current', all before are 'completed',
 * all after are 'upcoming'.
 */
function buildStepData(
  completion: GuideStepCompletion,
  completedCount: number,
): SetupGuideStepData[] {
  const completionMap: Record<string, boolean> = completion;
  return STEPS_CONFIG.map((step, i) => {
    const isCompleted = completionMap[step.id];
    let state: "upcoming" | "current" | "completed";
    if (isCompleted) {
      state = "completed";
    } else if (i === completedCount) {
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

// ── Props ────────────────────────────────────────────────────────────────────

type SetupGuideProps = {
  guideData: GuideData | null;
};

// ── Component ────────────────────────────────────────────────────────────────

export default function SetupGuide({ guideData }: SetupGuideProps) {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [, startTransition] = useTransition();

  // Compute derived values from server data
  const completion = guideData?.stepsCompletion;
  const completedCount = completion
    ? Object.values(completion).filter(Boolean).length
    : 0;
  const isCelebration = guideData?.isCompleted ?? false;
  const steps = completion ? buildStepData(completion, completedCount) : [];

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
