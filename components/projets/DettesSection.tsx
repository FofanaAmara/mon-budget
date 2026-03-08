"use client";

import DebtCard from "@/components/projets/DebtCard";
import type { Debt } from "@/lib/types";

type Props = {
  debts: Debt[];
  onCreateDebt: () => void;
  onPay: (debt: Debt) => void;
  onCharge: (debt: Debt) => void;
  onEdit: (debt: Debt) => void;
  onDelete: (id: string) => void;
};

export default function DettesSection({
  debts,
  onCreateDebt,
  onPay,
  onCharge,
  onEdit,
  onDelete,
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
          DETTES ({debts.length})
        </h2>
        <button
          onClick={onCreateDebt}
          className="btn-desktop-only"
          style={{
            padding: "8px 14px",
            borderRadius: "var(--radius-md)",
            fontSize: "13px",
            fontWeight: 600,
            color: "var(--error)",
            background: "transparent",
            border: "1.5px solid var(--error)",
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
          Nouvelle dette
        </button>
      </div>

      {debts.length === 0 ? (
        <div
          className="card"
          style={{ padding: "32px 20px", textAlign: "center" }}
        >
          <div style={{ fontSize: "2rem", marginBottom: "8px", opacity: 0.5 }}>
            &#128201;
          </div>
          <p
            style={{
              color: "var(--text-tertiary)",
              fontSize: "var(--text-sm)",
              fontWeight: 500,
              marginBottom: "4px",
            }}
          >
            Aucune dette
          </p>
          <p
            style={{
              color: "var(--text-tertiary)",
              fontSize: "var(--text-xs)",
              opacity: 0.7,
            }}
          >
            Ajoutez vos prets et dettes pour suivre votre valeur nette
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {debts.map((debt) => (
            <DebtCard
              key={debt.id}
              debt={debt}
              onPay={() => onPay(debt)}
              onCharge={() => onCharge(debt)}
              onEdit={() => onEdit(debt)}
              onDelete={() => onDelete(debt.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
