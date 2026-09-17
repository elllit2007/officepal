import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "./cn";

type CardTone = "default" | "muted" | "brand" | "ink";
type CardPadding = "none" | "sm" | "md" | "lg";

const TONES: Record<CardTone, string> = {
  default: "bg-surface border border-line shadow-sm",
  muted: "bg-surface-muted border border-line",
  brand: "bg-surface-brand border border-line-brand",
  ink: "bg-surface-ink text-on-brand border border-primary-800",
};

const PADDINGS: Record<CardPadding, string> = {
  none: "",
  sm: "p-4",
  md: "p-5 sm:p-6",
  lg: "p-6 sm:p-8",
};

export interface CardProps extends HTMLAttributes<HTMLElement> {
  tone?: CardTone;
  padding?: CardPadding;
  /** Liten "öra"-etikett ovanför kortet (4Schools-stil), t.ex. kundnamn. */
  tag?: ReactNode;
  /** Lyfter kortet (ring i primärfärg) — används när Kollegan pekar på det. */
  highlighted?: boolean;
  as?: "div" | "section" | "article" | "li";
}

/**
 * Kort/panel. Generös radie, mjuk skugga, 1px kantlinje. Grundytan för
 * allt innehåll som ligger ovanpå canvas.
 */
export function Card({
  tone = "default",
  padding = "md",
  tag,
  highlighted = false,
  as: Tag = "div",
  className,
  children,
  ...rest
}: CardProps) {
  // Polymorf tagg: attributen är HTMLElement-generiska, så vi castar till
  // ett enkelt element-typ för JSX.
  const Element = Tag as unknown as "div";
  const card = (
    <Element
      className={cn(
        "rounded-xl transition-[box-shadow,border-color] duration-base ease-out",
        TONES[tone],
        PADDINGS[padding],
        highlighted && "border-primary-400 shadow-focus",
        !tag && className,
      )}
      {...(tag ? {} : (rest as HTMLAttributes<HTMLDivElement>))}
    >
      {children}
    </Element>
  );

  if (!tag) return card;

  return (
    <div className={cn("flex flex-col", className)} {...(rest as HTMLAttributes<HTMLDivElement>)}>
      <span className="ml-4 inline-flex w-fit items-center gap-1.5 rounded-t-md border border-b-0 border-line bg-surface-muted px-3 py-1 text-caption font-medium text-muted">
        {tag}
      </span>
      {card}
    </div>
  );
}

export function CardHeader({
  className,
  ...rest
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("mb-4 flex flex-wrap items-start justify-between gap-3", className)}
      {...rest}
    />
  );
}

export function CardTitle({
  className,
  as: Tag = "h2",
  ...rest
}: HTMLAttributes<HTMLHeadingElement> & { as?: "h1" | "h2" | "h3" | "h4" }) {
  return <Tag className={cn("text-h3", className)} {...rest} />;
}

export function CardDescription({
  className,
  ...rest
}: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("mt-1 text-body-sm text-muted", className)} {...rest} />;
}

export function CardFooter({
  className,
  ...rest
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "mt-5 flex flex-wrap items-center gap-3 border-t border-line pt-4",
        className,
      )}
      {...rest}
    />
  );
}

/** Rubrik för en sektion av kort/listor: liten, tydlig, med valfri åtgärd. */
export function SectionHeading({
  title,
  description,
  action,
  id,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  id?: string;
  className?: string;
}) {
  return (
    <div
      id={id}
      className={cn("flex flex-wrap items-end justify-between gap-3 scroll-mt-24", className)}
    >
      <div>
        <h2 className="text-h4">{title}</h2>
        {description && <p className="mt-0.5 text-body-sm text-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}
