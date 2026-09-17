/**
 * Platshållare som visas under första datahämtningen, så att sidan inte
 * blinkar till tom (eller till "inga poster") innan datan hunnit fram.
 */
export default function ListSkeleton({ rows = 2 }: { rows?: number }) {
  return (
    <ul aria-hidden="true" className="flex flex-col gap-3">
      {Array.from({ length: rows }).map((_, i) => (
        <li
          key={i}
          className="flex animate-pulse items-center justify-between gap-3 rounded-xl border border-blue-100 bg-white p-4"
        >
          <div className="flex flex-col gap-2">
            <div className="h-4 w-40 rounded bg-blue-100" />
            <div className="h-3 w-28 rounded bg-blue-50" />
          </div>
          <div className="h-6 w-24 rounded-full bg-blue-50" />
        </li>
      ))}
    </ul>
  );
}
