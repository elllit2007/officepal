/** Slår ihop klassnamn och hoppar över falsy-värden. */
export function cn(
  ...parts: Array<string | number | false | null | undefined>
): string {
  return parts.filter(Boolean).join(" ");
}
