import { supabase } from "./supabase.js";
import { logger } from "./logger.js";
import type { ApprovalAction } from "../types.js";

export interface LogDecisionInput {
  tenantId: string;
  targetType: "invoice_draft" | "quote";
  targetId: string;
  action: ApprovalAction;
  /** auth.users id of the human who decided, or null for an autonomous decision. */
  decidedBy: string | null;
}

/**
 * Insert-only write to approvals — the audit trail (BUILD-CONTRACT.md:
 * "Varje skrivande verktyg loggar till approvals (hook, insert-only) —
 * detta är audit-trailen"). Never update/delete; supabase/schema.sql has no
 * UPDATE/DELETE policy on this table, so it would fail anyway.
 *
 * NOTE — contract gap: approvals.action has a DB check constraint allowing
 * only 'approved' | 'rejected' (supabase/schema.sql). It cannot represent an
 * "awaiting" outcome. When a writing tool defers to a human instead of
 * executing, we do NOT insert a row here (there is no valid action value for
 * it) — the pending state lives on the target row itself
 * (invoice_drafts.status = 'awaiting_approval', quotes.status = 'draft') and
 * is only logged to stdout. Flagged for Track 1/Elliot: either add an
 * 'awaiting' action value, or accept that "awaiting" is represented by the
 * target row's status rather than by an approvals row.
 */
export async function logDecision(input: LogDecisionInput): Promise<void> {
  const { error } = await supabase.from("approvals").insert({
    tenant_id: input.tenantId,
    target_type: input.targetType,
    target_id: input.targetId,
    action: input.action,
    decided_by: input.decidedBy,
  });

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

export function logAwaitingOutcome(fields: {
  tenantId: string;
  targetType: "invoice_draft" | "quote";
  targetId: string;
  taskType: string;
}): void {
  logger.info("writing tool outcome: awaiting_approval (not logged to approvals — see contract gap note)", fields);
}
