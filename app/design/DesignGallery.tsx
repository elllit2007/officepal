"use client";

import { useState } from "react";
import Kollegan from "@/components/Kollegan";
import type { KollegState } from "@/components/Kollegan";
import { primary, neutral, semantic, typeScale } from "@/design/tokens";
import {
  Alert,
  Badge,
  Button,
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  CodeChip,
  EmptyState,
  Field,
  IconArrowRight,
  IconInbox,
  IconMic,
  IconPlus,
  Input,
  Logo,
  LogoMark,
  PageContainer,
  PageHeader,
  SegmentedControl,
  Select,
  StatRow,
  StatTile,
  StatusBadge,
  Textarea,
} from "@/components/ui";

const KOLLEG_STATES: { value: KollegState; label: string }[] = [
  { value: "idle", label: "Idle" },
  { value: "listening", label: "Listening" },
  { value: "asking", label: "Asking" },
  { value: "done", label: "Done" },
];

// Statiska klassnamn så att Tailwind hittar dem (dynamiska `text-${name}` gör det inte).
const TYPE_CLASS: Record<keyof typeof typeScale, string> = {
  display: "text-display",
  h1: "text-h1",
  h2: "text-h2",
  h3: "text-h3",
  h4: "text-h4",
  "body-lg": "text-body-lg",
  body: "text-body",
  "body-sm": "text-body-sm",
  label: "text-label",
  button: "text-button",
  caption: "text-caption",
  eyebrow: "text-eyebrow uppercase",
};

const STATUSES = [
  "awaiting_approval",
  "approved",
  "rejected",
  "sent",
  "draft",
  "followed_up",
  "accepted",
  "expired",
  "pending",
  "processed",
  "error",
];

function Swatch({ name, value, dark }: { name: string; value: string; dark?: boolean }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div
        className="h-14 rounded-md border border-line"
        style={{ background: value }}
        aria-hidden="true"
      />
      <span className={`text-caption ${dark ? "text-ink" : "text-muted"}`}>{name}</span>
      <span className="font-mono text-caption text-neutral-500">{value}</span>
    </div>
  );
}

function Section({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="flex scroll-mt-24 flex-col gap-5">
      <div>
        <h2 className="text-h2">{title}</h2>
        {description && <p className="mt-1 text-body text-muted">{description}</p>}
      </div>
      {children}
    </section>
  );
}

