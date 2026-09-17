"use client";

import Link from "next/link";
import type { ApprovalAction } from "@/lib/types";
import { useApprovalLog, type ApprovalLogEntry } from "../lib/useApprovalLog";
import { formatDateTime, formatSEK } from "../lib/format";
import EmptyState from "../components/EmptyState";
import ListSkeleton from "../components/ListSkeleton";

const ACTION_LABELS: Record<ApprovalAction, string> = {
  awaiting: "Skapad, väntar på beslut",
  approved: "Godkänd",
  rejected: "Avvisad",
};

const ACTION_STYLES: Record<ApprovalAction, string> = {
  awaiting: "bg-amber-100 text-amber-800 border-amber-200",
  approved: "bg-emerald-100 text-emerald-800 border-emerald-200",
  rejected: "bg-red-100 text-red-800 border-red-200",
};

const TARGET_LABELS: Record<string, string> = {
  invoice_draft: "Fakturautkast",
  quote: "Offert",
};

function describeTarget(entry: ApprovalLogEntry): string {
  const type = TARGET_LABELS[entry.target_type] ?? entry.target_type;
  if (!entry.target_label) return type;
  const amount = entry.target_amount !== null ? ` (${formatSEK(entry.target_amount)})` : "";
  return `${type} · ${entry.target_label}${amount}`;
}

// approvals.decided_by är null både när Kollegan själv skapar "awaiting"-
// raden och (tills /api/approvals sätter auth.uid(), se TODO där) när en
// admin beslutar. Skiljer dem åt på action istället.
function describeActor(entry: ApprovalLogEntry): string {
  if (entry.decided_by) return `Admin ${entry.decided_by.slice(0, 8)}`;
  return entry.action === "awaiting" ? "Kollegan (automatiskt)" : "Admin";
}

function SummaryTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-blue-100 bg-white px-4 py-3">
      <span className="text-xs uppercase tracking-wide text-neutral-500">{label}</span>
      <span className="text-2xl font-semibold text-[#1E3A8A]">{value}</span>
    </div>
  );
}

export default function ApprovalLogPage() {
  const { entries, summary, error, loading, limit } = useApprovalLog();

  return (
    <main className="min-h-full bg-[#F5F8FF]">
      <div className="mx-auto flex max-w-4xl flex-col gap-8 px-6 py-10">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold text-[#1E3A8A]">Beslutslogg</h1>
            <p className="text-sm text-neutral-500">
              Varje skapat utkast och varje beslut loggas här. Loggen kan inte ändras eller
              raderas i efterhand.
            </p>
          </div>
          <Link
            href="/admin"
            className="rounded-full border border-blue-200 bg-white px-4 py-1.5 text-sm font-medium text-[#1E3A8A] hover:bg-blue-50"
          >
            Till adminpanelen
          </Link>
        </header>

        {error && (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <section aria-busy={loading} className="flex flex-col gap-6">
          <p role="status" aria-live="polite" className="sr-only">
            {loading ? "Laddar…" : ""}
          </p>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <SummaryTile label="Väntar nu" value={summary.pendingNow} />
            <SummaryTile label="Godkända" value={summary.approved} />
            <SummaryTile label="Avvisade" value={summary.rejected} />
            <SummaryTile label="Händelser" value={summary.total} />
          </div>

          {loading ? (
            <ListSkeleton rows={5} />
          ) : entries.length === 0 ? (
            <EmptyState
              title="Inga händelser loggade ännu."
              hint="När Kollegan skapar ett fakturautkast eller en offert, och när du godkänner eller avvisar, dyker det upp här."
            />
          ) : (
            <div className="overflow-x-auto rounded-xl border border-blue-100 bg-white">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead className="border-b border-blue-100 text-xs uppercase tracking-wide text-neutral-500">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-medium">
                      Tidpunkt
                    </th>
                    <th scope="col" className="px-4 py-3 font-medium">
                      Händelse
                    </th>
                    <th scope="col" className="px-4 py-3 font-medium">
                      Ärende
                    </th>
                    <th scope="col" className="px-4 py-3 font-medium">
                      Av
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => (
                    <tr key={entry.id} className="border-b border-blue-50 last:border-b-0">
                      <td className="whitespace-nowrap px-4 py-3 text-neutral-600">
                        {formatDateTime(entry.decided_at)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${ACTION_STYLES[entry.action]}`}
                        >
                          {ACTION_LABELS[entry.action]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[#1E3A8A]">{describeTarget(entry)}</td>
                      <td className="px-4 py-3 text-neutral-600">{describeActor(entry)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!loading && entries.length >= limit && (
            <p className="text-xs text-neutral-500">Visar de {limit} senaste händelserna.</p>
          )}
        </section>
      </div>
    </main>
  );
}
