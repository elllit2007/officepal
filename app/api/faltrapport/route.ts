import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Staff } from "@/lib/types";
import { processReport, OrchestratorRequestError } from "@/lib/orchestrator-client";

// Track 3 (Fältrapport) — se BUILD-CONTRACT.md.
//
// Fältpersonal har ingen Supabase Auth-session (se staff.access_code i
// supabase/SETUP.md), så den här routen kör server-side med service-role-
// nyckeln och validerar access_code manuellt — det är fortfarande denna
// routens jobb (orkestratorn känner inte till access_code). Själva
// fältrapport-bearbetningen (spara + extrahera + skapa utkast) sker nu i
// orkestratorn via lib/orchestrator-client, se Track 8.
//
// OBS: createClient tas medvetet UTAN Database-generic här. lib/types.ts
// Database-typ saknar för närvarande Views/Functions/Relationships som
// @supabase/supabase-js v2's GenericSchema kräver, vilket gör insert/select
// felaktigt till `never` om den kopplas in. Vi använder ändå lib/types.ts
// row-/insert-typerna nedan via uttryckliga typer/casts. Track 1 äger
// lib/types.ts — flagga till dem om Database-formen ska rättas.

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "Supabase-miljövariabler saknas (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).",
    );
  }

  return createClient(url, serviceKey, {
    auth: { persistSession: false },
  });
}

export async function POST(request: Request) {
  let body: { access_code?: unknown; raw_text?: unknown };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Ogiltig förfrågan." },
      { status: 400 },
    );
  }

  const accessCode =
    typeof body.access_code === "string" ? body.access_code.trim() : "";
  const rawText =
    typeof body.raw_text === "string" ? body.raw_text.trim() : "";

  if (!accessCode) {
    return NextResponse.json(
      { error: "Ange din kod." },
      { status: 400 },
    );
  }

  if (!rawText) {
    return NextResponse.json(
      { error: "Beskrivningen av jobbet får inte vara tom." },
      { status: 400 },
    );
  }

  let supabase: ReturnType<typeof getServiceClient>;
  try {
    supabase = getServiceClient();
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Servern är inte rätt konfigurerad. Kontakta admin." },
      { status: 500 },
    );
  }

  // access_code är unik per tenant (inte globalt, se schema.sql), men i
  // Nina-piloten finns bara en tenant. Tar första träffen om koden mot
  // förmodan skulle finnas i flera tenants.
  const { data: staffData, error: staffError } = await supabase
    .from("staff")
    .select("id, tenant_id, name")
    .eq("access_code", accessCode)
    .limit(1)
    .maybeSingle();

  const staff = staffData as Pick<Staff, "id" | "tenant_id" | "name"> | null;

  if (staffError) {
    console.error(staffError);
    return NextResponse.json(
      { error: "Kunde inte verifiera koden just nu. Försök igen." },
      { status: 500 },
    );
  }

  if (!staff) {
    return NextResponse.json(
      { error: "Ogiltig kod. Kontrollera att du skrev rätt." },
      { status: 401 },
    );
  }

  let result;
  try {
    result = await processReport({
      tenant_id: staff.tenant_id,
      staff_id: staff.id,
      raw_text: rawText,
    });
  } catch (err) {
    console.error(err);
    if (err instanceof OrchestratorRequestError && err.status === 400) {
      return NextResponse.json(
        { error: "Rapporten kunde inte behandlas. Försök igen." },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: "Kunde inte behandla rapporten just nu. Försök igen." },
      { status: 502 },
    );
  }

  return NextResponse.json({
    ok: true,
    report_id: result.field_report_id,
    staff_name: staff.name,
  });
}
