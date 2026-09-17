/**
 * Tomt-läge för listvyer: en tydlig "inget här ännu"-ruta istället för
 * en tom yta, med en kort förklaring av när något kommer att dyka upp.
 */
export default function EmptyState({
  title,
  hint,
}: {
  title: string;
  hint?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-xl border border-dashed border-blue-200 bg-white/60 px-6 py-8 text-center">
      <p className="text-sm font-medium text-[#1E3A8A]">{title}</p>
      {hint && <p className="max-w-sm text-sm text-neutral-500">{hint}</p>}
    </div>
  );
}
