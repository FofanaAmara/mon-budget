"use client";

import { formatCAD } from "@/lib/utils";
import type {
  MonthSummary,
  MonthlyExpense,
  MonthlySavingsSummary,
} from "@/lib/types";

type Props = {
  summary: MonthSummary;
  incomeSummary: { expectedTotal: number; actualTotal: number };
  expenses: MonthlyExpense[];
  monthlyIncomeFromTemplates: number;
  totalMonthlyExpenses: number;
  availableAmount: number;
  totalEpargne: number;
  totalDebtBalance: number;
  valeurNette: number;
  savingsSummary: MonthlySavingsSummary;
};

// Circular SVG progress ring
// Circle: cx=90, cy=90, r=80. Circumference = 2*PI*80 ≈ 502.6
const CIRCUMFERENCE = 2 * Math.PI * 80;

function ScoreRing({ score }: { score: number }) {
  const clampedScore = Math.max(0, Math.min(100, score));
  const dashOffset = CIRCUMFERENCE * (1 - clampedScore / 100);

  const isGood = clampedScore >= 80;
  const isWarning = clampedScore >= 50 && clampedScore < 80;
  const strokeColor = isGood
    ? "var(--positive)"
    : isWarning
      ? "var(--amber-500)"
      : "var(--error)";
  const textColor = isGood
    ? "var(--positive)"
    : isWarning
      ? "var(--amber-500)"
      : "var(--error)";

  const label =
    clampedScore >= 80
      ? "Bonne santé financière"
      : clampedScore >= 50
        ? "Quelques points à surveiller"
        : "Situation critique";

  const desc =
    clampedScore >= 80
      ? "Tu gères bien ton argent ce mois-ci."
      : clampedScore >= 50
        ? "Quelques ajustements à apporter."
        : "Tes charges dépassent tes revenus reçus.";

  return (
    <section
      style={{
        padding: "32px 0 0",
        textAlign: "center",
        animation: "fadeInUp 0.5s ease both",
      }}
    >
      <div
        style={{
          position: "relative",
          width: "180px",
          height: "180px",
          margin: "0 auto",
        }}
      >
        <svg
          style={{
            width: "180px",
            height: "180px",
            transform: "rotate(-90deg)",
          }}
          viewBox="0 0 180 180"
        >
          {/* Track */}
          <circle
            cx="90"
            cy="90"
            r="80"
            fill="none"
            stroke="var(--slate-100)"
            strokeWidth="10"
          />
          {/* Fill */}
          <circle
            cx="90"
            cy="90"
            r="80"
            fill="none"
            stroke={strokeColor}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            style={{
              transition: "stroke-dashoffset 1.2s ease, stroke 0.4s ease",
            }}
          />
        </svg>
        {/* Score in center */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: "clamp(2.5rem, 8vw, 3.5rem)",
              fontWeight: 800,
              letterSpacing: "-0.04em",
              lineHeight: 1,
              color: textColor,
            }}
          >
            {Math.round(clampedScore)}
          </div>
          <div
            style={{
              fontSize: "14px",
              fontWeight: 500,
              color: "var(--slate-400)",
              marginTop: "2px",
            }}
          >
            / 100
          </div>
        </div>
      </div>

      <div
        style={{
          fontSize: "15px",
          fontWeight: 600,
          color: "var(--slate-700)",
          marginTop: "16px",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: "13px",
          fontWeight: 400,
          color: "var(--slate-500)",
          marginTop: "4px",
          maxWidth: "280px",
          marginLeft: "auto",
          marginRight: "auto",
          lineHeight: 1.5,
        }}
      >
        {desc}
      </div>
    </section>
  );
}

// Alert item
type AlertSeverity = "critical" | "warning" | "good";

const alertStyles: Record<
  AlertSeverity,
  {
    border: string;
    bg: string;
    dot: string;
    badge: string;
    badgeText: string;
    label: string;
  }
> = {
  critical: {
    border: "rgba(220, 38, 38, 0.15)",
    bg: "var(--error-light)",
    dot: "var(--error)",
    badge: "var(--error)",
    badgeText: "white",
    label: "Critique",
  },
  warning: {
    border: "rgba(245, 158, 11, 0.15)",
    bg: "var(--warning-light)",
    dot: "var(--amber-500)",
    badge: "var(--amber-500)",
    badgeText: "white",
    label: "Attention",
  },
  good: {
    border: "rgba(5, 150, 105, 0.1)",
    bg: "var(--success-light)",
    dot: "var(--positive)",
    badge: "var(--positive)",
    badgeText: "white",
    label: "Bien",
  },
};

