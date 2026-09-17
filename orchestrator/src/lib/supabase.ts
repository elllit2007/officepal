import { createClient } from "@supabase/supabase-js";
import { config } from "../config.js";
import type { Database } from "../types.js";

// Service-role client: bypasses Row Level Security. This is the standard
// Supabase pattern for trusted server-side code (see supabase/schema.sql
// comments) — the orchestrator writes across tenants and is never reachable
// from a browser. NEVER send this key to a client/browser.
export const supabase = createClient<Database>(
  config.supabaseUrl,
  config.supabaseServiceRoleKey,
  { auth: { persistSession: false } },
);
