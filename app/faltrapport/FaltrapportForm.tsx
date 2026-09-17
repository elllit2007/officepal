"use client";

import { useRef, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import Kollegan from "@/components/Kollegan";
import { useSpeechRecognition } from "./useSpeechRecognition";
import { validateFaltrapport, type FieldName, type FieldErrors } from "./validate";

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="text-base text-red-700">
      {message}
    </p>
  );
}

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
  const accessCodeRef = useRef<HTMLInputElement>(null);
  const jobTextRef = useRef<HTMLTextAreaElement>(null);

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
      accessCodeRef.current?.focus();
      return;
    }
    if (errors.job_text) {
      jobTextRef.current?.focus();
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
      <main className="min-h-screen flex flex-col items-center justify-center gap-8 p-6 text-center bg-white">
        <Kollegan state="done" size="large" />
        <h1 className="text-3xl font-bold text-[#1E3A8A]">Rapport skickad!</h1>
        <p className="text-lg text-neutral-600 max-w-sm">
          {confirmation.staffName ? `Tack, ${confirmation.staffName}. ` : ""}
          Din fältrapport är sparad och väntar på hantering.
        </p>
        <button
          type="button"
          onClick={handleNewReport}
          className="w-full max-w-xs rounded-2xl bg-[#2563EB] px-8 py-5 text-xl font-semibold text-white active:scale-95 transition"
        >
          Registrera ny rapport
        </button>
      </main>
    );
  }

  const accessCodeError = visibleError("access_code");
  const jobTextError = visibleError("job_text");

  const inputClass = (invalid: boolean) =>
    `rounded-2xl border-2 px-5 py-4 text-xl focus:outline-none ${
      invalid
        ? "border-red-400 focus:border-red-600"
        : "border-[#DBEAFE] focus:border-[#2563EB]"
    }`;

  return (
    <main className="min-h-screen flex flex-col gap-6 p-6 bg-white max-w-md mx-auto w-full">
      <header className="flex flex-col items-center gap-2 pt-4">
        <Kollegan state={listening ? "listening" : "idle"} size="large" />
        <h1 className="text-2xl font-bold text-[#1E3A8A] text-center">
          Fältrapport
        </h1>
        <p className="text-base text-neutral-500 text-center">
          Beskriv jobbet du precis utfört.
        </p>
      </header>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <label
            htmlFor="access_code"
            className="text-lg font-medium text-neutral-700"
          >
            Din kod
          </label>
          <input
            ref={accessCodeRef}
            id="access_code"
            name="access_code"
            type="text"
            inputMode="text"
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            autoComplete="off"
            value={accessCode}
            onChange={(e) => setAccessCode(e.target.value)}
            onBlur={() => markTouched("access_code")}
            placeholder="t.ex. 1001"
            aria-invalid={Boolean(accessCodeError)}
            aria-describedby={accessCodeError ? "access_code-error" : undefined}
            className={inputClass(Boolean(accessCodeError))}
          />
          <FieldError id="access_code-error" message={accessCodeError} />
        </div>

        <div className="flex flex-col gap-2">
          <label
            htmlFor="job_text"
            className="text-lg font-medium text-neutral-700"
          >
            Vad gjorde du?
          </label>
          <textarea
            ref={jobTextRef}
            id="job_text"
            name="job_text"
            value={jobText}
            onChange={(e) => setJobText(e.target.value)}
            onBlur={() => markTouched("job_text")}
            rows={7}
            placeholder="T.ex: Städade kontoret på Storgatan 4, tvättade fönster och dammsög två rum..."
            aria-invalid={Boolean(jobTextError)}
            aria-describedby={jobTextError ? "job_text-error" : undefined}
            className={`${inputClass(Boolean(jobTextError))} resize-none`}
          />
          <FieldError id="job_text-error" message={jobTextError} />

          {speechSupported && (
            <button
              type="button"
              onClick={handleMicClick}
              aria-pressed={listening}
              className={`flex items-center justify-center gap-2 rounded-2xl px-6 py-4 text-xl font-semibold transition active:scale-95 ${
                listening
                  ? "bg-red-500 text-white"
                  : "bg-[#DBEAFE] text-[#1E3A8A]"
              }`}
            >
              {listening ? "● Lyssnar... tryck för att stoppa" : "🎤 Prata in"}
            </button>
          )}
        </div>

        {displayedError && (
          <p
            role="alert"
            className="rounded-xl bg-red-50 px-4 py-3 text-lg text-red-700"
          >
            {displayedError}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          aria-busy={submitting}
          className="w-full rounded-2xl bg-[#2563EB] px-8 py-5 text-xl font-semibold text-white active:scale-95 transition disabled:opacity-50"
        >
          {submitting ? "Skickar..." : "Skicka rapport"}
        </button>
      </form>
    </main>
  );
}
