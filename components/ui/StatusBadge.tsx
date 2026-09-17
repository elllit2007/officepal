import { Badge, type BadgeTone } from "./Badge";

/**
 * Statusmärke som förstår OfficePals statuskoder (lib/types.ts).
 * Lägg till nya statusar här — inte i sidorna.
 */
const STATUS: Record<string, { label: string; tone: BadgeTone }> = {
  // invoice_drafts
  awaiting_approval: { label: "Väntar på godkännande", tone: "warning" },
  approved: { label: "Godkänd", tone: "success" },
  rejected: { label: "Avvisad", tone: "danger" },
  sent: { label: "Skickad", tone: "info" },
  // quotes
  draft: { label: "Utkast", tone: "warning" },
  followed_up: { label: "Uppföljd", tone: "info" },
  accepted: { label: "Accepterad", tone: "success" },
  expired: { label: "Utgången", tone: "neutral" },
  // field_reports
  pending: { label: "Obehandlad", tone: "warning" },
  processed: { label: "Bearbetad", tone: "success" },
  error: { label: "Fel", tone: "danger" },
  // approvals
  awaiting: { label: "Väntar", tone: "warning" },
};

export function statusLabel(status: string): string {
  return STATUS[status]?.label ?? status;
}

export function StatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  const entry = STATUS[status] ?? { label: status, tone: "neutral" as const };
  return (
    <Badge tone={entry.tone} dot className={className}>
      {entry.label}
    </Badge>
  );
}

export default StatusBadge;
