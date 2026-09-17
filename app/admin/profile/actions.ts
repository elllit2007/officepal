"use server";

// Kontosidan (/admin/profile) — server actions.
//
// Läsning och det mesta av skrivningen går via cookie-klienten (anon-nyckel +
// session), så RLS i supabase/schema.sql gäller: staff och trust_settings
// har full CRUD-policy per tenant. tenants har BARA select-policy, därför
// uppdateras företagsnamnet via service-role-klienten efter att vi själva
// verifierat att sessionens tenant_id är den tenant som ändras (samma
// mönster som onboarding-flödet i Track 7).

import { revalidatePath } from "next/cache";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/app/auth/lib/supabase/server";
import { createAdminClient } from "@/app/auth/lib/supabase/admin";
import { generateAccessCode } from "@/app/onboarding/lib/access-code";
import type { TrustLevel } from "@/lib/types";
import { TRUST_LEVELS, TRUST_TASK_TYPES } from "./trust";

export type FormState = { error: string | null; success: string | null };

const PROFILE_PATH = "/admin/profile";

async function requireSession() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Du är inte inloggad. Logga in och försök igen.");

  const tenantId =
    typeof user.app_metadata?.tenant_id === "string" ? user.app_metadata.tenant_id : null;
  if (!tenantId) {
    throw new Error("Kontot saknar koppling till ett företag. Kontakta support.");
  }
  return { supabase, user, tenantId };
}

function fail(err: unknown, fallback: string): FormState {
  const message = err instanceof Error && err.message ? err.message : fallback;
  return { error: message, success: null };
}

/* ---------------------------------------------------------------------- */
/* Företaget                                                               */
/* ---------------------------------------------------------------------- */

export async function updateCompanyName(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const name = String(formData.get("companyName") ?? "").trim();
  if (name.length < 2) return { error: "Ange ett företagsnamn (minst 2 tecken).", success: null };
  if (name.length > 80) return { error: "Företagsnamnet är för långt (max 80 tecken).", success: null };

  try {
    const { tenantId } = await requireSession();
    const admin = createAdminClient();
    const { error } = await admin.from("tenants").update({ name }).eq("id", tenantId);
    if (error) throw new Error("Kunde inte spara företagsnamnet. Försök igen.");
    revalidatePath(PROFILE_PATH);
    revalidatePath("/admin");
    return { error: null, success: "Företagsnamnet är sparat." };
  } catch (err) {
    return fail(err, "Kunde inte spara företagsnamnet.");
  }
}

/* ---------------------------------------------------------------------- */
/* Ditt konto                                                              */
/* ---------------------------------------------------------------------- */

export async function updateEmail(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Ange en giltig e-postadress.", success: null };
  }

  try {
    const { supabase, user } = await requireSession();
    if (user.email?.toLowerCase() === email) {
      return { error: "Det är redan din e-postadress.", success: null };
    }
    const { error } = await supabase.auth.updateUser({ email });
    if (error) {
      const msg = error.message.toLowerCase();
      throw new Error(
        msg.includes("already") || msg.includes("exists")
          ? "E-postadressen används redan av ett annat konto."
          : "Kunde inte byta e-postadress. Försök igen.",
      );
    }
    return {
      error: null,
      success: `Vi har skickat en bekräftelselänk till ${email}. Adressen byts när du klickat på den.`,
    };
  } catch (err) {
    return fail(err, "Kunde inte byta e-postadress.");
  }
}

export async function updatePassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const current = String(formData.get("currentPassword") ?? "");
  const next = String(formData.get("newPassword") ?? "");
  const confirm = String(formData.get("confirmPassword") ?? "");

  if (!current) return { error: "Ange ditt nuvarande lösenord.", success: null };
  if (next.length < 8) return { error: "Det nya lösenordet måste vara minst 8 tecken.", success: null };
  if (next !== confirm) return { error: "Lösenorden stämmer inte överens.", success: null };
  if (next === current) return { error: "Välj ett annat lösenord än det nuvarande.", success: null };

  try {
    const { supabase, user } = await requireSession();
    if (!user.email) throw new Error("Kontot saknar e-postadress.");

    // Verifiera nuvarande lösenord i en separat, sessionslös klient så att
    // inloggningen inte rör den riktiga sessionens cookies.
    const probe = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    const { error: probeError } = await probe.auth.signInWithPassword({
      email: user.email,
      password: current,
    });
    if (probeError) return { error: "Nuvarande lösenord stämmer inte.", success: null };

    const { error } = await supabase.auth.updateUser({ password: next });
    if (error) throw new Error("Kunde inte byta lösenord. Försök igen.");
    return { error: null, success: "Lösenordet är bytt." };
  } catch (err) {
    return fail(err, "Kunde inte byta lösenord.");
  }
}

