import type { Database as ContractDatabase } from "@/lib/types";

// lib/types.ts (Track 1) beskriver Row/Insert/Update per tabell men saknar de
// fält (Relationships/Views/Functions) som @supabase/supabase-js numera kräver
// av sin generiska Database-typ. Anpassar det kontraktet lokalt här istället
// för att ändra Track 1:s fil.
type WithRelationships<Tables> = {
  [K in keyof Tables]: Tables[K] & { Relationships: [] };
};

export type SupabaseDatabase = {
  public: {
    Tables: WithRelationships<ContractDatabase["public"]["Tables"]>;
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
};
