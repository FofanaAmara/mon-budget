import type { ReactNode } from "react";
import FinancialSessionBoundary from "@/components/auth/FinancialSessionBoundary";
import { requireIdentity } from "@/lib/spaces/context";

export default async function PrivateInvitationsLayout({ children }: { children: ReactNode }) {
  const identity = await requireIdentity();
  return <FinancialSessionBoundary userId={identity.id}>{children}</FinancialSessionBoundary>;
}
