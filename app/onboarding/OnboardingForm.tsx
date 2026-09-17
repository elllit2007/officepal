"use client";

import { useActionState, useState, type FormEvent } from "react";
import { createTenant, type OnboardingState } from "@/app/onboarding/actions";
import {
  MIN_PASSWORD_LENGTH,
  validateOnboarding,
  type OnboardingField,
  type OnboardingFieldErrors,
} from "@/app/onboarding/lib/validate";
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

const FIELD_ORDER: OnboardingField[] = ["companyName", "adminEmail", "adminPassword"];

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
  const [values, setValues] = useState({
    companyName: "",
    adminEmail: "",
    adminPassword: "",
  });
  const [touched, setTouched] = useState<Partial<Record<OnboardingField, boolean>>>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const errors: OnboardingFieldErrors = validateOnboarding(values);

  // Fel visas när fältet lämnats (blur) eller efter ett skickförsök — inte
  // medan användaren fortfarande skriver i fältet första gången.
  const visibleError = (field: OnboardingField) =>
    touched[field] || submitAttempted ? errors[field] : undefined;

  const setValue = (field: OnboardingField, value: string) =>
    setValues((prev) => ({ ...prev, [field]: value }));

  const markTouched = (field: OnboardingField) =>
    setTouched((prev) => ({ ...prev, [field]: true }));

  // Körs innan server-actionen: om något fält är ogiltigt stoppas
  // inskicket här och första ogiltiga fält får fokus.
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    setSubmitAttempted(true);
    const firstInvalid = FIELD_ORDER.find((field) => errors[field]);
    if (firstInvalid) {
      e.preventDefault();
      const el = e.currentTarget.elements.namedItem(firstInvalid);
      if (el instanceof HTMLElement) el.focus();
    }
  };

  if (state.success) {
    return (
      <Card padding="lg" className="flex flex-col gap-6">
        <div>
          <h1 className="text-h2">{state.success.tenantName} är redo</h1>
          <p className="mt-1 text-body-sm text-muted">
            {state.success.staff.length > 0
              ? "Ge varje person sin kod. Koderna visas bara den här gången, så spara dem nu."
              : "Admin-kontot är skapat."}
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

  const companyNameError = visibleError("companyName");
  const adminEmailError = visibleError("adminEmail");
  const adminPasswordError = visibleError("adminPassword");

  return (
    <form action={formAction} onSubmit={handleSubmit} noValidate>
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
          <Field label="Företagsnamn" htmlFor="companyName" error={companyNameError}>
            <Input
              id="companyName"
              name="companyName"
              type="text"
              required
              autoComplete="organization"
              value={values.companyName}
              onChange={(e) => setValue("companyName", e.target.value)}
              onBlur={() => markTouched("companyName")}
              invalid={Boolean(companyNameError)}
              aria-describedby={companyNameError ? "companyName-error" : undefined}
            />
          </Field>
        </section>

        <section className="flex flex-col gap-4 border-t border-line pt-6">
          <StepLabel n={2}>Admin-konto</StepLabel>
          <Field label="E-postadress" htmlFor="adminEmail" error={adminEmailError}>
            <Input
              id="adminEmail"
              name="adminEmail"
              type="email"
              autoComplete="email"
              required
              value={values.adminEmail}
              onChange={(e) => setValue("adminEmail", e.target.value)}
              onBlur={() => markTouched("adminEmail")}
              invalid={Boolean(adminEmailError)}
              aria-describedby={adminEmailError ? "adminEmail-error" : undefined}
            />
          </Field>
          <Field
            label="Lösenord"
            htmlFor="adminPassword"
            error={adminPasswordError}
            hint={`Minst ${MIN_PASSWORD_LENGTH} tecken.`}
          >
            <Input
              id="adminPassword"
              name="adminPassword"
              type="password"
              autoComplete="new-password"
              required
              minLength={MIN_PASSWORD_LENGTH}
              value={values.adminPassword}
              onChange={(e) => setValue("adminPassword", e.target.value)}
              onBlur={() => markTouched("adminPassword")}
              invalid={Boolean(adminPasswordError)}
              aria-describedby={adminPasswordError ? "adminPassword-error" : "adminPassword-hint"}
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
