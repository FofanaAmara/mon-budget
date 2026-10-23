"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useTransition,
  type FormEvent,
} from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth/client";
import { invalidateFinancialViews } from "@/lib/auth/financial-visibility";
import {
  requestInvitationVerification,
  verifyInvitationEmail,
} from "@/lib/actions/invitation-verification";

export default function InvitationVerification({ token, actorId }: {
  token: string;
  actorId: string;
}) {
  const { data: session, isPending: checkingSession, error: sessionError } = authClient.useSession();
  const [showCode, setShowCode] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [pending, start] = useTransition();
  const mounted = useRef(false);
  const currentActor = useRef<string | undefined>(undefined);
  const returnPath = `/invitation/${token}`;
  useLayoutEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);
  useLayoutEffect(() => { currentActor.current = session?.user?.id; }, [session?.user?.id]);
  useEffect(() => {
    if (!cooldown) return;
    const timer = window.setTimeout(() => setCooldown((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  const active = () => mounted.current && currentActor.current === actorId;
  function returnToInvitation() {
    if (!active()) return;
    setCode("");
    invalidateFinancialViews({ notifyCurrent: false });
    // A new document discards Auth's client cache and rereads the invitation.
    window.location.replace(returnPath);
  }
  function requestCode() {
    if (!active() || pending || cooldown) return;
    setError("");
    setNotice("");
    setShowCode(true);
    setCooldown(60);
    start(async () => {
      try {
        const result = await requestInvitationVerification({ token, expectedActorId: actorId });
        if (!active()) return;
        if (!result.ok) setError(result.error);
        else if (result.status === "verified") returnToInvitation();
        else setNotice("Le code a été envoyé à l’adresse courriel de ton compte. Consulte aussi tes courriels indésirables.");
      } catch {
        if (active()) setError("L’envoi n’a pas pu être confirmé. Si un courriel arrive, utilise son code ; sinon, réessaie dans une minute.");
      }
    });
  }
  function verifyCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!active() || pending) return;
    setError("");
    setNotice("");
    start(async () => {
      try {
        const result = await verifyInvitationEmail({ token, expectedActorId: actorId, code });
        if (!active()) return;
        if (!result.ok) setError(result.error);
        else returnToInvitation();
      } catch {
        if (active()) setError("La vérification n’a pas pu être confirmée. Réessaie avec le dernier code reçu.");
      }
    });
  }

  if (checkingSession) return <p className="space-info" role="status">Vérification de ta session…</p>;
  if (sessionError || session?.user?.id !== actorId)
    return <p className="space-error" role="alert">Ta session a changé ou ne peut pas être vérifiée. Recharge cette invitation avant de continuer.</p>;

  return (
    <section aria-label="Vérification de ton adresse">
      <p className="space-info">Confirme ton adresse courriel pour accepter cette invitation. Tu choisiras ensuite si tu souhaites rejoindre cet espace.</p>
      {showCode ? (
        <form onSubmit={verifyCode} className="space-list">
          <label className="space-label" htmlFor="invitation-verification-code">Code reçu par courriel</label>
          <input
            id="invitation-verification-code"
            name="verificationCode"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{4,12}"
            minLength={4}
            maxLength={12}
            required
            value={code}
            onChange={(event) => setCode(event.target.value.trim())}
            disabled={pending}
            aria-describedby={error ? "invitation-verification-error" : undefined}
          />
          <button
            className="space-btn"
            disabled={pending || !/^\d{4,12}$/.test(code.trim())}
            type="submit"
          >
            {pending ? "En cours…" : "Vérifier mon adresse"}
          </button>
          <button
            className="space-btn secondary"
            disabled={pending || cooldown > 0}
            type="button"
            onClick={requestCode}
          >
            {cooldown > 0 ? `Renvoyer un code dans ${cooldown} s` : "Renvoyer un code"}
          </button>
        </form>
      ) : (
        <div className="space-list">
          <button className="space-btn" type="button" disabled={pending} onClick={requestCode}>Recevoir un code de vérification</button>
          <button className="space-btn secondary" type="button" onClick={() => setShowCode(true)}>J’ai déjà un code</button>
        </div>
      )}
      {notice && <p className="space-feedback" role="status">{notice}</p>}
      {error && <p className="space-error" role="alert" id="invitation-verification-error">{error}</p>}
      <Link className="space-back" href={returnPath} prefetch={false}>J’ai déjà confirmé mon adresse par un lien</Link>
    </section>
  );
}
