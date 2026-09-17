-- OfficePal MVP -- Nina-piloten
-- Track 1 (Schema & kontrakt) -- se BUILD-CONTRACT.md "Databaskontrakt"
--
-- Kor detta mot en FARSK Supabase-databas. Se SETUP.md for instruktioner.
--
-- Multi-tenancy: varje tabell (utom tenants sjalvt) har en tenant_id-kolumn,
-- ett index pa den, och Row Level Security scopead mot den.
--
-- RLS-strategi (se SETUP.md for fullstandig forklaring):
--   - Adminanvandare loggar in via Supabase Auth. Deras tenant_id laggs i
--     app_metadata pa auth-anvandaren (Track 7 ager onboarding/inloggning).
--     app.current_tenant_id() laser ut den claimen ur JWT:t.
--   - Faltpersonal autentiseras INTE via Supabase Auth (ingen losenordsauth,
--     se staff.access_code). Deras requests gar via en Next.js API-route som
--     validerar access_code server-side och sedan skriver med service-role-
--     nyckeln, vilket kringgar RLS helt (standard Supabase-monster for
--     betrodd server-kod). RLS har skyddar alltsa primart direkt klientatkomst
--     (t.ex. admin-dashboarden) mot att lasa/skriva utanfor sin egen tenant.
--   - Orchestratorn (Track 2) anvander ocksa service-role-nyckeln.

create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------------
-- Helper: las ut tenant_id fran den inloggade adminanvandarens JWT.
-- Returnerar null om ingen matchande claim finns (t.ex. service-role-anrop,
-- vilka andå kringgar RLS och aldrig konsulterar denna funktion).
-- ---------------------------------------------------------------------------
create schema if not exists app;

create or replace function app.current_tenant_id()
returns uuid
language sql
stable
as $$
  select nullif(
    coalesce(
      auth.jwt() -> 'app_metadata' ->> 'tenant_id',
      auth.jwt() ->> 'tenant_id'
    ),
    ''
  )::uuid
$$;

