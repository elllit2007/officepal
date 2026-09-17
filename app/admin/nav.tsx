import type { NavItem } from "@/components/ui";
import {
  IconClock,
  IconFileText,
  IconHome,
  IconMic,
  IconReceipt,
  IconSettings,
  IconSpark,
} from "@/components/ui";

/** Huvudmenyn för admin-vyerna (delas av /admin och /admin/profile). */
export const ADMIN_NAV: NavItem[] = [
  { href: "/admin", label: "Översikt", icon: <IconHome /> },
  { href: "/admin#fakturautkast", label: "Fakturautkast", icon: <IconReceipt /> },
  { href: "/admin#offerter", label: "Offerter", icon: <IconFileText /> },
  { href: "/admin#faltrapporter", label: "Fältrapporter", icon: <IconMic /> },
  { href: "/admin/logg", label: "Beslutslogg", icon: <IconClock /> },
  { href: "/admin/profile", label: "Konto", icon: <IconSettings /> },
  { href: "/design", label: "Designsystem", icon: <IconSpark /> },
];
