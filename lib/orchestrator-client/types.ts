// OfficePal MVP — Nina-piloten
// Track 8 (Orchestrator integration client) — types matching the Track 2
// orchestrator's actual HTTP contract (orchestrator/README.md,
// orchestrator/src/routes/{processReport,approve}.ts on track-2-orchestrator).
//
// This is a thin client for Track 3/4's API routes to call the orchestrator
// service over HTTP — it does not implement any agent logic itself.

export type ProcessReportInput =
  | {
      tenant_id: string;
      staff_id: string;
      /** Existing pending field_reports.id — the route claims and processes it. */
      field_report_id: string;
      raw_text?: never;
    }
  | {
      tenant_id: string;
      staff_id: string;
      /** Omit field_report_id and provide raw_text to have the route create the row. */
      raw_text: string;
      field_report_id?: never;
    };

export type ProcessReportResult = {
  field_report_id: string;
  summary: string;
  turns: number;
};

export type ApprovalTargetType = "invoice_draft" | "quote";

export type ApprovalDecision = "approved" | "rejected";

export type SubmitApprovalInput = {
  tenant_id: string;
  target_type: ApprovalTargetType;
  target_id: string;
  action: ApprovalDecision;
  /** auth.users id of the deciding admin (Track 7 owns admin auth). */
  decided_by?: string | null;
};

export type SubmitApprovalResult = {
  ok: true;
  target_type: ApprovalTargetType;
  target_id: string;
  action: ApprovalDecision;
};

// Error bodies the orchestrator is known to return (see routes/*.ts).
// `error` codes beyond these are still possible — treat this union as
// non-exhaustive and always fall back to the raw body.
export type OrchestratorErrorBody =
  | { error: "invalid_body"; details: unknown }
  | { error: "lookup_failed" | "insert_failed" | "update_failed"; message: string }
  | { error: "field_report_not_found" | "invoice_draft_not_found" | "quote_not_found" }
  | { error: "tenant_mismatch" }
  | { error: "already_processed" | "not_awaiting_approval"; status: string }
  | { error: "agent_run_failed"; field_report_id: string; message: string }
  | { error: "internal_error" }
  | { error: string; [key: string]: unknown };
