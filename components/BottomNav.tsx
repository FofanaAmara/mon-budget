'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const tabs = [
  {
    href: '/',
    label: 'Accueil',
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill={active ? 'var(--accent)' : 'none'}
        stroke={active ? 'var(--accent)' : 'var(--text-tertiary)'} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" />
        <path d="M9 21V12h6v9" stroke={active ? 'var(--surface-raised)' : 'var(--text-tertiary)'} />
      </svg>
    ),
  },
  {
    href: '/depenses',
    label: 'Depenses',
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
        stroke={active ? 'var(--accent)' : 'var(--text-tertiary)'} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="5" width="20" height="14" rx="3" />
        <path d="M2 10h20" />
        <path d="M6 15h4" strokeWidth="2" />
      </svg>
    ),
  },
  {
    href: '/mon-mois',
    label: 'Mon mois',
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
        stroke={active ? 'var(--accent)' : 'var(--text-tertiary)'} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
        <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" strokeWidth="2.5" />
      </svg>
    ),
  },
  {
    href: '/revenus',
    label: 'Revenus',
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
        stroke={active ? 'var(--accent)' : 'var(--text-tertiary)'} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
  },
  {
    href: '/cash-flow',
    label: 'Cash Flow',
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
        stroke={active ? 'var(--accent)' : 'var(--text-tertiary)'} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        <polyline points="17 8 20 5 17 2" />
        <polyline points="7 22 4 19 7 16" />
      </svg>
    ),
  },
  {
    href: '/parametres',
    label: 'Reglages',
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
        stroke={active ? 'var(--accent)' : 'var(--text-tertiary)'} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
  },
];

export default function BottomNav() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  }

  return (
    <>
      {/* ── Desktop sidebar (hidden on mobile) ── */}
      <aside className="hidden md:flex" style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '240px',
        height: '100vh',
        flexDirection: 'column',
        background: 'var(--surface-raised)',
        borderRight: '1px solid var(--border-default)',
        zIndex: 50,
      }}>
        {/* Brand */}
        <div style={{
          padding: '28px 24px 24px',
          borderBottom: '1px solid var(--border-default)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>
            <span style={{
              fontSize: 'var(--text-sm)',
              fontWeight: 700,
              color: 'var(--text-primary)',
              letterSpacing: 'var(--tracking-tight)',
            }}>
              Mon Budget
            </span>
          </div>
        </div>

        {/* Nav items */}
        <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {tabs.map((tab) => {
            const active = isActive(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                aria-current={active ? 'page' : undefined}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-md)',
                  textDecoration: 'none',
                  background: active ? 'var(--accent-subtle)' : 'transparent',
                  transition: `background var(--duration-fast) var(--ease-out)`,
                }}
              >
                <span style={{
                  flexShrink: 0,
                  transition: `transform var(--duration-normal) var(--ease-spring)`,
                  transform: active ? 'scale(1.05)' : 'scale(1)',
                }}>
                  {tab.icon(active)}
                </span>
                <span style={{
                  fontSize: 'var(--text-sm)',
                  fontWeight: active ? 650 : 500,
                  color: active ? 'var(--accent)' : 'var(--text-secondary)',
                  letterSpacing: '0.01em',
                  transition: `color var(--duration-normal) var(--ease-out)`,
                }}>
                  {tab.label}
                </span>
                {active && (
                  <div style={{
                    marginLeft: 'auto',
                    width: '4px',
                    height: '4px',
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--accent)',
                    flexShrink: 0,
                  }} />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid var(--border-default)',
        }}>
          <p style={{
            fontSize: 'var(--text-xs)',
            color: 'var(--text-tertiary)',
            fontWeight: 500,
          }}>
            v2.0 · PWA
          </p>
        </div>
      </aside>

      {/* ── Mobile bottom nav (hidden on desktop) ── */}
      <nav
        className="flex md:hidden"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: 'calc(var(--nav-height) + var(--safe-bottom))',
          paddingBottom: 'var(--safe-bottom)',
          zIndex: 50,
        }}
        aria-label="Navigation principale"
      >
        {/* Frosted glass background */}
        <div
          className="absolute inset-0"
          style={{
            background: 'rgba(255, 255, 255, 0.82)',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            borderTop: '1px solid rgba(229, 227, 223, 0.6)',
          }}
        />
        <div className="relative flex items-stretch w-full" style={{ height: 'var(--nav-height)' }}>
          {tabs.map((tab) => {
            const active = isActive(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className="flex flex-1 flex-col items-center justify-center"
                style={{ gap: '4px' }}
                aria-current={active ? 'page' : undefined}
              >
                <div className="relative flex flex-col items-center" style={{ gap: '4px' }}>
                  <span style={{
                    transition: `transform var(--duration-normal) var(--ease-spring)`,
                    transform: active ? 'scale(1.06)' : 'scale(1)',
                  }}>
                    {tab.icon(active)}
                  </span>
                  <span style={{
                    fontSize: '10px',
                    fontWeight: active ? 650 : 500,
                    letterSpacing: '0.01em',
                    color: active ? 'var(--accent)' : 'var(--text-tertiary)',
                    transition: `color var(--duration-normal) var(--ease-out)`,
                  }}>
                    {tab.label}
                  </span>
                  <div style={{
                    width: '4px',
                    height: '4px',
                    borderRadius: 'var(--radius-full)',
                    background: active ? 'var(--accent)' : 'transparent',
                    transition: `background var(--duration-normal) var(--ease-out), transform var(--duration-normal) var(--ease-spring)`,
                    transform: active ? 'scale(1)' : 'scale(0)',
                  }} />
                </div>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
