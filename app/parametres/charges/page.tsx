export const dynamic = "force-dynamic";

import { getExpenses } from "@/lib/actions/expenses";
import { getSections } from "@/lib/actions/sections";
import { getCards } from "@/lib/actions/cards";
import Breadcrumb from "@/components/Breadcrumb";
import ExpenseTemplateManager from "@/components/ExpenseTemplateManager";
import type { RecurrenceFrequency } from "@/lib/types";
import {
  WEEKLY_MONTHLY_MULTIPLIER,
  BIWEEKLY_MONTHLY_MULTIPLIER,
} from "@/lib/constants";

function normalizeToMonthly(
  amount: number,
  frequency: RecurrenceFrequency | null,
): number {
  switch (frequency) {
    case "WEEKLY":
      return amount * WEEKLY_MONTHLY_MULTIPLIER;
    case "BIWEEKLY":
      return amount * BIWEEKLY_MONTHLY_MULTIPLIER;
    case "MONTHLY":
      return amount;
    case "BIMONTHLY":
      return amount * 2;
    case "QUARTERLY":
      return amount / 3;
    case "YEARLY":
      return amount / 12;
    default:
      return amount;
  }
}

export default async function ChargesFixesPage() {
  const [expenses, sections, cards] = await Promise.all([
    getExpenses(),
    getSections(),
    getCards(),
  ]);

  const recurringActive = expenses.filter(
    (e) => e.is_active && e.type === "RECURRING",
  );
  const totalMonthly = recurringActive.reduce(
    (sum, e) =>
      sum + normalizeToMonthly(Number(e.amount), e.recurrence_frequency),
    0,
  );
  const count = recurringActive.length;

  const displayAmount =
    totalMonthly >= 1000
      ? `${(totalMonthly / 1000).toLocaleString("fr-CA", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}k`
      : totalMonthly.toLocaleString("fr-CA", {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        });

  const monthlyLabel = totalMonthly.toLocaleString("fr-CA", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  return (
    <>
      <style>{`
        @keyframes monument-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes monument-fade-in {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .monument-section {
          animation: monument-fade-in 0.6s ease both;
        }
        .monument-pulse-dot {
          animation: monument-pulse 2s ease-in-out infinite;
        }
      `}</style>

      <div style={{ padding: "0 0 96px", minHeight: "100vh" }}>
        {/* Monument hero */}
        <div
          className="monument-section"
          style={{
            padding: "24px 20px 20px",
            textAlign: "center",
            position: "relative",
          }}
        >
          <Breadcrumb
            items={[
              { label: "Réglages", href: "/parametres" },
              { label: "Mes dépenses récurrentes" },
            ]}
          />

          {/* Label top */}
          <p
            style={{
              fontSize: "12px",
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--accent)",
              marginBottom: "8px",
              marginTop: "16px",
            }}
          >
            Dépenses récurrentes
          </p>

          {/* Monument amount */}
          <p
            style={{
              fontSize: "clamp(2.5rem, 10vw, 4rem)",
              fontWeight: 800,
              letterSpacing: "-0.04em",
              lineHeight: 1,
              color: "var(--text-primary)",
            }}
          >
            {displayAmount}
            <span
              style={{
                fontSize: "0.4em",
                fontWeight: 600,
                color: "var(--accent)",
                verticalAlign: "super",
                marginLeft: "2px",
              }}
            >
              $
            </span>
          </p>

          {/* Sub-label */}
          <p
            style={{
              fontSize: "14px",
              fontWeight: 500,
              color: "var(--text-tertiary)",
              marginTop: "8px",
              letterSpacing: "-0.01em",
            }}
          >
            {count} charge{count !== 1 ? "s" : ""} ·{" "}
            <strong style={{ fontWeight: 700, color: "var(--text-secondary)" }}>
              {monthlyLabel} $
            </strong>{" "}
            / mois
          </p>

          {/* Active badge with pulsing dot */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginTop: "12px",
            }}
          >
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                padding: "5px 12px",
                background: "var(--accent-subtle)",
                border: "1px solid rgba(15, 118, 110, 0.12)",
                borderRadius: "100px",
                fontSize: "12px",
                fontWeight: 700,
                color: "var(--accent)",
                letterSpacing: "-0.01em",
              }}
            >
              <span
                className="monument-pulse-dot"
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  background: "var(--accent)",
                  display: "inline-block",
                  flexShrink: 0,
                }}
              />
              Récurrentes actives
            </span>
          </div>
        </div>

        {/* Manager */}
        <div style={{ padding: "0 20px" }}>
          <ExpenseTemplateManager
            expenses={expenses}
            sections={sections}
            cards={cards}
          />
        </div>
      </div>
    </>
  );
}
