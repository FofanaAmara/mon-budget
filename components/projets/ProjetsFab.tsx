"use client";

import { useState } from "react";

type Props = {
  onCreateProject: () => void;
  onCreateDebt: () => void;
};

export default function ProjetsFab({ onCreateProject, onCreateDebt }: Props) {
  const [fabOpen, setFabOpen] = useState(false);

  return (
    <>
      {fabOpen && (
        <div
          className="fab-mobile-only"
          onClick={() => setFabOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.3)",
            backdropFilter: "blur(2px)",
            WebkitBackdropFilter: "blur(2px)",
            zIndex: 39,
          }}
        />
      )}
      <div
        className="fab-mobile-only"
        style={{
          position: "fixed",
          bottom: "max(72px, calc(56px + env(safe-area-inset-bottom)))",
          right: "20px",
          zIndex: 40,
        }}
      >
        <div
          style={{
            position: "absolute",
            bottom: "64px",
            right: 0,
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            opacity: fabOpen ? 1 : 0,
            pointerEvents: fabOpen ? "auto" : "none",
            transform: fabOpen
              ? "translateY(0) scale(1)"
              : "translateY(8px) scale(0.95)",
            transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          <button
            onClick={() => {
              setFabOpen(false);
              onCreateProject();
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "10px 16px",
              background: "var(--white, #fff)",
              border: "1px solid var(--slate-200)",
              borderRadius: "var(--radius-md)",
              boxShadow: "var(--shadow-md)",
              cursor: "pointer",
              whiteSpace: "nowrap",
              fontFamily: "var(--font)",
              fontSize: "14px",
              fontWeight: 600,
              color: "var(--slate-900)",
              letterSpacing: "-0.01em",
              transition: "all 0.2s ease",
            }}
          >
            <span
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "var(--radius-sm)",
                background: "var(--teal-50)",
                color: "var(--teal-700)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="16" />
                <line x1="8" y1="12" x2="16" y2="12" />
              </svg>
            </span>
            Nouveau projet
          </button>
          <button
            onClick={() => {
              setFabOpen(false);
              onCreateDebt();
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "10px 16px",
              background: "var(--white, #fff)",
              border: "1px solid var(--slate-200)",
              borderRadius: "var(--radius-md)",
              boxShadow: "var(--shadow-md)",
              cursor: "pointer",
              whiteSpace: "nowrap",
              fontFamily: "var(--font)",
              fontSize: "14px",
              fontWeight: 600,
              color: "var(--slate-900)",
              letterSpacing: "-0.01em",
              transition: "all 0.2s ease",
            }}
          >
            <span
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "var(--radius-sm)",
                background: "var(--error-light)",
                color: "var(--error)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="2" y="5" width="20" height="14" rx="2" />
                <line x1="2" y1="10" x2="22" y2="10" />
              </svg>
            </span>
            Nouvelle dette
          </button>
        </div>
        <button
          onClick={() => setFabOpen(!fabOpen)}
          className="fab"
          aria-label="Ajouter"
          style={{
            position: "relative",
            bottom: 0,
            right: 0,
            background: fabOpen ? "var(--teal-800)" : "var(--teal-700)",
          }}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              transform: fabOpen ? "rotate(45deg)" : "rotate(0deg)",
              transition: "transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      </div>
    </>
  );
}
