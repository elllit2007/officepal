# Track 12 — anteckningar och beslut

Kort logg över bedömningar som gjorts utan Elliot i rummet, och luckor i
schemat som kontosidan stött på. Inget här blockerar; allt fungerar med
schemat som det är.

## Kontosidan (/admin/profile)

### Schemaluckor (lib/types.ts / supabase/schema.sql)

- **Plan/abonnemang saknas.** Ingen kolumn eller tabell beskriver vilken plan
  en tenant har. Sidan visar `tenants.settings.plan` om den finns, annars
  "Pilot". Förslag: `tenants.plan text` (eller behåll i `settings` jsonb med
  ett dokumenterat schema) när prissättning finns.
- **Ingen inaktiv-flagga på staff.** "Återkalla" finns inte som begrepp i
  schemat. `field_reports.staff_id` är `on delete restrict`, så personer med
  rapporter kan inte tas bort. Sidan erbjuder därför två saker: **Ny kod**
  (ogiltigförklarar den gamla direkt, historik bevaras — det rekommenderade
  sättet att stänga av åtkomst) och **Ta bort** (bara möjligt utan
  rapporter; annars visas ett tydligt fel som pekar på "Ny kod"). Förslag:
  `staff.revoked_at timestamptz` + att `/api/faltrapport` avvisar koder för
  återkallade personer.
- **tenants har bara select-policy.** Företagsnamnet uppdateras via
  service-role-klienten efter att sessionens `app_metadata.tenant_id`
  verifierats (samma mönster som onboarding). Alternativ: lägg till en
  `tenants_update_own`-policy i schemat så att cookie-klienten räcker.
- **Ingen tabell för admin-profil** (namn, telefon, roll). Sidan visar det
  Supabase Auth har: e-post, skapad, senast inloggad. E-postbyte går via
  Supabase (bekräftelselänk); lösenordsbyte kräver nuvarande lösenord, som
  verifieras i en sessionslös klient innan `auth.updateUser`.
- **Uppgiftstyper är inte en enum.** `trust_settings.task_type` är fri text.
  Kontosidan visar de tre typer som seed.sql definierar
  (`invoice_draft`, `quote_draft`, `field_report_extraction`) och skriver
  bara dessa. Saknas en rad visas schemats default `ask_always`.

### Bedömningar

- Kontosidan är en Server Component som läser via cookie-sessionen så att
  RLS scopar allt; skrivningar ligger i `app/admin/profile/actions.ts`.
- `/admin` (Track 4) läser fortfarande med en sessionslös anon-klient
  (`app/admin/lib/supabaseClient.ts`), vilket med RLS ger noll rader för en
  inloggad admin. Det är utanför Track 12:s scope och lämnas orört, men
  bör bytas till `@supabase/ssr`-browserklienten i `app/auth/lib/supabase/client.ts`.
- Borttagning av personal kräver ett andra klick ("Ja, ta bort") i raden —
  ingen `window.confirm`, som blockerar och inte matchar designen.

## Kollegan som ambient närvaro

- `/admin`: hjältefiguren lyssnar under hämtning, frågar när något väntar,
  bekräftar kort efter beslut. "Nytt ärende"-puls bara när ett id dyker upp
  som inte fanns i förra hämtningen. Hjältekortet har fast min-höjd så att
  pratbubblan inte flyttar listorna; vid uppdatering dimmas listorna i
  stället för att bytas ut.
- `LoadingPresence` (liten lyssnande Kollegan + en rad) används vid första
  laddningen av dashboarden och som `loading.tsx` för kontosidan.
- Medvetet **inte** en extra figur i inloggning/onboarding (knappens
  spinner räcker) eller under fältrapportens sändning (figuren står lugnt
  kvar, underraden byter text) — på små skärmar skulle en till animerad
  figur konkurrera med formuläret.

## Övrigt

- `inspiration/` och `DESIGN-BRIEF.md` är inte committade (3,5 MB
  skärmdumpar) — Elliots beslut.
- `.env.local` kopierades från huvudcheckouten till worktreet för lokal
  körning; filen är gitignorad.
