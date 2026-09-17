"use client";

import { useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import Kollegan from "@/components/Kollegan";
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

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <label
            htmlFor="access_code"
            className="text-lg font-medium text-neutral-700"
          >
            Din kod
          </label>
          <input
            id="access_code"
            name="access_code"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            value={accessCode}
            onChange={(e) => setAccessCode(e.target.value)}
            placeholder="t.ex. 1001"
            className="rounded-2xl border-2 border-[#DBEAFE] px-5 py-4 text-xl focus:border-[#2563EB] focus:outline-none"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label
            htmlFor="job_text"
            className="text-lg font-medium text-neutral-700"
          >
            Vad gjorde du?
          </label>
          <textarea
            id="job_text"
            name="job_text"
            value={jobText}
            onChange={(e) => setJobText(e.target.value)}
            rows={7}
            placeholder="T.ex: Städade kontoret på Storgatan 4, tvättade fönster och dammsög två rum..."
            className="rounded-2xl border-2 border-[#DBEAFE] px-5 py-4 text-xl focus:border-[#2563EB] focus:outline-none resize-none"
          />

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

        {error && (
          <p
            role="alert"
            className="rounded-xl bg-red-50 px-4 py-3 text-lg text-red-700"
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-2xl bg-[#2563EB] px-8 py-5 text-xl font-semibold text-white active:scale-95 transition disabled:opacity-50"
        >
          {submitting ? "Skickar..." : "Skicka rapport"}
        </button>
      </form>
    </main>
  );
}
