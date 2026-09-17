"use client";

import { useCallback, useState } from "react";
import Kollegan from "@/components/Kollegan";
import type { KollegState } from "@/components/Kollegan";
import type { InvoiceDraft } from "@/lib/types";
import { useDashboardData } from "./lib/useDashboardData";
import { formatSEK } from "./lib/format";
import InvoiceDraftList from "./components/InvoiceDraftList";
import QuoteList from "./components/QuoteList";
import FieldReportList from "./components/FieldReportList";

const DONE_ANIMATION_MS = 1800;

function buildAskingMessage(pending: InvoiceDraft[]): string | undefined {
  if (pending.length === 0) return undefined;
  const [first] = pending;
  if (pending.length === 1) {
    return `Fakturautkast till ${first.customer_name} (${formatSEK(first.amount)}) väntar på ditt godkännande.`;
  }
  return `${pending.length} fakturor väntar på godkännande. Först ut: ${first.customer_name} (${formatSEK(first.amount)}).`;
}

export default function AdminDashboardPage() {
  const { invoiceDrafts, quotes, fieldReports, loading, error, refresh } = useDashboardData();
  const [transientDone, setTransientDone] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const kollegState: KollegState = transientDone
    ? "done"
    : invoiceDrafts.length > 0
      ? "asking"
      : "idle";

  const runAction = useCallback(
    async (draft: InvoiceDraft, action: "approve" | "reject" | "edit", patch?: { customer_name: string; amount: number }) => {
      setBusyId(draft.id);
      setActionError(null);
      try {
        const res = await fetch("/api/approvals", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            targetType: "invoice_draft",
            targetId: draft.id,
            tenantId: draft.tenant_id,
            action,
            patch,
          }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? "Något gick fel.");
        }

        refresh();

        if (action !== "edit") {
          setTransientDone(true);
          setTimeout(() => setTransientDone(false), DONE_ANIMATION_MS);
        }
      } catch (err) {
        setActionError(err instanceof Error ? err.message : "Något gick fel.");
      } finally {
        setBusyId(null);
      }
    },
    [refresh],
  );

  const handleBubbleApprove = useCallback(() => {
    if (invoiceDrafts[0]) runAction(invoiceDrafts[0], "approve");
  }, [invoiceDrafts, runAction]);

  const handleBubbleReject = useCallback(() => {
    if (invoiceDrafts[0]) runAction(invoiceDrafts[0], "reject");
  }, [invoiceDrafts, runAction]);

  const handleBubbleEdit = useCallback(() => {
    if (!invoiceDrafts[0]) return;
    setHighlightedId(invoiceDrafts[0].id);
    document
      .getElementById(`invoice-draft-${invoiceDrafts[0].id}`)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
    setTimeout(() => setHighlightedId(null), 2000);
  }, [invoiceDrafts]);

  return (
    <main className="min-h-full bg-[#F5F8FF]">
      <div className="mx-auto flex max-w-4xl flex-col gap-10 px-6 py-10">
        <header className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold text-[#1E3A8A]">Adminpanel</h1>
          <p className="text-sm text-neutral-500">
            Översikt över det som väntar på ditt godkännande.
          </p>
        </header>

        <section className="flex flex-col items-center gap-4 rounded-2xl border border-blue-100 bg-white py-10">
          <Kollegan
            state={kollegState}
            size="large"
            message={buildAskingMessage(invoiceDrafts)}
            onApprove={handleBubbleApprove}
            onEdit={handleBubbleEdit}
            onReject={handleBubbleReject}
          />
        </section>

        {error && (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}
        {actionError && (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {actionError}
          </p>
        )}

        {loading ? (
          <p className="text-sm text-neutral-500">Laddar…</p>
        ) : (
          <div className="flex flex-col gap-8">
            <section className="flex flex-col gap-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-[#1E3A8A]">
                Fakturautkast som väntar
              </h2>
              <InvoiceDraftList
                invoiceDrafts={invoiceDrafts}
                highlightedId={highlightedId}
                busyId={busyId}
                onApprove={(draft) => runAction(draft, "approve")}
                onReject={(draft) => runAction(draft, "reject")}
                onEdit={(draft, patch) => runAction(draft, "edit", patch)}
              />
            </section>

            <section className="flex flex-col gap-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-[#1E3A8A]">
                Offerter som väntar på godkännande
              </h2>
              <QuoteList quotes={quotes} />
            </section>

            <section className="flex flex-col gap-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-[#1E3A8A]">
                Senaste fältrapporter
              </h2>
              <FieldReportList fieldReports={fieldReports} />
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
