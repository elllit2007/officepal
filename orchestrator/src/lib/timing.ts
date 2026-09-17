import { logger } from "./logger.js";

/**
 * Wraps an async step with a performance.now() start/end diff, logged as
 * structured JSON via the existing logger. Used to find where request time
 * goes across the process-report flow (Claude API turns, Supabase
 * reads/writes) — see investigation notes in agent/client.ts.
 */
export async function timed<T>(
  label: string,
  fields: Record<string, unknown>,
  // PromiseLike, not Promise: Supabase's query builders are thenable but
  // don't implement the full Promise interface (catch/finally/toStringTag),
  // and are usually awaited directly rather than passed around.
  fn: () => PromiseLike<T>,
): Promise<T> {
  const start = performance.now();
  try {
    const result = await fn();
    logger.info(`timing: ${label}`, { ...fields, ms: Math.round(performance.now() - start) });
    return result;
  } catch (err) {
    logger.info(`timing: ${label} (threw)`, { ...fields, ms: Math.round(performance.now() - start) });
    throw err;
  }
}
