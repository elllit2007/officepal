import { EMAIL_FROM, getResendClient } from "./client";
import type { EmailContent } from "./templates";

export interface SendEmailInput {
  to: string;
  content: EmailContent;
  replyTo?: string;
}

export interface SendEmailResult {
  success: boolean;
  id?: string;
  error?: string;
}

// Skickar ett e-postmeddelande via Resend. Kastar aldrig — returnerar ett
// resultat så att anropare (t.ex. cron-routen) kan fortsätta med nästa
// mottagare även om ett enskilt utskick misslyckas.
export async function sendEmail({
  to,
  content,
  replyTo,
}: SendEmailInput): Promise<SendEmailResult> {
  try {
    const resend = getResendClient();

    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to,
      subject: content.subject,
      text: content.text,
      html: content.html,
      ...(replyTo ? { replyTo } : {}),
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, id: data?.id };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Okänt fel vid e-postutskick.",
    };
  }
}
