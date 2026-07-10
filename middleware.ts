import { NextResponse, type NextRequest } from "next/server";
import { isObviousAutomatedClient } from "@/lib/server/botProtection";

const sessionCookieNames = [
  "authjs.session-token",
  "__Secure-authjs.session-token",
  "next-auth.session-token",
  "__Secure-next-auth.session-token"
];

const protectedApiPostPaths = [
  "/api/generations/demo",
  "/api/auth/register",
  "/api/auth/forgot-password",
  "/api/auth/resend-verification",
  "/api/analytics",
  "/api/presence"
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (request.method === "POST" && protectedApiPostPaths.some((path) => pathname === path)) {
    if (isObviousAutomatedClient(request)) {
      return NextResponse.json({ error: "Forbidden", code: "BOT_DETECTED" }, { status: 403 });
    }
  }

  const isCabinetRoute =
    pathname.startsWith("/cabinet") ||
    pathname.startsWith("/storystudio/cabinet") ||
    pathname.startsWith("/kvartovid/cabinet");

  if (!isCabinetRoute) {
    return NextResponse.next();
  }

  const hasSessionCookie = sessionCookieNames.some((name) => request.cookies.has(name));

  if (!hasSessionCookie) {
    const registerUrl = new URL("/register", request.nextUrl.origin);
    const callback = `${request.nextUrl.pathname}${request.nextUrl.search}`;
    registerUrl.searchParams.set("callbackUrl", callback);
    return NextResponse.redirect(registerUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/cabinet/:path*", "/storystudio/cabinet/:path*", "/kvartovid/cabinet/:path*", "/api/:path*"]
};
