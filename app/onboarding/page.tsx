import OnboardingForm from "./OnboardingForm";

export const metadata = {
  title: "Kom igång — OfficePal",
};

export default function OnboardingPage() {
  return (
    <main className="mx-auto flex min-h-full w-full max-w-md flex-col justify-center px-4 py-16">
      <OnboardingForm />
    </main>
  );
}
