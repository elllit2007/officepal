import type { TrustLevel } from "@/lib/types";

/** Uppgiftstyper som förtroendereglaget känner till (se supabase/seed.sql). */
export const TRUST_TASK_TYPES = [
  "invoice_draft",
  "quote_draft",
  "field_report_extraction",
] as const;

export type TrustTaskType = (typeof TRUST_TASK_TYPES)[number];

export const TRUST_LEVELS: TrustLevel[] = ["ask_always", "ask_if_unsure", "autonomous"];
