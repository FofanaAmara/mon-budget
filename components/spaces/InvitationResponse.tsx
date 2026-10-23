"use client";

import { useState, useTransition } from "react";
import { respondToInvitation } from "@/lib/actions/invitations";
import { OpenSpaceButton } from "./SpaceEntry";
import { useFinancialRouter } from "./navigation";

export default function InvitationResponse({ id }: { id: string }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  const [result, setResult] = useState<{
    spaceId: string;
    spaceName: string;
    accepted: boolean;
  } | null>(null);
  const router = useFinancialRouter();
  function respond(response: "accept" | "decline") {
    setError("");
    start(async () => {
      try {
        const answer = await respondToInvitation(id, response);
        if (!answer.ok) {
          setError(answer.error);
          return;
        }
        setResult(answer.data);
        router.replace(`/invitations/${id}`);
      } catch {
        setError(
          "Ta réponse n’a pas pu être confirmée. Réessaie : elle ne sera pas enregistrée deux fois.",
        );
      }
    });
  }
  if (result)
    return (
      <div aria-live="polite">
        <p className="space-feedback">
          {result.accepted
            ? `Tu as rejoint « ${result.spaceName} ».`
            : "Invitation refusée. Aucun accès à cet espace n’a été ajouté."}
        </p>
        {result.accepted && (
          <OpenSpaceButton space={{ id: result.spaceId }}>
            Ouvrir cet espace
          </OpenSpaceButton>
        )}
      </div>
    );
  return (
    <>
      <p className="space-info">
        Chaque membre a les mêmes droits. L’accès commence après ton
        acceptation.
      </p>
      <div className="space-footer">
        <button
          className="space-btn secondary"
          disabled={pending}
          onClick={() => respond("decline")}
        >
          Refuser
        </button>
        <button
          className="space-btn"
          disabled={pending}
          onClick={() => respond("accept")}
        >
          {pending ? "En cours…" : "Accepter l’invitation"}
        </button>
      </div>
      {error && (
        <p className="space-error" role="alert">
          {error}
        </p>
      )}
    </>
  );
}
