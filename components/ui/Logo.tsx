import { cn } from "./cn";

/**
 * OfficePal-märket: en förenklad Kollegan-front (rundad kvadrat, ansikts-
 * ruta, två ögon, leende). Samma former som figuren så att märket och
 * figuren känns som samma sak.
 */
export function LogoMark({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      aria-hidden="true"
      focusable="false"
      className={cn("shrink-0", className)}
    >
      <rect width="64" height="64" rx="18" fill="var(--color-primary-500)" />
      <rect x="14" y="19" width="36" height="26" rx="11" fill="var(--color-primary-100)" />
      <rect x="23" y="27" width="5.5" height="8" rx="2.75" fill="var(--color-primary-900)" />
      <rect x="35.5" y="27" width="5.5" height="8" rx="2.75" fill="var(--color-primary-900)" />
      <path
        d="M27 38.5c2.6 2.2 7.4 2.2 10 0"
        fill="none"
        stroke="var(--color-primary-900)"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Märke + ordmärke. `compact` visar bara märket. */
export function Logo({
  compact = false,
  size = 32,
  className,
}: {
  compact?: boolean;
  size?: number;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark size={size} />
      {!compact && (
        <span className="text-h4 font-bold tracking-[-0.01em] text-ink">OfficePal</span>
      )}
    </span>
  );
}
