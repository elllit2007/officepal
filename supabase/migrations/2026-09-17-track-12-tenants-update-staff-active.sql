-- Track 12 — migrering för BEFINTLIGA databaser.
--
-- schema.sql är uppdaterat med samma sak för färska databaser; kör den här
-- filen manuellt (Supabase Dashboard → SQL Editor) mot det levande
-- projektet. Idempotent: kan köras flera gånger.
--
-- 1. tenants får en update-policy scopead mot egen tenant, så att
--    företagsnamnet kan ändras via cookie-klienten utan service-role.
-- 2. staff får en active-flagga (default true) för mjuk inaktivering /
--    återaktivering i stället för hård borttagning.

-- 1. tenants_update_own ---------------------------------------------------
drop policy if exists "tenants_update_own" on public.tenants;
create policy "tenants_update_own" on public.tenants
  for update
  using (id = app.current_tenant_id())
  with check (id = app.current_tenant_id());

-- 2. staff.active ----------------------------------------------------------
alter table public.staff
  add column if not exists active boolean not null default true;

create index if not exists staff_tenant_id_active_idx
  on public.staff (tenant_id, active);
