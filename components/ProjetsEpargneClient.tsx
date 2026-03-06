"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteExpense } from "@/lib/actions/expenses";
import { deleteDebt } from "@/lib/actions/debts";
import { formatCAD } from "@/lib/utils";
import ProjectModal from "@/components/ProjectModal";
import DebtModal from "@/components/DebtModal";
import AddSavingsModal from "@/components/AddSavingsModal";
import SavingsHistoryModal from "@/components/SavingsHistoryModal";
import TransferSavingsModal from "@/components/TransferSavingsModal";
import SavingsProjectCard from "@/components/projets/SavingsProjectCard";
import DebtCard from "@/components/projets/DebtCard";
import ExtraPaymentSheet from "@/components/projets/ExtraPaymentSheet";
import ChargeDebtSheet from "@/components/projets/ChargeDebtSheet";
import type { Expense, Section, Card, Debt } from "@/lib/types";

type Props = {
  projets: Expense[];
  sections: Section[];
  cards: Card[];
  freeSavings: Expense;
  debts: Debt[];
  totalDebtBalance: number;
};

export default function ProjetsEpargneClient({
  projets,
  sections,
  cards,
  freeSavings,
  debts,
  totalDebtBalance,
}: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [createModal, setCreateModal] = useState(false);
  const [debtModal, setDebtModal] = useState(false);
  const [editDebt, setEditDebt] = useState<Debt | null>(null);
  const [extraPayDebt, setExtraPayDebt] = useState<Debt | null>(null);
  const [chargeDebt, setChargeDebt] = useState<Debt | null>(null);
  const [savingsModal, setSavingsModal] = useState<Expense | null>(null);
  const [historyModal, setHistoryModal] = useState<Expense | null>(null);
  const [transferModal, setTransferModal] = useState<Expense | null>(null);
  const [fabOpen, setFabOpen] = useState(false);

  const allPots = [freeSavings, ...projets];

  const freeSaved = Number(freeSavings.saved_amount ?? 0);
  const projectsSaved = projets.reduce(
    (s, p) => s + Number(p.saved_amount ?? 0),
    0,
  );
  const totalEpargne = freeSaved + projectsSaved;
  const valeurNette = totalEpargne - totalDebtBalance;
  const isPositive = valeurNette >= 0;

  function handleDeleteProject(id: string) {
    if (confirm("Supprimer ce projet ?")) {
      startTransition(async () => {
        await deleteExpense(id);
        router.refresh();
      });
    }
  }

  function handleDeleteDebt(id: string) {
    if (confirm("Supprimer cette dette ?")) {
      startTransition(async () => {
        await deleteDebt(id);
        router.refresh();
      });
    }
  }

  function handleSavingsDone() {
    setSavingsModal(null);
    router.refresh();
  }

  return (
    <div style={{ padding: "0 0 120px", minHeight: "100vh" }}>
      {/* -- MONUMENT: Valeur nette -- */}
      <div
        style={{
          padding: "32px 20px 24px",
          textAlign: "center",
          position: "relative",
        }}
      >
        <p
          style={{
            fontSize: "12px",
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "var(--teal-700)",
            marginBottom: "10px",
          }}
        >
          Patrimoine
        </p>

        <p
          style={{
            fontSize: "clamp(3rem, 12vw, 5rem)",
            fontWeight: 800,
            letterSpacing: "-0.04em",
            lineHeight: 1,
            fontVariantNumeric: "tabular-nums",
            margin: "0 0 8px",
            color: isPositive ? "var(--teal-700)" : "var(--error)",
          }}
        >
          <span
            style={{
              fontSize: "0.65em",
              fontWeight: 700,
              verticalAlign: "baseline",
            }}
          >
            {isPositive ? "+" : "-"}
          </span>
          <span
            style={{
              fontSize: "0.4em",
              fontWeight: 600,
              verticalAlign: "super",
              marginLeft: "2px",
              color: isPositive ? "var(--teal-800)" : "var(--error)",
            }}
          >
            $
          </span>
          {Math.abs(valeurNette).toLocaleString("fr-CA", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          })}
        </p>

        <p
          style={{
            fontSize: "14px",
            fontWeight: 500,
            color: "var(--slate-400)",
            marginBottom: "12px",
            letterSpacing: "-0.01em",
          }}
        >
          Epargne {formatCAD(totalEpargne)} · Dettes{" "}
          {formatCAD(totalDebtBalance)}
        </p>

        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "5px 14px",
            borderRadius: "100px",
            fontSize: "13px",
            fontWeight: 600,
            background: isPositive
              ? "var(--success-light)"
              : "var(--error-light)",
            color: isPositive ? "var(--success, #059669)" : "var(--error)",
          }}
        >
          {isPositive ? (
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
              <polyline points="16 7 22 7 22 13" />
            </svg>
          ) : (
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="22 17 13.5 8.5 8.5 13.5 2 7" />
              <polyline points="16 17 22 17 22 11" />
            </svg>
          )}
          {isPositive ? "En croissance" : "En deficit"}
        </span>
      </div>

      {/* -- TOTALS BAR -- */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "2px",
          margin: "0 20px 28px",
          background: "var(--slate-100)",
          borderRadius: "var(--radius-md)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "16px 12px",
            background: "var(--white, #fff)",
            textAlign: "center",
            borderRadius: "var(--radius-md) 0 0 var(--radius-md)",
          }}
        >
          <p
            style={{
              fontSize: "11px",
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--slate-400)",
              marginBottom: "4px",
            }}
          >
            Epargne
          </p>
          <p
            style={{
              fontSize: "clamp(1.2rem, 4vw, 1.5rem)",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              lineHeight: 1.1,
              fontVariantNumeric: "tabular-nums",
              color: "var(--teal-700)",
            }}
          >
            <span
              style={{
                fontSize: "0.5em",
                fontWeight: 600,
                color: "var(--teal-800)",
              }}
            >
              $
            </span>
            {totalEpargne.toLocaleString("fr-CA", {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            })}
          </p>
          <p
            style={{
              fontSize: "11px",
              fontWeight: 500,
              color: "var(--slate-400)",
              marginTop: "2px",
            }}
          >
            {projets.length + 1} pot{projets.length + 1 !== 1 ? "s" : ""}
          </p>
        </div>
        <div
          style={{
            padding: "16px 12px",
            background: "var(--white, #fff)",
            textAlign: "center",
            borderRadius: "0 var(--radius-md) var(--radius-md) 0",
          }}
        >
          <p
            style={{
              fontSize: "11px",
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--slate-400)",
              marginBottom: "4px",
            }}
          >
            Dettes
          </p>
          <p
            style={{
              fontSize: "clamp(1.2rem, 4vw, 1.5rem)",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              lineHeight: 1.1,
              fontVariantNumeric: "tabular-nums",
              color: debts.length > 0 ? "var(--error)" : "var(--slate-400)",
            }}
          >
            <span
              style={{
                fontSize: "0.5em",
                fontWeight: 600,
                color: debts.length > 0 ? "var(--error)" : "var(--slate-400)",
              }}
            >
              $
            </span>
            {totalDebtBalance.toLocaleString("fr-CA", {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            })}
          </p>
          <p
            style={{
              fontSize: "11px",
              fontWeight: 500,
              color: "var(--slate-400)",
              marginTop: "2px",
            }}
          >
            {debts.length} dette{debts.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* -- EPARGNE SECTION -- */}
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
              fontSize: "13px",
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--teal-700)",
            }}
          >
            Epargne
          </h2>
          <button
            onClick={() => setCreateModal(true)}
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
          {/* Epargne libre -- permanent */}
          <SavingsProjectCard
            projet={freeSavings}
            isFreeSavings
            onAddSavings={() => setSavingsModal(freeSavings)}
            onTransfer={() => setTransferModal(freeSavings)}
            onHistory={() => setHistoryModal(freeSavings)}
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
                Aucun projet d&apos;epargne
              </p>
              <p
                style={{
                  color: "var(--text-tertiary)",
                  fontSize: "var(--text-xs)",
                  opacity: 0.7,
                }}
              >
                Creez un projet avec un objectif et une date cible
              </p>
            </div>
          ) : (
            projets.map((projet) => (
              <SavingsProjectCard
                key={projet.id}
                projet={projet}
                onAddSavings={() => setSavingsModal(projet)}
                onTransfer={() => setTransferModal(projet)}
                onHistory={() => setHistoryModal(projet)}
                onDelete={() => handleDeleteProject(projet.id)}
              />
            ))
          )}
        </div>
      </div>

      {/* -- DETTES SECTION -- */}
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
              fontSize: "13px",
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--error)",
            }}
          >
            Dettes
          </h2>
          <button
            onClick={() => {
              setEditDebt(null);
              setDebtModal(true);
            }}
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
            <div
              style={{ fontSize: "2rem", marginBottom: "8px", opacity: 0.5 }}
            >
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
          <div
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            {debts.map((debt) => (
              <DebtCard
                key={debt.id}
                debt={debt}
                onPay={() => setExtraPayDebt(debt)}
                onCharge={() => setChargeDebt(debt)}
                onEdit={() => {
                  setEditDebt(debt);
                  setDebtModal(true);
                }}
                onDelete={() => handleDeleteDebt(debt.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* -- FAB EXPANDABLE (mobile only) -- */}
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
              setCreateModal(true);
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
              setEditDebt(null);
              setDebtModal(true);
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

      {/* -- MODALS -- */}
      {createModal && (
        <ProjectModal
          sections={sections}
          onClose={() => {
            setCreateModal(false);
            router.refresh();
          }}
        />
      )}
      {debtModal && (
        <DebtModal
          sections={sections}
          cards={cards}
          debt={editDebt}
          onClose={() => {
            setDebtModal(false);
            setEditDebt(null);
            router.refresh();
          }}
        />
      )}
      {extraPayDebt && (
        <ExtraPaymentSheet
          debt={extraPayDebt}
          onClose={() => setExtraPayDebt(null)}
        />
      )}
      {chargeDebt && (
        <ChargeDebtSheet
          debt={chargeDebt}
          onClose={() => setChargeDebt(null)}
        />
      )}
      {savingsModal && (
        <AddSavingsModal
          expenseId={savingsModal.id}
          projectName={savingsModal.name}
          currentSaved={Number(savingsModal.saved_amount ?? 0)}
          targetAmount={
            savingsModal.target_amount !== null
              ? Number(savingsModal.target_amount)
              : null
          }
          onDone={handleSavingsDone}
          onClose={() => setSavingsModal(null)}
        />
      )}
      {transferModal && (
        <TransferSavingsModal
          source={transferModal}
          allPots={allPots}
          onDone={() => {
            setTransferModal(null);
            router.refresh();
          }}
          onClose={() => setTransferModal(null)}
        />
      )}
      {historyModal && (
        <SavingsHistoryModal
          expenseId={historyModal.id}
          projectName={historyModal.name}
          currentSaved={Number(historyModal.saved_amount ?? 0)}
          targetAmount={
            historyModal.target_amount !== null
              ? Number(historyModal.target_amount)
              : null
          }
          onClose={() => {
            setHistoryModal(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
