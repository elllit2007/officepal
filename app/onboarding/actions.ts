"use server";

import { createAdminClient } from "@/app/auth/lib/supabase/admin";
import { generateAccessCode } from "@/app/onboarding/lib/access-code";

export type OnboardingResult = {
  name: string;
  access_code: string;
};

export type OnboardingState = {
  error: string | null;
  success: { tenantName: string; staff: OnboardingResult[] } | null;
};

export async function createTenant(
  _prevState: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  const companyName = String(formData.get("companyName") ?? "").trim();
  const adminEmail = String(formData.get("adminEmail") ?? "").trim();
  const adminPassword = String(formData.get("adminPassword") ?? "");
  const staffNames = formData
    .getAll("staffName")
    .map((v) => String(v).trim())
    .filter((name) => name.length > 0);

  if (!companyName) {
    return { error: "Ange företagsnamn.", success: null };
  }
  if (!adminEmail || !adminPassword) {
    return {
      error: "Ange e-post och lösenord för admin-kontot.",
      success: null,
    };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail)) {
    return { error: "Ange en giltig e-postadress.", success: null };
  }
  if (adminPassword.length < 8) {
    return { error: "Lösenordet måste vara minst 8 tecken.", success: null };
  }

  let admin: ReturnType<typeof createAdminClient>;
  try {
    admin = createAdminClient();
  } catch (err) {
    console.error(err);
    return {
      error: "Servern är inte rätt konfigurerad. Kontakta support.",
      success: null,
    };
  }

  const { data: tenant, error: tenantError } = await admin
    .from("tenants")
    .insert({ name: companyName, settings: {} })
    .select()
    .single();

  if (tenantError || !tenant) {
    return {
      error: "Kunde inte skapa företaget. Försök igen.",
      success: null,
    };
  }

  const { error: userError } = await admin.auth.admin.createUser({
    email: adminEmail,
    password: adminPassword,
    email_confirm: true,
    app_metadata: { tenant_id: tenant.id },
  });

  if (userError) {
    // Rensa bort tenanten så att formuläret kan skickas in igen utan att
    // lämna en övergiven, tom tenant bakom sig.
    await admin.from("tenants").delete().eq("id", tenant.id);

    const message = userError.message.toLowerCase().includes("already")
      ? "E-postadressen används redan av ett annat konto."
      : "Kunde inte skapa admin-kontot. Försök igen.";
    return { error: message, success: null };
  }

  const usedCodes = new Set<string>();
  const staffRows = staffNames.map((name) => {
    let code = generateAccessCode();
    while (usedCodes.has(code)) {
      code = generateAccessCode();
    }
    usedCodes.add(code);
    return { tenant_id: tenant.id, name, access_code: code };
  });

  let insertedStaff: OnboardingResult[] = [];
  if (staffRows.length > 0) {
    const { data: staffData, error: staffError } = await admin
      .from("staff")
      .insert(staffRows)
      .select("name, access_code");

    if (staffError) {
      return {
        error:
          "Företaget och admin-kontot skapades, men personalkoderna kunde inte sparas. Logga in och försök lägga till personal igen.",
        success: null,
      };
    }
    insertedStaff = staffData ?? [];
  }

  return {
    error: null,
    success: { tenantName: tenant.name, staff: insertedStaff },
  };
}
