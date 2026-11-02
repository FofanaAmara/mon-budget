import Link from "next/link";
import { getReceivedInvitations } from "@/lib/actions/invitations";
import InvitationResponse from "@/components/spaces/InvitationResponse";
export const dynamic = "force-dynamic";
export default async function InvitationsPage() {
  const { verified, invitations } = await getReceivedInvitations();
  return (
    <div className="space-onboarding">
      <main className="space-onboarding-inner">
        <Link href="/espaces" className="space-back">
          ‹ Mes espaces
        </Link>
        <p className="space-eyebrow">À GÉRER ENSEMBLE</p>
        <h1>Tes invitations.</h1>
        {!verified ? (
          <p className="space-info">
            Ouvre le lien du courriel d’invitation pour rejoindre l’espace.
          </p>
        ) : invitations.length === 0 ? (
          <>
            <p className="space-copy">Tu n’as aucune invitation en attente.</p>
            <Link href="/onboarding" className="space-btn secondary">
              Continuer vers mes espaces
            </Link>
          </>
        ) : (
          invitations.map((invitation) => (
            <section className="space-card" key={invitation.id}>
              <h2>{invitation.spaceName}</h2>
              <p className="space-copy">
                {invitation.inviterName} t’a invité dans cet espace financier.
              </p>
              <InvitationResponse id={invitation.id} />
            </section>
          ))
        )}
      </main>
    </div>
  );
}
