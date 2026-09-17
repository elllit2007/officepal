import type { Request, Response } from "express";
import { z } from "zod";
import { supabase } from "../lib/supabase.js";
import { logger } from "../lib/logger.js";
import { runFieldReportAgent } from "../agent/client.js";

const bodySchema = z.object({
  tenant_id: z.string().uuid(),
  staff_id: z.string().uuid(),
  raw_text: z.string().min(1).optional(),
  // Pass an existing pending field_reports.id, or omit and provide raw_text
  // to have this route create the row.
  field_report_id: z.string().uuid().optional(),
});

export async function processReport(req: Request, res: Response) {
  const parsed = bodySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "invalid_body", details: parsed.error.flatten() });
  }
  const { tenant_id, staff_id, field_report_id, raw_text } = parsed.data;

  let reportId = field_report_id;
  let rawText = raw_text;

  if (reportId) {
    // Atomic claim: flip pending -> processed only if it's still pending, in
    // the same statement as the read. A plain "read status, then decide"
    // check has a race — two concurrent /process-report calls for the same
    // field_report_id could both read "pending" before either write lands,
    // and both go on to run the agent, double-creating invoice/quote rows.
    // The conditional `.eq("status", "pending")` means only one concurrent
    // request can actually match a row; the loser gets null back. If the
    // agent run below throws, the catch block overwrites this to "error".
    const { data: claimed, error: claimError } = await supabase
      .from("field_reports")
      .update({ status: "processed" })
      .eq("id", reportId)
      .eq("tenant_id", tenant_id)
      .eq("status", "pending")
      .select("id, raw_text")
      .maybeSingle();

    if (claimError) return res.status(500).json({ error: "lookup_failed", message: claimError.message });

    if (!claimed) {
      const { data: existing, error: fetchError } = await supabase
        .from("field_reports")
        .select("id, tenant_id, status")
        .eq("id", reportId)
        .maybeSingle();

      if (fetchError) return res.status(500).json({ error: "lookup_failed", message: fetchError.message });
      if (!existing) return res.status(404).json({ error: "field_report_not_found" });
      if (existing.tenant_id !== tenant_id) {
        return res.status(403).json({ error: "tenant_mismatch" });
      }
      return res.status(409).json({ error: "already_processed", status: existing.status });
    }

    rawText = claimed.raw_text;
  } else {
    if (!rawText) {
      return res.status(400).json({ error: "invalid_body", details: "raw_text is required when field_report_id is omitted" });
    }
    const { data: inserted, error } = await supabase
      .from("field_reports")
      .insert({ tenant_id, staff_id, raw_text: rawText })
      .select("id")
      .single();

    if (error) return res.status(500).json({ error: "insert_failed", message: error.message });
    reportId = inserted.id;
  }

  try {
    const result = await runFieldReportAgent({
      tenantId: tenant_id,
      staffId: staff_id,
      fieldReportId: reportId,
      rawText: rawText!,
    });

    return res.status(200).json({
      field_report_id: reportId,
      summary: result.summary,
      turns: result.turns,
    });
  } catch (err) {
    logger.error("process-report: agent run failed", {
      field_report_id: reportId,
      error: err instanceof Error ? err.message : String(err),
    });

    await supabase.from("field_reports").update({ status: "error" }).eq("id", reportId);

    return res.status(502).json({
      error: "agent_run_failed",
      field_report_id: reportId,
      message: err instanceof Error ? err.message : String(err),
    });
  }
}
