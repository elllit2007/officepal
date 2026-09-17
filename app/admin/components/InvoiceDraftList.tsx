"use client";

import { useState } from "react";
import type { InvoiceDraft } from "@/lib/types";
import {
  Button,
  Card,
  EmptyState,
  Field,
  IconReceipt,
  Input,
  StatusBadge,
} from "@/components/ui";
import { formatSEK, formatDateTime } from "../lib/format";

interface InvoiceDraftListProps {
  invoiceDrafts: InvoiceDraft[];
  highlightedId?: string | null;
  busyId?: string | null;
  onApprove: (draft: InvoiceDraft) => void;
  onReject: (draft: InvoiceDraft) => void;
  onEdit: (draft: InvoiceDraft, patch: { customer_name: string; amount: number }) => void;
}

export default function InvoiceDraftList({
  invoiceDrafts,
  highlightedId,
  busyId,
  onApprove,
  onReject,
  onEdit,
}: InvoiceDraftListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState("");
  const [draftAmount, setDraftAmount] = useState("");

  const startEdit = (draft: InvoiceDraft) => {
    setEditingId(draft.id);
    setDraftName(draft.customer_name);
    setDraftAmount(String(draft.amount));
  };

  const saveEdit = (draft: InvoiceDraft) => {
    const amount = Number(draftAmount);
    if (!draftName.trim() || Number.isNaN(amount)) return;
    onEdit(draft, { customer_name: draftName.trim(), amount });
    setEditingId(null);
  };

  if (invoiceDrafts.length === 0) {
    return (
      <EmptyState
        icon={<IconReceipt />}
        title="Inga fakturautkast väntar"
        description="När personalen rapporterar ett jobb dyker utkastet upp här för ditt godkännande."
      />
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {invoiceDrafts.map((draft) => {
        const isEditing = editingId === draft.id;
        const isBusy = busyId === draft.id;
        const isHighlighted = highlightedId === draft.id;

        return (
          <Card
            as="li"
            key={draft.id}
            id={`invoice-draft-${draft.id}`}
            padding="sm"
            highlighted={isHighlighted}
            className="scroll-mt-24 sm:p-5"
          >
            {isEditing ? (
              <div className="flex flex-col gap-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Kund" htmlFor={`edit-name-${draft.id}`}>
                    <Input
                      id={`edit-name-${draft.id}`}
                      value={draftName}
                      onChange={(e) => setDraftName(e.target.value)}
                    />
                  </Field>
                  <Field label="Belopp (kr)" htmlFor={`edit-amount-${draft.id}`}>
                    <Input
                      id={`edit-amount-${draft.id}`}
                      type="number"
                      inputMode="decimal"
                      value={draftAmount}
                      onChange={(e) => setDraftAmount(e.target.value)}
                    />
                  </Field>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => saveEdit(draft)}>
                    Spara
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => setEditingId(null)}>
                    Avbryt
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-h4 truncate">{draft.customer_name}</p>
                  <p className="text-body-sm text-muted">
                    <span className="font-medium text-ink tabular-nums">
                      {formatSEK(draft.amount)}
                    </span>
                    {" · "}
                    {formatDateTime(draft.created_at)}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={draft.status} />
                  <Button size="sm" disabled={isBusy} onClick={() => onApprove(draft)}>
                    Godkänn
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={isBusy}
                    onClick={() => startEdit(draft)}
                  >
                    Redigera
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={isBusy}
                    onClick={() => onReject(draft)}
                  >
                    Avvisa
                  </Button>
                </div>
              </div>
            )}
          </Card>
        );
      })}
    </ul>
  );
}
