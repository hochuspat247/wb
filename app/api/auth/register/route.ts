import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { getEmailDomainError, normalizeEmail } from "@/lib/auth/email-validation";
import { rollbackRegisteredUser, sendVerificationEmail } from "@/lib/auth/send-verification-email";
import { FREE_TRIAL_CARDS } from "@/lib/pricing";

type RegisterBody = {
  name?: string;
  email?: string;
  password?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RegisterBody;
    const name = body.name?.trim() || "Продавец";
    const email = normalizeEmail(body.email ?? "");
    const password = body.password ?? "";

    const emailError = await getEmailDomainError(email);
    if (emailError) {
      return NextResponse.json({ error: emailError }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Пароль должен быть не короче 8 символов." }, { status: 400 });
    }

    const existing = await db.query.users.findFirst({
      where: eq(users.email, email)
    });

    if (existing) {
      return NextResponse.json({ error: "Аккаунт с таким email уже существует." }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await db.insert(users).values({
      email,
      name,
      passwordHash,
      generationCredits: FREE_TRIAL_CARDS,
      generationsUsed: 0,
      createdAt: new Date()
    });

    try {
      const { stub } = await sendVerificationEmail({ email, name });

      if (stub && process.env.NODE_ENV === "production") {
        await rollbackRegisteredUser(email);
        return NextResponse.json(
          {
            error:
              "Сейчас нельзя отправить письмо подтверждения. Попробуйте войти через Яндекс ID или повторите регистрацию позже."
          },
          { status: 503 }
        );
      }
    } catch {
      await rollbackRegisteredUser(email);
      return NextResponse.json(
        { error: "Не удалось отправить письмо подтверждения. Проверьте email и попробуйте снова." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Мы отправили письмо с подтверждением. Перейдите по ссылке из письма, затем войдите в аккаунт.",
      email
    });
  } catch {
    return NextResponse.json({ error: "Не удалось создать аккаунт." }, { status: 500 });
  }
}
