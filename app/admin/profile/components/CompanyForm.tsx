"use client";

import { useActionState } from "react";
import { Alert, Button, Field, Input } from "@/components/ui";
import { updateCompanyName, type FormState } from "../actions";

const initialState: FormState = { error: null, success: null };

export default function CompanyForm({ name }: { name: string }) {
  const [state, formAction, pending] = useActionState(updateCompanyName, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Field label="Företagsnamn" htmlFor="companyName" hint="Visas i adminpanelen och i utskick.">
        <Input
          id="companyName"
          name="companyName"
          defaultValue={name}
          required
          minLength={2}
          maxLength={80}
          autoComplete="organization"
        />
      </Field>
      {state.error && <Alert tone="danger">{state.error}</Alert>}
      {state.success && <Alert tone="success">{state.success}</Alert>}
      <div>
        <Button type="submit" loading={pending}>
          Spara
        </Button>
      </div>
    </form>
  );
}
