"use client";

import { signOut } from "@/app/auth/actions";

export default function LogoutButton() {
  return (
    <form action={signOut}>
      <button
        type="submit"
        className="text-sm text-black/60 underline hover:text-black"
      >
        Logga ut
      </button>
    </form>
  );
}
