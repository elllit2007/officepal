"use client";

import { useActionState, useState, useTransition } from "react";
import type { Staff } from "@/lib/types";
import {
  Alert,
  Button,
  CodeChip,
  EmptyState,
  Field,
  IconPlus,
  IconRefresh,
  IconTrash,
  IconUsers,
  Input,
} from "@/components/ui";
import { addStaff, deleteStaff, regenerateStaffCode, type FormState } from "../actions";

const initialState: FormState = { error: null, success: null };

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("sv-SE", { dateStyle: "medium" }).format(new Date(iso));
}

function StaffRow({ member }: { member: Staff }) {
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const [message, setMessage] = useState<{ tone: "success" | "danger"; text: string } | null>(null);

  const run = (action: () => Promise<FormState>) => {
    setMessage(null);
    startTransition(async () => {
      const result = await action();
      setConfirming(false);
      if (result.error) setMessage({ tone: "danger", text: result.error });
      else if (result.success) setMessage({ tone: "success", text: result.success });
    });
  };

  return (
    <li className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0" aria-busy={pending || undefined}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1">
          <p className="text-h4 truncate">{member.name}</p>
          <CodeChip>{member.access_code}</CodeChip>
          <span className="text-caption text-muted">sedan {formatDate(member.created_at)}</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {confirming ? (
            <>
              <span className="text-body-sm text-muted">Ta bort {member.name}?</span>
              <Button
                size="sm"
                variant="destructive"
                loading={pending}
                onClick={() => run(() => deleteStaff(member.id))}
              >
                Ja, ta bort
              </Button>
              <Button size="sm" variant="ghost" disabled={pending} onClick={() => setConfirming(false)}>
                Avbryt
              </Button>
            </>
          ) : (
            <>
              <Button
                size="sm"
                variant="secondary"
                iconLeft={<IconRefresh size={16} />}
                loading={pending}
                onClick={() => run(() => regenerateStaffCode(member.id))}
              >
                Ny kod
              </Button>
              <Button
                size="sm"
                variant="ghost"
                iconLeft={<IconTrash size={16} />}
                disabled={pending}
                className="text-danger-ink hover:bg-danger-soft"
                onClick={() => setConfirming(true)}
              >
                Ta bort
              </Button>
            </>
          )}
        </div>
      </div>
      {message && (
        <Alert tone={message.tone} plain>
          {message.text}
        </Alert>
      )}
    </li>
  );
}

export default function StaffManager({ staff }: { staff: Staff[] }) {
  const [state, formAction, pending] = useActionState(addStaff, initialState);

  return (
    <div className="flex flex-col gap-6">
      {staff.length === 0 ? (
        <EmptyState
          icon={<IconUsers />}
          title="Ingen personal ännu"
          description="Lägg till dem som ska rapportera från fält. Varje person får en egen kod."
        />
      ) : (
        <ul className="flex flex-col divide-y divide-line">
          {staff.map((member) => (
            <StaffRow key={member.id} member={member} />
          ))}
        </ul>
      )}

      <form
        action={formAction}
        className="flex flex-col gap-4 border-t border-line pt-5"
        key={state.success ?? "form"}
      >
        <Field
          label="Lägg till person"
          htmlFor="staffName"
          hint="Personen får en kod direkt. Koden skrivs in på /faltrapport — inget lösenord."
        >
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              id="staffName"
              name="staffName"
              placeholder="För- och efternamn"
              required
              minLength={2}
              maxLength={80}
              autoComplete="off"
            />
            <Button type="submit" iconLeft={<IconPlus />} loading={pending} className="shrink-0">
              Lägg till
            </Button>
          </div>
        </Field>
        {state.error && <Alert tone="danger">{state.error}</Alert>}
        {state.success && <Alert tone="success">{state.success}</Alert>}
      </form>
    </div>
  );
}
