"use client";

import { signOut } from "@/app/auth/actions";
import { Button, IconLogOut } from "@/components/ui";

export default function LogoutButton({ className }: { className?: string }) {
  return (
    <form action={signOut} className={className}>
      <Button
        type="submit"
        variant="ghost"
        size="sm"
        iconLeft={<IconLogOut size={18} />}
        className="w-full justify-start text-neutral-600 hover:text-ink"
      >
        Logga ut
      </Button>
    </form>
  );
}
