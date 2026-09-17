import { tool } from "@anthropic-ai/claude-agent-sdk";
import { supabase } from "../lib/supabase.js";
import { logger } from "../lib/logger.js";
import { extractFieldReportInput } from "./schemas.js";

/**
 * extract_field_report(raw_text) -> structured_data (BUILD-CONTRACT.md).
 *
 * The orchestration agent (src/agent/client.ts) reads raw_text as part of
 * its turn and reasons out the structured fields; this tool's zod schema is
 * the strict-schema enforcement point — the model cannot pass fields outside
 * it (there is no price/amount field anywhere in `structured`, so the model
 * has no field to put a guessed price in even if it tried). The tool itself
 * only validates and persists.
 */
export const extractFieldReportTool = tool(
  "extract_field_report",
  "Persist the structured extraction of a field report's raw text. Call this exactly once per report, after reading raw_text and reasoning out its structured fields. Never invent a price or amount — there is no field for one.",
  extractFieldReportInput,
  async (args) => {
    const { data: existing, error: fetchError } = await supabase
      .from("field_reports")
      .select("id, tenant_id")
      .eq("id", args.field_report_id)
      .maybeSingle();

    if (fetchError) {
      throw new Error(`extract_field_report: lookup failed: ${fetchError.message}`);
    }
    if (!existing) {
      throw new Error(`extract_field_report: unknown field_report_id ${args.field_report_id}`);
    }
    if (existing.tenant_id !== args.tenant_id) {
      throw new Error("extract_field_report: tenant_id does not match field_report");
    }

    const { data: updated, error: updateError } = await supabase
      .from("field_reports")
      .update({ extracted: args.structured, status: "processed" })
      .eq("id", args.field_report_id)
      .select()
      .single();

    if (updateError) {
      throw new Error(`extract_field_report: update failed: ${updateError.message}`);
    }

    logger.info("extract_field_report: persisted", {
      field_report_id: args.field_report_id,
      tenant_id: args.tenant_id,
    });

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ field_report: updated, structured_data: args.structured }),
        },
      ],
    };
  },
);
