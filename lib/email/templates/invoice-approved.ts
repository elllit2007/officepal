import type { InvoiceDraft } from "@/lib/types";
import { escapeHtml, wrapEmailHtml } from "./shared";
import type { EmailContent } from "./quote-sent";

export interface InvoiceApprovedTemplateInput {
  invoiceDraft: Pick<InvoiceDraft, "customer_name" | "amount" | "line_items">;
  tenantName: string;
}

function formatSek(amount: number): string {
  return new Intl.NumberFormat("sv-SE", {
    style: "currency",
    currency: "SEK",
  }).format(amount);
}

function lineItemsText(lineItems: InvoiceDraft["line_items"]): string {
  return lineItems
    .map(
      (item) =>
        `- ${item.description} (${item.quantity} st à ${formatSek(
          item.unit_price
        )})`
    )
    .join("\n");
}

function lineItemsHtml(lineItems: InvoiceDraft["line_items"]): string {
  const rows = lineItems
    .map(
      (item) => `
        <tr>
          <td style="padding: 4px 8px; border-bottom: 1px solid #e5e5e5;">${escapeHtml(
            item.description
          )}</td>
          <td style="padding: 4px 8px; border-bottom: 1px solid #e5e5e5; text-align: right;">${
            item.quantity
          } st</td>
          <td style="padding: 4px 8px; border-bottom: 1px solid #e5e5e5; text-align: right;">${formatSek(
            item.unit_price
          )}</td>
        </tr>
      `
    )
    .join("");

  return `<table style="width: 100%; border-collapse: collapse; margin: 16px 0;">${rows}</table>`;
}

export function invoiceApprovedTemplate({
  invoiceDraft,
  tenantName,
}: InvoiceApprovedTemplateInput): EmailContent {
  const subject = `Din faktura från ${tenantName}`;
  const total = formatSek(invoiceDraft.amount);

  const text = [
    `Hej ${invoiceDraft.customer_name}!`,
    "",
    `Din faktura från ${tenantName} har godkänts och skickas nu vidare. Sammanfattning:`,
    "",
    lineItemsText(invoiceDraft.line_items),
    "",
    `Totalt: ${total}`,
    "",
    "Hör av dig om något ser fel ut.",
    "",
    "Vänliga hälsningar,",
    tenantName,
  ].join("\n");

  const html = wrapEmailHtml(`
    <p>Hej ${escapeHtml(invoiceDraft.customer_name)}!</p>
    <p>Din faktura från <strong>${escapeHtml(
      tenantName
    )}</strong> har godkänts och skickas nu vidare. Sammanfattning:</p>
    ${lineItemsHtml(invoiceDraft.line_items)}
    <p style="font-weight: bold;">Totalt: ${total}</p>
    <p>Hör av dig om något ser fel ut.</p>
    <p>Vänliga hälsningar,<br />${escapeHtml(tenantName)}</p>
  `);

  return { subject, text, html };
}
