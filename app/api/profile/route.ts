import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { formatAccountEmail, isPlaceholderOAuthEmail, needsEmailVerification } from "@/lib/auth/email-utils";
import { getUserQuota } from "@/lib/server/quota";

export async function GET() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, userId)
  });

  if (!user) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    name: user.name || "Продавец",
    email: user.email,
    emailDisplay: formatAccountEmail(user.email),
    emailIsPlaceholder: isPlaceholderOAuthEmail(user.email),
    emailVerified: Boolean(user.emailVerified),
    needsEmailVerification: needsEmailVerification(user.email, user.emailVerified),
    joinedAt: user.createdAt,
    videoCredits: user.videoCredits,
    quota: await getUserQuota(userId)
  });
}

export async function PATCH(request: Request) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { name?: string };
  const name = body.name?.trim();

  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  await db.update(users).set({ name }).where(eq(users.id, userId));
  return NextResponse.json({ ok: true, name });
}
