import FinancialSessionBoundary from "@/components/auth/FinancialSessionBoundary";
import { pageIdentity } from "@/lib/spaces/page";
import { redirect } from "next/navigation";
import { getSpaces } from "@/lib/actions/spaces";
import { ChooseSpace } from "@/components/spaces/SpaceEntry";
export const dynamic = "force-dynamic";
export default async function SpacesChoice() {
  const identity = await pageIdentity();
  const spaces = await getSpaces();
  if (!spaces.length) redirect("/onboarding");
  return (
    <FinancialSessionBoundary userId={identity.id}>
      <ChooseSpace spaces={spaces} />
    </FinancialSessionBoundary>
  );
}
