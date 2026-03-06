"use client";

import React, { useState, useTransition, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  markAsPaid,
  markAsUpcoming,
  deleteMonthlyExpense,
  updateMonthlyExpenseAmount,
  deferExpenseToMonth,
} from "@/lib/actions/monthly-expenses";
import {
  addExpenseTransaction,
  getExpenseTransactions,
} from "@/lib/actions/expense-transactions";
import { formatCAD } from "@/lib/utils";
import type { MonthlyExpense, ExpenseTransaction } from "@/lib/types";

type ExpenseActionSheetProps = {
  expense: MonthlyExpense;
  month: string;
  onClose: () => void;
};

/**
 * Self-contained action sheet for expense tracking.
 * Manages its own sub-sheet navigation (action menu -> defer / edit / delete).
 */
export default function ExpenseActionSheet({
  expense,
  month,
  onClose,
}: ExpenseActionSheetProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  // Sub-sheet state
  const [view, setView] = useState<
    "actions" | "defer" | "edit" | "delete" | "add-transaction" | "history"
  >("actions");
  const [deferTargetMonth, setDeferTargetMonth] = useState(() => {
    const [y, m] = month.split("-").map(Number);
    const next = new Date(y, m, 1);
    return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}`;
  });
  const [editAmountValue, setEditAmountValue] = useState(
    String(expense.amount ?? ""),
  );

  // Progressive expense state
  const [transactionAmount, setTransactionAmount] = useState("");
  const [transactionNote, setTransactionNote] = useState("");
  const [transactions, setTransactions] = useState<ExpenseTransaction[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Current month label
  const currentMonthLabel = (() => {
    const [y, m] = month.split("-").map(Number);
    const d = new Date(y, m - 1, 1);
    const label = new Intl.DateTimeFormat("fr-CA", {
      month: "long",
      year: "numeric",
    }).format(d);
    return label.charAt(0).toUpperCase() + label.slice(1);
  })();

  function getFutureMonths(
    fromMonth: string,
    count = 6,
  ): Array<{ key: string; monthLabel: string; yearLabel: string }> {
    const [y, m] = fromMonth.split("-").map(Number);
    const result = [];
    for (let i = 1; i <= count; i++) {
      const d = new Date(y, m - 1 + i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const monthLabel = new Intl.DateTimeFormat("fr-CA", {
        month: "long",
      }).format(d);
      const yearLabel = String(d.getFullYear());
      result.push({
        key,
        monthLabel: monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1),
        yearLabel,
      });
    }
    return result;
  }

  function getDeferLabel(): string {
    if (!deferTargetMonth) return "Reporter";
    const months = getFutureMonths(month);
    const found = months.find((m) => m.key === deferTargetMonth);
    return found ? `Reporter vers ${found.monthLabel}` : "Reporter";
  }

  function handleToggle(action: "paid" | "upcoming") {
    startTransition(async () => {
      if (action === "paid") await markAsPaid(expense.id);
      else await markAsUpcoming(expense.id);
      onClose();
      router.refresh();
    });
  }

  function confirmDefer() {
    if (!deferTargetMonth) return;
    startTransition(async () => {
      await deferExpenseToMonth(expense.id, deferTargetMonth);
      onClose();
      router.refresh();
    });
  }

  function confirmEditAmount() {
    const amt = parseFloat(editAmountValue);
    if (isNaN(amt) || amt < 0) return;
    startTransition(async () => {
      await updateMonthlyExpenseAmount(expense.id, amt);
      onClose();
      router.refresh();
    });
  }

  function confirmDelete() {
    startTransition(async () => {
      await deleteMonthlyExpense(expense.id);
      onClose();
      router.refresh();
    });
  }

  function confirmAddTransaction() {
    const amt = parseFloat(transactionAmount);
    if (isNaN(amt) || amt <= 0) return;
    startTransition(async () => {
      await addExpenseTransaction(expense.id, amt, transactionNote || null);
      onClose();
      router.refresh();
    });
  }

  async function loadHistory() {
    setIsLoadingHistory(true);
    const txns = await getExpenseTransactions(expense.id);
    setTransactions(txns);
    setIsLoadingHistory(false);
  }

  // ── Render ──────────────────────────────────────────────────────────────

  if (view === "add-transaction") {
    return (
      <SheetWrapper onClose={onClose} titleId="add-transaction-sheet-title">
        <SheetHandle />
        <div style={{ padding: "0 20px 8px" }}>
          <h3 id="add-transaction-sheet-title" style={sheetTitleStyle}>
            Ajouter un achat
          </h3>

          {/* Expense summary */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              paddingBottom: "16px",
            }}
          >
            <div style={iconBoxStyle}>{expense.section?.icon ?? "💳"}</div>
            <div>
              <p style={expenseNameStyle}>{expense.name}</p>
              <p style={expenseMetaStyle}>
                {formatCAD(expense.paid_amount)} / {formatCAD(expense.amount)} ·{" "}
                {expense.section?.name ?? "—"}
              </p>
            </div>
          </div>

          <div style={{ marginBottom: "8px" }}>
            <p style={sectionLabelStyle}>Montant</p>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={transactionAmount}
              onChange={(e) => setTransactionAmount(e.target.value)}
              placeholder="0"
              autoFocus
              style={{
                width: "100%",
                padding: "16px",
                border: "1px solid var(--slate-200)",
                borderRadius: "var(--radius-sm)",
                fontFamily: "var(--font)",
                fontSize: "28px",
                fontWeight: 800,
                letterSpacing: "-0.03em",
                fontVariantNumeric: "tabular-nums",
                textAlign: "center",
                color: "var(--slate-900)",
                background: "var(--white)",
                outline: "none",
                transition: "border-color 0.2s, box-shadow 0.2s",
                WebkitAppearance: "none",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "var(--teal-700)";
                e.target.style.boxShadow = "0 0 0 3px rgba(15, 118, 110, 0.08)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "var(--slate-200)";
                e.target.style.boxShadow = "none";
              }}
            />
          </div>

          <div style={{ marginBottom: "8px" }}>
            <p style={sectionLabelStyle}>Note (optionnel)</p>
            <input
              type="text"
              value={transactionNote}
              onChange={(e) => setTransactionNote(e.target.value)}
              placeholder="Ex: Achat Amazon"
              style={{
                width: "100%",
                padding: "12px 16px",
                border: "1px solid var(--slate-200)",
                borderRadius: "var(--radius-sm)",
                fontFamily: "var(--font)",
                fontSize: "14px",
                fontWeight: 500,
                color: "var(--slate-900)",
                background: "var(--white)",
                outline: "none",
                transition: "border-color 0.2s, box-shadow 0.2s",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "var(--teal-700)";
                e.target.style.boxShadow = "0 0 0 3px rgba(15, 118, 110, 0.08)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "var(--slate-200)";
                e.target.style.boxShadow = "none";
              }}
            />
          </div>
        </div>
        <div style={{ display: "flex", gap: "10px", padding: "16px 20px 4px" }}>
          <button onClick={onClose} style={btnCancelStyle}>
            Annuler
          </button>
          <button
            onClick={confirmAddTransaction}
            disabled={!transactionAmount || parseFloat(transactionAmount) <= 0}
            style={btnPrimaryStyle}
          >
            Ajouter
          </button>
        </div>
      </SheetWrapper>
    );
  }

  if (view === "history") {
    return (
      <SheetWrapper onClose={onClose} titleId="history-sheet-title">
        <SheetHandle />
        <div style={{ padding: "0 20px 8px" }}>
          <h3 id="history-sheet-title" style={sheetTitleStyle}>
            Historique des achats
          </h3>

          {/* Expense summary */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              paddingBottom: "16px",
            }}
          >
            <div style={iconBoxStyle}>{expense.section?.icon ?? "💳"}</div>
            <div>
              <p style={expenseNameStyle}>{expense.name}</p>
              <p style={expenseMetaStyle}>
                {formatCAD(expense.paid_amount)} / {formatCAD(expense.amount)} ·{" "}
                {expense.section?.name ?? "—"}
              </p>
            </div>
          </div>

          {isLoadingHistory ? (
            <p
              style={{
                fontSize: "14px",
                color: "var(--slate-400)",
                textAlign: "center",
                padding: "20px 0",
              }}
            >
              Chargement...
            </p>
          ) : transactions.length === 0 ? (
            <p
              style={{
                fontSize: "14px",
                color: "var(--slate-400)",
                textAlign: "center",
                padding: "20px 0",
              }}
            >
              Aucun achat enregistre
            </p>
          ) : (
            <div>
              {transactions.map((txn) => {
                const date = new Date(txn.created_at);
                const dateLabel = new Intl.DateTimeFormat("fr-CA", {
                  day: "numeric",
                  month: "short",
                }).format(date);
                return (
                  <div
                    key={txn.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "12px 0",
                      borderBottom: "1px solid var(--slate-100)",
                    }}
                  >
                    <div>
                      <p
                        style={{
                          fontSize: "13px",
                          fontWeight: 600,
                          color: "var(--slate-900)",
                        }}
                      >
                        {txn.note || dateLabel}
                      </p>
                      {txn.note && (
                        <p
                          style={{
                            fontSize: "11px",
                            fontWeight: 500,
                            color: "var(--slate-400)",
                            marginTop: "2px",
                          }}
                        >
                          {dateLabel}
                        </p>
                      )}
                    </div>
                    <span
                      style={{
                        fontSize: "14px",
                        fontWeight: 700,
                        fontVariantNumeric: "tabular-nums",
                        color: "var(--slate-900)",
                      }}
                    >
                      {formatCAD(txn.amount)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div style={{ display: "flex", gap: "10px", padding: "16px 20px 4px" }}>
          <button onClick={onClose} style={{ ...btnCancelStyle, flex: 1 }}>
            Fermer
          </button>
        </div>
      </SheetWrapper>
    );
  }

  if (view === "defer") {
    return (
      <SheetWrapper onClose={onClose} titleId="defer-sheet-title">
        <SheetHandle />
        <div style={{ padding: "0 20px 8px" }}>
          <h3 id="defer-sheet-title" style={sheetTitleStyle}>
            Reporter «&nbsp;{expense.name}&nbsp;»
          </h3>

          {/* Expense summary */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              paddingBottom: "16px",
            }}
          >
            <div style={iconBoxStyle}>{expense.section?.icon ?? "💳"}</div>
            <div>
              <p style={expenseNameStyle}>{expense.name}</p>
              <p style={expenseMetaStyle}>
                ${Number(expense.amount).toLocaleString("fr-CA")} ·{" "}
                {expense.section?.name ?? "—"}
              </p>
            </div>
          </div>

          {/* Month grid */}
          <p style={sectionLabelStyle}>Reporter vers</p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "8px",
              marginBottom: "16px",
            }}
          >
            {getFutureMonths(month).map(({ key, monthLabel, yearLabel }) => (
              <button
                key={key}
                onClick={() => setDeferTargetMonth(key)}
                style={{
                  padding: "14px 12px",
                  border: `1.5px solid ${deferTargetMonth === key ? "var(--teal-700)" : "var(--slate-200)"}`,
                  borderRadius: "var(--radius-md)",
                  background:
                    deferTargetMonth === key
                      ? "var(--teal-50)"
                      : "var(--white)",
                  textAlign: "center",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  fontFamily: "var(--font)",
                  boxShadow:
                    deferTargetMonth === key
                      ? "0 0 0 3px rgba(15, 118, 110, 0.06)"
                      : "none",
                }}
              >
                <p
                  style={{
                    fontSize: "14px",
                    fontWeight: 700,
                    color:
                      deferTargetMonth === key
                        ? "var(--teal-700)"
                        : "var(--slate-900)",
                    letterSpacing: "-0.01em",
                  }}
                >
                  {monthLabel}
                </p>
                <p
                  style={{
                    fontSize: "11px",
                    fontWeight: 600,
                    color: "var(--slate-400)",
                    marginTop: "2px",
                  }}
                >
                  {yearLabel}
                </p>
              </button>
            ))}
          </div>

          <p style={hintStyle}>
            <svg
              style={{
                width: "13px",
                height: "13px",
                verticalAlign: "-2px",
                marginRight: "4px",
              }}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            La dépense disparaîtra de ce mois et apparaîtra dans le mois choisi.
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px", padding: "16px 20px 4px" }}>
          <button onClick={onClose} style={btnCancelStyle}>
            Annuler
          </button>
          <button
            onClick={confirmDefer}
            disabled={!deferTargetMonth}
            style={btnPrimaryStyle}
          >
            {getDeferLabel()}
          </button>
        </div>
      </SheetWrapper>
    );
  }

  if (view === "edit") {
    return (
      <SheetWrapper onClose={onClose} titleId="edit-amount-sheet-title">
        <SheetHandle />
        <div style={{ padding: "0 20px 8px" }}>
          <h3 id="edit-amount-sheet-title" style={sheetTitleStyle}>
            Modifier le montant
          </h3>

          {/* Expense summary */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              paddingBottom: "16px",
            }}
          >
            <div style={iconBoxStyle}>{expense.section?.icon ?? "💳"}</div>
            <div>
              <p style={expenseNameStyle}>{expense.name}</p>
              <p style={expenseMetaStyle}>
                Montant actuel: $
                {Number(expense.amount).toLocaleString("fr-CA")} ·{" "}
                {expense.section?.name ?? "—"}
              </p>
            </div>
          </div>

          <div style={{ marginBottom: "8px" }}>
            <p style={sectionLabelStyle}>Nouveau montant</p>
            <input
              type="number"
              min="0"
              step="0.01"
              value={editAmountValue}
              onChange={(e) => setEditAmountValue(e.target.value)}
              placeholder="0"
              style={{
                width: "100%",
                padding: "16px",
                border: "1px solid var(--slate-200)",
                borderRadius: "var(--radius-sm)",
                fontFamily: "var(--font)",
                fontSize: "28px",
                fontWeight: 800,
                letterSpacing: "-0.03em",
                fontVariantNumeric: "tabular-nums",
                textAlign: "center",
                color: "var(--slate-900)",
                background: "var(--white)",
                outline: "none",
                transition: "border-color 0.2s, box-shadow 0.2s",
                WebkitAppearance: "none",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "var(--teal-700)";
                e.target.style.boxShadow = "0 0 0 3px rgba(15, 118, 110, 0.08)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "var(--slate-200)";
                e.target.style.boxShadow = "none";
              }}
            />
            <p style={hintStyle}>
              Modification pour {currentMonthLabel} uniquement. Le gabarit
              restera à ${Number(expense.amount).toLocaleString("fr-CA")}.
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: "10px", padding: "16px 20px 4px" }}>
          <button onClick={onClose} style={btnCancelStyle}>
            Annuler
          </button>
          <button onClick={confirmEditAmount} style={btnPrimaryStyle}>
            Enregistrer
          </button>
        </div>
      </SheetWrapper>
    );
  }

  if (view === "delete") {
    return (
      <SheetWrapper onClose={onClose} titleId="delete-sheet-title">
        <SheetHandle />
        <div style={{ textAlign: "center", padding: "8px 20px 0" }}>
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "50%",
              background: "var(--error-light)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 14px",
            }}
          >
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--error)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
              <line x1="10" y1="11" x2="10" y2="17" />
              <line x1="14" y1="11" x2="14" y2="17" />
            </svg>
          </div>
          <h3
            id="delete-sheet-title"
            style={{
              fontSize: "18px",
              fontWeight: 700,
              color: "var(--slate-900)",
              letterSpacing: "-0.02em",
              marginBottom: "8px",
            }}
          >
            Supprimer cette dépense?
          </h3>
          <p
            style={{
              fontSize: "14px",
              fontWeight: 500,
              color: "var(--slate-500)",
              lineHeight: 1.5,
            }}
          >
            <strong style={{ fontWeight: 700, color: "var(--slate-700)" }}>
              {expense.name} — ${Number(expense.amount).toLocaleString("fr-CA")}
            </strong>{" "}
            sera retiré de tes dépenses de {currentMonthLabel}. Cette action est
            irréversible.
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px", padding: "20px 20px 4px" }}>
          <button onClick={onClose} style={btnCancelStyle}>
            Annuler
          </button>
          <button
            onClick={confirmDelete}
            style={{ ...btnPrimaryStyle, background: "var(--error)" }}
          >
            Supprimer
          </button>
        </div>
      </SheetWrapper>
    );
  }

  // ── Default: Action menu ──────────────────────────────────────────────

  return (
    <SheetWrapper onClose={onClose} titleId="action-sheet-title">
      <SheetHandle />
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px 20px 16px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            flex: 1,
            minWidth: 0,
          }}
        >
          <div
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "var(--radius-sm)",
              background: expense.section ? "#F0FDFA" : "#F1F5F9",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "20px",
              flexShrink: 0,
            }}
          >
            {expense.section?.icon ?? "💳"}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              id="action-sheet-title"
              style={{
                fontSize: "16px",
                fontWeight: 700,
                color: "var(--slate-900)",
                letterSpacing: "-0.02em",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {expense.name}
            </p>
            <p
              style={{
                fontSize: "12px",
                fontWeight: 600,
                color: "var(--slate-400)",
                marginTop: "2px",
              }}
            >
              {expense.section?.name ?? "—"}
              {expense.card
                ? ` · ${expense.card.name}${expense.card.last_four ? ` ****${expense.card.last_four}` : ""}`
                : ""}
            </p>
          </div>
        </div>
        <span
          style={{
            fontSize: "20px",
            fontWeight: 800,
            letterSpacing: "-0.03em",
            color: "var(--slate-900)",
            fontVariantNumeric: "tabular-nums",
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontSize: "0.55em",
              fontWeight: 600,
              color: "var(--teal-700)",
              verticalAlign: "super",
            }}
          >
            $
          </span>
          {Number(expense.amount).toLocaleString("fr-CA", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          })}
        </span>
      </div>

      {/* Action list */}
      <div style={{ padding: "0 12px 8px" }}>
        {expense.is_progressive ? (
          <>
            {/* Progressive: Add transaction */}
            <ActionItem
              iconBg="var(--success-light)"
              iconColor="var(--positive)"
              title="Ajouter un achat"
              desc="Enregistrer une nouvelle transaction"
              icon={
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              }
              onClick={() => setView("add-transaction")}
              showChevron
            />

            {/* Progressive: History */}
            <ActionItem
              iconBg="var(--teal-50)"
              iconColor="var(--teal-700)"
              title="Historique des achats"
              desc="Voir les transactions enregistrees"
              icon={
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
              }
              onClick={() => {
                setView("history");
                loadHistory();
              }}
              showChevron
            />
          </>
        ) : (
          <>
            {/* Non-progressive: Mark paid / upcoming */}
            {expense.status !== "PAID" ? (
              <ActionItem
                iconBg="var(--success-light)"
                iconColor="var(--positive)"
                title="Marquer payée"
                desc="Cette dépense est réglée"
                icon={
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                }
                onClick={() => handleToggle("paid")}
              />
            ) : (
              <ActionItem
                iconBg="var(--teal-50)"
                iconColor="var(--teal-700)"
                title="Remettre à venir"
                desc="Annuler le paiement de cette dépense"
                icon={
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                }
                onClick={() => handleToggle("upcoming")}
              />
            )}

            {/* Defer */}
            {expense.status !== "PAID" && expense.status !== "DEFERRED" && (
              <ActionItem
                iconBg="var(--warning-light)"
                iconColor="var(--amber-600)"
                title="Reporter à un autre mois"
                desc="Déplacer vers un mois futur"
                icon={
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="17 1 21 5 17 9" />
                    <path d="M3 11V9a4 4 0 014-4h14" />
                    <polyline points="7 23 3 19 7 15" />
                    <path d="M21 13v2a4 4 0 01-4 4H3" />
                  </svg>
                }
                onClick={() => setView("defer")}
                showChevron
              />
            )}
          </>
        )}

        {/* Edit amount */}
        {expense.status !== "PAID" && (
          <ActionItem
            iconBg="var(--teal-50)"
            iconColor="var(--teal-700)"
            title="Modifier le montant"
            desc="Ajuster pour ce mois uniquement"
            icon={
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            }
            onClick={() => setView("edit")}
            showChevron
          />
        )}

        {/* Delete (adhoc only) */}
        {expense.expense_id === null && (
          <>
            <div
              style={{
                height: "1px",
                background: "var(--slate-100)",
                margin: "4px 12px",
              }}
            />
            <ActionItem
              iconBg="var(--error-light)"
              iconColor="var(--error)"
              title="Supprimer"
              desc="Retirer cette dépense du mois"
              icon={
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                </svg>
              }
              onClick={() => setView("delete")}
              destructive
            />
          </>
        )}
      </div>
    </SheetWrapper>
  );
}

// ── Internal sub-components ───────────────────────────────────────────────

function SheetHandle() {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        padding: "12px 0 4px",
      }}
    >
      <div
        style={{
          width: "36px",
          height: "4px",
          borderRadius: "2px",
          background: "var(--slate-300)",
        }}
      />
    </div>
  );
}

function SheetWrapper({
  children,
  onClose,
  titleId,
}: {
  children: React.ReactNode;
  onClose: () => void;
  titleId: string;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    dialogRef.current?.focus();
  }, []);

  return (
    <>
      <style>{`
        .depenses-action-sheet {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background: var(--white);
          border-radius: var(--radius-lg) var(--radius-lg) 0 0;
          z-index: 210;
          max-height: 85dvh;
          overflow-y: auto;
          overscroll-behavior: contain;
          box-shadow: 0 -8px 32px rgba(15, 23, 42, 0.15);
          padding-bottom: max(16px, env(safe-area-inset-bottom));
        }
        @media (min-width: 1024px) {
          .depenses-action-sheet {
            bottom: auto;
            top: 50%;
            left: 50%;
            right: auto;
            width: calc(100% - 48px);
            max-width: 480px;
            border-radius: var(--radius-lg);
            transform: translate(-50%, -50%);
            box-shadow: 0 24px 48px rgba(15, 23, 42, 0.18), 0 8px 16px rgba(15, 118, 110, 0.06);
            max-height: calc(100dvh - 64px);
            padding-bottom: 16px;
          }
        }
      `}</style>
      <div
        ref={dialogRef}
        className="depenses-action-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onKeyDown={(e) => {
          if (e.key === "Escape") onClose();
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </>
  );
}

type ActionItemProps = {
  iconBg: string;
  iconColor: string;
  title: string;
  desc: string;
  icon: React.ReactNode;
  onClick: () => void;
  showChevron?: boolean;
  destructive?: boolean;
};

function ActionItem({
  iconBg,
  iconColor,
  title,
  desc,
  icon,
  onClick,
  showChevron,
  destructive,
}: ActionItemProps) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "14px",
        padding: "14px 12px",
        borderRadius: "var(--radius-md)",
        cursor: "pointer",
        transition: "all 0.15s ease",
        border: "none",
        background: "none",
        width: "100%",
        textAlign: "left",
        fontFamily: "var(--font)",
      }}
    >
      <div
        style={{
          width: "40px",
          height: "40px",
          borderRadius: "var(--radius-sm)",
          background: iconBg,
          color: iconColor,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <div style={{ width: "20px", height: "20px" }}>{icon}</div>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontSize: "15px",
            fontWeight: 600,
            color: destructive ? "var(--error)" : "var(--slate-900)",
            letterSpacing: "-0.01em",
          }}
        >
          {title}
        </p>
        <p
          style={{
            fontSize: "12px",
            fontWeight: 500,
            color: "var(--slate-400)",
            marginTop: "1px",
          }}
        >
          {desc}
        </p>
      </div>
      {showChevron && (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--slate-300)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ flexShrink: 0 }}
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
      )}
    </button>
  );
}

// ── Shared styles ─────────────────────────────────────────────────────────

const sheetTitleStyle: React.CSSProperties = {
  fontSize: "18px",
  fontWeight: 700,
  color: "var(--slate-900)",
  letterSpacing: "-0.02em",
  marginBottom: "20px",
  paddingBottom: "12px",
  borderBottom: "1px solid var(--slate-100)",
};

const iconBoxStyle: React.CSSProperties = {
  width: "38px",
  height: "38px",
  borderRadius: "var(--radius-sm)",
  background: "#F0FDFA",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "18px",
  flexShrink: 0,
};

const expenseNameStyle: React.CSSProperties = {
  fontSize: "14px",
  fontWeight: 700,
  color: "var(--slate-900)",
  letterSpacing: "-0.01em",
};

const expenseMetaStyle: React.CSSProperties = {
  fontSize: "12px",
  fontWeight: 600,
  color: "var(--slate-400)",
};

const sectionLabelStyle: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: 700,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  color: "var(--slate-400)",
  marginBottom: "6px",
};

const hintStyle: React.CSSProperties = {
  fontSize: "12px",
  fontWeight: 500,
  color: "var(--slate-400)",
  marginTop: "6px",
};

const btnCancelStyle: React.CSSProperties = {
  flex: 1,
  padding: "14px 20px",
  border: "1px solid var(--slate-200)",
  background: "var(--white)",
  borderRadius: "var(--radius-md)",
  fontFamily: "var(--font)",
  fontSize: "15px",
  fontWeight: 600,
  color: "var(--slate-700)",
  cursor: "pointer",
  transition: "all 0.2s ease",
  letterSpacing: "-0.01em",
};

const btnPrimaryStyle: React.CSSProperties = {
  flex: 1.4,
  padding: "14px 24px",
  border: "none",
  background: "var(--teal-700)",
  borderRadius: "var(--radius-md)",
  fontFamily: "var(--font)",
  fontSize: "15px",
  fontWeight: 700,
  color: "var(--white)",
  cursor: "pointer",
  transition: "all 0.2s ease",
  letterSpacing: "-0.01em",
};
