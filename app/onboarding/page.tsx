import FinancialSessionBoundary from "@/components/auth/FinancialSessionBoundary";
import { getReceivedInvitations } from "@/lib/actions/invitations";
import { redirect } from "next/navigation";
import { getSpaces } from "@/lib/actions/spaces";
import { pageIdentity } from "@/lib/spaces/page";
import { FirstSpace } from "@/components/spaces/SpaceEntry";
export const dynamic = "force-dynamic";
export default async function Onboarding() {
  const identity = await pageIdentity();
  const spaces = await getSpaces();
  if (spaces.length) redirect("/espaces");
  if ((await getReceivedInvitations()).invitations.length)
    redirect("/invitations");
  return (
    <FinancialSessionBoundary userId={identity.id}>
      <FirstSpace actorKey={identity.id} />
    </FinancialSessionBoundary>
  );
}
