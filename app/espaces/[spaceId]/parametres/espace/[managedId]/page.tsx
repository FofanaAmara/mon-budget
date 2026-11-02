import { notFound } from "next/navigation";
import { pageSpace } from "@/lib/spaces/page";
import { getSpaces, getSpaceMembers } from "@/lib/actions/spaces";
import { getSentInvitations } from "@/lib/actions/invitations";
import SpaceDetail from "@/components/spaces/SpaceDetail";
export const dynamic = "force-dynamic";
export default async function SpaceDetailPage({
  params,
}: {
  params: Promise<{ spaceId: string; managedId: string }>;
}) {
  await pageSpace(params);
  const { managedId } = await params;
  const spaces = await getSpaces();
  const space = spaces.find((item) => item.id === managedId);
  if (!space) notFound();
  const [members, invitations] = await Promise.all([
    getSpaceMembers(managedId),
    getSentInvitations(managedId),
  ]);
  return (
    <SpaceDetail
      key={managedId}
      space={space}
      members={members}
      invitations={invitations}
    />
  );
}
