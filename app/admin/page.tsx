"use client";

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Kollegan from "@/components/Kollegan";
import type { KollegState } from "@/components/Kollegan";
import type { InvoiceDraft, Quote } from "@/lib/types";
import {
  Alert,
  AppShell,
  Badge,
  Card,
  LoadingPresence,
  PageContainer,
  PageHeader,
  SectionHeading,
  StatRow,
  StatTile,
} from "@/components/ui";
import LogoutButton from "@/app/auth/components/LogoutButton";
import { ADMIN_NAV } from "./nav";
import { useDashboardData } from "./lib/useDashboardData";
import { formatSEK } from "./lib/format";
import InvoiceDraftList from "./components/InvoiceDraftList";
import QuoteList from "./components/QuoteList";
import FieldReportList from "./components/FieldReportList";

const DONE_ANIMATION_MS = 1800;

/** Så länge "Nytt ärende"-pulsen syns när något nytt dyker upp. */
const FRESH_PULSE_MS = 2600;

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

/**
 * "Torsdag 17 september" + hälsning efter tid på dygnet. Servern renderar
 * ett neutralt läge (null) och klienten fyller i — så bråkar server och
 * klient inte om tidszon, utan att sätta state i en effekt.
 */
type Today = { date: string; greeting: string };
let todayCache: (Today & { key: string }) | null = null;

function getTodaySnapshot(): Today {
  const now = new Date();
  const hour = now.getHours();
  const bucket = hour < 10 ? "morning" : hour < 17 ? "afternoon" : "evening";
  const key = `${now.toDateString()}:${bucket}`;
  if (!todayCache || todayCache.key !== key) {
    const raw = new Intl.DateTimeFormat("sv-SE", {
      weekday: "long",
      day: "numeric",
      month: "long",
    }).format(now);
    const greeting =
      bucket === "morning" ? "God morgon." : bucket === "afternoon" ? "God eftermiddag." : "God kväll.";
    todayCache = { key, date: raw.charAt(0).toUpperCase() + raw.slice(1), greeting };
  }
  return todayCache;
}

const noopSubscribe = () => () => {};

function useTodayGreeting(): Today | null {
  return useSyncExternalStore(noopSubscribe, getTodaySnapshot, () => null);
}

