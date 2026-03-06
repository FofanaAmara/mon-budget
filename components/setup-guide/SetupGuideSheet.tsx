/**
 * SetupGuideSheet — The expanded bottom sheet (mobile) or floating card (desktop).
 *
 * Mobile:
 *   - Full-width bottom sheet, slides up above the bottom nav (72px)
 *   - Backdrop dims page content (20% opacity)
 *   - Drag handle at top (collapse gesture placeholder)
 *   - Contains progress ring (48px), title, subtitle, step list
 *
 * Desktop (>= 1024px):
 *   - Floating card, fixed bottom-right at 24px, 360px wide
 *   - No backdrop (widget floats independently)
 *   - Collapse button in header corner
 *   - Footer text: "Visible sur toutes les pages jusqu'à la complétion"
 *
 * Props:
 *   - steps: enriched step data (with computed state)
 *   - completedCount: number of completed steps
 *   - isOpen: whether sheet is expanded
 *   - onClose: callback to collapse
 *   - onStepClick: called with step href when user taps a step
 *   - isCelebration: show celebration view instead of step list
 *   - onCelebrationCTA: passed to SetupGuideCelebration
 *
 * TODO for developer: the `onStepClick` should use router.push(href). Currently uses window.location.
 */

import SetupGuideProgressRing from "./SetupGuideProgressRing";
import SetupGuideStep, { type SetupGuideStepData } from "./SetupGuideStep";
import SetupGuideCelebration from "./SetupGuideCelebration";

type Props = {
  steps: SetupGuideStepData[];
  completedCount: number;
  isOpen: boolean;
  onClose: () => void;
  onStepClick: (href: string) => void;
  isCelebration?: boolean;
  onCelebrationCTA: () => void;
};

/** Returns the subtitle text based on how many steps are completed. */
function getSubtitle(completedCount: number): string {
  switch (completedCount) {
    case 0:
      return "4 étapes pour être opérationnel";
    case 1:
      return "Beau début !";
    case 2:
      return "Déjà à mi-chemin !";
    case 3:
      return "Plus qu'une étape !";
    default:
      return "4 étapes pour être opérationnel";
  }
}

