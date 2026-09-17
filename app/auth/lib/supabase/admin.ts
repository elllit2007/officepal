// Track 7 (Auth & onboarding) — Supabase-klient med service-role-nyckeln.
//
// Kringgår RLS helt. Får ENDAST användas i server-side kod (Server Actions,
// Route Handlers) som själv validerar vad den skriver — aldrig i klientkod.
// Se supabase/SETUP.md, avsnitt "Hur RLS är tänkt att fungera".
//
// Används av onboarding-flödet (app/onboarding/) för att skapa tenants och
// admin-användare innan någon session/JWT med tenant_id-claim finns.

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database";

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL och SUPABASE_SERVICE_ROLE_KEY måste vara satta för admin-klienten.",
    );
  }

  return createSupabaseClient<Database>(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
