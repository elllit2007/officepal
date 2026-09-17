import type { ReactNode } from "react";
import { cn } from "./cn";

/**
 * Nyckeltal: stort tal, liten etikett (Divident-profilens statistikrad).
 * Läggs i en rad av StatRow. Talet är tabulärt så att rader linjerar.
 */
export function StatTile({
  value,
  label,
  tone = "default",
  className,
}: {
  value: ReactNode;
  label: ReactNode;
  tone?: "default" | "warning" | "success";
  className?: string;
}) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-0.5", className)}>
      <span
        className={cn(
          "text-h2 tabular-nums",
          tone === "warning" && "text-warning-ink",
          tone === "success" && "text-success-ink",
        )}
      >
        {value}
      </span>
      <span className="text-body-sm text-muted">{label}</span>
    </div>
  );
}

export function StatRow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-4 sm:grid-cols-3 [&>*+*]:sm:border-l [&>*+*]:sm:border-line [&>*+*]:sm:pl-6",
        className,
      )}
    >
      {children}
    </div>
  );
}
