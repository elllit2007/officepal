"use client";

import { useActionState, useState } from "react";
import { createTenant, type OnboardingState } from "@/app/onboarding/actions";
import {
  Alert,
  Button,
  ButtonLink,
  Card,
  CodeChip,
  Field,
  IconArrowRight,
  IconPlus,
  Input,
} from "@/components/ui";

const initialState: OnboardingState = { error: null, success: null };

function StepLabel({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex size-7 items-center justify-center rounded-full bg-surface-brand text-caption font-semibold text-primary-700">
        {n}
      </span>
      <h2 className="text-h4">{children}</h2>
    </div>
  );
}

export default function OnboardingForm() {
  const [state, formAction, pending] = useActionState(
    createTenant,
    initialState,
  );
  const [staffCount, setStaffCount] = useState(3);

  if (state.success) {
    return (
      <Card padding="lg" className="flex flex-col gap-6">
        <div>
          <h1 className="text-h2">{state.success.tenantName} är redo</h1>
          <p className="mt-1 text-body-sm text-muted">
            Ge varje person sin kod. Koderna visas bara den här gången, så
            spara dem nu.
          </p>
        </div>

        {state.success.staff.length > 0 ? (
          <ul className="flex flex-col divide-y divide-line rounded-lg border border-line">
            {state.success.staff.map((member) => (
              <li
                key={member.access_code}
                className="flex items-center justify-between gap-4 px-4 py-3"
              >
                <span className="text-body font-medium text-ink">{member.name}</span>
                <CodeChip>{member.access_code}</CodeChip>
              </li>
            ))}
          </ul>
        ) : (
          <Alert tone="info">
            Ingen fältpersonal lades till. Du kan lägga till personal senare.
          </Alert>
        )}

        <Alert tone="success" plain>
          Fältpersonalen loggar in på <span className="font-medium">/faltrapport</span> med
          sin kod — inget lösenord behövs.
        </Alert>

        <ButtonLink href="/auth/login" size="lg" fullWidth iconRight={<IconArrowRight />}>
          Gå till inloggning
        </ButtonLink>
      </Card>
    );
  }

  return (
    <form action={formAction}>
      <Card padding="lg" className="flex flex-col gap-8">
        <div>
          <h1 className="text-h2">Kom igång med OfficePal</h1>
          <p className="mt-1 text-body-sm text-muted">
            Ett företag, ett admin-konto och koder till personalen i fält. Tar
            en minut.
          </p>
        </div>

        <section className="flex flex-col gap-4">
          <StepLabel n={1}>Företaget</StepLabel>
          <Field label="Företagsnamn" htmlFor="companyName">
            <Input id="companyName" name="companyName" type="text" required autoComplete="organization" />
          </Field>
        </section>

        <section className="flex flex-col gap-4 border-t border-line pt-6">
          <StepLabel n={2}>Admin-konto</StepLabel>
          <Field label="E-postadress" htmlFor="adminEmail">
            <Input id="adminEmail" name="adminEmail" type="email" autoComplete="email" required />
          </Field>
          <Field label="Lösenord" htmlFor="adminPassword" hint="Minst 8 tecken.">
            <Input
              id="adminPassword"
              name="adminPassword"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
            />
          </Field>
        </section>

        <section className="flex flex-col gap-4 border-t border-line pt-6">
          <StepLabel n={3}>Fältpersonal</StepLabel>
          <p className="text-body-sm text-muted">
            Skriv namnen på dem som ska rapportera från fält. Varje person får
            en egen kod. Du kan lägga till fler senare.
          </p>
          <div className="flex flex-col gap-2">
            {Array.from({ length: staffCount }).map((_, i) => (
              <Input
                key={i}
                name="staffName"
                type="text"
                placeholder={`Namn ${i + 1}`}
                aria-label={`Personal ${i + 1}`}
                autoComplete="off"
              />
            ))}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            iconLeft={<IconPlus size={18} />}
            className="self-start"
            onClick={() => setStaffCount((n) => n + 1)}
          >
            Lägg till fler
          </Button>
        </section>

        {state.error && <Alert tone="danger">{state.error}</Alert>}

        <Button type="submit" size="lg" fullWidth loading={pending}>
          {pending ? "Skapar" : "Skapa konto"}
        </Button>
      </Card>
    </form>
  );
}
