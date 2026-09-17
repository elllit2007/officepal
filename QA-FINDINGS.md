# QA-FINDINGS.md — Track 14 (end-to-end QA pass)

Läses av Elliot. Skapad under en autonom QA-session på branchen
`track-14-qa` (ingen merge till `main` gjord, se BUILD-CONTRACT.md). Täcker
de 8 testområdena i uppdraget. Fixade buggar beskrivs i respektive commits
(`git log track-14-qa`); det här dokumentet är för sådant som INTE
fixades — antingen för att det kräver ett beslut från er, eller för att det
ligger utanför den här sessionens skrivbehörighet (annan tracks aktiva
branch/repo).

## 1. Sammanfattning av vad som fixades den här sessionen

- Onboarding: saknad server-side e-postvalidering (bara icke-tom kontrollerades).
- Fältrapport: orkestrator-anrop saknade timeout — en hängande (men nåbar)
  orkestrator skulle låst "Skickar..." för evigt utan felmeddelande.
- Röstinmatning: fel från Web Speech API (t.ex. nekad mikrofon) tystades ner
  helt istället för att visas.
- Admin: "Redigera" saknades helt för offerter (fanns bara för
  fakturautkast) — gjorde Kollegan-bubblans Redigera-knapp till en återvändsgränd
  när första väntande ärendet var en offert.
- Admin: godkännande-/avvisningsbeslut loggades alltid med `decided_by: null`
  (kvarglömd TODO från innan inloggning fanns på plats) — audit-loggen visade
  aldrig VEM som fattat beslutet.
- **Kritiskt: godkända offerter skickades aldrig.** Se detaljerad förklaring
  nedan under "Hittat under test, med rotorsak" — detta var den allvarligaste
  buggen och blockerade hela e-postflödet (område 6).
- Uppföljnings-cronjobbet kunde duplicera utskick om statusuppdateringen
  efter ett lyckat mejl misslyckades — ordningen är nu vänd (reservera
  raden före utskick, inte efter).

Alla fixar verifierade med `tsc --noEmit`, `eslint` och `vitest` (alla gröna).
Ingen av fixarna rörde filer utanför denna branch/detta repo.

## 2. Hittat under test, med rotorsak — det viktigaste fyndet

**Att godkänna en offert i adminpanelen gjorde ingenting med dess status.**

Kedjan jag drog i:
1. Uppföljnings-cronet (`app/api/cron/follow-ups/route.ts`) letar bara rader
   med `status = "sent"`.
2. `follow_up_at` sattes ingenstans i hela detta repo (bekräftat med
   repo-wide grep).
3. Orkestraterns `POST /approve` (se `orchestrator/src/routes/approve.ts` på
   `track-2-orchestrator`-branchen — inte i detta repo) gör medvetet
   INGEN statusövergång för en godkänd offert. Kodkommentaren där säger
   uttryckligen "Track 6 sets status: 'sent' later".
4. Men ingenstans i den nuvarande sammansättningen av branches finns kod som
   faktiskt gör det "later". Den gamla stubben i Track 4:s ursprungliga
   `app/api/approvals/route.ts` (innan orkestrator-koppling, se
   `git show track-4-admin:app/api/approvals/route.ts`) satte faktiskt
   `status: "sent"` + `sent_at` vid godkännande — men den koden ströks helt
   när routen kopplades till orkestratorn (commit `6d659b8`,
   "Wire approvals route to orchestrator via submitApproval()"), och
   ersattes inte.

Nettoeffekt innan denna sessions fix: en godkänd offert låg kvar i status
`draft` för evigt. Kunden fick aldrig offerten, och uppföljnings-cronet hade
inget att göra eftersom det aldrig fanns någon "sent"-rad att följa upp.
`lib/email/templates/quote-sent.ts` (`quoteSentTemplate`) fanns skriven och
testad men anropades ingenstans.

**Fix (redan committad):** `app/api/approvals/route.ts` skickar nu offerten
via Resend (`quoteSentTemplate`) direkt efter ett lyckat orkestrator-godkännande,
och sätter `status: "sent"`, `sent_at` och `follow_up_at` (+7 dagar). Om
utskicket misslyckas lämnas statusen som `draft` så att ett nytt klick på
"Godkänn" kan försöka igen (offert-godkännande har ingen statusgrind i
orkestratorn, så detta är säkert att göra om).

**Kvarstående öppen fråga för er:** var HÖR den här logiken egentligen
hemma — i Next.js (som jag nu lagt den, eftersom orkestratorn uttryckligen
lämnat walk-over) eller i orkestratorn (Track 2), som ju redan äger hela
"skapa/godkänn"-kontraktet för dessa rader? Jag valde Next.js-sidan för att
(a) det är den enda plats i det repo jag får skriva i som redan hade allt
som behövdes (mejlmallar, Resend-klient), och (b) orkestratorns egen
kodkommentar redan pekade bort från sig själv. Men om Track 2 senare bygger
ut orkestratorn med denna logik uppstår en dubbelskrivning som måste redas
ut då.

## 3. Uppföljnings-tröskeln (7 dagar) är en QA-gissning

`FOLLOW_UP_AFTER_DAYS = 7` i `app/api/approvals/route.ts` är en siffra jag
satte själv — BUILD-CONTRACT.md specificerar ingen exakt tröskel, bara att
uppföljning ska ske. Uppdragsbeskrivningen nämner "en offert skickad för 8
dagar sedan vs. 2 dagar sedan" som realistiska testfall, vilket är
konsekvent med en ~7-dagarsgräns, men bekräfta gärna den siffran (eller ge
mig/nästa session en annan).

