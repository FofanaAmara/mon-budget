import FinancialSessionBoundary from "@/components/auth/FinancialSessionBoundary";
import { requireIdentity } from "@/lib/spaces/context";
import { redirect } from "next/navigation";
import { getSpaces } from "@/lib/actions/spaces";
import { ChooseSpace } from "@/components/spaces/SpaceEntry";
export const dynamic = "force-dynamic";
export default async function SpacesChoice() {
  const identity = await requireIdentity();
  const spaces = await getSpaces();
  if (!spaces.length) redirect("/onboarding");
  return (
    <FinancialSessionBoundary userId={identity.id}>
      <ChooseSpace spaces={spaces} />
    </FinancialSessionBoundary>
  );
}