export default function SetupGuideSheet({
  steps,
  completedCount,
  isOpen,
  onClose,
  onStepClick,
  isCelebration = false,
  onCelebrationCTA,
}: Props) {
  const subtitle = getSubtitle(completedCount);
  const isInProgress = completedCount > 0;

  if (!isOpen) return null;

  return (
    <>
      {/* ══════════════════════════════════════════════
          MOBILE: Bottom sheet + backdrop
          (hidden on lg+, rendered via CSS)
          ══════════════════════════════════════════════ */}

      {/* Backdrop — mobile only */}
      <div
        className="lg:hidden"
        aria-hidden="true"
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(15, 23, 42, 0.2)",
          zIndex: 90,
          animation: "setupGuideBackdropIn 200ms ease forwards",
        }}
      />

      {/* Bottom sheet — mobile */}
      <div
        className="lg:hidden"
        role="dialog"
        aria-label="Guide de configuration"
        aria-modal="true"
        style={{
          position: "fixed",
          bottom: "calc(var(--nav-height) + var(--safe-bottom))",
          left: 0,
          right: 0,
          background: "var(--white)",
          borderRadius: "18px 18px 0 0",
          boxShadow:
            "0 -8px 32px rgba(15, 23, 42, 0.12), 0 -2px 8px rgba(15, 118, 110, 0.06)",
          zIndex: 100,
          paddingBottom: 20,
          maxHeight: 520,
          overflowY: "auto",
          animation:
            "setupGuideSheetIn 350ms cubic-bezier(0.22, 1, 0.36, 1) forwards",
        }}
      >
        {/* Drag handle */}
        <div
          role="button"
          aria-label="Fermer le guide"
          tabIndex={0}
          onClick={onClose}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onClose()}
          style={{
            padding: "12px 0 4px",
            display: "flex",
            justifyContent: "center",
            cursor: "pointer",
          }}
        >
          <div
            style={{
              width: 36,
              height: 4,
              background: "var(--slate-300)",
              borderRadius: 2,
            }}
          />
        </div>

        {/* Sheet header */}
        <div
          style={{
            padding: "12px 24px 20px",
            display: "flex",
            alignItems: "center",
            gap: 14,
          }}
        >
          <SetupGuideProgressRing
            completed={completedCount}
            total={4}
            size="md"
            celebration={isCelebration}
          />
          <div>
            <h2
              style={{
                fontSize: 18,
                fontWeight: 800,
                color: "var(--slate-900)",
                letterSpacing: "-0.02em",
                marginBottom: 2,
                fontFamily: "var(--font)",
              }}
            >
              Configure ton budget
            </h2>
            <p
              style={{
                fontSize: 13,
                fontWeight: isInProgress ? 600 : 500,
                color: isInProgress ? "var(--teal-700)" : "var(--slate-500)",
                letterSpacing: isInProgress ? undefined : "-0.01em",
                fontFamily: "var(--font)",
              }}
            >
              {subtitle}
            </p>
          </div>
        </div>

        {/* Divider */}
        <div
          style={{
            height: 1,
            background: "var(--slate-100)",
            margin: "0 24px",
          }}
        />

        {/* Content: step list or celebration */}
        {isCelebration ? (
          <SetupGuideCelebration onCTA={onCelebrationCTA} />
        ) : (
          <div style={{ padding: "8px 0" }}>
            {steps.map((step, i) => (
              <SetupGuideStep
                key={step.id}
                {...step}
                variant="mobile"
                isLast={i === steps.length - 1}
                onClick={() => onStepClick(step.href)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════
          DESKTOP: Floating expanded card
          (hidden on < lg, rendered via CSS)
          ══════════════════════════════════════════════ */}
      <div
        className="hidden lg:flex"
        role="dialog"
        aria-label="Guide de configuration"
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          zIndex: 200,
          width: 360,
          maxHeight: 500,
          background: "var(--white)",
          border: "1px solid var(--slate-200)",
          borderRadius: "var(--radius-lg)",
          boxShadow:
            "0 16px 48px rgba(15, 23, 42, 0.14), 0 4px 16px rgba(15, 118, 110, 0.08)",
          flexDirection: "column",
          overflow: "hidden",
          animation:
            "setupGuideWidgetExpand 250ms cubic-bezier(0.22, 1, 0.36, 1) forwards",
          transformOrigin: "bottom right",
        }}
      >
        {/* Widget header */}
        <div
          style={{
            padding: "20px 20px 16px",
            borderBottom: "1px solid var(--slate-100)",
            display: "flex",
            alignItems: "center",
            gap: 14,
            flexShrink: 0,
          }}
        >
          <SetupGuideProgressRing
            completed={completedCount}
            total={4}
            size="lg"
            celebration={isCelebration}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2
              style={{
                fontSize: 16,
                fontWeight: 800,
                color: "var(--slate-900)",
                letterSpacing: "-0.02em",
                marginBottom: 1,
                fontFamily: "var(--font)",
              }}
            >
              Configure ton budget
            </h2>
            <p
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "var(--teal-700)",
                fontFamily: "var(--font)",
              }}
            >
              {subtitle}
            </p>
          </div>

          {/* Collapse button */}
          <button
            onClick={onClose}
            aria-label="Réduire le guide"
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: "var(--slate-100)",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "background 0.15s ease",
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--slate-200)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "var(--slate-100)";
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--slate-500)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="18 15 12 9 6 15" />
            </svg>
          </button>
        </div>

        {/* Steps container */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "8px 0",
          }}
        >
          {isCelebration ? (
            <SetupGuideCelebration onCTA={onCelebrationCTA} />
          ) : (
            steps.map((step, i) => (
              <SetupGuideStep
                key={step.id}
                {...step}
                variant="desktop"
                isLast={i === steps.length - 1}
                onClick={() => onStepClick(step.href)}
              />
            ))
          )}
        </div>

        {/* Widget footer */}
        {!isCelebration && (
          <div
            style={{
              padding: "12px 20px",
              borderTop: "1px solid var(--slate-100)",
              flexShrink: 0,
            }}
          >
            <p
              style={{
                fontSize: 12,
                fontWeight: 500,
                color: "var(--slate-400)",
                textAlign: "center",
                fontFamily: "var(--font)",
              }}
            >
              Visible sur toutes les pages jusqu&apos;à la complétion
            </p>
          </div>
        )}
      </div>
    </>
  );
}
