
import {getSettings} from "@/lib/actions/financial/settings";
import { pageSpace } from "@/lib/spaces/page";
export const dynamic = "force-dynamic";

import { getAllocations } from "@/lib/actions/financial/allocations";
import { getSections } from "@/lib/actions/financial/sections";
import { getPlannedExpenses } from "@/lib/actions/financial/savings";
import { getMonthlyIncomeSummary } from "@/lib/actions/financial/monthly-incomes";
import { currentMonth, formatCAD } from "@/lib/utils";
import Breadcrumb from "@/components/Breadcrumb";
import AllocationsManager from "@/components/AllocationsManager";

export default async function AllocationPage({ params }: { params: Promise<{spaceId:string}> }) {
  const spaceId = await pageSpace(params);
  const {default_currency} = await getSettings(spaceId);

  const month = currentMonth();
  const [allocations, sections, projects, incomeSummary] = await Promise.all([
    getAllocations(spaceId),
    getSections(spaceId),
    getPlannedExpenses(spaceId),
    getMonthlyIncomeSummary(spaceId, month),
  ]);

  const expectedTotal = incomeSummary.expectedTotal;
  const displayAmount =
    expectedTotal >= 1000
      ? `${(expectedTotal / 1000).toLocaleString("fr-CA", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}k`
      : expectedTotal.toLocaleString("fr-CA", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
  const monthlyLabel = formatCAD(expectedTotal,default_currency??"CAD");

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
            {monthlyLabel} / mois attendus
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
