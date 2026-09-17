import type { FieldReport } from "@/lib/types";
import StatusBadge from "./StatusBadge";
import { formatDateTime } from "../lib/format";

export default function FieldReportList({ fieldReports }: { fieldReports: FieldReport[] }) {
  if (fieldReports.length === 0) {
    return <p className="text-sm text-neutral-500">Inga fältrapporter ännu.</p>;
  }

  return (
    <ul className="flex flex-col gap-3">
      {fieldReports.map((report) => (
        <li
          key={report.id}
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-blue-100 bg-white p-4"
        >
          <p className="max-w-md truncate text-sm text-neutral-700">{report.raw_text}</p>
          <div className="flex items-center gap-3">
            <span className="text-xs text-neutral-500">{formatDateTime(report.created_at)}</span>
            <StatusBadge status={report.status} />
          </div>
        </li>
      ))}
    </ul>
  );
}
