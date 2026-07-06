import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { and, eq, gt } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, verificationTokens } from "@/lib/db/schema";

type ResetPasswordBody = {
  email?: string;
  token?: string;
  password?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ResetPasswordBody;
    const email = body.email?.trim().toLowerCase() ?? "";
    const token = body.token?.trim() ?? "";
    const password = body.password ?? "";

    if (!email || !token || password.length < 8) {
      return NextResponse.json({ error: "Проверьте email, токен и пароль (минимум 8 символов)." }, { status: 400 });
    }

    const record = await db.query.verificationTokens.findFirst({
      where: and(
        eq(verificationTokens.identifier, `reset:${email}`),
        eq(verificationTokens.token, token),
        gt(verificationTokens.expires, new Date())
      )
    });

    if (!record) {
      return NextResponse.json({ error: "Ссылка недействительна или устарела." }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await db.update(users).set({ passwordHash }).where(eq(users.email, email));
    await db.delete(verificationTokens).where(eq(verificationTokens.identifier, `reset:${email}`));

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Не удалось обновить пароль." }, { status: 500 });
  }
}
