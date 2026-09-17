"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

// webkitSpeechRecognition/SpeechRecognition saknas i TypeScripts DOM-lib
// (endast delar av Web Speech API, som SpeechRecognitionResult, finns där).
// Minimal egen typning av det vi faktiskt använder.
interface SpeechRecognitionResultLike {
  isFinal: boolean;
  0: { transcript: string };
}

interface SpeechRecognitionEventLike extends Event {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultLike>;
}

interface SpeechRecognitionErrorEventLike extends Event {
  error: string;
}

interface SpeechRecognitionLike extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
}

// Web Speech API-felkoder (MDN: SpeechRecognitionErrorEvent.error) översatta
// till korta, begripliga svenska meddelanden istället för att bara tysta ner
// "lyssnar"-läget utan förklaring.
const ERROR_MESSAGES: Record<string, string> = {
  "not-allowed": "Mikrofonen är blockerad. Tillåt mikrofonåtkomst i webbläsaren och försök igen.",
  "service-not-allowed": "Mikrofonen är blockerad. Tillåt mikrofonåtkomst i webbläsaren och försök igen.",
  "no-speech": "Hörde inget. Försök prata igen.",
  "audio-capture": "Ingen mikrofon hittades.",
  network: "Nätverksfel vid taligenkänning. Försök igen.",
};

function describeSpeechError(code: string): string {
  return ERROR_MESSAGES[code] ?? "Något gick fel med rösten. Försök igen eller skriv istället.";
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

function getSpeechRecognitionConstructor(): SpeechRecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

// Stödet ändras aldrig under sidans livstid, så useSyncExternalStore behöver
// ingen riktig prenumeration — bara en server/klient-snapshot som inte ger
// hydreringsmissmatchningar (server har inget `window`, så stödet är alltid
// false där; klienten läser det riktiga värdet direkt vid första render).
function subscribeNoop() {
  return () => {};
}

function getSupportedSnapshot() {
  return getSpeechRecognitionConstructor() !== null;
}

function getServerSupportedSnapshot() {
  return false;
}

/**
 * "Prata in"-knappen — röst till text via webbläsarens inbyggda Web Speech
 * API. Ingen extern tjänst, ingen serverkostnad. Stöds av Chrome/Edge/Safari
 * på både desktop och mobil; `supported` blir false i t.ex. Firefox.
 */
export function useSpeechRecognition(onFinalTranscript: (text: string) => void) {
  const supported = useSyncExternalStore(
    subscribeNoop,
    getSupportedSnapshot,
    getServerSupportedSnapshot,
  );
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const onFinalTranscriptRef = useRef(onFinalTranscript);

  useEffect(() => {
    onFinalTranscriptRef.current = onFinalTranscript;
  });

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  const start = useCallback(() => {
    const Ctor = getSpeechRecognitionConstructor();
    if (!Ctor) return;

    setError(null);
    const recognition = new Ctor();
    recognition.lang = "sv-SE";
    recognition.continuous = true;
    recognition.interimResults = false;

    recognition.onresult = (event) => {
      let finalTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += `${result[0].transcript} `;
        }
      }
      if (finalTranscript.trim()) {
        onFinalTranscriptRef.current(finalTranscript.trim());
      }
    };

    recognition.onerror = (event) => {
      // "aborted" utlöses av vår egen stop()-knapp — inte ett fel att visa.
      if (event.error !== "aborted") {
        setError(describeSpeechError(event.error));
      }
      setListening(false);
    };
    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }, []);

  useEffect(() => stop, [stop]);

  return { supported, listening, start, stop, error };
}