-- ---------------------------------------------------------------------------
-- tenants
-- ---------------------------------------------------------------------------
create table if not exists public.tenants (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  settings   jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.tenants enable row level security;

-- Nya tenants skapas server-side (service role, t.ex. onboarding-flodet i
-- Track 7) -- darfor finns ingen publik insert-policy har.
create policy "tenants_select_own" on public.tenants
  for select
  using (id = app.current_tenant_id());

-- ---------------------------------------------------------------------------
-- staff (faltpersonal, ingen losenordsauth -- access_code anvands istallet)
-- ---------------------------------------------------------------------------
create table if not exists public.staff (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  name        text not null,
  access_code text not null,
  created_at  timestamptz not null default now(),
  unique (tenant_id, access_code)
);

create index if not exists staff_tenant_id_idx on public.staff (tenant_id);

alter table public.staff enable row level security;

create policy "staff_select_own_tenant" on public.staff
  for select
  using (tenant_id = app.current_tenant_id());

create policy "staff_insert_own_tenant" on public.staff
  for insert
  with check (tenant_id = app.current_tenant_id());

create policy "staff_update_own_tenant" on public.staff
  for update
  using (tenant_id = app.current_tenant_id())
  with check (tenant_id = app.current_tenant_id());

create policy "staff_delete_own_tenant" on public.staff
  for delete
  using (tenant_id = app.current_tenant_id());

-- ---------------------------------------------------------------------------
-- field_reports
-- ---------------------------------------------------------------------------
create table if not exists public.field_reports (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references public.tenants(id) on delete cascade,
  staff_id   uuid not null references public.staff(id) on delete restrict,
  raw_text   text not null,
  extracted  jsonb,
  status     text not null default 'pending'
             check (status in ('pending', 'processed', 'error')),
  created_at timestamptz not null default now()
);

create index if not exists field_reports_tenant_id_idx on public.field_reports (tenant_id);
create index if not exists field_reports_staff_id_idx on public.field_reports (staff_id);
create index if not exists field_reports_status_idx on public.field_reports (status);

alter table public.field_reports enable row level security;

create policy "field_reports_select_own_tenant" on public.field_reports
  for select
  using (tenant_id = app.current_tenant_id());

create policy "field_reports_insert_own_tenant" on public.field_reports
  for insert
  with check (tenant_id = app.current_tenant_id());

create policy "field_reports_update_own_tenant" on public.field_reports
  for update
  using (tenant_id = app.current_tenant_id())
  with check (tenant_id = app.current_tenant_id());

create policy "field_reports_delete_own_tenant" on public.field_reports
  for delete
  using (tenant_id = app.current_tenant_id());

-- ---------------------------------------------------------------------------
-- invoice_drafts
-- ---------------------------------------------------------------------------
create table if not exists public.invoice_drafts (
  id               uuid primary key default gen_random_uuid(),
  tenant_id        uuid not null references public.tenants(id) on delete cascade,
  field_report_id  uuid references public.field_reports(id) on delete set null,
  customer_name    text not null,
  customer_email   text,
  amount           numeric(12, 2) not null,
  line_items       jsonb not null default '[]'::jsonb,
  status           text not null default 'awaiting_approval'
                   check (status in ('awaiting_approval', 'approved', 'rejected', 'sent')),
  created_at       timestamptz not null default now()
);

create index if not exists invoice_drafts_tenant_id_idx on public.invoice_drafts (tenant_id);
create index if not exists invoice_drafts_field_report_id_idx on public.invoice_drafts (field_report_id);
create index if not exists invoice_drafts_status_idx on public.invoice_drafts (status);

alter table public.invoice_drafts enable row level security;

create policy "invoice_drafts_select_own_tenant" on public.invoice_drafts
  for select
  using (tenant_id = app.current_tenant_id());

create policy "invoice_drafts_insert_own_tenant" on public.invoice_drafts
  for insert
  with check (tenant_id = app.current_tenant_id());

create policy "invoice_drafts_update_own_tenant" on public.invoice_drafts
  for update
  using (tenant_id = app.current_tenant_id())
  with check (tenant_id = app.current_tenant_id());

create policy "invoice_drafts_delete_own_tenant" on public.invoice_drafts
  for delete
  using (tenant_id = app.current_tenant_id());

-- ---------------------------------------------------------------------------
-- quotes
-- ---------------------------------------------------------------------------
create table if not exists public.quotes (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references public.tenants(id) on delete cascade,
  customer_name text not null,
  customer_email text,
  content       text not null,
  status        text not null default 'draft'
                check (status in ('draft', 'sent', 'followed_up', 'accepted', 'expired', 'rejected')),
  sent_at       timestamptz,
  follow_up_at  timestamptz,
  created_at    timestamptz not null default now()
);

create index if not exists quotes_tenant_id_idx on public.quotes (tenant_id);
create index if not exists quotes_status_idx on public.quotes (status);

alter table public.quotes enable row level security;

create policy "quotes_select_own_tenant" on public.quotes
  for select
  using (tenant_id = app.current_tenant_id());

create policy "quotes_insert_own_tenant" on public.quotes
  for insert
  with check (tenant_id = app.current_tenant_id());

create policy "quotes_update_own_tenant" on public.quotes
  for update
  using (tenant_id = app.current_tenant_id())
  with check (tenant_id = app.current_tenant_id());

create policy "quotes_delete_own_tenant" on public.quotes
  for delete
  using (tenant_id = app.current_tenant_id());

-- ---------------------------------------------------------------------------
-- approvals -- insert-only audit-trail. ALDRIG update/delete-policies.
-- ---------------------------------------------------------------------------
create table if not exists public.approvals (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  target_type text not null,
  target_id   uuid not null,
  action      text not null check (action in ('awaiting', 'approved', 'rejected')),
  decided_by  uuid references auth.users(id) on delete set null,
  decided_at  timestamptz not null default now()
);

create index if not exists approvals_tenant_id_idx on public.approvals (tenant_id);
create index if not exists approvals_target_idx on public.approvals (target_type, target_id);

alter table public.approvals enable row level security;

-- Endast SELECT och INSERT -- ingen UPDATE/DELETE-policy skapas nagonsin.
-- Med RLS paslaget och utan matchande policy nekas UPDATE/DELETE som default,
-- oavsett roll (forutom service_role/superuser som kringgar RLS).
create policy "approvals_select_own_tenant" on public.approvals
  for select
  using (tenant_id = app.current_tenant_id());

create policy "approvals_insert_own_tenant" on public.approvals
  for insert
  with check (tenant_id = app.current_tenant_id());

-- ---------------------------------------------------------------------------
-- trust_settings -- fortroendereglage per tenant och uppgiftstyp
-- ---------------------------------------------------------------------------
create table if not exists public.trust_settings (
  tenant_id  uuid not null references public.tenants(id) on delete cascade,
  task_type  text not null,
  level      text not null default 'ask_always'
             check (level in ('ask_always', 'ask_if_unsure', 'autonomous')),
  created_at timestamptz not null default now(),
  primary key (tenant_id, task_type)
);

create index if not exists trust_settings_tenant_id_idx on public.trust_settings (tenant_id);

alter table public.trust_settings enable row level security;

create policy "trust_settings_select_own_tenant" on public.trust_settings
  for select
  using (tenant_id = app.current_tenant_id());

create policy "trust_settings_insert_own_tenant" on public.trust_settings
  for insert
  with check (tenant_id = app.current_tenant_id());

create policy "trust_settings_update_own_tenant" on public.trust_settings
  for update
  using (tenant_id = app.current_tenant_id())
  with check (tenant_id = app.current_tenant_id());

create policy "trust_settings_delete_own_tenant" on public.trust_settings
  for delete
  using (tenant_id = app.current_tenant_id());
