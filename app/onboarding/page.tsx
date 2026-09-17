import Link from "next/link";
import OnboardingForm from "./OnboardingForm";
import { AuthFrame } from "@/components/ui";

export const metadata = {
  title: "Kom igång",
};

export default function OnboardingPage() {
  return (
    <AuthFrame
      width="wide"
      footer={
        <>
          Har ni redan ett konto?{" "}
          <Link href="/auth/login" className="text-link underline-offset-2 hover:underline">
            Logga in
          </Link>
        </>
      }
    >
      <OnboardingForm />
    </AuthFrame>
  );
}
