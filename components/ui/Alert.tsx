import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "./cn";
import { IconAlert, IconCircleCheck, IconInfo } from "./icons";

export type AlertTone = "info" | "success" | "warning" | "danger";

const TONES: Record<AlertTone, string> = {
  info: "bg-info-soft border-info-line text-info-ink",
  success: "bg-success-soft border-success-line text-success-ink",
  warning: "bg-warning-soft border-warning-line text-warning-ink",
  danger: "bg-danger-soft border-danger-line text-danger-ink",
};

const ICONS: Record<AlertTone, ReactNode> = {
  info: <IconInfo />,
  success: <IconCircleCheck />,
  warning: <IconAlert />,
  danger: <IconAlert />,
};

export interface AlertProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  tone?: AlertTone;
  title?: ReactNode;
  /** Dölj ikonen (t.ex. för mycket korta meddelanden). */
  plain?: boolean;
}

/**
 * Inline-meddelande. Fel/varningar får role="alert" automatiskt så att
 * skärmläsare läser upp dem.
 */
export function Alert({
  tone = "info",
  title,
  plain = false,
  className,
  children,
  role,
  ...rest
}: AlertProps) {
  return (
    <div
      role={role ?? (tone === "danger" || tone === "warning" ? "alert" : "status")}
      className={cn(
        "flex gap-3 rounded-lg border px-4 py-3 text-body-sm",
        TONES[tone],
        className,
      )}
      {...rest}
    >
      {!plain && <span className="mt-0.5 shrink-0">{ICONS[tone]}</span>}
      <div className="min-w-0">
        {title && <p className="font-semibold">{title}</p>}
        <div className={title ? "mt-0.5" : undefined}>{children}</div>
      </div>
    </div>
  );
}
