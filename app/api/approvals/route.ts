import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { SupabaseDatabase } from "@/app/admin/lib/supabaseDatabase";
import { submitApproval, OrchestratorRequestError } from "@/lib/orchestrator-client";

// "approve"/"reject" går via orkestratorns POST /approve (lib/orchestrator-
// client) — den uppdaterar target-radens status OCH skriver audit-raden i
// approvals, se BUILD-CONTRACT.md. "edit" har ingen motsvarighet i
// orkestratorns kontrakt (bara approved/rejected) och patchar därför
// fortfarande invoice_drafts direkt här, utan audit-rad.

type TargetType = "invoice_draft" | "quote";

interface ApprovalRequestBody {
  targetType: TargetType;
  targetId: string;
  tenantId: string;
  action: "approve" | "reject" | "edit";
  patch?: { customer_name?: string; amount?: number };
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
    if (targetType !== "invoice_draft") {
      return NextResponse.json(
        { error: "Redigering stöds ännu inte för offerter." },
        { status: 400 },
      );
    }
    if (!patch || (!patch.customer_name && patch.amount === undefined)) {
      return NextResponse.json({ error: "Ingen ändring angiven." }, { status: 400 });
    }

    const supabase = getServiceClient();
    if (!supabase) {
      return NextResponse.json(
        { error: "Supabase är inte konfigurerat på servern (SUPABASE_SERVICE_ROLE_KEY saknas)." },
        { status: 500 },
      );
    }

    const { error } = await supabase
      .from("invoice_drafts")
      .update(patch)
      .eq("id", targetId)
      .eq("tenant_id", tenantId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  try {
    await submitApproval({
      tenant_id: tenantId,
      target_type: targetType,
      target_id: targetId,
      action: action === "approve" ? "approved" : "rejected",
      // TODO(Track 7): sätt till den inloggade adminanvändarens auth.uid() när
      // inloggning finns på plats istället för null.
      decided_by: null,
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
