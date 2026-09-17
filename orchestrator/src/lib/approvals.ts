import { supabase } from "./supabase.js";
import { logger } from "./logger.js";
import { timed } from "./timing.js";
import type { ApprovalAction } from "../types.js";

export interface LogDecisionInput {
  tenantId: string;
  targetType: "invoice_draft" | "quote";
  targetId: string;
  action: ApprovalAction;
  /** auth.users id of the human who decided, or null for a system-recorded entry (autonomous execution, or a write left awaiting approval). */
  decidedBy: string | null;
}

/**
 * Insert-only write to approvals — the audit trail (BUILD-CONTRACT.md:
 * "Varje skrivande verktyg loggar till approvals (hook, insert-only) —
 * detta är audit-trailen"). Never update/delete; supabase/schema.sql has no
 * UPDATE/DELETE policy on this table, so it would fail anyway.
 *
 * approvals.action allows 'awaiting' | 'approved' | 'rejected' (see
 * supabase/schema.sql check constraint), so a writing tool that defers to a
 * human logs an 'awaiting' row here (decided_by: null) at write time, and
 * POST /approve later logs a second row with the human's 'approved' /
 * 'rejected' decision — a full two-row trail per gated write.
 */
export async function logDecision(input: LogDecisionInput): Promise<void> {
  const { error } = await timed(
    "supabase: approvals insert",
    { tenant_id: input.tenantId, target_type: input.targetType },
    () =>
      supabase.from("approvals").insert({
        tenant_id: input.tenantId,
        target_type: input.targetType,
        target_id: input.targetId,
        action: input.action,
        decided_by: input.decidedBy,
      }),
  );

  if (error) {
    // The approvals insert is the audit trail, not the primary write — the
    // target row (invoice_draft/quote) is already committed by this point.
    // Log loudly but don't fail the request over an audit-log write.
    logger.error("approvals insert failed", {
      tenantId: input.tenantId,
      targetType: input.targetType,
      targetId: input.targetId,
      action: input.action,
      error: error.message,
    });
  }
}
