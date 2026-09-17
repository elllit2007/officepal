import LoginForm from "./LoginForm";

export const metadata = {
  title: "Logga in — OfficePal",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <main className="mx-auto flex min-h-full w-full max-w-sm flex-col justify-center gap-6 px-4 py-16">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold">Logga in</h1>
        <p className="text-sm text-black/60">
          Logga in med det admin-konto som skapades vid onboarding.
        </p>
      </div>

      <LoginForm next={next && next.startsWith("/") ? next : "/"} />
    </main>
  );
}
