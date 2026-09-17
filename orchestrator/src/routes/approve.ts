import type { Request, Response } from "express";
import { z } from "zod";
import { supabase } from "../lib/supabase.js";
import { logDecision } from "../lib/approvals.js";
import { logger } from "../lib/logger.js";

const bodySchema = z.object({
  tenant_id: z.string().uuid(),
  target_type: z.enum(["invoice_draft", "quote"]),
  target_id: z.string().uuid(),
  action: z.enum(["approved", "rejected"]),
  // auth.users id of the admin deciding (Track 7 owns admin auth).
  decided_by: z.string().uuid().nullable().optional(),
});

/**
 * POST /approve — the human half of the trust gate. A writing tool
 * (create_invoice_draft/create_quote_draft) leaves a row awaiting a human
 * decision when trust_settings requires one; this is where that decision is
 * recorded. Always logs to approvals (insert-only audit trail), and
 * transitions the target row's own status too.
 *
 * quotes has no "approved" status distinct from "draft" (an approved quote
 * is simply cleared to send — Track 6 sets status: 'sent' later), but it
 * does have "rejected", so a rejection transitions quotes.status; an
 * approval does not.
 *
 * Status transitions use a conditional update (`.eq("status", <expected>)`)
 * rather than a separate fetch-then-write, so two concurrent /approve calls
 * for the same target can't both pass a stale read and both write — only
 * one update actually matches a row; the other gets back no row and 409s.
 * Quote approval has no status transition to gate on, so a second
 * concurrent "approved" call for the same quote isn't caught this way —
 * acceptable for a single-admin pilot; would need a DB-level unique
 * constraint on approvals(target_type, target_id) to close fully, which is
 * a supabase/schema.sql change outside this track's scope.
 */
export async function approve(req: Request, res: Response) {
  const parsed = bodySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "invalid_body", details: parsed.error.flatten() });
  }
  const { tenant_id, target_type, target_id, action, decided_by } = parsed.data;

  if (target_type === "invoice_draft") {
    const { data: updated, error: updateError } = await supabase
      .from("invoice_drafts")
      .update({ status: action })
      .eq("id", target_id)
      .eq("tenant_id", tenant_id)
      .eq("status", "awaiting_approval")
      .select("id")
      .maybeSingle();

    if (updateError) {
      return res.status(500).json({ error: "update_failed", message: updateError.message });
    }
    if (!updated) {
      const { data: draft } = await supabase
        .from("invoice_drafts")
        .select("id, tenant_id, status")
        .eq("id", target_id)
        .maybeSingle();

      if (!draft) return res.status(404).json({ error: "invoice_draft_not_found" });
      if (draft.tenant_id !== tenant_id) return res.status(403).json({ error: "tenant_mismatch" });
      return res.status(409).json({ error: "not_awaiting_approval", status: draft.status });
    }
  } else {
    if (action === "rejected") {
      const { data: updated, error: updateError } = await supabase
        .from("quotes")
        .update({ status: "rejected" })
        .eq("id", target_id)
        .eq("tenant_id", tenant_id)
        .eq("status", "draft")
        .select("id")
        .maybeSingle();

      if (updateError) {
        return res.status(500).json({ error: "update_failed", message: updateError.message });
      }
      if (!updated) {
        const { data: quote } = await supabase
          .from("quotes")
          .select("id, tenant_id, status")
          .eq("id", target_id)
          .maybeSingle();

        if (!quote) return res.status(404).json({ error: "quote_not_found" });
        if (quote.tenant_id !== tenant_id) return res.status(403).json({ error: "tenant_mismatch" });
        return res.status(409).json({ error: "not_awaiting_approval", status: quote.status });
      }
    } else {
      // action === "approved": no status transition to gate on (see doc
      // comment above) — just verify the quote exists and belongs to this
      // tenant before logging the decision.
      const { data: quote, error: fetchError } = await supabase
        .from("quotes")
        .select("id, tenant_id, status")
        .eq("id", target_id)
        .maybeSingle();

      if (fetchError) return res.status(500).json({ error: "lookup_failed", message: fetchError.message });
      if (!quote) return res.status(404).json({ error: "quote_not_found" });
      if (quote.tenant_id !== tenant_id) return res.status(403).json({ error: "tenant_mismatch" });
      if (quote.status !== "draft") {
        return res.status(409).json({ error: "not_awaiting_approval", status: quote.status });
      }
    }
  }

  await logDecision({
    tenantId: tenant_id,
    targetType: target_type,
    targetId: target_id,
    action,
    decidedBy: decided_by ?? null,
  });

  logger.info("approve: decision recorded", { tenant_id, target_type, target_id, action });

  return res.status(200).json({ ok: true, target_type, target_id, action });
}
