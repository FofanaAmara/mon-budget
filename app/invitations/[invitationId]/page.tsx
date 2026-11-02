import Link from "next/link";
import { notFound } from "next/navigation";
import { getInvitationResponse } from "@/lib/actions/invitations";
import { OpenSpaceButton } from "@/components/spaces/SpaceEntry";
export const dynamic = "force-dynamic";
export default async function InvitationConfirmation({
  params,
}: {
  params: Promise<{ invitationId: string }>;
}) {
  const { invitationId } = await params;
  const result = await getInvitationResponse(invitationId);
  if (!result) notFound();
  return (
    <div className="space-onboarding">
      <main className="space-onboarding-inner">
        <p className="space-eyebrow">MES FINANCES</p>
        <h1>
          {result.accepted
            ? "Bienvenue dans cet espace."
            : "Invitation refusée."}
        </h1>
        <div className="space-context">{result.spaceName}</div>
        <p className="space-copy">
          {result.accepted
            ? "Tu es maintenant membre et tu peux tout gérer avec les autres membres de cet espace."
            : "Aucun accès à cet espace n’a été ajouté."}
        </p>
        {result.accepted && (
          <OpenSpaceButton space={{ id: result.spaceId }}>
            Ouvrir cet espace
          </OpenSpaceButton>
        )}
        <Link prefetch={false} className="space-text-btn" href="/invitations">
          Voir mes invitations
        </Link>
        <Link prefetch={false} className="space-text-btn" href="/espaces">
          Mes espaces
        </Link>
      </main>
    </div>
  );
}
