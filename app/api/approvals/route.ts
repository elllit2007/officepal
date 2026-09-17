import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { SupabaseDatabase } from "@/app/admin/lib/supabaseDatabase";
import { createClient as createServerAuthClient } from "@/app/auth/lib/supabase/server";
import { submitApproval, OrchestratorRequestError } from "@/lib/orchestrator-client";
import { sendEmail } from "@/lib/email/send";
import { quoteSentTemplate } from "@/lib/email/templates";

// Antal dagar innan en skickad offert får en uppföljning (se
// app/api/cron/follow-ups/route.ts). BUILD-CONTRACT.md nämner ingen exakt
// siffra — 7 dagar är en QA-satt rimlig pilot-default, inte en Track
// 2/6-bestämd kontraktssiffra. Flaggat i QA-FINDINGS.md för Elliot att
// justera vid behov.
const FOLLOW_UP_AFTER_DAYS = 7;

// "approve"/"reject" går via orkestratorns POST /approve (lib/orchestrator-
// client) — den uppdaterar target-radens status OCH skriver audit-raden i
// approvals, se BUILD-CONTRACT.md. "edit" har ingen motsvarighet i
// orkestratorns kontrakt (bara approved/rejected) och patchar därför
// fortfarande invoice_drafts/quotes direkt här, utan audit-rad. Se
// QA-FINDINGS.md för varför en audit-rad för edits kräver ett beslut från
// Track 1/2 (schema/orkestrator) snarare än en QA-gissning.

type TargetType = "invoice_draft" | "quote";

interface ApprovalRequestBody {
  targetType: TargetType;
  targetId: string;
  tenantId: string;
  action: "approve" | "reject" | "edit";
  patch?: { customer_name?: string; amount?: number; content?: string };
}

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) return null;
  return createClient<SupabaseDatabase>(url, serviceRoleKey);
}

export async function POST(request: Request) {
  let body: Partial<ApprovalRequestBody>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ogiltig JSON." }, { status: 400 });
  }

  const { targetType, targetId, tenantId, action, patch } = body;

  if (
    (targetType !== "invoice_draft" && targetType !== "quote") ||
    !targetId ||
    !tenantId ||
    !action
  ) {
    return NextResponse.json({ error: "Ogiltig förfrågan." }, { status: 400 });
  }

  if (action === "edit") {
    const supabase = getServiceClient();
    if (!supabase) {
      return NextResponse.json(
        { error: "Supabase är inte konfigurerat på servern (SUPABASE_SERVICE_ROLE_KEY saknas)." },
        { status: 500 },
      );
    }

    if (targetType === "invoice_draft") {
      if (!patch || (!patch.customer_name && patch.amount === undefined)) {
        return NextResponse.json({ error: "Ingen ändring angiven." }, { status: 400 });
      }

      const { error } = await supabase
        .from("invoice_drafts")
        .update({ customer_name: patch.customer_name, amount: patch.amount })
        .eq("id", targetId)
        .eq("tenant_id", tenantId);

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ ok: true });
    }

    if (!patch || (!patch.customer_name && !patch.content)) {
      return NextResponse.json({ error: "Ingen ändring angiven." }, { status: 400 });
    }

    const { error } = await supabase
      .from("quotes")
      .update({ customer_name: patch.customer_name, content: patch.content })
      .eq("id", targetId)
      .eq("tenant_id", tenantId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  const authClient = await createServerAuthClient();
  const {
    data: { user },
  } = await authClient.auth.getUser();

  try {
    await submitApproval({
      tenant_id: tenantId,
      target_type: targetType,
      target_id: targetId,
      action: action === "approve" ? "approved" : "rejected",
      decided_by: user?.id ?? null,
    });
  } catch (err) {
    console.error(err);
    if (err instanceof OrchestratorRequestError) {
      return NextResponse.json(
        { error: "Beslutet kunde inte genomföras. Försök igen." },
        { status: err.status < 500 ? err.status : 502 },
      );
    }
    return NextResponse.json(
      { error: "Kunde inte nå bearbetningstjänsten. Försök igen." },
      { status: 502 },
    );
  }

  // Orkestratorns /approve lämnar en godkänd offert i status "draft" —
  // den enda status-övergången den gör för offerter är "rejected" (se
  // orchestrator/src/routes/approve.ts, kommentar: "Track 6 sets status:
  // 'sent' later"). Ingenstans i det här repot fanns tidigare kod som
  // faktiskt gjorde det: den gamla Track 4-stubben som satte status "sent"
  // togs bort när den här routen kopplades mot orkestratorn (se
  // QA-FINDINGS.md). Utan detta steg skickas offerten aldrig till kunden
  // och uppföljnings-cronjobbet (area 6) har inget att jobba med, eftersom
  // det bara letar rader med status "sent".
  let warning: string | undefined;
  if (action === "approve" && targetType === "quote") {
    warning = await dispatchApprovedQuote(targetId, tenantId);
  }

  return NextResponse.json({ ok: true, warning });
}

