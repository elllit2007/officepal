"use client";

import { useState } from "react";
import type { Quote } from "@/lib/types";
import StatusBadge from "./StatusBadge";
import EmptyState from "./EmptyState";
import { formatDateTime } from "../lib/format";

interface QuoteListProps {
  quotes: Quote[];
  highlightedId?: string | null;
  busyId?: string | null;
  onApprove: (quote: Quote) => void;
  onReject: (quote: Quote) => void;
  onEdit: (quote: Quote, patch: { customer_name: string; content: string }) => void;
}

export default function QuoteList({
  quotes,
  highlightedId,
  busyId,
  onApprove,
  onReject,
  onEdit,
}: QuoteListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState("");
  const [draftContent, setDraftContent] = useState("");

  const startEdit = (quote: Quote) => {
    setEditingId(quote.id);
    setDraftName(quote.customer_name);
    setDraftContent(quote.content);
  };

  const saveEdit = (quote: Quote) => {
    if (!draftName.trim() || !draftContent.trim()) return;
    onEdit(quote, { customer_name: draftName.trim(), content: draftContent.trim() });
    setEditingId(null);
  };

  if (quotes.length === 0) {
    return (
      <EmptyState
        title="Inga offerter väntar just nu."
        hint="Offertutkast som behöver ditt godkännande innan de skickas visas här."
      />
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {quotes.map((quote) => {
        const isEditing = editingId === quote.id;
        const isBusy = busyId === quote.id;
        const isHighlighted = highlightedId === quote.id;

        return (
          <li
            key={quote.id}
            id={`quote-${quote.id}`}
            className={`rounded-xl border p-4 transition-shadow ${
              isHighlighted ? "border-[#2563EB] ring-2 ring-[#2563EB]/30" : "border-blue-100"
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
                  Offertinnehåll
                  <textarea
                    value={draftContent}
                    onChange={(e) => setDraftContent(e.target.value)}
                    rows={4}
                    className="rounded-lg border border-blue-200 px-2 py-1 text-sm"
                  />
                </label>
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => saveEdit(quote)}
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
                  <p className="font-medium text-[#1E3A8A]">{quote.customer_name}</p>
                  <p className="text-sm text-neutral-500">{formatDateTime(quote.created_at)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={quote.status} />
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => onApprove(quote)}
                    className="rounded-full bg-[#2563EB] px-3 py-1 text-xs font-medium text-white hover:bg-[#1E3A8A] disabled:opacity-50"
                  >
                    Godkänn
                  </button>
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => startEdit(quote)}
                    className="rounded-full border border-blue-200 px-3 py-1 text-xs font-medium text-[#1E3A8A] disabled:opacity-50"
                  >
                    Redigera
                  </button>
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => onReject(quote)}
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
