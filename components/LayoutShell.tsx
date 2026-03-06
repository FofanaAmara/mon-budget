"use client";

import { usePathname } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import SetupGuide from "@/components/setup-guide/SetupGuide";

export default function LayoutShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAuthPage =
    pathname.startsWith("/auth") ||
    pathname.startsWith("/account") ||
    pathname === "/landing";

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <>
      <BottomNav />
      {/*
       * SetupGuide — persistent onboarding checklist.
       * Renders on ALL authenticated pages (mobile bar + desktop widget).
       * Currently uses mocked data — wire real data in SetupGuide.tsx.
       * TODO for developer: pass server-fetched guide state as props.
       */}
      <SetupGuide />
      <div className="md:ml-[260px]">
        <div className="max-w-lg mx-auto md:max-w-2xl min-h-dvh relative">
          {children}
        </div>
      </div>
    </>
  );
}
