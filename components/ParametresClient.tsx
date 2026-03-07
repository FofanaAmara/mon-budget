"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth/client";
import { loadDemoData, clearAllUserData } from "@/lib/actions/demo-data";
import { resetSetupGuide } from "@/lib/actions/setup-guide";

const PREFERENCE_ITEMS = [
  {
    href: "/parametres/devise",
    label: "Devise par defaut",
    icon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M15 9.354a4 4 0 1 0 0 5.292M12 7v10" />
      </svg>
    ),
  },
  {
    href: "/parametres/rappels",
    label: "Rappels par defaut",
    icon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    ),
  },
  {
    href: "/parametres/notifications",
    label: "Notifications",
    icon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M22 17H2a3 3 0 0 0 3-3V9a7 7 0 0 1 14 0v5a3 3 0 0 0 3 3z" />
        <path d="M9.09 21a3 3 0 0 0 5.83 0" />
      </svg>
    ),
  },
];

const MANAGEMENT_ITEMS = [
  {
    href: "/parametres/allocation",
    label: "Allocation du revenu",
    icon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
      </svg>
    ),
  },
  {
    href: "/parametres/charges",
    label: "Mes dépenses récurrentes",
    icon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
  },
  {
    href: "/parametres/revenus",
    label: "Mes revenus recurrents",
    icon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
  },
  {
    href: "/cartes",
    label: "Mes cartes de paiement",
    icon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="2" y="5" width="20" height="14" rx="3" />
        <path d="M2 10h20" />
      </svg>
    ),
  },
  {
    href: "/sections",
    label: "Mes catégories de dépenses",
    icon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
];

function LinkRow({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <Link href={href} className="link-row" style={{ textDecoration: "none" }}>
      <div className="flex items-center" style={{ gap: "12px" }}>
        <span style={{ color: "var(--text-tertiary)" }}>{icon}</span>
        <span
          style={{ fontSize: "var(--text-sm)", color: "var(--text-primary)" }}
        >
          {label}
        </span>
      </div>
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="var(--text-tertiary)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M9 18l6-6-6-6" />
      </svg>
    </Link>
  );
}

