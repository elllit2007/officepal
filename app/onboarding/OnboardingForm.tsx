"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { createTenant, type OnboardingState } from "@/app/onboarding/actions";

const initialState: OnboardingState = { error: null, success: null };

export default function OnboardingForm() {
  const [state, formAction, pending] = useActionState(
    createTenant,
    initialState,
  );
  const [staffCount, setStaffCount] = useState(3);

  if (state.success) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold">
            {state.success.tenantName} är redo
          </h1>
          <p className="text-sm text-black/60">
            Spara accesskoderna nedan — de visas bara den här gången.
          </p>
        </div>

        {state.success.staff.length > 0 && (
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

  return (
    <form action={formAction} className="flex flex-col gap-6">
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
          className="rounded border border-black/15 px-3 py-2 outline-none focus:border-black/40"
        />
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
            className="rounded border border-black/15 px-3 py-2 outline-none focus:border-black/40"
          />
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
            minLength={8}
            className="rounded border border-black/15 px-3 py-2 outline-none focus:border-black/40"
          />
          <p className="text-xs text-black/50">Minst 8 tecken.</p>
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
        className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
      >
        {pending ? "Skapar…" : "Skapa konto"}
      </button>
    </form>
  );
}