export default function AdminDashboardPage() {
  const { invoiceDrafts, quotes, fieldReports, loading, error, refresh } = useDashboardData();
  const [transientDone, setTransientDone] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const today = useTodayGreeting();

  const pendingItems = useMemo(
    () => toPendingItems(invoiceDrafts, quotes),
    [invoiceDrafts, quotes],
  );

  // Ambient närvaro: Kollegan lyssnar medan data hämtas, frågar när något
  // väntar, bekräftar kort efter ett beslut, annars lugn.
  const kollegState: KollegState = transientDone
    ? "done"
    : loading
      ? "listening"
      : pendingItems.length > 0
        ? "asking"
        : "idle";

  // "Nytt ärende"-puls när ett ärende dyker upp som inte fanns i förra
  // hämtningen (inte vid första laddningen — då är allt nytt).
  const pendingKey = pendingItems.map((item) => item.id).join(",");
  const [seenKey, setSeenKey] = useState<string | null>(null);
  const [fresh, setFresh] = useState(false);
  if (!loading && seenKey !== pendingKey) {
    const seenIds = seenKey === null ? null : new Set(seenKey.split(",").filter(Boolean));
    const hasNew = seenIds !== null && pendingItems.some((item) => !seenIds.has(item.id));
    setSeenKey(pendingKey);
    if (hasNew) setFresh(true);
  }
  useEffect(() => {
    if (!fresh) return;
    const timer = setTimeout(() => setFresh(false), FRESH_PULSE_MS);
    return () => clearTimeout(timer);
  }, [fresh]);

  const hasAnyData =
    invoiceDrafts.length > 0 || quotes.length > 0 || fieldReports.length > 0;
  const initialLoading = loading && !hasAnyData;

  const runAction = useCallback(
    async (
      target: { kind: PendingKind; id: string; tenant_id: string },
      action: "approve" | "reject" | "edit",
      patch?: { customer_name: string; amount: number },
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

  const pendingCount = pendingItems.length;
  const statusLine = loading
    ? "Hämtar det senaste …"
    : pendingCount === 0
      ? "Lugnt just nu. Inget väntar på dig."
      : pendingCount === 1
        ? "Ett ärende väntar på dig."
        : `${pendingCount} ärenden väntar på dig.`;

  return (
    <AppShell items={ADMIN_NAV} footer={<LogoutButton />}>
      <main className="flex-1">
        <PageContainer className="flex flex-col gap-8">
          <PageHeader
            eyebrow={<span className="inline-block min-h-5">{today?.date ?? " "}</span>}
            title={today?.greeting ?? "Hej."}
            description={statusLine}
          />

          {/* Kollegan — mitt i vyn, med pratbubblan när något väntar.
              Fast min-höjd så att listorna under inte hoppar när bubblan
              kommer eller går. */}
          <Card padding="lg" className="flex min-h-[22rem] flex-col items-center justify-start gap-2">
            <motion.div
              className="flex flex-col items-center"
              animate={{ scale: fresh ? [1, 1.05, 1] : 1 }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
            >
              <Kollegan
                state={kollegState}
                size="large"
                message={buildAskingMessage(pendingItems)}
                onApprove={handleBubbleApprove}
                onEdit={handleBubbleEdit}
                onReject={handleBubbleReject}
              />
            </motion.div>
            <AnimatePresence>
              {fresh && (
                <motion.div
                  key="fresh"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.2 }}
                  className="mt-2"
                >
                  <Badge tone="warning" dot>
                    Nytt ärende
                  </Badge>
                </motion.div>
              )}
            </AnimatePresence>
            {kollegState === "idle" && (
              <p className="text-body-sm text-muted">Jag säger till när något behöver dig.</p>
            )}
            {kollegState === "listening" && (
              <p className="text-body-sm text-muted" role="status" aria-live="polite">
                Hämtar det senaste …
              </p>
            )}
          </Card>

          <Card>
            <StatRow>
              <StatTile
                value={invoiceDrafts.length}
                label="Fakturautkast som väntar"
                tone={invoiceDrafts.length > 0 ? "warning" : "default"}
              />
              <StatTile
                value={quotes.length}
                label="Offerter som väntar"
                tone={quotes.length > 0 ? "warning" : "default"}
              />
              <StatTile value={fieldReports.length} label="Senaste fältrapporter" />
            </StatRow>
          </Card>

          {error && <Alert tone="danger" title="Kunde inte hämta data">{error}</Alert>}
          {actionError && <Alert tone="danger">{actionError}</Alert>}

          {initialLoading ? (
            <LoadingPresence label="Hämtar fakturautkast, offerter och rapporter …" />
          ) : (
            <div
              aria-busy={loading || undefined}
              className={`flex flex-col gap-10 transition-opacity duration-base ${
                loading ? "opacity-60" : "opacity-100"
              }`}
            >
              <section className="flex flex-col gap-4">
                <SectionHeading
                  id="fakturautkast"
                  title="Fakturautkast som väntar"
                  description="Godkänn, justera kund och belopp, eller avvisa."
                  action={
                    invoiceDrafts.length > 0 && (
                      <Badge tone="warning" dot>
                        {invoiceDrafts.length} väntar
                      </Badge>
                    )
                  }
                />
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

              <section className="flex flex-col gap-4">
                <SectionHeading
                  id="offerter"
                  title="Offerter som väntar"
                  description="Inget skickas till kund förrän du sagt ja."
                  action={
                    quotes.length > 0 && (
                      <Badge tone="warning" dot>
                        {quotes.length} väntar
                      </Badge>
                    )
                  }
                />
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
                />
              </section>

              <section className="flex flex-col gap-4">
                <SectionHeading
                  id="faltrapporter"
                  title="Senaste fältrapporter"
                  description="Det personalen rapporterat in, nyast först."
                />
                <FieldReportList fieldReports={fieldReports} />
              </section>
            </div>
          )}
        </PageContainer>
      </main>
    </AppShell>
  );
}
