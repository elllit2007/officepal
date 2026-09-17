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
}

export default function QuoteList({
  quotes,
  highlightedId,
  busyId,
  onApprove,
  onReject,
}: QuoteListProps) {
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
        const isBusy = busyId === quote.id;
        const isHighlighted = highlightedId === quote.id;

        return (
          <li
            key={quote.id}
            id={`quote-${quote.id}`}
            className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4 transition-shadow ${
              isHighlighted ? "border-[#2563EB] ring-2 ring-[#2563EB]/30" : "border-blue-100"
            } bg-white`}
          >
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
                onClick={() => onReject(quote)}
                className="rounded-full border border-red-200 px-3 py-1 text-xs font-medium text-red-700 disabled:opacity-50"
              >
                Avvisa
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
