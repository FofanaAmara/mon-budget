"use client";

import { useState } from "react";
import { currentMonthKey } from "@/lib/month-utils";
import MonthNavigator from "@/components/MonthNavigator";
import RevenusMonument from "@/components/revenus/RevenusMonument";
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

  return (
    <div style={{ paddingBottom: "96px", minHeight: "100vh" }}>
      {/* Month navigator */}
      <MonthNavigator month={month} basePath="/revenus" />

      {/* Monument: the scoreboard */}
      <RevenusMonument
        actualTotal={incomeSummary.actualTotal}
        expectedTotal={incomeSummary.expectedTotal}
      />

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
