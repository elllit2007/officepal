import { z } from "zod";

// Strict JSON schemas for the four orchestrator tools (BUILD-CONTRACT.md
// "Orchestratorns verktyg"). No schema below has a price/amount field the
// model can set directly — prices are always a server-side lookup
// (src/lib/pricing.ts), never model output. See src/tools/*.ts.

export const extractFieldReportInput = {
  field_report_id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  raw_text: z.string().min(1),
  structured: z.object({
    customer_name: z.string().min(1),
    service_type: z.string().min(1),
    location: z.string().optional(),
    work_items: z
      .array(
        z.object({
          description: z.string().min(1),
          quantity: z.number().positive(),
          unit: z.string().min(1),
        }),
      )
      .min(1),
    hours_worked: z.number().nonnegative().nullable(),
    materials_used: z.array(
      z.object({
        name: z.string().min(1),
        quantity: z.number().positive(),
      }),
    ),
    notes: z.string(),
    confidence: z.enum(["high", "medium", "low"]),
    requires_manual_review: z.boolean(),
  }),
};

export const createInvoiceDraftInput = {
  tenant_id: z.string().uuid(),
  field_report_id: z.string().uuid().nullable().optional(),
  customer_name: z.string().min(1),
  line_items: z
    .array(
      z.object({
        description: z.string().min(1),
        quantity: z.number().positive(),
      }),
    )
    .min(1),
};

export const createQuoteDraftInput = {
  tenant_id: z.string().uuid(),
  customer_name: z.string().min(1),
  content: z.string().min(1),
};

export const checkTrustLevelInput = {
  tenant_id: z.string().uuid(),
  task_type: z.string().min(1),
};
