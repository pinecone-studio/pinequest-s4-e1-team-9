interface GeminiLogoProps {
  size?: number;
}

export default function GeminiLogo({ size = 28 }: GeminiLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Gemini"
      style={{ filter: 'drop-shadow(0 0 8px #00e5cc)' }}
    >
      <path
        d="M14 2C14 2 15.5 9.5 20 14C15.5 18.5 14 26 14 26C14 26 12.5 18.5 8 14C12.5 9.5 14 2 14 2Z"
        fill="url(#gemini-grad)"
      />
      <defs>
        <linearGradient
          id="gemini-grad"
          x1="8"
          y1="2"
          x2="20"
          y2="26"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#00e5cc" />
          <stop offset="33%" stopColor="#00e5cc" />
          <stop offset="66%" stopColor="#00e5cc" />
          <stop offset="100%" stopColor="#00e5cc" />
        </linearGradient>
      </defs>
    </svg>
  );
}
