import { useEffect, useState, type CSSProperties } from "react";

interface FlameIntroOverlayProps {
  onComplete: () => void;
}

interface FlameTongueConfig {
  id: number;
  points: string;
  fill: string;
  duration: string;
  delay: string;
  skewA: string;
  skewB: string;
}

// 12 overlapping SVG flame tongues along the bottom edge (0.6s-1.1s rapid flicker)
const FLAME_TONGUES: FlameTongueConfig[] = [
  {
    id: 1,
    points: "-40,520 55,140 165,520",
    fill: "url(#tonguePurple)",
    duration: "0.78s",
    delay: "-0.1s",
    skewA: "-5deg",
    skewB: "6deg",
  },
  {
    id: 2,
    points: "55,520 175,90 295,520",
    fill: "url(#tongueCobalt)",
    duration: "0.92s",
    delay: "-0.45s",
    skewA: "4deg",
    skewB: "-6deg",
  },
  {
    id: 3,
    points: "175,520 295,120 415,520",
    fill: "url(#tongueCyan)",
    duration: "0.66s",
    delay: "-0.22s",
    skewA: "-6deg",
    skewB: "5deg",
  },
  {
    id: 4,
    points: "295,520 420,65 550,520",
    fill: "url(#tonguePurple)",
    duration: "1.05s",
    delay: "-0.6s",
    skewA: "5deg",
    skewB: "-4deg",
  },
  {
    id: 5,
    points: "415,520 555,105 685,520",
    fill: "url(#tongueCyan)",
    duration: "0.72s",
    delay: "-0.3s",
    skewA: "-4deg",
    skewB: "7deg",
  },
  {
    id: 6,
    points: "550,520 710,40 865,520",
    fill: "url(#tongueCobalt)",
    duration: "0.88s",
    delay: "-0.15s",
    skewA: "6deg",
    skewB: "-5deg",
  },
  {
    id: 7,
    points: "665,520 770,95 895,520",
    fill: "url(#tongueCyan)",
    duration: "0.62s",
    delay: "-0.5s",
    skewA: "-5deg",
    skewB: "5deg",
  },
  {
    id: 8,
    points: "785,520 925,75 1060,520",
    fill: "url(#tonguePurple)",
    duration: "0.96s",
    delay: "-0.28s",
    skewA: "4deg",
    skewB: "-6deg",
  },
  {
    id: 9,
    points: "920,520 1055,115 1190,520",
    fill: "url(#tongueCyan)",
    duration: "0.69s",
    delay: "-0.72s",
    skewA: "-6deg",
    skewB: "4deg",
  },
  {
    id: 10,
    points: "1045,520 1180,80 1320,520",
    fill: "url(#tongueCobalt)",
    duration: "1.08s",
    delay: "-0.36s",
    skewA: "5deg",
    skewB: "-5deg",
  },
  {
    id: 11,
    points: "1175,520 1300,130 1425,520",
    fill: "url(#tonguePurple)",
    duration: "0.76s",
    delay: "-0.58s",
    skewA: "-4deg",
    skewB: "6deg",
  },
  {
    id: 12,
    points: "1285,520 1405,155 1510,520",
    fill: "url(#tongueCyan)",
    duration: "0.84s",
    delay: "-0.19s",
    skewA: "6deg",
    skewB: "-4deg",
  },
];

interface SparkConfig {
  left: string;
  size: number;
  duration: string;
  delay: string;
  drift: string;
  color: string;
}

