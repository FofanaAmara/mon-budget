"use client";

import { formatCAD } from "@/lib/utils";
import type { MonthSummary } from "@/lib/types";

type Props = {
  summary: MonthSummary;
};

export default function ExpenseSummaryStats({ summary }: Props) {
  const chargesFixes = summary.planned_total;
  const paidTotal = summary.paid_total;
  const isOverBudget = paidTotal > chargesFixes && chargesFixes > 0;
  const restAPayer = Math.max(chargesFixes - paidTotal, 0);
  const overAmount = paidTotal - chargesFixes;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "12px",
        padding: "20px 20px 0",
      }}
    >
      <StatCard
        label="Payées"
        amount={paidTotal}
        color="var(--positive)"
        detail={`${summary.paid_count} dépense${summary.paid_count > 1 ? "s" : ""}`}
      />
      <StatCard
        label={isOverBudget ? "Au-dessus" : "Restant"}
        amount={isOverBudget ? overAmount : restAPayer}
        color={isOverBudget ? "var(--error)" : "var(--teal-700)"}
        detail={`sur ${formatCAD(chargesFixes)} prévu`}
      />
    </div>
  );
}

function StatCard({
  label,
  amount,
  color,
  detail,
}: {
  label: string;
  amount: number;
  color: string;
  detail: string;
}) {
  return (
    <div
      style={{
        background: "var(--white)",
        border: "1px solid var(--slate-200)",
        borderRadius: "var(--radius-md)",
        padding: "16px",
      }}
    >
      <p
        style={{
          fontSize: "11px",
          fontWeight: 700,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "var(--slate-400)",
          marginBottom: "6px",
        }}
      >
        {label}
      </p>
      <p
        style={{
          fontSize: "22px",
          fontWeight: 800,
          letterSpacing: "-0.03em",
          color,
          fontVariantNumeric: "tabular-nums",
          lineHeight: 1,
        }}
      >
        {amount.toLocaleString("fr-CA", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}
        {"\u00A0$"}
      </p>
      <p
        style={{
          fontSize: "11px",
          fontWeight: 500,
          color: "var(--slate-400)",
          marginTop: "4px",
        }}
      >
        {detail}
      </p>
    </div>
  );
}
