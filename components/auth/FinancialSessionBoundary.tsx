'use client';
import { useLayoutEffect, useRef, useSyncExternalStore, type ReactNode } from 'react';
import { authClient } from '@/lib/auth/client';
import { signOutAndClear } from '@/lib/auth/sign-out';
import {
  financialVisibilitySnapshot,
  serverVisibilitySnapshot,
  subscribeFinancialVisibility,
  watchSessionExpiry,
  lockFinancialViews,
} from '@/lib/auth/financial-visibility';

/** Server-authorized children belong only to this exact authenticated user. */
export default function FinancialSessionBoundary({ userId, children }: {
  userId: string;
  children: ReactNode;
}) {
  const { data: session, isPending, error } = authClient.useSession();
  const lock = useSyncExternalStore(
    subscribeFinancialVisibility,
    financialVisibilitySnapshot,
    serverVisibilitySnapshot,
  );
  const privateView = useRef<HTMLDivElement>(null);
  const expiresAt = session?.session?.expiresAt;
  useLayoutEffect(() => {
    if (session) return watchSessionExpiry(expiresAt, () => lockFinancialViews('session'));
  }, [session, expiresAt]);
  useLayoutEffect(() => {
    // Hide synchronously before a browser history snapshot is captured.
    const conceal = () => {
      privateView.current?.setAttribute('hidden', '');
      privateView.current?.style.setProperty('display', 'none', 'important');
    };
    window.addEventListener('pagehide', conceal);
    return () => window.removeEventListener('pagehide', conceal);
  }, []);
  if (!lock && !isPending && !error && userId && session?.user?.id === userId) {
    return <div ref={privateView} style={{ display: 'contents' }}>{children}</div>;
  }
  const checking = !lock && isPending;
  let message = 'La session a changé ou cette page vient de l’historique. Recharge pour ouvrir les finances du compte connecté. Les saisies non enregistrées ne sont pas conservées.';
  if (lock === 'offline') {
    message = 'Reconnecte-toi à Internet, puis recharge pour retrouver tes finances. Les saisies non enregistrées ne sont pas conservées.';
  } else if (lock === 'signout-error') {
    message = 'La déconnexion n’a pas pu être confirmée. Tes finances restent masquées ; tu peux réessayer.';
  } else if (error) {
    message = 'Ta session ne peut pas être confirmée pour le moment. Recharge quand la connexion est disponible ; tes finances restent masquées.';
  }
  return (
    <main className="space-onboarding">
      <section className="space-onboarding-inner" aria-live="polite">
        <p className="space-eyebrow">MES FINANCES</p>
        <h1>{checking ? 'Vérification de ta session…' : 'Ta session doit être vérifiée.'}</h1>
        {!checking && <>
          <p>{message}</p>
          <div className="space-list">
          {lock === 'signout-error' && (
            <button className="space-btn" onClick={() => void signOutAndClear()}>
              Réessayer la déconnexion
            </button>
          )}
          <button className="space-btn" onClick={() => window.location.replace('/')}>
            Recharger mes espaces
          </button>
          <button className="space-btn secondary" onClick={() => window.location.replace('/auth/sign-in')}>
            Se connecter
          </button>
          </div>
        </>}
      </section>
    </main>
  );
}
