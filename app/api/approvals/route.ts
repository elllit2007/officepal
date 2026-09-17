import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { InvoiceDraftStatus } from "@/lib/types";
import type { SupabaseDatabase } from "@/app/admin/lib/supabaseDatabase";

// TODO(Track 2): detta är en tillfällig stub för admin-dashboarden (Track 4).
// Skriv om till att anropa orchestratorns POST /approve-endpoint istället för
// att uppdatera Supabase direkt härifrån, så att trust_settings-kontrollen
// och orchestratorns egna audit-hooks körs på rätt ställe. Se BUILD-CONTRACT.md.

interface ApprovalRequestBody {
  targetType: "invoice_draft";
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

  if (targetType !== "invoice_draft" || !targetId || !tenantId || !action) {
    return NextResponse.json({ error: "Ogiltig förfrågan." }, { status: 400 });
  }

  const supabase = getServiceClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase är inte konfigurerat på servern (SUPABASE_SERVICE_ROLE_KEY saknas)." },
      { status: 500 },
    );
  }

  if (action === "edit") {
    if (!patch || (!patch.customer_name && patch.amount === undefined)) {
      return NextResponse.json({ error: "Ingen ändring angiven." }, { status: 400 });
    }
    const { error } = await supabase
      .from("invoice_drafts")
      .update(patch)
      .eq("id", targetId)
      .eq("tenant_id", tenantId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  const newStatus: InvoiceDraftStatus = action === "approve" ? "approved" : "rejected";

  const { error: updateError } = await supabase
    .from("invoice_drafts")
    .update({ status: newStatus })
    .eq("id", targetId)
    .eq("tenant_id", tenantId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // approvals är insert-only — detta är audit-trailen (se supabase/schema.sql).
  const { error: approvalError } = await supabase.from("approvals").insert({
    tenant_id: tenantId,
    target_type: "invoice_draft",
    target_id: targetId,
    action: newStatus === "approved" ? "approved" : "rejected",
    // TODO(Track 7): sätt till den inloggade adminanvändarens auth.uid() när
    // inloggning finns på plats istället för null.
    decided_by: null,
  });

  if (approvalError) {
    return NextResponse.json({ error: approvalError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
