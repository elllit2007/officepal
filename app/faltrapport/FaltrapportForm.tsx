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
import { validateFaltrapport, type FieldName, type FieldErrors } from "./validate";

export default function FaltrapportForm() {
  const searchParams = useSearchParams();
  const [accessCode, setAccessCode] = useState(() => searchParams.get("code") ?? "");
  const [jobText, setJobText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Partial<Record<FieldName, boolean>>>({});
  const [confirmation, setConfirmation] = useState<{ staffName: string | null } | null>(
    null,
  );
  const {
    supported: speechSupported,
    listening,
    start,
    stop,
    error: speechError,
  } = useSpeechRecognition((transcript) => {
    setJobText((prev) => (prev ? `${prev} ${transcript}` : transcript));
  });

  const displayedError = error ?? speechError;

  const currentErrors = validateFaltrapport({ access_code: accessCode, job_text: jobText });

  // Ett fält visar sitt fel först när användaren lämnat det (blur) eller
  // försökt skicka — inte medan hen fortfarande skriver första gången.
  const visibleError = (field: FieldName) =>
    touched[field] ? currentErrors[field] : fieldErrors[field];

  const markTouched = (field: FieldName) =>
    setTouched((prev) => ({ ...prev, [field]: true }));

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

    const errors = validateFaltrapport({ access_code: accessCode, job_text: jobText });
    setFieldErrors(errors);
    setTouched({ access_code: true, job_text: true });

    if (errors.access_code) {
      document.getElementById("access_code")?.focus();
      return;
    }
    if (errors.job_text) {
      document.getElementById("job_text")?.focus();
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
    setFieldErrors({});
    setTouched({});
    setError(null);
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

  const accessCodeError = visibleError("access_code");
  const jobTextError = visibleError("job_text");

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
          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
            <Field label="Din kod" htmlFor="access_code" size="lg" error={accessCodeError}>
              <Input
                id="access_code"
                name="access_code"
                type="text"
                size="lg"
                mono
                inputMode="text"
                autoCapitalize="characters"
                autoCorrect="off"
                spellCheck={false}
                autoComplete="off"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                onBlur={() => markTouched("access_code")}
                placeholder="t.ex. K7M2XQ"
                invalid={Boolean(accessCodeError)}
                aria-describedby={accessCodeError ? "access_code-error" : undefined}
              />
            </Field>

            <Field label="Vad gjorde du?" htmlFor="job_text" size="lg" error={jobTextError}>
              <Textarea
                id="job_text"
                name="job_text"
                size="lg"
                value={jobText}
                onChange={(e) => setJobText(e.target.value)}
                onBlur={() => markTouched("job_text")}
                rows={6}
                placeholder="T.ex: Städade kontoret på Storgatan 4, tvättade fönster och dammsög två rum …"
                invalid={Boolean(jobTextError)}
                aria-describedby={jobTextError ? "job_text-error" : undefined}
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

            {displayedError && <Alert tone="danger">{displayedError}</Alert>}

            <Button type="submit" size="lg" fullWidth loading={submitting}>
              {submitting ? "Skickar" : "Skicka rapport"}
            </Button>
          </form>
        </Card>
      </div>
    </main>
  );
}
