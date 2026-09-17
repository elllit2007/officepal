import type { HookCallback, PostToolUseHookInput } from "@anthropic-ai/claude-agent-sdk";
import { logDecision, logAwaitingOutcome } from "../lib/approvals.js";
import { logger } from "../lib/logger.js";
import { WRITING_TOOL_NAMES } from "../tools/index.js";

interface WritingToolResultPayload {
  decision: "approved" | "awaiting";
  target_type: "invoice_draft" | "quote";
  target_id: string;
  tenant_id: string;
}

function parsePayload(toolResponse: unknown): WritingToolResultPayload | null {
  // MCP CallToolResult shape: { content: [{ type: 'text', text: '...json...' }], isError?: boolean }
  if (
    toolResponse &&
    typeof toolResponse === "object" &&
    "content" in toolResponse &&
    Array.isArray((toolResponse as { content: unknown }).content)
  ) {
    const first = (toolResponse as { content: unknown[] }).content[0];
    if (
      first &&
      typeof first === "object" &&
      "text" in (first as Record<string, unknown>)
    ) {
      try {
        const parsed = JSON.parse((first as { text: string }).text);
        if (
          typeof parsed.decision === "string" &&
          typeof parsed.target_type === "string" &&
          typeof parsed.target_id === "string" &&
          typeof parsed.tenant_id === "string"
        ) {
          return parsed as WritingToolResultPayload;
        }
      } catch {
        return null;
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
    logger.warn("logToolOutcomeHook: could not parse writing tool result, skipping audit log", {
      tool_name: event.tool_name,
    });
    return {};
  }

  if (payload.decision === "approved") {
    await logDecision({
      tenantId: payload.tenant_id,
      targetType: payload.target_type,
      targetId: payload.target_id,
      action: "approved",
      decidedBy: null, // autonomous — no human decided
    });
  } else {
    logAwaitingOutcome({
      tenantId: payload.tenant_id,
      targetType: payload.target_type,
      targetId: payload.target_id,
      taskType: event.tool_name,
    });
  }

  return {};
};
