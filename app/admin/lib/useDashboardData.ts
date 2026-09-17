"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "./supabaseClient";
import type { Approval, FieldReport, InvoiceDraft, Quote } from "@/lib/types";

export interface DashboardData {
  invoiceDrafts: InvoiceDraft[];
  quotes: Quote[];
  fieldReports: FieldReport[];
}

const EMPTY: DashboardData = { invoiceDrafts: [], quotes: [], fieldReports: [] };

/**
 * approvals är insert-only: varje beslut (och den initiala "awaiting") skapar
 * en NY rad snarare än att uppdatera en befintlig. "Väntar på godkännande"
 * betyder alltså: den SENASTE raden per (target_type, target_id) har
 * action = "awaiting".
 */
function pendingTargetIds(approvals: Approval[], targetType: string): string[] {
  const latestByTarget = new Map<string, Approval>();
  for (const approval of approvals) {
    if (approval.target_type !== targetType) continue;
    const existing = latestByTarget.get(approval.target_id);
    if (!existing || approval.decided_at > existing.decided_at) {
      latestByTarget.set(approval.target_id, approval);
    }
  }
  return [...latestByTarget.values()]
    .filter((a) => a.action === "awaiting")
    .map((a) => a.target_id);
}

async function fetchDashboardData(): Promise<{ data: DashboardData; error: string | null }> {
  if (!isSupabaseConfigured) {
    return {
      data: EMPTY,
      error: "Supabase är inte konfigurerat (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY saknas).",
    };
  }

  const [approvalsRes, reportRes] = await Promise.all([
    supabase.from("approvals").select("*").order("decided_at", { ascending: false }).limit(500),
    supabase.from("field_reports").select("*").order("created_at", { ascending: false }).limit(10),
  ]);

  const firstError = approvalsRes.error ?? reportRes.error;
  if (firstError) {
    return { data: EMPTY, error: firstError.message };
  }

  const approvals = approvalsRes.data ?? [];
  const pendingInvoiceIds = pendingTargetIds(approvals, "invoice_draft");
  const pendingQuoteIds = pendingTargetIds(approvals, "quote");

  const [invoiceRes, quoteRes] = await Promise.all([
    pendingInvoiceIds.length > 0
      ? supabase.from("invoice_drafts").select("*").in("id", pendingInvoiceIds)
      : Promise.resolve({ data: [] as InvoiceDraft[], error: null }),
    pendingQuoteIds.length > 0
      ? supabase.from("quotes").select("*").in("id", pendingQuoteIds)
      : Promise.resolve({ data: [] as Quote[], error: null }),
  ]);

  const secondError = invoiceRes.error ?? quoteRes.error;
  if (secondError) {
    return { data: EMPTY, error: secondError.message };
  }

  return {
    data: {
      invoiceDrafts: [...(invoiceRes.data ?? [])].sort((a, b) =>
        a.created_at.localeCompare(b.created_at),
      ),
      quotes: [...(quoteRes.data ?? [])].sort((a, b) => a.created_at.localeCompare(b.created_at)),
      fieldReports: reportRes.data ?? [],
    },
    error: null,
  };
}

export function useDashboardData() {
  const [data, setData] = useState<DashboardData>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [loadedToken, setLoadedToken] = useState(-1);

  useEffect(() => {
    let cancelled = false;
    fetchDashboardData().then((result) => {
      if (cancelled) return;
      setData(result.data);
      setError(result.error);
      setLoadedToken(reloadToken);
    });
    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  const refresh = useCallback(() => {
    setReloadToken((token) => token + 1);
  }, []);

  // `loading` = första hämtningen (inget att visa ännu → skelett).
  // `refreshing` = en ny hämtning pågår efter refresh(), men befintlig data
  // finns kvar och ska fortsätta visas — annars blinkar listorna till tomt
  // efter varje godkännande.
  const loading = loadedToken === -1;
  const refreshing = !loading && loadedToken !== reloadToken;

  return { ...data, loading, refreshing, error, refresh };
}
