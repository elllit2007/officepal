"use client";

import { useState } from "react";
import type { Quote } from "@/lib/types";
import {
  Button,
  Card,
  EmptyState,
  Field,
  IconFileText,
  StatusBadge,
  Textarea,
  Input,
} from "@/components/ui";
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
        icon={<IconFileText />}
        title="Inga offerter väntar"
        description="Offertutkast som behöver ditt godkännande innan de skickas hamnar här."
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
          <Card
            as="li"
            key={quote.id}
            id={`quote-${quote.id}`}
            padding="sm"
            highlighted={isHighlighted}
            className="scroll-mt-24 sm:p-5"
          >
            {isEditing ? (
              <div className="flex flex-col gap-4">
                <Field label="Kund" htmlFor={`edit-quote-name-${quote.id}`}>
                  <Input
                    id={`edit-quote-name-${quote.id}`}
                    value={draftName}
                    onChange={(e) => setDraftName(e.target.value)}
                  />
                </Field>
                <Field label="Offertinnehåll" htmlFor={`edit-quote-content-${quote.id}`}>
                  <Textarea
                    id={`edit-quote-content-${quote.id}`}
                    value={draftContent}
                    onChange={(e) => setDraftContent(e.target.value)}
                    rows={4}
                  />
                </Field>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => saveEdit(quote)}>
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
                  <p className="text-h4 truncate">{quote.customer_name}</p>
                  <p className="text-body-sm text-muted">{formatDateTime(quote.created_at)}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={quote.status} />
                  <Button size="sm" disabled={isBusy} onClick={() => onApprove(quote)}>
                    Godkänn
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={isBusy}
                    onClick={() => startEdit(quote)}
                  >
                    Redigera
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={isBusy}
                    onClick={() => onReject(quote)}
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
