import type { HookCallback, PostToolUseHookInput } from "@anthropic-ai/claude-agent-sdk";
import { logDecision } from "../lib/approvals.js";
import { logger } from "../lib/logger.js";
import { WRITING_TOOL_NAMES } from "../tools/index.js";

interface WritingToolResultPayload {
  decision: "approved" | "awaiting";
  target_type: "invoice_draft" | "quote";
  target_id: string;
  tenant_id: string;
}

function isValidPayload(parsed: unknown): parsed is WritingToolResultPayload {
  return (
    !!parsed &&
    typeof parsed === "object" &&
    typeof (parsed as Record<string, unknown>).decision === "string" &&
    typeof (parsed as Record<string, unknown>).target_type === "string" &&
    typeof (parsed as Record<string, unknown>).target_id === "string" &&
    typeof (parsed as Record<string, unknown>).tenant_id === "string"
  );
}

function parsePayload(toolResponse: unknown): WritingToolResultPayload | null {
  // MCP CallToolResult shape: { content: [{ type: 'text', text: '...json...' }, ...], isError?: boolean }
  //
  // The writing tools (create_invoice_draft, create_quote_draft) emit the
  // audit envelope (decision/target_type/target_id/tenant_id) as its own
  // small, fixed-shape text block, kept separate from a second block
  // carrying the full (potentially large/free-text) record — see those
  // tools' return statements. We don't assume which index the envelope
  // lands at; scan every text block and use the first one that parses into
  // a valid envelope.
  if (
    toolResponse &&
    typeof toolResponse === "object" &&
    "content" in toolResponse &&
    Array.isArray((toolResponse as { content: unknown }).content)
  ) {
    for (const block of (toolResponse as { content: unknown[] }).content) {
      if (!block || typeof block !== "object" || !("text" in block)) continue;
      const text = (block as { text: unknown }).text;
      if (typeof text !== "string") continue;
      try {
        const parsed = JSON.parse(text);
        if (isValidPayload(parsed)) return parsed;
      } catch {
        // not this block's job — keep scanning the rest
      }
    }
  }
  return null;
}

/**
 * PostToolUse hook: "Varje skrivande verktyg loggar till approvals (hook,
 * insert-only) — detta är audit-trailen" (BUILD-CONTRACT.md). Fires after
 * every tool call in the session; only acts on our two writing tools.
 *
 * Insert-only by construction: this hook only ever calls logDecision(), which
 * only ever does supabase.from("approvals").insert(...) — never update/delete.
 */
export const logToolOutcomeHook: HookCallback = async (input) => {
  if (input.hook_event_name !== "PostToolUse") return {};

  const event = input as PostToolUseHookInput;
  if (!WRITING_TOOL_NAMES.includes(event.tool_name as (typeof WRITING_TOOL_NAMES)[number])) {
    return {};
  }

  const payload = parsePayload(event.tool_response);
  if (!payload) {
    // Dump the raw shape (truncated) so a recurrence is diagnosable straight
    // from fly logs instead of needing a live repro — this is what was
    // missing when this warning was first seen for create_quote_draft.
    let rawShape: string;
    try {
      rawShape = JSON.stringify(event.tool_response).slice(0, 2000);
    } catch {
      rawShape = String(event.tool_response).slice(0, 2000);
    }
    logger.warn("logToolOutcomeHook: could not parse writing tool result, skipping audit log", {
      tool_name: event.tool_name,
      raw_tool_response: rawShape,
    });
    return {};
  }

  // decision is "approved" (autonomous execution) or "awaiting" (deferred to
  // a human) — both are valid approvals.action values now. decided_by is
  // null either way: no human has decided yet in either case, the human
  // decision (POST /approve) logs its own separate row later.
  await logDecision({
    tenantId: payload.tenant_id,
    targetType: payload.target_type,
    targetId: payload.target_id,
    action: payload.decision,
    decidedBy: null,
  });

  return {};
};
