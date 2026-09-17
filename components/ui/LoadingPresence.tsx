import Kollegan from "@/components/Kollegan";
import { cn } from "./cn";

/**
 * Ambient laddningsläge: en liten Kollegan som lyssnar + en lugn rad text.
 *
 * Använd när något hämtas som användaren väntar på (dashboarddata, en
 * kontosida). Inte i knappar eller små ytor — där räcker Button `loading`.
 *
 * Fast höjd så att innehållet inte hoppar när datan kommer, och
 * aria-live så att skärmläsare får beskedet en gång.
 */
export function LoadingPresence({
  label = "Hämtar det senaste …",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn("flex min-h-20 items-center gap-4 text-body-sm text-muted", className)}
    >
      <Kollegan state="listening" size="small" />
      <span>{label}</span>
    </div>
  );
}
