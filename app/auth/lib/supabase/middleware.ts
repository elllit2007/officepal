// Track 7 (Auth & onboarding) — sessionshantering för repo-rotens proxy.ts.
//
// Anropas från repo-rotens proxy.ts på (nästan) varje request. Gör två
// saker:
//   1. Uppdaterar/förnyar Supabase-sessionscookien (krävs av @supabase/ssr,
//      annars går sessioner ut i webbläsaren trots giltig refresh-token).
//   2. Skyddar admin-sidor mot oinloggad åtkomst genom att redirecta till
//      /auth/login om ingen session finns.
//
// Fältpersonal (app/faltrapport/) autentiseras via staff.access_code, inte
// Supabase Auth (se supabase/SETUP.md) — de vägarna är därför alltid
// publika på middleware-nivå. Samma sak för /auth, /onboarding och /api
// (API-routes validerar sig själva, t.ex. mot access_code eller service-
// role, och ska inte tvinga fram en admin-session).

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATH_PREFIXES = ["/auth", "/onboarding", "/faltrapport", "/api"];

function isPublicPath(pathname: string): boolean {
  if (pathname === "/") return true;
  return PUBLIC_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // getUser() (inte getSession()) verifierar token mot Supabase Auth-
  // servern varje gång — nödvändigt i middleware, se Supabase-dokumentationen.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && !isPublicPath(request.nextUrl.pathname)) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return supabaseResponse;
}
