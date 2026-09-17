import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types";

// Track 4 (admin) — läser data direkt från klienten med anon-nyckeln.
// RLS scopar detta mot inloggad tenant (se supabase/SETUP.md). Innan Track 7:s
// inloggning finns på plats returnerar detta inga rader (ingen JWT-claim att
// matcha mot), vilket är förväntat, inte ett fel i denna kod.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = createClient<Database>(
  supabaseUrl ?? "https://placeholder.supabase.co",
  supabaseAnonKey ?? "placeholder-anon-key",
);
