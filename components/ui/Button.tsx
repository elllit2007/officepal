import Link from "next/link";
import type { ButtonHTMLAttributes, ComponentProps, ReactNode } from "react";
import { cn } from "./cn";

export type ButtonVariant = "primary" | "secondary" | "destructive" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-full whitespace-nowrap select-none " +
  "transition-[background-color,border-color,color,box-shadow,transform] duration-fast ease-out " +
  "focus-visible:outline-none focus-visible:shadow-focus " +
  "disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]";

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "bg-primary-500 text-on-brand shadow-sm hover:bg-primary-600",
  secondary:
    "bg-surface text-ink border border-line-strong hover:border-neutral-400 hover:bg-neutral-50",
  destructive:
    "bg-danger-soft text-danger-ink border border-danger-line hover:bg-danger hover:border-danger hover:text-on-brand",
  ghost:
    "bg-transparent text-link hover:bg-surface-brand",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "h-9 px-3.5 text-body-sm font-semibold",
  md: "h-11 px-5 text-button",
  lg: "h-14 px-7 text-body-lg font-semibold",
};

/**
 * Bygger klasslistan för en knapp. Exporteras så att andra element
 * (t.ex. en <Link>) kan se ut som en knapp utan att duplicera stilar.
 */
export function buttonClasses({
  variant = "primary",
  size = "md",
  fullWidth = false,
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  className?: string;
}) {
  return cn(BASE, VARIANTS[variant], SIZES[size], fullWidth && "w-full", className);
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  /** Visar en spinner och inaktiverar knappen. */
  loading?: boolean;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
}

/**
 * Knapp. Varianter: primary (en per vy), secondary, destructive, ghost.
 * Piller-form, aldrig kantiga hörn.
 */
export function Button({
  variant = "primary",
  size = "md",
  fullWidth,
  loading = false,
  iconLeft,
  iconRight,
  className,
  children,
  disabled,
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClasses({ variant, size, fullWidth, className })}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? <Spinner /> : iconLeft}
      {children}
      {!loading && iconRight}
    </button>
  );
}

export interface ButtonLinkProps extends ComponentProps<typeof Link> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
}

/** En Next-länk som ser ut som en knapp. */
export function ButtonLink({
  variant = "primary",
  size = "md",
  fullWidth,
  iconLeft,
  iconRight,
  className,
  children,
  ...rest
}: ButtonLinkProps) {
  return (
    <Link
      className={buttonClasses({ variant, size, fullWidth, className })}
      {...rest}
    >
      {iconLeft}
      {children}
      {iconRight}
    </Link>
  );
}

function Spinner() {
  return (
    <span
      aria-hidden="true"
      className="inline-block size-4 animate-spin rounded-full border-2 border-current border-r-transparent opacity-70"
    />
  );
}
