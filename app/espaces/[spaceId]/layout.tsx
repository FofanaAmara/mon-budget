import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { getSpaces } from "@/lib/actions/spaces";
import { getSettings } from "@/lib/actions/financial/settings";
import { getOrInitSetupGuideData } from "@/lib/actions/financial/setup-guide";
import { SpaceProvider } from "@/components/spaces/SpaceContext";
import FinancialSessionBoundary from "@/components/auth/FinancialSessionBoundary";
import LayoutShell from "@/components/LayoutShell";
import { requireSpace } from "@/lib/spaces/context";

export const dynamic = "force-dynamic";
export default async function FinancialLayout({
  params,
  children,
}: {
  params: Promise<{ spaceId: string }>;
  children: ReactNode;
}) {
  const { spaceId } = await params;
  const { userId } = await requireSpace(spaceId);
  const [spaces, settings, guideData] = await Promise.all([
    getSpaces(),
    getSettings(spaceId),
    getOrInitSetupGuideData(spaceId),
  ]);
  const space = spaces.find((item) => item.id === spaceId);
  if (!space) notFound();
  return (
    <FinancialSessionBoundary userId={userId}>
      <SpaceProvider
        key={spaceId}
        value={{
          spaceId,
          space,
          spaces,
          currency: settings.default_currency ?? "CAD",
        }}
      >
        <LayoutShell guideData={guideData}>{children}</LayoutShell>
      </SpaceProvider>
    </FinancialSessionBoundary>
  );
}
