"use client";

import { useState } from "react";
import { formatCAD } from "@/lib/utils";
import { currentMonthKey } from "@/lib/month-utils";
import MonthNavigator from "@/components/MonthNavigator";
import IncomeTrackingTab from "@/components/revenus/IncomeTrackingTab";
import AllocationTrackingTab from "@/components/revenus/AllocationTrackingTab";
import type {
  MonthlyIncome,
  Income,
  MonthlyAllocation,
  Section,
  Expense,
} from "@/lib/types";

type Props = {
  monthlyIncomes: MonthlyIncome[];
  incomeSummary: { expectedTotal: number; actualTotal: number };
  allIncomes: Income[];
  month: string;
  monthlyAllocations: MonthlyAllocation[];
  sectionActuals: { section_id: string; total: number }[];
  sections: Section[];
  projects: Expense[];
  initialTab?: "revenus" | "allocation";
};

export default function RevenusTrackingClient({
  monthlyIncomes,
  incomeSummary,
  allIncomes,
  month,
  monthlyAllocations,
  sectionActuals,
  sections,
  projects,
  initialTab = "revenus",
}: Props) {
  const [activeTab, setActiveTab] = useState<"revenus" | "allocation">(
    initialTab,
  );

  const today = currentMonthKey();
  const isCurrentMonth = month === today;

  // Variable incomes not yet in monthly_incomes for this month
  const variableIncomes = allIncomes.filter((i) => i.frequency === "VARIABLE");
  const variableInMonthly = new Set(monthlyIncomes.map((mi) => mi.income_id));
  const unregisteredVariables = variableIncomes.filter(
    (i) => !variableInMonthly.has(i.id),
  );

  // Progress / status calculations
  const progressPct =
    incomeSummary.expectedTotal > 0
      ? (incomeSummary.actualTotal / incomeSummary.expectedTotal) * 100
      : 0;
  const isComplete = progressPct >= 100 && incomeSummary.expectedTotal > 0;
  const isOverIncome =
    incomeSummary.actualTotal > incomeSummary.expectedTotal &&
    incomeSummary.expectedTotal > 0;
  const surplus = incomeSummary.actualTotal - incomeSummary.expectedTotal;

  // Allocation calculations
  const totalAllocated = monthlyAllocations.reduce(
    (s, a) => s + Number(a.allocated_amount),
    0,
  );
  const disponibleAttendu = incomeSummary.expectedTotal - totalAllocated;
  const isOverAllocated = disponibleAttendu < 0;
  const sectionActualsMap = new Map(
    sectionActuals.map((s) => [s.section_id, s.total]),
  );

  // Monument status badge
  function getMonumentStatus() {
    if (incomeSummary.expectedTotal === 0) return null;
    if (isOverIncome)
      return {
        type: "over" as const,
        label: `+${formatCAD(surplus)} au-dessus des attentes`,
      };
    if (isComplete)
      return { type: "complete" as const, label: "Tous les revenus reçus" };
    if (progressPct >= 50)
      return {
        type: "partial" as const,
        label: `${Math.round(progressPct)}% reçu`,
      };
    return {
      type: "expected" as const,
      label: `${Math.round(progressPct)}% reçu`,
    };
  }
  const monumentStatus = getMonumentStatus();

  function getProgressFillColor() {
    if (isComplete || isOverIncome) return "var(--teal-700, #0F766E)";
    if (progressPct >= 80) return "var(--amber-500, #F59E0B)";
    return "var(--teal-700, #0F766E)";
  }

  return (
    <div style={{ paddingBottom: "96px", minHeight: "100vh" }}>
      {/* Month navigator */}
      <MonthNavigator month={month} basePath="/revenus" />

      {/* Monument: the scoreboard */}
      <div style={{ padding: "20px 20px 20px", textAlign: "center" }}>
        <p
          style={{
            fontSize: "13px",
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase" as const,
            color: "var(--teal-700, #0F766E)",
            marginBottom: "12px",
          }}
        >
          Revenus
        </p>

        {/* Scoreboard fraction: received / expected */}
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "center",
            lineHeight: 1,
          }}
        >
          <span
            style={{
              fontSize: "clamp(3rem, 12vw, 5rem)",
              fontWeight: 800,
              letterSpacing: "-0.04em",
              color: "var(--slate-900, #0F172A)",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {incomeSummary.actualTotal.toLocaleString("fr-CA", {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            })}
            <span
              style={{
                fontSize: "0.4em",
                fontWeight: 600,
                color: "var(--teal-700, #0F766E)",
                verticalAlign: "super",
                marginLeft: "2px",
              }}
            >
              $
            </span>
          </span>

          <span
            style={{
              fontSize: "clamp(2rem, 8vw, 3.5rem)",
              fontWeight: 300,
              color: "var(--slate-300, #CBD5E1)",
              margin: "0 clamp(4px, 1.5vw, 10px)",
              position: "relative" as const,
              top: "-0.05em",
            }}
          >
            /
          </span>

          <span
            style={{
              fontSize: "clamp(1.8rem, 7vw, 3rem)",
              fontWeight: 600,
              letterSpacing: "-0.03em",
              color: "var(--slate-400, #94A3B8)",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {incomeSummary.expectedTotal.toLocaleString("fr-CA", {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            })}
            <span
              style={{
                fontSize: "0.4em",
                fontWeight: 600,
                color: "var(--teal-700, #0F766E)",
                verticalAlign: "super",
                marginLeft: "2px",
              }}
            >
              $
            </span>
          </span>
        </div>

        <p
          style={{
            fontSize: "14px",
            fontWeight: 500,
            color: "var(--slate-500, #64748B)",
            marginTop: "8px",
            letterSpacing: "0.01em",
          }}
        >
          reçu sur attendu ce mois-ci
        </p>

        {/* Progress bar */}
        {incomeSummary.expectedTotal > 0 && (
          <div style={{ margin: "16px auto 0", maxWidth: "240px" }}>
            <div
              style={{
                height: "6px",
                background: "var(--slate-100, #F1F5F9)",
                borderRadius: "3px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  borderRadius: "3px",
                  width: `${Math.min(progressPct, 100)}%`,
                  background: getProgressFillColor(),
                  transition: "width 0.8s ease",
                }}
              />
            </div>

            {/* Status badge */}
            {monumentStatus && (
              <div
                style={{
                  marginTop: "10px",
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "4px 12px",
                    borderRadius: "100px",
                    fontSize: "12px",
                    fontWeight: 600,
                    background:
                      monumentStatus.type === "partial" ||
                      monumentStatus.type === "expected"
                        ? "var(--warning-light, #FEF3C7)"
                        : "var(--success-light, #ECFDF5)",
                    color:
                      monumentStatus.type === "partial" ||
                      monumentStatus.type === "expected"
                        ? "var(--amber-600, #D97706)"
                        : "var(--success, #059669)",
                  }}
                >
                  {(monumentStatus.type === "complete" ||
                    monumentStatus.type === "over") && (
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                  {monumentStatus.label}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tabs — underline style */}
      <div
        style={{
          display: "flex",
          margin: "0 20px",
          borderBottom: "2px solid var(--slate-100, #F1F5F9)",
          marginBottom: "20px",
        }}
      >
        {(["revenus", "allocation"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1,
              padding: "12px 16px",
              textAlign: "center" as const,
              fontSize: "14px",
              fontWeight: 600,
              color:
                activeTab === tab
                  ? "var(--teal-700, #0F766E)"
                  : "var(--slate-400, #94A3B8)",
              cursor: "pointer",
              border: "none",
              background: "none",
              position: "relative" as const,
              transition: "color 0.2s ease",
              letterSpacing: "-0.01em",
            }}
          >
            {tab === "revenus" ? "Revenus" : "Allocation"}
            {activeTab === tab && (
              <span
                style={{
                  position: "absolute" as const,
                  bottom: "-2px",
                  left: "16px",
                  right: "16px",
                  height: "2px",
                  background: "var(--teal-700, #0F766E)",
                  borderRadius: "1px 1px 0 0",
                  display: "block",
                }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ padding: "0 20px" }}>
        {activeTab === "revenus" && (
          <IncomeTrackingTab
            monthlyIncomes={monthlyIncomes}
            unregisteredVariables={unregisteredVariables}
            month={month}
            isCurrentMonth={isCurrentMonth}
          />
        )}

        {activeTab === "allocation" && (
          <AllocationTrackingTab
            monthlyAllocations={monthlyAllocations}
            totalAllocated={totalAllocated}
            disponibleAttendu={disponibleAttendu}
            isOverAllocated={isOverAllocated}
            sectionActualsMap={sectionActualsMap}
            isCurrentMonth={isCurrentMonth}
            month={month}
            sections={sections}
            projects={projects}
          />
        )}
      </div>
    </div>
  );
}
