import { Suspense } from "react";
import FaltrapportForm from "./FaltrapportForm";

export const metadata = {
  title: "Fältrapport",
};

export default function FaltrapportPage() {
  return (
    <Suspense fallback={null}>
      <FaltrapportForm />
    </Suspense>
  );
}
