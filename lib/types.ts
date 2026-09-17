// OfficePal MVP — Nina-piloten
// Track 1 (Schema & kontrakt) — TypeScript-typer som matchar supabase/schema.sql exakt.
//
// Övriga tracks: läs denna fil, ändra den inte förrän Track 1 pushat en ny
// version (se BUILD-CONTRACT.md "Databaskontrakt").

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
  "id" | "created_at" | "status" | "line_items"
> &
  Partial<Pick<InvoiceDraft, "id" | "created_at" | "status" | "line_items">>;

export type QuoteInsert = Omit<
  Quote,
  "id" | "created_at" | "status" | "sent_at" | "follow_up_at"
> &
  Partial<
    Pick<Quote, "id" | "created_at" | "status" | "sent_at" | "follow_up_at">
  >;

export type ApprovalInsert = Omit<Approval, "id" | "decided_at"> &
  Partial<Pick<Approval, "id" | "decided_at">>;

export type TrustSettingInsert = Omit<TrustSetting, "created_at"> &
  Partial<Pick<TrustSetting, "created_at">>;

export type Database = {
  public: {
    Tables: {
      tenants: {
        Row: Tenant;
        Insert: TenantInsert;
        Update: Partial<Tenant>;
      };
      staff: {
        Row: Staff;
        Insert: StaffInsert;
        Update: Partial<Staff>;
      };
      field_reports: {
        Row: FieldReport;
        Insert: FieldReportInsert;
        Update: Partial<FieldReport>;
      };
      invoice_drafts: {
        Row: InvoiceDraft;
        Insert: InvoiceDraftInsert;
        Update: Partial<InvoiceDraft>;
      };
      quotes: {
        Row: Quote;
        Insert: QuoteInsert;
        Update: Partial<Quote>;
      };
      approvals: {
        Row: Approval;
        Insert: ApprovalInsert;
        Update: never;
      };
      trust_settings: {
        Row: TrustSetting;
        Insert: TrustSettingInsert;
        Update: Partial<TrustSetting>;
      };
    };
  };
};