async function dispatchApprovedQuote(
  quoteId: string,
  tenantId: string,
): Promise<string | undefined> {
  const supabase = getServiceClient();
  if (!supabase) {
    console.error("dispatchApprovedQuote: Supabase service client not configured");
    return "Offerten godkändes men kunde inte skickas (serverkonfiguration saknas).";
  }

  const [{ data: quote, error: quoteError }, { data: tenant }] = await Promise.all([
    supabase
      .from("quotes")
      .select("customer_name, customer_email, content")
      .eq("id", quoteId)
      .eq("tenant_id", tenantId)
      .maybeSingle(),
    supabase.from("tenants").select("name").eq("id", tenantId).maybeSingle(),
  ]);

  if (quoteError || !quote) {
    console.error("dispatchApprovedQuote: quote lookup failed", quoteError);
    return "Offerten godkändes men kunde inte hämtas för utskick.";
  }

  if (!quote.customer_email) {
    // Ingen e-post att skicka till — markera ändå som skickad så att den
    // inte ligger kvar som "draft" för evigt. Ingen follow_up_at sätts
    // eftersom det aldrig blev något ursprungligt utskick att följa upp.
    const { error } = await supabase
      .from("quotes")
      .update({ status: "sent", sent_at: new Date().toISOString() })
      .eq("id", quoteId)
      .eq("tenant_id", tenantId);
    if (error) console.error("dispatchApprovedQuote: status update failed", error);
    return "Offerten godkändes men saknar en e-postadress att skicka till.";
  }

  const content = quoteSentTemplate({
    quote: { customer_name: quote.customer_name, content: quote.content },
    tenantName: tenant?.name ?? "OfficePal",
  });

  const sendResult = await sendEmail({ to: quote.customer_email, content });

  if (!sendResult.success) {
    console.error("dispatchApprovedQuote: send failed", sendResult.error);
    // Status lämnas som "draft" (ingen övergång gjord) så att admin kan
    // klicka Godkänn igen för att försöka på nytt — offert-godkännande har
    // ingen statusgrind i orkestratorn (se approve.ts), så en upprepad
    // approve är säker att köra om.
    return "Offerten godkändes men e-posten kunde inte skickas. Försök godkänna igen.";
  }

  const sentAt = new Date();
  const followUpAt = new Date(sentAt.getTime() + FOLLOW_UP_AFTER_DAYS * 24 * 60 * 60 * 1000);

  const { error: updateError } = await supabase
    .from("quotes")
    .update({
      status: "sent",
      sent_at: sentAt.toISOString(),
      follow_up_at: followUpAt.toISOString(),
    })
    .eq("id", quoteId)
    .eq("tenant_id", tenantId);

  if (updateError) {
    console.error("dispatchApprovedQuote: status update after send failed", updateError);
    return "Offerten skickades men status kunde inte uppdateras.";
  }

  return undefined;
}
