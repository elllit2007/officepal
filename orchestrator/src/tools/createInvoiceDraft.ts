import { tool } from "@anthropic-ai/claude-agent-sdk";
import { supabase } from "../lib/supabase.js";
import { logger } from "../lib/logger.js";
import { timed } from "../lib/timing.js";
import { checkTrustLevel, isAutonomous } from "../lib/trust.js";
import { getTenantPriceList, lookupUnitPrice } from "../lib/pricing.js";
import { createInvoiceDraftInput } from "./schemas.js";

export const INVOICE_TASK_TYPE = "invoice_draft";

/**
 * create_invoice_draft(structured_data) -> invoice_draft (BUILD-CONTRACT.md).
 * "kräver godkännande enligt trust_settings" — every call checks
 * check_trust_level before writing (BUILD-CONTRACT.md: "Ingen skrivande
 * åtgärd exekveras utan att passera trust_settings-kontrollen").
 *
 * Prices are never supplied by the model (see schemas.ts) — they are looked
 * up server-side against tenant.settings.price_list. A line item with no
 * matching price is refused rather than guessed; the caller should use
 * create_quote_draft for that item instead ("flaggas som offert").
 */
export const createInvoiceDraftTool = tool(
  "create_invoice_draft",
  "Create an invoice draft from priced line items. Every line item's price is looked up server-side from the tenant's price list — you supply only description and quantity, never a price. If any item has no known price, this tool fails and you should use create_quote_draft instead.",
  createInvoiceDraftInput,
  async (args) => {
    const priceList = await getTenantPriceList(args.tenant_id);

    const missing: string[] = [];
    const pricedItems = args.line_items.map((item) => {
      const unitPrice = lookupUnitPrice(priceList, item.description);
      if (unitPrice === undefined) missing.push(item.description);
      return { ...item, unit_price: unitPrice ?? 0 };
    });

    if (missing.length > 0) {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: JSON.stringify({
              error: "no_price_found",
              missing_descriptions: missing,
              hint: "No price on file for these items. Use create_quote_draft instead of guessing a price.",
            }),
          },
        ],
      };
    }

    const amount = pricedItems.reduce(
      (sum, item) => sum + item.quantity * item.unit_price,
      0,
    );

    const level = await checkTrustLevel(args.tenant_id, INVOICE_TASK_TYPE);
    const autonomous = isAutonomous(level);
    const status = autonomous ? "approved" : "awaiting_approval";

    const { data: invoiceDraft, error } = await timed(
      "supabase: invoice_drafts insert",
      { tenant_id: args.tenant_id },
      () =>
        supabase
          .from("invoice_drafts")
          .insert({
            tenant_id: args.tenant_id,
            field_report_id: args.field_report_id ?? null,
            customer_name: args.customer_name,
            customer_email: args.customer_email ?? null,
            amount,
            line_items: pricedItems,
            status,
          })
          .select()
          .single(),
    );

    if (error) {
      throw new Error(`create_invoice_draft: insert failed: ${error.message}`);
    }

    logger.info("create_invoice_draft: created", {
      invoice_draft_id: invoiceDraft.id,
      tenant_id: args.tenant_id,
      status,
      trust_level: level,
    });

    return {
      content: [
        {
          // Audit envelope first, kept small and fixed-shape, separate from
          // the (unbounded-in-principle) line_items detail below — see
          // src/hooks/logToolOutcome.ts and the matching split in
          // create_quote_draft.
          type: "text",
          text: JSON.stringify({
            decision: autonomous ? "approved" : "awaiting",
            target_type: "invoice_draft",
            target_id: invoiceDraft.id,
            tenant_id: args.tenant_id,
          }),
        },
        {
          type: "text",
          text: JSON.stringify({ invoice_draft: invoiceDraft, trust_level: level }),
        },
      ],
    };
  },
);