export default function ParametresClient({ hasData }: { hasData: boolean }) {
  const [showClearModal, setShowClearModal] = useState(false);
  const [isPendingLoad, startLoadTransition] = useTransition();
  const [isPendingClear, startClearTransition] = useTransition();
  const [isPendingReset, startResetTransition] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [guideResetDone, setGuideResetDone] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showClearModal) {
      dialogRef.current?.focus();
    }
  }, [showClearModal]);

  function handleResetGuide() {
    startResetTransition(async () => {
      await resetSetupGuide();
      setGuideResetDone(true);
    });
  }

  function handleLoadDemo() {
    setFeedback(null);
    startLoadTransition(async () => {
      const result = await loadDemoData();
      if (result.success) {
        window.location.reload();
      } else {
        setFeedback(result.error ?? "Erreur");
      }
    });
  }

  function handleClearAll() {
    setFeedback(null);
    startClearTransition(async () => {
      const result = await clearAllUserData();
      if (result.success) {
        window.location.href = "/";
      } else {
        setFeedback(result.error ?? "Erreur");
        setShowClearModal(false);
      }
    });
  }

  return (
    <div style={{ padding: "0 0 24px", minHeight: "100vh" }}>
      {/* Monument hero — Réglages */}
      <div style={{ padding: "32px 20px 24px", textAlign: "center" }}>
        <p
          style={{
            fontSize: "12px",
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "var(--accent)",
            marginBottom: "16px",
          }}
        >
          Réglages
        </p>
        {/* Icône Settings stylisée */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "72px",
            height: "72px",
            background: "var(--positive-subtle)",
            borderRadius: "20px",
            marginBottom: "12px",
          }}
        >
          <svg
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--accent)"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </div>
        <p
          style={{
            fontSize: "var(--text-sm)",
            fontWeight: 500,
            color: "var(--text-tertiary)",
            marginTop: "4px",
          }}
        >
          Personnalisez votre expérience
        </p>
      </div>

      <div
        style={{
          padding: "0 20px",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        {/* Mon compte */}
        <div className="list-card">
          <LinkRow
            href="/account/settings"
            label="Mon compte"
            icon={
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            }
          />
        </div>

        {/* Guide de configuration */}
        <div className="list-card">
          <div
            style={{
              padding: "8px 20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <button
              onClick={handleResetGuide}
              disabled={isPendingReset || guideResetDone}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                background: "none",
                border: "none",
                cursor:
                  isPendingReset || guideResetDone ? "default" : "pointer",
                padding: "8px 0",
                width: "100%",
                textAlign: "left",
              }}
            >
              <span style={{ color: "var(--text-tertiary)" }}>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                </svg>
              </span>
              <span
                style={{
                  fontSize: "var(--text-sm)",
                  color: guideResetDone
                    ? "var(--text-tertiary)"
                    : "var(--text-primary)",
                  fontWeight: guideResetDone ? 500 : undefined,
                }}
              >
                {isPendingReset
                  ? "Relance en cours..."
                  : guideResetDone
                    ? "Guide relance !"
                    : "Revoir le guide de configuration"}
              </span>
            </button>
          </div>
        </div>

        {/* Preferences */}
        <div className="list-card">
          <div style={{ padding: "16px 20px 8px" }}>
            <h2
              style={{
                fontSize: "var(--text-sm)",
                fontWeight: 650,
                color: "var(--text-primary)",
              }}
            >
              Preferences
            </h2>
          </div>
          {PREFERENCE_ITEMS.map(({ href, label, icon }) => (
            <LinkRow key={href} href={href} label={label} icon={icon} />
          ))}
        </div>

        {/* Gestion */}
        <div className="list-card">
          <div style={{ padding: "16px 20px 8px" }}>
            <h2
              style={{
                fontSize: "var(--text-sm)",
                fontWeight: 650,
                color: "var(--text-primary)",
              }}
            >
              Gestion
            </h2>
          </div>
          {MANAGEMENT_ITEMS.map(({ href, label, icon }) => (
            <LinkRow key={href} href={href} label={label} icon={icon} />
          ))}
        </div>

        {/* Donnees */}
        <div className="list-card">
          <div style={{ padding: "16px 20px 8px" }}>
            <h2
              style={{
                fontSize: "var(--text-sm)",
                fontWeight: 650,
                color: "var(--text-primary)",
              }}
            >
              Donnees
            </h2>
          </div>
          <div
            style={{
              padding: "8px 20px 16px",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
            }}
          >
            {/* Load demo */}
            <button
              onClick={handleLoadDemo}
              disabled={hasData || isPendingLoad}
              style={{
                width: "100%",
                padding: "12px",
                fontSize: "var(--text-sm)",
                fontWeight: 600,
                background: hasData ? "var(--surface-inset)" : "var(--accent)",
                color: hasData ? "var(--text-tertiary)" : "white",
                border: "none",
                borderRadius: "var(--radius-md)",
                cursor: hasData
                  ? "not-allowed"
                  : isPendingLoad
                    ? "wait"
                    : "pointer",
                opacity: isPendingLoad ? 0.7 : 1,
                transition: "opacity 0.2s",
              }}
            >
              {isPendingLoad
                ? "Chargement..."
                : "✨ Charger les donnees de demo"}
            </button>
            {hasData && (
              <p
                style={{
                  fontSize: "var(--text-xs)",
                  color: "var(--text-tertiary)",
                  textAlign: "center",
                }}
              >
                Disponible uniquement quand le compte est vide
              </p>
            )}

            {/* Clear all */}
            <button
              onClick={() => setShowClearModal(true)}
              disabled={!hasData}
              style={{
                width: "100%",
                padding: "12px",
                fontSize: "var(--text-sm)",
                fontWeight: 600,
                background: "transparent",
                color: hasData ? "#DC2626" : "var(--text-tertiary)",
                border: `1px solid ${hasData ? "#DC2626" : "var(--border)"}`,
                borderRadius: "var(--radius-md)",
                cursor: hasData ? "pointer" : "not-allowed",
              }}
            >
              Vider toutes les donnees
            </button>

            {feedback && (
              <p
                style={{
                  fontSize: "var(--text-xs)",
                  color: "#DC2626",
                  textAlign: "center",
                }}
              >
                {feedback}
              </p>
            )}
          </div>
        </div>

        {/* Sign out */}
        <button
          onClick={async () => {
            await authClient.signOut();
            window.location.href = "/auth/sign-in";
          }}
          style={{
            width: "100%",
            padding: "14px",
            fontSize: "var(--text-sm)",
            fontWeight: 600,
            color: "#DC2626",
            background: "var(--surface-raised)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-lg)",
            cursor: "pointer",
            marginTop: "8px",
          }}
        >
          Se deconnecter
        </button>
      </div>

      {/* Clear confirmation modal */}
      {showClearModal && (
        <div
          onClick={() => !isPendingClear && setShowClearModal(false)}
          role="presentation"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(0,0,0,0.45)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
          }}
        >
          <div
            ref={dialogRef}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="clear-data-dialog-title"
            tabIndex={-1}
            onKeyDown={(e) =>
              e.key === "Escape" && !isPendingClear && setShowClearModal(false)
            }
            style={{
              width: "100%",
              maxWidth: "360px",
              background: "var(--surface-raised)",
              borderRadius: "var(--radius-lg)",
              padding: "24px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
            }}
          >
            <h3
              id="clear-data-dialog-title"
              style={{
                fontSize: "var(--text-base)",
                fontWeight: 700,
                color: "var(--text-primary)",
                marginBottom: "12px",
              }}
            >
              Tout supprimer ?
            </h3>
            <p
              style={{
                fontSize: "var(--text-sm)",
                color: "var(--text-secondary)",
                lineHeight: "1.6",
                marginBottom: "24px",
              }}
            >
              Cette action est irreversible. Toutes vos donnees seront
              supprimees (depenses, revenus, cartes, dettes, epargne).
            </p>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={() => setShowClearModal(false)}
                disabled={isPendingClear}
                style={{
                  flex: 1,
                  padding: "12px",
                  fontSize: "var(--text-sm)",
                  fontWeight: 600,
                  background: "var(--surface-inset)",
                  color: "var(--text-primary)",
                  border: "none",
                  borderRadius: "var(--radius-md)",
                  cursor: "pointer",
                }}
              >
                Annuler
              </button>
              <button
                onClick={handleClearAll}
                disabled={isPendingClear}
                style={{
                  flex: 1,
                  padding: "12px",
                  fontSize: "var(--text-sm)",
                  fontWeight: 600,
                  background: "#DC2626",
                  color: "white",
                  border: "none",
                  borderRadius: "var(--radius-md)",
                  cursor: isPendingClear ? "wait" : "pointer",
                  opacity: isPendingClear ? 0.7 : 1,
                }}
              >
                {isPendingClear ? "Suppression..." : "Tout supprimer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
