"use client";

import { useState } from "react";
import Kollegan from "@/components/Kollegan";
import type { KollegState } from "@/components/Kollegan";
import {
  Button,
  Card,
  Field,
  PageContainer,
  PageHeader,
  SegmentedControl,
  Textarea,
} from "@/components/ui";

const STATES: { value: KollegState; label: string }[] = [
  { value: "idle", label: "Idle" },
  { value: "listening", label: "Listening" },
  { value: "asking", label: "Asking" },
  { value: "done", label: "Done" },
];

const SHORT_MESSAGE =
  "Fakturautkast till Björkvägen 12 (2 450 kr) väntar på godkännande.";
const LONG_MESSAGE =
  "Fakturautkast till Björkvägen 12 väntar på godkännande. Beloppet är 2 450 kr och inkluderar fönsterputs, storstädning och en extra timme för balkongen. Ninas team rapporterade att kunden också bad om en offert på återkommande städning varannan vecka.";

export default function KolleganDemoPage() {
  const [state, setState] = useState<KollegState>("idle");
  const [message, setMessage] = useState(SHORT_MESSAGE);
  const [log, setLog] = useState<string[]>([]);

  const pushLog = (entry: string) => {
    const time = new Date().toLocaleTimeString("sv-SE");
    setLog((prev) => [`${time} — ${entry}`, ...prev].slice(0, 8));
  };

  return (
    <main className="flex-1">
      <PageContainer className="flex flex-col gap-8">
        <PageHeader
          eyebrow="Track 5"
          title="Kollegan — demo"
          description="Alla fyra lägen: idle, listening, asking, done."
        />

        <Card className="flex flex-col gap-5">
          <SegmentedControl
            label="Läge"
            tone="brand"
            value={state}
            onChange={setState}
            options={STATES}
          />
          <Field label="Meddelande (visas i pratbubblan under asking)" htmlFor="message">
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={2}
            />
          </Field>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={() => setMessage(SHORT_MESSAGE)}>
              Kort meddelande
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setMessage(LONG_MESSAGE)}>
              Långt meddelande
            </Button>
          </div>
        </Card>

        <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
          <Card className="flex min-h-[400px] flex-col items-center justify-start gap-3">
            <span className="self-start text-caption text-muted">large (dashboard)</span>
            <Kollegan
              state={state}
              size="large"
              message={message}
              onApprove={() => pushLog("Godkänt (large)")}
              onEdit={() => pushLog("Redigera (large)")}
              onReject={() => pushLog("Avvisat (large)")}
            />
          </Card>
          <Card className="flex flex-col gap-20">
            <div className="flex items-center gap-6">
              <span className="w-12 text-caption text-muted">small</span>
              <Kollegan
                state={state}
                size="small"
                message={message}
                onApprove={() => pushLog("Godkänt (small)")}
                onEdit={() => pushLog("Redigera (small)")}
                onReject={() => pushLog("Avvisat (small)")}
              />
            </div>
            <div className="flex items-center gap-6">
              <span className="w-12 text-caption text-muted">tiny</span>
              <Kollegan
                state={state}
                size="tiny"
                message={message}
                onApprove={() => pushLog("Godkänt (tiny)")}
                onEdit={() => pushLog("Redigera (tiny)")}
                onReject={() => pushLog("Avvisat (tiny)")}
              />
            </div>
          </Card>
        </div>

        <Card>
          <h2 className="text-h4">Callback-logg</h2>
          <ul className="mt-2 flex flex-col gap-1 font-mono text-caption text-muted">
            {log.length === 0 && <li>Inga åtgärder ännu.</li>}
            {log.map((entry) => (
              <li key={entry}>{entry}</li>
            ))}
          </ul>
        </Card>
      </PageContainer>
    </main>
  );
}
