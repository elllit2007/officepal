import { tool } from "@anthropic-ai/claude-agent-sdk";
import { checkTrustLevel } from "../lib/trust.js";
import { checkTrustLevelInput } from "./schemas.js";

/**
 * check_trust_level(tenant_id, task_type) -> level (BUILD-CONTRACT.md).
 *
 * Exposed to the model mainly so it can explain *why* something needs
 * approval when it decides not to call a writing tool at all. The writing
 * tools (create_invoice_draft, create_quote_draft) call the same underlying
 * check themselves before writing — that enforcement does not depend on the
 * model remembering to call this tool first.
 */
export const checkTrustLevelTool = tool(
  "check_trust_level",
  "Look up the trust level (ask_always | ask_if_unsure | autonomous) configured for a tenant and task type.",
  checkTrustLevelInput,
  async (args) => {
    const level = await checkTrustLevel(args.tenant_id, args.task_type);
    return {
      content: [{ type: "text", text: JSON.stringify({ level }) }],
    };
  },
);
