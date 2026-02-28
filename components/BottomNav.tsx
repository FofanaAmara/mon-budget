'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { authClient } from '@/lib/auth/client';

type Tab = {
  href: string;
  label: string;
  icon: (active: boolean) => React.ReactNode;
  mobileIcon?: (active: boolean) => React.ReactNode;
  mobileLabel?: string;
};

function getInitials(name?: string | null, email?: string | null): string {
  if (name) {
    const parts = name.trim().split(/\s+/);
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : parts[0].slice(0, 2).toUpperCase();
  }
  return (email?.[0] ?? '?').toUpperCase();
}

const tabs: Tab[] = [
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
    href: '/projets',
    label: 'Patrimoine',
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
        stroke={active ? 'var(--accent)' : 'var(--text-tertiary)'} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
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
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
    mobileLabel: '',
    mobileIcon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
        stroke={active ? 'var(--accent)' : 'var(--text-tertiary)'} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <line x1="3" y1="6" x2="21" y2="6" />
        <line x1="3" y1="12" x2="21" y2="12" />
        <line x1="3" y1="18" x2="21" y2="18" />
      </svg>
    ),
  },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { data: session } = authClient.useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const userName = session?.user?.name;
  const userEmail = session?.user?.email;
  const initials = getInitials(userName, userEmail);

  // Close dropdown on outside click
  useEffect(() => {
    if (!menuOpen) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [menuOpen]);

  async function handleSignOut() {
    await authClient.signOut();
    window.location.href = '/auth/sign-in';
  }

  function isActive(href: string) {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  }

  return (
    <>
      {/* ── Mobile header (hidden on desktop) ── */}
      <header
        className="flex md:hidden"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: 'calc(var(--header-height) + var(--safe-top))',
          paddingTop: 'var(--safe-top)',
          zIndex: 50,
        }}
      >
        {/* Frosted glass background */}
        <div
          className="absolute inset-0"
          style={{
            background: 'rgba(255, 255, 255, 0.82)',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            borderBottom: '1px solid rgba(229, 227, 223, 0.6)',
          }}
        />
        <div
          className="relative flex items-center justify-between w-full"
          style={{ height: 'var(--header-height)', padding: '0 16px' }}
        >
          {/* Left: Logo + brand name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <svg width="14" height="14" viewBox="0 0 56 56" fill="none">
                <path d="M8 44 L18 14 L28 34 L38 8 L48 44" stroke="white" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span style={{
              fontSize: 'var(--text-sm)',
              fontWeight: 700,
              color: 'var(--text-primary)',
              letterSpacing: 'var(--tracking-tight)',
            }}>
              Mes Finances
            </span>
          </div>

          {/* Right: Avatar with dropdown */}
          <div ref={menuRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Menu utilisateur"
              style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-full)',
                background: 'var(--accent)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: 'none',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 700,
                letterSpacing: '0.02em',
                transition: 'transform var(--duration-fast) var(--ease-spring)',
                transform: menuOpen ? 'scale(0.95)' : 'scale(1)',
              }}
            >
              {initials}
            </button>

            {/* Dropdown */}
            {menuOpen && (
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                background: 'var(--surface-raised)',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-lg)',
                border: '1px solid var(--border-default)',
                padding: '4px',
                minWidth: '180px',
                zIndex: 60,
                animation: 'fade-in-up var(--duration-fast) var(--ease-out) both',
              }}>
                {userName && (
                  <div style={{
                    padding: '8px 12px 4px',
                    fontSize: 'var(--text-xs)',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                  }}>
                    {userName}
                  </div>
                )}
                {userEmail && (
                  <div style={{
                    padding: '0 12px 8px',
                    fontSize: '11px',
                    color: 'var(--text-tertiary)',
                  }}>
                    {userEmail}
                  </div>
                )}
                {(userName || userEmail) && (
                  <div style={{ height: '1px', background: 'var(--border-default)', margin: '0 4px' }} />
                )}
                <button
                  onClick={handleSignOut}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    fontSize: 'var(--text-xs)',
                    fontWeight: 600,
                    color: 'var(--negative)',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background var(--duration-fast) var(--ease-out)',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--negative-subtle)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  Se deconnecter
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

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
              <svg width="16" height="16" viewBox="0 0 56 56" fill="none">
                <path d="M8 44 L18 14 L28 34 L38 8 L48 44" stroke="white" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span style={{
              fontSize: 'var(--text-sm)',
              fontWeight: 700,
              color: 'var(--text-primary)',
              letterSpacing: 'var(--tracking-tight)',
            }}>
              Mes Finances
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

        {/* Footer — User profile */}
        <div style={{
          marginTop: 'auto',
          padding: '16px 20px',
          borderTop: '1px solid var(--border-default)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Avatar */}
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-full)',
              background: 'var(--accent)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              fontSize: '13px',
              fontWeight: 700,
              letterSpacing: '0.02em',
            }}>
              {initials}
            </div>
            {/* Name + email */}
            <div style={{ minWidth: 0, flex: 1 }}>
              {userName && (
                <div style={{
                  fontSize: 'var(--text-xs)',
                  fontWeight: 650,
                  color: 'var(--text-primary)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  {userName}
                </div>
              )}
              {userEmail && (
                <div style={{
                  fontSize: '11px',
                  color: 'var(--text-tertiary)',
                  fontWeight: 500,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  {userEmail}
                </div>
              )}
            </div>
          </div>
          <button
            onClick={handleSignOut}
            style={{
              fontSize: 'var(--text-xs)',
              fontWeight: 600,
              color: 'var(--negative)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left',
              padding: 0,
              transition: 'opacity var(--duration-fast) var(--ease-out)',
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.7'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
          >
            Se deconnecter
          </button>
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
            const icon = tab.mobileIcon ? tab.mobileIcon(active) : tab.icon(active);
            const label = tab.mobileLabel ?? tab.label;
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
                    {icon}
                  </span>
                  {label && (
                    <span style={{
                      fontSize: '10px',
                      fontWeight: active ? 650 : 500,
                      letterSpacing: '0.01em',
                      color: active ? 'var(--accent)' : 'var(--text-tertiary)',
                      transition: `color var(--duration-normal) var(--ease-out)`,
                    }}>
                      {label}
                    </span>
                  )}
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
