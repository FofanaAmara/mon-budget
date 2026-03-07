"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import OnboardingCarousel from "./OnboardingCarousel";
import { markOnboardingSeen } from "@/lib/actions/onboarding-carousel";

/**
 * Client wrapper that connects OnboardingCarousel to the server action.
 * Both onComplete and onSkip trigger the same DB write (mark as seen)
 * then refresh the page to show the dashboard.
 *
 * Best effort: if the server action fails, the user still reaches
 * the dashboard (carousel may reappear on next visit — acceptable for MVP).
 */
export default function OnboardingCarouselWrapper() {
  const router = useRouter();

  const handleDone = useCallback(async () => {
    try {
      await markOnboardingSeen();
    } catch (e) {
      console.error("markOnboardingSeen failed:", e);
    }
    router.refresh();
  }, [router]);

  return <OnboardingCarousel onComplete={handleDone} onSkip={handleDone} />;
}
