// Manuellt test-/integrationsskript för lib/email/ — inte en del av en
// testrunner, bara ett fristående skript.
//
// Kör:
//   npx tsx lib/email/manual-test.ts
//
// Med miljövariabler (för att även skicka riktiga API-anrop mot Resend):
//   npx tsx --env-file=.env.local lib/email/manual-test.ts
//
// Vad det gör:
//   1. Renderar alla tre e-postmallarna med exempeldata och skriver ut
//      ämne, text-version och HTML-version i terminalen för manuell
//      granskning (kräver ingen nätverksåtkomst eller API-nyckel).
//   2. Om RESEND_API_KEY är satt: skickar även varje mall live via Resend
//      till Resends reserverade testadress "delivered@resend.dev". Den
//      adressen levererar aldrig till en riktig inkorg — Resend markerar
//      bara anropet som lyckat/misslyckat, så det är säkert att köra
//      upprepade gånger (även i produktion). Andra testadresser:
//      bounced@resend.dev, complained@resend.dev — se Resends dokumentation
//      om du vill testa de flödena istället.
//   Saknas RESEND_API_KEY körs bara steg 1, och skriptet talar om det.

import { sendEmail } from "./send";
import {
  quoteSentTemplate,
  quoteFollowUpTemplate,
  invoiceApprovedTemplate,
  type EmailContent,
} from "./templates";

const TEST_TO_ADDRESS = "delivered@resend.dev";

const sampleQuote = {
  customer_name: "Anna Andersson",
  content: [
    "Kontorsstädning, 2 rum + kök",
    "- Städning varje vecka, 45 min/tillfälle",
    "- Fönsterputsning ingår kvartalsvis",
    "",
    "Pris: 1 500 kr/månad",
  ].join("\n"),
};

const sampleInvoiceDraft = {
  customer_name: "Erik Eriksson",
  amount: 2450,
  line_items: [
    { description: "Fönsterputsning", quantity: 3, unit_price: 350 },
    { description: "Storstädning", quantity: 1, unit_price: 1400 },
  ],
};

const tenantName = "Ninas Städservice";

interface TemplateCase {
  label: string;
  content: EmailContent;
}

function buildTemplateCases(): TemplateCase[] {
  return [
    {
      label: "quote-sent",
      content: quoteSentTemplate({ quote: sampleQuote, tenantName }),
    },
    {
      label: "quote-follow-up",
      content: quoteFollowUpTemplate({ quote: sampleQuote, tenantName }),
    },
    {
      label: "invoice-approved",
      content: invoiceApprovedTemplate({
        invoiceDraft: sampleInvoiceDraft,
        tenantName,
      }),
    },
  ];
}

function logTemplate({ label, content }: TemplateCase): void {
  console.log("\n" + "=".repeat(70));
  console.log(`Mall: ${label}`);
  console.log("=".repeat(70));
  console.log(`Ämne: ${content.subject}`);
  console.log("\n--- Text-version ---");
  console.log(content.text);
  console.log("\n--- HTML-version ---");
  console.log(content.html);
}

async function sendLiveTestEmails(cases: TemplateCase[]): Promise<void> {
  console.log("\n" + "=".repeat(70));
  console.log(`RESEND_API_KEY hittad — skickar live testutskick till ${TEST_TO_ADDRESS}`);
  console.log("=".repeat(70));

  for (const { label, content } of cases) {
    const result = await sendEmail({ to: TEST_TO_ADDRESS, content });

    if (result.success) {
      console.log(`[OK]    ${label} — skickad, id=${result.id}`);
    } else {
      console.log(`[FEL]   ${label} — ${result.error}`);
    }
  }
}

async function main(): Promise<void> {
  const cases = buildTemplateCases();

  cases.forEach(logTemplate);

  if (process.env.RESEND_API_KEY) {
    await sendLiveTestEmails(cases);
  } else {
    console.log("\n" + "=".repeat(70));
    console.log(
      "RESEND_API_KEY saknas — hoppar över live-utskick. Sätt den " +
        "(t.ex. via --env-file=.env.local) för att även testa mot Resends " +
        `reserverade testadress (${TEST_TO_ADDRESS}).`
    );
    console.log("=".repeat(70));
  }
}

main().catch((err) => {
  console.error("Manuellt testskript kraschade:", err);
  process.exitCode = 1;
});
