import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { SupabaseDatabase } from "@/app/admin/lib/supabaseDatabase";
import { createClient as createServerAuthClient } from "@/app/auth/lib/supabase/server";
import { submitApproval, OrchestratorRequestError } from "@/lib/orchestrator-client";

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

  return NextResponse.json({ ok: true });
}
