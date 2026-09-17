"use client";

import { useState } from "react";
import Kollegan from "@/components/Kollegan";
import type { KollegState } from "@/components/Kollegan";

const STATES: { value: KollegState; label: string }[] = [
  { value: "idle", label: "Idle" },
  { value: "listening", label: "Listening" },
  { value: "asking", label: "Asking" },
  { value: "done", label: "Done" },
];

export default function KolleganDemoPage() {
  const [state, setState] = useState<KollegState>("idle");
  const [message, setMessage] = useState(
    "Fakturautkast till Björkvägen 12 (2 450 kr) väntar på godkännande.",
  );
  const [log, setLog] = useState<string[]>([]);

  const SHORT_MESSAGE =
    "Fakturautkast till Björkvägen 12 (2 450 kr) väntar på godkännande.";
  const LONG_MESSAGE =
    "Fakturautkast till Björkvägen 12 väntar på godkännande. Beloppet är 2 450 kr och inkluderar fönsterputs, storstädning och en extra timme för balkongen. Ninas team rapporterade att kunden också bad om en offert på återkommande städning varannan vecka.";

  const pushLog = (entry: string) => {
    const time = new Date().toLocaleTimeString("sv-SE");
    setLog((prev) => [`${time} — ${entry}`, ...prev].slice(0, 8));
  };

  return (
    <main className="min-h-full flex flex-col gap-10 p-10 max-w-3xl mx-auto">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">Kollegan — demo</h1>
        <p className="text-sm text-neutral-500">
          Alla fyra lägen: idle, listening, asking, done. Track 5.
        </p>
      </header>

      <section className="flex flex-wrap gap-2">
        {STATES.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => setState(value)}
            className={`px-4 py-2 rounded-full text-sm font-medium border transition ${
              state === value
                ? "bg-[#2563EB] text-white border-[#2563EB]"
                : "bg-white text-[#1E3A8A] border-[#DBEAFE] hover:border-[#2563EB]"
            }`}
          >
            {label}
          </button>
        ))}
      </section>

      <section className="flex flex-col gap-2">
        <label htmlFor="message" className="text-sm font-medium text-neutral-600">
          Meddelande (visas i pratbubblan under &quot;asking&quot;)
        </label>
        <textarea
          id="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={2}
          className="border border-[#DBEAFE] rounded-lg p-2 text-sm"
        />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setMessage(SHORT_MESSAGE)}
            className="px-3 py-1 rounded-full text-xs font-medium border border-[#DBEAFE] text-[#1E3A8A] hover:border-[#2563EB]"
          >
            Kort meddelande
          </button>
          <button
            type="button"
            onClick={() => setMessage(LONG_MESSAGE)}
            className="px-3 py-1 rounded-full text-xs font-medium border border-[#DBEAFE] text-[#1E3A8A] hover:border-[#2563EB]"
          >
            Långt meddelande (2-3 meningar)
          </button>
        </div>
      </section>

      <section className="flex flex-col gap-10">
        <div className="flex items-center gap-4">
          <span className="w-24 text-sm text-neutral-500 shrink-0">Large (dashboard)</span>
          <div className="min-h-[260px] flex items-center">
            <Kollegan
              state={state}
              size="large"
              message={message}
              onApprove={() => pushLog("Godkänt (large)")}
              onEdit={() => pushLog("Redigera (large)")}
              onReject={() => pushLog("Avvisat (large)")}
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="w-24 text-sm text-neutral-500 shrink-0">Small</span>
          <div className="min-h-[220px] flex items-center">
            <Kollegan
              state={state}
              size="small"
              message={message}
              onApprove={() => pushLog("Godkänt (small)")}
              onEdit={() => pushLog("Redigera (small)")}
              onReject={() => pushLog("Avvisat (small)")}
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="w-24 text-sm text-neutral-500 shrink-0">Tiny (hörnbadge, ~48px)</span>
          <div className="min-h-[200px] flex items-center">
            <Kollegan
              state={state}
              size="tiny"
              message={message}
              onApprove={() => pushLog("Godkänt (tiny)")}
              onEdit={() => pushLog("Redigera (tiny)")}
              onReject={() => pushLog("Avvisat (tiny)")}
            />
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-neutral-600">Callback-logg</h2>
        <ul className="text-xs text-neutral-500 flex flex-col gap-1">
          {log.length === 0 && <li>Inga åtgärder ännu.</li>}
          {log.map((entry) => (
            <li key={entry}>{entry}</li>
          ))}
        </ul>
      </section>
    </main>
  );
}
