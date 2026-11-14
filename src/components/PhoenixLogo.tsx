interface PhoenixLogoProps {
  size?: "sm" | "md" | "hero";
  showAmbient?: boolean;
  className?: string;
}

const DIMENSIONS: Record<"sm" | "md" | "hero", { w: number; h: number }> = {
  sm: { w: 28, h: 24 },
  md: { w: 34, h: 30 },
  hero: { w: 108, h: 92 },
};

export function PhoenixLogo({
  size = "hero",
  showAmbient = size === "hero",
  className = "",
}: PhoenixLogoProps) {
  const { w, h } = DIMENSIONS[size];
  const uid = `phx-${size}`;

  return (
    <div
      className={`relative inline-flex items-center justify-center ${
        size === "hero" ? "mx-auto" : ""
      } ${className}`}
    >
      {showAmbient && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute h-24 w-28 rounded-full opacity-60 blur-2xl"
          style={{
            background:
              "radial-gradient(circle, rgba(0, 240, 255, 0.5) 0%, rgba(2, 132, 199, 0.3) 50%, transparent 75%)",
          }}
        />
      )}

      <svg
        width={w}
        height={h}
        viewBox="0 0 120 104"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="Ferix AI geometric phoenix logo"
        className="relative z-10 overflow-visible"
      >
        <defs>
          <linearGradient
            id={`${uid}-wing-l`}
            x1="8"
            y1="14"
            x2="58"
            y2="78"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#00f0ff" />
            <stop offset="55%" stopColor="#0284c7" />
            <stop offset="100%" stopColor="#1d4ed8" />
          </linearGradient>

          <linearGradient
            id={`${uid}-wing-r`}
            x1="112"
            y1="14"
            x2="62"
            y2="78"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#00f0ff" />
            <stop offset="55%" stopColor="#0284c7" />
            <stop offset="100%" stopColor="#1d4ed8" />
          </linearGradient>

          <linearGradient
            id={`${uid}-core`}
            x1="60"
            y1="8"
            x2="60"
            y2="96"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#e0faff" />
            <stop offset="35%" stopColor="#00f0ff" />
            <stop offset="100%" stopColor="#2563eb" />
          </linearGradient>

          <linearGradient
            id={`${uid}-aura`}
            x1="60"
            y1="12"
            x2="60"
            y2="100"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#00f0ff" stopOpacity="0.95" />
            <stop offset="60%" stopColor="#1d4ed8" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0" />
          </linearGradient>

          <filter
            id={`${uid}-glow`}
            x="-30%"
            y="-30%"
            width="160%"
            height="160%"
          >
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Odd asymmetric glowing blue-cyan flame aura */}
        <g filter={`url(#${uid}-glow)`} opacity="0.78">
          <path
            d="M60 99L45 77L23 68L38 56L10 31L39 40L32 19L55 38L60 11L67 36L89 15L82 41L111 29L82 57L96 70L73 78L60 99Z"
            stroke={`url(#${uid}-aura)`}
            strokeWidth="1.5"
            fill={`url(#${uid}-aura)`}
            fillOpacity="0.16"
          />
          <polygon points="24,14 31,26 21,24" fill="#00f0ff" fillOpacity="0.85" />
          <polygon points="98,17 90,28 101,27" fill="#00f0ff" fillOpacity="0.75" />
          <polygon points="48,90 54,79 58,95" fill="#1d4ed8" fillOpacity="0.85" />
          <polygon points="73,88 66,78 63,94" fill="#00f0ff" fillOpacity="0.7" />
        </g>

        {/* Sharp geometric wings */}
        <g filter={`url(#${uid}-glow)`}>
          <polygon
            points="56,52 12,18 28,45 18,46 46,62"
            fill={`url(#${uid}-wing-l)`}
          />
          <polygon
            points="54,60 25,58 40,70 57,68"
            fill="#1d4ed8"
            fillOpacity="0.94"
          />
          <polygon
            points="64,52 108,18 92,45 102,46 74,62"
            fill={`url(#${uid}-wing-r)`}
          />
          <polygon
            points="66,60 95,58 80,70 63,68"
            fill="#1d4ed8"
            fillOpacity="0.94"
          />
        </g>

        {/* Geometric body, crest & tail */}
        <polygon
          points="60,22 52,40 57,68 60,92 63,68 68,40"
          fill={`url(#${uid}-core)`}
        />
        <polygon points="60,12 54,28 60,25 69,28 63,21" fill="#e0faff" />
        <polygon
          points="60,26 56,43 60,64 64,43"
          fill="#00f0ff"
          fillOpacity="0.7"
        />
      </svg>
    </div>
  );
}
