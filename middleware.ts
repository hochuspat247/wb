import { auth } from "@/auth";

export default auth((request) => {
  if (!request.auth) {
    const loginUrl = new URL("/login", request.nextUrl.origin);
    const callback = `${request.nextUrl.pathname}${request.nextUrl.search}`;
    loginUrl.searchParams.set("callbackUrl", callback);
    return Response.redirect(loginUrl);
  }
});

export const config = {
  matcher: ["/cabinet/:path*"]
};
