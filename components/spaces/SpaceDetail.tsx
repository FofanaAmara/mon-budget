"use client";
import { useState, useTransition } from "react";
import { renameSpace } from "@/lib/actions/spaces";
import {
  inviteToSpace,
  retryInvitationDelivery,
} from "@/lib/actions/invitations";
import { useFinancialRouter } from "./navigation";
import { useSpaceDraft } from "./SpaceContext";
import type { FinancialSpace, SpaceMember } from "@/lib/spaces/types";
import type { InvitationView } from "@/lib/invitations/types";

export default function SpaceDetail({
  space,
  members,
  invitations,
}: {
  space: FinancialSpace;
  members: SpaceMember[];
  invitations: InvitationView[];
}) {
  const router = useFinancialRouter();
  const actorId = members.find((member) => member.isCurrentUser)?.userId || "";
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(space.name);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [pending, start] = useTransition();
  useSpaceDraft((editing && name !== space.name) || Boolean(email));
  return (
    <div className="space-page">
      <button
        className="space-back"
        onClick={() => router.push("/parametres/espace")}
      >
        ‹ Espaces et membres
      </button>
      <p className="space-eyebrow">DÉTAIL DE L’ESPACE</p>
      <h1>{space.name}</h1>
      <p className="space-copy">
        Toutes les finances de cet espace, au même endroit.
      </p>
      {error && (
        <p className="space-error" role="alert">
          {error}
        </p>
      )}
      <section className="space-card">
        <div className="space-row">
          <h2>Nom de l’espace</h2>
          <button
            className="space-text-btn"
            disabled={pending}
            onClick={() => {
              setName(space.name);
              setEditing((value) => !value);
            }}
          >
            Modifier
          </button>
        </div>
        {editing ? (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              setError("");
              start(async () => {
                try {
                  const result = await renameSpace(space.id, name);
                  if (!result.ok) {
                    setError(result.error);
                    return;
                  }
                  setEditing(false);
                  router.refresh();
                } catch {
                  setError("Le nom n’a pas pu être enregistré. Réessaie.");
                }
              });
            }}
          >
            <label className="space-label" htmlFor="rename">
              NOM DE L’ESPACE
            </label>
            <input
              id="rename"
              value={name}
              maxLength={80}
              onChange={(event) => setName(event.target.value)}
              autoFocus
              disabled={pending}
            />
            <button
              className="space-btn"
              style={{ marginTop: 12 }}
              disabled={pending}
            >
              Enregistrer
            </button>
          </form>
        ) : (
          <p>{space.name}</p>
        )}
      </section>
      <section className="space-card">
        <h2>Membres ({members.length})</h2>
        <p className="space-copy">
          Tout le monde a les mêmes droits : finances, invitations et gestion de
          l’espace.
        </p>
        {members.map((member) => (
          <div className="space-member" key={member.userId}>
            <span className="space-avatar" aria-hidden="true">
              {member.name
                .split(" ")
                .map((part) => part[0])
                .slice(0, 2)
                .join("")}
            </span>
            <div>
              <strong>
                {member.name}
                {member.isCurrentUser ? " (toi)" : ""}
              </strong>
              <small>{member.email || "Membre invité"}</small>
            </div>
            <span className="space-member-label">Membre</span>
          </div>
        ))}
      </section>
      <section className="space-card">
        <h2>Inviter une personne</h2>
        <p className="space-copy">
          Elle recevra une invitation par courriel et pourra l’accepter depuis
          son compte.
        </p>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            setError("");
            setFeedback("");
            start(async () => {
              try {
                const result = await inviteToSpace(space.id, email, actorId);
                if (!result.ok) {
                  setError(result.error);
                  return;
                }
                setEmail("");
                if (result.data.deliveryStatus === "sent")
                  setFeedback(
                    "Invitation envoyée. La personne pourra l’accepter depuis son compte.",
                  );
                else
                  setError(
                    result.data.lastError ||
                      "Invitation enregistrée ; envoi à confirmer.",
                  );
                router.refresh();
              } catch {
                setError(
                  "L’invitation n’a pas pu être confirmée. Actualise cette page avant de réessayer.",
                );
              }
            });
          }}
        >
          <label className="space-label" htmlFor="invite-manage">
            COURRIEL
          </label>
          <input
            id="invite-manage"
            type="email"
            required
            maxLength={254}
            placeholder="alex@exemple.ca"
            value={email}
            disabled={pending}
            onChange={(event) => setEmail(event.target.value)}
          />
          <button
            className="space-btn"
            style={{ marginTop: 14 }}
            disabled={pending}
          >
            {pending ? "En cours…" : "Envoyer l’invitation"}
          </button>
        </form>
        {feedback && (
          <p className="space-feedback" role="status">
            {feedback}
          </p>
        )}
        {invitations.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700 }}>
              Invitations en attente
            </h3>
            {invitations.map((invitation) => (
              <div className="space-member" key={invitation.id}>
                <div>
                  <strong>{invitation.recipientEmail}</strong>
                  <small>
                    {invitation.status === "expired"
                      ? "Expirée — crée une nouvelle invitation"
                      : invitation.deliveryStatus === "sent"
                        ? "Courriel envoyé · en attente d’acceptation"
                        : invitation.deliveryStatus === "sending"
                          ? "Envoi en cours"
                          : invitation.lastError || "Envoi à confirmer"}
                  </small>
                </div>
                {invitation.status !== "expired" &&
                  invitation.deliveryStatus !== "sent" &&
                  invitation.deliveryStatus !== "uncertain" && (
                    <button
                      className="space-text-btn"
                      disabled={pending}
                      onClick={() =>
                        start(async () => {
                          try {
                            const result = await retryInvitationDelivery(
                              space.id,
                              invitation.id,
                            );
                            if (!result.ok) setError(result.error);
                            else setFeedback("Invitation envoyée.");
                            router.refresh();
                          } catch {
                            setError(
                              "L’envoi n’a pas pu être confirmé. Réessaie plus tard.",
                            );
                          }
                        })
                      }
                    >
                      Réessayer
                    </button>
                  )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
