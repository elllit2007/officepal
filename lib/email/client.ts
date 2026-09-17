import { Resend } from "resend";

// Track 6 (Email & follow-ups) — se BUILD-CONTRACT.md
//
// Singleton Resend-klient. Kräver RESEND_API_KEY som miljövariabel
// (server-side, aldrig exponerad till klienten).

let client: Resend | null = null;

export function getResendClient(): Resend {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY saknas i miljövariablerna.");
  }

  if (!client) {
    client = new Resend(process.env.RESEND_API_KEY);
  }

  return client;
}

// Avsändaradress. Kan overridas per miljö (t.ex. sandbox-domän innan
// Nina verifierat sin egen domän hos Resend).
export const EMAIL_FROM =
  process.env.RESEND_FROM_EMAIL ?? "OfficePal <no-reply@officepal.app>";
