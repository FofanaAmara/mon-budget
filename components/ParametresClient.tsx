'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { authClient } from '@/lib/auth/client';
import { loadDemoData, clearAllUserData } from '@/lib/actions/demo-data';

const PREFERENCE_ITEMS = [
  {
    href: '/parametres/devise',
    label: 'Devise par defaut',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M15 9.354a4 4 0 1 0 0 5.292M12 7v10" />
      </svg>
    ),
  },
  {
    href: '/parametres/rappels',
    label: 'Rappels par defaut',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    ),
  },
  {
    href: '/parametres/notifications',
    label: 'Notifications',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 17H2a3 3 0 0 0 3-3V9a7 7 0 0 1 14 0v5a3 3 0 0 0 3 3z" />
        <path d="M9.09 21a3 3 0 0 0 5.83 0" />
      </svg>
    ),
  },
];

const MANAGEMENT_ITEMS = [
  {
    href: '/parametres/charges',
    label: 'Mes charges fixes',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
  },
  {
    href: '/parametres/revenus',
    label: 'Mes revenus recurrents',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
  },
  {
    href: '/cartes',
    label: 'Mes cartes de paiement',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="5" width="20" height="14" rx="3" />
        <path d="M2 10h20" />
      </svg>
    ),
  },
  {
    href: '/sections',
    label: 'Mes sections',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
];

function LinkRow({ href, label, icon }: { href: string; label: string; icon: React.ReactNode }) {
  return (
    <Link href={href} className="link-row" style={{ textDecoration: 'none' }}>
      <div className="flex items-center" style={{ gap: '12px' }}>
        <span style={{ color: 'var(--text-tertiary)' }}>{icon}</span>
        <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>{label}</span>
      </div>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 18l6-6-6-6" />
      </svg>
    </Link>
  );
}

