"use client";

import { useState, useEffect } from "react";
import MonthNavigator from "@/components/MonthNavigator";
import Onboarding from "@/components/Onboarding";
import TabTableauDeBord from "@/components/accueil/TabTableauDeBord";
import TabTimeline from "@/components/accueil/TabTimeline";
import TabSanteFinanciere from "@/components/accueil/TabSanteFinanciere";
import type {
  MonthSummary,
  MonthlyExpense,
  MonthlyIncome,
  Expense,
  MonthlySavingsSummary,
  MonthlyDebtSummary,
} from "@/lib/types";

type Tab = "dashboard" | "timeline" | "sante";

const TABS: { key: Tab; label: string }[] = [
  { key: "dashboard", label: "Tableau de bord" },
  { key: "timeline", label: "Timeline" },
  { key: "sante", label: "Santé financière" },
];

type Props = {
  summary: MonthSummary;
  incomeSummary: { expectedTotal: number; actualTotal: number };
  expenses: MonthlyExpense[];
  monthlyIncomes: MonthlyIncome[];
  month: string;
  monthlyIncomeFromTemplates: number;
  totalMonthlyExpenses: number;
  projets: Expense[];
  totalDebtBalance: number;
  savingsSummary: MonthlySavingsSummary;
  debtSummary: MonthlyDebtSummary;
  isNewUser?: boolean;
};

export default function AccueilClient({
  summary,
  incomeSummary,
  expenses,
  monthlyIncomes,
  month,
  monthlyIncomeFromTemplates,
  totalMonthlyExpenses,
  projets,
  totalDebtBalance,
  savingsSummary,
  debtSummary,
  isNewUser,
}: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (isNewUser && !localStorage.getItem("mes-finances-onboarding-done")) {
      setShowOnboarding(true);
    }
  }, [isNewUser]);

  const totalEpargne = projets.reduce(
    (s, p) => s + Number(p.saved_amount ?? 0),
    0,
  );
  const valeurNette = totalEpargne - totalDebtBalance;
  const availableAmount = incomeSummary.expectedTotal - summary.total;

  const isPositive = availableAmount >= 0;
  const amountFormatted = Math.abs(availableAmount).toLocaleString("fr-CA", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  return (
    <div style={{ paddingBottom: "100px", minHeight: "100vh" }}>
      {showOnboarding && (
        <Onboarding onComplete={() => setShowOnboarding(false)} />
      )}

      {/* ====== MONUMENT: BALANCE HERO ====== */}
      <section
        style={{
          padding: "28px 20px 0",
          textAlign: "center",
          animation: "fadeInUp 0.6s ease both",
        }}
      >
        <p
          style={{
            fontSize: "15px",
            fontWeight: 500,
            color: "var(--slate-500)",
            marginBottom: "4px",
          }}
        >
          Bonjour
        </p>

        {/* Month Navigator */}
        <div style={{ marginBottom: "20px" }}>
          <MonthNavigator month={month} basePath="/" />
        </div>

        {/* THE MONUMENT: Available amount */}
        <div
          style={{
            fontSize: "clamp(3.5rem, 14vw, 6rem)",
            fontWeight: 800,
            letterSpacing: "-0.04em",
            lineHeight: 1,
            color: isPositive ? "var(--teal-700)" : "var(--error)",
            transition: "color 0.3s ease",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {amountFormatted}
          <span
            style={{
              fontSize: "0.4em",
              fontWeight: 600,
              color: "inherit",
              verticalAlign: "super",
              marginLeft: "2px",
            }}
          >
            $
          </span>
        </div>

        <p
          style={{
            fontSize: "14px",
            fontWeight: 500,
            color: "var(--slate-500)",
            marginTop: "8px",
            letterSpacing: "0.02em",
          }}
        >
          {isPositive ? "Disponible ce mois-ci" : "De dépassement ce mois-ci"}
        </p>

        {/* Status badge */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginTop: "12px",
            marginBottom: "4px",
          }}
        >
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "5px 14px",
              background: isPositive
                ? "var(--success-light)"
                : "var(--error-light)",
              borderRadius: "100px",
              fontSize: "13px",
              fontWeight: 600,
              color: isPositive ? "var(--positive)" : "var(--error)",
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
              strokeLinejoin="round"
            >
              {isPositive ? (
                <polyline points="20 6 9 17 4 12" />
              ) : (
                <>
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </>
              )}
            </svg>
            {isPositive ? "Ton mois est sous contrôle" : "Budget dépassé"}
          </span>
        </div>
      </section>

      {/* ====== TABS — UNDERLINE STYLE ====== */}
      <div
        style={{
          display: "flex",
          borderBottom: "2px solid var(--slate-100)",
          margin: "24px 20px 0",
          gap: 0,
          animation: "fadeInUp 0.6s ease 0.1s both",
        }}
      >
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              flex: 1,
              padding: "12px 4px",
              textAlign: "center",
              fontSize: "13px",
              fontWeight: activeTab === tab.key ? 700 : 600,
              color:
                activeTab === tab.key ? "var(--teal-700)" : "var(--slate-400)",
              background: "none",
              border: "none",
              borderBottom: `2px solid ${activeTab === tab.key ? "var(--teal-700)" : "transparent"}`,
              marginBottom: "-2px",
              cursor: "pointer",
              transition: "all 0.2s ease",
              fontFamily: "inherit",
              letterSpacing: "-0.01em",
              whiteSpace: "nowrap",
            }}
            onMouseEnter={(e) => {
              if (activeTab !== tab.key) {
                (e.currentTarget as HTMLButtonElement).style.color =
                  "var(--slate-700)";
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== tab.key) {
                (e.currentTarget as HTMLButtonElement).style.color =
                  "var(--slate-400)";
              }
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ====== TAB CONTENT ====== */}
      <div
        style={{ padding: "0 20px", animation: "fadeInUp 0.4s ease 0.2s both" }}
      >
        {activeTab === "dashboard" && (
          <TabTableauDeBord
            summary={summary}
            incomeSummary={incomeSummary}
            totalMonthlyExpenses={totalMonthlyExpenses}
            savingsSummary={savingsSummary}
            debtSummary={debtSummary}
            totalDebtBalance={totalDebtBalance}
            totalEpargne={totalEpargne}
            valeurNette={valeurNette}
          />
        )}

        {activeTab === "timeline" && (
          <TabTimeline expenses={expenses} monthlyIncomes={monthlyIncomes} />
        )}

        {activeTab === "sante" && (
          <TabSanteFinanciere
            summary={summary}
            incomeSummary={incomeSummary}
            expenses={expenses}
            monthlyIncomeFromTemplates={monthlyIncomeFromTemplates}
            totalMonthlyExpenses={totalMonthlyExpenses}
            availableAmount={availableAmount}
            totalEpargne={totalEpargne}
            totalDebtBalance={totalDebtBalance}
            valeurNette={valeurNette}
            savingsSummary={savingsSummary}
          />
        )}
      </div>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
