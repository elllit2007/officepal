import { tool } from "@anthropic-ai/claude-agent-sdk";
import { supabase } from "../lib/supabase.js";
import { logger } from "../lib/logger.js";
import { timed } from "../lib/timing.js";
import { checkTrustLevel, isAutonomous } from "../lib/trust.js";
import { createQuoteDraftInput } from "./schemas.js";

export const QUOTE_TASK_TYPE = "quote_draft";

/**
 * create_quote_draft(input) -> quote (BUILD-CONTRACT.md): "samma princip"
 * as create_invoice_draft — gated by check_trust_level before writing.
 *
 * Quotes are the deliberately unpriced/flagged path ("flaggas som offert")
 * for work that doesn't match a known price-list entry — `content` is
 * free text a human reviews, not a structured priced line-item list.
 */
export const createQuoteDraftTool = tool(
  "create_quote_draft",
  "Create a quote draft for work that doesn't match a known price (or is otherwise not a standard priced job). content is free text for a human to review and finalize — never include a specific price you invented.",
  createQuoteDraftInput,
  async (args) => {
    const level = await checkTrustLevel(args.tenant_id, QUOTE_TASK_TYPE);
    const autonomous = isAutonomous(level);

    const { data: quote, error } = await timed(
      "supabase: quotes insert",
      { tenant_id: args.tenant_id },
      () =>
        supabase
          .from("quotes")
          .insert({
            tenant_id: args.tenant_id,
            customer_name: args.customer_name,
            customer_email: args.customer_email ?? null,
            content: args.content,
            // quotes has no "awaiting_approval" status distinct from "draft" —
            // the trust decision is recorded separately via the approvals hook,
            // not by a quotes.status transition. See src/lib/approvals.ts.
            status: "draft",
          })
          .select()
          .single(),
    );

    if (error) {
      throw new Error(`create_quote_draft: insert failed: ${error.message}`);
    }

    logger.info("create_quote_draft: created", {
      quote_id: quote.id,
      tenant_id: args.tenant_id,
      trust_level: level,
    });

    return {
      content: [
        {
          // Audit envelope first, and deliberately kept small and fixed-shape
          // (see src/hooks/logToolOutcome.ts) — content.content below is
          // unbounded model-supplied free text (no length cap in schemas.ts),
          // unlike create_invoice_draft's compact structured line_items.
          // Keeping the two apart means the audit trail can't be broken by
          // however large/unusual the free text turns out to be.
          type: "text",
          text: JSON.stringify({
            decision: autonomous ? "approved" : "awaiting",
            target_type: "quote",
            target_id: quote.id,
            tenant_id: args.tenant_id,
          }),
        },
        {
          type: "text",
          text: JSON.stringify({ quote, trust_level: level }),
        },
      ],
    };
  },
);
