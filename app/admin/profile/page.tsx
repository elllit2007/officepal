import { redirect } from "next/navigation";
import { createClient } from "@/app/auth/lib/supabase/server";
import LogoutButton from "@/app/auth/components/LogoutButton";
import type { Staff, Tenant, TrustSetting } from "@/lib/types";
import {
  Alert,
  AppShell,
  Badge,
  Card,
  PageContainer,
  PageHeader,
  SectionHeading,
} from "@/components/ui";
import { ADMIN_NAV } from "../nav";
import CompanyForm from "./components/CompanyForm";
import { EmailForm, PasswordForm } from "./components/AccountForms";
import TrustDial from "./components/TrustDial";
import StaffManager from "./components/StaffManager";

export const metadata = {
  title: "Konto",
};

function formatDate(iso: string | null | undefined) {
  if (!iso) return "–";
  return new Intl.DateTimeFormat("sv-SE", { dateStyle: "long" }).format(new Date(iso));
}

function formatDateTime(iso: string | null | undefined) {
  if (!iso) return "–";
  return new Intl.DateTimeFormat("sv-SE", { dateStyle: "medium", timeStyle: "short" }).format(
    new Date(iso),
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
      <dt className="text-body-sm text-muted">{label}</dt>
      <dd className="text-body text-ink sm:text-right">{value}</dd>
    </div>
  );
}

/**
 * Konto och inställningar. Server Component: läser via cookie-sessionen så
 * att RLS scopar allt mot inloggad tenant. Skrivningar sker i actions.ts.
 */
export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/admin/profile");

  const tenantId =
    typeof user.app_metadata?.tenant_id === "string" ? user.app_metadata.tenant_id : null;

  let tenant: Tenant | null = null;
  let staff: Staff[] = [];
  let trustSettings: TrustSetting[] = [];
  let loadError: string | null = null;

  if (tenantId) {
    const [tenantRes, staffRes, trustRes] = await Promise.all([
      supabase.from("tenants").select("*").eq("id", tenantId).maybeSingle(),
      supabase.from("staff").select("*").eq("tenant_id", tenantId).order("created_at", { ascending: true }),
      supabase.from("trust_settings").select("*").eq("tenant_id", tenantId),
    ]);
    tenant = tenantRes.data ?? null;
    staff = staffRes.data ?? [];
    trustSettings = trustRes.data ?? [];
    loadError = tenantRes.error?.message ?? staffRes.error?.message ?? trustRes.error?.message ?? null;
  }

  // Plan finns inte i schemat (se anteckning i commit/NOTES). Läser
  // tenants.settings.plan om orchestratorn/ett framtida track sätter den,
  // annars visas piloten.
  const settings = (tenant?.settings ?? {}) as Record<string, unknown>;
  const plan = typeof settings.plan === "string" ? settings.plan : "Pilot";

  return (
    <AppShell items={ADMIN_NAV} footer={<LogoutButton />}>
      <main className="flex-1">
        <PageContainer className="flex flex-col gap-10">
          <PageHeader
            eyebrow="Konto och inställningar"
            title={tenant?.name ?? "Ditt konto"}
            description="Företaget, din inloggning, förtroendereglaget och personalen i fält."
          />

          {!tenantId && (
            <Alert tone="danger" title="Kontot saknar företag">
              Din användare har ingen tenant_id i app_metadata, så inget kan visas. Kontakta
              den som satte upp kontot.
            </Alert>
          )}
          {loadError && (
            <Alert tone="danger" title="Kunde inte hämta allt">
              {loadError}
            </Alert>
          )}

          {/* ---- Företaget ------------------------------------------- */}
          <section className="flex flex-col gap-4">
            <SectionHeading
              id="foretaget"
              title="Företaget"
              description="Namn, plan och när ni kom igång."
            />
            <div className="grid gap-5 lg:grid-cols-[3fr_2fr]">
              <Card>
                <CompanyForm name={tenant?.name ?? ""} />
              </Card>
              <Card tone="muted">
                <dl className="divide-y divide-line">
                  <InfoRow
                    label="Plan"
                    value={
                      <Badge tone="brand" size="sm">
                        {plan}
                      </Badge>
                    }
                  />
                  <InfoRow label="Kund sedan" value={formatDate(tenant?.created_at)} />
                  <InfoRow
                    label="Företags-id"
                    value={
                      <span className="font-mono text-caption text-muted">{tenantId ?? "–"}</span>
                    }
                  />
                </dl>
              </Card>
            </div>
          </section>

          {/* ---- Ditt konto ------------------------------------------ */}
          <section className="flex flex-col gap-4">
            <SectionHeading
              id="konto"
              title="Ditt konto"
              description={`Inloggad som ${user.email ?? "okänd"}.`}
            />
            <div className="grid gap-5 lg:grid-cols-2">
              <Card className="flex flex-col gap-6">
                <EmailForm email={user.email ?? ""} />
                <dl className="divide-y divide-line border-t border-line pt-4">
                  <InfoRow label="Konto skapat" value={formatDate(user.created_at)} />
                  <InfoRow label="Senast inloggad" value={formatDateTime(user.last_sign_in_at)} />
                </dl>
              </Card>
              <Card>
                <PasswordForm />
              </Card>
            </div>
          </section>

          {/* ---- Förtroendereglaget ---------------------------------- */}
          <section className="flex flex-col gap-4">
            <SectionHeading
              id="fortroende"
              title="Förtroendereglaget"
              description="Hur mycket Kollegan får göra på egen hand, per uppgiftstyp."
            />
            <Card>
              <TrustDial settings={trustSettings} />
            </Card>
          </section>

          {/* ---- Fältpersonal ---------------------------------------- */}
          <section className="flex flex-col gap-4">
            <SectionHeading
              id="personal"
              title="Fältpersonal"
              description="Vilka som kan rapportera, och deras koder."
              action={
                staff.length > 0 && (
                  <Badge tone="neutral">
                    {staff.length} {staff.length === 1 ? "person" : "personer"}
                  </Badge>
                )
              }
            />
            <Card>
              <StaffManager staff={staff} />
            </Card>
          </section>
        </PageContainer>
      </main>
    </AppShell>
  );
}
