"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { authClient } from "@/lib/auth/client";

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
  return (email?.[0] ?? "?").toUpperCase();
}

const tabs: Tab[] = [
  {
    href: "/",
    label: "Accueil",
    icon: (active: boolean) => (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill={active ? "var(--accent)" : "none"}
        stroke={active ? "var(--accent)" : "var(--text-tertiary)"}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" />
        <path
          d="M9 21V12h6v9"
          stroke={active ? "var(--surface-raised)" : "var(--text-tertiary)"}
        />
      </svg>
    ),
  },
  {
    href: "/depenses",
    label: "Depenses",
    icon: (active: boolean) => (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke={active ? "var(--accent)" : "var(--text-tertiary)"}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="2" y="5" width="20" height="14" rx="3" />
        <path d="M2 10h20" />
        <path d="M6 15h4" strokeWidth="2" />
      </svg>
    ),
  },
  {
    href: "/revenus",
    label: "Revenus",
    icon: (active: boolean) => (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke={active ? "var(--accent)" : "var(--text-tertiary)"}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
  },
  {
    href: "/projets",
    label: "Patrimoine",
    icon: (active: boolean) => (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke={active ? "var(--accent)" : "var(--text-tertiary)"}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
      </svg>
    ),
  },
  {
    href: "/parametres",
    label: "Reglages",
    icon: (active: boolean) => (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke={active ? "var(--accent)" : "var(--text-tertiary)"}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
    mobileLabel: "",
    mobileIcon: (active: boolean) => (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke={active ? "var(--accent)" : "var(--text-tertiary)"}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
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
  const [desktopMenuOpen, setDesktopMenuOpen] = useState(false);
  const desktopMenuRef = useRef<HTMLDivElement>(null);

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
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  // Close desktop dropdown on outside click
  useEffect(() => {
    if (!desktopMenuOpen) return;
    function handleClick(e: MouseEvent) {
      if (
        desktopMenuRef.current &&
        !desktopMenuRef.current.contains(e.target as Node)
      ) {
        setDesktopMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [desktopMenuOpen]);

  async function handleSignOut() {
    await authClient.signOut();
    window.location.href = "/auth/sign-in";
  }

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <>
      {/* ── Mobile header (hidden on desktop) ── */}
      <header
        className="flex md:hidden"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: "calc(var(--header-height) + var(--safe-top))",
          paddingTop: "var(--safe-top)",
          zIndex: 50,
        }}
      >
        {/* Frosted glass background */}
        <div
          className="absolute inset-0"
          style={{
            background: "rgba(255, 255, 255, 0.82)",
            backdropFilter: "blur(20px) saturate(180%)",
            WebkitBackdropFilter: "blur(20px) saturate(180%)",
            borderBottom: "1px solid rgba(229, 227, 223, 0.6)",
          }}
        />
        <div
          className="relative flex items-center justify-between w-full"
          style={{ height: "var(--header-height)", padding: "0 16px" }}
        >
          {/* Left: Logo + brand name */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <svg viewBox="-50 -50 100 100" width="32" height="32" fill="none">
              <rect
                x="-36"
                y="-36"
                width="72"
                height="72"
                rx="18"
                fill="#0F766E"
              />
              <path
                d="M-18 22 C-10 18, -4 8, 0 0 S10 -8, 14 -4 S22 -14, 24 -22"
                stroke="#FAFBFC"
                strokeWidth="4"
                strokeLinecap="round"
              />
              <circle cx="24" cy="-22" r="3.5" fill="#F59E0B" />
            </svg>
            <span
              style={{ fontSize: "var(--text-sm)", letterSpacing: "-0.02em" }}
            >
              <b style={{ fontWeight: 800, color: "var(--text-primary)" }}>
                Mes
              </b>
              <span style={{ fontWeight: 600, color: "var(--accent)" }}>
                {" "}
                Finances
              </span>
            </span>
          </div>

          {/* Right: Avatar with dropdown */}
          <div ref={menuRef} style={{ position: "relative" }}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Menu utilisateur"
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "var(--radius-full)",
                background: "var(--accent)",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "none",
                cursor: "pointer",
                fontSize: "12px",
                fontWeight: 700,
                letterSpacing: "0.02em",
                transition: "transform var(--duration-fast) var(--ease-spring)",
                transform: menuOpen ? "scale(0.95)" : "scale(1)",
              }}
            >
              {initials}
            </button>

            {/* Dropdown */}
            {menuOpen && (
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 8px)",
                  right: 0,
                  background: "var(--surface-raised)",
                  borderRadius: "var(--radius-md)",
                  boxShadow: "var(--shadow-lg)",
                  border: "1px solid var(--border-default)",
                  padding: "4px",
                  minWidth: "180px",
                  zIndex: 60,
                  animation:
                    "fade-in-up var(--duration-fast) var(--ease-out) both",
                }}
              >
                {userName && (
                  <div
                    style={{
                      padding: "8px 12px 4px",
                      fontSize: "var(--text-xs)",
                      fontWeight: 600,
                      color: "var(--text-primary)",
                    }}
                  >
                    {userName}
                  </div>
                )}
                {userEmail && (
                  <div
                    style={{
                      padding: "0 12px 8px",
                      fontSize: "11px",
                      color: "var(--text-tertiary)",
                    }}
                  >
                    {userEmail}
                  </div>
                )}
                {(userName || userEmail) && (
                  <div
                    style={{
                      height: "1px",
                      background: "var(--border-default)",
                      margin: "0 4px",
                    }}
                  />
                )}
                <button
                  onClick={handleSignOut}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    fontSize: "var(--text-xs)",
                    fontWeight: 600,
                    color: "var(--negative)",
                    background: "transparent",
                    border: "none",
                    borderRadius: "var(--radius-sm)",
                    cursor: "pointer",
                    textAlign: "left",
                    transition:
                      "background var(--duration-fast) var(--ease-out)",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background =
                      "var(--negative-subtle)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  Se deconnecter
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Desktop sidebar (hidden on mobile) ── */}
      <aside
        className="hidden md:flex"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "260px",
          height: "100vh",
          flexDirection: "column",
          overflow: "hidden",
          background: "var(--surface-raised)",
          borderRight: "1px solid var(--border-default)",
          zIndex: 50,
        }}
      >
        {/* Brand */}
        <div
          style={{
            padding: "28px 24px 24px",
            borderBottom: "1px solid var(--border-default)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <svg viewBox="-50 -50 100 100" width="32" height="32" fill="none">
              <rect
                x="-36"
                y="-36"
                width="72"
                height="72"
                rx="18"
                fill="#0F766E"
              />
              <path
                d="M-18 22 C-10 18, -4 8, 0 0 S10 -8, 14 -4 S22 -14, 24 -22"
                stroke="#FAFBFC"
                strokeWidth="4"
                strokeLinecap="round"
              />
              <circle cx="24" cy="-22" r="3.5" fill="#F59E0B" />
            </svg>
            <span style={{ fontSize: "17px", letterSpacing: "-0.02em" }}>
              <b style={{ fontWeight: 800, color: "var(--text-primary)" }}>
                Mes
              </b>
              <span style={{ fontWeight: 600, color: "var(--accent)" }}>
                {" "}
                Finances
              </span>
            </span>
          </div>
        </div>

        {/* Nav items */}
        <nav
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            padding: "16px 12px",
            display: "flex",
            flexDirection: "column",
            gap: "4px",
          }}
        >
          {tabs.map((tab) => {
            const active = isActive(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                aria-current={active ? "page" : undefined}
                style={{
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "10px 12px",
                  borderRadius: "var(--radius-md)",
                  textDecoration: "none",
                  background: active ? "var(--accent-subtle)" : "transparent",
                  transition: `background var(--duration-fast) var(--ease-out)`,
                }}
              >
                {active && (
                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      top: 8,
                      bottom: 8,
                      width: "3px",
                      background: "var(--amber)",
                      borderRadius: "0 2px 2px 0",
                    }}
                  />
                )}
                <span
                  style={{
                    flexShrink: 0,
                    transition: `transform var(--duration-normal) var(--ease-spring)`,
                    transform: active ? "scale(1.05)" : "scale(1)",
                  }}
                >
                  {tab.icon(active)}
                </span>
                <span
                  style={{
                    fontSize: "var(--text-sm)",
                    fontWeight: active ? 650 : 500,
                    color: active ? "var(--accent)" : "var(--text-secondary)",
                    letterSpacing: "0.01em",
                    transition: `color var(--duration-normal) var(--ease-out)`,
                  }}
                >
                  {tab.label}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Footer — User profile with dropdown (same pattern as mobile header) */}
        <div
          ref={desktopMenuRef}
          style={{
            marginTop: "auto",
            flexShrink: 0,
            padding: "12px",
            borderTop: "1px solid var(--border-default)",
            position: "relative",
          }}
        >
          <button
            onClick={() => setDesktopMenuOpen((v) => !v)}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "8px 10px",
              background: desktopMenuOpen
                ? "var(--accent-subtle)"
                : "transparent",
              border: "none",
              borderRadius: "var(--radius-md)",
              cursor: "pointer",
              transition: "background var(--duration-fast) var(--ease-out)",
            }}
            onMouseEnter={(e) => {
              if (!desktopMenuOpen)
                e.currentTarget.style.background = "var(--slate-50, #F8FAFC)";
            }}
            onMouseLeave={(e) => {
              if (!desktopMenuOpen)
                e.currentTarget.style.background = "transparent";
            }}
          >
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "var(--radius-full)",
                background: "var(--accent)",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                fontSize: "13px",
                fontWeight: 700,
                letterSpacing: "0.02em",
              }}
            >
              {initials}
            </div>
            <div style={{ minWidth: 0, flex: 1, textAlign: "left" }}>
              {userName && (
                <div
                  style={{
                    fontSize: "var(--text-xs)",
                    fontWeight: 650,
                    color: "var(--text-primary)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {userName}
                </div>
              )}
              {userEmail && (
                <div
                  style={{
                    fontSize: "11px",
                    color: "var(--text-tertiary)",
                    fontWeight: 500,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {userEmail}
                </div>
              )}
            </div>
          </button>

          {/* Dropdown */}
          {desktopMenuOpen && (
            <div
              style={{
                position: "absolute",
                bottom: "calc(100% + 8px)",
                left: "12px",
                right: "12px",
                background: "var(--surface-raised)",
                borderRadius: "var(--radius-md)",
                boxShadow: "var(--shadow-lg)",
                border: "1px solid var(--border-default)",
                padding: "4px",
                zIndex: 60,
                animation:
                  "fade-in-up var(--duration-fast) var(--ease-out) both",
              }}
            >
              <button
                onClick={handleSignOut}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  fontSize: "var(--text-xs)",
                  fontWeight: 600,
                  color: "var(--negative)",
                  background: "transparent",
                  border: "none",
                  borderRadius: "var(--radius-sm)",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "background var(--duration-fast) var(--ease-out)",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "var(--negative-subtle)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
              >
                Se deconnecter
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* ── Mobile bottom nav (hidden on desktop) ── */}
      <nav
        className="flex md:hidden"
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          height: "calc(var(--nav-height) + var(--safe-bottom))",
          paddingBottom: "var(--safe-bottom)",
          zIndex: 50,
        }}
        aria-label="Navigation principale"
      >
        {/* Solid white background */}
        <div
          className="absolute inset-0"
          style={{
            background: "var(--surface-raised)",
            borderTop: "1px solid var(--border-default)",
          }}
        />
        <div
          className="relative flex items-stretch w-full"
          style={{ height: "var(--nav-height)" }}
        >
          {tabs.map((tab) => {
            const active = isActive(tab.href);
            const icon = tab.mobileIcon
              ? tab.mobileIcon(active)
              : tab.icon(active);
            const label = tab.mobileLabel ?? tab.label;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className="flex flex-1 flex-col items-center justify-center"
                style={{ gap: "4px" }}
                aria-current={active ? "page" : undefined}
              >
                <div
                  className="relative flex flex-col items-center"
                  style={{ gap: "4px" }}
                >
                  <span
                    style={{
                      transition: `transform var(--duration-normal) var(--ease-spring)`,
                      transform: active ? "scale(1.06)" : "scale(1)",
                    }}
                  >
                    {icon}
                  </span>
                  {label && (
                    <span
                      style={{
                        fontSize: "10px",
                        fontWeight: active ? 650 : 500,
                        letterSpacing: "0.01em",
                        color: active
                          ? "var(--accent)"
                          : "var(--text-tertiary)",
                        transition: `color var(--duration-normal) var(--ease-out)`,
                      }}
                    >
                      {label}
                    </span>
                  )}
                  <div
                    style={{
                      width: "4px",
                      height: "4px",
                      borderRadius: "var(--radius-full)",
                      background: active ? "var(--accent)" : "transparent",
                      transition: `background var(--duration-normal) var(--ease-out), transform var(--duration-normal) var(--ease-spring)`,
                      transform: active ? "scale(1)" : "scale(0)",
                    }}
                  />
                </div>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
