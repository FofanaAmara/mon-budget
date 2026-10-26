import FinancialSessionBoundary from "@/components/auth/FinancialSessionBoundary";
import { getReceivedInvitations } from "@/lib/actions/invitations";
import { getSpaces } from "@/lib/actions/spaces";
import { pageIdentity } from "@/lib/spaces/page";
import { FirstSpace } from "@/components/spaces/SpaceEntry";
import OnboardingEntry from "@/components/spaces/OnboardingEntry";
export const dynamic = "force-dynamic";
export default async function Onboarding() {
  const identity = await pageIdentity();
  const spaces = await getSpaces();
  const destination = spaces.length
    ? "/espaces"
    : (await getReceivedInvitations()).invitations.length
      ? "/invitations"
      : null;
  return (
    <FinancialSessionBoundary userId={identity.id}>
      <OnboardingEntry destination={destination}>
        <FirstSpace actorKey={identity.id} />
      </OnboardingEntry>
    </FinancialSessionBoundary>
  );
}
