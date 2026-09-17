// Track 7 (Auth & onboarding) — Supabase-klient för Server Components,
// Server Actions och Route Handlers. Läser/skriver session via cookies.
// Använder anon-nyckeln; RLS gäller alltid för denna klient (se supabase/SETUP.md).

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "./database";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // setAll anropas från en Server Component utan möjlighet att
            // sätta cookies — ofarligt så länge middleware uppdaterar
            // sessionen på varje request (se lib/supabase/middleware.ts).
          }
        },
      },
    },
  );
}
