import LogoutButton from "@/app/auth/components/LogoutButton";
import { AppShell, LoadingPresence, PageContainer } from "@/components/ui";
import { ADMIN_NAV } from "../nav";

/** Visas medan kontosidan hämtar tenant, personal och inställningar. */
export default function ProfileLoading() {
  return (
    <AppShell items={ADMIN_NAV} footer={<LogoutButton />}>
      <main className="flex-1">
        <PageContainer>
          <LoadingPresence label="Hämtar ditt konto …" />
        </PageContainer>
      </main>
    </AppShell>
  );
}
