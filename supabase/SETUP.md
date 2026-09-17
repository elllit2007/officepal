# Supabase-setup — OfficePal MVP (Nina-piloten)

Track 1 äger detta kontrakt. Se `../BUILD-CONTRACT.md` för helheten.

## 1. Skapa ett Supabase-projekt

1. Gå till https://supabase.com/dashboard och skapa ett nytt projekt.
2. Spara följande från **Project Settings → API**:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (hemlig, endast server-side —
     används av Next.js API-routes och orchestratorn, ALDRIG i klientkod)

## 2. Kör schemat

Via Supabase Dashboard → SQL Editor, kör i denna ordning:

1. `supabase/schema.sql` — tabeller, index, RLS-policys.
2. `supabase/seed.sql` — dummy-tenant, personal och default trust_settings
   (valfritt, men rekommenderat för lokal utveckling/demo).

Eller via Supabase CLI, från repo-roten:

```bash
supabase link --project-ref <ditt-project-ref>
supabase db push --file supabase/schema.sql
psql "$(supabase db url)" -f supabase/seed.sql
```

## 3. Hur RLS är tänkt att fungera

Varje tabell (utom `tenants`, som scopas mot sitt eget `id`) har en
`tenant_id`-kolumn, ett index på den, och RLS-policys som jämför raden mot
`app.current_tenant_id()` — en helper-funktion i schemat som läser
`tenant_id` ur den inloggade adminanvändarens JWT (`app_metadata.tenant_id`).

Två olika vägar in i systemet, två olika åtkomstmönster:

- **Adminanvändare (Nina, via Track 7:s inloggning):** vanlig Supabase Auth.
  När en admin-användare skapas/onboardas måste `tenant_id` sättas i
  användarens `app_metadata` (t.ex. via `supabase.auth.admin.updateUserById`
  med service-role-nyckeln). Utan detta claim matchar RLS ingenting och
  admin-användaren ser inga rader.
- **Fältpersonal (via `staff.access_code`, ingen Supabase Auth):** dessa
  användare har inget Supabase-sessions-JWT alls. Deras skrivningar
  (fältrapporter) och orchestratorns skrivningar (invoice_drafts, quotes,
  approvals) måste därför gå via en Next.js API-route eller orchestrator-
  tjänsten som använder `SUPABASE_SERVICE_ROLE_KEY`, vilket kringgår RLS
  helt. Access-koden valideras server-side innan skrivningen sker.

Det betyder: **RLS är ett skyddsnät för direkt klientåtkomst (admin-
dashboarden), inte den enda skyddsmekanismen.** All skrivande logik som
körs av orchestratorn eller fältrapport-API:t måste själv validera
`tenant_id`/`access_code` innan den skriver, eftersom service-role kringgår
RLS.

## 4. `approvals` är insert-only

Tabellen har medvetet ENDAST `select`- och `insert`-policys. Det finns ingen
`update`- eller `delete`-policy — med RLS påslaget innebär det att UPDATE och
DELETE nekas för alla roller utom `service_role`/superuser. Rör inte detta
utan att flagga det, det är audit-trailen för alla godkännanden.

## 5. Miljövariabler för Next.js (`.env.local`)

```
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>   # server-only, lägg ALDRIG i NEXT_PUBLIC_*
```

Vercel: `vercel env add SUPABASE_SERVICE_ROLE_KEY` (eller motsvarande i
dashboarden), scopead till rätt miljö. Lägg aldrig service-role-nyckeln i
en `NEXT_PUBLIC_*`-variabel.

## 6. Statusenum-beslut (för framtida ändringar)

Status- och nivå-kolumner (`field_reports.status`, `invoice_drafts.status`,
`quotes.status`, `trust_settings.level`, `approvals.action`) är
implementerade som `text` + `check`-constraint, inte native Postgres-enum.
Det gör det enklare att lägga till nya värden senare (`alter table ...
drop constraint ...` + `add constraint ...` istället för `alter type`).
`lib/types.ts` har motsvarande TypeScript union-typer — håll dem i synk om
constraints ändras.
