'use client';
import { useEffect, useRef, useState } from 'react';
import { signOutAndClear } from '@/lib/auth/sign-out';

/** Keeps a validated invitation return while avoiding the SDK's finally redirect. */
export default function SignOutFlow({ returnTo }: { returnTo: string }) {
  const [failed, setFailed] = useState(false);
  const active = useRef(false);
  const request = useRef<Promise<boolean> | null>(null);
  useEffect(() => {
    active.current = true;
    request.current ??= signOutAndClear({ returnTo, canNavigate: () => active.current });
    let subscribed = true;
    void request.current.then(ok => { if (subscribed && !ok) setFailed(true); });
    return () => { subscribed = false; active.current = false; };
  }, [returnTo]);
  async function retry() {
    setFailed(false);
    request.current = signOutAndClear({ returnTo, canNavigate: () => active.current });
    if (!await request.current && active.current) setFailed(true);
  }
  return (
    <section aria-live="polite">
      <h1>Déconnexion</h1>
      <p>{failed
        ? 'La déconnexion n’a pas pu être confirmée. Réessaie pour changer de compte ; le retour demandé est conservé.'
        : 'Déconnexion en cours…'}</p>
      {failed && <button className="space-btn" onClick={() => void retry()}>Réessayer la déconnexion</button>}
    </section>
  );
}
