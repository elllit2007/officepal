"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "./supabaseClient";
import type { FieldReport, InvoiceDraft, Quote } from "@/lib/types";

export interface DashboardData {
  invoiceDrafts: InvoiceDraft[];
  quotes: Quote[];
  fieldReports: FieldReport[];
}

const EMPTY: DashboardData = { invoiceDrafts: [], quotes: [], fieldReports: [] };

export function useDashboardData() {
  const [data, setData] = useState<DashboardData>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setError(
        "Supabase är inte konfigurerat (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY saknas).",
      );
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const [invoiceRes, quoteRes, reportRes] = await Promise.all([
      supabase
        .from("invoice_drafts")
        .select("*")
        .eq("status", "awaiting_approval")
        .order("created_at", { ascending: true }),
      supabase
        .from("quotes")
        .select("*")
        .eq("status", "draft")
        .order("created_at", { ascending: true }),
      supabase
        .from("field_reports")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10),
    ]);

    const firstError = invoiceRes.error ?? quoteRes.error ?? reportRes.error;
    if (firstError) {
      setError(firstError.message);
      setLoading(false);
      return;
    }

    setData({
      invoiceDrafts: invoiceRes.data ?? [],
      quotes: quoteRes.data ?? [],
      fieldReports: reportRes.data ?? [],
    });
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { ...data, loading, error, refresh };
}
