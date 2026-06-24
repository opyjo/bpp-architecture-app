// Next.js 16 renamed `middleware.ts` -> `proxy.ts` (function `middleware` -> `proxy`).
// This runs on every matched request before the route renders and gates the
// whole app behind a shared password. See src/lib/auth.ts for the token logic.
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";

// Paths reachable without a session: the login screen and its API endpoints.
const PUBLIC_PATHS = new Set<string>(["/login", "/api/login", "/api/logout"]);

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (PUBLIC_PATHS.has(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (await verifySessionToken(token)) {
    return NextResponse.next();
  }

  // Unauthenticated. API calls get a clean 401 (so the AI routes aren't open);
  // page navigations are redirected to the login screen.
  if (pathname.startsWith("/api/")) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", pathname + search);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  // Run on everything EXCEPT Next internals, static assets, and public metadata
  // routes — otherwise the login page's own CSS/JS/icons would be blocked.
  // Note: `/api/*` is intentionally NOT excluded so API routes stay protected.
  matcher: [
    "/((?!_next/static|_next/image|_next/data|favicon.ico|icon|apple-icon|manifest.webmanifest|robots.txt|sitemap.xml).*)",
  ],
};
