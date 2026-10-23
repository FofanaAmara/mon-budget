"use client";
import { useState, useRef, useEffect, useLayoutEffect } from "react";
import { createSpace } from "@/lib/actions/spaces";
import { inviteToSpace } from "@/lib/actions/invitations";
import { useSpaceDraftValues } from "./SpaceContext";
import { creationIntent } from "./creation-intent";
import type { FinancialSpace } from "@/lib/spaces/types";

export default function SpaceForm({
  actorKey,
  context,
  first = false,
  onCreated,
  onCancel,
}: {
  actorKey: string;
  context: string;
  first?: boolean;
  onCreated: (space: FinancialSpace) => void;
  onCancel?: () => void;
}) {
  const [name, setName] = useState("");
  const [shared, setShared] = useState<boolean | null>(null);
  const [email, setEmail] = useState("");
  const [stage, setStage] = useState(0);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState<FinancialSpace | null>(null);
  const mounted = useRef(true);
  useLayoutEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const emailField = useRef<HTMLInputElement>(null);
  const intent = useRef<Awaited<ReturnType<typeof creationIntent>> | null>(
    null,
  );
  useSpaceDraftValues({ name, shared, email });
  useEffect(() => {
    if (stage === 1) emailField.current?.focus();
  }, [stage]);
  async function submit() {
    setPending(true);
    setError("");
    let space = created;
    try {
      intent.current ??= await creationIntent(actorKey, context, name);
      if (!space) {
        const result = await createSpace({
          name: name.trim(),
          creationKey: intent.current.key,
        });
        if (!result.ok) {
          setError(result.error);
          return;
        }
        space = result.data;
        setCreated(space);
      }
      if (shared && email.trim()) {
        const invitation = await inviteToSpace(space.id, email);
        if (!invitation.ok) {
          setError(`Ton espace est créé. ${invitation.error}`);
          return;
        }
        if (invitation.data.deliveryStatus !== "sent") {
          setError(
            `Ton espace est créé. ${invitation.data.lastError || "L’invitation est enregistrée et son envoi reste à confirmer."}`,
          );
          return;
        }
      }
      intent.current.clear();
      if (mounted.current) onCreated(space);
    } catch {
      setError(
        space
          ? "Ton espace est créé. L’invitation n’a pas pu être confirmée. Réessaie sans recréer ton espace."
          : "La création n’a pas pu être confirmée. Réessaie : la même demande sera reprise.",
      );
    } finally {
      setPending(false);
    }
  }
  function next(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim()) {
      setError("Donne un nom à ton espace.");
      return;
    }
    if (shared === null) {
      setError("Indique si cet espace sera partagé.");
      return;
    }
    setError("");
    if (shared) setStage(1);
    else void submit();
  }
  return (
    <>
      <div
        className="space-progress"
        aria-label={
          shared ? `Étape ${stage + 1} sur 2` : "Configuration de l’espace"
        }
      >
        <i className="active" />
        {shared && <i className={stage === 1 ? "active" : ""} />}
      </div>
      {stage === 0 ? (
        <form onSubmit={next}>
          <p className="space-copy">
            {first
              ? "Un espace pour tes finances, ou celles que tu partages. Tu pourras en créer d’autres plus tard."
              : "Tes données restent séparées de celles des autres espaces."}
          </p>
          <label className="space-label" htmlFor="space-name">
            NOM DE L’ESPACE
          </label>
          <input
            id="space-name"
            maxLength={80}
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              intent.current = null;
            }}
            placeholder="Ex. Notre couple"
            autoFocus
            disabled={pending}
          />
          <p className="space-hint">
            Choisis un nom qui te ressemble. Tu pourras le modifier.
          </p>
          <fieldset className="space-sharing" disabled={pending}>
            <legend>Est-ce un espace partagé avec d’autres personnes ?</legend>
            <label>
              <input
                type="radio"
                name="shared-space"
                checked={shared === false}
                onChange={() => setShared(false)}
              />
              Non, pour moi uniquement
            </label>
            <label>
              <input
                type="radio"
                name="shared-space"
                checked={shared === true}
                onChange={() => setShared(true)}
              />
              Oui, partager cet espace
            </label>
          </fieldset>
          {error && (
            <p className="space-error" role="alert">
              {error}
            </p>
          )}
          <div className="space-footer">
            {onCancel && (
              <button
                type="button"
                className="space-btn secondary"
                onClick={onCancel}
                disabled={pending}
              >
                Annuler
              </button>
            )}
            <button className="space-btn" disabled={pending || shared === null}>
              {pending
                ? "Création…"
                : shared
                  ? "Continuer"
                  : "Créer mon espace"}
            </button>
          </div>
        </form>
      ) : (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void submit();
          }}
        >
          <div className="space-context">{name}</div>
          <h3>À plusieurs, si tu veux.</h3>
          <p className="space-copy">
            Invite ton conjoint ou une autre personne. Chaque membre pourra tout
            gérer, comme toi.
          </p>
          <label className="space-label" htmlFor="invite-create">
            COURRIEL À INVITER <span>facultatif</span>
          </label>
          <input
            ref={emailField}
            id="invite-create"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="alex@exemple.ca"
            disabled={pending || Boolean(created)}
          />
          <p className="space-hint">
            Tu peux aussi inviter quelqu’un plus tard.
          </p>
          {created && (
            <p className="space-feedback" role="status">
              Ton espace est créé : {created.name}.
            </p>
          )}
          {error && (
            <p className="space-error" role="alert">
              {error}
            </p>
          )}
          <div className="space-footer">
            {!created && (
              <button
                type="button"
                className="space-btn secondary"
                disabled={pending}
                onClick={() => setStage(0)}
              >
                Retour
              </button>
            )}
            <button className="space-btn" disabled={pending}>
              {pending
                ? "En cours…"
                : created
                  ? "Réessayer l’invitation"
                  : email
                    ? "Créer et inviter"
                    : "Créer mon espace"}
            </button>
          </div>
          {created && (
            <button
              type="button"
              className="space-text-btn"
              disabled={pending}
              onClick={() => {
                intent.current?.clear();
                onCreated(created);
              }}
            >
              Continuer dans mon espace
            </button>
          )}
        </form>
      )}
    </>
  );
}
