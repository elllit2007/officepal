# OfficePal — Designsystem

Det här är standarden för allt som byggs i OfficePal. Nya tracks bygger mot
tokens och komponenter här — inte mot egna hexkoder, mått eller ad hoc-stilar.

Levande referens: `/design` (kräver inloggning). Källa: `design/tokens.ts`.

## Känslan

Pålitlig, i kontroll, svensk enkelhet. För Nina — som driver ett företag med
folk i fält och inte är tekniker. Tryggt och tydligt före flashigt.

Konkret betyder det:

- **Varm papperston som canvas**, vita kort ovanpå. Inte kall gråblå.
- **Blå som handling.** En primärknapp per vy. Navy för rubriker.
- **Piller och generösa hörn.** Knappar, badges och nav är runda; kort har 20px radie.
- **Lugn text.** Stor hälsning, kort underrad ("Lugnt just nu."), inga utropstecken.
- **Kollegan är figuren.** Hon frågar innan något skickas — det är produktens löfte, och pratbubblan är alltid konkret om *vad* som väntar.

## Tokens

`design/tokens.ts` är källan till sanning. `design/tokens.css` speglar den som
Tailwind v4 `@theme`, så varje token finns både som utility-klass och som
CSS-variabel. `design/tokens.test.ts` ser till att filerna inte glider isär —
ändra alltid båda.

| Vad | Tailwind | CSS-variabel |
| --- | --- | --- |
| Primär blå (50–900) | `bg-primary-500`, `text-primary-700` | `--color-primary-500` |
| Neutraler (0–900, varma) | `bg-neutral-100`, `border-neutral-300` | `--color-neutral-100` |
| Semantiska | `bg-success-soft text-success-ink border-success-line`, `bg-danger` | `--color-success`, `--color-success-soft` … |
| Roller | `bg-canvas`, `bg-surface`, `bg-surface-muted`, `bg-surface-brand`, `bg-surface-ink` | `--color-canvas` … |
| Kantlinjer | `border-line`, `border-line-strong`, `border-line-brand` | `--color-line` |
| Text | `text-ink` (rubriker), `text-fg` (brödtext), `text-muted`, `text-link`, `text-on-brand` | `--color-ink` … |
| Typskala | `text-display`, `text-h1`…`text-h4`, `text-body-lg`, `text-body`, `text-body-sm`, `text-label`, `text-button`, `text-caption`, `text-eyebrow` | `--text-h1`, `--text-h1--line-height` … |
| Typsnitt | `font-sans` (DM Sans), `font-mono` (DM Mono) | `--font-sans`, `--font-mono` |
| Radie | `rounded-xs` 6 · `sm` 8 · `md` 12 · `lg` 16 · `xl` 20 · `2xl` 28 · `full` | `--radius-lg` |
| Skugga | `shadow-xs` · `sm` · `md` · `lg` · `shadow-focus` | `--shadow-md` |
| Rörelse | `duration-fast` 120 · `duration-base` 200 · `duration-slow` 320, `ease-out`, `ease-in-out` | `--duration-base`, `--ease-out` |
| Layout | `max-w-[var(--layout-content-max)]`, `max-w-[var(--layout-narrow-max)]` | `--layout-sidebar-width`, `--layout-topbar-height` |

Semantiska färger har fyra steg: **solid** (`bg-success`) för ikoner och
prickar, **soft** (`bg-success-soft`) som bakgrund, **line** som kantlinje och
**ink** som text. Använd dem tillsammans; blanda inte in Tailwinds
`emerald-500`.

Spacing är Tailwinds 4px-skala (`gap-4` = 16px). Håll dig till 1, 2, 3, 4, 5,
6, 8, 10, 12, 16, 20.

I JS/TS (t.ex. Framer Motion som behöver riktiga färgvärden) importerar du från
tokens: `import { primary, semantic, motion } from "@/design/tokens"`.

### Regler

1. **Aldrig hexkoder i komponenter.** Om en färg saknas — lägg till den i tokens (båda filerna) och beskriv rollen.
2. **Rollklasser före skalsteg.** `bg-surface` och `text-muted` hellre än `bg-white` och `text-neutral-500`. Då kan vi byta ton på ett ställe.
3. **Typskalan är rollbaserad.** `text-h2` för en sektionsrubrik, inte `text-2xl font-semibold`.
4. **Fokus sköts globalt.** `:focus-visible` och `focus-visible:shadow-focus` finns redan; ta inte bort outline.
5. **Rörelse är kort och lugn.** Basen är 200 ms med `ease-out`. Inga studsar utom Kollegans.

## Typografi

**DM Sans** (variabel, optisk storlek) för allt löpande, **DM Mono** för
accesskoder, belopp och tekniska värden. Laddas i `app/layout.tsx` via
`next/font` — lägg inte till andra typsnitt.

| Roll | Storlek / radhöjd | Vikt | Används till |
| --- | --- | --- | --- |
| display | 40 / 44 | 700 | Sidhälsning på desktop ("God eftermiddag.") |
| h1 | 32 / 38 | 700 | Sidrubrik |
| h2 | 24 / 30 | 600 | Kortrubrik, sektion i gallery |
| h3 | 20 / 26 | 600 | Kortrubrik i lista |
| h4 | 17 / 24 | 600 | Sektionsrubrik, listpost |
| body-lg | 18 / 28 | 400 | Underrad, fält för fältpersonal |
| body | 16 / 24 | 400 | Brödtext |
| body-sm | 14 / 20 | 400 | Hjälptext, metadata |
| label | 14 / 20 | 500 | Etiketter, nav |
| button | 15 / 20 | 600 | Knappar (md) |
| caption | 12 / 16 | 400 | Tidsstämplar, badges |
| eyebrow | 12 / 16, 0.08em | 600 | Överrad i versaler |

