export const dynamic = "force-dynamic";

import { getAllocations } from "@/lib/actions/allocations";
import { getSections } from "@/lib/actions/sections";
import { getPlannedExpenses } from "@/lib/actions/savings";
import { getMonthlyIncomeSummary } from "@/lib/actions/monthly-incomes";
import { currentMonth } from "@/lib/utils";
import Breadcrumb from "@/components/Breadcrumb";
import AllocationsManager from "@/components/AllocationsManager";

export default async function AllocationPage() {
  const month = currentMonth();
  const [allocations, sections, projects, incomeSummary] = await Promise.all([
    getAllocations(),
    getSections(),
    getPlannedExpenses(),
    getMonthlyIncomeSummary(month),
  ]);

  const expectedTotal = incomeSummary.expectedTotal;
  const displayAmount =
    expectedTotal >= 1000
      ? `${(expectedTotal / 1000).toLocaleString("fr-CA", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}k`
      : expectedTotal.toLocaleString("fr-CA", {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        });
  const monthlyLabel = expectedTotal.toLocaleString("fr-CA", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  return (
    <div style={{ padding: "0 0 96px", minHeight: "100vh" }}>
      {/* Monument hero — Allocation */}
      <div style={{ padding: "24px 20px 16px", textAlign: "center" }}>
        <Breadcrumb
          items={[
            { label: "Reglages", href: "/parametres" },
            { label: "Allocation du revenu" },
          ]}
        />
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
          Allocation
        </p>
        <p
          style={{
            fontSize: "clamp(2.5rem, 10vw, 4rem)",
            fontWeight: 800,
            letterSpacing: "-0.03em",
            lineHeight: 1,
            color: "var(--text-primary)",
          }}
        >
          <span
            style={{
              fontSize: "0.4em",
              fontWeight: 600,
              color: "var(--accent)",
              verticalAlign: "super",
            }}
          >
            $
          </span>
          {displayAmount}
        </p>
        <p
          style={{
            fontSize: "14px",
            fontWeight: 500,
            color: "var(--text-tertiary)",
            marginTop: "6px",
          }}
        >
          à répartir chaque mois
        </p>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginTop: "10px",
          }}
        >
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              padding: "4px 10px",
              borderRadius: "100px",
              background: "var(--positive-subtle)",
              color: "var(--accent)",
              fontSize: "13px",
              fontWeight: 600,
            }}
          >
            {monthlyLabel} $ / mois attendus
          </span>
        </div>
      </div>

      <div style={{ padding: "0 20px" }}>
        <AllocationsManager
          allocations={allocations}
          sections={sections}
          projects={projects}
          expectedMonthlyIncome={incomeSummary.expectedTotal}
        />
      </div>
    </div>
  );
}
