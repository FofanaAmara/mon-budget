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
  const totalCount = 1 + projets.length;

  return (
    <div style={{ margin: "0 20px 32px" }}>
      {/* Section header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
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
          ÉPARGNE ({totalCount})
        </h2>
        <button
          onClick={onCreateProject}
          style={{
            padding: "8px 16px",
            borderRadius: "8px",
            fontSize: "13px",
            fontWeight: 600,
            color: "white",
            background: "#0F766E",
            border: "none",
            cursor: "pointer",
            letterSpacing: "-0.01em",
            display: "inline-flex",
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

      {/* GroupedContainer */}
      <div
        style={{
          background: "white",
          border: "1px solid #E2E8F0",
          borderRadius: "18px",
          boxShadow: "0 1px 2px rgba(15, 118, 110, 0.05)",
          overflow: "hidden",
        }}
      >
        {/* Épargne libre — permanent, always first */}
        <SavingsProjectCard
          projet={freeSavings}
          isFreeSavings
          isFirst={true}
          onAddSavings={() => onAddSavings(freeSavings)}
          onTransfer={() => onTransfer(freeSavings)}
          onHistory={() => onHistory(freeSavings)}
          onDelete={() => {}}
        />

        {/* Project pots */}
        {projets.length === 0 ? (
          <div
            style={{
              padding: "24px 16px",
              textAlign: "center",
              borderTop: "1px solid #E2E8F0",
            }}
          >
            <div
              style={{ fontSize: "1.5rem", marginBottom: "8px", opacity: 0.5 }}
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
              isFirst={false}
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
