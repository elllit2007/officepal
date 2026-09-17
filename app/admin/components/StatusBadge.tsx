const LABELS: Record<string, string> = {
  awaiting_approval: "Väntar på godkännande",
  approved: "Godkänd",
  rejected: "Avvisad",
  sent: "Skickad",
  draft: "Utkast",
  followed_up: "Uppföljd",
  accepted: "Accepterad",
  expired: "Utgången",
  pending: "Obehandlad",
  processed: "Bearbetad",
  error: "Fel",
};

const STYLES: Record<string, string> = {
  awaiting_approval: "bg-amber-100 text-amber-800 border-amber-200",
  pending: "bg-amber-100 text-amber-800 border-amber-200",
  draft: "bg-amber-100 text-amber-800 border-amber-200",
  approved: "bg-emerald-100 text-emerald-800 border-emerald-200",
  accepted: "bg-emerald-100 text-emerald-800 border-emerald-200",
  processed: "bg-emerald-100 text-emerald-800 border-emerald-200",
  sent: "bg-blue-100 text-[#1E3A8A] border-blue-200",
  followed_up: "bg-blue-100 text-[#1E3A8A] border-blue-200",
  rejected: "bg-red-100 text-red-800 border-red-200",
  error: "bg-red-100 text-red-800 border-red-200",
  expired: "bg-neutral-100 text-neutral-600 border-neutral-200",
};

export default function StatusBadge({ status }: { status: string }) {
  const style = STYLES[status] ?? "bg-neutral-100 text-neutral-600 border-neutral-200";
  const label = LABELS[status] ?? status;

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${style}`}
    >
      {label}
    </span>
  );
}
