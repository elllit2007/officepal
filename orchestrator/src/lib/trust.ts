import { supabase } from "./supabase.js";
import { timed } from "./timing.js";
import type { TrustLevel } from "../types.js";

const DEFAULT_TRUST_LEVEL: TrustLevel = "ask_always";

/**
 * Reads trust_settings(tenant_id, task_type). Missing row => "ask_always"
 * (safe default — BUILD-CONTRACT.md: "Ingen skrivande åtgärd exekveras utan
 * att passera trust_settings-kontrollen").
 */
export async function checkTrustLevel(
  tenantId: string,
  taskType: string,
): Promise<TrustLevel> {
  const { data, error } = await timed(
    "supabase: trust_settings lookup",
    { tenant_id: tenantId, task_type: taskType },
    () =>
      supabase
        .from("trust_settings")
        .select("level")
        .eq("tenant_id", tenantId)
        .eq("task_type", taskType)
        .maybeSingle(),
  );

  if (error) {
    throw new Error(`check_trust_level: query failed: ${error.message}`);
  }

  return data?.level ?? DEFAULT_TRUST_LEVEL;
}

/**
 * Whether a level lets a writing tool execute without a human decision.
 *
 * "ask_if_unsure" is treated the same as "ask_always" here: the orchestrator
 * has no reliable signal today for what "unsure" means, so it errs toward
 * requiring approval rather than guessing. Only "autonomous" skips the gate.
 */
export function isAutonomous(level: TrustLevel): boolean {
  return level === "autonomous";
}
