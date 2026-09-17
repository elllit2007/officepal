import { query, createSdkMcpServer } from "@anthropic-ai/claude-agent-sdk";
import { config } from "../config.js";
import { logger } from "../lib/logger.js";
import { logToolOutcomeHook } from "../hooks/logToolOutcome.js";
import {
  extractFieldReportTool,
  createInvoiceDraftTool,
  createQuoteDraftTool,
  checkTrustLevelTool,
} from "../tools/index.js";

const SYSTEM_PROMPT = `Du är OfficePals orchestrator för Nina-piloten (städbolag).

Du får en fältrapport (fri text från fältpersonal) tillsammans med
tenant_id, staff_id och field_report_id. Din uppgift:

1. Läs raw_text och resonera fram strukturerade fält: kundnamn, kundens
   e-post (om den nämns i texten — annars null), typ av tjänst, plats,
   utförda arbetsmoment (beskrivning + mängd + enhet), timmar, material
   som använts, och eventuella anteckningar. Anropa sedan
   extract_field_report EXAKT EN GÅNG med dessa fält i "structured".
   - Sätt requires_manual_review: true om rapporten är oklar, ofullständig,
     eller beskriver ett jobb som inte är standard.
   - Sätt confidence ärligt (high/medium/low).
   - Hitta ALDRIG på en e-postadress — lämna den som null om den inte
     står i texten.

2. Bestäm om detta ska bli en faktura eller en offert:
   - Om arbetsmomenten är standardtjänster med kända priser: anropa
     create_invoice_draft med description+quantity per rad (och
     customer_email om du fångade en). Anropa ALDRIG med ett pris själv —
     verktyget slår upp priset. Om verktyget svarar "no_price_found",
     anropa istället create_quote_draft för det jobbet.
   - Om arbetet är ovanligt, kundspecifikt, eller priset är osäkert: anropa
     create_quote_draft direkt med en tydlig fritextbeskrivning av vad
     offerten gäller (och customer_email om du fångade en).

3. Hitta ALDRIG på ett pris. Ett pris kommer alltid från verktygets
   uppslag mot tenantens prislista, aldrig från dig.

4. Svara kort på svenska i slutet med vad du gjorde (t.ex. "Skapade
   fakturautkast, väntar på godkännande" eller "Skapade offert").`;

export interface ProcessReportInput {
  tenantId: string;
  staffId: string;
  fieldReportId: string;
  rawText: string;
}

export interface ProcessReportResult {
  summary: string;
  turns: number;
}

export async function runFieldReportAgent(
  input: ProcessReportInput,
): Promise<ProcessReportResult> {
  const officepalServer = createSdkMcpServer({
    name: "officepal",
    version: "1.0.0",
    tools: [
      extractFieldReportTool,
      createInvoiceDraftTool,
      createQuoteDraftTool,
      checkTrustLevelTool,
    ],
  });

  const prompt = [
    `field_report_id: ${input.fieldReportId}`,
    `tenant_id: ${input.tenantId}`,
    `staff_id: ${input.staffId}`,
    "raw_text:",
    input.rawText,
  ].join("\n");

  let summary = "";
  let turns = 0;

  for await (const message of query({
    prompt,
    options: {
      env: { ...process.env, ANTHROPIC_API_KEY: config.anthropicApiKey },
      systemPrompt: SYSTEM_PROMPT,
      model: "claude-sonnet-5",
      // No filesystem/bash/web tools — this agent only touches OfficePal data
      // through the four contract tools below.
      tools: [],
      mcpServers: { officepal: officepalServer },
      allowedTools: [
        "mcp__officepal__extract_field_report",
        "mcp__officepal__create_invoice_draft",
        "mcp__officepal__create_quote_draft",
        "mcp__officepal__check_trust_level",
      ],
      // Server-to-server process with no human to prompt for permission;
      // the tools themselves are the trust boundary (check_trust_level).
      permissionMode: "bypassPermissions",
      allowDangerouslySkipPermissions: true,
      hooks: {
        PostToolUse: [{ hooks: [logToolOutcomeHook] }],
      },
      maxTurns: 12,
    },
  })) {
    if (message.type === "assistant") {
      turns += 1;
    }
    if (message.type === "result") {
      if (message.subtype === "success") {
        summary = message.result;
      } else {
        logger.warn("agent run ended without success", { subtype: message.subtype });
      }
    }
  }

  return { summary, turns };
}
