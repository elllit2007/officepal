import type { FieldReport } from "@/lib/types";
import { Card, EmptyState, IconMic, StatusBadge } from "@/components/ui";
import { formatDateTime } from "../lib/format";

export default function FieldReportList({ fieldReports }: { fieldReports: FieldReport[] }) {
  if (fieldReports.length === 0) {
    return (
      <EmptyState
        icon={<IconMic />}
        title="Inga fältrapporter ännu"
        description="Personalen rapporterar på /faltrapport med sin kod. Rapporterna listas här."
      />
    );
  }

  return (
    <Card padding="none" as="section">
      <ul className="divide-y divide-line">
        {fieldReports.map((report) => (
          <li
            key={report.id}
            className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-5"
          >
            <p className="min-w-0 max-w-xl flex-1 truncate text-body text-fg">{report.raw_text}</p>
            <div className="flex items-center gap-3">
              <span className="text-caption text-muted tabular-nums">
                {formatDateTime(report.created_at)}
              </span>
              <StatusBadge status={report.status} />
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
