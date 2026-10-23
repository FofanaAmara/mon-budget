import { pageSpace } from "@/lib/spaces/page";
import { getSpaces } from "@/lib/actions/spaces";
import { getReceivedInvitations } from "@/lib/actions/invitations";
import { requireIdentity } from "@/lib/spaces/context";
import SpacesList from "@/components/spaces/SpacesList";
export const dynamic = "force-dynamic";
export default async function SpacesPage({
  params,
}: {
  params: Promise<{ spaceId: string }>;
}) {
  await pageSpace(params);
  const [spaces, identity, incoming] = await Promise.all([
    getSpaces(),
    requireIdentity(),
    getReceivedInvitations(),
  ]);
  return (
    <SpacesList
      spaces={spaces}
      actorKey={identity.id}
      pendingInvites={incoming.invitations.length}
    />
  );
}
