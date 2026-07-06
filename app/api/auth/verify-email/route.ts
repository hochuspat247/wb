import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, verificationTokens } from "@/lib/db/schema";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token")?.trim() ?? "";
  const email = searchParams.get("email")?.trim().toLowerCase() ?? "";

  if (!token || !email) {
    return NextResponse.redirect(new URL("/login?error=verify", request.url));
  }

  const record = await db.query.verificationTokens.findFirst({
    where: eq(verificationTokens.identifier, `verify:${email}`)
  });

  if (!record || record.token !== token || record.expires < new Date()) {
    return NextResponse.redirect(new URL("/login?error=verify", request.url));
  }

  await db.update(users).set({ emailVerified: new Date() }).where(eq(users.email, email));
  await db.delete(verificationTokens).where(eq(verificationTokens.identifier, `verify:${email}`));

  return NextResponse.redirect(new URL("/cabinet?verified=1", request.url));
}
