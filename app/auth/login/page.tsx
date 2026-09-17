import Link from "next/link";
import LoginForm from "./LoginForm";
import { AuthFrame, Card } from "@/components/ui";

export const metadata = {
  title: "Logga in",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <AuthFrame
      footer={
        <>
          Ny hos OfficePal?{" "}
          <Link href="/onboarding" className="text-link underline-offset-2 hover:underline">
            Skapa konto
          </Link>
        </>
      }
    >
      <Card padding="lg" className="flex flex-col gap-6">
        <div>
          <h1 className="text-h2">Logga in</h1>
          <p className="mt-1 text-body-sm text-muted">
            Med det admin-konto som skapades när ni kom igång.
          </p>
        </div>
        <LoginForm next={next && next.startsWith("/") ? next : "/"} />
      </Card>
    </AuthFrame>
  );
}
