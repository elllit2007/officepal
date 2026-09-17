"use client";

import { useActionState } from "react";
import { signIn, type SignInState } from "@/app/auth/actions";
import { Alert, Button, Field, Input } from "@/components/ui";

const initialState: SignInState = { error: null };

export default function LoginForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState(signIn, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="next" value={next} />

      <Field label="E-postadress" htmlFor="email">
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          invalid={Boolean(state.error)}
        />
      </Field>

      <Field label="Lösenord" htmlFor="password">
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          invalid={Boolean(state.error)}
        />
      </Field>

      {state.error && <Alert tone="danger">{state.error}</Alert>}

      <Button type="submit" size="lg" fullWidth loading={pending}>
        {pending ? "Loggar in" : "Logga in"}
      </Button>
    </form>
  );
}
