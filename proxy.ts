// Root proxy — krävs av Next.js på denna nivå, kan inte ligga i app/.
// All faktisk logik lever i app/auth/lib/supabase/middleware.ts (Track 7).
import { type NextRequest } from "next/server";
import { updateSession } from "@/app/auth/lib/supabase/middleware";

export function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
