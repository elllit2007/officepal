import { Suspense } from "react";
import Kollegan from "@/components/Kollegan";
import FaltrapportForm from "./FaltrapportForm";

export const metadata = {
  title: "Fältrapport",
};

// Samma rubrik-del som formuläret, så att sidan inte blinkar till tom
// medan useSearchParams() i FaltrapportForm suspenderar under hydrering.
function FaltrapportFallback() {
  return (
    <main
      aria-busy="true"
      className="min-h-screen flex flex-col gap-6 p-6 bg-white max-w-md mx-auto w-full"
    >
      <header className="flex flex-col items-center gap-2 pt-4">
        <Kollegan state="idle" size="large" />
        <h1 className="text-2xl font-bold text-[#1E3A8A] text-center">Fältrapport</h1>
        <p className="text-base text-neutral-500 text-center">Laddar…</p>
      </header>
      <div aria-hidden="true" className="flex animate-pulse flex-col gap-5">
        <div className="h-16 rounded-2xl bg-[#DBEAFE]/60" />
        <div className="h-48 rounded-2xl bg-[#DBEAFE]/60" />
        <div className="h-16 rounded-2xl bg-[#DBEAFE]/60" />
      </div>
    </main>
  );
}

export default function FaltrapportPage() {
  return (
    <Suspense fallback={<FaltrapportFallback />}>
      <FaltrapportForm />
    </Suspense>
  );
}
