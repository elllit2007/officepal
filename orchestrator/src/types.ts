// OfficePal MVP — Track 2 (Orchestrator)
//
// The orchestrator is a separate deployable Node service (own package.json,
// own Fly.io/Render deploy) so it cannot import ../lib/types.ts directly at
// build/runtime. These row types are copied from Track 1's lib/types.ts
// (which matches supabase/schema.sql exactly, per BUILD-CONTRACT.md
// "Databaskontrakt") as of the commit that added them to this branch.
//
// RECONCILE: if Track 1 changes lib/types.ts or supabase/schema.sql, this
// file needs to be updated to match by hand — there is no shared build step
// between the Next.js app and this service.
//
// All row shapes below are `type` aliases, not `interface`s: supabase-js's
// generic Database constraint checks `Row extends Record<string, unknown>`
// as part of a conditional type, and TypeScript's `interface` declarations
// do not satisfy that check the same way plain object type aliases do (an
// `interface` here silently collapses every `supabase.from(...)` call's
// generic resolution to `never`). This is why Supabase's own `supabase gen
// types` output always uses `type`, never `interface`, for Row/Insert/Update.

export type TrustLevel = "ask_always" | "ask_if_unsure" | "autonomous";

export type FieldReportStatus = "pending" | "processed" | "error";

export type InvoiceDraftStatus =
  | "awaiting_approval"
  | "approved"
  | "rejected"
  | "sent";

export type QuoteStatus =
  | "draft"
  | "sent"
  | "followed_up"
  | "accepted"
  | "expired"
  | "rejected";

export type ApprovalAction = "awaiting" | "approved" | "rejected";

export type Tenant = {
  id: string;
  name: string;
  settings: Record<string, unknown>;
  created_at: string;
};

export type Staff = {
  id: string;
  tenant_id: string;
  name: string;
  access_code: string;
  created_at: string;
};

export type FieldReport = {
  id: string;
  tenant_id: string;
  staff_id: string;
  raw_text: string;
  extracted: Record<string, unknown> | null;
  status: FieldReportStatus;
  created_at: string;
};

export type InvoiceLineItem = {
  description: string;
  quantity: number;
  unit_price: number;
};

export type InvoiceDraft = {
  id: string;
  tenant_id: string;
  field_report_id: string | null;
  customer_name: string;
  customer_email: string | null;
  amount: number;
  line_items: InvoiceLineItem[];
  status: InvoiceDraftStatus;
  created_at: string;
};

export type Quote = {
  id: string;
  tenant_id: string;
  customer_name: string;
  customer_email: string | null;
  content: string;
  status: QuoteStatus;
  sent_at: string | null;
  follow_up_at: string | null;
  created_at: string;
};

export type Approval = {
  id: string;
  tenant_id: string;
  target_type: string;
  target_id: string;
  action: ApprovalAction;
  decided_by: string | null;
  decided_at: string;
};

export type TrustSetting = {
  tenant_id: string;
  task_type: string;
  level: TrustLevel;
  created_at: string;
};

export type TenantInsert = Omit<Tenant, "id" | "created_at"> &
  Partial<Pick<Tenant, "id" | "created_at">>;

export type StaffInsert = Omit<Staff, "id" | "created_at"> &
  Partial<Pick<Staff, "id" | "created_at">>;

export type FieldReportInsert = Omit<
  FieldReport,
  "id" | "created_at" | "status" | "extracted"
> &
  Partial<Pick<FieldReport, "id" | "created_at" | "status" | "extracted">>;

export type InvoiceDraftInsert = Omit<
  InvoiceDraft,
  "id" | "created_at" | "status" | "line_items" | "customer_email"
> &
  Partial<
    Pick<InvoiceDraft, "id" | "created_at" | "status" | "line_items" | "customer_email">
  >;

export type QuoteInsert = Omit<
  Quote,
  "id" | "created_at" | "status" | "sent_at" | "follow_up_at" | "customer_email"
> &
  Partial<
    Pick<
      Quote,
      "id" | "created_at" | "status" | "sent_at" | "follow_up_at" | "customer_email"
    >
  >;

export type ApprovalInsert = Omit<Approval, "id" | "decided_at"> &
  Partial<Pick<Approval, "id" | "decided_at">>;

export type TrustSettingInsert = Omit<TrustSetting, "created_at"> &
  Partial<Pick<TrustSetting, "created_at">>;

// supabase-js/postgrest-js also require every Tables[x] entry to carry
// Relationships (even if empty) and the schema to carry Views/Functions
// (even if empty) to structurally match their internal GenericSchema type.
export type Database = {
  public: {
    Tables: {
      tenants: {
        Row: Tenant;
        Insert: TenantInsert;
        Update: Partial<Tenant>;
        Relationships: [];
      };
      staff: {
        Row: Staff;
        Insert: StaffInsert;
        Update: Partial<Staff>;
        Relationships: [];
      };
      field_reports: {
        Row: FieldReport;
        Insert: FieldReportInsert;
        Update: Partial<FieldReport>;
        Relationships: [];
      };
      invoice_drafts: {
        Row: InvoiceDraft;
        Insert: InvoiceDraftInsert;
        Update: Partial<InvoiceDraft>;
        Relationships: [];
      };
      quotes: {
        Row: Quote;
        Insert: QuoteInsert;
        Update: Partial<Quote>;
        Relationships: [];
      };
      approvals: {
        Row: Approval;
        Insert: ApprovalInsert;
        Update: never;
        Relationships: [];
      };
      trust_settings: {
        Row: TrustSetting;
        Insert: TrustSettingInsert;
        Update: Partial<TrustSetting>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
};
