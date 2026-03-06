"use client";

import { usePathname } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import SetupGuide from "@/components/setup-guide/SetupGuide";
import type { GuideData } from "@/lib/actions/setup-guide";

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
      <SetupGuide guideData={guideData ?? null} />
      <div className="md:ml-[260px]">
        <div className="max-w-lg mx-auto md:max-w-2xl min-h-dvh relative">
          {children}
        </div>
      </div>
    </>
  );
}
