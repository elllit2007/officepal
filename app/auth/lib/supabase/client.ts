// Track 7 (Auth & onboarding) — Supabase-klient för Client Components.
// Använder anon-nyckeln; RLS gäller alltid för denna klient (se supabase/SETUP.md).

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./database";

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
