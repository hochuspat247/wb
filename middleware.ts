import { NextResponse, type NextRequest } from "next/server";

const sessionCookieNames = [
  "authjs.session-token",
  "__Secure-authjs.session-token",
  "next-auth.session-token",
  "__Secure-next-auth.session-token"
];

export function middleware(request: NextRequest) {
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
  matcher: ["/cabinet/:path*", "/storystudio/cabinet/:path*"]
};
