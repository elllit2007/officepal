"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Kollegan from "@/components/Kollegan";
import {
  Alert,
  Button,
  Card,
  Field,
  IconMic,
  Input,
  Logo,
  Textarea,
  cn,
} from "@/components/ui";
import { useSpeechRecognition } from "./useSpeechRecognition";

export default function FaltrapportForm() {
  const searchParams = useSearchParams();
  const [accessCode, setAccessCode] = useState(() => searchParams.get("code") ?? "");
  const [jobText, setJobText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<{ staffName: string | null } | null>(
    null,
  );

  const { supported: speechSupported, listening, start, stop } = useSpeechRecognition(
    (transcript) => {
      setJobText((prev) => (prev ? `${prev} ${transcript}` : transcript));
    },
  );

  const handleMicClick = () => {
    if (listening) {
      stop();
    } else {
      setError(null);
      start();
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!accessCode.trim()) {
      setError("Ange din kod.");
      return;
    }
    if (!jobText.trim()) {
      setError("Beskriv jobbet innan du skickar.");
      return;
    }

    if (listening) stop();
    setSubmitting(true);

    try {
      const res = await fetch("/api/faltrapport", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          access_code: accessCode.trim(),
          raw_text: jobText.trim(),
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Något gick fel. Försök igen.");
        return;
      }

      setConfirmation({ staffName: data.staff_name ?? null });
    } catch {
      setError("Kunde inte nå servern. Kontrollera din uppkoppling.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleNewReport = () => {
    setJobText("");
    setConfirmation(null);
  };

  if (confirmation) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-10">
        <div className="flex w-full max-w-[var(--layout-narrow-max)] flex-col items-center gap-6 text-center">
          <Kollegan state="done" size="large" />
          <div>
            <h1 className="text-h1">Rapport skickad</h1>
            <p className="mt-2 text-body-lg text-muted">
              {confirmation.staffName ? `Tack, ${confirmation.staffName}. ` : "Tack. "}
              Din fältrapport är sparad och tas om hand.
            </p>
          </div>
          <Button size="lg" fullWidth onClick={handleNewReport}>
            Registrera ny rapport
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col items-center px-4 py-6 sm:py-10">
      <div className="flex w-full max-w-[var(--layout-narrow-max)] flex-col gap-6">
        <header className="flex flex-col items-center gap-3 text-center">
          <Link href="/" className="rounded-md focus-visible:outline-none focus-visible:shadow-focus">
            <Logo size={26} />
          </Link>
          {/* Figuren lyssnar medan man pratar in; medan rapporten skickas
              står hon lugnt kvar (idle) — knappen visar att det jobbar. */}
          <Kollegan state={listening ? "listening" : "idle"} size="large" />
          <div>
            <h1 className="text-h1">Fältrapport</h1>
            <p className="mt-1 text-body-lg text-muted">
              {submitting
                ? "Skickar din rapport …"
                : listening
                  ? "Jag lyssnar. Berätta vad du gjorde."
                  : "Beskriv jobbet du precis utfört."}
            </p>
          </div>
        </header>

        <Card padding="lg">
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <Field label="Din kod" htmlFor="access_code" size="lg">
              <Input
                id="access_code"
                name="access_code"
                type="text"
                size="lg"
                mono
                inputMode="text"
                autoCapitalize="characters"
                autoComplete="off"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                placeholder="t.ex. K7M2XQ"
              />
            </Field>

            <Field label="Vad gjorde du?" htmlFor="job_text" size="lg">
              <Textarea
                id="job_text"
                name="job_text"
                size="lg"
                value={jobText}
                onChange={(e) => setJobText(e.target.value)}
                rows={6}
                placeholder="T.ex: Städade kontoret på Storgatan 4, tvättade fönster och dammsög två rum …"
              />
            </Field>

            {speechSupported && (
              <Button
                type="button"
                size="lg"
                fullWidth
                variant={listening ? "primary" : "secondary"}
                aria-pressed={listening}
                onClick={handleMicClick}
                iconLeft={
                  listening ? (
                    <span
                      aria-hidden="true"
                      className="size-3 animate-pulse rounded-full bg-on-brand"
                    />
                  ) : (
                    <IconMic />
                  )
                }
                className={cn(listening && "bg-danger hover:bg-danger-ink")}
              >
                {listening ? "Lyssnar — tryck för att stoppa" : "Prata in"}
              </Button>
            )}

            {error && <Alert tone="danger">{error}</Alert>}

            <Button type="submit" size="lg" fullWidth loading={submitting}>
              {submitting ? "Skickar" : "Skicka rapport"}
            </Button>
          </form>
        </Card>
      </div>
    </main>
  );
}
