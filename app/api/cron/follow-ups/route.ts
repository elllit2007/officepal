import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database, Quote } from "@/lib/types";
import { sendEmail } from "@/lib/email/send";
import { quoteFollowUpTemplate } from "@/lib/email/templates";

// Track 6 (Email & follow-ups) — se BUILD-CONTRACT.md
//
// Körs av Vercel Cron (se vercel.json). Hittar offerter med status "sent"
// vars follow_up_at har passerat, skickar en påminnelse och sätter status
// till "followed_up". Service-role-nyckeln kringgår RLS (se
// supabase/SETUP.md, avsnitt 3) — denna route är den enda betrodda
// skrivvägen för detta jobb, precis som orchestratorns skrivningar.

export const dynamic = "force-dynamic";
export const maxDuration = 60;

interface FollowUpResult {
  quoteId: string;
  status: "sent" | "skipped" | "failed";
  reason?: string;
}

// lib/types.ts:s Database-typ saknar `Relationships` per tabell, vilket
// @supabase/supabase-js (>=2.x) kräver för att kunna typa t.ex. .update()
// korrekt (annars faller den tillbaka på `never`). Lokal typ-augmentering
// här istället för att röra Track 1:s fil — påverkar inget vid körning.
type WithRelationships<Tables> = {
  [TableName in keyof Tables]: Tables[TableName] extends {
    Row: infer Row;
    Insert: infer Insert;
    Update: infer Update;
  }
    ? { Row: Row; Insert: Insert; Update: Update; Relationships: [] }
    : never;
};

type CronDatabase = {
  public: {
    Tables: WithRelationships<Database["public"]["Tables"]>;
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
};

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL eller SUPABASE_SERVICE_ROLE_KEY saknas."
    );
  }

  return createClient<CronDatabase>(url, serviceRoleKey, {
    auth: { persistSession: false },
  });
}

function isAuthorized(request: Request): boolean {
  const cronSecret = process.env.CRON_SECRET;

  // Om inget CRON_SECRET är satt kan vi inte verifiera avsändaren — tillåt
  // det ändå så att lokal utveckling/tidig deploy fungerar, men detta bör
  // alltid sättas i produktion (se README/vercel.json-instruktioner).
  if (!cronSecret) {
    return true;
  }

  const authHeader = request.headers.get("authorization");
  return authHeader === `Bearer ${cronSecret}`;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const nowIso = new Date().toISOString();

  const { data: quotes, error: queryError } = await supabase
    .from("quotes")
    .select("*, tenants(name)")
    .eq("status", "sent")
    .lte("follow_up_at", nowIso);

  if (queryError) {
    return NextResponse.json(
      { error: `Kunde inte hämta offerter: ${queryError.message}` },
      { status: 500 }
    );
  }

  const results: FollowUpResult[] = [];

  for (const quote of quotes ?? []) {
    const result = await processQuote(supabase, quote);
    results.push(result);
  }

  const summary = {
    checked: results.length,
    sent: results.filter((r) => r.status === "sent").length,
    skipped: results.filter((r) => r.status === "skipped").length,
    failed: results.filter((r) => r.status === "failed").length,
    results,
  };

  return NextResponse.json(summary);
}

type SupabaseAdmin = ReturnType<typeof getSupabaseAdmin>;
type QuoteWithTenant = Quote & { tenants: { name: string } | null };

async function processQuote(
  supabase: SupabaseAdmin,
  quote: QuoteWithTenant
): Promise<FollowUpResult> {
  if (!quote.customer_email) {
    return {
      quoteId: quote.id,
      status: "skipped",
      reason: "Offerten saknar customer_email.",
    };
  }

  const tenantName = quote.tenants?.name ?? "OfficePal";

  const content = quoteFollowUpTemplate({
    quote: { customer_name: quote.customer_name, content: quote.content },
    tenantName,
  });

  const sendResult = await sendEmail({ to: quote.customer_email, content });

  if (!sendResult.success) {
    return {
      quoteId: quote.id,
      status: "failed",
      reason: sendResult.error,
    };
  }

  const { error: updateError } = await supabase
    .from("quotes")
    .update({ status: "followed_up" })
    .eq("id", quote.id);

  if (updateError) {
    return {
      quoteId: quote.id,
      status: "failed",
      reason: `E-post skickad men status kunde inte uppdateras: ${updateError.message}`,
    };
  }

  return { quoteId: quote.id, status: "sent" };
}