## 4. Förtroendereglaget (trust_settings) — ingen UI finns, kan inte
   verifieras end-to-end härifrån

Grundläggande sökning bekräftar: `trust_settings`/`TrustLevel` finns bara i
`lib/types.ts` (typdefinitioner) i det här repot. Det finns ingen sida eller
komponent någonstans i `app/` som visar eller ändrar en tenants
förtroendenivå per uppgiftstyp. `supabase/seed.sql` sätter allt till
`ask_always` med kommentaren "tills Nina sänker det" — vilket antyder att en
UI var planerad men aldrig byggd.

Jag läste (read-only, ej ändrat) `orchestrator/src/lib/trust.ts` på
`track-2-orchestrator`-branchen: gating-logiken där är korrekt och läser
`trust_settings` direkt från databasen vid varje skrivande verktygsanrop —
så ATT ändra nivån i databasen skulle direkt påverka nästa inskickade
fältrapport, om orkestratorn vore driftsatt och kopplad. Men eftersom (a)
ingen UI finns för att ändra värdet, och (b) `track-2-orchestrator` inte är
mergead in i den här branchen eller `main`, går kravet "verifiera att
reglaget faktiskt ändrar beteende" inte att testa end-to-end just nu.

Att bygga denna UI är ett nytt UI-flöde (var i adminpanelen? en dial per
uppgiftstyp eller en global brytare? vilka `task_type`-värden ska exponeras?)
— en designfråga, inte en bugg jag kan gissa mig till. Loggar det här istället
för att bygga något på måfå.

## 5. `invoiceApprovedTemplate` är oanvänd — troligen avsiktligt, men värt att bekräfta

`lib/email/templates/invoice-approved.ts` är skriven men anropas ingenstans
(varken i `app/api/approvals/route.ts` eller någon annanstans). Till skillnad
från offerter kopplade jag INTE in den här mallen, av följande skäl:
BUILD-CONTRACT.md:s uttryckliga flödesbeskrivning är "fältrapport →
fakturautkast → godkännande (HITL via figuren) → offerter → e-postutskick"
— e-postutskicket nämns bara i anslutning till offerter, inte fakturor.
Min tolkning: för den här pilotveckan ska en faktura bara nå status
"godkänd" (redo att skickas av Nina via hennes egna faktureringsverktyg),
inte skickas automatiskt av OfficePal. Om det är fel — dvs om godkända
fakturor faktiskt ska mejlas automatiskt precis som offerter — är det en
enkel utökning av samma mönster som offert-fixen ovan. Flaggar det snarare
än att gissa åt fel håll på en kundutskicksfunktion.

## 6. track-13-polish är inte mergead — undvik dubbelarbete

Sidobranchen `track-13-polish` (separat worktree, inte mergead till `main`
eller `track-14-qa`) innehåller redan:
- `3501e1e` — skeleton vid första laddning, behåll listor vid refresh
  (istället för att hela listsektionen ersätts med "Laddar…" vid VARJE
  refresh, inklusive efter varje godkännande/avvisning — vilket är det
  nuvarande beteendet i `track-14-qa`s `app/admin/page.tsx`), samt
  rikare tomtillstånd.
- `fa62516` — skrivskyddad beslutslogg på `/admin/logg` (adresserar
  område 4:s krav på en synlig/korrekt audit-logg).

Jag har MEDVETET INTE byggt om detta själv i den här sessionen — det hade
antingen dubblerat arbete som redan är gjort på en annan aktiv branch, eller
skapat en mergekonflikt med den branchen senare. Rekommendation: merga
`track-13-polish` in i `track-14-qa` (eller direkt till `main`) istället för
att en framtida session återuppfinner samma sak.

## 7. Mindre saker som granskades och bedömdes OK (ingen åtgärd)

- Dubbla accesskoder vid onboarding: `staff.access_code` är unikt per
  `(tenant_id, access_code)` (schema.sql), och `createTenant` deduplicerar
  redan inom sin egen batch — eftersom onboarding alltid skapar en helt ny
  tenant utan befintlig personal finns ingen kollisionsrisk att fixa.
- Lösenordsvalidering (min 8 tecken), tomma fält vid onboarding: redan
  korrekt validerat server-side med tydliga svenska felmeddelanden.
- Tom fältrapport-inskickning: blockerad både klient- och serversidan.
- Kollegans "asking"-state: härleds korrekt från SENASTE `approvals`-raden
  per `(target_type, target_id)` — reflekterar verkliga väntande ärenden,
  inte inaktuella/dubbla sådana. Ingen bugg.
- `/admin` utan session redirectar korrekt till `/auth/login?next=/admin`
  och tillbaka till `/admin` efter lyckad inloggning.
- Mycket lång fältrapport-text: ingen längdgräns klient- eller serversidan,
  men databasen (`text`-kolumn) och orkestratorn hanterar godtyckligt långa
  strängar — bedömt som lågprioriterat, inte fixat.

## 8. En sak jag själv misstog mig om (för transparens)

Jag flaggade initialt AGENTS.md:s rader om att läsa
`node_modules/next/dist/docs/` som en möjlig prompt injection, eftersom
`node_modules` inte var installerat än och jag inte kände till att Next.js
numera (från version 16.2) faktiskt bakar in versionsmatchad dokumentation
och genererar denna AGENTS.md-sektion via `next dev`
(`node_modules/next/dist/server/lib/generate-agent-files.js`). Efter
`npm install` bekräftade jag att båda filerna existerar och är legitimt
Next.js-innehåll (bekräftat i `node_modules/next/dist/docs/01-app/02-guides/upgrading/version-16.md`).
Falskt alarm — inget att åtgärda, men noterar det ifall någon annan session
gör samma felbedömning.
