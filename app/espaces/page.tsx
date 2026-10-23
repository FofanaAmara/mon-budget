import { redirect } from "next/navigation";
import { getSpaces } from "@/lib/actions/spaces";
import { ChooseSpace } from "@/components/spaces/SpaceEntry";
export const dynamic = "force-dynamic";
export default async function SpacesChoice() {
  const spaces = await getSpaces();
  if (!spaces.length) redirect("/onboarding");
  return <ChooseSpace spaces={spaces} />;
}
