"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { cn } from "./cn";
import { Logo } from "./Logo";

export interface NavItem {
  href: string;
  label: string;
  icon?: ReactNode;
  /** Matcha exakt (standard) eller som prefix. */
  match?: "exact" | "prefix";
}

function isActive(item: NavItem, pathname: string): boolean {
  // Ankarlänkar (/admin#offerter) markeras aldrig som aktiva — bara den
  // "riktiga" sidlänken.
  if (item.href.includes("#")) return false;
  return item.match === "prefix" ? pathname.startsWith(item.href) : pathname === item.href;
}

/**
 * Nav-länk i piller-form. Aktiv = blåtonad yta + navy text (Divident-stil,
 * ljus variant).
 */
export function NavLink({ item, className }: { item: NavItem; className?: string }) {
  const pathname = usePathname();
  const active = isActive(item, pathname);
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-full px-4 py-2.5 text-label transition-[background-color,color] duration-fast ease-out focus-visible:outline-none focus-visible:shadow-focus",
        active
          ? "bg-surface-brand text-primary-700 font-semibold"
          : "text-neutral-600 hover:bg-neutral-100 hover:text-ink",
        className,
      )}
    >
      {item.icon && <span className="shrink-0 opacity-90">{item.icon}</span>}
      <span className="truncate">{item.label}</span>
    </Link>
  );
}

export interface AppShellProps {
  items: NavItem[];
  /** Innehåll längst ner i sidopanelen (t.ex. Logga ut). */
  footer?: ReactNode;
  /** Innehåll till höger i toppraden på mobil. */
  topbarTrailing?: ReactNode;
  children: ReactNode;
}

/**
 * Applikationsskal: sidopanel på desktop, kompakt topprad med rullbar
 * nav på mobil. Innehållet får en max-bredd och luft från tokens.
 */
export function AppShell({ items, footer, topbarTrailing, children }: AppShellProps) {
  return (
    <div className="flex min-h-full flex-1 flex-col md:flex-row">
      {/* Sidopanel (desktop) */}
      <aside className="sticky top-0 hidden h-screen w-[var(--layout-sidebar-width)] shrink-0 flex-col border-r border-line bg-surface md:flex">
        <div className="flex h-[var(--layout-topbar-height)] items-center px-6">
          <Link href="/admin" className="rounded-md focus-visible:outline-none focus-visible:shadow-focus">
            <Logo />
          </Link>
        </div>
        <nav aria-label="Huvudmeny" className="flex flex-1 flex-col gap-1 px-3 pt-2">
          {items.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
        </nav>
        {footer && <div className="border-t border-line px-3 py-3">{footer}</div>}
      </aside>

      {/* Topprad (mobil) */}
      <header className="sticky top-0 z-20 border-b border-line bg-surface/95 backdrop-blur md:hidden">
        <div className="flex h-[var(--layout-topbar-height)] items-center justify-between px-4">
          <Link href="/admin" className="rounded-md focus-visible:outline-none focus-visible:shadow-focus">
            <Logo />
          </Link>
          <div className="flex items-center gap-2">{topbarTrailing ?? footer}</div>
        </div>
        <nav
          aria-label="Huvudmeny"
          className="flex gap-1 overflow-x-auto px-3 pb-3 [scrollbar-width:none]"
        >
          {items.map((item) => (
            <NavLink key={item.href} item={item} className="shrink-0 px-3.5 py-2" />
          ))}
        </nav>
      </header>

      <div className="flex min-w-0 flex-1 flex-col">{children}</div>
    </div>
  );
}

/** Standardyta för sidinnehåll: centrerad, max-bredd, sidmarginaler. */
export function PageContainer({
  narrow = false,
  className,
  children,
}: {
  narrow?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-4 py-8 sm:px-6 lg:px-8",
        narrow ? "max-w-[var(--layout-narrow-max)]" : "max-w-[var(--layout-content-max)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

/**
 * Sidhuvud: liten överrad (datum/kontext), stor rubrik, lugn underrad,
 * valfritt innehåll till höger (illustration, åtgärd).
 */
export function PageHeader({
  eyebrow,
  title,
  description,
  aside,
  className,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  aside?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("flex items-start justify-between gap-6", className)}>
      <div className="min-w-0">
        {eyebrow && <p className="mb-1 text-body-sm text-muted">{eyebrow}</p>}
        <h1 className="text-h1 sm:text-display">{title}</h1>
        {description && <p className="mt-2 text-body-lg text-muted">{description}</p>}
      </div>
      {aside && <div className="shrink-0">{aside}</div>}
    </header>
  );
}
