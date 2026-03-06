/**
 * SetupGuideBar — The collapsed state of the guide.
 *
 * Mobile (< 1024px):
 *   - Fixed bar above the bottom nav (bottom: var(--nav-height) + var(--safe-bottom))
 *   - Full-width with 12px horizontal inset
 *   - White card with teal shadow
 *   - Entrance: slide-up 350ms after 800ms page load delay
 *
 * Desktop (>= 1024px):
 *   - Fixed pill at bottom-right (24px from bottom/right)
 *   - 340px wide
 *   - More elevated on hover (translateY(-1px))
 *   - Entrance: slide-up + fade-in 350ms after 600ms delay
 *
 * Both show: [Progress Ring 36px] [Label + Next step] [Chevron circle]
 *
 * Props:
 *   - nextStepTitle: text for the next uncompleted step title
 *   - completedCount: 0–4
 *   - isExpanded: controls chevron rotation (rotated when sheet is open)
 *   - onClick: expand handler
 */

import SetupGuideProgressRing from "./SetupGuideProgressRing";

type Props = {
  nextStepTitle: string;
  completedCount: number;
  isExpanded: boolean;
  onClick: () => void;
};

export default function SetupGuideBar({
  nextStepTitle,
  completedCount,
  isExpanded,
  onClick,
}: Props) {
  return (
    <>
      {/* ══════════════════════════════════════════════
          MOBILE: Fixed bar above bottom nav
          (hidden on lg+)
          ══════════════════════════════════════════════ */}
      <div
        className="lg:hidden"
        style={{
          position: "fixed",
          bottom: "calc(var(--nav-height) + var(--safe-bottom))",
          left: 0,
          right: 0,
          padding: "0 12px",
          zIndex: 100,
          animation:
            "setupGuideBarIn 350ms cubic-bezier(0.22, 1, 0.36, 1) 800ms both",
        }}
      >
        {/* Inner card */}
        <div
          role="button"
          aria-expanded={isExpanded}
          aria-label={`Guide de configuration, ${completedCount} sur 4 étapes complétées. Étape suivante : ${nextStepTitle}`}
          tabIndex={0}
          onClick={onClick}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onClick()}
          style={{
            background: "var(--white)",
            border: "1px solid var(--slate-200)",
            borderRadius: "var(--radius-md)",
            boxShadow: "0 8px 24px rgba(15, 118, 110, 0.12)",
            padding: "14px 16px",
            display: "flex",
            alignItems: "center",
            gap: 12,
            cursor: "pointer",
            transition: "all 0.2s ease",
            outline: "none",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "rgba(15, 118, 110, 0.2)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--slate-200)";
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "rgba(15, 118, 110, 0.2)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "var(--slate-200)";
          }}
        >
          <SetupGuideProgressRing
            completed={completedCount}
            total={4}
            size="sm"
          />

          {/* Text block */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--teal-700)",
                marginBottom: 1,
                fontFamily: "var(--font)",
              }}
            >
              Étape suivante
            </div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: "var(--slate-900)",
                letterSpacing: "-0.01em",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                fontFamily: "var(--font)",
              }}
            >
              {nextStepTitle}
            </div>
          </div>

          {/* Chevron circle */}
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: "var(--teal-50)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--teal-700)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              style={{
                transition: "transform 250ms ease-in-out",
                transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
              }}
            >
              <polyline points="18 15 12 9 6 15" />
            </svg>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          DESKTOP: Floating pill at bottom-right
          (hidden on < lg)
          ══════════════════════════════════════════════ */}
      <div
        className="hidden lg:block"
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          zIndex: 200,
          width: 340,
          animation:
            "setupGuideWidgetIn 350ms cubic-bezier(0.22, 1, 0.36, 1) 600ms both",
        }}
      >
        <div
          role="button"
          aria-expanded={isExpanded}
          aria-label={`Guide de configuration, ${completedCount} sur 4 étapes complétées. Étape suivante : ${nextStepTitle}`}
          tabIndex={0}
          onClick={onClick}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onClick()}
          style={{
            background: "var(--white)",
            border: "1px solid var(--slate-200)",
            borderRadius: "var(--radius-lg)",
            boxShadow: "0 8px 24px rgba(15, 118, 110, 0.12)",
            padding: "14px 18px",
            display: "flex",
            alignItems: "center",
            gap: 14,
            cursor: "pointer",
            transition: "all 0.2s ease",
            outline: "none",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "rgba(15, 118, 110, 0.2)";
            e.currentTarget.style.boxShadow =
              "0 8px 24px rgba(15, 118, 110, 0.12), 0 0 0 1px rgba(15, 118, 110, 0.05)";
            e.currentTarget.style.transform = "translateY(-1px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--slate-200)";
            e.currentTarget.style.boxShadow =
              "0 8px 24px rgba(15, 118, 110, 0.12)";
            e.currentTarget.style.transform = "translateY(0)";
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "rgba(15, 118, 110, 0.2)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "var(--slate-200)";
          }}
        >
          <SetupGuideProgressRing
            completed={completedCount}
            total={4}
            size="sm"
          />

          {/* Text block */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--teal-700)",
                marginBottom: 1,
                fontFamily: "var(--font)",
              }}
            >
              Étape suivante
            </div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: "var(--slate-900)",
                letterSpacing: "-0.01em",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                fontFamily: "var(--font)",
              }}
            >
              {nextStepTitle}
            </div>
          </div>

          {/* Chevron circle */}
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: "var(--teal-50)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--teal-700)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              style={{
                transition: "transform 250ms ease-in-out",
                transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
              }}
            >
              <polyline points="18 15 12 9 6 15" />
            </svg>
          </div>
        </div>
      </div>
    </>
  );
}
