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
- **Löst: `staff.active`.** Kolumnen (default true) finns nu i
  `supabase/schema.sql` och `lib/types.ts`; kontosidan inaktiverar/
  återaktiverar i stället för att ta bort. **Kvar att göra (Track 3):**
  `/api/faltrapport` matchar fortfarande bara på `access_code` och måste
  lägga till `.eq("active", true)` i staff-uppslaget — annars kan en
  inaktiverad person fortfarande rapportera. Tills dess är "Ny kod" det
  som faktiskt stänger av åtkomsten.
- **Löst: `tenants_update_own`.** Update-policy scopead mot egen tenant.
  Företagsnamnet sparas nu via cookie-klienten, ingen service-role.
- **Måste köras manuellt mot det levande projektet:**
  `supabase/migrations/2026-09-17-track-12-tenants-update-staff-active.sql`
  (idempotent). schema.sql är uppdaterad för färska databaser.
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
- Inaktivering är ett klick (den är reversibel); ingen hård borttagning
  finns i UI:t längre.

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