export default function DesignGallery() {
  const [kollegState, setKollegState] = useState<KollegState>("asking");
  const [trust, setTrust] = useState<"ask" | "unsure" | "auto">("unsure");
  const [view, setView] = useState<"overview" | "holdings">("overview");
  const [log, setLog] = useState<string[]>([]);

  const message =
    "Fakturautkast till Björkvägen 12 (2 450 kr) väntar på ditt godkännande.";

  const pushLog = (entry: string) =>
    setLog((prev) => [`${new Date().toLocaleTimeString("sv-SE")} — ${entry}`, ...prev].slice(0, 6));

  return (
    <PageContainer className="flex flex-col gap-14">
      <PageHeader
        eyebrow="Designsystem · v1"
        title="OfficePal — komponenter"
        description="Levande referens. Allt här byggs av tokens i design/tokens.ts och komponenter i components/ui."
        aside={<LogoMark size={56} />}
      />

      {/* ------------------------------------------------------------ */}
      <Section
        id="farg"
        title="Färg"
        description="Blå primär, varma neutraler, fyra semantiska toner. Använd roller (canvas, surface, ink, muted) före råa skalsteg."
      >
        <Card>
          <CardTitle as="h3">Primär</CardTitle>
          <div className="mt-4 grid grid-cols-5 gap-3 sm:grid-cols-10">
            {Object.entries(primary).map(([step, hex]) => (
              <Swatch key={step} name={step} value={hex} />
            ))}
          </div>
          <CardTitle as="h3" className="mt-8">
            Neutral
          </CardTitle>
          <div className="mt-4 grid grid-cols-5 gap-3 sm:grid-cols-11">
            {Object.entries(neutral).map(([step, hex]) => (
              <Swatch key={step} name={step} value={hex} />
            ))}
          </div>
          <CardTitle as="h3" className="mt-8">
            Semantiska
          </CardTitle>
          <div className="mt-4 grid grid-cols-2 gap-6 sm:grid-cols-4">
            {Object.entries(semantic).map(([tone, set]) => (
              <div key={tone} className="grid grid-cols-2 gap-3">
                <Swatch name={`${tone}`} value={set.solid} dark />
                <Swatch name={`${tone}-soft`} value={set.soft} />
                <Swatch name={`${tone}-line`} value={set.line} />
                <Swatch name={`${tone}-ink`} value={set.ink} />
              </div>
            ))}
          </div>
        </Card>
      </Section>

      {/* ------------------------------------------------------------ */}
      <Section
        id="typografi"
        title="Typografi"
        description="DM Sans för allt, DM Mono för koder. Skalan är rollbaserad: text-h1, text-body, text-label …"
      >
        <Card className="flex flex-col gap-4">
          {(Object.keys(typeScale) as (keyof typeof typeScale)[]).map((name) => (
            <div key={name} className="flex flex-wrap items-baseline gap-4 border-b border-line pb-4 last:border-0 last:pb-0">
              <span className="w-24 shrink-0 font-mono text-caption text-muted">text-{name}</span>
              <span className={TYPE_CLASS[name]}>
                Nina godkänner fakturan på 2 450 kr
              </span>
              <span className="ml-auto font-mono text-caption text-neutral-500">
                {typeScale[name].size} / {typeScale[name].lineHeight} · {typeScale[name].weight}
              </span>
            </div>
          ))}
          <div className="flex items-center gap-4 pt-2">
            <span className="w-24 shrink-0 font-mono text-caption text-muted">font-mono</span>
            <CodeChip>K7M2XQ</CodeChip>
            <span className="font-mono text-body-sm text-muted">2 450 kr · 2026-09-17</span>
          </div>
        </Card>
      </Section>

      {/* ------------------------------------------------------------ */}
      <Section
        id="knappar"
        title="Knappar"
        description="En primär per vy. Sekundär för det andra valet. Destruktiv är mjuk tills man håller över den. Ghost för lågprioriterade länkar."
      >
        <Card className="flex flex-col gap-6">
          {(["sm", "md", "lg"] as const).map((size) => (
            <div key={size} className="flex flex-wrap items-center gap-3">
              <span className="w-10 font-mono text-caption text-muted">{size}</span>
              <Button size={size}>Godkänn</Button>
              <Button size={size} variant="secondary">
                Redigera
              </Button>
              <Button size={size} variant="destructive">
                Avvisa
              </Button>
              <Button size={size} variant="ghost">
                Visa alla
              </Button>
            </div>
          ))}
          <div className="flex flex-wrap items-center gap-3 border-t border-line pt-5">
            <span className="w-10 font-mono text-caption text-muted">ikon</span>
            <Button iconLeft={<IconPlus />}>Lägg till personal</Button>
            <Button variant="secondary" iconRight={<IconArrowRight />}>
              Gå vidare
            </Button>
            <Button variant="secondary" iconLeft={<IconMic />} size="lg">
              Prata in
            </Button>
            <Button loading>Skickar</Button>
            <Button disabled variant="secondary">
              Inaktiv
            </Button>
          </div>
        </Card>
      </Section>

      {/* ------------------------------------------------------------ */}
      <Section
        id="kort"
        title="Kort och paneler"
        description="Vit yta på canvas, 20px radie, 1px kantlinje och mjuk skugga. Etikett-öra för kontext, highlight när Kollegan pekar på kortet."
      >
        <div className="grid gap-5 md:grid-cols-2">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Björkvägen 12</CardTitle>
                <CardDescription>Fakturautkast · 2 450 kr · igår 14:10</CardDescription>
              </div>
              <StatusBadge status="awaiting_approval" />
            </CardHeader>
            <p className="text-body">Fönsterputs, storstädning och en extra timme för balkongen.</p>
            <CardFooter>
              <Button size="sm">Godkänn</Button>
              <Button size="sm" variant="secondary">
                Redigera
              </Button>
              <Button size="sm" variant="destructive">
                Avvisa
              </Button>
            </CardFooter>
          </Card>
          <Card tag="Nina Städ AB · Offert" highlighted>
            <CardTitle>Kontorsstäd varannan vecka</CardTitle>
            <CardDescription>Kollegan pekar på det här kortet (highlighted).</CardDescription>
          </Card>
          <Card tone="brand">
            <CardTitle as="h3">Blåtonad panel</CardTitle>
            <CardDescription>För info, tips och Kollegans sammanhang.</CardDescription>
          </Card>
          <Card tone="ink">
            <p className="text-h3 text-on-brand">Mörk panel</p>
            <p className="mt-1 text-body-sm text-primary-200">
              Används sparsamt — t.ex. som lugnt sammanfattningskort.
            </p>
          </Card>
        </div>
      </Section>

      {/* ------------------------------------------------------------ */}
      <Section
        id="status"
        title="Statusmärken"
        description="StatusBadge förstår statuskoderna i lib/types.ts. Badge är den generella varianten."
      >
        <Card className="flex flex-col gap-5">
          <div className="flex flex-wrap gap-2">
            {STATUSES.map((s) => (
              <StatusBadge key={s} status={s} />
            ))}
          </div>
          <div className="flex flex-wrap gap-2 border-t border-line pt-5">
            <Badge>Neutral</Badge>
            <Badge tone="brand">Nu</Badge>
            <Badge tone="info" dot>
              Info
            </Badge>
            <Badge tone="success" dot>
              Success
            </Badge>
            <Badge tone="warning" dot>
              Varning
            </Badge>
            <Badge tone="danger" dot>
              Fel
            </Badge>
            <Badge size="sm" tone="info">
              Snart
            </Badge>
          </div>
        </Card>
      </Section>

      {/* ------------------------------------------------------------ */}
      <Section
        id="formular"
        title="Formulärfält"
        description="Field ger etikett, hjälptext och fel. Storlek lg för fältpersonal på mobil."
      >
        <div className="grid gap-5 md:grid-cols-2">
          <Card className="flex flex-col gap-5">
            <Field label="E-postadress" htmlFor="g-email" hint="Det konto som skapades vid onboarding.">
              <Input id="g-email" type="email" placeholder="nina@ninastad.se" />
            </Field>
            <Field
              label="Lösenord"
              htmlFor="g-pw"
              trailing={
                <a href="#formular" className="text-body-sm text-link underline-offset-2 hover:underline">
                  Glömt lösenordet?
                </a>
              }
              error="Fel e-post eller lösenord."
            >
              <Input id="g-pw" type="password" defaultValue="hemligt" invalid />
            </Field>
            <Field label="Kundtyp" htmlFor="g-select">
              <Select id="g-select" defaultValue="foretag">
                <option value="foretag">Företag</option>
                <option value="privat">Privatperson</option>
                <option value="brf">Bostadsrättsförening</option>
              </Select>
            </Field>
          </Card>
          <Card className="flex flex-col gap-5">
            <Field label="Din kod" htmlFor="g-code" size="lg">
              <Input id="g-code" size="lg" mono placeholder="t.ex. K7M2XQ" />
            </Field>
            <Field label="Vad gjorde du?" htmlFor="g-text" size="lg">
              <Textarea
                id="g-text"
                size="lg"
                placeholder="Städade kontoret på Storgatan 4, tvättade fönster …"
              />
            </Field>
          </Card>
        </div>
      </Section>

      {/* ------------------------------------------------------------ */}
      <Section id="meddelanden" title="Meddelanden" description="Inline-alerts i fyra toner.">
        <div className="grid gap-3 md:grid-cols-2">
          <Alert tone="info" title="Tips">
            Du kan lägga till fler i personalen senare.
          </Alert>
          <Alert tone="success" title="Klart">
            Fakturan är godkänd och skickas till kunden.
          </Alert>
          <Alert tone="warning">Tre ärenden har väntat i mer än två dagar.</Alert>
          <Alert tone="danger">Kunde inte nå servern. Kontrollera din uppkoppling.</Alert>
        </div>
      </Section>

      {/* ------------------------------------------------------------ */}
      <Section
        id="navigation"
        title="Navigation och reglage"
        description="Piller överallt: nav-länkar, vyväxling och förtroendereglaget."
      >
        <Card className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center gap-6">
            <Logo />
            <Logo compact />
          </div>
          <div className="flex flex-col gap-3">
            <p className="text-label text-muted">Vyväxling</p>
            <SegmentedControl
              label="Vy"
              tone="brand"
              value={view}
              onChange={setView}
              options={[
                { value: "overview", label: "Översikt" },
                { value: "holdings", label: "Fältrapporter" },
              ]}
            />
          </div>
          <div className="flex flex-col gap-3">
            <p className="text-label text-muted">Förtroendereglaget · Fakturapåminnelser</p>
            <SegmentedControl
              label="Förtroendenivå"
              value={trust}
              onChange={setTrust}
              options={[
                { value: "ask", label: "Frågar alltid" },
                { value: "unsure", label: "Frågar vid osäkerhet" },
                { value: "auto", label: "Sköter själv" },
              ]}
            />
          </div>
        </Card>
      </Section>

      {/* ------------------------------------------------------------ */}
      <Section id="nyckeltal" title="Nyckeltal och tomma lägen">
        <div className="grid gap-5 md:grid-cols-2">
          <Card>
            <StatRow>
              <StatTile value={3} label="Väntar på dig" tone="warning" />
              <StatTile value={12} label="Godkända i veckan" tone="success" />
              <StatTile value="7" label="Rapporter idag" />
            </StatRow>
          </Card>
          <EmptyState
            icon={<IconInbox />}
            title="Inget väntar"
            description="Lugnt just nu. Nya fakturautkast dyker upp här när personalen rapporterar."
          />
        </div>
      </Section>

      {/* ------------------------------------------------------------ */}
      <Section
        id="kollegan"
        title="Kollegan"
        description="Fyra lägen, tre storlekar. Kontraktet (props) är oförändrat — bara utseendet är nytt."
      >
        <Card className="flex flex-col gap-8">
          <div className="flex flex-wrap items-center gap-3">
            <SegmentedControl
              label="Kollegans läge"
              tone="brand"
              value={kollegState}
              onChange={setKollegState}
              options={KOLLEG_STATES}
            />
          </div>

          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-start">
            <div className="flex min-h-[380px] flex-col items-center justify-start rounded-xl bg-canvas p-8">
              <Kollegan
                state={kollegState}
                size="large"
                message={message}
                onApprove={() => pushLog("Godkänt (large)")}
                onEdit={() => pushLog("Redigera (large)")}
                onReject={() => pushLog("Avvisat (large)")}
              />
            </div>
            <div className="flex flex-col gap-24 rounded-xl bg-canvas p-8 lg:min-w-[420px]">
              <div className="flex items-center gap-4">
                <span className="w-12 text-caption text-muted">small</span>
                <Kollegan
                  state={kollegState}
                  size="small"
                  message={message}
                  onApprove={() => pushLog("Godkänt (small)")}
                  onEdit={() => pushLog("Redigera (small)")}
                  onReject={() => pushLog("Avvisat (small)")}
                />
              </div>
              <div className="flex items-center gap-4">
                <span className="w-12 text-caption text-muted">tiny</span>
                <Kollegan
                  state={kollegState}
                  size="tiny"
                  message={message}
                  onApprove={() => pushLog("Godkänt (tiny)")}
                  onEdit={() => pushLog("Redigera (tiny)")}
                  onReject={() => pushLog("Avvisat (tiny)")}
                />
              </div>
            </div>
          </div>

          <div className="border-t border-line pt-4">
            <p className="text-label text-muted">Callback-logg</p>
            <ul className="mt-1 flex flex-col gap-0.5 font-mono text-caption text-neutral-500">
              {log.length === 0 && <li>Inga åtgärder ännu.</li>}
              {log.map((entry) => (
                <li key={entry}>{entry}</li>
              ))}
            </ul>
          </div>
        </Card>
      </Section>
    </PageContainer>
  );
}
