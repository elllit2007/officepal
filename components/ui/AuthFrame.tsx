import Link from "next/link";
import type { ReactNode } from "react";
import Kollegan from "@/components/Kollegan";
import type { KollegState } from "@/components/Kollegan";
import { cn } from "./cn";
import { Logo } from "./Logo";

/**
 * Ram för fristående sidor (inloggning, onboarding): centrerad smal kolumn
 * på canvas, Kollegan + logotyp överst, kort i mitten, valfri fotrad.
 */
export function AuthFrame({
  width = "narrow",
  kollegState = "idle",
  footer,
  children,
}: {
  width?: "narrow" | "wide";
  kollegState?: KollegState;
  footer?: ReactNode;
  children: ReactNode;
}) {
  return (
    <main className="flex flex-1 flex-col items-center px-4 py-10 sm:py-16">
      <div
        className={cn(
          "flex w-full flex-col items-center gap-8",
          width === "narrow" ? "max-w-[var(--layout-narrow-max)]" : "max-w-xl",
        )}
      >
        <div className="flex flex-col items-center gap-3">
          <Kollegan state={kollegState} size="small" />
          <Link href="/" className="rounded-md focus-visible:outline-none focus-visible:shadow-focus">
            <Logo size={28} />
          </Link>
        </div>
        <div className="w-full">{children}</div>
        {footer && <div className="text-center text-body-sm text-muted">{footer}</div>}
      </div>
    </main>
  );
}
