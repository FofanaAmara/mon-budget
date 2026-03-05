"use client";

import { useState, useTransition, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";

import { deleteExpense } from "@/lib/actions/expenses";
import {
  formatCAD,
  formatShortDate,
  daysUntil,
  calcMonthlyCost,
} from "@/lib/utils";
import ExpenseModal from "@/components/ExpenseModal";
import type { Expense, Section, Card, RecurrenceFrequency } from "@/lib/types";

type Props = {
  expenses: Expense[];
  sections: Section[];
  cards: Card[];
};

const FREQ_LABELS: Record<RecurrenceFrequency, string> = {
  WEEKLY: "Hebdo",
  BIWEEKLY: "Bi-hebdo",
  MONTHLY: "Mensuel",
  BIMONTHLY: "Bi-mensuel",
  QUARTERLY: "Trimestriel",
  YEARLY: "Annuel",
};

function formatSectionTotal(amount: number): string {
  return amount.toLocaleString("fr-CA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function ExpenseTemplateManager({
  expenses,
  sections,
  cards,
}: Props) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | undefined>();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [sectionModal, setSectionModal] = useState<{
    section: Section;
    expenses: Expense[];
  } | null>(null);
  const [, startTransition] = useTransition();

  const isClient = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  // Filter: only RECURRING and ONE_TIME (exclude PLANNED — those are in /projets)
  const templateExpenses = expenses.filter((e) => e.type !== "PLANNED");

  const grouped = sections
    .map((section) => ({
      section,
      expenses: templateExpenses.filter((e) => e.section_id === section.id),
    }))
    .filter((g) => g.expenses.length > 0);

  const unsectioned = templateExpenses.filter((e) => !e.section_id);

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteExpense(id);
      setDeletingId(null);
      router.refresh();
    });
  }

  function handleEdit(expense: Expense) {
    setEditingExpense(expense);
    setShowModal(true);
  }

  const ExpenseRow = ({ expense }: { expense: Expense }) => {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 18px",
          borderBottom: "1px solid var(--surface-sunken)",
          gap: "12px",
          cursor: "pointer",
        }}
        className="charge-item"
      >
        {/* Left: name + badges + meta */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "4px",
            flex: 1,
            minWidth: 0,
          }}
        >
          {/* Name row with badges */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                fontSize: "14px",
                fontWeight: 600,
                color: "var(--text-primary)",
                letterSpacing: "-0.01em",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                maxWidth: "140px",
              }}
            >
              {expense.name}
            </span>

            {/* Frequency badge (RECURRING) */}
            {expense.type === "RECURRING" && expense.recurrence_frequency && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "2px 8px",
                  background: "var(--surface-sunken)",
                  borderRadius: "100px",
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "var(--text-tertiary)",
                  letterSpacing: "-0.01em",
                  whiteSpace: "nowrap",
                }}
              >
                {FREQ_LABELS[expense.recurrence_frequency]}
              </span>
            )}

            {/* Auto-debit badge */}
            {expense.auto_debit && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "3px",
                  padding: "2px 8px",
                  background: "var(--positive-subtle)",
                  borderRadius: "100px",
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "var(--positive)",
                  letterSpacing: "-0.01em",
                  whiteSpace: "nowrap",
                }}
              >
                <svg
                  width="11"
                  height="11"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                  <path d="M21 3v5h-5" />
                  <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                  <path d="M8 16H3v5" />
                </svg>
                auto
              </span>
            )}

            {/* One-time badge */}
            {expense.type === "ONE_TIME" && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "2px 8px",
                  background: "var(--amber-subtle)",
                  borderRadius: "100px",
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "var(--amber-hover)",
                  letterSpacing: "-0.01em",
                  whiteSpace: "nowrap",
                }}
              >
                Ponctuel
              </span>
            )}
          </div>

          {/* Meta: day / date + card */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "11px",
              fontWeight: 600,
              color: "var(--text-tertiary)",
              letterSpacing: "0.02em",
            }}
          >
            {expense.type === "RECURRING" && expense.recurrence_day && (
              <span>J.{expense.recurrence_day}</span>
            )}
            {expense.type === "ONE_TIME" && expense.due_date && isClient && (
              <span>{formatShortDate(expense.due_date)}</span>
            )}
            {expense.card && (
              <>
                <span
                  style={{
                    width: "3px",
                    height: "3px",
                    borderRadius: "50%",
                    background: "var(--border-strong)",
                    display: "inline-block",
                  }}
                />
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "3px",
                  }}
                >
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
                    <rect width="20" height="14" x="2" y="5" rx="2" />
                    <line x1="2" x2="22" y1="10" y2="10" />
                  </svg>
                  {expense.card.name}
                  {expense.card.last_four
                    ? ` ····${expense.card.last_four}`
                    : ""}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Right: amount + actions */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            flexShrink: 0,
          }}
        >
          <div style={{ textAlign: "right", width: "120px", flexShrink: 0 }}>
            {(() => {
              const isNonMonthly =
                expense.type === "RECURRING" &&
                expense.recurrence_frequency &&
                expense.recurrence_frequency !== "MONTHLY";
              const monthly = isNonMonthly ? calcMonthlyCost(expense) : null;
              return (
                <>
                  <span
                    style={{
                      fontSize: "15px",
                      fontWeight: 800,
                      letterSpacing: "-0.02em",
                      color: "var(--text-primary)",
                      fontVariantNumeric: "tabular-nums",
                      whiteSpace: "nowrap",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "0.7em",
                        fontWeight: 600,
                        color: "var(--accent)",
                      }}
                    >
                      $
                    </span>
                    {(monthly ?? Number(expense.amount)).toLocaleString(
                      "fr-CA",
                      { minimumFractionDigits: 2, maximumFractionDigits: 2 },
                    )}
                  </span>
                  {monthly != null && (
                    <>
                      <div
                        style={{
                          fontSize: "11px",
                          fontWeight: 500,
                          color: "var(--text-tertiary)",
                          letterSpacing: 0,
                          marginTop: "1px",
                        }}
                      >
                        par mois
                      </div>
                      <div
                        style={{
                          fontSize: "11px",
                          fontWeight: 500,
                          color: "var(--text-tertiary)",
                          letterSpacing: "-0.01em",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {Number(expense.amount).toLocaleString("fr-CA", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                        ${" /"}
                        {expense.recurrence_frequency === "YEARLY"
                          ? "an"
                          : FREQ_LABELS[
                              expense.recurrence_frequency!
                            ]?.toLowerCase()}
                      </div>
                    </>
                  )}
                </>
              );
            })()}
          </div>

          {deletingId === expense.id ? (
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(expense.id);
                }}
                style={{
                  padding: "4px 10px",
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "var(--negative)",
                  background: "var(--negative-subtle)",
                  border: "none",
                  borderRadius: "var(--radius-sm)",
                  cursor: "pointer",
                }}
              >
                Oui
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setDeletingId(null);
                }}
                style={{
                  padding: "4px 10px",
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "var(--text-tertiary)",
                  background: "var(--surface-sunken)",
                  border: "none",
                  borderRadius: "var(--radius-sm)",
                  cursor: "pointer",
                }}
              >
                Non
              </button>
            </div>
          ) : (
            <div
              className="charge-actions"
              style={{ display: "flex", alignItems: "center", gap: "2px" }}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleEdit(expense);
                }}
                style={{
                  width: "32px",
                  height: "32px",
                  border: "none",
                  background: "transparent",
                  borderRadius: "var(--radius-sm)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "var(--text-tertiary)",
                  transition: "all 0.15s",
                }}
                aria-label="Modifier"
                className="charge-action-btn"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z" />
                </svg>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setDeletingId(expense.id);
                }}
                style={{
                  width: "32px",
                  height: "32px",
                  border: "none",
                  background: "transparent",
                  borderRadius: "var(--radius-sm)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "var(--text-tertiary)",
                  transition: "all 0.15s",
                }}
                aria-label="Supprimer"
                className="charge-action-btn charge-action-btn-delete"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                  <path d="M10 11v6M14 11v6" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const SectionCard = ({
    section,
    expenses: se,
  }: {
    section: Section;
    expenses: Expense[];
  }) => {
    const sectionTotal = se.reduce((sum, e) => sum + calcMonthlyCost(e), 0);
    return (
      <div
        style={{
          background: "var(--surface-raised)",
          borderRadius: "var(--radius-lg)",
          border: "1px solid var(--border-default)",
          overflow: "hidden",
          transition: "box-shadow 0.25s ease",
        }}
      >
        {/* Section header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 18px 12px",
            borderBottom: "1px solid var(--surface-sunken)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "20px", lineHeight: 1 }}>
              {section.icon}
            </span>
            <div>
              <span
                style={{
                  fontSize: "13px",
                  fontWeight: 700,
                  color: "var(--text-primary)",
                  letterSpacing: "-0.01em",
                }}
              >
                {section.name}
              </span>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "var(--text-tertiary)",
                  marginLeft: "4px",
                }}
              >
                {se.length}
              </span>
            </div>
          </div>
          <div
            style={{
              textAlign: "right",
              width: "120px",
              flexShrink: 0,
              marginRight: "74px",
            }}
          >
            <span
              style={{
                fontSize: "17px",
                fontWeight: 800,
                letterSpacing: "-0.02em",
                color: "var(--text-primary)",
                fontVariantNumeric: "tabular-nums",
                whiteSpace: "nowrap",
              }}
            >
              <span
                style={{
                  fontSize: "0.65em",
                  fontWeight: 600,
                  color: "var(--accent)",
                }}
              >
                $
              </span>
              {formatSectionTotal(sectionTotal)}
            </span>
            <div
              style={{
                fontSize: "11px",
                fontWeight: 500,
                color: "var(--text-tertiary)",
                letterSpacing: 0,
                marginTop: "1px",
              }}
            >
              par mois
            </div>
          </div>
        </div>

        {/* Expense rows */}
        <div>
          {se.map((e) => (
            <ExpenseRow key={e.id} expense={e} />
          ))}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Inline styles for hover effects */}
      <style>{`
        .charge-item:hover {
          background: var(--surface-ground);
        }
        .charge-item:last-child {
          border-bottom: none;
        }
        @media (min-width: 768px) {
          .charge-actions {
            opacity: 0;
            transition: opacity 0.15s ease;
          }
          .charge-item:hover .charge-actions {
            opacity: 1;
          }
        }
        .charge-action-btn:hover {
          background: var(--surface-inset) !important;
          color: var(--text-secondary) !important;
        }
        .charge-action-btn-delete:hover {
          background: var(--negative-subtle) !important;
          color: var(--negative) !important;
        }
      `}</style>

      <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
        {/* Page header: section label + add button */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "16px",
          }}
        >
          <span
            style={{
              fontSize: "12px",
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--text-tertiary)",
            }}
          >
            Gabarits
          </span>
          <button
            onClick={() => {
              setEditingExpense(undefined);
              setShowModal(true);
            }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "9px 18px",
              background: "var(--accent)",
              color: "white",
              border: "none",
              borderRadius: "var(--radius-md)",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              letterSpacing: "-0.01em",
              transition: "all 0.2s ease",
              whiteSpace: "nowrap",
            }}
            className="btn-desktop-only"
          >
            <svg
              width="16"
              height="16"
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
            Ajouter une charge
          </button>
        </div>

        {/* Empty state */}
        {templateExpenses.length === 0 && (
          <div
            style={{
              background: "var(--surface-raised)",
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--border-default)",
              padding: "48px 20px",
              textAlign: "center",
            }}
          >
            <div
              style={{ fontSize: "2rem", marginBottom: "12px", opacity: 0.4 }}
            >
              💸
            </div>
            <p
              style={{
                color: "var(--text-tertiary)",
                fontSize: "15px",
                fontWeight: 600,
                marginBottom: "4px",
              }}
            >
              Aucune charge fixe
            </p>
            <p
              style={{
                color: "var(--text-tertiary)",
                fontSize: "13px",
                fontWeight: 500,
                opacity: 0.7,
              }}
            >
              Commence par ajouter ton loyer ou tes abonnements.
            </p>
          </div>
        )}

        {/* Grouped sections */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {grouped.map(({ section, expenses: se }) => (
            <SectionCard key={section.id} section={section} expenses={se} />
          ))}

          {/* Unsectioned */}
          {unsectioned.length > 0 && (
            <div
              style={{
                background: "var(--surface-raised)",
                borderRadius: "var(--radius-lg)",
                border: "1px solid var(--border-default)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "16px 18px 12px",
                  borderBottom: "1px solid var(--surface-sunken)",
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "10px" }}
                >
                  <span style={{ fontSize: "20px", lineHeight: 1 }}>📁</span>
                  <span
                    style={{
                      fontSize: "13px",
                      fontWeight: 700,
                      color: "var(--text-secondary)",
                      letterSpacing: "-0.01em",
                    }}
                  >
                    Sans section
                  </span>
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 600,
                      color: "var(--text-tertiary)",
                    }}
                  >
                    {unsectioned.length}
                  </span>
                </div>
                <span
                  style={{
                    fontSize: "15px",
                    fontWeight: 800,
                    letterSpacing: "-0.02em",
                    color: "var(--text-primary)",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.65em",
                      fontWeight: 600,
                      color: "var(--accent)",
                    }}
                  >
                    $
                  </span>
                  {formatSectionTotal(
                    unsectioned.reduce((s, e) => s + calcMonthlyCost(e), 0),
                  )}
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 500,
                      color: "var(--text-tertiary)",
                      letterSpacing: 0,
                    }}
                  >
                    {" "}
                    /mois
                  </span>
                </span>
              </div>
              <div>
                {unsectioned.map((e) => (
                  <ExpenseRow key={e.id} expense={e} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Section detail sheet */}
      {sectionModal && (
        <div
          className="sheet-backdrop"
          onClick={(e) => e.target === e.currentTarget && setSectionModal(null)}
        >
          <div className="sheet">
            <div className="sheet-handle" />

            <div style={{ padding: "8px 20px 32px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "20px",
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "10px" }}
                >
                  <span style={{ fontSize: "1.25rem" }}>
                    {sectionModal.section.icon}
                  </span>
                  <h2
                    style={{
                      fontSize: "18px",
                      fontWeight: 700,
                      color: "var(--text-primary)",
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {sectionModal.section.name}
                  </h2>
                </div>
                <button
                  onClick={() => setSectionModal(null)}
                  style={{
                    width: "36px",
                    height: "36px",
                    border: "none",
                    background: "var(--surface-sunken)",
                    borderRadius: "var(--radius-sm)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    color: "var(--text-tertiary)",
                  }}
                  aria-label="Fermer"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
              <div
                style={{
                  background: "var(--surface-raised)",
                  borderRadius: "var(--radius-lg)",
                  border: "1px solid var(--border-default)",
                  overflow: "hidden",
                }}
              >
                {sectionModal.expenses.map((e) => (
                  <ExpenseRow key={e.id} expense={e} />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FAB (mobile only) */}
      <button
        onClick={() => {
          setEditingExpense(undefined);
          setShowModal(true);
        }}
        className="fab fab-mobile-only"
        aria-label="Ajouter une charge"
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
        >
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>

      {/* Expense modal */}
      {showModal && (
        <ExpenseModal
          sections={sections}
          cards={cards}
          expense={editingExpense}
          onClose={() => {
            setShowModal(false);
            setEditingExpense(undefined);
          }}
          onSuccess={() => router.refresh()}
        />
      )}
    </>
  );
}
