import type { Quote } from "@/lib/types";
import StatusBadge from "./StatusBadge";
import { formatDateTime } from "../lib/format";

export default function QuoteList({ quotes }: { quotes: Quote[] }) {
  if (quotes.length === 0) {
    return <p className="text-sm text-neutral-500">Inga offerter väntar på godkännande just nu.</p>;
  }

  return (
    <ul className="flex flex-col gap-3">
      {quotes.map((quote) => (
        <li
          key={quote.id}
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-blue-100 bg-white p-4"
        >
          <div>
            <p className="font-medium text-[#1E3A8A]">{quote.customer_name}</p>
            <p className="text-sm text-neutral-500">{formatDateTime(quote.created_at)}</p>
          </div>
          <StatusBadge status={quote.status} />
        </li>
      ))}
    </ul>
  );
}
