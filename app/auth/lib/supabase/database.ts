// Track 7 — adapter runt lib/types.ts:s `Database`-typ.
//
// @supabase/supabase-js v2:s generiska klient-typer kräver att varje
// tabell har en `Relationships`-nyckel och att schemat deklarerar
// Views/Functions (inte bara Tables) för att typinferensen på
// insert/update-payloads ska slå in korrekt istället för att falla
// tillbaka på `never`. lib/types.ts (Track 1:s kontrakt) deklarerar
// medvetet varken det ena eller det andra. Vi utökar typen lokalt här
// istället för att ändra lib/types.ts, som Track 7 inte äger.

import type { Database as AppDatabase } from "@/lib/types";

// lib/types.ts:s rad-typer är `interface`, som saknar implicit
// indexsignatur — och postgrest-js kräver att Row/Insert/Update är
// tilldelningsbara till `Record<string, unknown>`. `Plain<T>` mappar om
// interfacet till en anonym objekttyp med samma fält, vilket ger den
// indexsignaturen den behöver.
type Plain<T> = { [K in keyof T]: T[K] };

type WithRelationships<Tables> = {
  [K in keyof Tables]: Tables[K] extends {
    Row: infer Row;
    Insert: infer Insert;
    Update: infer Update;
  }
    ? { Row: Plain<Row>; Insert: Plain<Insert>; Update: Plain<Update>; Relationships: never[] }
    : never;
};

export type Database = {
  public: {
    Tables: WithRelationships<AppDatabase["public"]["Tables"]>;
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
};
