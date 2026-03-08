"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  markIncomeReceived,
  markIncomeAsExpected,
  deleteMonthlyIncome,
  updateMonthlyIncomeAmount,
  markVariableIncomeReceived,
} from "@/lib/actions/monthly-incomes";
import {
  IncomeInstanceRow,
  VariableIncomeRow,
} from "@/components/IncomeTrackingRow";
import AdhocIncomeModal from "@/components/AdhocIncomeModal";
import SheetCloseButton from "@/components/SheetCloseButton";
import type { MonthlyIncome, Income } from "@/lib/types";

type IncomeTrackingTabProps = {
  monthlyIncomes: MonthlyIncome[];
  unregisteredVariables: Income[];
  month: string;
  isCurrentMonth: boolean;
};

export default function IncomeTrackingTab({
  monthlyIncomes,
  unregisteredVariables,
  month,
  isCurrentMonth,
}: IncomeTrackingTabProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  // Sheet/modal state owned by this tab
  const [receiveModal, setReceiveModal] = useState<{
    income: MonthlyIncome | null;
    variableIncome: Income | null;
  } | null>(null);
  const [receiveAmount, setReceiveAmount] = useState("");
  const [adhocModal, setAdhocModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState<MonthlyIncome | null>(null);
  const [updateAmountModal, setUpdateAmountModal] =
    useState<MonthlyIncome | null>(null);
  const [updateAmount, setUpdateAmount] = useState("");

  // Split incomes into recurring (expected > 0 or variable) vs adhoc (expected = 0)
  const recurringIncomes = monthlyIncomes.filter(
    (mi) => Number(mi.expected_amount ?? 0) > 0,
  );
  const adhocIncomes = monthlyIncomes.filter(
    (mi) => Number(mi.expected_amount ?? 0) === 0,
  );
  const recurringCount = recurringIncomes.length + unregisteredVariables.length;
  const adhocCount = adhocIncomes.length;

  // ── Handlers ──────────────────────────────────────────────────────────────

  function openReceiveFixed(mi: MonthlyIncome) {
    setReceiveAmount(String(mi.expected_amount ?? ""));
    setReceiveModal({ income: mi, variableIncome: null });
  }

  function openReceiveVariable(inc: Income) {
    setReceiveAmount(String(inc.estimated_amount ?? ""));
    setReceiveModal({ income: null, variableIncome: inc });
  }

  function handleMarkExpected(id: string) {
    startTransition(async () => {
      await markIncomeAsExpected(id);
      router.refresh();
    });
  }

  function handleDelete(mi: MonthlyIncome) {
    setDeleteModal(mi);
  }

  function confirmDelete() {
    if (!deleteModal) return;
    startTransition(async () => {
      await deleteMonthlyIncome(deleteModal.id);
      setDeleteModal(null);
      router.refresh();
    });
  }

  function openUpdateAmount(mi: MonthlyIncome) {
    setUpdateAmount(String(mi.expected_amount ?? ""));
    setUpdateAmountModal(mi);
  }

  function confirmUpdateAmount() {
    if (!updateAmountModal) return;
    const amt = parseFloat(updateAmount);
    if (isNaN(amt) || amt < 0) return;
    startTransition(async () => {
      await updateMonthlyIncomeAmount(updateAmountModal.id, amt);
      setUpdateAmountModal(null);
      setUpdateAmount("");
      router.refresh();
    });
  }

  async function handleMarkReceived() {
    if (!receiveModal) return;
    const amt = parseFloat(receiveAmount);
    if (isNaN(amt) || amt <= 0) return;
    startTransition(async () => {
      if (receiveModal.income) {
        await markIncomeReceived(receiveModal.income.id, amt);
      } else if (receiveModal.variableIncome) {
        await markVariableIncomeReceived(
          receiveModal.variableIncome.id,
          month,
          amt,
        );
      }
      setReceiveModal(null);
      setReceiveAmount("");
      router.refresh();
    });
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      {/* ═══════ SECTION 1: Revenus récurrents ═══════ */}
      <div style={{ marginBottom: "24px" }}>
        {/* Section header — no add button, link to settings */}
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
              color: "var(--teal-700, #0F766E)",
            }}
          >
            REVENUS RÉCURRENTS ({recurringCount})
          </h2>
          <Link
            href="/parametres"
            style={{
              fontSize: "12px",
              fontWeight: 500,
              color: "var(--slate-400, #94A3B8)",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            Gérer dans Réglages
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </Link>
        </div>

        {/* Recurring items container */}
        {recurringCount > 0 ? (
          <div
            style={{
              background: "white",
              border: "1px solid var(--slate-200, #E2E8F0)",
              borderRadius: "var(--radius-lg, 18px)",
              boxShadow: "0 1px 2px rgba(15, 118, 110, 0.05)",
              overflow: "hidden",
            }}
          >
            {recurringIncomes.map((mi, i) => (
              <IncomeInstanceRow
                key={mi.id}
                mi={mi}
                index={i}
                isCurrentMonth={isCurrentMonth}
                onMarkReceived={() => openReceiveFixed(mi)}
                onMarkExpected={() => handleMarkExpected(mi.id)}
                onUpdateAmount={() => openUpdateAmount(mi)}
              />
            ))}
            {unregisteredVariables.map((inc, i) => (
              <VariableIncomeRow
                key={inc.id}
                inc={inc}
                index={recurringIncomes.length + i}
                isCurrentMonth={isCurrentMonth}
                onMarkReceived={() => openReceiveVariable(inc)}
              />
            ))}
          </div>
        ) : (
          <div
            style={{
              background: "white",
              border: "1px solid var(--slate-200, #E2E8F0)",
              borderRadius: "var(--radius-lg, 18px)",
              padding: "24px 16px",
              textAlign: "center",
            }}
          >
            <div
              style={{ fontSize: "1.5rem", marginBottom: "8px", opacity: 0.5 }}
            >
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ color: "var(--slate-300, #CBD5E1)" }}
              >
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                <polyline points="17 6 23 6 23 12" />
              </svg>
            </div>
            <p
              style={{
                color: "var(--slate-400, #94A3B8)",
                fontSize: "14px",
                fontWeight: 500,
                marginBottom: "4px",
              }}
            >
              Aucun revenu récurrent
            </p>
            <p
              style={{
                color: "var(--slate-300, #CBD5E1)",
                fontSize: "12px",
              }}
            >
              Ajoutez vos sources de revenus dans les{" "}
              <Link
                href="/parametres"
                style={{
                  color: "var(--teal-600, #0D9488)",
                  textDecoration: "underline",
                  textUnderlineOffset: "2px",
                }}
              >
                réglages
              </Link>
            </p>
          </div>
        )}
      </div>

      {/* ═══════ SECTION 2: Revenus ponctuels ═══════ */}
      <div style={{ marginBottom: "20px" }}>
        {/* Section header — with add button */}
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
              color: "var(--teal-700, #0F766E)",
            }}
          >
            REVENUS PONCTUELS ({adhocCount})
          </h2>
          {isCurrentMonth && (
            <button
              onClick={() => setAdhocModal(true)}
              className="btn-desktop-only"
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
              Revenu ponctuel
            </button>
          )}
        </div>

        {/* Adhoc items container */}
        {adhocCount > 0 ? (
          <div
            style={{
              background: "white",
              border: "1px solid var(--slate-200, #E2E8F0)",
              borderRadius: "var(--radius-lg, 18px)",
              boxShadow: "0 1px 2px rgba(15, 118, 110, 0.05)",
              overflow: "hidden",
            }}
          >
            {adhocIncomes.map((mi, i) => (
              <IncomeInstanceRow
                key={mi.id}
                mi={mi}
                index={i}
                isCurrentMonth={isCurrentMonth}
                onMarkReceived={() => openReceiveFixed(mi)}
                onMarkExpected={() => handleMarkExpected(mi.id)}
                onDelete={() => handleDelete(mi)}
              />
            ))}
          </div>
        ) : (
          <div
            style={{
              background: "white",
              border: "1px solid var(--slate-200, #E2E8F0)",
              borderRadius: "var(--radius-lg, 18px)",
              padding: "24px 16px",
              textAlign: "center",
            }}
          >
            <div
              style={{ fontSize: "1.5rem", marginBottom: "8px", opacity: 0.5 }}
            >
              💰
            </div>
            <p
              style={{
                color: "var(--slate-400, #94A3B8)",
                fontSize: "14px",
                fontWeight: 500,
                marginBottom: "4px",
              }}
            >
              Aucun revenu ponctuel
            </p>
            <p
              style={{
                color: "var(--slate-300, #CBD5E1)",
                fontSize: "12px",
              }}
            >
              Bonus, remboursement, vente... ajoutez-les ici
            </p>
          </div>
        )}
      </div>

      {/* Adhoc FAB — mobile only, current month only */}
      {isCurrentMonth && (
        <button
          onClick={() => setAdhocModal(true)}
          className="fab fab-mobile-only"
          aria-label="Ajouter un revenu ponctuel"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      )}

      {/* ── Modals ────────────────────────────────────────────────────────── */}

      {/* Mark received modal */}
      {receiveModal && (
        <div
          className="sheet-backdrop"
          style={{ zIndex: 110 }}
          onClick={(e) => e.target === e.currentTarget && setReceiveModal(null)}
          role="presentation"
        >
          <div
            className="sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="receive-dialog-title"
            tabIndex={-1}
            onKeyDown={(e) => e.key === "Escape" && setReceiveModal(null)}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sheet-handle" />
            <SheetCloseButton onClose={() => setReceiveModal(null)} />
            <div style={{ padding: "8px 24px 32px" }}>
              <h2
                id="receive-dialog-title"
                style={{
                  fontSize: "18px",
                  fontWeight: 700,
                  color: "var(--slate-900, #0F172A)",
                  letterSpacing: "-0.02em",
                  marginBottom: "20px",
                }}
              >
                Marquer reçu
              </h2>
              <div style={{ marginBottom: "20px" }}>
                <p
                  style={{
                    fontSize: "14px",
                    color: "var(--slate-500, #64748B)",
                    marginBottom: "4px",
                  }}
                >
                  {receiveModal.income?.income_name ??
                    receiveModal.variableIncome?.name}
                </p>
                <label
                  htmlFor="receive-amount"
                  className="field-label"
                  style={{ marginTop: "16px", display: "block" }}
                >
                  Montant réellement reçu ($)
                </label>
                <input
                  id="receive-amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={receiveAmount}
                  onChange={(e) => setReceiveAmount(e.target.value)}
                  className="input-field"
                  style={{ fontVariantNumeric: "tabular-nums" }}
                />
              </div>
              <button
                onClick={handleMarkReceived}
                className="btn-primary"
                style={{ width: "100%", padding: "16px", fontSize: "15px" }}
              >
                Confirmer la réception
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Adhoc income modal */}
      {adhocModal && (
        <AdhocIncomeModal
          month={month}
          onClose={() => {
            setAdhocModal(false);
            router.refresh();
          }}
        />
      )}

      {/* Delete confirmation modal */}
      {deleteModal && (
        <div
          className="sheet-backdrop"
          style={{ zIndex: 110 }}
          onClick={(e) => e.target === e.currentTarget && setDeleteModal(null)}
          role="presentation"
        >
          <div
            className="sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-income-dialog-title"
            tabIndex={-1}
            onKeyDown={(e) => e.key === "Escape" && setDeleteModal(null)}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sheet-handle" />
            <SheetCloseButton onClose={() => setDeleteModal(null)} />
            <div style={{ padding: "8px 24px 32px" }}>
              <h2
                id="delete-income-dialog-title"
                style={{
                  fontSize: "18px",
                  fontWeight: 700,
                  color: "var(--slate-900, #0F172A)",
                  letterSpacing: "-0.02em",
                  marginBottom: "8px",
                }}
              >
                Supprimer ce revenu ?
              </h2>
              <p
                style={{
                  fontSize: "14px",
                  color: "var(--slate-400, #94A3B8)",
                  marginBottom: "24px",
                }}
              >
                {deleteModal.income_name} sera retiré de ce mois. Cette action
                est irréversible.
              </p>
              <div style={{ display: "flex", gap: "12px" }}>
                <button
                  onClick={() => setDeleteModal(null)}
                  className="btn-secondary"
                  style={{ flex: 1, padding: "14px" }}
                >
                  Annuler
                </button>
                <button
                  onClick={confirmDelete}
                  style={{
                    flex: 1,
                    padding: "14px",
                    background: "var(--error, #DC2626)",
                    color: "white",
                    border: "none",
                    borderRadius: "var(--radius-md, 12px)",
                    fontSize: "15px",
                    fontWeight: 650,
                    cursor: "pointer",
                  }}
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Update expected amount modal */}
      {updateAmountModal && (
        <div
          className="sheet-backdrop"
          style={{ zIndex: 110 }}
          onClick={(e) =>
            e.target === e.currentTarget && setUpdateAmountModal(null)
          }
          role="presentation"
        >
          <div
            className="sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="update-amount-dialog-title"
            tabIndex={-1}
            onKeyDown={(e) => e.key === "Escape" && setUpdateAmountModal(null)}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sheet-handle" />
            <SheetCloseButton onClose={() => setUpdateAmountModal(null)} />
            <div style={{ padding: "8px 24px 32px" }}>
              <h2
                id="update-amount-dialog-title"
                style={{
                  fontSize: "18px",
                  fontWeight: 700,
                  color: "var(--slate-900, #0F172A)",
                  letterSpacing: "-0.02em",
                  marginBottom: "4px",
                }}
              >
                Modifier le montant attendu
              </h2>
              <p
                style={{
                  fontSize: "12px",
                  color: "var(--slate-400, #94A3B8)",
                  marginBottom: "20px",
                }}
              >
                Ce mois uniquement — le modèle récurrent dans les réglages reste
                inchangé.
              </p>
              <div style={{ marginBottom: "20px" }}>
                <p
                  style={{
                    fontSize: "14px",
                    color: "var(--slate-500, #64748B)",
                    marginBottom: "4px",
                  }}
                >
                  {updateAmountModal.income_name}
                </p>
                <label
                  htmlFor="update-expected-amount"
                  className="field-label"
                  style={{ marginTop: "16px", display: "block" }}
                >
                  Nouveau montant attendu ($)
                </label>
                <input
                  id="update-expected-amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={updateAmount}
                  onChange={(e) => setUpdateAmount(e.target.value)}
                  className="input-field"
                  style={{ fontVariantNumeric: "tabular-nums" }}
                />
              </div>
              <button
                onClick={confirmUpdateAmount}
                className="btn-primary"
                style={{ width: "100%", padding: "16px", fontSize: "15px" }}
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
