"use client";

import { useActionState } from "react";
import { Alert, Button, Field, Input } from "@/components/ui";
import { updateEmail, updatePassword, type FormState } from "../actions";

const initialState: FormState = { error: null, success: null };

export function EmailForm({ email }: { email: string }) {
  const [state, formAction, pending] = useActionState(updateEmail, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Field
        label="E-postadress"
        htmlFor="email"
        hint="Du får en bekräftelselänk innan bytet slår igenom."
      >
        <Input
          id="email"
          name="email"
          type="email"
          defaultValue={email}
          required
          autoComplete="email"
        />
      </Field>
      {state.error && <Alert tone="danger">{state.error}</Alert>}
      {state.success && <Alert tone="success">{state.success}</Alert>}
      <div>
        <Button type="submit" variant="secondary" loading={pending}>
          Byt e-postadress
        </Button>
      </div>
    </form>
  );
}

export function PasswordForm() {
  const [state, formAction, pending] = useActionState(updatePassword, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4" autoComplete="off">
      <Field label="Nuvarande lösenord" htmlFor="currentPassword">
        <Input
          id="currentPassword"
          name="currentPassword"
          type="password"
          required
          autoComplete="current-password"
        />
      </Field>
      <Field label="Nytt lösenord" htmlFor="newPassword" hint="Minst 8 tecken.">
        <Input
          id="newPassword"
          name="newPassword"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
        />
      </Field>
      <Field label="Upprepa nytt lösenord" htmlFor="confirmPassword">
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
        />
      </Field>
      {state.error && <Alert tone="danger">{state.error}</Alert>}
      {state.success && <Alert tone="success">{state.success}</Alert>}
      <div>
        <Button type="submit" variant="secondary" loading={pending}>
          Byt lösenord
        </Button>
      </div>
    </form>
  );
}
