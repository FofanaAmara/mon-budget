/**
 * SetupGuideCelebration — Full completion celebration view.
 *
 * Shown inside the bottom sheet (mobile) or expanded widget (desktop)
 * when all steps are completed.
 *
 * Features:
 *   - Amber progress ring (72px) with check icon
 *   - "Ton budget est prêt !" heading
 *   - Subtitle
 *   - CTA button: "Voir mon tableau de bord"
 *   - CSS-only confetti in brand colors (16 particles)
 * TODO for developer:
 *   - Wire `onCTA` to navigate to dashboard ('/') AND persist dismissal server-side
 */

type Props = {
  /** Called when user taps CTA. Wire to dismiss + navigate. */
  onCTA: () => void;
};

// ── Confetti particles config ────────────────────────────────────────────────
// 16 particles, brand colors, varied sizes and positions
const CONFETTI_PARTICLES = [
  {
    left: "10%",
    top: "0%",
    width: 8,
    height: 8,
    color: "#F59E0B",
    delay: "0s",
    shape: "square",
  },
  {
    left: "20%",
    top: "5%",
    width: 5,
    height: 10,
    color: "#0F766E",
    delay: "0.04s",
    shape: "rect",
  },
  {
    left: "30%",
    top: "0%",
    width: 6,
    height: 6,
    color: "#FBBF24",
    delay: "0.08s",
    shape: "circle",
  },
  {
    left: "40%",
    top: "10%",
    width: 10,
    height: 5,
    color: "#0D9488",
    delay: "0.12s",
    shape: "rect",
  },
  {
    left: "50%",
    top: "2%",
    width: 7,
    height: 7,
    color: "#F59E0B",
    delay: "0.06s",
    shape: "square",
  },
  {
    left: "60%",
    top: "8%",
    width: 5,
    height: 9,
    color: "#CBD5E1",
    delay: "0.16s",
    shape: "rect",
  },
  {
    left: "70%",
    top: "0%",
    width: 8,
    height: 5,
    color: "#0F766E",
    delay: "0.02s",
    shape: "rect",
  },
  {
    left: "80%",
    top: "5%",
    width: 6,
    height: 6,
    color: "#F59E0B",
    delay: "0.10s",
    shape: "circle",
  },
  {
    left: "85%",
    top: "12%",
    width: 9,
    height: 9,
    color: "#FBBF24",
    delay: "0.14s",
    shape: "square",
  },
  {
    left: "15%",
    top: "15%",
    width: 5,
    height: 8,
    color: "#94A3B8",
    delay: "0.18s",
    shape: "rect",
  },
  {
    left: "25%",
    top: "8%",
    width: 7,
    height: 7,
    color: "#0D9488",
    delay: "0.22s",
    shape: "circle",
  },
  {
    left: "55%",
    top: "15%",
    width: 6,
    height: 10,
    color: "#F59E0B",
    delay: "0.07s",
    shape: "rect",
  },
  {
    left: "65%",
    top: "3%",
    width: 8,
    height: 8,
    color: "#0F766E",
    delay: "0.11s",
    shape: "square",
  },
  {
    left: "75%",
    top: "18%",
    width: 5,
    height: 5,
    color: "#FBBF24",
    delay: "0.19s",
    shape: "circle",
  },
  {
    left: "35%",
    top: "20%",
    width: 10,
    height: 6,
    color: "#CBD5E1",
    delay: "0.05s",
    shape: "rect",
  },
  {
    left: "45%",
    top: "0%",
    width: 6,
    height: 8,
    color: "#F59E0B",
    delay: "0.15s",
    shape: "square",
  },
] as const;

export default function SetupGuideCelebration({ onCTA }: Props) {
  return (
    <div
      style={{
        textAlign: "center",
        padding: "20px 24px 24px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* ── Confetti (CSS-only, 16 particles) ────────────────────────── */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "200px",
          overflow: "hidden",
          pointerEvents: "none",
        }}
      >
        {CONFETTI_PARTICLES.map((p, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: p.left,
              top: p.top,
              width: p.width,
              height: p.height,
              background: p.color,
              borderRadius: p.shape === "circle" ? "50%" : "2px",
              animation: `setupGuideConfettiFall 2s ease-out ${p.delay} forwards`,
            }}
          />
        ))}
      </div>

      {/* ── Amber progress ring (72px) ──────────────────────────────── */}
      <div
        style={{
          width: 72,
          height: 72,
          margin: "0 auto 20px",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* SVG ring — amber, 100% filled */}
        <svg
          width="72"
          height="72"
          viewBox="0 0 72 72"
          style={{ transform: "rotate(-90deg)" }}
        >
          {/* Track */}
          <circle
            cx="36"
            cy="36"
            r="28"
            fill="none"
            stroke="#FEF3C7"
            strokeWidth="4"
          />
          {/* Fill — 100% */}
          <circle
            cx="36"
            cy="36"
            r="28"
            fill="none"
            stroke="#F59E0B"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray="176"
            strokeDashoffset="0"
          />
        </svg>

        {/* Centered amber check icon */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#F59E0B"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
      </div>

      {/* ── Title ───────────────────────────────────────────────────── */}
      <h2
        style={{
          fontSize: 24,
          fontWeight: 800,
          color: "var(--slate-900)",
          letterSpacing: "-0.03em",
          marginBottom: 8,
          position: "relative",
          zIndex: 1,
          fontFamily: "var(--font)",
        }}
      >
        Ton budget est prêt !
      </h2>

      {/* ── Subtitle ─────────────────────────────────────────────────── */}
      <p
        style={{
          fontSize: 15,
          fontWeight: 500,
          color: "var(--slate-500)",
          lineHeight: 1.5,
          maxWidth: 280,
          margin: "0 auto 24px",
          position: "relative",
          zIndex: 1,
          fontFamily: "var(--font)",
        }}
      >
        Tu as tout configuré. Ton tableau de bord t&apos;attend avec tes
        chiffres en temps réel.
      </p>

      {/* ── CTA button ──────────────────────────────────────────────── */}
      <button
        onClick={onCTA}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: "14px 28px",
          background: "#F59E0B",
          color: "var(--slate-900)",
          border: "none",
          borderRadius: "var(--radius-md)",
          fontFamily: "var(--font)",
          fontSize: 15,
          fontWeight: 700,
          letterSpacing: "-0.01em",
          cursor: "pointer",
          transition: "all 0.2s ease",
          boxShadow: "0 4px 12px rgba(245, 158, 11, 0.3)",
          position: "relative",
          zIndex: 1,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "#D97706";
          e.currentTarget.style.transform = "translateY(-1px)";
          e.currentTarget.style.boxShadow =
            "0 6px 16px rgba(245, 158, 11, 0.35)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "#F59E0B";
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow =
            "0 4px 12px rgba(245, 158, 11, 0.3)";
        }}
      >
        Voir mon tableau de bord
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>
    </div>
  );
}
