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

interface SpeechRecognitionLike extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
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

    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }, []);

  useEffect(() => stop, [stop]);

  return { supported, listening, start, stop };
}
