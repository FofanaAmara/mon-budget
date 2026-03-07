/**
 * SetupGuideProgressRing — SVG circular progress indicator.
 *
 * Three size variants:
 *   - sm (36px): used in the collapsed mobile bar and collapsed desktop widget
 *   - md (48px): used in the bottom sheet header
 *   - lg (44px): used in the desktop expanded widget header
 *
 * Props:
 *   - completed: number of completed steps (0–N)
 *   - total: total steps (default 5)
 *   - size: 'sm' | 'md' | 'lg'
 *   - celebration: when true, renders amber ring (all steps done)
 *
 * Circumference formula: 2 * PI * r
 * stroke-dashoffset = circumference * (1 - progress)
 */

type ProgressRingSize = "sm" | "md" | "lg";

type Props = {
  completed: number;
  total?: number;
  size?: ProgressRingSize;
  celebration?: boolean;
};

const RING_CONFIGS: Record<
  ProgressRingSize,
  {
    svgSize: number;
    cx: number;
    cy: number;
    r: number;
    strokeWidth: number;
    circumference: number;
    fontSize: number;
    labelTransform?: string;
  }
> = {
  // Collapsed bar (mobile + desktop collapsed)
  sm: {
    svgSize: 36,
    cx: 18,
    cy: 18,
    r: 14,
    strokeWidth: 3,
    circumference: 88, // 2 * PI * 14 ≈ 87.96
    fontSize: 11,
  },
  // Bottom sheet header
  md: {
    svgSize: 48,
    cx: 24,
    cy: 24,
    r: 19,
    strokeWidth: 3.5,
    circumference: 119.4, // 2 * PI * 19 ≈ 119.38
    fontSize: 14,
  },
  // Desktop expanded widget header
  lg: {
    svgSize: 44,
    cx: 22,
    cy: 22,
    r: 17,
    strokeWidth: 3.5,
    circumference: 107, // 2 * PI * 17 ≈ 106.81
    fontSize: 13,
  },
};

export default function SetupGuideProgressRing({
  completed,
  total = 5,
  size = "sm",
  celebration = false,
}: Props) {
  const config = RING_CONFIGS[size];
  const progress = total > 0 ? completed / total : 0;
  const dashoffset = config.circumference * (1 - progress);

  // Color scheme: teal during progress, amber on celebration
  const trackColor = celebration ? "#FEF3C7" : "var(--slate-100)";
  const fillColor = celebration ? "#F59E0B" : "var(--teal-700)";
  const labelColor = celebration ? "#F59E0B" : "var(--teal-700)";

  return (
    <div
      style={{
        position: "relative",
        width: config.svgSize,
        height: config.svgSize,
        flexShrink: 0,
      }}
      role="progressbar"
      aria-valuenow={completed}
      aria-valuemin={0}
      aria-valuemax={total}
      aria-label={`${completed} sur ${total} étapes complétées`}
    >
      {/* SVG ring — rotated -90deg so fill starts at 12 o'clock */}
      <svg
        width={config.svgSize}
        height={config.svgSize}
        viewBox={`0 0 ${config.svgSize} ${config.svgSize}`}
        style={{ transform: "rotate(-90deg)" }}
      >
        {/* Track (background circle) */}
        <circle
          cx={config.cx}
          cy={config.cy}
          r={config.r}
          fill="none"
          stroke={trackColor}
          strokeWidth={config.strokeWidth}
        />
        {/* Fill (progress arc) */}
        <circle
          cx={config.cx}
          cy={config.cy}
          r={config.r}
          fill="none"
          stroke={fillColor}
          strokeWidth={config.strokeWidth}
          strokeLinecap="round"
          strokeDasharray={config.circumference}
          strokeDashoffset={dashoffset}
          style={{ transition: "stroke-dashoffset 0.8s ease" }}
        />
      </svg>

      {/* Count label centered over the ring */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: config.fontSize,
          fontWeight: 800,
          color: labelColor,
          letterSpacing: "-0.02em",
          fontFamily: "var(--font)",
        }}
      >
        {completed}/{total}
      </div>
    </div>
  );
}