Siffror som ska linjera (belopp, nyckeltal): lägg till `tabular-nums`.

## Komponenter

Allt exporteras från `@/components/ui`.

| Komponent | Använd när | Anteckning |
| --- | --- | --- |
| `Button`, `ButtonLink` | All klickbar handling | `variant`: primary · secondary · destructive · ghost. `size`: sm · md · lg. `loading` ger spinner. **En primär per vy.** Destruktiv är mjuk röd tills hover — tryggt men tydligt. |
| `Card` (+ `CardHeader`, `CardTitle`, `CardDescription`, `CardFooter`) | Allt innehåll ovanpå canvas | `tone`: default · muted · brand · ink. `tag` ger en liten etikett-"öra" ovanför. `highlighted` när Kollegan pekar på kortet. `as="li"` i listor. |
| `SectionHeading` | Rubrik över en lista | `id` för ankarlänkar från nav. |
| `Badge` | Etiketter, räknare | `tone`: neutral · brand · info · success · warning · danger, `dot`. |
| `StatusBadge` | Statuskoder från `lib/types.ts` | Mappar `awaiting_approval`, `sent`, `processed` … till svensk text och ton. Lägg nya statusar där, inte i sidor. |
| `Field` + `Input` / `Textarea` / `Select` | Alla formulär | `Field` ger etikett, hjälptext och fel (`role="alert"`). `size="lg"` för fältpersonal på mobil. `invalid` för felstil. `mono` för koder. |
| `CodeChip` | Accesskoder | Lätt att läsa av från skärm. |
| `Alert` | Inline-meddelanden | `tone`: info · success · warning · danger. Fel får `role="alert"` automatiskt. |
| `AppShell`, `NavLink` | Admin-vyer | Sidopanel på desktop, topprad med rullbara piller på mobil. `items` med `href`, `label`, `icon`. Ankarlänkar (`/admin#offerter`) markeras aldrig aktiva. |
| `PageContainer`, `PageHeader` | Sidlayout | Header: `eyebrow` (datum), `title` (hälsning/rubrik), `description` (lugn underrad). |
| `AuthFrame` | Fristående sidor (inloggning, onboarding) | Kollegan + logotyp överst, kort i mitten, `footer` för länk. |
| `SegmentedControl` | Vyväxling, förtroendereglaget | `tone="ink"` (navy, för reglage) eller `"brand"` (blå, för flikar). |
| `StatTile`, `StatRow` | Nyckeltal | Stort tal + etikett. `tone="warning"` när något väntar. |
| `EmptyState` | Tomma listor | Lugn ton: "Inget väntar" är goda nyheter. |
| `Logo`, `LogoMark` | Varumärke | Märket delar formspråk med Kollegan. |
| `Icon*` | Ikoner | Litet inline-set (`IconMic`, `IconCheck` …). Lägg till där i stället för att dra in ett bibliotek. |

### Mönster

- **Godkännandeflöde:** Godkänn (primary) · Redigera (secondary) · Avvisa (destructive), i den ordningen, `size="sm"` i listor.
- **Lista av ärenden:** `SectionHeading` med `Badge` som räknare → `ul` av `Card as="li"` → `EmptyState` när tom.
- **Formulär:** `Card padding="lg"` → `Field`-rader → `Alert tone="danger"` vid fel → `Button size="lg" fullWidth`.
- **Fältpersonal på mobil:** `size="lg"` på fält och knappar, en kolumn, `max-w-[var(--layout-narrow-max)]`.

## Kollegan

`components/Kollegan` — kontraktet är oförändrat och får inte brytas:

```tsx
<Kollegan
  state="idle" | "listening" | "asking" | "done"
  size="large" | "small" | "tiny"
  message="Fakturautkast till Björkvägen 12 (2 450 kr) väntar på ditt godkännande."
  onApprove={…} onEdit={…} onReject={…}
/>
```

| Läge | Så ser det ut |
| --- | --- |
| idle | Andas lugnt, blinkar. |
| listening | Mikrofonen lyser, ljudringar, ljudstaplar på bröstet. |
| asking | Lutar sig fram, höjt ögonbryn, bärnstensfärgad bröstlampa, pratbubbla med Godkänn / Redigera / Avvisa. |
| done | Litet hopp, glada ögon, grön bock på bröstet. Återgår till idle efter 2 s (`motion.duration.linger`). |

Pratbubblan ligger **under** figuren vid `large` (fungerar på mobil) och till
höger vid `small`/`tiny`. `message` ska alltid beskriva **åtgärden** som
väntar, aldrig bara "något väntar".

Färgerna kommer från tokens (`primary`, `semantic.warning`, `semantic.success`).
Om du byter primärblå följer figuren med.

## Lägga till något nytt

1. Finns det en komponent? Använd den. Saknas en variant — lägg till den i komponenten, inte i sidan.
2. Behöver du en färg/mått som saknas? Lägg till i `design/tokens.ts` **och** `design/tokens.css`, kör `npm test`.
3. Visa upp det i `app/design/DesignGallery.tsx` så nästa track hittar det.
4. Kolla `npm run lint`, `npx tsc --noEmit`, `npm test`.

## Filer

```
design/tokens.ts          källan till sanning (typad)
design/tokens.css         Tailwind @theme-spegel + rot-variabler
design/tokens.test.ts     paritetstest
app/globals.css           bas: canvas, typsnitt, fokus, reduced motion
app/layout.tsx            DM Sans / DM Mono via next/font
components/ui/            kärnkomponenter (+ index.ts)
components/Kollegan/      figuren (Track 5-kontraktet)
app/design/               levande gallery
```
