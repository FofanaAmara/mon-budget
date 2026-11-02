"use client";

import { Suspense } from "react";
import {useFinancialPathname as usePathname} from "@/components/spaces/navigation";
import { MobileSpaceSwitcher } from "@/components/spaces/SpaceSelector";
import BottomNav from "@/components/BottomNav";
import SetupGuide from "@/components/setup-guide/SetupGuide";
import type { GuideData } from "@/lib/spaces/guide";

type LayoutShellProps = {
  children: React.ReactNode;
  guideData?: GuideData | null;
};

export default function LayoutShell({ children, guideData }: LayoutShellProps) {
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
      <MobileSpaceSwitcher />
      <Suspense>
        <SetupGuide guideData={guideData ?? null} />
      </Suspense>
      <div className="md:ml-[260px]">
        <div className="space-product-content max-w-lg mx-auto md:max-w-2xl min-h-dvh relative">
          {children}
        </div>
      </div>
    </>
  );
}
