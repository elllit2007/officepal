import type { Quote } from "@/lib/types";
import { Button, Card, EmptyState, IconFileText, StatusBadge } from "@/components/ui";
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
        icon={<IconFileText />}
        title="Inga offerter väntar"
        description="Offertutkast som behöver ditt godkännande innan de skickas hamnar här."
      />
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {quotes.map((quote) => {
        const isBusy = busyId === quote.id;
        const isHighlighted = highlightedId === quote.id;

        return (
          <Card
            as="li"
            key={quote.id}
            id={`quote-${quote.id}`}
            padding="sm"
            highlighted={isHighlighted}
            className="flex flex-wrap items-center justify-between gap-4 scroll-mt-24 sm:p-5"
          >
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
                variant="destructive"
                disabled={isBusy}
                onClick={() => onReject(quote)}
              >
                Avvisa
              </Button>
            </div>
          </Card>
        );
      })}
    </ul>
  );
}
