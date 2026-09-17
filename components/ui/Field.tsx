import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { cn } from "./cn";
import { IconChevronDown } from "./icons";

export type FieldSize = "md" | "lg";

const CONTROL_BASE =
  "w-full bg-surface text-ink border border-line placeholder:text-neutral-400 " +
  "transition-[border-color,box-shadow,background-color] duration-fast ease-out " +
  "hover:border-line-strong focus:border-primary-500 focus:shadow-focus focus:outline-none " +
  "disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-muted " +
  "aria-[invalid=true]:border-danger aria-[invalid=true]:focus:shadow-[0_0_0_4px_rgba(210,74,74,0.2)]";

const CONTROL_SIZES: Record<FieldSize, string> = {
  md: "h-11 rounded-md px-3.5 text-body",
  /** För fältpersonal på mobil: stora träffytor, större text. */
  lg: "h-14 rounded-lg px-4 text-body-lg",
};

const TEXTAREA_SIZES: Record<FieldSize, string> = {
  md: "rounded-md px-3.5 py-2.5 text-body min-h-28",
  lg: "rounded-lg px-4 py-3.5 text-body-lg min-h-40",
};

/* ---------------------------------------------------------------------- */

export interface FieldProps {
  label: ReactNode;
  htmlFor: string;
  hint?: ReactNode;
  error?: ReactNode;
  /** Extra element till höger om etiketten, t.ex. "Glömt lösenordet?". */
  trailing?: ReactNode;
  size?: FieldSize;
  className?: string;
  children: ReactNode;
}

/**
 * Etikett + kontroll + hjälptext/fel. Kontrollen (Input/Textarea/Select)
 * skickas som barn med samma `id` som `htmlFor`.
 */
export function Field({
  label,
  htmlFor,
  hint,
  error,
  trailing,
  size = "md",
  className,
  children,
}: FieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <label
          htmlFor={htmlFor}
          className={cn("text-ink", size === "lg" ? "text-body font-medium" : "text-label")}
        >
          {label}
        </label>
        {trailing}
      </div>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} role="alert" className="text-body-sm text-danger-ink">
          {error}
        </p>
      ) : hint ? (
        <p id={`${htmlFor}-hint`} className="text-body-sm text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/* ---------------------------------------------------------------------- */

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  size?: FieldSize;
  invalid?: boolean;
  /** Använd monospace (accesskoder, belopp). */
  mono?: boolean;
}

export function Input({ size = "md", invalid, mono, className, ...rest }: InputProps) {
  return (
    <input
      aria-invalid={invalid || undefined}
      className={cn(
        CONTROL_BASE,
        CONTROL_SIZES[size],
        mono && "font-mono tracking-wider",
        className,
      )}
      {...rest}
    />
  );
}

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  size?: FieldSize;
  invalid?: boolean;
}

export function Textarea({ size = "md", invalid, className, ...rest }: TextareaProps) {
  return (
    <textarea
      aria-invalid={invalid || undefined}
      className={cn(CONTROL_BASE, TEXTAREA_SIZES[size], "resize-y leading-relaxed", className)}
      {...rest}
    />
  );
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "size"> {
  size?: FieldSize;
  invalid?: boolean;
}

export function Select({ size = "md", invalid, className, children, ...rest }: SelectProps) {
  return (
    <div className="relative">
      <select
        aria-invalid={invalid || undefined}
        className={cn(CONTROL_BASE, CONTROL_SIZES[size], "appearance-none pr-10", className)}
        {...rest}
      >
        {children}
      </select>
      <IconChevronDown
        className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-muted"
      />
    </div>
  );
}

/** En kort kod (accesskod) som är lätt att läsa av och skriva av. */
export function CodeChip({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <code
      className={cn(
        "inline-flex items-center rounded-md border border-line bg-surface-muted px-2.5 py-1 font-mono text-body font-medium tracking-[0.18em] text-ink",
        className,
      )}
    >
      {children}
    </code>
  );
}
