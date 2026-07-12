import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { getEmailDomainError, normalizeEmail } from "@/lib/auth/email-validation";
import { rollbackRegisteredUser, sendVerificationEmail } from "@/lib/auth/send-verification-email";
import { applySignupContextOnRegister, parseSignupProduct } from "@/lib/server/signupContext";
import {
  botProtectionErrorResponse,
  enforceIpRateLimit,
  recordIpRateLimitAttempt,
  verifyAntiBotRequest
} from "@/lib/server/botProtection";

type RegisterBody = {
  name?: string;
  email?: string;
  password?: string;
  honeypot?: string;
  formStartedAt?: number;
  callbackUrl?: string;
  referrer?: string;
  fromDemo?: boolean;
  product?: string;
};

const ONE_HOUR_MS = 60 * 60 * 1000;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RegisterBody;

    const antiBot = await verifyAntiBotRequest(request, {
      honeypot: body.honeypot,
      formStartedAt: body.formStartedAt
    });

    if (!antiBot.ok) {
      return botProtectionErrorResponse(antiBot, 403);
    }

    const registerLimit = await enforceIpRateLimit(
      "register",
      request,
      ONE_HOUR_MS,
      Number.parseInt(process.env.REGISTER_IP_HOURLY_LIMIT || "5", 10) || 5
    );

    if (!registerLimit.allowed) {
      return botProtectionErrorResponse(registerLimit);
    }

    await recordIpRateLimitAttempt("register", request);

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
      generationCredits: 0,
      generationsUsed: 0,
      monthlyFreeUsed: 0,
      monthlyFreePeriodStart: new Date(),
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

    await applySignupContextOnRegister(email, {
      source: "email",
      callbackUrl: body.callbackUrl?.trim(),
      referrer: body.referrer?.trim(),
      fromDemo: Boolean(body.fromDemo),
      product: parseSignupProduct(body.product)
    });

    return NextResponse.json({
      ok: true,
      message: "Мы отправили письмо с подтверждением. Перейдите по ссылке из письма, затем войдите в аккаунт.",
      email
    });
  } catch {
    return NextResponse.json({ error: "Не удалось создать аккаунт." }, { status: 500 });
  }
}
