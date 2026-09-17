"use client";

import { useCallback, useMemo, useState } from "react";
import Kollegan from "@/components/Kollegan";
import type { KollegState } from "@/components/Kollegan";
import type { InvoiceDraft, Quote } from "@/lib/types";
import { useDashboardData } from "./lib/useDashboardData";
import { formatSEK } from "./lib/format";
import InvoiceDraftList from "./components/InvoiceDraftList";
import QuoteList from "./components/QuoteList";
import FieldReportList from "./components/FieldReportList";

const DONE_ANIMATION_MS = 1800;

type PendingKind = "invoice_draft" | "quote";

interface PendingItem {
  kind: PendingKind;
  id: string;
  tenant_id: string;
  created_at: string;
  customer_name: string;
  amount?: number;
}

function toPendingItems(invoiceDrafts: InvoiceDraft[], quotes: Quote[]): PendingItem[] {
  return [
    ...invoiceDrafts.map((draft) => ({
      kind: "invoice_draft" as const,
      id: draft.id,
      tenant_id: draft.tenant_id,
      created_at: draft.created_at,
      customer_name: draft.customer_name,
      amount: draft.amount,
    })),
    ...quotes.map((quote) => ({
      kind: "quote" as const,
      id: quote.id,
      tenant_id: quote.tenant_id,
      created_at: quote.created_at,
      customer_name: quote.customer_name,
    })),
  ].sort((a, b) => a.created_at.localeCompare(b.created_at));
}

function describePendingItem(item: PendingItem): string {
  return item.kind === "invoice_draft"
    ? `Fakturautkast till ${item.customer_name} (${formatSEK(item.amount ?? 0)})`
    : `Offert till ${item.customer_name}`;
}

function buildAskingMessage(pending: PendingItem[]): string | undefined {
  if (pending.length === 0) return undefined;
  const [first] = pending;
  if (pending.length === 1) {
    return `${describePendingItem(first)} väntar på ditt godkännande.`;
  }
  return `${pending.length} ärenden väntar på godkännande. Först ut: ${describePendingItem(first)}.`;
}

export default function AdminDashboardPage() {
  const { invoiceDrafts, quotes, fieldReports, loading, error, refresh } = useDashboardData();
  const [transientDone, setTransientDone] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const pendingItems = useMemo(
    () => toPendingItems(invoiceDrafts, quotes),
    [invoiceDrafts, quotes],
  );

  const kollegState: KollegState = transientDone
    ? "done"
    : pendingItems.length > 0
      ? "asking"
      : "idle";

  const runAction = useCallback(
    async (
      target: { kind: PendingKind; id: string; tenant_id: string },
      action: "approve" | "reject" | "edit",
      patch?: { customer_name: string; amount: number } | { customer_name: string; content: string },
    ) => {
      setBusyId(target.id);
      setActionError(null);
      try {
        const res = await fetch("/api/approvals", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            targetType: target.kind,
            targetId: target.id,
            tenantId: target.tenant_id,
            action,
            patch,
          }),
        });
        const resBody = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(resBody.error ?? "Något gick fel.");
        }
        if (resBody.warning) {
          setActionError(resBody.warning);
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
    if (pendingItems[0]) runAction(pendingItems[0], "approve");
  }, [pendingItems, runAction]);

  const handleBubbleReject = useCallback(() => {
    if (pendingItems[0]) runAction(pendingItems[0], "reject");
  }, [pendingItems, runAction]);

  const handleBubbleEdit = useCallback(() => {
    const first = pendingItems[0];
    if (!first) return;
    setHighlightedId(first.id);
    const domId = first.kind === "invoice_draft" ? `invoice-draft-${first.id}` : `quote-${first.id}`;
    document.getElementById(domId)?.scrollIntoView({ behavior: "smooth", block: "center" });
    setTimeout(() => setHighlightedId(null), 2000);
  }, [pendingItems]);

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
            message={buildAskingMessage(pendingItems)}
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
                onApprove={(draft) =>
                  runAction({ kind: "invoice_draft", id: draft.id, tenant_id: draft.tenant_id }, "approve")
                }
                onReject={(draft) =>
                  runAction({ kind: "invoice_draft", id: draft.id, tenant_id: draft.tenant_id }, "reject")
                }
                onEdit={(draft, patch) =>
                  runAction(
                    { kind: "invoice_draft", id: draft.id, tenant_id: draft.tenant_id },
                    "edit",
                    patch,
                  )
                }
              />
            </section>

            <section className="flex flex-col gap-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-[#1E3A8A]">
                Offerter som väntar på godkännande
              </h2>
              <QuoteList
                quotes={quotes}
                highlightedId={highlightedId}
                busyId={busyId}
                onApprove={(quote) =>
                  runAction({ kind: "quote", id: quote.id, tenant_id: quote.tenant_id }, "approve")
                }
                onReject={(quote) =>
                  runAction({ kind: "quote", id: quote.id, tenant_id: quote.tenant_id }, "reject")
                }
                onEdit={(quote, patch) =>
                  runAction({ kind: "quote", id: quote.id, tenant_id: quote.tenant_id }, "edit", patch)
                }
              />
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