// 25 glowing cyan-purple spark particles floating upward
const INTRO_SPARKS: SparkConfig[] = [
  { left: "4%", size: 4, duration: "2.1s", delay: "-0.3s", drift: "24px", color: "#00f0ff" },
  { left: "8%", size: 3, duration: "2.6s", delay: "-1.1s", drift: "-18px", color: "#a855f7" },
  { left: "12%", size: 5, duration: "1.9s", delay: "-0.6s", drift: "28px", color: "#00f0ff" },
  { left: "16%", size: 3.5, duration: "2.4s", delay: "-1.5s", drift: "-22px", color: "#2563eb" },
  { left: "20%", size: 4, duration: "2.2s", delay: "-0.2s", drift: "16px", color: "#a855f7" },
  { left: "24%", size: 3, duration: "2.7s", delay: "-0.9s", drift: "-26px", color: "#00f0ff" },
  { left: "28%", size: 4.5, duration: "2.0s", delay: "-1.7s", drift: "20px", color: "#00f0ff" },
  { left: "32%", size: 3, duration: "2.5s", delay: "-0.4s", drift: "-14px", color: "#a855f7" },
  { left: "36%", size: 5, duration: "1.8s", delay: "-1.2s", drift: "25px", color: "#00f0ff" },
  { left: "40%", size: 3.5, duration: "2.3s", delay: "-0.7s", drift: "-20px", color: "#a855f7" },
  { left: "44%", size: 4, duration: "2.1s", delay: "-1.6s", drift: "18px", color: "#00f0ff" },
  { left: "48%", size: 5, duration: "1.9s", delay: "-0.5s", drift: "-15px", color: "#2563eb" },
  { left: "52%", size: 4, duration: "2.2s", delay: "-1.3s", drift: "22px", color: "#00f0ff" },
  { left: "56%", size: 3.5, duration: "2.6s", delay: "-0.1s", drift: "-24px", color: "#a855f7" },
  { left: "60%", size: 4.5, duration: "2.0s", delay: "-1.0s", drift: "19px", color: "#00f0ff" },
  { left: "64%", size: 3, duration: "2.4s", delay: "-1.8s", drift: "-16px", color: "#a855f7" },
  { left: "68%", size: 5, duration: "1.85s", delay: "-0.45s", drift: "26px", color: "#00f0ff" },
  { left: "72%", size: 3.5, duration: "2.35s", delay: "-1.4s", drift: "-21px", color: "#2563eb" },
  { left: "76%", size: 4, duration: "2.15s", delay: "-0.8s", drift: "17px", color: "#a855f7" },
  { left: "80%", size: 3, duration: "2.55s", delay: "-1.9s", drift: "-25px", color: "#00f0ff" },
  { left: "84%", size: 4.5, duration: "1.95s", delay: "-0.35s", drift: "21px", color: "#00f0ff" },
  { left: "88%", size: 3.5, duration: "2.45s", delay: "-1.15s", drift: "-19px", color: "#a855f7" },
  { left: "91%", size: 4, duration: "2.05s", delay: "-0.65s", drift: "14px", color: "#00f0ff" },
  { left: "94%", size: 3, duration: "2.65s", delay: "-1.55s", drift: "-23px", color: "#a855f7" },
  { left: "97%", size: 4, duration: "2.25s", delay: "-0.95s", drift: "15px", color: "#00f0ff" },
];

