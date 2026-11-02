import type { ReactNode } from "react";
import FinancialSessionBoundary from "@/components/auth/FinancialSessionBoundary";
import { pageIdentity } from "@/lib/spaces/page";

export default async function PrivateInvitationsLayout({ children }: { children: ReactNode }) {
  const identity = await pageIdentity();
  return <FinancialSessionBoundary userId={identity.id}>{children}</FinancialSessionBoundary>;
}