function AlertItem({
  severity,
  title,
  desc,
}: {
  severity: AlertSeverity;
  title: string;
  desc: string;
}) {
  const s = alertStyles[severity];
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "12px",
        padding: "14px 16px",
        borderRadius: "var(--radius-md)",
        background: s.bg,
        border: `1px solid ${s.border}`,
      }}
    >
      <div
        style={{
          width: "10px",
          height: "10px",
          borderRadius: "50%",
          background: s.dot,
          flexShrink: 0,
          marginTop: "4px",
        }}
      />
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontSize: "14px",
            fontWeight: 700,
            color: "var(--slate-900)",
            letterSpacing: "-0.01em",
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontSize: "13px",
            fontWeight: 400,
            color: "var(--slate-500)",
            marginTop: "2px",
            lineHeight: 1.5,
          }}
        >
          {desc}
        </div>
      </div>
      <div
        style={{
          fontSize: "10px",
          fontWeight: 700,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          padding: "2px 8px",
          borderRadius: "4px",
          background: s.badge,
          color: s.badgeText,
          flexShrink: 0,
        }}
      >
        {s.label}
      </div>
    </div>
  );
}

// Metric card
function MetricCard({
  value,
  label,
  desc,
  color,
  barPct,
  fullWidth,
  barColor,
}: {
  value: string;
  label: string;
  desc?: string;
  color: string;
  barPct?: number;
  fullWidth?: boolean;
  barColor?: string;
}) {
  return (
    <div
      style={{
        background: "var(--surface-raised)",
        border: "1px solid var(--slate-200)",
        borderRadius: "var(--radius-md)",
        padding: "18px 16px",
        textAlign: fullWidth ? "left" : "center",
        gridColumn: fullWidth ? "1 / -1" : undefined,
      }}
    >
      {fullWidth ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: "var(--slate-400)",
              }}
            >
              {label}
            </div>
            {desc && (
              <div
                style={{
                  fontSize: "12px",
                  fontWeight: 500,
                  color: "var(--slate-500)",
                  marginTop: "4px",
                }}
              >
                {desc}
              </div>
            )}
          </div>
          <div
            style={{
              fontSize: "1.5rem",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              color,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {value}
          </div>
        </div>
      ) : (
        <>
          <div
            style={{
              fontSize: "clamp(1.5rem, 5vw, 2rem)",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              lineHeight: 1.1,
              color,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {value}
          </div>
          <div
            style={{
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: "var(--slate-400)",
              marginTop: "6px",
            }}
          >
            {label}
          </div>
          {desc && (
            <div
              style={{
                fontSize: "12px",
                fontWeight: 500,
                color: "var(--slate-500)",
                marginTop: "4px",
              }}
            >
              {desc}
            </div>
          )}
          {barPct !== undefined && (
            <div
              style={{
                height: "4px",
                background: "var(--slate-100)",
                borderRadius: "2px",
                marginTop: "10px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  borderRadius: "2px",
                  background: barColor ?? "var(--teal-700)",
                  width: `${Math.max(0, Math.min(barPct, 100))}%`,
                  transition: "width 0.8s ease",
                }}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function TabSanteFinanciere({
  summary,
  incomeSummary,
  expenses,
  monthlyIncomeFromTemplates,
  totalMonthlyExpenses,
  availableAmount,
  totalEpargne,
  totalDebtBalance,
  valeurNette,
  savingsSummary,
}: Props) {
  // Score: percentage of expected expenses already paid (0-100)
  const coverageActual =
    summary.total > 0
      ? Math.min((summary.paid_total / summary.total) * 100, 100)
      : 100;

  // Score is a blend: coverage (60%) + savings rate indicator (20%) + no-overdue bonus (20%)
  const overdueExpenses = expenses.filter((e) => e.status === "OVERDUE");
  const monthlySavings = savingsSummary.totalContributions;
  const savingsRate =
    incomeSummary.expectedTotal > 0
      ? Math.min((monthlySavings / incomeSummary.expectedTotal) * 100, 100)
      : 0;
  const overdueBonus = overdueExpenses.length === 0 ? 20 : 0;
  const healthScore = Math.round(
    coverageActual * 0.6 + savingsRate * 0.2 + overdueBonus,
  );

  // Budget categories that are over
  const bigUpcoming = expenses.filter(
    (e) => e.status === "UPCOMING" && Number(e.amount) >= 500,
  );

  // Metrics — savingsRate already computed above, reuse it
  const savingsRatePct = savingsRate;

  const coveragePct = Math.min(coverageActual, 100);

  // Days remaining in month (approximate)
  const today = new Date();
  const lastDay = new Date(
    today.getFullYear(),
    today.getMonth() + 1,
    0,
  ).getDate();
  const daysLeft = lastDay - today.getDate();
  const dailyAvailable =
    daysLeft > 0 && availableAmount > 0
      ? Math.round(availableAmount / daysLeft)
      : 0;

  // Safety cushion: months of expenses covered by savings
  const cushion =
    totalMonthlyExpenses > 0 ? totalEpargne / totalMonthlyExpenses : 0;
  const cushionPct = Math.min(cushion / 3, 1) * 100; // 3 months = 100%

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
      {/* ====== SCORE RING ====== */}
      <ScoreRing score={healthScore} />

      {/* ====== ALERTS ====== */}
      <section
        style={{
          paddingTop: "28px",
          animation: "fadeInUp 0.5s ease 0.1s both",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            marginBottom: "14px",
          }}
        >
          <h2
            style={{
              fontSize: "13px",
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--slate-400)",
            }}
          >
            Alertes prioritaires
          </h2>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {overdueExpenses.length > 0 && (
            <AlertItem
              severity="critical"
              title={`${overdueExpenses.length} charge${overdueExpenses.length > 1 ? "s" : ""} en retard`}
              desc={`${formatCAD(overdueExpenses.reduce((s, e) => s + Number(e.amount), 0))} non payé${overdueExpenses.length > 1 ? "s" : ""} ce mois-ci.`}
            />
          )}

          {bigUpcoming.length > 0 && (
            <AlertItem
              severity="warning"
              title={`${bigUpcoming.length} gros paiement${bigUpcoming.length > 1 ? "s" : ""} à venir`}
              desc={`${formatCAD(bigUpcoming.reduce((s, e) => s + Number(e.amount), 0))} à prévoir prochainement.`}
            />
          )}

          {summary.paid_total > summary.planned_total && (
            <AlertItem
              severity="warning"
              title="Dépenses au-dessus du prévu"
              desc={`Tu as dépassé de ${formatCAD(summary.paid_total - summary.planned_total)} tes charges planifiées.`}
            />
          )}

          {availableAmount >= 0 && overdueExpenses.length === 0 && (
            <AlertItem
              severity="good"
              title="Ton mois est sous contrôle"
              desc={`${formatCAD(availableAmount)} disponibles. Continue comme ça !`}
            />
          )}

          {savingsRate >= 10 && (
            <AlertItem
              severity="good"
              title={`Taux d'épargne à ${Math.round(savingsRate)}%`}
              desc="Tu épargnes bien ce mois-ci. C'est au-dessus de la moyenne recommandée."
            />
          )}
        </div>
      </section>

      {/* ====== SECONDARY METRICS ====== */}
      <section
        style={{
          paddingTop: "28px",
          paddingBottom: "8px",
          animation: "fadeInUp 0.5s ease 0.2s both",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            marginBottom: "14px",
          }}
        >
          <h2
            style={{
              fontSize: "13px",
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--slate-400)",
            }}
          >
            Métriques
          </h2>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "12px",
          }}
        >
          <MetricCard
            value={`${Math.round(savingsRatePct)}%`}
            label="Taux d'épargne"
            desc={
              incomeSummary.expectedTotal > 0
                ? `${formatCAD(monthlySavings)} / ${formatCAD(incomeSummary.expectedTotal)}`
                : "—"
            }
            color="var(--teal-700)"
            barPct={savingsRatePct * 5} // scale: 20% target = full bar
            barColor="var(--teal-700)"
          />

          <MetricCard
            value={`${Math.round(coveragePct)}%`}
            label="Couverture dépenses"
            desc={`${formatCAD(summary.paid_total)} / ${formatCAD(summary.total)} prévu`}
            color="var(--positive)"
            barPct={coveragePct}
            barColor="var(--positive)"
          />

          <MetricCard
            value={daysLeft.toString()}
            label="Jours restants"
            desc={
              dailyAvailable > 0
                ? `${dailyAvailable} $/jour dispo`
                : "Budget dépassé"
            }
            color="var(--amber-500)"
          />

          <MetricCard
            value={`${cushion.toFixed(1)}x`}
            label="Coussin de sécurité"
            desc="Mois de dépenses couverts"
            color="var(--slate-900)"
            barPct={cushionPct}
            barColor="var(--teal-700)"
          />

          <MetricCard
            value={`${valeurNette >= 0 ? "+" : ""}${formatCAD(valeurNette)}`}
            label="Valeur nette"
            desc="Épargne totale − Dettes totales"
            color={valeurNette >= 0 ? "var(--teal-700)" : "var(--error)"}
            fullWidth
          />
        </div>
      </section>
    </div>
  );
}
