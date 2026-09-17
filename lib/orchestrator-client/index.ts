// OfficePal MVP — Nina-piloten
// Track 8 — thin typed client for the Track 2 orchestrator service.
//
// Server-side only (reads ORCHESTRATOR_URL / ORCHESTRATOR_SHARED_SECRET from
// process.env) — call from Next.js API routes, never from the browser.
// This will replace the direct-Supabase stubs in Track 3/4's API routes
// once the orchestrator is deployed.

import { orchestratorClient } from "./client";
import type {
  ProcessReportInput,
  ProcessReportResult,
  SubmitApprovalInput,
  SubmitApprovalResult,
} from "./types";

export * from "./types";
export { OrchestratorRequestError } from "./errors";

/**
 * POST /process-report — runs the orchestration agent once for a field
 * report: extracts structured data, then creates an invoice draft or a
 * quote draft (or both), gated by the tenant's trust_settings.
 *
 * Pass `field_report_id` to process an existing pending field_reports row,
 * or `raw_text` (with no `field_report_id`) to have the orchestrator create
 * the row first.
 */
export function processReport(
  input: ProcessReportInput
): Promise<ProcessReportResult> {
  return orchestratorClient.post<ProcessReportResult>("/process-report", input);
}

/**
 * POST /approve — records a human decision on a gated write
 * (invoice_draft or quote), the human half of the trust gate.
 */
export function submitApproval(
  input: SubmitApprovalInput
): Promise<SubmitApprovalResult> {
  return orchestratorClient.post<SubmitApprovalResult>("/approve", input);
}
