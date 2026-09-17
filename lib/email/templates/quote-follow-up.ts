import type { Quote } from "@/lib/types";
import { escapeHtml, wrapEmailHtml } from "./shared";
import type { EmailContent } from "./quote-sent";

export interface QuoteFollowUpTemplateInput {
  quote: Pick<Quote, "customer_name" | "content">;
  tenantName: string;
}

export function quoteFollowUpTemplate({
  quote,
  tenantName,
}: QuoteFollowUpTemplateInput): EmailContent {
  const subject = `Har du hunnit titta på offerten från ${tenantName}?`;

  const text = [
    `Hej ${quote.customer_name}!`,
    "",
    `Vi ville bara höra av oss och höra om du har haft möjlighet att titta på offerten vi skickade från ${tenantName}. Den finns med igen nedan för enkelhets skull:`,
    "",
    quote.content,
    "",
    "Har du frågor eller funderingar hjälper vi gärna till. Hör av dig när du vill!",
    "",
    "Vänliga hälsningar,",
    tenantName,
  ].join("\n");

  const html = wrapEmailHtml(`
    <p>Hej ${escapeHtml(quote.customer_name)}!</p>
    <p>Vi ville bara höra av oss och höra om du har haft möjlighet att titta på offerten vi
    skickade från <strong>${escapeHtml(
      tenantName
    )}</strong>. Den finns med igen nedan för enkelhets skull:</p>
    <div style="background: #f5f5f5; border-radius: 8px; padding: 16px; margin: 16px 0; white-space: pre-wrap;">${escapeHtml(
      quote.content
    )}</div>
    <p>Har du frågor eller funderingar hjälper vi gärna till. Hör av dig när du vill!</p>
    <p>Vänliga hälsningar,<br />${escapeHtml(tenantName)}</p>
  `);

  return { subject, text, html };
}
