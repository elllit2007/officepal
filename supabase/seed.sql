-- OfficePal MVP — Nina-piloten
-- Track 1 (Schema & kontrakt) — utvecklingsseed.
--
-- Kör EFTER schema.sql mot en färsk databas. Idempotent: kan köras om utan
-- att skapa dubbletter (matchar på tenants.name / staff.access_code).
--
-- OBS: access_code här är enkla dummyvärden för lokal utveckling, inte
-- produktionslämpliga koder.

do $$
declare
  v_tenant_id uuid;
begin
  -- ---------------------------------------------------------------------
  -- Tenant: Nina's städbolag
  -- ---------------------------------------------------------------------
  select id into v_tenant_id from public.tenants where name = 'Ninas Städservice';

  if v_tenant_id is null then
    insert into public.tenants (name, settings)
    values (
      'Ninas Städservice',
      jsonb_build_object(
        'timezone', 'Europe/Stockholm',
        'locale', 'sv-SE'
      )
    )
    returning id into v_tenant_id;
  end if;

  -- ---------------------------------------------------------------------
  -- Dummy-personal
  -- ---------------------------------------------------------------------
  insert into public.staff (tenant_id, name, access_code)
  values
    (v_tenant_id, 'Nina Karlsson', '1001'),
    (v_tenant_id, 'Erik Lindqvist', '1002'),
    (v_tenant_id, 'Amira Hassan', '1003'),
    (v_tenant_id, 'Johan Bergström', '1004')
  on conflict (tenant_id, access_code) do nothing;

  -- ---------------------------------------------------------------------
  -- Default trust_settings — allt kräver godkännande tills Nina sänker det.
  -- ---------------------------------------------------------------------
  insert into public.trust_settings (tenant_id, task_type, level)
  values
    (v_tenant_id, 'invoice_draft', 'ask_always'),
    (v_tenant_id, 'quote_draft', 'ask_always'),
    (v_tenant_id, 'field_report_extraction', 'ask_always')
  on conflict (tenant_id, task_type) do nothing;
end $$;