export function FlameIntroOverlay({ onComplete }: FlameIntroOverlayProps) {
  const [fadingOut, setFadingOut] = useState(false);

  useEffect(() => {
    // 3.5-second total intro: visible for 3.0s, then fades out smoothly over 0.5s
    const fadeTimer = window.setTimeout(() => {
      setFadingOut(true);
    }, 3000);

    const doneTimer = window.setTimeout(() => {
      onComplete();
    }, 3500);

    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(doneTimer);
    };
  }, [onComplete]);

  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        background: "#03060c",
      }}
      className={`flex flex-col items-center justify-center overflow-hidden transition-opacity duration-500 ease-out ${
        fadingOut ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
    >
      {/* Atmospheric roaring blue-cyan & neon-purple radial background */}
      <div
        className="intro-fire-surge pointer-events-none absolute -inset-[10%]"
        style={{
          background:
            "radial-gradient(ellipse 95% 74% at 50% 84%, rgba(0, 240, 255, 0.45) 0%, rgba(37, 99, 235, 0.44) 38%, rgba(168, 85, 247, 0.34) 64%, rgba(3, 6, 12, 0.96) 94%)",
        }}
      />

      {/* 12 overlapping SVG flame tongues flickering rapidly along the bottom edge */}
      <svg
        className="pointer-events-none absolute bottom-0 left-0 h-[56vh] w-full overflow-visible"
        viewBox="0 0 1440 520"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          filter: "blur(6px) drop-shadow(0 0 20px #00f0ff)",
        }}
      >
        <defs>
          <linearGradient id="tongueCyan" x1="50%" y1="100%" x2="50%" y2="0%">
            <stop offset="0%" stopColor="#e0faff" stopOpacity="0.98" />
            <stop offset="32%" stopColor="#00f0ff" stopOpacity="0.92" />
            <stop offset="72%" stopColor="#2563eb" stopOpacity="0.48" />
            <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="tongueCobalt" x1="50%" y1="100%" x2="50%" y2="0%">
            <stop offset="0%" stopColor="#00f0ff" stopOpacity="0.92" />
            <stop offset="45%" stopColor="#2563eb" stopOpacity="0.86" />
            <stop offset="82%" stopColor="#a855f7" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="tonguePurple" x1="50%" y1="100%" x2="50%" y2="0%">
            <stop offset="0%" stopColor="#2563eb" stopOpacity="0.9" />
            <stop offset="48%" stopColor="#a855f7" stopOpacity="0.85" />
            <stop offset="86%" stopColor="#a855f7" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
          </linearGradient>
        </defs>

        {FLAME_TONGUES.map((t) => (
          <polygon
            key={t.id}
            points={t.points}
            fill={t.fill}
            className="intro-flame-tongue"
            style={
              {
                "--flicker-dur": t.duration,
                "--flicker-delay": t.delay,
                "--flame-skew-a": t.skewA,
                "--flame-skew-b": t.skewB,
              } as CSSProperties
            }
          />
        ))}
      </svg>

      {/* 25 glowing cyan-purple spark particles floating upward across the screen */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {INTRO_SPARKS.map((spark, idx) => (
          <span
            key={idx}
            className="intro-spark absolute block rounded-full"
            style={
              {
                left: spark.left,
                bottom: "-12px",
                width: `${spark.size}px`,
                height: `${spark.size}px`,
                backgroundColor: spark.color,
                boxShadow: `0 0 10px ${spark.color}, 0 0 18px ${spark.color}`,
                "--spark-dur": spark.duration,
                "--spark-delay": spark.delay,
                "--spark-drift": spark.drift,
              } as CSSProperties
            }
          />
        ))}
      </div>

      {/* Rising multi-faceted geometric Phoenix SVG + animated Ferix AI title */}
      <div className="relative z-10 flex flex-col items-center px-6 text-center">
        <div className="phoenix-rise">
          <div className="phoenix-wing-pulse">
            <svg
              width="290"
              height="248"
              viewBox="0 0 360 300"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              role="img"
              aria-label="Ferix AI rising geometric blue and purple phoenix"
              className="h-auto w-[230px] overflow-visible sm:w-[290px]"
            >
              <defs>
                <linearGradient id="phxWingOuterL" x1="12" y1="26" x2="174" y2="210" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#00f0ff" />
                  <stop offset="52%" stopColor="#2563eb" />
                  <stop offset="100%" stopColor="#a855f7" />
                </linearGradient>
                <linearGradient id="phxWingOuterR" x1="348" y1="26" x2="186" y2="210" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#00f0ff" />
                  <stop offset="52%" stopColor="#2563eb" />
                  <stop offset="100%" stopColor="#a855f7" />
                </linearGradient>
                <linearGradient id="phxWingInnerL" x1="48" y1="90" x2="176" y2="195" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#a855f7" />
                  <stop offset="55%" stopColor="#2563eb" />
                  <stop offset="100%" stopColor="#00f0ff" />
                </linearGradient>
                <linearGradient id="phxWingInnerR" x1="312" y1="90" x2="184" y2="195" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#a855f7" />
                  <stop offset="55%" stopColor="#2563eb" />
                  <stop offset="100%" stopColor="#00f0ff" />
                </linearGradient>
                <linearGradient id="phxBodyCore" x1="180" y1="20" x2="180" y2="286" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#e0faff" />
                  <stop offset="28%" stopColor="#00f0ff" />
                  <stop offset="68%" stopColor="#2563eb" />
                  <stop offset="100%" stopColor="#a855f7" />
                </linearGradient>
                <linearGradient id="phxCrest" x1="180" y1="12" x2="180" y2="90" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="45%" stopColor="#00f0ff" />
                  <stop offset="100%" stopColor="#a855f7" />
                </linearGradient>
              </defs>

              {/* Outer Energy Aura Shards */}
              <polygon points="180,10 156,74 180,54 204,74" fill="#a855f7" fillOpacity="0.4" />

              {/* Left Animated Geometric Wing */}
              <g className="phoenix-wing-l">
                <polygon points="28,36 74,78 46,84" fill="#00f0ff" fillOpacity="0.75" />
                <polygon points="12,102 68,128 36,144" fill="#a855f7" fillOpacity="0.7" />
                <polygon points="170,136 16,28 84,92 50,96 146,158" fill="url(#phxWingOuterL)" />
                <polygon points="164,146 32,76 92,126 58,136 150,168" fill="#00f0ff" fillOpacity="0.84" />
                <polygon points="166,156 58,134 106,162 76,174 158,182" fill="url(#phxWingInnerL)" />
                <polygon points="168,172 94,178 128,198 166,192" fill="#2563eb" />
                <polygon points="172,186 124,204 148,220 174,204" fill="#a855f7" />
                <polygon points="168,134 22,32 76,82" fill="#e0faff" fillOpacity="0.7" />
              </g>

              {/* Right Animated Geometric Wing */}
              <g className="phoenix-wing-r">
                <polygon points="332,36 286,78 314,84" fill="#00f0ff" fillOpacity="0.75" />
                <polygon points="348,102 292,128 324,144" fill="#a855f7" fillOpacity="0.7" />
                <polygon points="190,136 344,28 276,92 310,96 214,158" fill="url(#phxWingOuterR)" />
                <polygon points="196,146 328,76 268,126 302,136 210,168" fill="#00f0ff" fillOpacity="0.84" />
                <polygon points="194,156 302,134 254,162 284,174 202,182" fill="url(#phxWingInnerR)" />
                <polygon points="192,172 266,178 232,198 194,192" fill="#2563eb" />
                <polygon points="188,186 236,204 212,220 186,204" fill="#a855f7" />
                <polygon points="192,134 338,32 284,82" fill="#e0faff" fillOpacity="0.7" />
              </g>

              {/* Central Faceted Phoenix Torso & Armor Core */}
              <polygon points="180,68 156,120 168,198 180,226 192,198 204,120" fill="url(#phxBodyCore)" />
              <polygon points="180,82 166,122 180,178 194,122" fill="#e0faff" fillOpacity="0.9" />
              <polygon points="180,114 170,134 180,164 190,134" fill="#00f0ff" />

              {/* Sharp Geometric Crest & Head */}
              <polygon points="180,18 164,54 174,48 180,76 186,48 196,54" fill="url(#phxCrest)" />
              <polygon points="180,44 166,68 180,84 198,66 188,58" fill="#00f0ff" />
              <polygon points="180,48 174,62 180,70 188,61" fill="#ffffff" />

              {/* Multi-pronged Geometric Tail Plumes */}
              <polygon points="174,202 146,266 168,242 180,290 192,242 214,266 186,202" fill="url(#phxBodyCore)" />
              <polygon points="164,210 130,256 154,244" fill="#a855f7" />
              <polygon points="196,210 230,256 206,244" fill="#a855f7" />
              <polygon points="180,220 172,256 180,282 188,256" fill="#00f0ff" />
            </svg>
          </div>
        </div>

        {/* Animated 'Ferix AI' title with neon letter-spacing expansion & light-sweep shimmer */}
        <h1 className="ferix-intro-title mt-4 font-[family-name:var(--font-display)] text-5xl font-extrabold sm:text-6xl">
          Ferix AI
        </h1>
        <p className="mt-2.5 text-xs font-semibold tracking-[0.28em] text-[#00f0ff]">
          NEXT-GEN INTELLIGENCE ENGINE
        </p>
      </div>
    </div>
  );
}
