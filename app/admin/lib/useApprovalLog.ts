"use client";

import { useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "./supabaseClient";
import { pendingTargetIds } from "./useDashboardData";
import type { Approval } from "@/lib/types";

/**
 * Read-only vy över approvals-tabellen (insert-only audit-trail, se
 * BUILD-CONTRACT.md). Varje rad berikas med kundnamn/belopp från målraden
 * så att loggen går att läsa utan att slå upp uuid:n.
 */
export interface ApprovalLogEntry extends Approval {
  target_label: string | null;
  target_amount: number | null;
}

export interface ApprovalLogSummary {
  total: number;
  approved: number;
  rejected: number;
  pendingNow: number;
}

const LIMIT = 200;

const EMPTY_SUMMARY: ApprovalLogSummary = { total: 0, approved: 0, rejected: 0, pendingNow: 0 };

async function fetchApprovalLog(): Promise<{
  entries: ApprovalLogEntry[];
  summary: ApprovalLogSummary;
  error: string | null;
}> {
  if (!isSupabaseConfigured) {
    return {
      entries: [],
      summary: EMPTY_SUMMARY,
      error:
        "Supabase är inte konfigurerat (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY saknas).",
    };
  }

  const approvalsRes = await supabase
    .from("approvals")
    .select("*")
    .order("decided_at", { ascending: false })
    .limit(LIMIT);

  if (approvalsRes.error) {
    return { entries: [], summary: EMPTY_SUMMARY, error: approvalsRes.error.message };
  }

  const approvals = approvalsRes.data ?? [];
  const invoiceIds = [
    ...new Set(approvals.filter((a) => a.target_type === "invoice_draft").map((a) => a.target_id)),
  ];
  const quoteIds = [
    ...new Set(approvals.filter((a) => a.target_type === "quote").map((a) => a.target_id)),
  ];

  const [invoiceRes, quoteRes] = await Promise.all([
    invoiceIds.length > 0
      ? supabase.from("invoice_drafts").select("id, customer_name, amount").in("id", invoiceIds)
      : Promise.resolve({ data: [], error: null }),
    quoteIds.length > 0
      ? supabase.from("quotes").select("id, customer_name").in("id", quoteIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  // Målraden kan saknas (t.ex. raderad) och uppslaget kan misslyckas utan
  // att det ska fälla hela loggen: raden visas då bara utan kundnamn.
  const labels = new Map<string, { label: string; amount: number | null }>();
  for (const row of invoiceRes.data ?? []) {
    labels.set(row.id, { label: row.customer_name, amount: row.amount });
  }
  for (const row of quoteRes.data ?? []) {
    labels.set(row.id, { label: row.customer_name, amount: null });
  }

  const entries: ApprovalLogEntry[] = approvals.map((a) => ({
    ...a,
    target_label: labels.get(a.target_id)?.label ?? null,
    target_amount: labels.get(a.target_id)?.amount ?? null,
  }));

  const summary: ApprovalLogSummary = {
    total: approvals.length,
    approved: approvals.filter((a) => a.action === "approved").length,
    rejected: approvals.filter((a) => a.action === "rejected").length,
    pendingNow:
      pendingTargetIds(approvals, "invoice_draft").length +
      pendingTargetIds(approvals, "quote").length,
  };

  return { entries, summary, error: null };
}

export function useApprovalLog() {
  const [entries, setEntries] = useState<ApprovalLogEntry[]>([]);
  const [summary, setSummary] = useState<ApprovalLogSummary>(EMPTY_SUMMARY);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchApprovalLog().then((result) => {
      if (cancelled) return;
      setEntries(result.entries);
      setSummary(result.summary);
      setError(result.error);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return { entries, summary, error, loading, limit: LIMIT };
}
