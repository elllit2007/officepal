import type { HTMLAttributes } from "react";
import { cn } from "./cn";

export type BadgeTone =
  | "neutral"
  | "brand"
  | "info"
  | "success"
  | "warning"
  | "danger";

const TONES: Record<BadgeTone, string> = {
  neutral: "bg-surface-muted text-neutral-600 border-line",
  brand: "bg-primary-500 text-on-brand border-primary-500",
  info: "bg-info-soft text-info-ink border-info-line",
  success: "bg-success-soft text-success-ink border-success-line",
  warning: "bg-warning-soft text-warning-ink border-warning-line",
  danger: "bg-danger-soft text-danger-ink border-danger-line",
};

const DOTS: Record<BadgeTone, string> = {
  neutral: "bg-neutral-400",
  brand: "bg-on-brand",
  info: "bg-info",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  /** Liten statusprick före texten. */
  dot?: boolean;
  size?: "sm" | "md";
}

/** Statusmärke/etikett. Piller, alltid med kantlinje i samma ton. */
export function Badge({
  tone = "neutral",
  dot = false,
  size = "md",
  className,
  children,
  ...rest
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-medium whitespace-nowrap",
        size === "sm" ? "px-2 py-0.5 text-caption" : "px-2.5 py-1 text-caption",
        TONES[tone],
        className,
      )}
      {...rest}
    >
      {dot && (
        <span aria-hidden="true" className={cn("size-1.5 rounded-full", DOTS[tone])} />
      )}
      {children}
    </span>
  );
}
