import Link from "next/link";
import { getPublicInvitation } from "@/lib/actions/invitations";
import InvitationResponse from "@/components/spaces/InvitationResponse";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Invitation — Mes Finances",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};
export default async function InvitationPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const invitation = await getPublicInvitation(token);
  const callback = encodeURIComponent(`/invitation/${token}`);
  return (
    <div className="space-onboarding">
      <main className="space-onboarding-inner">
        <Link href="/landing" className="space-back">
          Mes Finances
        </Link>
        <p className="space-eyebrow">UN ESPACE À PARTAGER</p>
        {!invitation ? (
          <>
            <h1>Invitation indisponible.</h1>
            <p className="space-copy">
              Ce lien n’est pas valide. Demande au membre qui t’invite de
              vérifier son invitation.
            </p>
          </>
        ) : (
          <>
            <h1>Tu as été invité dans un espace.</h1>
            <div className="space-context">{invitation.spaceName}</div>
            <p className="space-copy">
              {invitation.inviterName} t’invite à gérer ensemble les finances de
              cet espace.
            </p>
            {invitation.status === "pending" ? (
              <>
                {!invitation.authenticated ? (
                  <>
                    <p className="space-copy">
                      Connecte-toi pour accepter l’invitation. Si tu n’as pas
                      encore de compte, crée-en un avec l’adresse qui a reçu ce
                      courriel.
                    </p>
                    <div className="space-footer">
                      <Link
                        prefetch={false}
                        className="space-btn"
                        href={`/auth/sign-in?redirectTo=${callback}`}
                      >
                        Se connecter
                      </Link>
                      <Link
                        prefetch={false}
                        className="space-btn secondary"
                        href={`/auth/sign-up?redirectTo=${callback}`}
                      >
                        Créer un compte
                      </Link>
                    </div>
                  </>
                ) : !invitation.recipientMatches ? (
                  <>
                    <p className="space-error">
                      Ton compte ne correspond pas à l’adresse invitée.
                      Connecte-toi avec le compte qui a reçu ce courriel.
                    </p>
                    <Link
                      className="space-btn secondary"
                      href={`/auth/sign-out?redirectTo=${callback}`}
                    >
                      Changer de compte
                    </Link>
                  </>
                ) : (
                  <InvitationResponse id={invitation.id} token={token} />
                )}
              </>
            ) : (
              <>
                <p className="space-info">
                  {invitation.status === "accepted"
                    ? "Cette invitation a déjà été acceptée."
                    : invitation.status === "declined"
                      ? "Cette invitation a été refusée."
                      : "Cette invitation a expiré. Demande une nouvelle invitation."}
                </p>
                {invitation.status === "accepted" &&
                  invitation.authenticated &&
                  invitation.recipientMatches && (
                    <Link href="/espaces" className="space-btn">
                      Retrouver mes espaces
                    </Link>
                  )}
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}
