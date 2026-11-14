import type { CSSProperties } from "react";

interface EmberConfig {
  left: string;
  size: number;
  duration: string;
  delay: string;
  drift: string;
}

// 20 pure CSS rising cyan ember dots
const CYAN_EMBERS: EmberConfig[] = [
  { left: "4%", size: 3.5, duration: "9.5s", delay: "-1.1s", drift: "16px" },
  { left: "9%", size: 2.5, duration: "11.8s", delay: "-5.2s", drift: "-14px" },
  { left: "14%", size: 4, duration: "10.2s", delay: "-2.7s", drift: "20px" },
  { left: "19%", size: 3, duration: "13.0s", delay: "-8.4s", drift: "-18px" },
  { left: "24%", size: 4.5, duration: "11.0s", delay: "-3.9s", drift: "12px" },
  { left: "29%", size: 2.5, duration: "14.2s", delay: "-6.6s", drift: "-15px" },
  { left: "34%", size: 3.5, duration: "10.6s", delay: "-0.9s", drift: "17px" },
  { left: "39%", size: 3, duration: "12.5s", delay: "-9.1s", drift: "-13px" },
  { left: "44%", size: 4, duration: "9.8s", delay: "-4.3s", drift: "15px" },
  { left: "49%", size: 3, duration: "13.4s", delay: "-7.5s", drift: "-19px" },
  { left: "54%", size: 4.5, duration: "10.4s", delay: "-2.1s", drift: "14px" },
  { left: "59%", size: 2.5, duration: "12.9s", delay: "-10.3s", drift: "-12px" },
  { left: "64%", size: 3.5, duration: "11.4s", delay: "-5.8s", drift: "18px" },
  { left: "69%", size: 3, duration: "13.8s", delay: "-1.6s", drift: "-16px" },
  { left: "74%", size: 4, duration: "10.0s", delay: "-6.2s", drift: "13px" },
  { left: "79%", size: 2.5, duration: "12.2s", delay: "-3.4s", drift: "-17px" },
  { left: "84%", size: 4, duration: "11.2s", delay: "-8.9s", drift: "15px" },
  { left: "89%", size: 3, duration: "13.1s", delay: "-4.7s", drift: "-14px" },
  { left: "93%", size: 3.5, duration: "9.9s", delay: "-7.2s", drift: "11px" },
  { left: "97%", size: 2.5, duration: "12.6s", delay: "-2.9s", drift: "-12px" },
];

interface BlueFlameBackdropProps {
  variant?: "welcome" | "chat";
}

export function BlueFlameBackdrop({
  variant = "welcome",
}: BlueFlameBackdropProps) {
  const isChat = variant === "chat";

  return (
    <div
      aria-hidden="true"
      style={{ zIndex: 1 }}
      className="pointer-events-none fixed inset-0 overflow-hidden"
    >
      {/* Inline SVG turbulence/blur filter for organic bottom blue-cyan flame silhouette */}
      <svg
        className="pointer-events-none absolute -bottom-8 left-0 h-[44vh] w-full opacity-75"
        viewBox="0 0 1440 420"
        preserveAspectRatio="none"
      >
        <defs>
          <filter
            id={`ferix-flame-turbulence-${variant}`}
            x="-10%"
            y="-20%"
            width="120%"
            height="140%"
          >
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.012 0.032"
              numOctaves="3"
              seed="11"
              result="noise"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale="46"
              xChannelSelector="R"
              yChannelSelector="G"
              result="displaced"
            />
            <feGaussianBlur in="displaced" stdDeviation="14" />
          </filter>
          <linearGradient
            id={`ferix-flame-grad-${variant}`}
            x1="0%"
            y1="100%"
            x2="0%"
            y2="0%"
          >
            <stop offset="0%" stopColor="#00f0ff" stopOpacity="0.62" />
            <stop offset="42%" stopColor="#0284c7" stopOpacity="0.45" />
            <stop offset="78%" stopColor="#1d4ed8" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          className="flame-lick-4"
          filter={`url(#ferix-flame-turbulence-${variant})`}
          fill={`url(#ferix-flame-grad-${variant})`}
          d="M0,420 L0,250 C140,180 240,280 380,200 C520,120 620,255 760,175 C900,95 1030,245 1170,185 C1290,135 1370,210 1440,170 L1440,420 Z"
        />
      </svg>

      {/* 4 overlapping, animated CSS blue-flame waves (filter: blur(28px)) licking upward from bottom edge */}
      <div
        className="flame-lick-1 absolute -bottom-16 -left-[8%] w-[56vw] min-w-[340px] rounded-[50%]"
        style={{
          height: isChat ? "36vh" : "44vh",
          filter: "blur(28px)",
          background:
            "radial-gradient(ellipse at 45% 82%, rgba(0, 240, 255, 0.56) 0%, rgba(2, 132, 199, 0.44) 40%, rgba(29, 78, 216, 0.28) 72%, transparent 92%)",
        }}
      />

      <div
        className="flame-lick-2 absolute -right-[8%] -bottom-16 w-[56vw] min-w-[340px] rounded-[50%]"
        style={{
          height: isChat ? "38vh" : "46vh",
          filter: "blur(28px)",
          background:
            "radial-gradient(ellipse at 55% 82%, rgba(0, 240, 255, 0.52) 0%, rgba(2, 132, 199, 0.42) 42%, rgba(29, 78, 216, 0.28) 72%, transparent 92%)",
        }}
      />

      <div
        className="flame-lick-3 absolute -bottom-20 left-1/2 w-[78vw] min-w-[360px] rounded-[50%]"
        style={{
          height: isChat ? "32vh" : "40vh",
          filter: "blur(28px)",
          background:
            "radial-gradient(ellipse at 50% 88%, rgba(0, 240, 255, 0.58) 0%, rgba(2, 132, 199, 0.38) 46%, rgba(29, 78, 216, 0.24) 75%, transparent 94%)",
        }}
      />

      <div
        className="flame-lick-4 absolute -bottom-12 left-[18%] w-[64vw] min-w-[320px] rounded-[50%]"
        style={{
          height: isChat ? "28vh" : "34vh",
          filter: "blur(28px)",
          background:
            "radial-gradient(ellipse at 50% 85%, rgba(0, 240, 255, 0.44) 0%, rgba(2, 132, 199, 0.34) 44%, rgba(29, 78, 216, 0.22) 74%, transparent 92%)",
        }}
      />

      {/* Subtle center contrast vignette only in chat mode so center reading pane stays razor-sharp */}
      {isChat && (
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 62% 58% at 50% 42%, rgba(3, 6, 12, 0.88) 0%, rgba(3, 6, 12, 0.52) 60%, transparent 100%)",
          }}
        />
      )}

      {/* 20 pure CSS @keyframes rising cyan ember dots */}
      {CYAN_EMBERS.map((ember, idx) => {
        const style = {
          left: ember.left,
          bottom: "-10px",
          width: `${ember.size}px`,
          height: `${ember.size}px`,
          backgroundColor: "#00f0ff",
          boxShadow: "0 0 8px #00f0ff",
          borderRadius: "9999px",
          "--ember-duration": ember.duration,
          "--ember-delay": ember.delay,
          "--ember-drift": ember.drift,
        } as CSSProperties;

        return (
          <span
            key={idx}
            className="ember-particle absolute block"
            style={style}
          />
        );
      })}
    </div>
  );
}
