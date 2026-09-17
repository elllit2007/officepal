import type { Quote } from "@/lib/types";
import { escapeHtml, wrapEmailHtml } from "./shared";

export interface QuoteSentTemplateInput {
  quote: Pick<Quote, "customer_name" | "content">;
  tenantName: string;
}

export interface EmailContent {
  subject: string;
  text: string;
  html: string;
}

export function quoteSentTemplate({
  quote,
  tenantName,
}: QuoteSentTemplateInput): EmailContent {
  const subject = `Din offert från ${tenantName}`;

  const text = [
    `Hej ${quote.customer_name}!`,
    "",
    `Tack för ditt intresse. Här kommer er offert från ${tenantName}:`,
    "",
    quote.content,
    "",
    "Hör gärna av dig om du har frågor eller vill gå vidare.",
    "",
    "Vänliga hälsningar,",
    tenantName,
  ].join("\n");

  const html = wrapEmailHtml(`
    <p>Hej ${escapeHtml(quote.customer_name)}!</p>
    <p>Tack för ditt intresse. Här kommer er offert från <strong>${escapeHtml(
      tenantName
    )}</strong>:</p>
    <div style="background: #f5f5f5; border-radius: 8px; padding: 16px; margin: 16px 0; white-space: pre-wrap;">${escapeHtml(
      quote.content
    )}</div>
    <p>Hör gärna av dig om du har frågor eller vill gå vidare.</p>
    <p>Vänliga hälsningar,<br />${escapeHtml(tenantName)}</p>
  `);

  return { subject, text, html };
}
