interface FerixMarkProps {
  size?: number;
  className?: string;
}

export function FerixMark({ size = 24, className = "" }: FerixMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <rect
        x="2"
        y="2"
        width="24"
        height="24"
        rx="6"
        fill="#111827"
        stroke="rgba(96, 165, 250, 0.35)"
        strokeWidth="1.25"
      />
      <path
        d="M9.5 19V9H18.5"
        stroke="#F3F4F6"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.5 14H16"
        stroke="#60A5FA"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="19" cy="19" r="1.5" fill="#60A5FA" />
    </svg>
  );
}
