# OfficePal MVP — Nina-piloten — Byggkontrakt
### Läses av VARJE Claude Code-session innan arbete påbörjas. Ändra inte detta dokument utan att flagga det till Elliot.

Mål: skarp pilot för Nina (städbolag, 150 anställda) på en vecka. Kundtjänst/röst byggs INTE denna vecka. Fokus: fältrapport → fakturautkast → godkännande (HITL via figuren) → offerter → e-postutskick.

## Stack
- **UI + tunna API-routes:** Next.js på Vercel.
- **Orchestrator ("hjärnan"):** separat Node-tjänst med Claude Agent SDK, hostad på Fly.io eller Render (free tier). Next.js anropar denna via HTTP, bygger inte agentlogik själv.
- **Databas/Auth/Storage:** Supabase.
- **E-post:** Resend.
- **Figur:** React-komponent med Framer Motion, fyra lägen: idle | listening | asking | done.

## Track-ägarskap (en session = en mapp, undvik att röra andra tracks filer)
1. supabase/schema.sql + lib/types.ts — Track 1 (schema & kontrakt)
2. orchestrator/ (egen repo/tjänst) — Track 2 (Agent SDK)
3. app/faltrapport/ — Track 3
4. app/admin/ — Track 4
5. components/Kollegan/ — Track 5
6. lib/email/ + app/api/cron/ — Track 6
7. app/auth/ + app/onboarding/ — Track 7

## Databaskontrakt (Track 1 äger, övriga läser lib/types.ts — ändra ej förrän Track 1 pushat)
Tabeller (preliminärt, Track 1 finaliserar):
- tenants (id, name, settings jsonb — inkl. förtroendereglage-inställningar per uppgiftstyp)
- staff (id, tenant_id, name, access_code — ingen lösenordsauth för fältpersonal)
- field_reports (id, tenant_id, staff_id, raw_text, extracted jsonb, status: pending|processed|error, created_at)
- invoice_drafts (id, tenant_id, field_report_id, customer_name, amount, line_items jsonb, status: awaiting_approval|approved|rejected|sent, created_at)
- quotes (id, tenant_id, customer_name, content, status: draft|sent|followed_up|accepted|expired, sent_at, follow_up_at)
- approvals (id, tenant_id, target_type, target_id, action, decided_by, decided_at) — insert-only, aldrig UPDATE/DELETE
- trust_settings (tenant_id, task_type, level: ask_always|ask_if_unsure|autonomous)

## Orchestratorns verktyg (Track 2 äger kontraktet, Track 3/4 anropar via API, ej direkt)
- extract_field_report(raw_text) → structured_data — strikt JSON-schema, ingen fri gissning på pris.
- create_invoice_draft(structured_data) → invoice_draft — kräver godkännande enligt trust_settings.
- create_quote_draft(input) → quote — samma princip.
- check_trust_level(tenant_id, task_type) → level — avgör om åtgärd kräver godkännande eller körs autonomt.
- Varje skrivande verktyg loggar till approvals (hook, insert-only) — detta är audit-trailen.

## Figurens tillståndskontrakt (Track 5 äger komponenten, Track 3/4 importerar och styr state-prop)
- idle — inget väntar.
- listening — aktiv inspelning/inmatning pågår (fältrapport-sidan).
- asking — något väntar på godkännande (visas i admin-dashboarden, med pratbubbla som beskriver ÅTGÄRDEN, inte bara "något väntar").
- done — precis godkänt/genomfört, kort bekräftelseanimation.

## Regler som gäller ALLA tracks
- Inget pris genereras fritt av AI — alltid uppslag mot strukturerad, av Nina godkänd data, eller flaggas som offert.
- Ingen skrivande åtgärd exekveras utan att passera trust_settings-kontrollen.
- Svenska i allt användargränssnitt.
- PWA-manifest läggs till av Track 4 (admin) tidigt så "Lägg till på hemskärmen" fungerar från dag ett.
- Committa och pusha ofta, små commits — sju parallella sessioner betyder fler möjliga konflikter, inte färre.

## Status
Skapad: nu. Track 1 börjar omedelbart. Övriga tracks kan påbörja UI-skelett mot preliminärt kontrakt ovan innan Track 1:s första push, men rör inte skarpa databasanrop förrän types.ts finns.
