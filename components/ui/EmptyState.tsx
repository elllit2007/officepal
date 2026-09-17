import type { ReactNode } from "react";
import { cn } from "./cn";

/**
 * Tomt tillstånd. Lugnt, inte ledsamt — "Inget väntar" är goda nyheter
 * för Nina.
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-line-strong px-6 py-10 text-center",
        className,
      )}
    >
      {icon && (
        <span className="mb-1 flex size-11 items-center justify-center rounded-full bg-surface-muted text-muted">
          {icon}
        </span>
      )}
      <p className="text-h4">{title}</p>
      {description && <p className="max-w-sm text-body-sm text-muted">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
