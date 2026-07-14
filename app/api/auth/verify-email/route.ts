import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, verificationTokens } from "@/lib/db/schema";
import { appUrl } from "@/lib/email";

function safeRelativeCallbackUrl(value?: string | null) {
  if (!value) return "/cabinet";
  const trimmed = value.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return "/cabinet";
  }
  return trimmed.slice(0, 500);
}

function redirectToLogin(query: string, callbackUrl?: string | null) {
  const params = new URLSearchParams(query);
  if (!params.has("callbackUrl")) {
    params.set("callbackUrl", safeRelativeCallbackUrl(callbackUrl));
  }
  return NextResponse.redirect(appUrl(`/login?${params.toString()}`));
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token")?.trim() ?? "";
  const email = searchParams.get("email")?.trim().toLowerCase() ?? "";

  if (!token || !email) {
    return redirectToLogin("error=verify");
  }

  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
    columns: {
      emailVerified: true,
      registrationCallbackUrl: true
    }
  });

  if (user?.emailVerified) {
    return redirectToLogin("verified=1", user.registrationCallbackUrl);
  }

  const record = await db.query.verificationTokens.findFirst({
    where: eq(verificationTokens.identifier, `verify:${email}`)
  });

  if (!record || record.token !== token || record.expires < new Date()) {
    return redirectToLogin("error=verify", user?.registrationCallbackUrl);
  }

  await db.update(users).set({ emailVerified: new Date() }).where(eq(users.email, email));
  await db.delete(verificationTokens).where(eq(verificationTokens.identifier, `verify:${email}`));

  return redirectToLogin("verified=1", user?.registrationCallbackUrl);
}