export default function ParametresClient({ hasData }: { hasData: boolean }) {
  const [showClearModal, setShowClearModal] = useState(false);
  const [isPendingLoad, startLoadTransition] = useTransition();
  const [isPendingClear, startClearTransition] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);

  function handleLoadDemo() {
    setFeedback(null);
    startLoadTransition(async () => {
      const result = await loadDemoData();
      if (result.success) {
        window.location.reload();
      } else {
        setFeedback(result.error ?? 'Erreur');
      }
    });
  }

  function handleClearAll() {
    setFeedback(null);
    startClearTransition(async () => {
      const result = await clearAllUserData();
      if (result.success) {
        localStorage.removeItem('mes-finances-onboarding-done');
        window.location.href = '/';
      } else {
        setFeedback(result.error ?? 'Erreur');
        setShowClearModal(false);
      }
    });
  }

  return (
    <div style={{ padding: '36px 20px 24px', minHeight: '100vh' }}>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{
          fontSize: 'var(--text-xl)',
          fontWeight: 750,
          color: 'var(--text-primary)',
          letterSpacing: 'var(--tracking-tight)',
          lineHeight: 'var(--leading-tight)',
        }}>
          Réglages
        </h1>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* Mon compte */}
        <div className="list-card">
          <LinkRow
            href="/account/settings"
            label="Mon compte"
            icon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            }
          />
        </div>

        {/* Preferences */}
        <div className="list-card">
          <div style={{ padding: '16px 20px 8px' }}>
            <h2 style={{
              fontSize: 'var(--text-sm)', fontWeight: 650,
              color: 'var(--text-primary)',
            }}>Preferences</h2>
          </div>
          {PREFERENCE_ITEMS.map(({ href, label, icon }) => (
            <LinkRow key={href} href={href} label={label} icon={icon} />
          ))}
        </div>

        {/* Gestion */}
        <div className="list-card">
          <div style={{ padding: '16px 20px 8px' }}>
            <h2 style={{
              fontSize: 'var(--text-sm)', fontWeight: 650,
              color: 'var(--text-primary)',
            }}>Gestion</h2>
          </div>
          {MANAGEMENT_ITEMS.map(({ href, label, icon }) => (
            <LinkRow key={href} href={href} label={label} icon={icon} />
          ))}
        </div>

        {/* Donnees */}
        <div className="list-card">
          <div style={{ padding: '16px 20px 8px' }}>
            <h2 style={{
              fontSize: 'var(--text-sm)', fontWeight: 650,
              color: 'var(--text-primary)',
            }}>Donnees</h2>
          </div>
          <div style={{ padding: '8px 20px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* Load demo */}
            <button
              onClick={handleLoadDemo}
              disabled={hasData || isPendingLoad}
              style={{
                width: '100%', padding: '12px',
                fontSize: 'var(--text-sm)', fontWeight: 600,
                background: hasData ? 'var(--surface-inset)' : 'var(--accent)',
                color: hasData ? 'var(--text-tertiary)' : 'white',
                border: 'none', borderRadius: 'var(--radius-md)',
                cursor: hasData ? 'not-allowed' : isPendingLoad ? 'wait' : 'pointer',
                opacity: isPendingLoad ? 0.7 : 1,
                transition: 'opacity 0.2s',
              }}
            >
              {isPendingLoad ? 'Chargement...' : '✨ Charger les donnees de demo'}
            </button>
            {hasData && (
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', textAlign: 'center' }}>
                Disponible uniquement quand le compte est vide
              </p>
            )}

            {/* Clear all */}
            <button
              onClick={() => setShowClearModal(true)}
              disabled={!hasData}
              style={{
                width: '100%', padding: '12px',
                fontSize: 'var(--text-sm)', fontWeight: 600,
                background: 'transparent',
                color: hasData ? '#DC2626' : 'var(--text-tertiary)',
                border: `1px solid ${hasData ? '#DC2626' : 'var(--border)'}`,
                borderRadius: 'var(--radius-md)',
                cursor: hasData ? 'pointer' : 'not-allowed',
              }}
            >
              Vider toutes les donnees
            </button>

            {feedback && (
              <p style={{ fontSize: 'var(--text-xs)', color: '#DC2626', textAlign: 'center' }}>{feedback}</p>
            )}
          </div>
        </div>

        {/* Sign out */}
        <button
          onClick={async () => {
            await authClient.signOut();
            window.location.href = '/auth/sign-in';
          }}
          style={{
            width: '100%',
            padding: '14px',
            fontSize: 'var(--text-sm)',
            fontWeight: 600,
            color: '#DC2626',
            background: 'var(--surface-raised)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            cursor: 'pointer',
            marginTop: '8px',
          }}
        >
          Se deconnecter
        </button>
      </div>

      {/* Clear confirmation modal */}
      {showClearModal && (
        <div
          onClick={() => !isPendingClear && setShowClearModal(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.45)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '24px',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%', maxWidth: '360px',
              background: 'var(--surface-raised)',
              borderRadius: 'var(--radius-lg)',
              padding: '24px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            }}
          >
            <h3 style={{
              fontSize: 'var(--text-base)', fontWeight: 700,
              color: 'var(--text-primary)', marginBottom: '12px',
            }}>Tout supprimer ?</h3>
            <p style={{
              fontSize: 'var(--text-sm)', color: 'var(--text-secondary)',
              lineHeight: '1.6', marginBottom: '24px',
            }}>
              Cette action est irreversible. Toutes vos donnees seront supprimees (depenses, revenus, cartes, dettes, epargne).
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setShowClearModal(false)}
                disabled={isPendingClear}
                style={{
                  flex: 1, padding: '12px',
                  fontSize: 'var(--text-sm)', fontWeight: 600,
                  background: 'var(--surface-inset)',
                  color: 'var(--text-primary)',
                  border: 'none', borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                }}
              >Annuler</button>
              <button
                onClick={handleClearAll}
                disabled={isPendingClear}
                style={{
                  flex: 1, padding: '12px',
                  fontSize: 'var(--text-sm)', fontWeight: 600,
                  background: '#DC2626', color: 'white',
                  border: 'none', borderRadius: 'var(--radius-md)',
                  cursor: isPendingClear ? 'wait' : 'pointer',
                  opacity: isPendingClear ? 0.7 : 1,
                }}
              >{isPendingClear ? 'Suppression...' : 'Tout supprimer'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
