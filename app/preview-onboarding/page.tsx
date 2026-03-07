"use client";

import OnboardingCarousel from "@/components/onboarding/OnboardingCarousel";

export default function PreviewOnboarding() {
  return (
    <OnboardingCarousel
      onComplete={() => alert("onComplete called — will navigate to dashboard")}
      onSkip={() => alert("onSkip called — will navigate to dashboard")}
    />
  );
}
