import { cn } from "@/lib/utils";

interface SeagullProps {
  size?: number;
  color?: string;
  className?: string;
}

export function Seagull({ size = 24, color = "currentColor", className }: SeagullProps) {
  return (
    <svg
      width={size}
      height={size * 0.6}
      viewBox="0 0 40 24"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M2 18 C 8 14, 12 4, 20 12 C 28 4, 32 14, 38 18"
        stroke={color}
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

interface WordmarkProps {
  size?: number;
  className?: string;
}

export function GalleboWordmark({ size = 19, className }: WordmarkProps) {
  return (
    <span
      className={cn("inline-flex items-center gap-2.5 text-current", className)}
    >
      <Seagull size={size + 6} />
      <span
        style={{
          fontFamily: "var(--font-display)",
          fontWeight: 600,
          fontSize: size + 4,
          letterSpacing: "-0.02em",
          lineHeight: 1,
        }}
      >
        Gallebo
      </span>
    </span>
  );
}