/* ---------------------------------------------------------------------- */
/* Fältpersonal                                                            */
/* ---------------------------------------------------------------------- */

const CODE_ATTEMPTS = 6;

export async function addStaff(_prev: FormState, formData: FormData): Promise<FormState> {
  const name = String(formData.get("staffName") ?? "").trim();
  if (name.length < 2) return { error: "Ange personens namn.", success: null };
  if (name.length > 80) return { error: "Namnet är för långt (max 80 tecken).", success: null };

  try {
    const { supabase, tenantId } = await requireSession();

    // access_code är unik per tenant — försök igen vid krock.
    for (let attempt = 0; attempt < CODE_ATTEMPTS; attempt++) {
      const access_code = generateAccessCode();
      const { data, error } = await supabase
        .from("staff")
        .insert({ tenant_id: tenantId, name, access_code })
        .select("name, access_code")
        .single();
      if (!error && data) {
        revalidatePath(PROFILE_PATH);
        return { error: null, success: `${data.name} har fått koden ${data.access_code}.` };
      }
      if (error?.code !== "23505") {
        throw new Error("Kunde inte lägga till personen. Försök igen.");
      }
    }
    throw new Error("Kunde inte skapa en unik kod just nu. Försök igen.");
  } catch (err) {
    return fail(err, "Kunde inte lägga till personen.");
  }
}

/** Ger personen en ny kod. Den gamla slutar fungera direkt. */
export async function regenerateStaffCode(staffId: string): Promise<FormState> {
  try {
    const { supabase, tenantId } = await requireSession();
    for (let attempt = 0; attempt < CODE_ATTEMPTS; attempt++) {
      const access_code = generateAccessCode();
      const { data, error } = await supabase
        .from("staff")
        .update({ access_code })
        .eq("id", staffId)
        .eq("tenant_id", tenantId)
        .select("name, access_code")
        .maybeSingle();
      if (!error) {
        if (!data) throw new Error("Personen finns inte längre.");
        revalidatePath(PROFILE_PATH);
        return { error: null, success: `${data.name} har fått den nya koden ${data.access_code}.` };
      }
      if (error.code !== "23505") throw new Error("Kunde inte byta kod. Försök igen.");
    }
    throw new Error("Kunde inte skapa en unik kod just nu. Försök igen.");
  } catch (err) {
    return fail(err, "Kunde inte byta kod.");
  }
}

/**
 * Tar bort personen. Schemat har ingen "inaktiv"-flagga; personer med
 * fältrapporter kan inte tas bort (on delete restrict) — då är "Ny kod"
 * sättet att stänga av åtkomsten.
 */
export async function deleteStaff(staffId: string): Promise<FormState> {
  try {
    const { supabase, tenantId } = await requireSession();
    const { data, error } = await supabase
      .from("staff")
      .delete()
      .eq("id", staffId)
      .eq("tenant_id", tenantId)
      .select("name")
      .maybeSingle();
    if (error) {
      if (error.code === "23503") {
        return {
          error:
            "Personen har fältrapporter kopplade till sig och kan inte tas bort. Ge personen en ny kod i stället — då slutar den gamla fungera.",
          success: null,
        };
      }
      throw new Error("Kunde inte ta bort personen. Försök igen.");
    }
    if (!data) throw new Error("Personen finns inte längre.");
    revalidatePath(PROFILE_PATH);
    return { error: null, success: `${data.name} är borttagen.` };
  } catch (err) {
    return fail(err, "Kunde inte ta bort personen.");
  }
}

/* ---------------------------------------------------------------------- */
/* Förtroendereglaget                                                      */
/* ---------------------------------------------------------------------- */

export async function setTrustLevel(taskType: string, level: TrustLevel): Promise<FormState> {
  if (!(TRUST_TASK_TYPES as readonly string[]).includes(taskType)) {
    return { error: "Okänd uppgiftstyp.", success: null };
  }
  if (!TRUST_LEVELS.includes(level)) {
    return { error: "Okänd förtroendenivå.", success: null };
  }
  try {
    const { supabase, tenantId } = await requireSession();
    const { error } = await supabase
      .from("trust_settings")
      .upsert({ tenant_id: tenantId, task_type: taskType, level }, { onConflict: "tenant_id,task_type" });
    if (error) throw new Error("Kunde inte spara inställningen. Försök igen.");
    revalidatePath(PROFILE_PATH);
    return { error: null, success: "Sparat." };
  } catch (err) {
    return fail(err, "Kunde inte spara inställningen.");
  }
}
