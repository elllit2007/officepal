"use client";

import { useActionState, useState, type FormEvent } from "react";
import Link from "next/link";
import { createTenant, type OnboardingState } from "@/app/onboarding/actions";
import {
  MIN_PASSWORD_LENGTH,
  validateOnboarding,
  type OnboardingField,
  type OnboardingFieldErrors,
} from "@/app/onboarding/lib/validate";

const initialState: OnboardingState = { error: null, success: null };

const FIELD_ORDER: OnboardingField[] = ["companyName", "adminEmail", "adminPassword"];

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="text-sm text-red-600">
      {message}
    </p>
  );
}

function inputClass(invalid: boolean) {
  return `rounded border px-3 py-2 outline-none ${
    invalid
      ? "border-red-500 focus:border-red-600"
      : "border-black/15 focus:border-black/40"
  }`;
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
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold">
            {state.success.tenantName} är redo
          </h1>
          <p className="text-sm text-black/60">
            {state.success.staff.length > 0
              ? "Spara accesskoderna nedan — de visas bara den här gången."
              : "Admin-kontot är skapat."}
          </p>
        </div>

        {state.success.staff.length > 0 ? (
          <ul className="flex flex-col gap-2">
            {state.success.staff.map((member) => (
              <li
                key={member.access_code}
                className="flex items-center justify-between rounded border border-black/15 px-3 py-2"
              >
                <span>{member.name}</span>
                <code className="rounded bg-black/5 px-2 py-1 font-mono text-sm tracking-wider">
                  {member.access_code}
                </code>
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded border border-dashed border-black/15 px-3 py-4 text-center text-sm text-black/60">
            Ingen fältpersonal lades till, så inga accesskoder skapades. Du kan
            lägga till personal senare.
          </p>
        )}

        <Link
          href="/auth/login"
          className="rounded bg-black px-4 py-2 text-center text-white"
        >
          Gå till inloggning
        </Link>
      </div>
    );
  }

  const companyNameError = visibleError("companyName");
  const adminEmailError = visibleError("adminEmail");
  const adminPasswordError = visibleError("adminPassword");

  return (
    <form
      action={formAction}
      onSubmit={handleSubmit}
      noValidate
      className="flex flex-col gap-6"
    >
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold">Skapa konto</h1>
        <p className="text-sm text-black/60">
          Ett företag, ett admin-konto och accesskoder för fältpersonal.
        </p>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="companyName" className="text-sm font-medium">
          Företagsnamn
        </label>
        <input
          id="companyName"
          name="companyName"
          type="text"
          required
          value={values.companyName}
          onChange={(e) => setValue("companyName", e.target.value)}
          onBlur={() => markTouched("companyName")}
          aria-invalid={Boolean(companyNameError)}
          aria-describedby={companyNameError ? "companyName-error" : undefined}
          className={inputClass(Boolean(companyNameError))}
        />
        <FieldError id="companyName-error" message={companyNameError} />
      </div>

      <div className="flex flex-col gap-4 border-t border-black/10 pt-4">
        <p className="text-sm font-medium">Admin-konto</p>

        <div className="flex flex-col gap-1">
          <label htmlFor="adminEmail" className="text-sm font-medium">
            E-post
          </label>
          <input
            id="adminEmail"
            name="adminEmail"
            type="email"
            autoComplete="email"
            required
            value={values.adminEmail}
            onChange={(e) => setValue("adminEmail", e.target.value)}
            onBlur={() => markTouched("adminEmail")}
            aria-invalid={Boolean(adminEmailError)}
            aria-describedby={adminEmailError ? "adminEmail-error" : undefined}
            className={inputClass(Boolean(adminEmailError))}
          />
          <FieldError id="adminEmail-error" message={adminEmailError} />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="adminPassword" className="text-sm font-medium">
            Lösenord
          </label>
          <input
            id="adminPassword"
            name="adminPassword"
            type="password"
            autoComplete="new-password"
            required
            minLength={MIN_PASSWORD_LENGTH}
            value={values.adminPassword}
            onChange={(e) => setValue("adminPassword", e.target.value)}
            onBlur={() => markTouched("adminPassword")}
            aria-invalid={Boolean(adminPasswordError)}
            aria-describedby={
              adminPasswordError ? "adminPassword-error" : "adminPassword-hint"
            }
            className={inputClass(Boolean(adminPasswordError))}
          />
          {adminPasswordError ? (
            <FieldError id="adminPassword-error" message={adminPasswordError} />
          ) : (
            <p id="adminPassword-hint" className="text-xs text-black/50">
              Minst {MIN_PASSWORD_LENGTH} tecken.
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t border-black/10 pt-4">
        <p className="text-sm font-medium">Fältpersonal</p>
        <p className="text-xs text-black/50">
          Namnge personal som ska få en accesskod. Du kan lägga till fler
          senare.
        </p>

        <div className="flex flex-col gap-2">
          {Array.from({ length: staffCount }).map((_, i) => (
            <input
              key={i}
              name="staffName"
              type="text"
              placeholder={`Namn ${i + 1}`}
              aria-label={`Namn på fältpersonal ${i + 1}`}
              className="rounded border border-black/15 px-3 py-2 outline-none focus:border-black/40"
            />
          ))}
        </div>

        <button
          type="button"
          onClick={() => setStaffCount((n) => n + 1)}
          className="self-start text-sm text-black/60 underline hover:text-black"
        >
          + Lägg till fler
        </button>
      </div>

      {state.error && (
        <p role="alert" className="text-sm text-red-600">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        aria-busy={pending}
        className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
      >
        {pending ? "Skapar…" : "Skapa konto"}
      </button>
    </form>
  );
}
