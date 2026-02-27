'use client';

import Link from 'next/link';
import { authClient } from '@/lib/auth/client';

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

export default function ParametresClient() {
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
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            cursor: 'pointer',
            marginTop: '8px',
          }}
        >
          Se deconnecter
        </button>
      </div>
    </div>
  );
}
