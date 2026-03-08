/**
 * StatusBadge — pill-shaped semantic badge component (DESIGN-006)
 *
 * Palette:
 *   success  → vert   (#ECFDF5 / #059669) — Paye, Recu, Permanent, Auto, Emploi, Business
 *   neutral  → gris   (#F1F5F9 / #64748B) — Prevu, Attendu, Mensuel, Objectif
 *   warning  → orange (#FEF3C7 / #92400E) — Ponctuel, Variable
 *   danger   → rouge  (#FEF2F2 / #DC2626) — Dette
 */

export type StatusBadgeVariant = "success" | "neutral" | "warning" | "danger";

const VARIANT_STYLES: Record<
  StatusBadgeVariant,
  { background: string; color: string }
> = {
  success: { background: "#ECFDF5", color: "#059669" },
  neutral: { background: "#F1F5F9", color: "#64748B" },
  warning: { background: "#FEF3C7", color: "#92400E" },
  danger: { background: "#FEF2F2", color: "#DC2626" },
};

type Props = {
  label: string;
  variant: StatusBadgeVariant;
  /** Optional leading element (e.g. an SVG icon) */
  icon?: React.ReactNode;
};

export default function StatusBadge({ label, variant, icon }: Props) {
  const { background, color } = VARIANT_STYLES[variant];

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: icon ? "4px" : undefined,
        padding: "3px 10px",
        borderRadius: "100px",
        fontSize: "11px",
        fontWeight: 600,
        letterSpacing: "0.01em",
        whiteSpace: "nowrap",
        background,
        color,
      }}
    >
      {icon}
      {label}
    </span>
  );
}
