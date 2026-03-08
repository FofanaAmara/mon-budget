"use client";

import SavingsProjectCard from "@/components/projets/SavingsProjectCard";
import type { Expense } from "@/lib/types";

type Props = {
  freeSavings: Expense;
  projets: Expense[];
  onCreateProject: () => void;
  onAddSavings: (projet: Expense) => void;
  onTransfer: (projet: Expense) => void;
  onHistory: (projet: Expense) => void;
  onDeleteProject: (id: string) => void;
};

export default function EpargneSection({
  freeSavings,
  projets,
  onCreateProject,
  onAddSavings,
  onTransfer,
  onHistory,
  onDeleteProject,
}: Props) {
  return (
    <div style={{ margin: "0 20px 32px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          marginBottom: "14px",
        }}
      >
        <h2
          style={{
            fontSize: "11px",
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--teal-700)",
          }}
        >
          ÉPARGNE ({1 + projets.length})
        </h2>
        <button
          onClick={onCreateProject}
          className="btn-desktop-only"
          style={{
            padding: "8px 14px",
            borderRadius: "var(--radius-md)",
            fontSize: "13px",
            fontWeight: 600,
            color: "var(--teal-700)",
            background: "transparent",
            border: "1.5px solid var(--teal-700)",
            cursor: "pointer",
            letterSpacing: "-0.01em",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Nouveau projet
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {/* Épargne libre -- permanent */}
        <SavingsProjectCard
          projet={freeSavings}
          isFreeSavings
          onAddSavings={() => onAddSavings(freeSavings)}
          onTransfer={() => onTransfer(freeSavings)}
          onHistory={() => onHistory(freeSavings)}
          onDelete={() => {}}
        />

        {/* Project pots */}
        {projets.length === 0 ? (
          <div
            className="card"
            style={{ padding: "32px 20px", textAlign: "center" }}
          >
            <div
              style={{ fontSize: "2rem", marginBottom: "8px", opacity: 0.5 }}
            >
              &#127919;
            </div>
            <p
              style={{
                color: "var(--text-tertiary)",
                fontSize: "var(--text-sm)",
                fontWeight: 500,
                marginBottom: "4px",
              }}
            >
              Aucun projet d&apos;épargne
            </p>
            <p
              style={{
                color: "var(--text-tertiary)",
                fontSize: "var(--text-xs)",
                opacity: 0.7,
              }}
            >
              Créez un projet avec un objectif et une date cible
            </p>
          </div>
        ) : (
          projets.map((projet) => (
            <SavingsProjectCard
              key={projet.id}
              projet={projet}
              onAddSavings={() => onAddSavings(projet)}
              onTransfer={() => onTransfer(projet)}
              onHistory={() => onHistory(projet)}
              onDelete={() => onDeleteProject(projet.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
