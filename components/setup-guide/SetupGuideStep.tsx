/**
 * SetupGuideStep — Individual step row inside the checklist.
 *
 * Visual states:
 *   - 'upcoming': gray circle with number, gray text, gray arrow
 *   - 'current': teal circle with number, teal text, teal arrow
 *   - 'completed': green filled circle with white check, strikethrough title, no arrow
 *
 * Variants:
 *   - 'mobile': larger padding and sizes (for bottom sheet)
 *   - 'desktop': smaller padding and sizes (for floating widget)
 *
 * The timeline connector line is rendered via a pseudo-element in the parent's
 * CSS. Here we expose a `isLast` prop so the parent knows not to render it.
 *
 */

type StepState = "upcoming" | "current" | "completed";
type StepVariant = "mobile" | "desktop";

export type SetupGuideStepData = {
  id: string;
  title: string;
  description: string;
  href: string;
  state: StepState;
  index: number; // 1-based step number
};

type Props = SetupGuideStepData & {
  variant?: StepVariant;
  isLast?: boolean;
  onClick?: () => void;
};

// ── Style maps per state ────────────────────────────────────────────────────

const CIRCLE_STYLES: Record<StepState, React.CSSProperties> = {
  upcoming: {
    border: "2px solid var(--slate-300)",
    background: "transparent",
  },
  current: {
    border: "2px solid var(--teal-700)",
    background: "var(--teal-50)",
  },
  completed: {
    border: "2px solid var(--success)",
    background: "var(--success)",
  },
};

const TITLE_STYLES: Record<StepState, React.CSSProperties> = {
  upcoming: {
    color: "var(--slate-900)",
    textDecoration: "none",
  },
  current: {
    color: "var(--teal-700)",
    textDecoration: "none",
  },
  completed: {
    color: "var(--slate-400)",
    textDecoration: "line-through",
    textDecorationColor: "var(--slate-300)",
  },
};

const DESCRIPTION_COLORS: Record<StepState, string> = {
  upcoming: "var(--slate-500)",
  current: "var(--slate-500)",
  completed: "var(--slate-300)",
};

const ARROW_COLORS: Record<StepState, string> = {
  upcoming: "var(--slate-300)",
  current: "var(--teal-700)",
  completed: "transparent", // hidden
};

export default function SetupGuideStep({
  title,
  description,
  href,
  state,
  index,
  variant = "mobile",
  isLast = false,
  onClick,
}: Props) {
  const isMobile = variant === "mobile";

  // Size config per variant
  const circleSize = isMobile ? 28 : 26;
  const numberSize = isMobile ? 12 : 11;
  const titleSize = isMobile ? 15 : 14;
  const descSize = isMobile ? 13 : 12;
  const arrowSize = isMobile ? 20 : 16;
  const padding = isMobile ? "16px 24px" : "14px 20px";
  const gap = isMobile ? 14 : 12;

  // Timeline connector position per variant
  // The connector sits below the circle, connecting to the next step's circle.
  // left = container padding-left + (circleSize / 2) - (1.5px / 2) ≈ same center as circle
  const connectorLeft = isMobile ? "37px" : "33px"; // 24px padding + 14px (half of 28px)
  const connectorTop = isMobile ? "48px" : "44px"; // container padding-top + circle height + 4px

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.();
        }
      }}
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap,
        padding,
        cursor: "pointer",
        transition: "background 0.15s ease",
        position: "relative",
        outline: "none",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "var(--slate-50)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
      }}
      onFocus={(e) => {
        e.currentTarget.style.background = "var(--slate-50)";
      }}
      onBlur={(e) => {
        e.currentTarget.style.background = "transparent";
      }}
    >
      {/* Timeline connector line — visible for all steps except the last */}
      {!isLast && (
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            left: connectorLeft,
            top: connectorTop,
            bottom: isMobile ? "-16px" : "-14px",
            width: "1.5px",
            background:
              state === "completed"
                ? "rgba(5, 150, 105, 0.3)" // --success at 30%
                : "var(--slate-200)",
          }}
        />
      )}

      {/* Step circle */}
      <div
        aria-hidden="true"
        style={{
          width: circleSize,
          height: circleSize,
          borderRadius: "50%",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginTop: "1px",
          transition: "all 0.3s ease",
          ...CIRCLE_STYLES[state],
        }}
      >
        {state === "completed" ? (
          // White checkmark SVG
          <svg
            width={isMobile ? 14 : 13}
            height={isMobile ? 14 : 13}
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : (
          // Step number
          <span
            style={{
              fontSize: numberSize,
              fontWeight: 700,
              color:
                state === "current" ? "var(--teal-700)" : "var(--slate-400)",
              fontFamily: "var(--font)",
            }}
          >
            {index}
          </span>
        )}
      </div>

      {/* Step content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: titleSize,
            fontWeight: 600,
            letterSpacing: "-0.01em",
            marginBottom: 3,
            fontFamily: "var(--font)",
            ...TITLE_STYLES[state],
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontSize: descSize,
            fontWeight: 400,
            lineHeight: 1.4,
            color: DESCRIPTION_COLORS[state],
            fontFamily: "var(--font)",
          }}
        >
          {description}
        </div>
      </div>

      {/* Chevron-right arrow — hidden for completed steps */}
      {state !== "completed" && (
        <svg
          width={arrowSize}
          height={arrowSize}
          viewBox="0 0 24 24"
          fill="none"
          stroke={ARROW_COLORS[state]}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            flexShrink: 0,
            marginTop: isMobile ? 3 : 2,
            transition: "all 0.15s ease",
          }}
          aria-hidden="true"
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
      )}
    </div>
  );
}
