"use client";

import { useState } from "react";
import type { InvoiceDraft } from "@/lib/types";
import StatusBadge from "./StatusBadge";
import EmptyState from "./EmptyState";
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
        title="Inga fakturautkast väntar just nu."
        hint="När en fältrapport har bearbetats dyker fakturautkastet upp här för ditt godkännande."
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
          <li
            key={draft.id}
            id={`invoice-draft-${draft.id}`}
            className={`rounded-xl border p-4 transition-shadow ${
              isHighlighted
                ? "border-[#2563EB] ring-2 ring-[#2563EB]/30"
                : "border-blue-100"
            } bg-white`}
          >
            {isEditing ? (
              <div className="flex flex-col gap-2">
                <label className="flex flex-col gap-1 text-xs font-medium text-neutral-600">
                  Kund
                  <input
                    value={draftName}
                    onChange={(e) => setDraftName(e.target.value)}
                    className="rounded-lg border border-blue-200 px-2 py-1 text-sm"
                  />
                </label>
                <label className="flex flex-col gap-1 text-xs font-medium text-neutral-600">
                  Belopp (kr)
                  <input
                    type="number"
                    value={draftAmount}
                    onChange={(e) => setDraftAmount(e.target.value)}
                    className="rounded-lg border border-blue-200 px-2 py-1 text-sm"
                  />
                </label>
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => saveEdit(draft)}
                    className="rounded-full bg-[#2563EB] px-3 py-1 text-xs font-medium text-white hover:bg-[#1E3A8A]"
                  >
                    Spara
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingId(null)}
                    className="rounded-full border border-blue-200 px-3 py-1 text-xs font-medium text-[#1E3A8A]"
                  >
                    Avbryt
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-[#1E3A8A]">{draft.customer_name}</p>
                  <p className="text-sm text-neutral-500">
                    {formatSEK(draft.amount)} · {formatDateTime(draft.created_at)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={draft.status} />
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => onApprove(draft)}
                    className="rounded-full bg-[#2563EB] px-3 py-1 text-xs font-medium text-white hover:bg-[#1E3A8A] disabled:opacity-50"
                  >
                    Godkänn
                  </button>
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => startEdit(draft)}
                    className="rounded-full border border-blue-200 px-3 py-1 text-xs font-medium text-[#1E3A8A] disabled:opacity-50"
                  >
                    Redigera
                  </button>
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => onReject(draft)}
                    className="rounded-full border border-red-200 px-3 py-1 text-xs font-medium text-red-700 disabled:opacity-50"
                  >
                    Avvisa
                  </button>
                </div>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
