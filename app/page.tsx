import Link from "next/link";
import Kollegan from "@/components/Kollegan";
import {
  ButtonLink,
  Card,
  IconArrowRight,
  IconInbox,
  IconMic,
  Logo,
} from "@/components/ui";

/**
 * Startsida: en lugn vägvisare. Nina går till adminpanelen, personalen i
 * fält går till fältrapporten.
 */
export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center px-4 py-12 sm:py-20">
      <div className="flex w-full max-w-2xl flex-col items-center gap-10">
        <div className="flex flex-col items-center gap-4 text-center">
          <Kollegan state="idle" size="large" />
          <Logo size={32} />
          <p className="max-w-md text-body-lg text-muted">
            Fältrapporter, fakturautkast och offerter på ett ställe — och en
            kollega som frågar innan något skickas.
          </p>
        </div>

        <div className="grid w-full gap-4 sm:grid-cols-2">
          <Card className="flex flex-col gap-3">
            <span className="flex size-10 items-center justify-center rounded-full bg-surface-brand text-primary-700">
              <IconInbox />
            </span>
            <div>
              <h2 className="text-h3">Adminpanelen</h2>
              <p className="mt-1 text-body-sm text-muted">
                Godkänn fakturautkast och offerter, se senaste rapporterna.
              </p>
            </div>
            <ButtonLink href="/admin" className="mt-auto self-start" iconRight={<IconArrowRight />}>
              Öppna panelen
            </ButtonLink>
          </Card>

          <Card className="flex flex-col gap-3">
            <span className="flex size-10 items-center justify-center rounded-full bg-surface-brand text-primary-700">
              <IconMic />
            </span>
            <div>
              <h2 className="text-h3">Fältrapport</h2>
              <p className="mt-1 text-body-sm text-muted">
                För personal i fält. Skriv eller prata in vad du gjorde, med din
                kod.
              </p>
            </div>
            <ButtonLink
              href="/faltrapport"
              variant="secondary"
              className="mt-auto self-start"
              iconRight={<IconArrowRight />}
            >
              Rapportera
            </ButtonLink>
          </Card>
        </div>

        <p className="text-body-sm text-muted">
          Nytt företag?{" "}
          <Link href="/onboarding" className="text-link underline-offset-2 hover:underline">
            Kom igång
          </Link>
        </p>
      </div>
    </main>
  );
}
